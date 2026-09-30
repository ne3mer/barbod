type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Placeholder
      </p>
      <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
