"use client";

import { useState } from "react";
import { Typography } from "@/shared/ui/typography";
import { CLAUDE_AI_DISCLOSURE_PROMPT } from "@/shared/api/gemini/disclosure-extraction";
import { useImportMutation, usePreviewMutation } from "../model";
import type { ImportResponse, PreviewResponse } from "../model/types";
import { PromptCard } from "./PromptCard";
import { PreviewPanel } from "./PreviewPanel";
import { ImportSuccessPanel } from "./ImportSuccessPanel";

export function AdminDisclosuresPage() {
  const [analyzedJson, setAnalyzedJson] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<{
    message: string;
    details?: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  const previewMutation = usePreviewMutation({
    onSuccess: (data) => {
      setPreview(data);
      setPreviewError(null);
      setImportResult(null);
      setImportError("");
    },
    onError: (message, details) => {
      setPreview(null);
      setPreviewError({ message, details });
      setImportResult(null);
      setImportError("");
    },
  });

  const importMutation = useImportMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setImportError("");
      setPreview(null);
      setAnalyzedJson("");
    },
    onError: (message) => {
      setImportError(message);
    },
  });

  const canPreview =
    !previewMutation.isPending &&
    !importMutation.isPending &&
    analyzedJson.trim().length > 0;

  const canImport = preview != null && !importMutation.isPending;

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPreview) {
      return;
    }
    previewMutation.mutate(analyzedJson.trim());
  };

  const handleImport = () => {
    if (!canImport) {
      return;
    }
    setImportError("");
    importMutation.mutate(analyzedJson.trim());
  };

  const handleCancel = () => {
    setPreview(null);
    setPreviewError(null);
    setImportError("");
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_AI_DISCLOSURE_PROMPT);
      setCopiedAt(Date.now());
      setTimeout(() => setCopiedAt(null), 2000);
    } catch {
      setCopiedAt(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      setAnalyzedJson(text);
      setPreview(null);
      setPreviewError(null);
      setImportResult(null);
      setImportError("");
    } catch {
      setPreviewError({
        message: `ファイルの読み込みに失敗しました: ${file.name}`,
      });
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
          <Typography variant="title_S" as="h1">
            適時開示記事の取り込み
          </Typography>
        </div>
        <Typography variant="S" className="text-(--text-secondary)">
          適時開示情報を扱う公開記事を AI で構造化 → JSON を貼り付けて DB に保存
        </Typography>
      </header>

      <PromptCard
        isOpen={promptOpen}
        onToggle={() => setPromptOpen((v) => !v)}
        onCopy={handleCopyPrompt}
        copiedAt={copiedAt}
      />

      <form
        onSubmit={handlePreview}
        className="p-5 rounded-2xl bg-surface-elevated border border-(--border-primary) space-y-4"
      >
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Typography variant="M_bold">JSON を貼り付け</Typography>
            <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-(--border-primary) bg-surface-secondary text-xs font-medium text-(--text-secondary) hover:bg-surface-tertiary transition-colors">
              ファイルを選択
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <Typography variant="caution" className="text-(--text-tertiary)">
            {analyzedJson.length.toLocaleString()} 文字
          </Typography>
        </div>
        <textarea
          value={analyzedJson}
          onChange={(e) => setAnalyzedJson(e.target.value)}
          rows={14}
          placeholder='{"articleDate":"2026-06-01","sourceUrl":null,"events":[...]}'
          className="w-full px-3 py-2 rounded-lg border border-(--border-primary) bg-surface-secondary text-sm text-foreground focus:outline-none focus:border-brand-400 font-mono"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={!canPreview}
            className="px-5 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {previewMutation.isPending ? "検証中…" : "プレビュー"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-(--text-secondary) hover:bg-surface-secondary transition-colors"
            >
              プレビューを閉じる
            </button>
          )}
          {previewError && (
            <Typography variant="caution" className="text-negative-600">
              {previewError.message}
            </Typography>
          )}
        </div>
        {previewError?.details && previewError.details.length > 0 && (
          <ul className="list-disc pl-5 space-y-1">
            {previewError.details.map((d, i) => (
              <li key={i}>
                <Typography variant="caution" className="text-negative-600">
                  {d}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </form>

      {preview && (
        <PreviewPanel
          preview={preview}
          onConfirm={handleImport}
          onCancel={handleCancel}
          isImporting={importMutation.isPending}
          importError={importError}
        />
      )}

      {importResult && <ImportSuccessPanel result={importResult} />}
    </main>
  );
}
