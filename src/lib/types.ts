// トキカタのデータの形。1つの問題（Problem）が1件のデータとして保存されます。

export type CourseId = "daily" | "biz";

export type StepId =
  | "define" | "goal" | "sched" | "cause" | "action"
  | "pest" | "c3" | "swot" | "stp" | "p4"
  | "plan" | "review";

export type FwId = "mece" | "logic" | "w5h" | "pdca" | "pest" | "ff" | "c3" | "swot" | "stp" | "p4";

/** 効果×やりやすさの4マス */
export type Quad = "best" | "plan" | "spare" | "skip";

export type Fields = Record<string, string>;

/** 入力欄のまとまり（p.w や p.swot など） */
export type FieldKey = "w" | "pest" | "c3" | "swot" | "stp" | "p4" | "plan" | "rev";

export interface TreeNode {
  id: string;
  text: string;
  kids?: TreeNode[];
}

export interface Action {
  id: string;
  text: string;
  todo: boolean;
  done: boolean;
  /** 期限（YYYY-MM-DD）。空なら未設定 */
  due: string;
  q?: Quad | null;
  /** もう1周まわしたときに、前の周で完了したものを隠す */
  archived?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
}

export interface HistoryItem {
  cycle: number;
  goal: string;
  result: string;
  next: string;
  at: number;
}

export interface Problem {
  id: string;
  title: string;
  course: CourseId;
  status: "active" | "solved";
  cycle: number;
  createdAt: number;
  updatedAt: number;
  cleared: Partial<Record<StepId, boolean>>;
  w: Fields;
  pest?: Fields;
  c3?: Fields;
  swot?: Fields;
  stp?: Fields;
  p4?: Fields;
  plan: Fields;
  rev: Fields;
  tree: TreeNode[];
  mece: { dup?: boolean; miss?: boolean };
  focus: string | null;
  actions: Action[];
  history: HistoryItem[];
  sched: { deadline?: string; steps: Partial<Record<StepId, string>> };
  events: EventItem[];
}
