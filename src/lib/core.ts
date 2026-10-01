import type { Action, Fields, Problem } from "./types";

export function filled(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** keys がすべて書かれていれば null、足りなければ msg を返す */
export function need(obj: Fields | undefined, keys: string[], msg: string): string | null {
  const o = obj ?? {};
  for (const k of keys) if (!filled(o[k])) return msg;
  return null;
}

/** TODOになっている行動（前の周で片づけたものは除く） */
export function todos(p: Problem): Action[] {
  return (p.actions ?? []).filter((a) => a.todo && !a.archived && filled(a.text));
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
