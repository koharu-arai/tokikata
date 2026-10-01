"use client";
import { useEffect, useState } from "react";
import type { FwId } from "@/lib/types";
import { FW, FW_ORDER, LECTURE_URL } from "@/lib/frameworks";

export default function LearnView() {
  const [open, setOpen] = useState<FwId | null>(null);

  // /learn#fw-pest のように来たら、そのフレームワークを開いてスクロール
  useEffect(() => {
    const h = window.location.hash.replace("#fw-", "") as FwId;
    if (h && FW[h]) {
      setOpen(h);
      setTimeout(() => document.getElementById(`fw-${h}`)?.scrollIntoView({ block: "start" }), 50);
    }
  }, []);

  return (
    <>
      <div className="hero">
        <p className="eyebrow">学ぶ</p>
        <h1 className="h1">フレームワーク10個</h1>
        <p className="small muted">
          名前の意味 → 日常の例 → ビジネスの例。どの段階で使うかも書いてあります。
          <a className="lk" href={LECTURE_URL} target="_blank" rel="noopener noreferrer">図つきの講義ページ（第1回）</a>
        </p>
      </div>
      <div className="fwl">
        {FW_ORDER.map((k, i) => {
          const f = FW[k];
          const isOpen = open === k;
          return (
            <section className="fwc" id={`fw-${k}`} key={k}>
              <button type="button" className="fwc-sum" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : k)}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="tt"><span className="nm">{f.name}</span><span className="one">{f.one}</span></span>
                <span className="chev" aria-hidden>{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen && (
                <div className="fwb">
                  <div className="letters">
                    {f.letters.map(([l, word, ja], j) => (
                      <div key={j}><b>{l}</b>{word.slice(1)}<span>{ja}</span></div>
                    ))}
                  </div>
                  <div className="ex2">
                    <p><b>日常</b>{f.daily}</p>
                    <p><b className="bz">ビジネス</b>{f.biz}</p>
                  </div>
                  <p className="inapp">このアプリでは：{f.inapp}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
