import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { computeLandedCost, computePayable, computeSale, computeTransport } from "@/lib/calculations";
import { fmtKES } from "@/lib/format";
import { useStore } from "@/store/useStore";
import type { Lot } from "@/types";

export default function LedgerPage() {
	const lots = useStore((s) => s.lots);
	const findSupplier = useStore((s) => s.findSupplier);

	const costedLots = lots.filter((l) => l.state !== "TICKET");
	const settledLots = costedLots.filter((l) => l.state === "SETTLED");
	const totalMargin = settledLots.reduce((sum, l) => sum + (computeSale(l)?.margin ?? 0), 0);
	const avgMarginPerTonne = settledLots.length
		? settledLots.reduce((sum, l) => sum + (computeSale(l)?.marginPerTonne ?? 0), 0) / settledLots.length
		: 0;

	const columns: Column<Lot>[] = [
		{ key: "ticketNo", header: "Ticket", render: (l) => <span className="font-mono text-xs">{l.ticketNo}</span> },
		{ key: "supplier", header: "Supplier", render: (l) => findSupplier(l.supplierId)?.name ?? "—" },
		{ key: "netPayable", header: "Net payable", className: "text-right", render: (l) => fmtKES(computePayable(l).netPayable) },
		{ key: "transport", header: "Transport", className: "text-right", render: (l) => fmtKES(computeTransport(l).total) },
		{ key: "landed", header: "Landed/kg", className: "text-right", render: (l) => `${fmtKES(computeLandedCost(l).perKg)}/kg` },
		{
			key: "margin", header: "Margin/tonne", className: "text-right",
			render: (l) => { const s = computeSale(l); return s ? fmtKES(s.marginPerTonne) : "—"; },
		},
		{ key: "state", header: "State", render: (l) => <StatusBadge status={l.state} /> },
	];

	return (
		<div>
			<PageHeader
				title="Cost ledger & margin"
				description="Every cost, tagged to a lot, traceable to its source document. This is a reporting layer over the GL — it reconciles to it, never replaces it."
			/>

			<div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard label="Settled trades" value={String(settledLots.length)} />
				<StatCard label="Total realised margin" value={fmtKES(totalMargin)} />
				<StatCard label="Average margin / tonne" value={fmtKES(avgMarginPerTonne)} />
			</div>

			<SectionCard title="Lot cost breakdown" description="Landed cost per kg is model-independent — comparable regardless of who technically invoiced what">
				<DataTable data={costedLots} columns={columns} getRowId={(l) => l.id} emptyTitle="No costed lots yet." />
			</SectionCard>
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="mt-1 text-xl font-semibold">{value}</div>
		</div>
	);
}
