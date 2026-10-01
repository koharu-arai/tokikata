"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { calItems, TYPE_LABEL, type CalItem, type CalType } from "@/lib/logic";
import { addDays, mdLabel, todayStr, WD, ymd } from "@/lib/dates";
import { uid } from "@/lib/core";

function AgendaRow({ x, prefix }: { x: CalItem; prefix: string }) {
  const { edit } = useStore();
  const cls = `ag t-${x.type}` + (x.done ? " dn" : "");
  return (
    <div className={cls}>
      {x.type === "todo" && x.a ? (
        <input type="checkbox" aria-label="完了" checked={!!x.done} id={`${prefix}-${x.key}`}
          onChange={(e) => { const v = e.target.checked; const aid = x.a!.id; edit(x.p.id, (q) => { const a = q.actions.find((y) => y.id === aid); if (a) a.done = v; }); }} />
      ) : (
        <span className="ty">{TYPE_LABEL[x.type]}</span>
      )}
      <div className="tx">
        {x.type === "todo" && <span className="ty" style={{ display: "block" }}>TODO</span>}
        {x.text}
        <Link className="pn" href={`/p/${x.p.id}`}>{x.p.title}</Link>
      </div>
      {x.type === "event" && x.ev ? (
        <button type="button" className="x" aria-label="予定を削除"
          onClick={() => { const eid = x.ev!.id; edit(x.p.id, (q) => { q.events = q.events.filter((y) => y.id !== eid); }); }}>×</button>
      ) : (x.type === "step" || x.type === "review") && !x.done ? (
        <Link className="btn sm ghost" href={`/p/${x.p.id}?step=${x.sid}`}>開く</Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export default function CalendarView() {
  const { list, edit } = useStore();
  const today = todayStr();
  const [sel, setSel] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [pid, setPid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1;
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const off = first.getDay();
  const rows = Math.ceil((off + days) / 7);

  const items = calItems(list);
  const by: Record<string, CalItem[]> = {};
  for (const x of items) (by[x.date] ??= []).push(x);

  const moveMonth = (d: number) => setMonth(ymd(new Date(y, m + d, 1)).slice(0, 7));
  const pick = (ds: string) => { setSel(ds); if (ds.slice(0, 7) !== month) setMonth(ds.slice(0, 7)); setErr(null); };

  const active = list.filter((p) => p.status !== "solved");
  const pidSel = pid && active.some((p) => p.id === pid) ? pid : active[0]?.id ?? null;

  const addEvent = () => {
    const t = title.trim();
    if (!t || !pidSel) { setErr("予定の内容を入れてください"); return; }
    edit(pidSel, (q) => { q.events = [...(q.events ?? []), { id: uid(), title: t, date: sel, time }]; });
    setTitle(""); setTime(""); setErr(null);
  };

  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const d = new Date(y, m, 1 - off + i);
    const ds = ymd(d);
    const its = by[ds] ?? [];
    const cls = "cd" + (d.getMonth() !== m ? " out" : "") + (ds === today ? " today" : "") + (ds === sel ? " sel" : "");
    return (
      <button type="button" key={ds} className={cls} onClick={() => pick(ds)} aria-label={`${d.getMonth() + 1}月${d.getDate()}日 ${its.length}件`}>
        <span className="dn2">{d.getDate()}</span>
        <span className="dots">{its.slice(0, 5).map((x) => <i key={x.key} className={`dot t-${x.type}`} />)}</span>
      </button>
    );
  });

  const selItems = by[sel] ?? [];
  const end = addDays(today, 7);
  const upcoming = items.filter((x) => x.date > today && x.date <= end && !x.done);
  const legend: CalType[] = ["deadline", "review", "step", "todo", "event"];

  return (
    <>
      <div className="hero">
        <p className="eyebrow">カレンダー</p>
        <h1 className="h1">スケジュール</h1>
        <p className="small muted">各問題の期限・段階の目安日・振り返り日・TODO・作業の予定がまとまって表示されます。</p>
      </div>

      <section className="card">
        <div className="calhead">
          <button type="button" className="calnav" aria-label="前の月" onClick={() => moveMonth(-1)}>‹</button>
          <p className="mo">{y}年{m + 1}月</p>
          <button type="button" className="btn sm line" onClick={() => pick(today)}>今日</button>
          <button type="button" className="calnav" aria-label="次の月" onClick={() => moveMonth(1)}>›</button>
        </div>
        <div className="cal">
          {WD.map((w, i) => <span key={w} className={"dw" + (i === 0 ? " su" : i === 6 ? " sa" : "")}>{w}</span>)}
          {cells}
        </div>
        <div className="legend">
          {legend.map((t) => <span key={t} className={`t-${t}`}><i className="dot" />{TYPE_LABEL[t]}</span>)}
        </div>
      </section>

      <section className="card">
        <p className="daylabel">{mdLabel(sel)}{sel === today ? "・今日" : ""}</p>
        {selItems.length ? (
          <div className="agenda">{selItems.map((x) => <AgendaRow key={x.key} x={x} prefix="sel" />)}</div>
        ) : (
          <p className="small muted">この日の予定はありません。</p>
        )}
        {pidSel ? (
          <div className="addform">
            <p className="small" style={{ fontWeight: 900 }}>この日に作業の予定を追加</p>
            <input placeholder="例：図書館で課題を1時間" aria-label="予定の内容" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="r2">
              <select aria-label="どの問題の予定か" value={pidSel} onChange={(e) => setPid(e.target.value)}>
                {active.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input type="time" aria-label="時刻" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <p className="small muted">TODOは各問題の「打ち手を決める」段階から追加します。</p>
            {err && <p className="need">{err}</p>}
            <button type="button" className="btn sm" onClick={addEvent}>追加する</button>
          </div>
        ) : (
          <p className="small muted">問題を作ると、その問題の作業の予定をここから追加できます。</p>
        )}
      </section>

      <section className="card">
        <p className="h2">これから7日間</p>
        {!upcoming.length ? (
          <p className="small muted">この先1週間の予定はありません。問題の「期限を決める」段階をクリアすると、目安日がここに並びます。</p>
        ) : (
          <div className="upc">
            {upcoming.map((x, i) => (
              <div key={x.key} className="upc-item">
                {(i === 0 || upcoming[i - 1].date !== x.date) && <p className="ud">{mdLabel(x.date)}</p>}
                <AgendaRow x={x} prefix="up" />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
