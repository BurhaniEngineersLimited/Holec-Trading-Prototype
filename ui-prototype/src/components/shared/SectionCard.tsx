import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
	title?: string;
	description?: string;
	children: React.ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
	return (
		<Card>
			{(title || description) && (
				<CardHeader>
					{title && <CardTitle className="text-base">{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent>{children}</CardContent>
		</Card>
	);
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
	return <div className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">{children}</div>;
}
