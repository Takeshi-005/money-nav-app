"use client";

import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { DiagnosisTypesShowcase } from "./DiagnosisTypesShowcase";
import { DiagnosisFaq } from "./DiagnosisFaq";

interface Props {
  onStart: () => void;
}

const PAIN_POINTS = [
  "投資を始めたいけど、何から手を付ければいいか分からない",
  "ネットの投資情報が多すぎて、自分に合うものが選べない",
  "周りに流されて損失を出した経験がある",
  "自分の投資スタイルが本当に正しいのか不安",
];

const FEATURE_CARDS = [
  {
    icon: "💰",
    title: "完全無料",
    body: "登録もメールアドレスも不要。気軽に診断を試せます。",
  },
  {
    icon: "⏱️",
    title: "5分で完了",
    body: "9つの質問に答えるだけ。難しい知識は一切不要です。",
  },
  {
    icon: "🎯",
    title: "8タイプから診断",
    body: "世界的に有名な投資家の哲学に基づいて、あなたに合うタイプを判定します。",
  },
];

const SAMPLE_QUESTION = {
  question: "Q. 株価が大きく下がった時、あなたならどうしますか？",
  options: [
    "下げ止まりを待ってから判断する",
    "もっと買い増しのチャンスだと考える",
    "損失が拡大する前に売る",
    "原因を冷静に調べてから決める",
  ],
};

export function DiagnosisLanding({ onStart }: Props) {
  return (
    <article className="pb-12">
      {/* Hero */}
      <section className="pt-12 pb-10 text-center max-w-2xl mx-auto px-4">
        <Typography
          variant="title_L"
          as="h1"
          className="text-3xl md:text-4xl mb-4 text-foreground"
        >
          AI投資スタイル診断
        </Typography>
        <Typography
          variant="L"
          className="text-(--text-secondary) max-w-xl mx-auto mb-6"
        >
          9つの質問に答えるだけで、あなたに最適な投資スタイルを8タイプから診断します。
          <span className="block mt-2 text-brand-600 font-medium">
            完全無料・登録不要・5分で完了
          </span>
        </Typography>
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "inline-block w-full max-w-md py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02]",
            "bg-gradient-brand text-white",
          )}
        >
          無料で診断を始める →
        </button>
        <Typography
          variant="caution"
          className="text-(--text-tertiary) mt-3"
        >
          ※会員登録不要・所要時間5分
        </Typography>
      </section>

      {/* Pain Points */}
      <section
        aria-labelledby="pain-heading"
        className="py-10 md:py-14 bg-surface-secondary"
      >
        <div className="max-w-2xl mx-auto px-4">
          <Typography
            variant="title_S"
            as="h2"
            id="pain-heading"
            className="text-center mb-6"
          >
            こんなお悩みはありませんか？
          </Typography>
          <ul className="space-y-3">
            {PAIN_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 p-4 rounded-xl bg-(--bg-primary) border border-(--border-primary)"
              >
                <span aria-hidden="true" className="text-brand-500 shrink-0 mt-0.5">
                  ✓
                </span>
                <Typography
                  variant="M"
                  className="text-(--text-secondary) leading-relaxed"
                >
                  {point}
                </Typography>
              </li>
            ))}
          </ul>
          <Typography
            variant="M"
            className="text-(--text-secondary) text-center mt-6 max-w-xl mx-auto leading-relaxed"
          >
            自分の「投資スタイル」を知ることで、流されない判断軸が手に入ります。
          </Typography>
        </div>
      </section>

      {/* What is */}
      <section
        aria-labelledby="about-heading"
        className="py-12 md:py-16"
      >
        <div className="max-w-2xl mx-auto px-4">
          <Typography
            variant="title_S"
            as="h2"
            id="about-heading"
            className="text-center mb-6"
          >
            AI投資スタイル診断とは
          </Typography>
          <Typography
            variant="M"
            className="text-(--text-secondary) leading-relaxed mb-4"
          >
            「AI投資スタイル診断」は、9つの質問への回答からAIがあなたの投資への考え方・リスク許容度・情報収集スタイルを分析し、
            <span className="font-bold text-foreground">
              バフェット・リンチ・グレアム・ボーグルなど世界的に著名な投資家の哲学を当てはめて、8タイプから最適な投資スタイル
            </span>
            を判定するサービスです。
          </Typography>
          <Typography
            variant="M"
            className="text-(--text-secondary) leading-relaxed"
          >
            診断結果では、あなたのタイプの「強み」「注意点」「学習ステップ」「推奨書籍」までを提示。
            投資判断を強要するのではなく、
            <span className="font-bold text-foreground">
              「自分の判断軸を見つけ、続けられる投資スタイル」
            </span>
            を発見することを目的としています。
          </Typography>
        </div>
      </section>

      {/* Features */}
      <section
        aria-labelledby="features-heading"
        className="py-12 md:py-16 bg-surface-secondary"
      >
        <div className="max-w-3xl mx-auto px-4">
          <Typography
            variant="title_S"
            as="h2"
            id="features-heading"
            className="text-center mb-8"
          >
            3つの特徴
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="p-6 rounded-2xl bg-(--bg-primary) border border-(--border-primary) text-center"
              >
                <div className="text-4xl mb-3" aria-hidden="true">
                  {card.icon}
                </div>
                <Typography variant="L_bold" as="h3" className="mb-2">
                  {card.title}
                </Typography>
                <Typography
                  variant="S"
                  className="text-(--text-secondary) leading-relaxed"
                >
                  {card.body}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Types */}
      <DiagnosisTypesShowcase />

      {/* Sample Question */}
      <section
        aria-labelledby="sample-heading"
        className="py-12 md:py-16"
      >
        <div className="max-w-2xl mx-auto px-4">
          <Typography
            variant="title_S"
            as="h2"
            id="sample-heading"
            className="text-center mb-6"
          >
            診断質問のサンプル
          </Typography>
          <div className="p-6 rounded-2xl bg-surface-secondary border border-(--border-primary)">
            <Typography variant="L_bold" className="mb-4">
              {SAMPLE_QUESTION.question}
            </Typography>
            <ul className="space-y-2">
              {SAMPLE_QUESTION.options.map((option) => (
                <li
                  key={option}
                  className="p-3 rounded-xl bg-(--bg-primary) border border-(--border-primary)"
                >
                  <Typography variant="S" className="text-(--text-secondary)">
                    {option}
                  </Typography>
                </li>
              ))}
            </ul>
            <Typography
              variant="caution"
              className="text-(--text-tertiary) text-center mt-4"
            >
              ※あくまでサンプルです。実際の診断では9問に回答していただきます。
            </Typography>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <DiagnosisFaq />

      {/* Final CTA */}
      <section className="py-12 text-center max-w-2xl mx-auto px-4">
        <Typography variant="title_S" as="h2" className="mb-4">
          さっそく診断を始めましょう
        </Typography>
        <Typography
          variant="M"
          className="text-(--text-secondary) mb-6 max-w-xl mx-auto"
        >
          会員登録不要・所要時間5分。あなたに最適な投資スタイルを見つけてください。
        </Typography>
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "inline-block w-full max-w-md py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02]",
            "bg-gradient-brand text-white",
          )}
        >
          無料で診断を始める →
        </button>
      </section>
    </article>
  );
}
