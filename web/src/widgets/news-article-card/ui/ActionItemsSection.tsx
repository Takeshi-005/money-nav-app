interface Props {
  items: string[];
}

export function ActionItemsSection({ items }: Props) {
  return (
    <div className="mt-6 p-5 rounded-2xl bg-surface-secondary border border-(--border-primary)">
      <p className="text-sm font-semibold text-foreground mb-3">
        🎯 今日からできるアクション
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-(--text-secondary)"
          >
            <span className="text-brand-500 mt-0.5 shrink-0">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
