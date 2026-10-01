"use client";
// ログイン：1.01 と同じ「名前＋PIN」。同じ Supabase プロジェクトなので、1.01 のアカウントでそのまま入れます。
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { pinToPassword, toLoginEmail } from "@/lib/username";

export default function AuthView() {
  const { startGuest, supabaseReady } = useStore();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (!name.trim() || !/^[0-9]{4,8}$/.test(pin.trim())) {
      setMsg("名前と、4〜8桁の数字のPINを入れてください");
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: toLoginEmail(name), password: pinToPassword(pin) });
    if (error) setMsg("ログインできませんでした。名前とPINを確かめてください。");
    setBusy(false);
  };

  return (
    <section className="card">
      <p className="eyebrow">ようこそ</p>
      <h1 className="h1">トキカタにログイン</h1>
      <p className="small muted">1.01 と同じ名前とPINで入れます。ログインすると、スマホとパソコンで同じ問題リストを使えます。</p>

      {supabaseReady ? (
        <>
          <div className="field">
            <label htmlFor="au-name">名前</label>
            <input className="inp" id="au-name" autoComplete="username" autoCapitalize="none" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="au-pin">PIN（4〜8桁の数字）</label>
            <input className="inp" id="au-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin}
              onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void submit(); }} />
          </div>
          {msg && <p className="need">{msg}</p>}
          <button type="button" className="btn wide" disabled={busy} onClick={() => void submit()}>
            {busy ? "少し待ってください…" : "ログイン"}
          </button>
        </>
      ) : (
        <p className="small">Supabase がまだ設定されていないので、この端末に保存するモードで使えます。</p>
      )}

      <button type="button" className="btn wide ghost" onClick={startGuest}>ログインせずに使う（この端末に保存）</button>
    </section>
  );
}
