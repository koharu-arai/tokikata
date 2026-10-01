"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { todos } from "@/lib/core";
import TodoRow from "./TodoRow";

export default function TodoView() {
  const { list } = useStore();
  const [showDone, setShowDone] = useState(false);
  const groups = list.filter((p) => p.status !== "solved" && todos(p).length);
  let total = 0;
  let done = 0;
  for (const p of groups) for (const a of todos(p)) { total++; if (a.done) done++; }

  return (
    <>
      <div className="hero">
        <p className="eyebrow">TODO</p>
        <h1 className="h1">やることリスト</h1>
        <p className="small muted">各問題の「打ち手を決める」（企画コースは「具体的な作戦にする」）で4マスに置いた行動が集まります。</p>
      </div>

      {!total ? (
        <section className="empty">
          <p className="h2">TODOはまだありません</p>
          <p className="small muted">問題を開いて、行動を4マスの「まずやる」「計画してやる」「すきま時間に」のどれかに置くと、ここに並びます。</p>
          <Link className="btn sm" href="/" style={{ justifySelf: "start" }}>問題リストへ</Link>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="sec-h">
              <p className="h2">残り {total - done} 件</p>
              <label className="ck small">
                <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />完了も表示
              </label>
            </div>
            <div className="bar"><i style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
          </section>
          {groups.map((p) => {
            const ts = todos(p)
              .filter((a) => showDone || !a.done)
              .sort((x, y) => Number(x.done) - Number(y.done) || (x.due || "9999").localeCompare(y.due || "9999"));
            if (!ts.length) return null;
            return (
              <section className="card" key={p.id}>
                <Link className="grp" href={`/p/${p.id}`}>{p.title} ›</Link>
                <div className="acts">{ts.map((a) => <TodoRow key={a.id} p={p} a={a} idPrefix="tdl" />)}</div>
              </section>
            );
          })}
        </>
      )}
    </>
  );
}
