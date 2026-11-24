"use client";

import { useMutation } from "@tanstack/react-query";
import { importDisclosure, previewDisclosure } from "../api/disclosures";
import type { ImportResponse, PreviewResponse } from "./types";

interface PreviewOptions {
  onSuccess?: (data: PreviewResponse) => void;
  onError?: (message: string, details?: string[]) => void;
}

export function usePreviewMutation(options?: PreviewOptions) {
  return useMutation<PreviewResponse, Error, string>({
    mutationFn: previewDisclosure,
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: (e) => {
      const details = (e as Error & { details?: string[] }).details;
      options?.onError?.(e.message, details);
    },
  });
}

interface ImportOptions {
  onSuccess?: (data: ImportResponse) => void;
  onError?: (message: string) => void;
}

export function useImportMutation(options?: ImportOptions) {
  return useMutation<ImportResponse, Error, string>({
    mutationFn: importDisclosure,
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: (e) => options?.onError?.(e.message),
  });
}
