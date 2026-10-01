// 段階の進み方・スケジュール・カレンダーなど、画面に依存しない処理
import type { Action, CourseId, EventItem, Problem, StepId, TreeNode } from "./types";
import { COURSES, FW, STEPS, type Template } from "./frameworks";
import { filled, todos, uid } from "./core";
import { addDays, diffDays, todayStr } from "./dates";

export function stepsOf(p: Problem): StepId[] {
  return (COURSES[p.course] ?? COURSES.daily).steps;
}

/** まだクリアしていない最初の段階の番号（全部クリアなら段階数） */
export function currentIdx(p: Problem): number {
  const st = stepsOf(p);
  for (let i = 0; i < st.length; i++) if (!p.cleared?.[st[i]]) return i;
  return st.length;
}

export function progress(p: Problem): { n: number; total: number } {
  const st = stepsOf(p);
  return { n: st.filter((s) => p.cleared?.[s]).length, total: st.length };
}

/** 画面に開く段階。指定がなければ今の段階。まだ開けない段階は開かない */
export function openIdx(p: Problem, openStep: number | null): number {
  const st = stepsOf(p);
  const ci = currentIdx(p);
  let open = openStep ?? Math.min(ci, st.length - 1);
  if (open > ci) open = Math.min(ci, st.length - 1);
  return open;
}

export function sortedList(problems: Record<string, Problem>): Problem[] {
  return Object.values(problems).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function newProblem(title: string, course: CourseId): Problem {
  const now = Date.now();
  return {
    id: uid(), title, course, status: "active", cycle: 1, createdAt: now, updatedAt: now,
    cleared: {}, w: {}, plan: {}, rev: {}, tree: [], mece: {}, focus: null,
    actions: [], history: [], sched: { steps: {} }, events: [],
  };
}

export function applyTemplate(p: Problem, tp: Template): void {
  p.w = { ...tp.w };
  if (tp.tree) {
    p.tree = tp.tree.map((b) => ({ id: uid(), text: b.text, kids: b.kids.map((k) => ({ id: uid(), text: k })) }));
  }
}

/** 期限から逆算して、まだクリアしていない段階に目安日を均等に割り振る（最後が振り返り日） */
export function autoSchedule(p: Problem): string | null {
  p.sched = p.sched ?? { steps: {} };
  p.sched.steps = p.sched.steps ?? {};
  const today = todayStr();
  const dl = p.sched.deadline;
  if (!dl) return "先に期限を決めてください";
  const span = diffDays(today, dl);
  if (span < 1) return "期限は明日以降の日付にしてください";
  const rest = stepsOf(p).filter((s) => s !== "sched" && !p.cleared?.[s]);
  rest.forEach((s, k) => {
    p.sched.steps[s] = addDays(today, Math.max(1, Math.round(((k + 1) * span) / rest.length)));
  });
  if (rest.includes("review")) p.sched.steps.review = dl;
  return null;
}

export function findNode(p: Problem, id: string): TreeNode | null {
  for (const b of p.tree ?? []) {
    if (b.id === id) return b;
    for (const k of b.kids ?? []) if (k.id === id) return k;
  }
  return null;
}

/* ---------- カレンダー ---------- */
export type CalType = "deadline" | "review" | "step" | "todo" | "event";

export const TYPE_LABEL: Record<CalType, string> = {
  deadline: "期限", review: "振り返り", step: "段階", todo: "TODO", event: "予定",
};

export interface CalItem {
  key: string;
  date: string;
  type: CalType;
  text: string;
  p: Problem;
  done?: boolean;
  sid?: StepId;
  a?: Action;
  ev?: EventItem;
  time?: string;
}

export function calItems(list: Problem[]): CalItem[] {
  const out: CalItem[] = [];
  for (const p of list) {
    const sc = p.sched ?? { steps: {} };
    const st = stepsOf(p);
    if (sc.deadline && p.status !== "solved") out.push({ key: p.id + ":dl", date: sc.deadline, type: "deadline", text: "解決の期限", p });
    st.forEach((sid, i) => {
      const d = sc.steps?.[sid];
      if (!d) return;
      const isRv = sid === "review";
      out.push({
        key: p.id + ":st:" + sid, date: d, type: isRv ? "review" : "step",
        text: isRv ? "振り返り日（PDCAのC・A）" : `STEP${i + 1}「${STEPS[sid].title}」の目安`,
        p, done: !!p.cleared?.[sid], sid,
      });
    });
    for (const a of todos(p)) if (a.due) out.push({ key: p.id + ":td:" + a.id, date: a.due, type: "todo", text: a.text, p, done: !!a.done, a });
    for (const ev of p.events ?? []) {
      if (ev.date) out.push({ key: p.id + ":ev:" + ev.id, date: ev.date, type: "event", text: (ev.time ? ev.time + " " : "") + ev.title, time: ev.time || "", p, ev });
    }
  }
  const order: Record<CalType, number> = { deadline: 0, review: 1, step: 2, event: 3, todo: 4 };
  return out.sort((x, y) => x.date.localeCompare(y.date) || order[x.type] - order[y.type] || (x.time ?? "").localeCompare(y.time ?? ""));
}

/* ---------- AIヒント用の文章 ---------- */
export function hintPrompt(p: Problem, sid: StepId): string {
  const st = STEPS[sid];
  const labels: string[] = [];
  for (const b of st.blocks) {
    if (b.t === "fields") b.items.forEach((it) => labels.push(it.l));
    if (b.t === "tree") labels.push("原因の木（大きな原因と小さな原因）");
    if (b.t === "actions" || b.t === "todos") labels.push("具体的な行動・TODO");
    if (b.t === "deadline") labels.push("解決の期限");
  }
  const lines: string[] = [`問題：${p.title}`, `コース：${COURSES[p.course].name}`, `今日：${todayStr()}`];
  if (p.sched?.deadline) lines.push(`解決の期限：${p.sched.deadline}`);
  const keys = ["w", "pest", "c3", "swot", "stp", "p4", "plan", "rev"] as const;
  for (const k of keys) {
    const o = p[k];
    if (!o) continue;
    for (const f of Object.keys(o)) if (filled(o[f])) lines.push(`${k}.${f}：${o[f]}`);
  }
  for (const b of p.tree ?? []) {
    if (!filled(b.text)) continue;
    const kids = (b.kids ?? []).map((k) => k.text).filter(filled);
    lines.push(`原因：${b.text}${kids.length ? `（${kids.join("、")}）` : ""}`);
  }
  const fc = p.focus ? findNode(p, p.focus) : null;
  if (fc) lines.push(`狙う原因：${fc.text}`);
  for (const a of p.actions ?? []) if (filled(a.text)) lines.push(`行動：${a.text}${a.todo ? "［TODO］" : ""}${a.done ? "［完了］" : ""}`);
  return (
    "あなたは大学生の問題解決を手伝うコーチです。ユーザーはフレームワークを使って問題を段階的に解いています。\n" +
    `いまの段階：「${st.title}」（使うフレームワーク：${st.fw.map((f) => FW[f].name).join("・")}）\n` +
    `この段階の説明：${st.lead}\n` +
    `この段階の記入欄：${labels.join("／")}\n\n` +
    `これまでの記入内容：\n${lines.join("\n").slice(0, 3500)}\n\n` +
    "この段階のまだ弱い所・空いている欄について、この人の状況に合わせた具体的な記入例やヒントを3つまで出してください。" +
    "各項目は「・」で始め、1〜2文の日本語で。前置きやまとめは不要です。"
  );
}
