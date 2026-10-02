import type { MetadataRoute } from "next";

// iPhone・Android の「ホーム画面に追加」で、アプリのように開くための設定
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "トキカタ",
    short_name: "トキカタ",
    description: "フレームワークで、問題を1段ずつ解く",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EDF1EE",
    theme_color: "#0E7A5C",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
