// フレームワーク辞書・コース・段階・テンプレート。アプリの「中身」はここにまとまっています。
import type { CourseId, FieldKey, FwId, Problem, Quad, StepId } from "./types";
import { filled, need, todos } from "./core";
import { todayStr } from "./dates";

export const LECTURE_URL = "https://claude.ai/artifact/2npPJpjSJ3vF4ExZJLrTv4";

export interface FwDef {
  name: string;
  /** [頭文字, 英単語, 日本語] */
  letters: [string, string, string][];
  one: string;
  daily: string;
  biz: string;
  inapp: string;
}

export const FW: Record<FwId, FwDef> = {
  mece: {
    name: "MECE",
    letters: [["M", "Mutually", "お互いに"], ["E", "Exclusive", "重ならない"], ["C", "Collectively", "全部まとめると"], ["E", "Exhaustive", "漏れがない"]],
    one: "モレなく、ダブりなく分ける",
    daily: "服を「トップス・ボトムス・アウター・靴と小物」で分けると、どの服も1か所に入る。",
    biz: "お客さんを「10代・20代・30代…」で分けて集計する。「学生・会社員・女性」だとダブる。",
    inapp: "日常コース「原因を分ける」のチェック",
  },
  logic: {
    name: "ロジックツリー",
    letters: [["L", "Logic", "論理（筋道）"], ["T", "Tree", "木"]],
    one: "問題を枝分かれさせて、行動できるところまで掘る",
    daily: "お金が貯まらない → 収入が少ない／支出が多い → … → サブスクを見直す。",
    biz: "売上 ＝ 客数 × 客単価 に分けて、どこが下がったかを調べる。",
    inapp: "日常コース「原因を分ける」「打ち手を決める」",
  },
  w5h: {
    name: "5W1H",
    letters: [["W", "Who", "誰が"], ["W", "When", "いつ"], ["W", "Where", "どこで"], ["W", "What", "何を"], ["W", "Why", "なぜ"], ["H", "How", "どうやって"]],
    one: "6つの質問で、ぼんやりした話を具体的にする",
    daily: "「今度どっか行こ」→「11月の連休に、ゼミの4人で箱根に…」と誘うと話が進む。",
    biz: "上司への報告。いつ・誰が・何を・なぜ・どう対応したか、がそろうと相手が判断できる。",
    inapp: "両コースの1段階目",
  },
  pdca: {
    name: "PDCA",
    letters: [["P", "Plan", "計画"], ["D", "Do", "実行"], ["C", "Check", "評価"], ["A", "Act", "改善"]],
    one: "計画→実行→振り返り→改善をくり返して上達する",
    daily: "1日30単語覚える → 小テストで60% → 似た単語をセットで覚える。",
    biz: "コンビニの発注。雨予報で傘を多めに → 売上データで確認 → 次の発注を直す。",
    inapp: "「期限を決める」と最後の2段階",
  },
  pest: {
    name: "PEST",
    letters: [["P", "Politics", "政治・ルール"], ["E", "Economy", "経済・お金"], ["S", "Society", "社会・流行"], ["T", "Technology", "技術"]],
    one: "自分では変えられない、世の中の大きな流れを見る",
    daily: "天気予報。雨は止められないけど、傘は持っていける。",
    biz: "自動車メーカーが、排ガス規制・ガソリン代・車離れ・電気自動車の技術を見て計画を立てる。",
    inapp: "企画コース「世の中の流れを見る」",
  },
  ff: {
    name: "5フォース",
    letters: [["F", "Five", "5つの"], ["F", "Forces", "力"]],
    one: "その商売を儲かりにくくする5つの力を調べる",
    daily: "学園祭の屋台。ライバルの屋台、真似する他クラス、コンビニスイーツ、値切るお客さん、材料の値上げ。",
    biz: "航空会社はライバル・新幹線・比較サイト・機体メーカーの力が強く、儲けにくい。",
    inapp: "このアプリでは使いません（業界を調べたいときに）",
  },
  c3: {
    name: "3C",
    letters: [["C", "Customer", "顧客＝お客さん"], ["C", "Competitor", "競合＝ライバル"], ["C", "Company", "自社＝自分たち"]],
    one: "お客さん・ライバル・自分を見比べて、勝てる場所を探す",
    daily: "クレープ屋台。映えを求める中高生、行列のタピオカ屋、お菓子作りが得意なメンバー → 並ばず買える一口クレープ。",
    biz: "コンビニコーヒー。安くすぐ飲みたい人、高いカフェと淹れたてでない缶コーヒー、店がどこにでもある強み。",
    inapp: "企画コース「勝てる場所を探す」",
  },
  swot: {
    name: "SWOT",
    letters: [["S", "Strengths", "強み"], ["W", "Weaknesses", "弱み"], ["O", "Opportunities", "機会＝チャンス"], ["T", "Threats", "脅威＝ピンチ"]],
    one: "強み・弱み・チャンス・ピンチを4マスで整理して、かけ合わせる",
    daily: "テスト前の自分。英語が得意／朝が弱い／範囲が狭い／バイトが多い。",
    biz: "駅前の本屋。店員のおすすめ力×「偶然の出会い」ブーム → 手書きのおすすめ札とイベント。",
    inapp: "企画コース「整理して作戦を出す」",
  },
  stp: {
    name: "STP",
    letters: [["S", "Segmentation", "グループに分ける"], ["T", "Targeting", "狙いを定める"], ["P", "Positioning", "立ち位置を決める"]],
    one: "お客さんを分けて、狙う相手を決め、かぶらない立ち位置をとる",
    daily: "「みんなに売りたい」クレープは誰にも刺さらない。中高生に絞って「安くて映える」へ。",
    biz: "コンビニコーヒーは「安く早く」、スターバックスは「第3の居場所」。同じコーヒーでも立ち位置が違う。",
    inapp: "企画コース「狙う相手を決める」",
  },
  p4: {
    name: "4P",
    letters: [["P", "Product", "製品＝何を"], ["P", "Price", "価格＝いくらで"], ["P", "Place", "流通＝どこで"], ["P", "Promotion", "販売促進＝どう知らせる"]],
    one: "何を・いくらで・どこで・どう知らせて売るかを、同じ向きにそろえる",
    daily: "一口クレープ・400円・正門からの通り道・インスタで告知。全部「中高生」に向ける。",
    biz: "ハンバーガーチェーン。すぐ出るセット・手頃な値段・ドライブスルー・CMとクーポン。",
    inapp: "企画コース「具体的な作戦にする」",
  },
};

