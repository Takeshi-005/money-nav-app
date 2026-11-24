"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { submitPrediction } from "../api/submitPrediction";
import type { PredictionDirection } from "@/entities/prediction";

export function usePredictionSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prediction: PredictionDirection) => submitPrediction(prediction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prediction.today() });
    },
  });
}
