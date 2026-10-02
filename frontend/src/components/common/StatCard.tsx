interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "ok" | "warn";
}

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className={`stat stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <em>{hint}</em>}
    </div>
  );
}