export const FW_ORDER: FwId[] = ["mece", "logic", "w5h", "pdca", "pest", "ff", "c3", "swot", "stp", "p4"];

export interface CourseDef {
  name: string;
  flow: string;
  desc: string;
  steps: StepId[];
}

export const COURSES: Record<CourseId, CourseDef> = {
  daily: {
    name: "日常の問題",
    flow: "5W1H → 期限 → ロジックツリー → 打ち手 → PDCA",
    desc: "朝起きられない、お金が貯まらない、部屋が片づかない…自分の困りごとを解く",
    steps: ["define", "sched", "cause", "action", "plan", "review"],
  },
  biz: {
    name: "企画・作戦",
    flow: "5W1H → 期限 → PEST → 3C → SWOT → STP → 4P → PDCA",
    desc: "SNSを伸ばしたい、アプリを使ってもらいたい…相手がいる目標の作戦を立てる",
    steps: ["goal", "sched", "pest", "c3", "swot", "stp", "p4", "plan", "review"],
  },
};

export interface FieldItem {
  k: string;
  l: string;
  ph: string;
  multi?: boolean;
  /** 任意の欄は「もっと書く」に折りたたむ */
  opt?: boolean;
}

export type Block =
  | { t: "fields"; key: FieldKey; items: FieldItem[]; grid?: boolean; title?: string }
  | { t: "deadline" }
  | { t: "tree" }
  | { t: "mece" }
  | { t: "focus" }
  | { t: "actions"; label: string; hint: string; num?: string }
  | { t: "todos" }
  | { t: "history" };

export interface StepDef {
  title: string;
  fw: FwId[];
  sub?: string;
  lead: string;
  ex: { d: string; b: string };
  blocks: Block[];
  /** クリアできれば null、できなければ理由 */
  req: (p: Problem) => string | null;
}

