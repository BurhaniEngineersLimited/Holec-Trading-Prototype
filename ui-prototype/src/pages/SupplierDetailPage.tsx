import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Banner } from "@/components/shared/Banner";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { FileUpload } from "@/components/shared/FileUpload";
import { SectionCard, SectionLabel } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/store/useStore";
import type { ContactPerson, Supplier } from "@/types";

const AREAS_BY_COUNTY: Record<string, string[]> = {
	Nakuru: ["Njoro", "Nakuru Town", "Molo"],
	"Uasin Gishu": ["Ziwa", "Eldoret Town", "Turbo"],
	"Trans Nzoia": ["Kitale Town", "Endebess"],
	Kitale: ["Kitale Town"],
	Bungoma: ["Bungoma Town", "Kimilili"],
};
const COUNTIES = Object.keys(AREAS_BY_COUNTY);

const BANKS: Record<string, { code: string; swift: string; branches: { name: string; code: string }[] }> = {
	"KCB Bank Kenya": { code: "01", swift: "KCBLKENX", branches: [{ name: "Nakuru Branch", code: "001" }, { name: "Eldoret Branch", code: "114" }, { name: "Head Office", code: "000" }] },
	"Equity Bank Kenya": { code: "68", swift: "EQBLKENA", branches: [{ name: "Nakuru Branch", code: "001" }, { name: "Kitale Branch", code: "045" }, { name: "Head Office", code: "000" }] },
	"I&M Bank": { code: "57", swift: "", branches: [{ name: "Nakuru Branch", code: "022" }, { name: "Head Office", code: "000" }] },
	"Co-operative Bank of Kenya": { code: "11", swift: "KCOOKENA", branches: [{ name: "Eldoret Branch", code: "030" }, { name: "Head Office", code: "000" }] },
	"Absa Bank Kenya": { code: "03", swift: "BARCKENX", branches: [{ name: "Kitale Branch", code: "018" }, { name: "Head Office", code: "000" }] },
};

const BLANK_CONTACT: ContactPerson = { name: "", role: "", phone: "", sameAsPhone: true, whatsapp: "", email: "", isPrimary: false };

const BLANK: Omit<Supplier, "id" | "status" | "createdBy" | "approvedBy"> = {
	name: "", group: "", supplierType: "Company", contactPersons: [{ ...BLANK_CONTACT, isPrimary: true }],
	kraPin: "", idNo: "", county: "", area: "", address: "",
	etims: "", vat: "", aflatoxinLicence: false,
	bankName: "", bankCode: "", branch: "", branchCode: "", swiftCode: "", accountNumber: "", accountName: "",
	bankLetter: false, callbackDone: false, rail: "", transferBorneBy: "",
};

