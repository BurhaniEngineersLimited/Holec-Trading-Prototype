import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Banner } from "@/components/shared/Banner";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard, SectionLabel } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveLot } from "@/hooks/useActiveLot";
import { computeSale } from "@/lib/calculations";
import { fmtKES } from "@/lib/format";
import { useStore } from "@/store/useStore";
import type { Payment, PaymentRail } from "@/types";

export default function PaymentsPage() {
	const { id } = useParams<{ id: string }>();
	const lots = useStore((s) => s.lots);
	const lot = id ? lots.find((l) => l.id === id && l.state === "INVOICED") : undefined;

	if (id && lot) return <SettleLot lotId={lot.id} />;
	return <PaymentsList />;
}

function PaymentsList() {
	const navigate = useNavigate();
	const lots = useStore((s) => s.lots);
	const payments = useStore((s) => s.payments);
	const findSupplier = useStore((s) => s.findSupplier);
	const findCustomer = useStore((s) => s.findCustomer);

	const invoicedLots = lots.filter((l) => l.state === "INVOICED");

	const columns: Column<Payment>[] = [
		{ key: "id", header: "ID", render: (p) => <span className="font-mono text-xs">{p.id}</span> },
		{
			key: "party", header: "Party",
			render: (p) => (p.partyType === "Supplier" ? findSupplier(p.partyId)?.name : findCustomer(p.partyId)?.name) ?? "—",
		},
		{ key: "type", header: "Type", render: (p) => p.partyType },
		{ key: "amount", header: "Amount", className: "text-right", render: (p) => fmtKES(p.amount), sortValue: (p) => p.amount },
		{ key: "rail", header: "Rail", render: (p) => p.rail },
		{ key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
	];

	return (
		<div>
			<PageHeader
				title="Payments"
				count={payments.length}
				description="Getting money out down the right rail, and matching money in against open invoices."
			/>

			{invoicedLots.length > 0 && (
				<>
					<SectionLabel>Awaiting customer payment</SectionLabel>
					<div className="mb-6 overflow-hidden rounded-lg border bg-card">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Ticket</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Invoice</TableHead>
									<TableHead>eTIMS</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{invoicedLots.map((l) => {
									const cus = findCustomer(l.customerId);
									return (
										<TableRow key={l.id}>
											<TableCell className="font-mono text-xs">{l.ticketNo}</TableCell>
											<TableCell>{cus?.name ?? "—"}</TableCell>
											<TableCell className="font-mono text-xs">{l.invoiceNo}</TableCell>
											<TableCell className="font-mono text-[11px] text-muted-foreground">{l.etimsControlNo}</TableCell>
											<TableCell>
												<Button size="sm" onClick={() => navigate(`/payments/${l.id}`)}>Record payment</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</>
			)}

			<SectionLabel>Payment history</SectionLabel>
			<DataTable data={payments.slice().reverse()} columns={columns} getRowId={(p) => p.id} emptyTitle="No payments recorded yet." />
		</div>
	);
}

function SettleLot({ lotId }: { lotId: string }) {
	const navigate = useNavigate();
	const lot = useStore((s) => s.lots.find((l) => l.id === lotId))!;
	const findCustomer = useStore((s) => s.findCustomer);
	const settlePayment = useStore((s) => s.settlePayment);
	useActiveLot(lotId);

	const cus = findCustomer(lot.customerId);
	const sale = useMemo(() => computeSale(lot), [lot]);
	const [rail, setRail] = useState<PaymentRail>("PesaLink");

	if (!sale) return null;

	function handleConfirm() {
		settlePayment(lotId, { rail });
		toast.success(`${lot.ticketNo} settled — margin ${fmtKES(sale!.marginPerTonne)}/tonne`);
		navigate(`/lots/${lotId}`);
	}

	return (
		<div>
			<PageHeader title="Record payment" description={`${lot.ticketNo} · ${cus?.name ?? ""} · invoice ${lot.invoiceNo}`} />

			<SectionCard title="Customer payment">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FieldWrapper label="Amount due" tier="N">
						<div className="flex h-9 items-center rounded-md border bg-muted px-3 font-mono text-sm">{fmtKES(sale.revenue)}</div>
					</FieldWrapper>
					<FieldWrapper label="Payment rail" tier="N">
						<Select value={rail} onValueChange={(v) => setRail(v as PaymentRail)}>
							<SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{["Mpesa", "PesaLink", "Bank Transfer"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
				</div>
			</SectionCard>

			<div className="mt-4">
				<SectionCard title="Bank reconciliation" description="Matched to the open invoice">
					<Banner type="info">On confirmation, this receipt is matched to {lot.invoiceNo} and the lot moves to Settled.</Banner>
				</SectionCard>
			</div>

			<div className="mt-6 flex items-center gap-2">
				<Button onClick={handleConfirm}>Confirm receipt & settle lot</Button>
				<Button variant="ghost" onClick={() => navigate("/payments")}>Cancel</Button>
			</div>
		</div>
	);
}
