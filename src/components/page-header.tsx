import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
      <div>
        <h2 className="text-4xl font-headline font-bold tracking-tight text-stone-900">{title}</h2>
        {description && <p className="text-stone-500 mt-2 text-base font-medium max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}