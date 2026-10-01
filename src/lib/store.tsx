"use client";
// 問題データの読み書き。Supabase にログインしていればクラウド、そうでなければこの端末（localStorage）に保存します。
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Problem } from "./types";
import { getSupabase } from "./supabase";
import { sortedList } from "./logic";

export type Mode = "loading" | "local" | "cloud" | "signedout";
type SyncState = { text: string; cls: "" | "ok" | "err" };

interface StoreValue {
  mode: Mode;
  problems: Record<string, Problem>;
  list: Problem[];
  sync: SyncState;
  email: string | null;
  supabaseReady: boolean;
  hintEnabled: boolean;
  /** 端末に残っている問題の数（ログイン後にクラウドへ移せる） */
  localCount: number;
  /** 問題をコピーして fn で書き換え、保存する */
  edit: (id: string, fn: (p: Problem) => void) => void;
  add: (p: Problem) => void;
  remove: (id: string) => void;
  startGuest: () => void;
  signOut: () => Promise<void>;
  migrateLocal: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const LS_KEY = "tokikata-local-v1";
const GUEST_KEY = "tokikata-guest";

function readLocal(): Record<string, Problem> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function writeLocal(problems: Record<string, Problem>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(problems));
  } catch {
    /* 保存領域がいっぱい・プライベートモードなど */
  }
}

