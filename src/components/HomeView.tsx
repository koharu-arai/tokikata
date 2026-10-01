"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Problem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { COURSES, STEPS, TEMPLATES } from "@/lib/frameworks";
import { currentIdx, progress, stepsOf, calItems } from "@/lib/logic";
import { todos } from "@/lib/core";
import { diffDays, todayStr } from "@/lib/dates";
import TodoRow from "./TodoRow";

function ProblemCard({ p }: { p: Problem }) {
  const pr = progress(p);
  const st = stepsOf(p);
  const ci = currentIdx(p);
  const next = p.status === "solved" ? "解決済み" : ci < st.length ? `${ci + 1}段階目「${STEPS[st[ci]].title}」` : "振り返り待ち";
  const ts = todos(p);
  return (
    <Link className="pcard" href={`/p/${p.id}`}>
      <div className="row">
        <span className={"chip " + p.course}>{COURSES[p.course].name}</span>
        {p.status === "solved" && <span className="chip done">解決</span>}
        {p.cycle > 1 && <span className="chip">{p.cycle}周目</span>}
      </div>
      <p className="t">{p.title || "（無題の問題）"}</p>
      <p className="nx">次：<b>{next}</b></p>
      <div className="bar"><i style={{ width: `${Math.round((pr.n / pr.total) * 100)}%` }} /></div>
      <div className="meta">
        <span>{pr.n} / {pr.total} 段階クリア</span>
        <span>{ts.filter((a) => a.done).length} / {ts.length} TODO</span>
      </div>
    </Link>
  );
}

export function TemplateChips({ selected }: { selected?: string | null }) {
  return (
    <div className="tpls">
      {TEMPLATES.map((tp) => (
        <Link key={tp.id} href={selected === tp.id ? "/new" : `/new?tpl=${tp.id}`} className={selected === tp.id ? "on" : ""} replace={selected !== undefined}>
          {tp.label}
          <small>{tp.course === "biz" ? "企画" : "日常"}</small>
        </Link>
      ))}
    </div>
  );
}

export default function HomeView() {
  const { list, mode, localCount, migrateLocal } = useStore();
  const active = list.filter((p) => p.status !== "solved");
  const solved = list.filter((p) => p.status === "solved");
  const today = todayStr();

  const banners: ReactNode[] = [];
  for (const p of active) {
    const rv = p.sched?.steps?.review;
    if (rv && rv <= today && !p.cleared?.review) {
      const late = rv < today;
      banners.push(
        <Link key={p.id + "rv"} className={"banner" + (late ? " late" : "")} href={`/p/${p.id}?step=review`}>
          <span className="ic2">振り<br />返り</span>
          <span>
            <span className="bt">{late ? `振り返り日を${diffDays(rv, today)}日過ぎています` : "今日は振り返りの日です"}</span><br />
            <span className="bs">「{p.title}」の結果を確かめて、次の手を決めよう ›</span>
          </span>
        </Link>,
      );
    }
    if (p.sched?.deadline && p.sched.deadline < today) {
      banners.push(
        <Link key={p.id + "dl"} className="banner late" href={`/p/${p.id}`}>
          <span className="ic2">期限</span>
          <span>
            <span className="bt">解決の期限を過ぎています</span><br />
            <span className="bs">「{p.title}」の期限を決め直そう ›</span>
          </span>
        </Link>,
      );
    }
  }
  const todayItems = calItems(list).filter((x) => x.date === today && x.type !== "deadline" && x.type !== "review" && !x.done);
  if (todayItems.length) {
    banners.push(
      <Link key="today" className="banner plain" href="/calendar">
        <span className="ic2">今日</span>
        <span>
          <span className="bt">今日の予定・TODOが {todayItems.length} 件</span><br />
          <span className="bs">{todayItems.slice(0, 2).map((x) => x.text).join("、")}{todayItems.length > 2 ? " ほか" : ""} ›</span>
        </span>
      </Link>,
    );
  }

  const openTodos = active.flatMap((p) => todos(p).filter((a) => !a.done).map((a) => ({ p, a })));

  return (
    <>
      <div className="hero">
        <p className="eyebrow">いま取り組んでいる問題</p>
        <h1 className="h1">1段ずつ、解いていこう</h1>
      </div>

      {mode === "cloud" && localCount > 0 && (
        <div className="confirm">
          <p className="small"><b>この端末に保存した問題が {localCount} 件あります。</b>クラウドに移すと、ほかの端末でも見られます。</p>
          <button type="button" className="btn sm" onClick={() => void migrateLocal()}>クラウドに移す</button>
        </div>
      )}

      {banners}

      <Link className="btn wide" href="/new">＋ 新しい問題を書く</Link>

      {list.length === 0 && (
        <section className="empty">
          <p className="h2">まだ問題がありません</p>
          <p className="small muted">困っていることを1つ書くと、フレームワークに沿った「段階」が並びます。1段階ずつクリアして、最後はTODOにして実行します。</p>
          <p className="small"><b>よくある悩みから始める</b>（下書き入り）</p>
          <TemplateChips />
        </section>
      )}

      {active.length > 0 && <div className="list">{active.map((p) => <ProblemCard key={p.id} p={p} />)}</div>}

      {openTodos.length > 0 && (
        <section className="card">
          <div className="sec-h">
            <p className="h2">次のTODO</p>
            <Link className="btn sm line" href="/todo">すべて見る</Link>
          </div>
          <div className="acts">
            {openTodos.slice(0, 3).map(({ p, a }) => <TodoRow key={a.id} p={p} a={a} showFrom idPrefix="home" />)}
          </div>
        </section>
      )}

      {solved.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 6 }}>解決した問題</p>
          <div className="list">{solved.map((p) => <ProblemCard key={p.id} p={p} />)}</div>
        </>
      )}
    </>
  );
}
