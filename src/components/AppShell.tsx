"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { todos } from "@/lib/core";
import { displayName } from "@/lib/username";

const TABS = [
  { href: "/", label: "問題", icon: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" /> },
  { href: "/calendar", label: "カレンダー", icon: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></> },
  { href: "/todo", label: "TODO", icon: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></> },
  { href: "/learn", label: "学ぶ", icon: <path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" /> },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { mode, sync, list, email, supabaseReady, signOut } = useStore();
  const path = usePathname() || "/";
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const inProblem = path.startsWith("/p/");
  const inLogin = path.startsWith("/login");

  useEffect(() => {
    if (mode === "signedout" && !inLogin) router.replace("/login");
    if (mode === "cloud" && inLogin) router.replace("/");
  }, [mode, inLogin, router]);

  const openTodos = list
    .filter((p) => p.status !== "solved")
    .reduce((n, p) => n + todos(p).filter((a) => !a.done).length, 0);

  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/new") || inProblem : path.startsWith(href));

  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link href="/" className="brand">
            <span className="logo">トキ<i>カタ</i></span>
            <span className="tagline">フレームワークで、問題を1段ずつ解く</span>
          </Link>
          <span className={"sync" + (sync.cls ? " " + sync.cls : "")}>{sync.text}</span>
          {(mode === "cloud" || (mode === "local" && supabaseReady)) && (
            <div className="acct">
              <button type="button" className="acct-btn" aria-label="アカウント" aria-expanded={menu} onClick={() => setMenu(!menu)}>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.7 4.1-5.6 7.5-5.6s6.3 1.9 7.5 5.6" /></svg>
              </button>
              {menu && (
                <div className="menu-in" role="menu">
                  {mode === "cloud" ? (
                    <>
                      <p className="small muted">ログイン中</p>
                      <p className="small" style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{displayName(email)}</p>
                      <button type="button" className="btn sm line wide" onClick={() => { setMenu(false); void signOut(); }}>ログアウト</button>
                    </>
                  ) : (
                    <>
                      <p className="small">この端末だけに保存しています。ログインすると、スマホとパソコンで同じ内容を使えます。</p>
                      <Link className="btn sm wide" href="/login" onClick={() => setMenu(false)}>ログインする</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="view">
        {mode === "loading" ? (
          <section className="empty">
            <p className="h2">問題リストを読み込んでいます</p>
            <p className="small muted">ここに、取り組み中の問題と「次にやる段階」が並びます。</p>
          </section>
        ) : (
          children
        )}
      </main>

      {!inProblem && !inLogin && mode !== "loading" && (
        <nav className="tabs" aria-label="メニュー">
          <div className="tabs-in">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} aria-current={isActive(t.href) ? "page" : undefined}>
                <span className="ic">
                  <svg viewBox="0 0 24 24">{t.icon}</svg>
                  {t.href === "/todo" && openTodos > 0 && <span className="badge">{openTodos}</span>}
                </span>
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
