import { ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { TIMELINE } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * Persistent stage strip. When a lot is "in context" (its detail page, or
 * any per-lot action screen registered it via useActiveLot), this highlights
 * the lot's ACTUAL state — not the current page route. That's the fix for
 * the bug in the HTML prototype where the strip just mirrored route.module.
 */
export function TimelineStrip() {
	const navigate = useNavigate();
	const location = useLocation();
	const activeLotId = useUiStore((s) => s.activeLotId);
	const lot = useStore((s) => (activeLotId ? s.lots.find((l) => l.id === activeLotId) : undefined));

	const activeIndex = lot
		? TIMELINE.findIndex((s) => s.state === lot.state)
		: TIMELINE.findIndex((s) => location.pathname.startsWith(s.route));

	return (
		<div className="flex items-center gap-0.5 overflow-x-auto border-b bg-card px-4 py-2 sm:px-6">
			{TIMELINE.map((stage, i) => (
				<div key={stage.label} className="flex shrink-0 items-center">
					{i > 0 && <ChevronRight className="mx-0.5 size-3.5 text-muted-foreground/50" />}
					<button
						type="button"
						onClick={() => navigate(stage.route)}
						className={cn(
							"flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent",
							i === activeIndex ? "bg-primary/10 text-primary" : "text-muted-foreground",
						)}
					>
						<span
							className={cn(
								"flex size-4 items-center justify-center rounded-full text-[10px]",
								i === activeIndex ? "bg-primary text-primary-foreground" : "bg-muted",
							)}
						>
							{i + 1}
						</span>
						{stage.label}
					</button>
				</div>
			))}
		</div>
	);
}