export default function SupplierDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const isNew = id === "new";
	const existing = useStore((s) => (isNew ? undefined : s.suppliers.find((x) => x.id === id)));
	const createSupplier = useStore((s) => s.createSupplier);
	const updateSupplier = useStore((s) => s.updateSupplier);
	const submitSupplierForVerification = useStore((s) => s.submitSupplierForVerification);
	const approveSupplier = useStore((s) => s.approveSupplier);

	const [form, setForm] = useState<Omit<Supplier, "id" | "status" | "createdBy" | "approvedBy">>(
		existing ?? BLANK,
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [kraPinLocked, setKraPinLocked] = useState(true);

	if (!isNew && !existing) {
		return <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Supplier not found.</div>;
	}

	const status = existing?.status ?? "Draft";
	const canApprove = status === "Verified" && existing?.createdBy !== "You (Purchase User)";
	const showAflatoxin = form.group === "Farmer" || form.group === "Aggregator";
	const bankInfo = form.bankName ? BANKS[form.bankName] : undefined;

	function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
		setForm((f) => ({ ...f, [key]: value }));
	}

	function setContact(index: number, patch: Partial<ContactPerson>) {
		setForm((f) => ({
			...f,
			contactPersons: f.contactPersons.map((c, i) => (i === index ? { ...c, ...patch } : c)),
		}));
	}

	function addContact() {
		if (form.contactPersons.length >= 3) return;
		setForm((f) => ({ ...f, contactPersons: [...f.contactPersons, { ...BLANK_CONTACT }] }));
	}

	function removeContact(index: number) {
		setForm((f) => {
			const next = f.contactPersons.filter((_, i) => i !== index);
			if (next.length && !next.some((c) => c.isPrimary)) next[0].isPrimary = true;
			return { ...f, contactPersons: next };
		});
	}

	function makePrimary(index: number) {
		setForm((f) => ({
			...f,
			contactPersons: f.contactPersons.map((c, i) => ({ ...c, isPrimary: i === index })),
		}));
	}

	function pickBank(bankName: string) {
		const info = BANKS[bankName];
		setForm((f) => ({
			...f, bankName, bankCode: info?.code ?? "", branch: "", branchCode: "",
			swiftCode: info?.swift ?? "",
		}));
	}

	function pickBranch(branchName: string) {
		const branch = bankInfo?.branches.find((b) => b.name === branchName);
		setForm((f) => ({ ...f, branch: branchName, branchCode: branch?.code ?? "" }));
	}

	function handleKraPinUpload(file: File | null) {
		if (!file) return;
		// Simulated OCR extraction — real backend calls Claude Vision on the uploaded certificate.
		toast.info("Reading KRA PIN certificate…");
		setTimeout(() => {
			set("kraPin", "A0" + Math.floor(10000000 + Math.random() * 89999999) + "P");
			setKraPinLocked(true);
			toast.success("KRA PIN extracted — please verify");
		}, 600);
	}

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (!form.name) next.name = "Supplier name is required";
		if (!form.group) next.group = "Supplier group is required";
		if (form.contactPersons.length === 0) next.contacts = "At least 1 contact person is required";
		if (form.contactPersons.length > 0 && !form.contactPersons.some((c) => c.isPrimary)) {
			next.contacts = "Exactly one contact must be marked Primary";
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	function handleSave() {
		if (!validate()) {
			toast.error("Please fix the highlighted fields");
			return;
		}
		if (isNew) {
			const created = createSupplier(form);
			toast.success("Supplier created as Draft");
			navigate(`/suppliers/${created.id}`);
		} else if (existing) {
			updateSupplier(existing.id, form);
			toast.success("Changes saved");
		}
	}

	function handleVerify() {
		if (!existing) return;
		updateSupplier(existing.id, form);
		const result = submitSupplierForVerification(existing.id);
		if (!result.ok) {
			toast.error(result.message ?? "Could not submit for verification");
			return;
		}
		toast.success("Submitted for verification");
	}

	function handleApprove() {
		if (!existing || !canApprove) return;
		approveSupplier(existing.id);
		toast.success("Supplier approved — can now transact");
	}

	return (
		<div>
			<div className="mb-4 flex items-start justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">{isNew ? "New supplier" : existing!.name}</h1>
					{!isNew && <p className="text-sm text-muted-foreground">{existing!.id}</p>}
				</div>
				{!isNew && <StatusBadge status={status} />}
			</div>

			{!isNew && status === "Draft" && (
				<div className="mb-4">
					<Banner type="warn">This supplier is in Draft. They cannot transact until Verified and Approved.</Banner>
				</div>
			)}
			{!isNew && status === "Verified" && (
				<div className="mb-4">
					<Banner type="info">Awaiting Finance approval. The person who created this record cannot approve it themselves.</Banner>
				</div>
			)}
			{!isNew && status === "Approved" && (
				<div className="mb-4">
					<Banner type="ok">Approved by {existing!.approvedBy}. This supplier can now transact.</Banner>
				</div>
			)}

			<SectionLabel>Basic details</SectionLabel>
			<SectionCard>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FieldWrapper label="Supplier name" required error={errors.name}>
						<Input value={form.name} onChange={(e) => set("name", e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="Supplier group" required error={errors.group}>
						<Select value={form.group} onValueChange={(v) => set("group", v as Supplier["group"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Farmer", "Aggregator", "Trader", "Transporter"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Supplier type" required>
						<Select value={form.supplierType} onValueChange={(v) => set("supplierType", v as Supplier["supplierType"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Company", "Individual"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
				</div>
			</SectionCard>

			<SectionLabel>Contact persons</SectionLabel>
			<SectionCard>
				<p className="mb-3 text-xs text-muted-foreground">At least 1, at most 3. Exactly one must be marked Primary Contact.</p>
				{errors.contacts && <p className="mb-3 text-xs text-destructive">{errors.contacts}</p>}
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">No.</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead className="w-10 text-center">Same as WA</TableHead>
								<TableHead>WhatsApp</TableHead>
								<TableHead>Email</TableHead>
								<TableHead className="w-16 text-center">Primary</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{form.contactPersons.map((c, i) => (
								<TableRow key={i}>
									<TableCell className="text-muted-foreground">{i + 1}</TableCell>
									<TableCell><Input className="h-8 text-xs" value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} /></TableCell>
									<TableCell><Input className="h-8 text-xs" value={c.role} onChange={(e) => setContact(i, { role: e.target.value })} /></TableCell>
									<TableCell><Input className="h-8 text-xs" value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} placeholder="+254…" /></TableCell>
									<TableCell className="text-center">
										<Checkbox checked={c.sameAsPhone} onCheckedChange={(v) => setContact(i, { sameAsPhone: v === true, whatsapp: v === true ? "" : c.whatsapp })} />
									</TableCell>
									<TableCell>
										{c.sameAsPhone ? (
											<span className="text-xs text-muted-foreground">— same as phone —</span>
										) : (
											<Input className="h-8 text-xs" value={c.whatsapp} onChange={(e) => setContact(i, { whatsapp: e.target.value })} placeholder="+254…" />
										)}
									</TableCell>
									<TableCell><Input className="h-8 text-xs" value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} /></TableCell>
									<TableCell className="text-center">
										<Checkbox checked={c.isPrimary} onCheckedChange={() => makePrimary(i)} />
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="icon-sm" onClick={() => removeContact(i)} disabled={form.contactPersons.length <= 1}>
											<Trash2 className="size-3.5" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<Button variant="outline" size="sm" className="mt-3" onClick={addContact} disabled={form.contactPersons.length >= 3}>
					Add row
				</Button>
			</SectionCard>

			<SectionLabel>Additional details</SectionLabel>
			<SectionCard>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FieldWrapper label="County">
						<Select value={form.county} onValueChange={(v) => set("county", v)}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{COUNTIES.map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Area">
						<Select value={form.area} onValueChange={(v) => set("area", v)} disabled={!form.county}>
							<SelectTrigger className="w-full"><SelectValue placeholder={form.county ? "Select…" : "Select county first"} /></SelectTrigger>
							<SelectContent>
								{(AREAS_BY_COUNTY[form.county] ?? []).map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Business reg / national ID number">
						<Input value={form.idNo} onChange={(e) => set("idNo", e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="National ID / registration document">
						<FileUpload />
					</FieldWrapper>
					<FieldWrapper label="Physical address" span>
						<Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
					</FieldWrapper>
				</div>
			</SectionCard>

			<SectionLabel>Compliance</SectionLabel>
			<SectionCard>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FieldWrapper label="KRA PIN certificate">
						<FileUpload onFile={handleKraPinUpload} />
					</FieldWrapper>
					<FieldWrapper label="KRA PIN" required>
						<div className="flex gap-2">
							<Input value={form.kraPin} disabled={kraPinLocked} onChange={(e) => set("kraPin", e.target.value)} />
							<Button type="button" variant="outline" size="sm" onClick={() => setKraPinLocked((v) => !v)}>
								{kraPinLocked ? "Edit" : "Lock"}
							</Button>
						</div>
					</FieldWrapper>
					<FieldWrapper label="VAT status">
						<Select value={form.vat} onValueChange={(v) => set("vat", v as Supplier["vat"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Registered", "Not registered"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="eTIMS registration status">
						<Select value={form.etims} onValueChange={(v) => set("etims", v as Supplier["etims"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Registered", "Buyer-Generated", "Blocked"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					{showAflatoxin && (
						<>
							<FieldWrapper label="Aflatoxin / food-safety licence on file">
								<div className="flex h-9 items-center gap-2">
									<Checkbox checked={form.aflatoxinLicence} onCheckedChange={(v) => set("aflatoxinLicence", v === true)} />
								</div>
							</FieldWrapper>
							{form.aflatoxinLicence && (
								<FieldWrapper label="Upload aflatoxin / food-safety licence" required>
									<FileUpload />
								</FieldWrapper>
							)}
						</>
					)}
				</div>
			</SectionCard>

			<SectionLabel>Banking</SectionLabel>
			<SectionCard>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FieldWrapper label="Bank" required>
						<Select value={form.bankName} onValueChange={pickBank}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{Object.keys(BANKS).map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Bank code">
						<Input value={form.bankCode} disabled />
					</FieldWrapper>
					<FieldWrapper label="Branch" required>
						<Select value={form.branch} onValueChange={pickBranch} disabled={!form.bankName}>
							<SelectTrigger className="w-full"><SelectValue placeholder={form.bankName ? "Select…" : "Select bank first"} /></SelectTrigger>
							<SelectContent>
								{(bankInfo?.branches ?? []).map((b) => (
									<SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Branch code">
						<Input value={form.branchCode} disabled />
					</FieldWrapper>
					<FieldWrapper label="SWIFT code">
						<Input value={form.swiftCode} onChange={(e) => set("swiftCode", e.target.value)} />
					</FieldWrapper>
					<div />
					<FieldWrapper label="Account number" required>
						<Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
					</FieldWrapper>
					<FieldWrapper label="Account name" required>
						<Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="Should closely match supplier name" />
					</FieldWrapper>
					<FieldWrapper label="Bank letter / statement" required>
						<FileUpload />
					</FieldWrapper>
					<FieldWrapper label="Preferred payment rail">
						<Select value={form.rail} onValueChange={(v) => set("rail", v as Supplier["rail"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Mpesa", "PesaLink", "Bank Transfer", "Cash"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="Transfer charge borne by">
						<Select value={form.transferBorneBy} onValueChange={(v) => set("transferBorneBy", v as Supplier["transferBorneBy"])}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
							<SelectContent>
								{["Supplier", "Us"].map((o) => (
									<SelectItem key={o} value={o}>{o}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
					<FieldWrapper label="First-payment call-back confirmed">
						<div className="flex h-9 items-center gap-2">
							<Checkbox checked={form.callbackDone} onCheckedChange={(v) => set("callbackDone", v === true)} />
						</div>
					</FieldWrapper>
				</div>
			</SectionCard>

			<div className="mt-6 flex flex-wrap items-center gap-2">
				<Button onClick={handleSave}>{isNew ? "Submit as Draft" : "Save changes"}</Button>
				{!isNew && status === "Draft" && <Button variant="outline" onClick={handleVerify}>Submit for verification</Button>}
				{!isNew && status === "Verified" && (
					<Button disabled={!canApprove} onClick={handleApprove}>Approve</Button>
				)}
				<Button variant="ghost" onClick={() => navigate("/suppliers")}>Cancel</Button>
			</div>
			{!isNew && status === "Verified" && !canApprove && (
				<p className="mt-2 text-xs text-muted-foreground">You created this record, so you cannot approve it. A different Finance user must.</p>
			)}
		</div>
	);
}
