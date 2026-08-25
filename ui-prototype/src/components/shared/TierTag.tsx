import { cn } from "@/lib/utils";
import type { Tier } from "@/types";

const LABEL: Record<Tier, string> = {
	N: "Native",
	C: "Configure",
	B: "Build",
};

const CLASSES: Record<Tier, string> = {
	N: "bg-tier-native-bg text-tier-native",
	C: "bg-tier-configure-bg text-tier-configure",
	B: "bg-tier-build-bg text-tier-build",
};

export function TierTag({ tier, className }: { tier: Tier; className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
				CLASSES[tier],
				className,
			)}
		>
			{LABEL[tier]}
		</span>
	);
}