export const STEPS: Record<StepId, StepDef> = {
  define: {
    title: "問題をはっきりさせる", fw: ["w5h"],
    lead: "ぼんやりした悩みを、6つの質問で具体的にします。書くだけで半分解けることもあります。",
    ex: { d: "「朝起きられない」→ 1限がある平日の朝に(When)、アラームを止めて二度寝する(What)。遅刻で単位が危ない(Why)。", b: "トラブル報告も同じ。いつ・誰が・何を・なぜ、がそろうと周りが動ける。" },
    blocks: [{ t: "fields", key: "w", items: [
      { k: "what", l: "What｜何に困ってる？", ph: "例：アラームを止めて二度寝してしまう", multi: true },
      { k: "when", l: "When｜いつ起きる？", ph: "例：1限がある平日の朝" },
      { k: "why", l: "Why｜なぜ解決したい？", ph: "例：遅刻が続いて単位が危ない", multi: true },
      { k: "where", l: "Where｜どこで？", ph: "例：自分の部屋", opt: true },
      { k: "who", l: "Who｜誰が関係してる？", ph: "例：自分だけ", opt: true },
      { k: "how", l: "How｜今はどうしてる？", ph: "例：アラームを5個かけている", opt: true },
    ] }],
    req: (p) => need(p.w, ["what", "when", "why"], "What・When・Why の3つを書くとクリアできます"),
  },
  goal: {
    title: "目的をはっきりさせる", fw: ["w5h"],
    lead: "何を、いつまでに、誰に向けて達成したいのかを6つの質問で決めます。",
    ex: { d: "学園祭のクレープ屋：当日(When)、来場者の中高生に(Who)、100個売り切りたい(What)。", b: "新商品の企画書も最初に5W1H。目的がぶれると後の分析が全部ぶれる。" },
    blocks: [{ t: "fields", key: "w", items: [
      { k: "what", l: "What｜何を達成したい？（数字があると◎）", ph: "例：3か月でフォロワーを1,000人にする", multi: true },
      { k: "when", l: "When｜いつまでに？", ph: "例：12月末まで" },
      { k: "who", l: "Who｜誰に向けて？", ph: "例：20代の学生" },
      { k: "where", l: "Where｜どこで？（場所・サービス）", ph: "例：Instagram", opt: true },
      { k: "why", l: "Why｜なぜやる？", ph: "例：発信する力をつけたい", multi: true, opt: true },
      { k: "how", l: "How｜今はどうしてる？", ph: "例：週1回なんとなく投稿している", opt: true },
    ] }],
    req: (p) => need(p.w, ["what", "when", "who"], "What・When・Who の3つを書くとクリアできます"),
  },
  sched: {
    title: "期限を決める", fw: ["pdca"], sub: "PDCAのP（計画）の準備",
    lead: "問題がはっきりしたので、いつまでに解決するかを決めます。残りの段階の目安日は自動で割り振り、カレンダーに載ります。",
    ex: { d: "「2週間後に遅刻0回」と決めると、原因を考える日・試す日・振り返る日が自然に決まる。", b: "仕事では「締切から逆算」が基本。先に納期を決め、途中の目安（マイルストーン）を置く。" },
    blocks: [{ t: "deadline" }],
    req: (p) => {
      const d = p.sched?.deadline;
      if (!d) return "期限を決めるとクリアできます";
      return d > todayStr() ? null : "期限は明日以降の日付にしてください";
    },
  },
  cause: {
    title: "原因を分ける", fw: ["logic", "mece"],
    lead: "「なぜ？」をくり返して、原因を枝分かれさせます。1段目はモレなく・ダブりなく。",
    ex: { d: "二度寝する → 夜ふかし／朝の環境／起きる理由が弱い。夜ふかし → 寝る直前までスマホ、課題を夜にやる。", b: "売上が下がった → 客数／客単価。客数 → 新規客／リピーター。" },
    blocks: [{ t: "tree" }, { t: "mece" }],
    req: (p) => ((p.tree ?? []).filter((b) => filled(b.text)).length >= 2 ? null : "大きな原因を2つ以上書くとクリアできます"),
  },
  action: {
    title: "打ち手を決める", fw: ["logic"], sub: "＋ 効果×やりやすさ",
    lead: "一番効きそうな原因を1つ選び、「今日からできる行動」をいくつか出して、4マスで仕分けます。",
    ex: { d: "原因「寝る直前までスマホ」→ 行動「23時にスマホを机で充電する」（効果大・簡単＝まずやる）。", b: "原因「リピーターが減った」→「アプリのクーポン」は効果大・簡単、「店の改装」は効果大・大変＝計画してやる。" },
    blocks: [{ t: "focus" }, { t: "actions", num: "② ", label: "行動を出して、4マスに置く", hint: "やることが目に浮かぶくらい具体的に。それぞれ4マスのどこに入るか1回タップします。" }],
    req: (p) => {
      if (!p.focus) return "狙う原因を1つ選ぶとクリアできます";
      return todos(p).length ? null : "行動を1つ以上、4マスの「やらない」以外に置くとクリアできます";
    },
  },
  pest: {
    title: "世の中の流れを見る", fw: ["pest"],
    lead: "自分では変えられない外の流れを4つの目で。見つけたら「チャンス？ピンチ？」まで考えます。",
    ex: { d: "学園祭：火を使う屋台は申請が必要(P)、卵が値上がり(E)、映えスイーツが人気(S)、スマホ決済が当たり前(T)。", b: "自動車メーカー：排ガス規制(P)、ガソリン代(E)、車離れ(S)、電気自動車(T)。" },
    blocks: [{ t: "fields", key: "pest", grid: true, items: [
      { k: "p", l: "P｜政治・ルール", ph: "例：サービスの規約や法律の変化", multi: true },
      { k: "e", l: "E｜経済・お金", ph: "例：物価が上がって財布のひもが固い", multi: true },
      { k: "s", l: "S｜社会・流行", ph: "例：短い動画が見られやすい", multi: true },
      { k: "t", l: "T｜技術", ph: "例：AIで画像や動画が簡単に作れる", multi: true },
    ] }],
    req: (p) => {
      const o = p.pest ?? {};
      return ["p", "e", "s", "t"].filter((k) => filled(o[k])).length >= 2 ? null : "4つのうち2つ以上書くとクリアできます";
    },
  },
  c3: {
    title: "勝てる場所を探す", fw: ["c3"],
    lead: "お客さん・ライバル・自分たちを見比べて、「自分だけが出せる価値」を探します。",
    ex: { d: "クレープ屋台：映えたい中高生／高いタピオカ屋／お菓子作りが得意 → 並ばず買える一口クレープ。", b: "コンビニコーヒー：安くすぐ飲みたい人／高いカフェと缶コーヒー／店がどこにでもある → 100円台の淹れたて。" },
    blocks: [{ t: "fields", key: "c3", items: [
      { k: "customer", l: "Customer｜お客さんは何を求めてる？", ph: "例：スキマ時間に笑える話を見たい", multi: true },
      { k: "competitor", l: "Competitor｜ライバルは？その弱点は？", ph: "例：大手のまとめアカウント。情報が多すぎて雑", multi: true },
      { k: "company", l: "Company｜自分たちの得意なこと・持っているもの", ph: "例：英語のニュースを読める、毎日続けられる", multi: true },
      { k: "win", l: "→ 勝ちポイント（お客さんが欲しくて、自分ができて、ライバルができないこと）", ph: "例：海外の小ネタを1枚でサクッと読める", multi: true },
    ] }],
    req: (p) => need(p.c3, ["customer", "competitor", "company", "win"], "4つすべて書くとクリアできます"),
  },
  swot: {
    title: "整理して作戦を出す", fw: ["swot"],
    lead: "ここまでの材料を4マスに整理し、かけ合わせて作戦にします。内部＝自分で変えられる、外部＝変えられない。",
    ex: { d: "テスト前：英語が得意(S)／朝が弱い(W)／範囲が狭い(O)／バイトが多い(T)。", b: "駅前の本屋：おすすめ力(S)×「偶然の出会い」ブーム(O) → 手書きのおすすめ札とトークイベント。" },
    blocks: [
      { t: "fields", key: "swot", grid: true, items: [
        { k: "s", l: "S｜強み（内部・プラス）", ph: "例：英語が読める", multi: true },
        { k: "w", l: "W｜弱み（内部・マイナス）", ph: "例：デザインが苦手", multi: true },
        { k: "o", l: "O｜チャンス（外部・プラス）", ph: "例：短い動画が伸びやすい", multi: true },
        { k: "t", l: "T｜ピンチ（外部・マイナス）", ph: "例：似たアカウントが増えている", multi: true },
      ] },
      { t: "fields", key: "swot", title: "かけ合わせ（クロスSWOT）1つ以上", grid: true, items: [
        { k: "so", l: "S×O｜強みでチャンスをつかむ", ph: "例：海外ニュースを短いリールにする", multi: true },
        { k: "wt", l: "W×T｜最悪を避ける", ph: "例：投稿の型を1つに絞る", multi: true },
        { k: "wo", l: "W×O｜チャンスで弱みを補う", ph: "例：テンプレートでデザインを統一", multi: true, opt: true },
        { k: "st", l: "S×T｜強みでピンチをかわす", ph: "例：日本で報道されていない話だけ選ぶ", multi: true, opt: true },
      ] },
    ],
    req: (p) => {
      const o = p.swot ?? {};
      if (need(o, ["s", "w", "o", "t"], "x")) return "S・W・O・T の4つを書くとクリアできます";
      return ["so", "wo", "st", "wt"].some((k) => filled(o[k])) ? null : "かけ合わせの作戦を1つ以上書くとクリアできます";
    },
  },
  stp: {
    title: "狙う相手を決める", fw: ["stp"],
    lead: "「みんな」ではなく、誰に届けるかを決めて、ライバルとかぶらない立ち位置を取ります。",
    ex: { d: "クレープ：家族連れ／中高生／大学生／卒業生 → 中高生に絞り「安くて映える」。", b: "コンビニコーヒーは「安く早く」派、スターバックスは「ゆっくり過ごしたい」派。" },
    blocks: [{ t: "fields", key: "stp", items: [
      { k: "seg", l: "S｜お客さんをグループに分けると？", ph: "例：暇つぶし派／勉強になる派／話のネタ派", multi: true },
      { k: "target", l: "T｜狙うのはどのグループ？なぜ？", ph: "例：話のネタ派。シェアしてくれるから", multi: true },
      { k: "pos", l: "P｜ライバルとかぶらない立ち位置は？", ph: "例：「1枚で読めて、誰かに話したくなる」", multi: true },
    ] }],
    req: (p) => need(p.stp, ["target", "pos"], "T と P を書くとクリアできます"),
  },
  p4: {
    title: "具体的な作戦にする", fw: ["p4"],
    lead: "何を・いくらで・どこで・どう知らせるかを、狙う相手に向けてそろえます。最後に行動に変えます。",
    ex: { d: "一口クレープ(Product)・400円(Price)・正門からの通り道(Place)・インスタで告知(Promotion)。", b: "ハンバーガーチェーン：すぐ出るセット・手頃な値段・ドライブスルー・CMとクーポン。" },
    blocks: [
      { t: "fields", key: "p4", grid: true, items: [
        { k: "product", l: "Product｜何を出す？", ph: "例：1枚画像＋短いリール", multi: true },
        { k: "price", l: "Price｜いくらで？（無料なら手間や時間）", ph: "例：無料。見るのに10秒", multi: true },
        { k: "place", l: "Place｜どこで届ける？", ph: "例：Instagramのリールと保存用の投稿", multi: true },
        { k: "promotion", l: "Promotion｜どう知らせる？", ph: "例：毎日21時に投稿、ハッシュタグを固定", multi: true },
      ] },
      { t: "actions", label: "作戦を行動にして、4マスに置く", hint: "4Pから「実際にやること」を書き出し、4マスのどこに入るか1回タップします。" },
    ],
    req: (p) => {
      if (need(p.p4, ["product", "price", "place", "promotion"], "x")) return "4つすべて書くとクリアできます";
      return todos(p).length ? null : "行動を1つ以上、4マスの「やらない」以外に置くとクリアできます";
    },
  },
  plan: {
    title: "やってみる", fw: ["pdca"], sub: "PDCAの P（計画）と D（実行）",
    lead: "目標を数字で決めて、TODOを実行します。1つでも終わったらクリアです。",
    ex: { d: "目標「2週間で遅刻0回」→ TODO「23時にスマホを机に置く」を毎日やる。", b: "コンビニ：「雨の日は傘を20本」と決めて発注し、店頭に並べる。" },
    blocks: [
      { t: "fields", key: "plan", items: [
        { k: "goal", l: "Plan｜目標（数字で）", ph: "例：2週間で遅刻0回" },
        { k: "period", l: "メモ（やり方・続け方）", ph: "例：毎晩23時にアラームを鳴らす", opt: true },
      ] },
      { t: "todos" },
    ],
    req: (p) => {
      if (!filled(p.plan?.goal)) return "目標を書くとクリアできます";
      return todos(p).some((a) => a.done) ? null : "TODOを1つ以上完了させるとクリアできます";
    },
  },
  review: {
    title: "振り返って直す", fw: ["pdca"], sub: "PDCAの C（評価）と A（改善）",
    lead: "結果を数字で確かめて、次にどう変えるかを決めます。解決していなければ、もう1周まわします。",
    ex: { d: "遅刻2回、月曜だけ失敗 → 日曜の夜だけ早めにスマホを置く。", b: "コンビニ：傘は完売、おでんは余った → 次は曜日も見て発注する。" },
    blocks: [
      { t: "fields", key: "rev", items: [
        { k: "result", l: "Check｜結果は？（数字で）", ph: "例：遅刻2回。月曜だけ失敗した", multi: true },
        { k: "next", l: "Act｜次にどう変える？", ph: "例：日曜だけ22時半にスマホを置く", multi: true },
        { k: "good", l: "うまくいったこと", ph: "例：スマホを机に置くと早く寝られた", multi: true, opt: true },
        { k: "bad", l: "うまくいかなかったこと", ph: "例：日曜の夜は寝るのが遅い", multi: true, opt: true },
      ] },
      { t: "history" },
    ],
    req: (p) => need(p.rev, ["result", "next"], "結果（Check）と次の手（Act）を書くと進めます"),
  },
};

