"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CourseId } from "@/lib/types";
import { useStore } from "@/lib/store";
import { COURSES, TEMPLATES } from "@/lib/frameworks";
import { applyTemplate, newProblem } from "@/lib/logic";
import { TemplateChips } from "./HomeView";

export default function NewView() {
  const { add } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const tplId = params.get("tpl");
  const tpl = TEMPLATES.find((t) => t.id === tplId) ?? null;

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState<CourseId>("daily");
  const [err, setErr] = useState<string | null>(null);

  // テンプレートを選んだら、タイトルとコースを入れる（自分で書いたタイトルは消さない）
  useEffect(() => {
    if (tpl) {
      setTitle((t) => (!t.trim() || TEMPLATES.some((x) => x.title === t) ? tpl.title : t));
      setCourse(tpl.course);
    } else {
      setTitle((t) => (TEMPLATES.some((x) => x.title === t) ? "" : t));
    }
  }, [tpl]);

  const create = () => {
    const t = title.trim();
    if (!t) {
      setErr("問題を一言で書いてください");
      document.getElementById("np-title")?.focus();
      return;
    }
    const p = newProblem(t, course);
    if (tpl) applyTemplate(p, tpl);
    add(p);
    router.push(`/p/${p.id}`);
  };

  return (
    <>
      <Link className="back" href="/">‹ 戻る</Link>
      <section className="card">
        <p className="eyebrow">新しい問題</p>
        <h1 className="h1">何に困っていますか？</h1>

        <div className="field">
          <p className="lb">よくある悩みから選ぶ（任意）</p>
          <TemplateChips selected={tplId} />
          {tpl && (
            <p className="hint">「{tpl.label}」の下書き（{tpl.tree ? "原因の木つき" : "目的の例つき"}）が入った状態で始まります。自分の言葉に書き換えてOK。</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="np-title">問題を一言で</label>
          <input className="inp" id="np-title" maxLength={80} placeholder="例：朝起きられなくて1限に遅刻する" value={title}
            onChange={(e) => { setTitle(e.target.value); setErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) create(); }} />
          <p className="hint">うまく書けなくても大丈夫。1段階目で具体的にしていきます。</p>
        </div>

        <div className="field">
          <p className="lb">解き方（コース）</p>
          <div className="course">
            {(Object.keys(COURSES) as CourseId[]).map((c) => {
              const C = COURSES[c];
              return (
                <label key={c}>
                  <input type="radio" name="course" value={c} checked={course === c} onChange={() => setCourse(c)} />
                  <span>
                    <span className="nm">{C.name}</span><br />
                    <span className="small">{C.desc}</span><br />
                    <span className="fl">{C.steps.length}段階：{C.flow}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {err && <p className="need">{err}</p>}
        <button type="button" className="btn wide" onClick={create}>この問題を解きはじめる</button>
      </section>
    </>
  );
}
