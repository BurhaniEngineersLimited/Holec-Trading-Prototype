import { Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Banner } from "@/components/shared/Banner";
import { EmptyState } from "@/components/shared/EmptyState";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveLot } from "@/hooks/useActiveLot";
import { fmtKg } from "@/lib/format";
import { useStore } from "@/store/useStore";

const COUNTIES = ["Nakuru", "Uasin Gishu", "Trans Nzoia", "Kitale", "Bungoma"];

export default function IntakePage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const lots = useStore((s) => s.lots);
	const suppliers = useStore((s) => s.suppliers);
	const findSupplier = useStore((s) => s.findSupplier);
	const submitIntake = useStore((s) => s.submitIntake);

	const ticketLots = useMemo(() => lots.filter((l) => l.state === "TICKET"), [lots]);
	const targetId = id ?? ticketLots[0]?.id;
	const lot = targetId ? lots.find((l) => l.id === targetId) : undefined;

	useActiveLot(lot?.id);

	const [gross, setGross] = useState("");
	const [tare, setTare] = useState("");
	const [bags, setBags] = useState("");
	const [wbNumber, setWbNumber] = useState("");
	const [transporterId, setTransporterId] = useState("");
	const [vehicleReg, setVehicleReg] = useState("");
	const [moisture, setMoisture] = useState("");
	const [fm, setFm] = useState("");
	const [afla, setAfla] = useState("");
	const [county, setCounty] = useState("");
	const [area, setArea] = useState("");
	const [reason, setReason] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	if (!targetId) {
		return (
			<div>
				<PageHeader title="Intake & quality capture" description="The weighbridge screen. What's captured here determines every downstream number." />
				<EmptyState
					icon={Truck}
					title="No tickets waiting for intake"
					description="Create a ticket first — that's what a truck gets weighed against."
					actionLabel="+ New ticket"
					onAction={() => navigate("/tickets/new")}
				/>
			</div>
		);
	}

	if (!lot || lot.state !== "TICKET") {
		return (
			<div>
				<PageHeader title="Intake & quality capture" />
				<EmptyState title="That ticket has already been weighed" description={ticketLots.length ? "Pick another ticket below." : "No tickets currently waiting."} />
				{ticketLots.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{ticketLots.map((t) => (
							<Button key={t.id} variant="outline" size="sm" onClick={() => navigate(`/intake/${t.id}`)}>{t.ticketNo}</Button>
						))}
					</div>
				)}
			</div>
		);
	}

	const sup = findSupplier(lot.supplierId);
	const grossNum = Number(gross) || 0;
	const tareNum = Number(tare) || 0;
	const netKg = Math.max(0, grossNum - tareNum);
	const aflaNum = Number(afla) || 0;

	function handleSubmit() {
		const next: Record<string, string> = {};
		if (!gross) next.gross = "Required";
		if (!tare) next.tare = "Required";
		if (!bags) next.bags = "Required";
		if (!wbNumber.trim()) next.wbNumber = "Required";
		if (gross && tare && grossNum <= tareNum) next.gross = "Gross weight must exceed tare weight";
		if (!moisture) next.moisture = "Required";
		if (fm === "") next.fm = "Required";
		if (afla === "") next.afla = "Required";
		if (Number(moisture) > 20 && !reason.trim()) next.reason = "Reason code required for wet buy above 20% moisture";
		setErrors(next);
		if (Object.keys(next).length > 0) {
			toast.error(Object.values(next)[0]);
			return;
		}

		submitIntake(lot!.id, {
			grossKg: grossNum, tareKg: tareNum, bags: Number(bags), wbNumber: wbNumber.trim(),
			transporterId: transporterId || null, vehicleReg, moisturePct: Number(moisture), fmPct: Number(fm),
			aflatoxinPpb: aflaNum, county, area, reasonCode: reason,
		});
		toast.success(`Intake recorded for ${lot!.ticketNo} — lot created`);
		navigate(`/deductions/${lot!.id}`);
	}

	return (
		<div>
			<PageHeader title="Intake & quality capture" description={`Weighing ${lot.ticketNo} · ${sup?.name ?? ""} · expected ${fmtKg(lot.itemQty ?? 0)}`} />

			{ticketLots.length > 1 && (
				<div className="mb-4 flex flex-wrap items-center gap-1.5">
					<span className="text-xs text-muted-foreground">{ticketLots.length} tickets waiting:</span>
					{ticketLots.map((t) => (
						<Button key={t.id} size="sm" variant={t.id === lot.id ? "default" : "outline"} onClick={() => navigate(`/intake/${t.id}`)}>
							{t.ticketNo}
						</Button>
					))}
				</div>
			)}

			<SectionCard title="Weighbridge capture" description="The field screen — must work on a phone">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FieldWrapper label="Gross weight (kg)" tier="C" required error={errors.gross}>
						<Input type="number" value={gross} onChange={(e) => setGross(e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="Tare weight (kg)" tier="C" required error={errors.tare}>
						<Input type="number" value={tare} onChange={(e) => setTare(e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="Bag count" tier="C" required error={errors.bags}>
						<Input type="number" value={bags} onChange={(e) => setBags(e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="Weighbridge ticket number" tier="C" required error={errors.wbNumber}>
						<Input value={wbNumber} onChange={(e) => setWbNumber(e.target.value)} placeholder="Unique, e.g. WB-88213" />
					</FieldWrapper>
					<FieldWrapper label="Transporter" tier="C">
						<Select value={transporterId} onValueChange={setTransporterId}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{suppliers.filter((s) => s.group === "Transporter").map((s) => (
									<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Vehicle registration" tier="C">
						<Input value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. KDA 221C" />
					</FieldWrapper>
				</div>
				<div className="mt-4">
					<FieldWrapper label="Net weight (calculated)" tier="C" help="Gross minus tare, calculated automatically" span>
						<div className="flex h-9 items-center rounded-md border bg-muted px-3 font-mono text-sm">{fmtKg(netKg)}</div>
					</FieldWrapper>
				</div>
			</SectionCard>

			<div className="mt-4">
				<SectionCard title="Quality inspection" description="Native Quality Inspection doctype">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<FieldWrapper label="Moisture %" tier="N" required error={errors.moisture} help="Standard is 13.5%">
							<Input type="number" value={moisture} onChange={(e) => setMoisture(e.target.value)} />
						</FieldWrapper>
						<FieldWrapper label="Foreign matter %" tier="N" required error={errors.fm}>
							<Input type="number" value={fm} onChange={(e) => setFm(e.target.value)} />
						</FieldWrapper>
						<FieldWrapper label="Aflatoxin ppb" tier="N" required error={errors.afla} help="Limit is 10 ppb">
							<Input type="number" value={afla} onChange={(e) => setAfla(e.target.value)} />
						</FieldWrapper>
					</div>
					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<FieldWrapper label="County" tier="C">
							<Select value={county} onValueChange={setCounty}>
								<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
								<SelectContent>
									{COUNTIES.map((c) => (
										<SelectItem key={c} value={c}>{c}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FieldWrapper>
						<FieldWrapper label="Area" tier="C">
							<Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Njoro" />
						</FieldWrapper>
						<FieldWrapper
							label="Reason code (if foreign matter judgement or wet buy)" tier="C" span
							error={errors.reason} help="Mandatory if moisture > 20% or foreign matter call is disputed"
						>
							<Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
						</FieldWrapper>
					</div>
				</SectionCard>
			</div>

			{aflaNum > 10 && (
				<div className="mt-4">
					<Banner type="block">
						Aflatoxin at {aflaNum} ppb exceeds the 10 ppb limit. This lot cannot proceed past intake without an override and reason code.
					</Banner>
				</div>
			)}

			<div className="mt-6 flex items-center gap-2">
				<Button onClick={handleSubmit}>Submit intake & create lot</Button>
				<Button variant="ghost" onClick={() => navigate("/lots")}>Cancel</Button>
			</div>
		</div>
	);
}
