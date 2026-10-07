interface PageTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** The single h1 of a screen, with an optional muted line beneath it. */
export function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="cv01 text-2xl font-semibold text-fg-strong">{title}</h1>
        {subtitle ? <p className="cv01 text-base leading-relaxed text-fg-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
