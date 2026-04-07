import Link from "next/link";
import { ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Card({
  className = "",
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl2 border border-line/80 bg-white/90 p-5 shadow-panel ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  href,
  actionLabel
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate">{description}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-5 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  );
}

export function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const tones = {
    default: "bg-mist text-ink",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800"
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
    </div>
  );
}
