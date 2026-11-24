"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header, PageHeader } from "@/widgets/header";
import { SiteFooter } from "@/widgets/site-footer";
import { useDiagnosisFlow } from "@/features/diagnosis-flow";
import { DiagnosisQuestionForm } from "@/widgets/diagnosis-question-form";
import { DiagnosisResult } from "@/widgets/diagnosis-result";
import { DiagnosisLoading, DiagnosisError } from "@/widgets/diagnosis-loading";
import { DiagnosisLanding } from "./DiagnosisLanding";

function getHeaderTitle(state: {
  result: boolean;
  isLoading: boolean;
  error: boolean;
}): string {
  if (state.result) {
    return "診断結果";
  }
  if (state.isLoading) {
    return "診断中";
  }
  if (state.error) {
    return "エラー";
  }
  return "投資スタイル診断";
}

export function DiagnosisPage() {
  const searchParams = useSearchParams();
  const skipLanding = searchParams.get("start") === "true";
  const [landingDismissed, setLandingDismissed] = useState(false);

  const {
    step,
    result,
    isLoading,
    error,
    handleSelect,
    handleBack,
    handleRetry,
  } = useDiagnosisFlow();

  const isInitialState = !result && !isLoading && !error && step === 1;
  const isLanding = isInitialState && !skipLanding && !landingDismissed;

  const headerTitle = getHeaderTitle({
    result: !!result,
    isLoading,
    error: !!error,
  });

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-primary)">
      {isLanding ? (
        <Header />
      ) : (
        <PageHeader backHref="/" title={headerTitle} />
      )}

      {isLanding ? (
        <main className="flex-1 w-full">
          <DiagnosisLanding onStart={() => setLandingDismissed(true)} />
        </main>
      ) : (
        <main className="flex-1 max-w-2xl mx-auto px-4 w-full">
          {result && <DiagnosisResult result={result} onRetry={handleRetry} />}
          {!result && isLoading && <DiagnosisLoading />}
          {!result && !isLoading && error && (
            <DiagnosisError error={error} onRetry={handleRetry} />
          )}
          {!result && !isLoading && !error && (
            <DiagnosisQuestionForm
              step={step}
              onSelect={handleSelect}
              onBack={handleBack}
            />
          )}
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
