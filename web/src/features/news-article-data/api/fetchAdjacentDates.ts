export interface AdjacentDates {
  prevDate: string | null;
  nextDate: string | null;
}

export async function fetchNewsArticleAdjacentDates(
  date: string,
): Promise<AdjacentDates> {
  const response = await fetch(
    `/api/news-articles/adjacent?date=${encodeURIComponent(date)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch adjacent news article dates");
  }

  return response.json();
}
