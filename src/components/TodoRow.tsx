"use client";
import Link from "next/link";
import type { Action, Problem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/dates";

export default function TodoRow({ p, a, showFrom, idPrefix = "td" }: { p: Problem; a: Action; showFrom?: boolean; idPrefix?: string }) {
  const { edit } = useStore();
  const over = !!a.due && !a.done && a.due < todayStr();
  const cid = `${idPrefix}-${a.id}`;
  const set = (fn: (x: Action) => void) =>
    edit(p.id, (q) => {
      const x = q.actions.find((y) => y.id === a.id);
      if (x) fn(x);
    });
  return (
    <div className={"todo" + (a.done ? " done" : "")}>
      <input type="checkbox" id={cid} checked={!!a.done} aria-label="完了" onChange={(e) => { const v = e.target.checked; set((x) => { x.done = v; }); }} />
      <div style={{ minWidth: 0 }}>
        <label className="tx" htmlFor={cid}>{a.text}</label>
        <div className="sub">
          <span className={"due" + (over ? " over" : "")}>{over ? "期限切れ" : "期限"}</span>
          <input type="date" aria-label="期限" value={a.due || ""} onChange={(e) => { const v = e.target.value; set((x) => { x.due = v; }); }} />
          {showFrom && <Link className="from" href={`/p/${p.id}`}>{p.title}</Link>}
        </div>
      </div>
    </div>
  );
}
