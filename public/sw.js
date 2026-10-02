// Service Worker — ホーム画面に追加したとき、アプリとして動かすための土台(1.01 と同じ構成)
// 通知などを足すときは、このファイルに処理を追加する
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
