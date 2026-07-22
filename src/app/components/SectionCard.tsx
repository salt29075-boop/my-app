interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function SectionCard({ title, children, className = "", action }: SectionCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden ${className}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-secondary)" }}>
          {title}
        </span>
        {action}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
