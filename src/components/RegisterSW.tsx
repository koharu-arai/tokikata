"use client";
import { useEffect } from "react";

// ホーム画面に追加したときにアプリとして動かすための Service Worker を登録する(1.01 と同じ)
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);
  return null;
}
