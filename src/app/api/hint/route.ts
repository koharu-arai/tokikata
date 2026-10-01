// AIヒント：ANTHROPIC_API_KEY があるときだけ使えます。キーはサーバー側だけで使い、ブラウザには渡しません。
import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function GET() {
  return Response.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "AIヒントは設定されていません" }, { status: 404 });

  // Supabase を使っているときは、ログインしている人だけが使えるようにする（他人にキーを使われないため）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return Response.json({ error: "ログインすると使えます" }, { status: 401 });
    const { data, error } = await createClient(url, anon).auth.getUser(token);
    if (error || !data.user) return Response.json({ error: "ログインし直してください" }, { status: 401 });
  }

  let prompt = "";
  try {
    const body = (await req.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 6000) : "";
  } catch {
    /* 下で弾く */
  }
  if (!prompt) return Response.json({ error: "内容が空です" }, { status: 400 });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) {
    const status = r.status === 429 ? 429 : 502;
    return Response.json({ error: status === 429 ? "混み合っています。少し時間をおいてもう一度押してください。" : "ヒントを取得できませんでした。もう一度押してください。" }, { status });
  }
  const j = (await r.json()) as { content?: { type: string; text?: string }[] };
  const text = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
  return Response.json({ text: text || "ヒントが空でした。もう一度押してください。" });
}
