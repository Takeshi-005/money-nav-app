interface Props {
  topics: string[];
}

export function RelatedTopicsSection({ topics }: Props) {
  return (
    <div className="mt-8 pt-6 border-t border-(--border-primary)">
      <p className="text-sm font-semibold text-(--text-tertiary) mb-3">
        関連テーマ
      </p>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs bg-surface-tertiary text-(--text-secondary) border border-(--border-primary)"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