const StoreCtx = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore は StoreProvider の中で使ってください");
  return v;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [mode, setMode] = useState<Mode>("loading");
  const [problems, setProblems] = useState<Record<string, Problem>>({});
  const [sync, setSync] = useState<SyncState>({ text: "読み込み中", cls: "" });
  const [email, setEmail] = useState<string | null>(null);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  const problemsRef = useRef(problems);
  const modeRef = useRef<Mode>(mode);
  const userIdRef = useRef<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, boolean>>({});

  const setAll = useCallback((next: Record<string, Problem>) => {
    problemsRef.current = next;
    setProblems(next);
  }, []);
  const setModeBoth = useCallback((m: Mode) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  const startLocal = useCallback(() => {
    setAll(readLocal());
    setModeBoth("local");
    setSync({ text: "この端末に保存", cls: "ok" });
  }, [setAll, setModeBoth]);

  const loadCloud = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("tokikata_problems").select("id, data");
    if (error) {
      setSync({ text: "読み込めませんでした", cls: "err" });
      return;
    }
    const next: Record<string, Problem> = {};
    for (const row of data ?? []) {
      // 保存待ちの問題は手元の内容を優先
      next[row.id as string] = pending.current[row.id as string] ? problemsRef.current[row.id as string] : (row.data as Problem);
    }
    setAll(next);
    setModeBoth("cloud");
    setSync({ text: "クラウドに保存", cls: "ok" });
    setLocalCount(Object.keys(readLocal()).length);
  }, [supabase, setAll, setModeBoth]);

  // 起動：Supabase の設定とログイン状態で保存先を決める
  useEffect(() => {
    fetch("/api/hint")
      .then((r) => r.json())
      .then((j: { enabled?: boolean }) => setHintEnabled(!!j.enabled))
      .catch(() => setHintEnabled(false));

    if (!supabase) {
      startLocal();
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const s = data.session;
      if (s) {
        userIdRef.current = s.user.id;
        setEmail(s.user.email ?? null);
        void loadCloud();
      } else if (localStorage.getItem(GUEST_KEY) === "1") {
        startLocal();
      } else {
        setModeBoth("signedout");
        setSync({ text: "未ログイン", cls: "" });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const changed = userIdRef.current !== session.user.id;
        userIdRef.current = session.user.id;
        setEmail(session.user.email ?? null);
        if (changed || modeRef.current !== "cloud") void loadCloud();
      }
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        setEmail(null);
        setAll({});
        setModeBoth("signedout");
        setSync({ text: "未ログイン", cls: "" });
      }
    });
    // 別の端末で書いた内容を、アプリに戻ってきたときに読み直す
    const onVisible = () => {
      if (document.visibilityState === "visible" && modeRef.current === "cloud") void loadCloud();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supabase, loadCloud, startLocal, setAll, setModeBoth]);

  const flush = useCallback(
    async (id: string) => {
      const p = problemsRef.current[id];
      if (modeRef.current === "local") {
        writeLocal(problemsRef.current);
        pending.current[id] = false;
        return;
      }
      if (modeRef.current !== "cloud" || !supabase || !p || !userIdRef.current) return;
      const { error } = await supabase
        .from("tokikata_problems")
        .upsert({ id, user_id: userIdRef.current, data: p, updated_at: new Date(p.updatedAt).toISOString() });
      pending.current[id] = false;
      setSync(error ? { text: "保存できませんでした", cls: "err" } : { text: "クラウドに保存済み", cls: "ok" });
    },
    [supabase],
  );

  const schedule = useCallback(
    (id: string) => {
      pending.current[id] = true;
      if (modeRef.current === "cloud") setSync({ text: "保存中…", cls: "" });
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => void flush(id), 700);
    },
    [flush],
  );

  const add = useCallback(
    (p: Problem) => {
      setAll({ ...problemsRef.current, [p.id]: p });
      schedule(p.id);
    },
    [setAll, schedule],
  );

  const edit = useCallback(
    (id: string, fn: (p: Problem) => void) => {
      const cur = problemsRef.current[id];
      if (!cur) return;
      const copy: Problem = JSON.parse(JSON.stringify(cur));
      fn(copy);
      copy.updatedAt = Date.now();
      setAll({ ...problemsRef.current, [id]: copy });
      schedule(id);
    },
    [setAll, schedule],
  );

  const remove = useCallback(
    (id: string) => {
      const next = { ...problemsRef.current };
      delete next[id];
      clearTimeout(timers.current[id]);
      pending.current[id] = false;
      setAll(next);
      if (modeRef.current === "local") writeLocal(next);
      else if (supabase)
        void supabase.from("tokikata_problems").delete().eq("id", id).then(({ error }) => {
          if (error) setSync({ text: "削除できませんでした", cls: "err" });
        });
    },
    [setAll, supabase],
  );

  const startGuest = useCallback(() => {
    try {
      localStorage.setItem(GUEST_KEY, "1");
    } catch {
      /* noop */
    }
    startLocal();
  }, [startLocal]);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem(GUEST_KEY);
    } catch {
      /* noop */
    }
    if (supabase && modeRef.current === "cloud") await supabase.auth.signOut();
    else {
      setAll({});
      setModeBoth(supabase ? "signedout" : "local");
      if (!supabase) startLocal();
    }
  }, [supabase, setAll, setModeBoth, startLocal]);

  const migrateLocal = useCallback(async () => {
    if (!supabase || !userIdRef.current) return;
    const local = readLocal();
    const rows = Object.values(local).map((p) => ({ id: p.id, user_id: userIdRef.current as string, data: p, updated_at: new Date(p.updatedAt || Date.now()).toISOString() }));
    if (!rows.length) return;
    setSync({ text: "移しています…", cls: "" });
    const { error } = await supabase.from("tokikata_problems").upsert(rows);
    if (error) {
      setSync({ text: "移せませんでした", cls: "err" });
      return;
    }
    writeLocal({});
    setLocalCount(0);
    await loadCloud();
  }, [supabase, loadCloud]);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const value = useMemo<StoreValue>(
    () => ({
      mode, problems, list: sortedList(problems), sync, email, supabaseReady: !!supabase, hintEnabled, localCount,
      edit, add, remove, startGuest, signOut, migrateLocal, getToken,
    }),
    [mode, problems, sync, email, supabase, hintEnabled, localCount, edit, add, remove, startGuest, signOut, migrateLocal, getToken],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
