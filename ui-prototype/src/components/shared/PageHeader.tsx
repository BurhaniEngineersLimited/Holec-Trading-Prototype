interface PageHeaderProps {
	title: string;
	count?: number;
	description?: string;
}

export function PageHeader({ title, count, description }: PageHeaderProps) {
	return (
		<div className="mb-5">
			<h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
				{title}
				{count !== undefined && (
					<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
				)}
			</h1>
			{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
		</div>
	);
}
