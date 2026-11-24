-- Migration: 030_close_unresolved_predictions
-- Description: 予測トレーニングを「ニュース好/悪材料予測」型に転換するため、
--              旧形式 (日経平均終値依存) で未解決の prediction_results を一括クローズする。
--              旧形式の判定ロジックは削除済みのため、これらは再 reveal 不可能。
-- Created: 2026-06-13

UPDATE public.prediction_results
SET
  is_revealed = true,
  explanation = COALESCE(
    explanation,
    'システム仕様変更により判定不可（旧形式の予測のため、本日以降の予測トレーニングは新形式「ニュースの好/悪材料予測」に切り替わりました）'
  )
WHERE is_revealed = false;
