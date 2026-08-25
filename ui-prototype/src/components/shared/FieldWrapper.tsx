import { TierTag } from "@/components/shared/TierTag";
import { cn } from "@/lib/utils";
import type { Tier } from "@/types";

interface FieldWrapperProps {
	label: string;
	htmlFor?: string;
	tier?: Tier;
	required?: boolean;
	error?: string;
	help?: string;
	span?: boolean;
	children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, tier, required, error, help, span, children }: FieldWrapperProps) {
	return (
		<div className={cn("flex flex-col gap-1.5", span && "sm:col-span-2 lg:col-span-3")}>
			<label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium">
				{label}
				{required && <span className="text-destructive">*</span>}
				{tier && <TierTag tier={tier} />}
			</label>
			{children}
			{error ? (
				<span className="text-xs text-destructive">{error}</span>
			) : help ? (
				<span className="text-xs text-muted-foreground">{help}</span>
			) : null}
		</div>
	);
}
