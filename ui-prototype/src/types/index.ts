// Domain types ported from ui-prototype/reference/holec-erp-prototype.html (STORE shape).

export type Tier = "N" | "C" | "B";

export type SupplierGroup = "Farmer" | "Aggregator" | "Trader" | "Transporter";
export type SupplierType = "Company" | "Individual";
export type PartyStatus = "Draft" | "Verified" | "Approved";
export type PaymentRail = "Mpesa" | "PesaLink" | "Bank Transfer" | "Cash";
export type EtimsStatus = "Registered" | "Buyer-Generated" | "Blocked";
export type VatStatus = "Registered" | "Not registered";
export type TransferBorneBy = "Supplier" | "Us";

export interface ContactPerson {
	name: string;
	role: string;
	phone: string;
	sameAsPhone: boolean;
	whatsapp: string;
	email: string;
	isPrimary: boolean;
}

export interface Supplier {
	id: string;
	name: string;
	group: SupplierGroup | "";
	supplierType: SupplierType;
	contactPersons: ContactPerson[];
	kraPin: string;
	idNo: string;
	county: string;
	area: string;
	address: string;
	etims: EtimsStatus | "";
	vat: VatStatus | "";
	aflatoxinLicence: boolean;
	bankName: string;
	bankCode: string;
	branch: string;
	branchCode: string;
	swiftCode: string;
	accountNumber: string;
	accountName: string;
	bankLetter: boolean;
	callbackDone: boolean;
	rail: PaymentRail | "";
	transferBorneBy: TransferBorneBy | "";
	status: PartyStatus;
	createdBy: string;
	approvedBy: string;
}

export type CustomerGroup = "Miller" | "Exporter" | "Feed Manufacturer" | "Trader";
export type CreditTerms = "Net 7" | "Net 14" | "Net 30" | "Cash on delivery";
export type OffloadingBorneBy = "Customer" | "Us";

export interface Customer {
	id: string;
	name: string;
	group: CustomerGroup | "";
	kraPin: string;
	address: string;
	creditLimit: number;
	creditTerms: CreditTerms | "";
	exposureLimit: number;
	guarantee: string;
	moistureRule: string;
	fmRule: string;
	offloadingBorneBy: OffloadingBorneBy | "";
	status: PartyStatus;
	createdBy: string;
	approvedBy: string;
}

export const STAGE_ORDER = [
	"TICKET",
	"INTAKE",
	"LOT",
	"POSITION",
	"INVOICED",
	"SETTLED",
] as const;

export type LotState = (typeof STAGE_ORDER)[number];

export interface Lot {
	id: string;
	ticketNo: string;
	item: string;
	state: LotState;
	supplierId: string;
	customerId: string | null;

	// present once a ticket is created
	itemQty?: number;

	// present once intake is recorded
	grossKg?: number;
	tareKg?: number;
	bags?: number;
	wbNumber?: string;
	moisturePct?: number;
	fmPct?: number;
	aflatoxinPpb?: number;
	aflatoxinTested?: boolean;
	county?: string;
	area?: string;
	transporterId?: string | null;
	vehicleReg?: string;

	// present once transport is capitalised
	haulage?: number;
	cess?: number;
	offloading?: number;
	transportPaid?: boolean;

	// present once sold
	sellRatePerKg?: number | null;
	invoiceNo?: string;
	etimsControlNo?: string;

	createdAt: string;
	reasonCodes: string[];
}

export type PaymentPartyType = "Supplier" | "Customer";
export type PaymentStatus = "Completed" | "Pending" | "Failed";

export interface Payment {
	id: string;
	partyType: PaymentPartyType;
	partyId: string;
	lotId: string;
	amount: number;
	rail: PaymentRail;
	status: PaymentStatus;
	daysAgo: number;
}

export interface TradeEvent {
	id: string;
	lotId: string;
	action: string;
	detail?: string;
	who: string;
	at: string;
}

export interface Sequences {
	ticket: number;
	lot: number;
	invoice: number;
	payment: number;
}
