// 1.01 と同じ Supabase プロジェクト(kgu-app)のアカウントを使うので、名前＋PIN の変換ルールも 1.01 と同じにしています。
// ログインはメールアドレスではなく「ユーザー名」で行う。
// Supabase Auth はメール形式のIDが必要なので、ユーザー名を内部用のダミーアドレスに変換する。
// .invalid は「絶対に存在しないドメイン」として予約されているので、メールが誰かに届くことはない。
export const LOGIN_DOMAIN = "daily101.invalid";

// ログインは「名前＋PIN(4〜8桁の数字)」。
// Supabase はパスワード6文字以上が必須なので、PIN の後ろに固定の文字を足してパスワードにする。
// 例: PIN が 1234 → Supabase 上のパスワードは「1234-d101」(管理者がユーザーを作るときはこの形で入れる)
export const PIN_SUFFIX = "-d101";
export const PIN_PATTERN = "[0-9]{4,8}";

export function pinToPassword(pin: string): string {
  return `${pin.trim()}${PIN_SUFFIX}`;
}

/** 入力されたユーザー名を Supabase 用のIDに変換(@ を含む場合は昔のメールアドレスとしてそのまま使う) */
export function toLoginEmail(input: string): string {
  const s = input.trim().toLowerCase();
  return s.includes("@") ? s : `${s}@${LOGIN_DOMAIN}`;
}

/** 画面表示用: ダミーアドレスならユーザー名部分だけを返す */
export function displayName(email: string | null | undefined): string {
  if (!email) return "";
  const suffix = `@${LOGIN_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}
