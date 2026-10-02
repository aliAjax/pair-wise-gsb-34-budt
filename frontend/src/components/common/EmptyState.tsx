interface EmptyStateProps {
  title?: string;
  desc?: string;
}

export function EmptyState({ title = "暂无数据", desc }: EmptyStateProps) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {desc && <p>{desc}</p>}
    </div>
  );
}
