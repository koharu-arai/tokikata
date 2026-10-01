# トキカタ — フレームワークで、問題を1段ずつ解く

自分の困りごとを書くと、5W1H・ロジックツリー・PDCA（企画なら PEST・3C・SWOT・STP・4P）に沿った「段階」が並び、
1つずつクリアして最後は TODO で実行するアプリです。

- フロント: Next.js 15 (App Router) + TypeScript → **Vercel**
- データ・認証: **Supabase**（Postgres / Auth / RLS）

---

## 機能

| 画面 | 内容 |
|---|---|
| 問題 | 今やる段階だけを1画面で表示。下のボタンでクリアして次へ。振り返り日・期限切れ・今日の予定をホームでお知らせ |
| 期限を決める | 1週間後／2週間後…をタップ → 残りの段階の目安日を自動で割り振り（最後が振り返り日） |
| 打ち手（4マス） | 行動を「まずやる／計画してやる／すきま時間に／やらない」に1タップで仕分け。やらない以外は自動で TODO |
| カレンダー | 期限・段階の目安日・振り返り日・TODO・作業の予定を月表示で |
| TODO | 全部の問題の TODO をまとめて表示 |
| 学ぶ | 10個のフレームワークを「名前の意味 → 日常の例 → ビジネスの例」で |
| テンプレート | 朝起きられない・お金が貯まらない・SNSを伸ばしたい など8つ |
| AIヒント（任意） | `ANTHROPIC_API_KEY` を入れると各段階に「AIにヒントをもらう」ボタン |

コース：日常（5W1H → 期限 → ロジックツリー → 打ち手 → PDCA）／企画（5W1H → 期限 → PEST → 3C → SWOT → STP → 4P → PDCA）

---

## 現在の構成

| 項目 | 内容 |
|---|---|
| GitHub | `koharu-arai/tokikata`（非公開） |
| Supabase | プロジェクト **kgu-app** に同居（1.01 と同じ）。テーブルは `tokikata_problems` だけで、ほかと名前が重ならない |
| ログイン | 1.01 と同じ「名前＋PIN」。同じ Supabase なので **1.01 のアカウントでそのまま入れる**。ログインせずに「この端末に保存」でも使える |
| 公開設定 | `.env.production`（Supabase URL と anon キー。どちらも公開前提の値） |
| サーバーの場所 | `vercel.json` で東京（`hnd1`） |
| ビルドチェック | GitHub Actions（`.github/workflows/build-check.yml`）で push のたびに型チェックとビルド |

## 最初の1回だけやること

1. **Supabase**：kgu-app の **SQL Editor** に `supabase/migrations/20261001000001_tokikata.sql` を貼って **Run**
2. **Vercel**：**Add New… → Project** → `koharu-arai/tokikata` を **Import** → **Deploy**
   （Supabase の値は `.env.production` に入っているので、Environment Variables の設定は不要）
3. iPhone の Safari で Vercel の URL を開く → 共有ボタン → **ホーム画面に追加**

AIヒントを使うときだけ、Vercel の **Settings → Environment Variables** に `ANTHROPIC_API_KEY` を入れて Redeploy。

## ローカルで動かす

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

## フォルダの中身

```
src/
  app/                 画面（URLごと）: / , /new , /p/[id] , /calendar , /todo , /learn , /login , /api/hint
  components/          画面の部品（HomeView, ProblemView など）
  lib/
    frameworks.ts      ★アプリの中身：フレームワーク・コース・段階・テンプレート
    logic.ts           段階の進み方・スケジュール・カレンダーの計算
    store.tsx          データの読み書き（Supabase または端末保存）
    username.ts        名前＋PIN → Supabase のログインID（1.01 と共通ルール）
supabase/migrations/   データベースの作り方
```

段階やテンプレートを増やしたいときは `src/lib/frameworks.ts` だけ直せばOK。
