"use client";
// 問題ページ：今やる段階だけを1画面で表示し、下に固定したボタンでクリアして進む
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Fields, FieldKey, Problem, StepId } from "@/lib/types";
import { useStore } from "@/lib/store";
import { COURSES, FW, QUADS, STEPS, type Block, type FieldItem } from "@/lib/frameworks";
import { autoSchedule, currentIdx, findNode, hintPrompt, openIdx, progress, stepsOf } from "@/lib/logic";
import { filled, todos, uid } from "@/lib/core";
import { addDays, diffDays, mdLabel, todayStr } from "@/lib/dates";
import TodoRow from "./TodoRow";

type Up = (fn: (q: Problem) => void) => void;

export default function ProblemView({ id }: { id: string }) {
  const { problems, edit, remove, hintEnabled, getToken } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const p = problems[id];

  const [openStep, setOpenStep] = useState<number | null>(null);
  const [err, setErr] = useState<Partial<Record<StepId, boolean>>>({});
  const [schedErr, setSchedErr] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [more, setMore] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState<Record<string, string>>({});
  const [hintBusy, setHintBusy] = useState<string | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // ?step=review のように段階を指定して開く（ホームの「振り返りの日」から来たとき）
  const stepParam = params.get("step");
  useEffect(() => {
    if (!p || !stepParam) return;
    const i = stepsOf(p).indexOf(stepParam as StepId);
    if (i >= 0 && i <= currentIdx(p)) setOpenStep(i);
    // 最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParam, !!p]);

  // タイトル欄の高さを内容に合わせる
  useEffect(() => {
    const t = titleRef.current;
    if (t) {
      t.style.height = "auto";
      t.style.height = t.scrollHeight + "px";
    }
  }, [p?.title]);

  if (!p) {
    return (
      <section className="empty">
        <p className="h2">この問題は見つかりませんでした</p>
        <p className="small muted">削除されたか、別のアカウントの問題かもしれません。</p>
        <Link className="btn sm" href="/" style={{ justifySelf: "start" }}>問題リストへ</Link>
      </section>
    );
  }

  const up: Up = (fn) => edit(p.id, fn);
  const st = stepsOf(p);
  const ci = currentIdx(p);
  const open = openIdx(p, openStep);
  const sid = st[open];
  const step = STEPS[sid];
  const pr = progress(p);
  const cleared = !!p.cleared?.[sid];
  const msg = step.req(p);

  const go = (i: number) => {
    if (i > ci) return;
    setOpenStep(i);
    setErr({});
    setStepsOpen(false);
    window.scrollTo(0, 0);
  };

  const clear = () => {
    if (msg) {
      setErr({ ...err, [sid]: true });
      return;
    }
    up((q) => {
      q.cleared[sid] = true;
      if (sid === "sched") autoSchedule(q);
    });
    setErr({});
    setOpenStep(null);
    window.scrollTo(0, 0);
  };

  const solve = () => {
    if (msg) { setErr({ review: true }); return; }
    up((q) => { q.cleared.review = true; q.status = "solved"; });
    setErr({});
    window.scrollTo(0, 0);
  };

  const again = () => {
    if (msg) { setErr({ review: true }); return; }
    up((q) => {
      q.history.push({ cycle: q.cycle || 1, goal: q.plan?.goal || "", result: q.rev.result || "", next: q.rev.next || "", at: Date.now() });
      q.actions = q.actions.map((a) => (a.done ? { ...a, archived: true } : a));
      if (filled(q.rev.next)) q.actions.push({ id: uid(), text: q.rev.next.trim(), todo: true, done: false, due: "", q: "best" });
      q.cycle = (q.cycle || 1) + 1;
      q.rev = {};
      q.cleared.plan = false;
      q.cleared.review = false;
      q.status = "active";
      // 次の周の振り返り日：期限が残っていればそのまま、過ぎていれば1週間後
      const today = todayStr();
      if (!q.sched.deadline || q.sched.deadline <= today) q.sched.deadline = addDays(today, 7);
      q.sched.steps.plan = addDays(today, Math.max(1, Math.floor(diffDays(today, q.sched.deadline) / 2)));
      q.sched.steps.review = q.sched.deadline;
    });
    setErr({});
    setOpenStep(st.indexOf("plan"));
    window.scrollTo(0, 0);
  };

  const reopen = () => {
    up((q) => { q.status = "active"; q.cleared.review = false; });
  };

  const askHint = async () => {
    const hk = `${p.id}:${sid}`;
    setHintBusy(hk);
    setHint((h) => ({ ...h, [hk]: "" }));
    try {
      const token = await getToken();
      const r = await fetch("/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: hintPrompt(p, sid) }),
      });
      const j = (await r.json()) as { text?: string; error?: string };
      setHint((h) => ({ ...h, [hk]: r.ok && j.text ? j.text : j.error || "ヒントを取得できませんでした。もう一度押してください。" }));
    } catch {
      setHint((h) => ({ ...h, [hk]: "通信できませんでした。電波の良い所でもう一度押してください。" }));
    } finally {
      setHintBusy(null);
    }
  };

  const hk = `${p.id}:${sid}`;
  const rvDate = p.sched?.steps?.review;

  return (
    <>
      <div className="phead">
        <Link className="back" href="/">‹ 問題リスト</Link>
        <div className="pmenu">
          <button type="button" className="dots-btn" aria-label="メニュー" aria-expanded={menu} onClick={() => { setMenu(!menu); setConfirmDel(false); }}>•••</button>
          {menu && (
            <div className="menu-in">
              {confirmDel ? (
                <>
                  <p className="small"><b>この問題を削除しますか？</b><br />書いた内容・TODO・予定もすべて消え、元に戻せません。</p>
                  <div className="row">
                    <button type="button" className="btn sm warn" onClick={() => { remove(p.id); router.push("/"); }}>削除する</button>
                    <button type="button" className="btn sm ghost" onClick={() => setConfirmDel(false)}>やめる</button>
                  </div>
                </>
              ) : (
                <button type="button" className="btn sm line wide" onClick={() => setConfirmDel(true)}>この問題を削除</button>
              )}
            </div>
          )}
        </div>
      </div>

      {p.status === "solved" && (
        <section className="solved">
          <p className="eyebrow">SOLVED</p>
          <p className="h1">この問題は解決しました</p>
          <p className="small">{p.cycle > 1 ? `${p.cycle}周まわして` : ""}たどり着きました。記録はいつでも見返せます。</p>
        </section>
      )}

      <section className="pcard2">
        <div className="row">
          <span className={"chip " + p.course}>{COURSES[p.course].name}</span>
          {p.cycle > 1 && <span className="chip">{p.cycle}周目</span>}
          {p.sched?.deadline && <span className="chip">期限 {mdLabel(p.sched.deadline)}</span>}
        </div>
        <textarea ref={titleRef} className="ptitle" rows={1} aria-label="問題のタイトル" value={p.title}
          onChange={(e) => { const v = e.target.value; up((q) => { q.title = v; }); }} />
        <div className="bar"><i style={{ width: `${Math.round((pr.n / pr.total) * 100)}%` }} /></div>
        <div className="steps">
          <button type="button" className="steps-sum" aria-expanded={stepsOpen} onClick={() => setStepsOpen(!stepsOpen)}>
            <span className="sn">STEP {open + 1} / {st.length}</span>
            <span className="stt">{step.title}</span>
            <span className="sl2">段階一覧 {stepsOpen ? "▴" : "▾"}</span>
          </button>
          {stepsOpen && (
            <div className="slist">
              {st.map((s, i) => {
                const done = !!p.cleared?.[s];
                const cls = (done ? "cleared" : i === ci ? "current" : i > ci ? "locked" : "") + (i === open ? " open" : "");
                const d = p.sched?.steps?.[s];
                return (
                  <button type="button" key={s} className={"si " + cls} onClick={() => go(i)} aria-disabled={i > ci}>
                    <span className="n">{done ? "✓" : i + 1}</span>
                    <span className="t">{STEPS[s].title}</span>
                    <span className="d">{d ? mdLabel(d) : i > ci ? "🔒" : ""}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card stepcard">
        <div className="stephead">
          <h2>{step.title}</h2>
          <div className="row">
            {step.fw.map((f) => <Link key={f} className="chip fw" href={`/learn#fw-${f}`}>{FW[f].name}</Link>)}
            {step.sub && <span className="small muted">{step.sub}</span>}
          </div>
          <p className="lead">{step.lead}</p>
        </div>
        <details className="ex">
          <summary>例を見る（日常・ビジネス）</summary>
          <p><b>日常</b>{step.ex.d}</p>
          <p><b>ビジネス</b>{step.ex.b}</p>
        </details>

        {step.blocks.map((b, i) => (
          <div className="sec" key={i}>
            <BlockView p={p} b={b} sid={sid} up={up} more={more} setMore={(k, v) => setMore({ ...more, [k]: v })} schedErr={schedErr} setSchedErr={setSchedErr} />
          </div>
        ))}

        {sid === "plan" && (
          <div className="sec">
            <p className="small">
              {rvDate ? <>振り返り日は <b>{mdLabel(rvDate)}</b>。その日にホームでお知らせします。</> : "振り返り日が決まっていません。「期限を決める」の段階で決めておくと、忘れずにCheckできます。"}
            </p>
          </div>
        )}

        {hintEnabled && (
          <div className="sec">
            <div className="row">
              <button type="button" className="btn sm ghost" onClick={() => void askHint()} disabled={!!hintBusy}>
                {hintBusy === hk ? "考え中…" : "AIにヒントをもらう"}
              </button>
              <span className="small muted">書いた内容をもとに記入例を出します</span>
            </div>
            {hint[hk] && <div className="hintbox"><span className="hl">AIのヒント</span>{hint[hk]}</div>}
          </div>
        )}
      </section>

      {/* 下に固定のボタン */}
      <div className="abar">
        <div className="abar-in">
          {msg && p.status !== "solved" && (!cleared || sid === "review") ? (
            err[sid] ? <p className="bnote err">{msg}</p> : <p className="bnote">クリア条件：{msg.replace("とクリアできます", "").replace("と進めます", "")}</p>
          ) : cleared && sid !== "review" ? (
            <p className="bnote ok">✓ この段階はクリア済み</p>
          ) : null}
          <div className={"brow" + (open > 0 ? "" : " solo")}>
            {open > 0 && <button type="button" className="btn ghost bprev" aria-label="前の段階へ" onClick={() => go(open - 1)}>‹</button>}
            {sid === "review" ? (
              p.status === "solved" ? (
                <button type="button" className="btn" onClick={reopen}>もう一度取り組む</button>
              ) : (
                <div className="two">
                  <button type="button" className="btn ghost" onClick={again}>もう1周まわす</button>
                  <button type="button" className="btn" onClick={solve}>解決した！</button>
                </div>
              )
            ) : cleared ? (
              open + 1 < st.length ? <button type="button" className="btn" onClick={() => go(open + 1)}>次の段階へ ›</button> : <button type="button" className="btn" disabled>クリア済み</button>
            ) : (
              <button type="button" className="btn" onClick={clear}>この段階をクリア ✓</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- 段階の中身（ブロック） ---------------- */

interface BlockProps {
  p: Problem;
  b: Block;
  sid: StepId;
  up: Up;
  more: Record<string, boolean>;
  setMore: (k: string, v: boolean) => void;
  schedErr: string | null;
  setSchedErr: (v: string | null) => void;
}

function FieldInput({ sid, fkey, it, o, up }: { sid: StepId; fkey: FieldKey; it: FieldItem; o: Fields; up: Up }) {
  const id = `f-${sid}-${fkey}-${it.k}`;
  const set = (v: string) => up((q) => { q[fkey] = { ...(q[fkey] ?? {}), [it.k]: v }; });
  return (
    <div className="field">
      <label htmlFor={id}>{it.l}</label>
      {it.multi ? (
        <textarea className="inp" id={id} rows={2} placeholder={it.ph} value={o[it.k] ?? ""} onChange={(e) => set(e.target.value)} />
      ) : (
        <input className="inp" id={id} placeholder={it.ph} value={o[it.k] ?? ""} onChange={(e) => set(e.target.value)} />
      )}
    </div>
  );
}

function BlockView({ p, b, sid, up, more, setMore, schedErr, setSchedErr }: BlockProps) {
  switch (b.t) {
    case "fields": {
      const o = p[b.key] ?? {};
      const must = b.items.filter((it) => !it.opt);
      const opt = b.items.filter((it) => it.opt);
      const wrap = b.grid ? "grid2" : "fstack";
      const mk = `more-${sid}-${b.key}${b.title ? "-x" : ""}`;
      const anyFilled = opt.some((it) => filled(o[it.k]));
      const isOpen = more[mk] ?? anyFilled;
      return (
        <>
          {b.title && <p className="sec-t">{b.title}</p>}
          <div className={wrap}>{must.map((it) => <FieldInput key={it.k} sid={sid} fkey={b.key} it={it} o={o} up={up} />)}</div>
          {opt.length > 0 && (
            <div className="more">
              <button type="button" className="more-sum" aria-expanded={isOpen} onClick={() => setMore(mk, !isOpen)}>
                {isOpen ? "▾" : "▸"} もっと書く（任意・{opt.length}項目）
              </button>
              {isOpen && <div className={wrap}>{opt.map((it) => <FieldInput key={it.k} sid={sid} fkey={b.key} it={it} o={o} up={up} />)}</div>}
            </div>
          )}
        </>
      );
    }

    case "deadline": {
      const today = todayStr();
      const dl = p.sched?.deadline ?? "";
      const steps = p.sched?.steps ?? {};
      const st = stepsOf(p);
      const has = st.some((s) => steps[s]);
      const setDl = (v: string) => up((q) => { q.sched = { ...q.sched, steps: q.sched?.steps ?? {}, deadline: v }; });
      const adjOpen = !!more["sched-adj"];
      return (
        <>
          <div className="field">
            <label htmlFor="sc-deadline">いつまでに解決する？</label>
            <div className="quick">
              {([[7, "1週間後"], [14, "2週間後"], [30, "1か月後"], [90, "3か月後"]] as [number, string][]).map(([n, label]) => {
                const d = addDays(today, n);
                return (
                  <button type="button" key={n} className={dl === d ? "on" : ""} onClick={() => setDl(d)}>
                    {label}<small>{mdLabel(d)}</small>
                  </button>
                );
              })}
            </div>
            <div className="row">
              <span className="small muted">日付を選ぶ</span>
              <input type="date" className="dt" id="sc-deadline" min={addDays(today, 1)} value={dl} onChange={(e) => setDl(e.target.value)} />
            </div>
          </div>
          {dl && <p className="small">残り <b>{Math.max(0, diffDays(today, dl))}日</b>。クリアすると、残りの段階の目安日を自動で決めてカレンダーに載せます。</p>}
          {has && (
            <div className="more">
              <button type="button" className="more-sum" aria-expanded={adjOpen} onClick={() => setMore("sched-adj", !adjOpen)}>
                {adjOpen ? "▾" : "▸"} 目安日を1つずつ調整する
              </button>
              {adjOpen && (
                <>
                  <div className="srows">
                    {st.map((s, i) => {
                      if (s === "sched" || i === 0) return null;
                      const done = !!p.cleared?.[s];
                      const rv = s === "review";
                      return (
                        <div key={s} className={"srow" + (rv ? " rv" : "") + (done ? " dn" : "")}>
                          <p className="nm">
                            {done ? "✓ " : ""}STEP{i + 1} {STEPS[s].title}
                            {rv && <small>振り返り日：この日にホームでお知らせ</small>}
                          </p>
                          <input type="date" className="dt" aria-label={`STEP${i + 1}の目安日`} value={steps[s] ?? ""}
                            onChange={(e) => { const v = e.target.value; up((q) => { q.sched.steps[s] = v; }); }} />
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" className="add" onClick={() => up((q) => { setSchedErr(autoSchedule(q)); })}>期限から引き直す</button>
                  {schedErr && <p className="need">{schedErr}</p>}
                </>
              )}
            </div>
          )}
        </>
      );
    }

    case "tree": {
      const setNode = (nid: string, v: string) => up((q) => { const n = findNode(q, nid); if (n) n.text = v; });
      return (
        <>
          <p className="sec-t">原因の木</p>
          <div className="tree">
            <div className="troot">{p.title || "問題"}</div>
            {p.tree.map((br, i) => (
              <div className="branch" key={br.id}>
                <div className="ln">
                  <input className="inp" id={`tr-${br.id}`} placeholder={`大きな原因 ${i + 1}（例：夜ふかし）`} value={br.text} onChange={(e) => setNode(br.id, e.target.value)} />
                  <button type="button" className="x" aria-label="この原因を削除"
                    onClick={() => up((q) => { q.tree = q.tree.filter((x) => x.id !== br.id); if (q.focus === br.id || (br.kids ?? []).some((k) => k.id === q.focus)) q.focus = null; })}>×</button>
                </div>
                {(br.kids ?? []).map((k) => (
                  <div className="kid" key={k.id}>
                    <input className="inp" id={`tr-${k.id}`} placeholder="なぜ？→ 小さな原因" value={k.text} onChange={(e) => setNode(k.id, e.target.value)} />
                    <button type="button" className="x" aria-label="削除"
                      onClick={() => up((q) => { const b2 = findNode(q, br.id); if (b2) b2.kids = (b2.kids ?? []).filter((x) => x.id !== k.id); if (q.focus === k.id) q.focus = null; })}>×</button>
                  </div>
                ))}
                <button type="button" className="add" onClick={() => up((q) => { const b2 = findNode(q, br.id); if (b2) b2.kids = [...(b2.kids ?? []), { id: uid(), text: "" }]; })}>＋ なぜ？（小さな原因）</button>
              </div>
            ))}
            <button type="button" className="add" onClick={() => up((q) => { q.tree = [...q.tree, { id: uid(), text: "", kids: [] }]; })}>＋ 大きな原因を追加</button>
          </div>
        </>
      );
    }

    case "mece": {
      const m = p.mece ?? {};
      const isOpen = !!more.mece;
      return (
        <div className="more">
          <button type="button" className="more-sum" aria-expanded={isOpen} onClick={() => setMore("mece", !isOpen)}>{isOpen ? "▾" : "▸"} MECEチェック（モレなく・ダブりなく）</button>
          {isOpen && (
            <div className="checks">
              <label className="ck">
                <input type="checkbox" checked={!!m.dup} onChange={(e) => { const v = e.target.checked; up((q) => { q.mece = { ...q.mece, dup: v }; }); }} />
                <span><b>ダブりはない</b><br /><span className="small muted">同じ原因が2つの枝に入っていない？</span></span>
              </label>
              <label className="ck">
                <input type="checkbox" checked={!!m.miss} onChange={(e) => { const v = e.target.checked; up((q) => { q.mece = { ...q.mece, miss: v }; }); }} />
                <span><b>モレはない</b><br /><span className="small muted">他に大きな原因はない？</span></span>
              </label>
            </div>
          )}
        </div>
      );
    }

    case "focus": {
      const nodes: { id: string; text: string; kid: boolean }[] = [];
      for (const br of p.tree) {
        if (filled(br.text)) nodes.push({ id: br.id, text: br.text, kid: false });
        for (const k of br.kids ?? []) if (filled(k.text)) nodes.push({ id: k.id, text: k.text, kid: true });
      }
      if (!nodes.length) return <><p className="sec-t">狙う原因</p><p className="small muted">前の段階で原因を書くと、ここに並びます。</p></>;
      return (
        <>
          <p className="sec-t">① 狙う原因を1つ選ぶ</p>
          <p className="small muted">「これが変われば一番効きそう」で「自分で変えられる」もの。</p>
          <div className="pick">
            {nodes.map((n) => (
              <label key={n.id} className={n.kid ? "kidp" : ""}>
                <input type="radio" name="focus" checked={p.focus === n.id} onChange={() => up((q) => { q.focus = n.id; })} />
                {n.text}
              </label>
            ))}
          </div>
        </>
      );
    }

    case "actions": {
      const acts = p.actions.filter((a) => !a.archived);
      const n = todos(p).length;
      const skip = acts.filter((a) => a.q === "skip").length;
      return (
        <>
          <p className="sec-t">{b.num ?? ""}{b.label}</p>
          <p className="small muted">{b.hint}</p>
          <div className="acts">
            {acts.map((a) => (
              <div className="act3" key={a.id}>
                <div className="top2">
                  <input className="inp" id={`ac-${a.id}`} placeholder="例：23時にスマホを机で充電する" value={a.text}
                    onChange={(e) => { const v = e.target.value; up((q) => { const x = q.actions.find((y) => y.id === a.id); if (x) x.text = v; }); }} />
                  <button type="button" className="x" aria-label="削除" onClick={() => up((q) => { q.actions = q.actions.filter((x) => x.id !== a.id); })}>×</button>
                </div>
                <div className="qpick" role="group" aria-label="4マスのどこに置く？">
                  {QUADS.map(([qv, name, sub]) => (
                    <button type="button" key={qv} className={`q-${qv}` + (a.q === qv ? " on" : "")} aria-pressed={a.q === qv}
                      onClick={() => up((q) => {
                        const x = q.actions.find((y) => y.id === a.id);
                        if (!x) return;
                        x.q = x.q === qv ? null : qv;
                        x.todo = !!x.q && x.q !== "skip";
                        if (!x.todo) x.done = false;
                      })}>
                      <b>{name}</b><small>{sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="add" onClick={() => up((q) => { q.actions = [...q.actions, { id: uid(), text: "", todo: false, done: false, due: "", q: null }]; })}>＋ 行動を追加</button>
          <p className="small">
            {n ? <b>TODOになった行動：{n}件</b> : "まだTODOはありません"}
            {skip ? `（やらない：${skip}件）` : ""}
            <span className="muted">　「やらない」以外に置くと自動でTODOになります</span>
          </p>
        </>
      );
    }

    case "todos":
      return <TodosBlock p={p} up={up} />;

    case "history": {
      const hs = p.history ?? [];
      if (!hs.length) return <p className="small muted">解決していなければ、下の「もう1周まわす」で次の周へ。前の周の記録はここに残ります。</p>;
      return (
        <>
          <p className="sec-t">これまでの周回</p>
          <div className="hist">
            {hs.map((x) => (
              <div key={x.cycle + ":" + x.at}>
                <b>{x.cycle}周目</b>（目標：{x.goal || "-"}）<br />結果：{x.result || "-"}<br />次の手：{x.next || "-"}
              </div>
            ))}
          </div>
        </>
      );
    }
  }
}

function TodosBlock({ p, up }: { p: Problem; up: Up }) {
  const [text, setText] = useState("");
  const ts = todos(p);
  const addTodo = () => {
    const t = text.trim();
    if (!t) return;
    up((q) => { q.actions = [...q.actions, { id: uid(), text: t, todo: true, done: false, due: "", q: "best" }]; });
    setText("");
  };
  return (
    <>
      <p className="sec-t">Do｜TODO</p>
      {!ts.length && <p className="small muted">まだTODOがありません。下から追加できます。</p>}
      <div className="acts">{ts.map((a) => <TodoRow key={a.id} p={p} a={a} />)}</div>
      <div className="ln">
        <input className="inp" placeholder="TODOを追加（例：寝る前にアラームを机に置く）" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) addTodo(); }} aria-label="TODOを追加" />
        <button type="button" className="btn sm" onClick={addTodo}>追加</button>
      </div>
    </>
  );
}