export const QUADS: [Quad, string, string][] = [
  ["best", "まずやる", "効果大・簡単"],
  ["plan", "計画してやる", "効果大・大変"],
  ["spare", "すきま時間に", "効果小・簡単"],
  ["skip", "やらない", "効果小・大変"],
];

export interface Template {
  id: string;
  course: CourseId;
  label: string;
  title: string;
  w: Record<string, string>;
  tree?: { text: string; kids: string[] }[];
}

const T = (text: string, kids: string[]) => ({ text, kids });

export const TEMPLATES: Template[] = [
  { id: "wake", course: "daily", label: "朝起きられない", title: "朝起きられず1限に遅刻する", w: { what: "アラームを止めて二度寝してしまう", when: "1限がある平日の朝" },
    tree: [T("夜ふかししている", ["寝る直前までスマホを見る", "課題を夜にまとめてやる"]), T("朝の環境", ["アラームが枕元にある", "部屋が暗いまま"]), T("起きる理由が弱い", ["1限の授業がつらい"])] },
  { id: "money", course: "daily", label: "お金が貯まらない", title: "お金が貯まらない", w: { what: "毎月ほとんどお金が残らない" },
    tree: [T("収入が少ない", ["時給が低い", "シフトが少ない"]), T("固定費が高い", ["サブスクが多い", "スマホ代が高い"]), T("ついで買いが多い", ["コンビニに寄る", "ネットのセールで買う"])] },
  { id: "task", course: "daily", label: "課題が終わらない", title: "課題がいつも締切ギリギリになる", w: { what: "課題を締切直前まで始められない" },
    tree: [T("始めるのが遅い", ["何からやるか分からない", "締切を把握していない"]), T("集中できない", ["スマホの通知", "作業する場所が悪い"]), T("量が多すぎる", ["バイトとかぶる", "授業を取りすぎ"])] },
  { id: "room", course: "daily", label: "部屋が片づかない", title: "部屋が片づかない", w: { what: "床に物が置きっぱなしになる" },
    tree: [T("物が多い", ["使わない物を捨てられない", "つい買ってしまう"]), T("しまう場所がない", ["定位置が決まっていない", "収納が足りない"]), T("片づける時間がない", ["疲れてやる気が出ない"])] },
  { id: "pr", course: "daily", label: "自己PRが書けない", title: "就活の自己PRが書けない", w: { what: "自己PRの文章が1行も進まない" },
    tree: [T("材料が足りない", ["経験を思い出せていない", "強みが分からない"]), T("書き方が分からない", ["型を知らない", "結論から書けていない"]), T("自信がない", ["他の人と比べてしまう"])] },
  { id: "sns", course: "biz", label: "SNSを伸ばしたい", title: "SNSのフォロワーを増やしたい", w: { what: "3か月でフォロワーを1,000人にする", where: "Instagram" } },
  { id: "app", course: "biz", label: "作ったアプリを使ってほしい", title: "作ったアプリを使ってもらいたい", w: { what: "1か月で友達・同級生30人に使ってもらう" } },
  { id: "fes", course: "biz", label: "模擬店を成功させたい", title: "学園祭の模擬店で売上を上げたい", w: { what: "当日に100個売り切る", when: "学園祭当日" } },
];
