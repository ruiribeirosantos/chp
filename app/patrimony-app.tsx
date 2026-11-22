"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, Bell, Building2, CalendarDays, ChartNoAxesCombined, CircleAlert, ClipboardCheck, ContactRound, Download, FileSpreadsheet, FileText, Home, Landmark, Lightbulb, LogOut, Menu, PackageCheck, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Printer, ReceiptText, Search, ShieldCheck, Sparkles, Target, Trash2, Upload, Users, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseAuth, firebaseStorage, firestore, googleProvider } from "./firebase";

type View = "painel" | "desempenho" | "imoveis" | "inquilinos" | "contratos" | "conta" | "encargos" | "obrigacoes" | "manutencao" | "inventario" | "contactos" | "documentos" | "calendario";
type DialogKind = "property" | "tenant" | "lease" | "movement" | "tax" | "insurance" | "condo" | "obligation" | "maintenance" | "inventory" | "contact" | "financing" | "financingPayment" | "goal";
type OwnershipPeriod = {
  id: string;
  percentage: number;
  startDate: string;
  endDate: string;
};
type Property = {
  id: string;
  name: string;
  description: string;
  address: string;
  postalCode: string;
  locality: string;
  parish: string;
  type: string;
  fraction: string;
  fiscalReference?: string;
  buildingGroup?: string;
  permillage?: number;
  ownershipPeriods?: OwnershipPeriod[];
  yearBuilt: string;
  energyRating: string;
  housingLicense?: string;
  status: "ocupado" | "livre";
  mainPhotoKey?: string;
  gallery?: string[];
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  amenities?: string;
  notes?: string;
};
type Tenant = {
  id: string;
  entityType: "particular" | "empresa";
  name: string;
  address: string;
  locality: string;
  postalCode: string;
  taxId: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  nationality?: string;
  birthDate?: string;
  email: string;
  phone: string;
  mobile: string;
  whatsapp?: string;
  notes?: string;
};
type Lease = {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantIds?: string[];
  portalContractNumber?: string;
  start: string;
  end: string;
  renewalDate: string;
  rentDueDay?: number;
  rent: number;
  depositRequired: boolean;
  deposit: number;
  advanceRents: number;
  updateRate: number;
  stampDutyStatus?: "pendente" | "pago" | "isento";
  stampDutyAmount?: number;
  stampDutyDate?: string;
  stampDutyReference?: string;
  notes: string;
  status: "ativo" | "rascunho";
};
type Movement = {
  id: string;
  propertyId: string;
  leaseId?: string;
  dueDate: string;
  description: string;
  period: string;
  amount: number;
  paidAmount?: number;
  paymentDate?: string;
  kind: "receita" | "despesa";
  receipt: boolean;
  paid: boolean;
  receiptStatus?: "nao_emitido" | "emitido" | "anulado";
  receiptNumber?: string;
  receiptDate?: string;
  paymentMethod?: string;
  source?: "contract" | "manual" | "import";
  notes?: string;
};
type Tax = {
  id: string;
  propertyId: string;
  issuer: string;
  tax: string;
  period: string;
  dueDate: string;
  paymentDate?: string;
  paymentType: string;
  amount: number;
  paid: boolean;
  notes: string;
};
type Insurance = {
  id: string;
  propertyId: string;
  insurer: string;
  scope: string;
  policy: string;
  startDate: string;
  renewalDate: string;
  paymentDate?: string;
  paid?: boolean;
  paymentType: string;
  premium: number;
  notes: string;
};
type Condo = {
  id: string;
  propertyId: string;
  expenseType: string;
  scope: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentType: string;
  paid: boolean;
  allocationMode?: "directa" | "permilagem";
  buildingGroup?: string;
  notes: string;
};
type Inventory = {
  id: string;
  propertyId: string;
  room: string;
  category: string;
  item: string;
  brand: string;
  model: string;
  serial: string;
  quantity: number;
  condition: string;
  value: number;
  acquiredAt: string;
  warrantyUntil: string;
  supplier: string;
  photoKey?: string;
  notes: string;
};
type Contact = {
  id: string;
  propertyId: string;
  name: string;
  relation: string;
  address: string;
  phone: string;
  email: string;
};
type DocumentItem = {
  id: string;
  propertyId?: string;
  name: string;
  type: string;
  size: number;
  key: string;
  createdAt: string;
};
type ImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  accepted: number;
  rejected: number;
  duplicates: number;
};
type Obligation = {
  id: string;
  propertyId: string;
  leaseId?: string;
  category: string;
  title: string;
  basis: string;
  dueDate: string;
  alertDays: number;
  recurrence: string;
  priority: "baixa" | "normal" | "alta" | "urgente";
  status: "pendente" | "concluida" | "cancelada";
  responsible: string;
  completedAt?: string;
  evidence?: string;
  notes: string;
};
type MaintenanceCase = {
  id: string;
  propertyId: string;
  type: string;
  title: string;
  description: string;
  priority: "baixa" | "normal" | "alta" | "urgente";
  status: "identificado" | "analise" | "orcamento" | "aprovado" | "agendado" | "execucao" | "concluido" | "garantia" | "cancelado";
  responsibility?: "inquilino" | "senhorio" | "condominio" | "outro";
  supplier: string;
  expectedDate: string;
  executedDate: string;
  expectedCost: number;
  actualCost: number;
  paymentType?: string;
  warrantyUntil: string;
  tenantImpact: string;
  notes: string;
};
type Financing = {
  id: string;
  propertyId: string;
  institution: string;
  contractNumber: string;
  initialAmount: number;
  outstandingCapital: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  active: boolean;
  notes: string;
};
type FinancingPayment = {
  id: string;
  financingId: string;
  propertyId: string;
  paidDate: string;
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  notes: string;
};
type PerformanceGoal = {
  id: string;
  scope: "global" | "property";
  propertyId: string;
  metric: "netCashFlow" | "collectionRate" | "occupancy" | "operatingMargin";
  target: number;
  startDate: string;
  endDate: string;
  notes: string;
};
type AppState = {
  properties: Property[];
  tenants: Tenant[];
  leases: Lease[];
  movements: Movement[];
  taxes: Tax[];
  insurances: Insurance[];
  condominiums: Condo[];
  obligations: Obligation[];
  dismissedObligations: string[];
  maintenance: MaintenanceCase[];
  inventory: Inventory[];
  contacts: Contact[];
  documents: DocumentItem[];
  imports: ImportBatch[];
  financings: Financing[];
  financingPayments: FinancingPayment[];
  performanceGoals: PerformanceGoal[];
  rentLedgerStartDate?: string;
};

const EMPTY: AppState = {
  properties: [],
  tenants: [],
  leases: [],
  movements: [],
  taxes: [],
  insurances: [],
  condominiums: [],
  obligations: [],
  dismissedObligations: [],
  maintenance: [],
  inventory: [],
  contacts: [],
  documents: [],
  imports: [],
  financings: [],
  financingPayments: [],
  performanceGoals: [],
  rentLedgerStartDate: "",
};
const PAYMENT_METHODS = ["Transferência bancária", "MB Way", "Débito direto", "Referência Multibanco", "Cartão", "Numerário", "Cheque", "Compensação", "Outro"];
type NavItem = { id: View; label: string; icon: typeof Home };
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { id: "painel", label: "Painel", icon: Home },
      { id: "desempenho", label: "Desempenho", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Arrendamento",
    items: [
      { id: "imoveis", label: "Imóveis", icon: Building2 },
      { id: "inquilinos", label: "Inquilinos", icon: Users },
      { id: "contratos", label: "Contratos", icon: FileText },
      { id: "conta", label: "Rendas e recibos", icon: ReceiptText },
    ],
  },
  {
    label: "Manutenção",
    items: [
      { id: "manutencao", label: "Manutenção", icon: Wrench },
      { id: "inventario", label: "Inventário", icon: PackageCheck },
      { id: "contactos", label: "Contactos", icon: ContactRound },
    ],
  },
  {
    label: "Administração",
    items: [
      { id: "encargos", label: "Impostos e seguros", icon: Landmark },
      { id: "obrigacoes", label: "Obrigações", icon: ClipboardCheck },
      { id: "documentos", label: "Documentos", icon: ShieldCheck },
      { id: "calendario", label: "Calendário", icon: CalendarDays },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((group) => group.items);
const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
const shortDate = (value?: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
const dateForInput = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : (value ?? ""));
const dateFromInput = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value;
  const [, day, month, year] = match;
  const candidate = new Date(`${year}-${month}-${day}T00:00:00`);
  return candidate.getFullYear() === Number(year) && candidate.getMonth() + 1 === Number(month) && candidate.getDate() === Number(day) ? `${year}-${month}-${day}` : value;
};
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const fileUrl = (key: string) => (key.startsWith("http://") || key.startsWith("https://") ? key : `/api/documents?key=${encodeURIComponent(key)}`);
const exportVCard = (contact: Contact) => {
  const content = [`BEGIN:VCARD`, `VERSION:3.0`, `FN:${contact.name}`, contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : "", contact.email ? `EMAIL:${contact.email}` : "", contact.address ? `ADR:;;${contact.address};;;;` : "", contact.relation ? `NOTE:${contact.relation}` : "", `END:VCARD`].filter(Boolean).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/vcard" }));
  link.download = `${contact.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.vcf`;
  link.click();
  URL.revokeObjectURL(link.href);
};
const upsert = <T extends { id: string }>(items: T[], record: T, editId: string | null) => (editId ? items.map((item) => (item.id === editId ? record : item)) : [...items, record]);
const defaultOwnership = (): OwnershipPeriod[] => [{ id: uid("participacao"), percentage: 100, startDate: "", endDate: "" }];
const ownershipPercentage = (property: Property | undefined, date: string) => {
  const configured = Boolean(property?.ownershipPeriods?.length);
  const periods = configured ? property!.ownershipPeriods! : defaultOwnership();
  const matching = periods.filter((period) => (!period.startDate || period.startDate <= date) && (!period.endDate || period.endDate >= date)).sort((a, b) => (b.startDate || "0000").localeCompare(a.startDate || "0000"));
  return Math.min(100, Math.max(0, matching[0]?.percentage ?? (configured ? 0 : 100)));
};
const ownershipValue = (property: Property | undefined, value: number, date: string) => (value * ownershipPercentage(property, date)) / 100;
const normaliseState = (raw: Partial<AppState> | null): AppState => {
  const merged = { ...EMPTY, ...(raw ?? {}) };
  return {
    ...merged,
    properties: merged.properties.map((item) => ({
      ...item,
      gallery: item.gallery ?? [],
      buildingGroup: item.buildingGroup ?? "",
      permillage: item.permillage ?? 0,
      ownershipPeriods: item.ownershipPeriods?.length ? item.ownershipPeriods : defaultOwnership(),
    })),
    tenants: merged.tenants.map((item) => ({
      ...item,
      idDocumentType: item.idDocumentType ?? "",
      idDocumentNumber: item.idDocumentNumber ?? "",
      nationality: item.nationality ?? "",
      birthDate: item.birthDate ?? "",
      whatsapp: item.whatsapp ?? "",
    })),
    leases: merged.leases.map((item) => ({
      ...item,
      tenantIds: item.tenantIds?.length ? item.tenantIds : item.tenantId ? [item.tenantId] : [],
      stampDutyStatus: item.stampDutyStatus ?? "pendente",
      stampDutyAmount: item.stampDutyAmount ?? 0,
      stampDutyDate: item.stampDutyDate ?? "",
      stampDutyReference: item.stampDutyReference ?? "",
    })),
    movements: merged.movements.map((item) => ({
      ...item,
      paidAmount: item.paidAmount ?? (item.paid ? item.amount : 0),
      receiptStatus: item.receiptStatus ?? (item.receipt ? "emitido" : "nao_emitido"),
      receiptNumber: item.receiptNumber ?? "",
      receiptDate: item.receiptDate ?? "",
      paymentDate: item.paymentDate ?? "",
      paymentMethod: item.paymentMethod ?? "",
      source: item.source ?? (item.paymentMethod === "Importação Portal das Finanças" ? "import" : "manual"),
      notes: item.notes ?? "",
    })),
    condominiums: merged.condominiums.map((item) => ({
      ...item,
      allocationMode: item.allocationMode ?? "directa",
      buildingGroup: item.buildingGroup ?? "",
      paymentDate: item.paymentDate ?? "",
    })),
    taxes: merged.taxes.map((item) => ({
      ...item,
      paymentDate: item.paymentDate ?? "",
    })),
    insurances: merged.insurances.map((item) => ({
      ...item,
      paid: item.paid ?? false,
      paymentDate: item.paymentDate ?? "",
    })),
  };
};
type LedgerRow = {
  key: string;
  lease: Lease;
  period: string;
  dueDate: string;
  amount: number;
  paid: number;
  movements: Movement[];
  receiptEmitted: boolean;
};
type ReceiptImportRow = {
  row: number;
  reference: string;
  contractNumber: string;
  receiptNumber: string;
  tenant: string;
  periodStart: string;
  periodEnd: string;
  receivedAt: string;
  dueDate: string;
  receiptDate: string;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  notes: string;
  amount: number;
  withholding: number;
  received: number;
  propertyReference: string;
  status: string;
  leaseId: string;
  duplicate: boolean;
  error: string;
};
const RECEIPT_IMPORT_TEMPLATE_HEADERS = [
  "Referência",
  "Nº de Contrato",
  "Locatário",
  "Imóvel",
  "Período da renda",
  "Data de início",
  "Data de fim",
  "Data de vencimento",
  "Descrição",
  "Valor devido (€)",
  "Valor pago (€)",
  "Retenção IRS (€)",
  "Data do pagamento",
  "Tipo de pagamento",
  "Estado do recibo",
  "Nº de recibo",
  "Data de emissão",
  "Observações",
];
const RECEIPT_IMPORT_REQUIRED_HEADERS = ["Nº de Contrato", "Valor devido (€)"];

const clean = (value: unknown) => String(value ?? "").trim();
const normalText = (value: unknown) =>
  clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
const preparePersistedState = (raw: Partial<AppState> | null): AppState => normaliseState(raw);
const isoDate = (value: unknown) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = clean(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
};
const periodKey = (value: string) => {
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const match = value.match(/^(\d{1,2})[/-](\d{4})$/);
  return match ? `${match[2]}-${match[1].padStart(2, "0")}` : value;
};
const dateForMonth = (year: number, month: number, day: number) => {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(Math.max(day, 1), last)).padStart(2, "0")}`;
};
function rentLedger(state: AppState): LedgerRow[] {
  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const rows: LedgerRow[] = [];
  for (const lease of state.leases.filter((item) => item.status === "ativo" && item.start && item.rent > 0)) {
    const start = new Date(`${lease.start}T00:00:00Z`);
    const end = lease.end ? new Date(`${lease.end}T00:00:00Z`) : null;
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const dueDay = lease.rentDueDay || start.getUTCDate() || 1;
    while (cursor <= lastMonth && (!end || cursor <= end)) {
      const period = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
      const movements = state.movements.filter((item) => item.kind === "receita" && item.leaseId === lease.id && periodKey(item.period || item.dueDate) === period);
      const paid = movements.reduce((sum, item) => sum + (item.paidAmount ?? (item.paid ? item.amount : 0)), 0);
      const dueDate = dateForMonth(cursor.getUTCFullYear(), cursor.getUTCMonth(), dueDay);
      if (!state.rentLedgerStartDate || dueDate >= state.rentLedgerStartDate || movements.length)
        rows.push({
          key: `${lease.id}-${period}`,
          lease,
          period,
          dueDate,
          amount: lease.rent,
          paid,
          movements,
          receiptEmitted: movements.some((item) => (item.receiptStatus ?? (item.receipt ? "emitido" : "nao_emitido")) === "emitido"),
        });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  return rows.sort((a, b) => b.period.localeCompare(a.period));
}

type AlertItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  propertyId: string;
  priority: string;
  source: "manual" | "automatico";
  sourceKind: DialogKind;
  sourceId: string;
};
function alertFeed(state: AppState): AlertItem[] {
  const today = new Date();
  const year = today.getFullYear();
  const birthdayDate = (birthDate: string) => {
    const monthDay = birthDate.slice(5);
    let date = `${year}-${monthDay}`;
    if (date < today.toISOString().slice(0, 10)) date = `${year + 1}-${monthDay}`;
    return date;
  };
  const manual = state.obligations
    .filter((item) => item.status === "pendente")
    .map((item) => ({
      id: item.id,
      date: item.dueDate,
      category: item.category,
      title: item.title,
      propertyId: item.propertyId,
      priority: item.priority,
      source: "manual" as const,
      sourceKind: "obligation" as const,
      sourceId: item.id,
    }));
  const automatic = [
    ...state.leases
      .filter((item) => item.status === "ativo" && item.renewalDate)
      .map((item) => ({
        id: `lease-${item.id}`,
        date: item.renewalDate,
        category: "Contrato",
        title: "Renovação contratual",
        propertyId: item.propertyId,
        priority: "alta",
        source: "automatico" as const,
        sourceKind: "lease" as const,
        sourceId: item.id,
      })),
    ...state.insurances
      .filter((item) => item.renewalDate)
      .map((item) => ({
        id: `insurance-${item.id}`,
        date: item.renewalDate,
        category: "Seguro",
        title: `Renovação — ${item.scope}`,
        propertyId: item.propertyId,
        priority: "alta",
        source: "automatico" as const,
        sourceKind: "insurance" as const,
        sourceId: item.id,
      })),
    ...state.taxes
      .filter((item) => item.dueDate && !item.paid)
      .map((item) => ({
        id: `tax-${item.id}`,
        date: item.dueDate,
        category: "Imposto",
        title: item.tax,
        propertyId: item.propertyId,
        priority: "alta",
        source: "automatico" as const,
        sourceKind: "tax" as const,
        sourceId: item.id,
      })),
    ...state.condominiums
      .filter((item) => item.dueDate && !item.paid)
      .map((item) => ({
        id: `condo-${item.id}`,
        date: item.dueDate,
        category: "Condomínio",
        title: item.expenseType,
        propertyId: item.propertyId,
        priority: "normal",
        source: "automatico" as const,
        sourceKind: "condo" as const,
        sourceId: item.id,
      })),
    ...state.inventory
      .filter((item) => item.warrantyUntil)
      .map((item) => ({
        id: `warranty-${item.id}`,
        date: item.warrantyUntil,
        category: "Garantia",
        title: `Fim da garantia — ${item.item}`,
        propertyId: item.propertyId,
        priority: "normal",
        source: "automatico" as const,
        sourceKind: "inventory" as const,
        sourceId: item.id,
      })),
    ...state.maintenance
      .filter((item) => item.expectedDate && !["concluido", "cancelado"].includes(item.status))
      .map((item) => ({
        id: `maintenance-${item.id}`,
        date: item.expectedDate,
        category: "Manutenção",
        title: item.title,
        propertyId: item.propertyId,
        priority: item.priority,
        source: "automatico" as const,
        sourceKind: "maintenance" as const,
        sourceId: item.id,
      })),
    ...state.leases
      .filter((item) => item.status === "ativo" && (item.stampDutyStatus ?? "pendente") === "pendente")
      .map((item) => ({
        id: `stamp-${item.id}`,
        date: item.start,
        category: "Imposto do selo",
        title: "Confirmar pagamento do imposto do selo",
        propertyId: item.propertyId,
        priority: "alta",
        source: "automatico" as const,
        sourceKind: "lease" as const,
        sourceId: item.id,
      })),
    ...state.tenants
      .filter((item) => item.birthDate)
      .map((item) => {
        const lease = state.leases.find((leaseItem) => (leaseItem.tenantIds ?? [leaseItem.tenantId]).includes(item.id) && leaseItem.status === "ativo");
        return {
          id: `birthday-${item.id}`,
          date: birthdayDate(item.birthDate!),
          category: "Aniversário",
          title: `Aniversário — ${item.name}`,
          propertyId: lease?.propertyId ?? "",
          priority: "normal",
          source: "automatico" as const,
          sourceKind: "tenant" as const,
          sourceId: item.id,
        };
      }),
  ];
  return [...manual, ...automatic].filter((item) => item.date && !state.dismissedObligations.includes(item.id)).sort((a, b) => a.date.localeCompare(b.date));
}

export function PatrimonyApp() {
  const [view, setView] = useState<View>("painel");
  const [state, setState] = useState<AppState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogPrefill, setDialogPrefill] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const [syncError, setSyncError] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const documentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem("patrimony-sidebar-collapsed") === "true");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("patrimony-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(() => {
    setQuery("");
  }, [view]);

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, async (user) => {
        setFirebaseUser(user);
        setFirebaseError("");
        if (!user) {
          setLoaded(false);
          setFirebaseReady(true);
          return;
        }
        try {
          const reference = doc(firestore, "users", user.uid, "state", "current");
          const snapshot = await getDoc(reference);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setState(preparePersistedState(data.payload as Partial<AppState>));
            setLastSyncedAt(data.updatedAt?.toDate?.() ?? new Date());
          } else {
            const migrated = preparePersistedState(EMPTY);
            setState(migrated);
            await setDoc(reference, {
              payload: migrated,
              ownerEmail: user.email,
              migratedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setLastSyncedAt(new Date());
          }
          setLoaded(true);
        } catch (error) {
          setFirebaseError(error instanceof Error ? error.message : "Não foi possível ligar ao Firestore.");
          setLoaded(false);
        } finally {
          setFirebaseReady(true);
        }
      }),
    [],
  );
  useEffect(() => {
    if (!loaded || !firebaseUser) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      setSyncError(false);
      try {
        await setDoc(
          doc(firestore, "users", firebaseUser.uid, "state", "current"),
          {
            payload: state,
            ownerEmail: firebaseUser.email,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        setLastSyncedAt(new Date());
      } catch {
        setSyncError(true);
        setNotice("Não foi possível sincronizar a última alteração.");
      } finally {
        setSaving(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [state, loaded, firebaseUser]);

  const filteredState = useMemo(() => {
    const text = normalText(query);
    if (!text) return state;
    const propertyText = (id?: string) => normalText(state.properties.find((item) => item.id === id)?.name ?? "");
    const leaseText = (id?: string) => {
      const lease = state.leases.find((item) => item.id === id);
      if (!lease) return "";
      const tenants = (lease.tenantIds ?? [lease.tenantId]).map((tenantId) => state.tenants.find((item) => item.id === tenantId)?.name ?? "").join(" ");
      return normalText(`${JSON.stringify(lease)} ${propertyText(lease.propertyId)} ${tenants}`);
    };
    const textMatch = (record: unknown, related = "") => normalText(`${JSON.stringify(record)} ${related}`).includes(text);
    return {
      ...state,
      properties: state.properties.filter((item) => textMatch(item)),
      tenants: state.tenants.filter((item) => textMatch(item)),
      leases: state.leases.filter((item) => textMatch(item, leaseText(item.id))),
      movements: state.movements.filter((item) => textMatch(item, `${propertyText(item.propertyId)} ${leaseText(item.leaseId)}`)),
      taxes: state.taxes.filter((item) => textMatch(item, propertyText(item.propertyId))),
      insurances: state.insurances.filter((item) => textMatch(item, propertyText(item.propertyId))),
      condominiums: state.condominiums.filter((item) => textMatch(item, propertyText(item.propertyId))),
      obligations: state.obligations.filter((item) => textMatch(item, `${propertyText(item.propertyId)} ${leaseText(item.leaseId)}`)),
      maintenance: state.maintenance.filter((item) => textMatch(item, propertyText(item.propertyId))),
      inventory: state.inventory.filter((item) => textMatch(item, propertyText(item.propertyId))),
      contacts: state.contacts.filter((item) => textMatch(item, propertyText(item.propertyId))),
      documents: state.documents.filter((item) => textMatch(item, propertyText(item.propertyId))),
      financings: state.financings.filter((item) => textMatch(item, propertyText(item.propertyId))),
      financingPayments: state.financingPayments.filter((item) => textMatch(item, propertyText(item.propertyId))),
      performanceGoals: state.performanceGoals.filter((item) => textMatch(item, propertyText(item.propertyId))),
    };
  }, [state, query]);

  const dashboardDate = new Date().toISOString().slice(0, 10);
  const activeLeases = filteredState.leases.filter((lease) => lease.status === "ativo" && lease.start <= dashboardDate && (!lease.end || lease.end >= dashboardDate));
  const monthlyIncome = activeLeases.reduce((sum, lease) => sum + lease.rent, 0);
  const occupied = new Set(activeLeases.map((lease) => lease.propertyId)).size;
  const occupancy = filteredState.properties.length ? Math.round((occupied / filteredState.properties.length) * 100) : 0;
  const ledger = rentLedger(filteredState);
  const overdue = ledger.filter((item) => item.paid < item.amount && item.dueDate < new Date().toISOString().slice(0, 10)).length;
  const pendingCosts = filteredState.taxes.filter((item) => !item.paid).reduce((sum, item) => sum + item.amount, 0) + filteredState.condominiums.filter((item) => !item.paid).reduce((sum, item) => sum + item.amount, 0);
  const maintenanceActual = filteredState.maintenance.reduce((sum, item) => sum + item.actualCost, 0);
  const propertyName = (propertyId: string) => state.properties.find((item) => item.id === propertyId)?.name ?? "—";
  const patch = (next: Partial<AppState>) => setState((current) => ({ ...current, ...next }));
  const toggle = (collection: "movements" | "taxes" | "insurances" | "condominiums", recordId: string) =>
    patch({
      [collection]: state[collection].map((item) => (item.id === recordId ? { ...item, paid: !item.paid } : item)),
    } as Partial<AppState>);
  const openNew = (kind: DialogKind, prefill: Record<string, string> = {}) => {
    setEditId(null);
    setDialogPrefill(prefill);
    setDialog(kind);
  };
  const openEdit = (kind: DialogKind, recordId: string, prefill: Record<string, string> = {}) => {
    setEditId(recordId);
    setDialogPrefill(prefill);
    setDialog(kind);
  };
  const closeDialog = () => {
    setDialog(null);
    setEditId(null);
    setDialogPrefill({});
  };
  const deleteEntity = (kind: DialogKind, recordId: string) => {
    if (kind === "property") {
      const leaseIds = new Set(state.leases.filter((x) => x.propertyId === recordId).map((x) => x.id));
      const financingIds = new Set(state.financings.filter((x) => x.propertyId === recordId).map((x) => x.id));
      patch({
        properties: state.properties.filter((x) => x.id !== recordId),
        leases: state.leases.filter((x) => x.propertyId !== recordId),
        movements: state.movements.filter((x) => x.propertyId !== recordId && !leaseIds.has(x.leaseId ?? "")),
        taxes: state.taxes.filter((x) => x.propertyId !== recordId),
        insurances: state.insurances.filter((x) => x.propertyId !== recordId),
        condominiums: state.condominiums.filter((x) => x.propertyId !== recordId),
        obligations: state.obligations.filter((x) => x.propertyId !== recordId),
        maintenance: state.maintenance.filter((x) => x.propertyId !== recordId),
        inventory: state.inventory.filter((x) => x.propertyId !== recordId),
        contacts: state.contacts.filter((x) => x.propertyId !== recordId),
        financings: state.financings.filter((x) => x.propertyId !== recordId),
        financingPayments: state.financingPayments.filter((x) => x.propertyId !== recordId && !financingIds.has(x.financingId)),
        performanceGoals: state.performanceGoals.filter((x) => x.propertyId !== recordId),
      });
    }
    if (kind === "tenant") {
      const soleLeaseIds = new Set(state.leases.filter((x) => (x.tenantIds ?? [x.tenantId]).length === 1 && (x.tenantIds ?? [x.tenantId]).includes(recordId)).map((x) => x.id));
      patch({
        tenants: state.tenants.filter((x) => x.id !== recordId),
        leases: state.leases
          .filter((x) => !soleLeaseIds.has(x.id))
          .map((x) => ({
            ...x,
            tenantIds: (x.tenantIds ?? [x.tenantId]).filter((id) => id !== recordId),
            tenantId: (x.tenantIds ?? [x.tenantId]).filter((id) => id !== recordId)[0] ?? "",
          })),
        movements: state.movements.filter((x) => !soleLeaseIds.has(x.leaseId ?? "")),
      });
    }
    if (kind === "lease")
      patch({
        leases: state.leases.filter((x) => x.id !== recordId),
        movements: state.movements.filter((x) => x.leaseId !== recordId),
        obligations: state.obligations.filter((x) => x.leaseId !== recordId),
      });
    const map: Partial<Record<DialogKind, keyof AppState>> = {
      movement: "movements",
      tax: "taxes",
      insurance: "insurances",
      condo: "condominiums",
      obligation: "obligations",
      maintenance: "maintenance",
      inventory: "inventory",
      contact: "contacts",
      financing: "financings",
      financingPayment: "financingPayments",
      goal: "performanceGoals",
    };
    const collection = map[kind];
    if (collection)
      patch({
        [collection]: (state[collection] as { id: string }[]).filter((x) => x.id !== recordId),
      } as Partial<AppState>);
    setNotice("Registo eliminado com sucesso.");
    closeDialog();
  };

  async function uploadDocument(file?: File, propertyId = "") {
    if (!file) return;
    if (!firebaseUser) return;
    if (file.size > 20 * 1024 * 1024) {
      setNotice("O ficheiro não pode exceder 20 MB.");
      return;
    }
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
      const storageRef = ref(firebaseStorage, `users/${firebaseUser.uid}/documents/${crypto.randomUUID()}-${safeName}`);
      await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
      const downloadUrl = await getDownloadURL(storageRef);
      const item = {
        id: uid("doc"),
        propertyId,
        name: file.name,
        type: file.type || "Ficheiro",
        size: file.size,
        key: downloadUrl,
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({
        ...current,
        documents: [...current.documents, item],
      }));
      setNotice("Documento guardado no arquivo patrimonial.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar o documento.");
    }
  }

  const filteredProperties = useMemo(() => state.properties.filter((item) => `${item.name} ${item.address} ${item.postalCode}`.toLowerCase().includes(query.toLowerCase())), [state.properties, query]);
  if (!firebaseReady)
    return (
      <div className="app-loading">
        <img className="loading-logo" src="/rrs-icon.png" alt="RRS" />
        <div className="loading-spinner" aria-hidden="true" />
        <strong>A carregar o espaço patrimonial…</strong>
        <p>A preparar imóveis, contratos e informação financeira.</p>
      </div>
    );
  if (!firebaseUser)
    return (
      <div className="firebase-login">
        <section>
          <img className="firebase-login-logo" src="/rrs-icon.png" alt="RRS" />
          <span className="firebase-login-eyebrow">Controller Home</span>
          <h1>Gestão Patrimonial</h1>
          <h2>O seu património, organizado e sempre consigo.</h2>
          <p>Entre com a sua conta Google para guardar e sincronizar imóveis, contratos, rendas, documentos e obrigações no Firebase.</p>
          {firebaseError && <div className="firebase-error">{firebaseError}</div>}
          <button
            className="google-login"
            onClick={async () => {
              try {
                await signInWithPopup(firebaseAuth, googleProvider);
              } catch (error) {
                setFirebaseError(error instanceof Error ? error.message : "Não foi possível iniciar sessão.");
              }
            }}
          >
            <b>G</b>
            <strong>Continuar com a Google</strong>
          </button>
          <small>O acesso é gerido pela Google. A aplicação não recebe nem guarda a sua palavra-passe.</small>
        </section>
      </div>
    );
  if (!loaded)
    return (
      <div className="firebase-gate">
        <img className="loading-logo" src="/rrs-icon.png" alt="RRS" />
        <h1>Não foi possível abrir a base de dados</h1>
        <p>{firebaseError || "Verifique as regras do Firestore e tente novamente."}</p>
        <Button variant="outline" onClick={() => signOut(firebaseAuth)}>
          Escolher outra conta
        </Button>
      </div>
    );

  return (
    <div className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className={`${menu ? "sidebar open" : "sidebar"}${sidebarCollapsed ? " collapsed" : ""}`}>
        <div className="brand">
          <img className="brand-mark" src="/rrs-icon.png" alt="RRS" />
          <div>
            <strong>Controller Home</strong>
            <small>Gestão Patrimonial</small>
          </div>
          <button className="collapse-button" onClick={() => setSidebarCollapsed((current) => !current)} aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Minimizar menu lateral"} title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}>
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button className="mobile-close" onClick={() => setMenu(false)} aria-label="Fechar menu">
            <X />
          </button>
        </div>
        <nav aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <section className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={view === item.id ? "nav-item active" : "nav-item"}
                  onClick={() => {
                    setView(item.id);
                    setMenu(false);
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`sync-card sidebar-sync ${saving ? "saving" : syncError ? "error" : "synced"}`}>
            <i />
            <div>
              <strong>{saving ? "A sincronizar" : syncError ? "Não sincronizado" : "Sincronizado"}</strong>
              <small>{lastSyncedAt ? `Última: ${lastSyncedAt.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" })}, ${lastSyncedAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}` : "A preparar primeira sincronização"}</small>
            </div>
          </div>
          <div className="independent-note">
            <ShieldCheck />
            <div>
              <strong>Aplicação autónoma</strong>
              <span>Dados patrimoniais protegidos</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenu(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="topbar-context">
            <p>Património particular</p>
            <h1>{NAV.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="top-actions">
            <button
              className="user-session"
              onClick={async () => {
                await signOut(firebaseAuth);
              }}
            >
              <span className="avatar">{(firebaseUser.displayName || firebaseUser.email || "R").slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{firebaseUser.displayName || firebaseUser.email || "Utilizador"}</strong>
                <small>Terminar sessão</small>
              </span>
              <LogOut />
            </button>
            <button className="icon-button" aria-label="Notificações">
              <Bell />
            </button>
          </div>
        </header>
        <section className="content">
          {notice && (
            <div className="notice">
              <CircleAlert />
              <span>{notice}</span>
              <button onClick={() => setNotice("")}>
                <X />
              </button>
            </div>
          )}
          {view === "painel" && <Dashboard state={filteredState} propertyName={propertyName} properties={filteredState.properties.length} occupied={occupied} income={monthlyIncome} occupancy={occupancy} overdue={overdue} pendingCosts={pendingCosts} maintenanceActual={maintenanceActual} onArchive={uploadDocument} onNotice={setNotice} onObligations={() => setView("obrigacoes")} />}
          {view === "desempenho" && <PerformanceView state={filteredState} propertyName={propertyName} openNew={openNew} openEdit={openEdit} />}
          {view === "imoveis" && (
            <ListPage title="Imóveis" subtitle="Prédios e frações do património" action="Novo imóvel" onAction={() => openNew("property")} query={query} setQuery={setQuery}>
              {filteredProperties.length ? (
                <div className="property-grid">
                  {filteredProperties.map((property) => (
                    <button className="property-card" key={property.id} onClick={() => openEdit("property", property.id)}>
                      <div className={property.mainPhotoKey ? "property-visual has-photo" : "property-visual"}>{property.mainPhotoKey ? <img src={fileUrl(property.mainPhotoKey)} alt={property.name} /> : <Building2 />}</div>
                      <div className="property-body">
                        <div className="row-between">
                          <span className="edit-cue">
                            <Pencil />
                            Ver e editar
                          </span>
                        </div>
                        <h3>{property.name}</h3>
                        <p>{property.address}</p>
                        <small>
                          {property.postalCode || "Código postal por indicar"} · {property.locality || "Localidade por indicar"}
                        </small>
                        <small>
                          {property.type}
                          {property.fraction ? ` · Fração ${property.fraction}` : ""}
                          {property.energyRating ? ` · Classe ${property.energyRating}` : ""}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Building2} title="Ainda não existem imóveis" text="Crie o primeiro imóvel com os campos definidos a partir do modelo Excel." action="Criar imóvel" onAction={() => openNew("property")} />
              )}
            </ListPage>
          )}
          {view === "inquilinos" && (
            <ListPage title="Inquilinos" subtitle="Particulares e empresas associados aos contratos" action="Novo inquilino" onAction={() => openNew("tenant")} query={query} setQuery={setQuery}>
              <DataTable headers={["Nome", "Tipo", "NIF", "Nascimento", "WhatsApp", "Email", "Ações"]} rows={filteredState.tenants.map((tenant) => [tenant.name, tenant.entityType, tenant.taxId || "—", shortDate(tenant.birthDate), tenant.whatsapp || tenant.mobile || "—", tenant.email || "—", <EditButton key={tenant.id} onClick={() => openEdit("tenant", tenant.id)} />])} empty="Ainda não existem inquilinos." />
            </ListPage>
          )}
          {view === "contratos" && (
            <ListPage title="Contratos" subtitle="Arrendamentos, cauções, rendas e renovações" action="Novo contrato" onAction={() => openNew("lease")} query={query} setQuery={setQuery}>
              <DataTable
                headers={["Imóvel", "Inquilinos", "Início", "Renovação", "Renda", "Imposto do selo", "Estado", "Ações"]}
                rows={filteredState.leases.map((lease) => [
                  propertyName(lease.propertyId),
                  (lease.tenantIds ?? [lease.tenantId])
                    .map((id) => state.tenants.find((item) => item.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "—",
                  shortDate(lease.start),
                  shortDate(lease.renewalDate),
                  money(lease.rent),
                  lease.stampDutyStatus === "pago" ? (
                    `Pago · ${money(lease.stampDutyAmount ?? 0)}`
                  ) : lease.stampDutyStatus === "isento" ? (
                    "Isento"
                  ) : (
                    <span key={`${lease.id}-stamp`} className="negative">
                      Pendente
                    </span>
                  ),
                  <Status key={`${lease.id}-status`} active={lease.status === "ativo"} yes="Ativo" no="Rascunho" />,
                  <EditButton key={lease.id} onClick={() => openEdit("lease", lease.id)} />,
                ])}
                empty="Ainda não existem contratos."
              />
            </ListPage>
          )}
          {view === "conta" && <ReceiptsView state={filteredState} sourceState={state} patch={patch} propertyName={propertyName} openNew={(prefill) => openNew("movement", prefill)} openEdit={(id) => openEdit("movement", id)} setNotice={setNotice} query={query} setQuery={setQuery} />}
          {view === "encargos" && <Charges state={filteredState} propertyName={propertyName} open={(kind) => openNew(kind)} openEdit={openEdit} toggle={toggle} query={query} setQuery={setQuery} />}
          {view === "obrigacoes" && (
            <ObligationsView
              state={filteredState}
              query={query}
              setQuery={setQuery}
              propertyName={propertyName}
              openNew={() => openNew("obligation")}
              openEdit={openEdit}
              onDelete={(item) => {
                if (item.source === "manual")
                  patch({
                    obligations: state.obligations.filter((record) => record.id !== item.id),
                  });
                else
                  patch({
                    dismissedObligations: [...new Set([...state.dismissedObligations, item.id])],
                  });
                setNotice(item.source === "manual" ? "Obrigação eliminada." : "Obrigação automática ocultada. O registo de origem foi mantido.");
              }}
            />
          )}
          {view === "manutencao" && <MaintenanceView state={filteredState} propertyName={propertyName} openNew={() => openNew("maintenance")} openEdit={(id) => openEdit("maintenance", id)} query={query} setQuery={setQuery} />}
          {view === "inventario" && (
            <ListPage title="Inventário" subtitle="Equipamentos, mobiliário e respetivo estado" action="Novo item" onAction={() => openNew("inventory")} query={query} setQuery={setQuery}>
              <SummaryStrip
                items={[
                  {
                    label: "Itens",
                    value: String(state.inventory.reduce((sum, item) => sum + item.quantity, 0)),
                  },
                  {
                    label: "Valor registado",
                    value: money(state.inventory.reduce((sum, item) => sum + item.value * item.quantity, 0)),
                  },
                  {
                    label: "Com garantia",
                    value: String(state.inventory.filter((item) => item.warrantyUntil && item.warrantyUntil >= new Date().toISOString().slice(0, 10)).length),
                  },
                ]}
              />
              <DataTable headers={["Foto", "Imóvel", "Divisão", "Item", "Marca / modelo", "Qtd.", "Estado", "Valor", "Garantia", "Ações"]} rows={filteredState.inventory.map((item) => [item.photoKey ? <img key={item.id} className="item-thumb" src={fileUrl(item.photoKey)} alt={item.item} /> : "—", propertyName(item.propertyId), item.room || "—", item.item, [item.brand, item.model].filter(Boolean).join(" / ") || "—", String(item.quantity), item.condition, money(item.value), shortDate(item.warrantyUntil), <EditButton key={item.id} onClick={() => openEdit("inventory", item.id)} />])} empty="Ainda não existem itens no inventário." />
            </ListPage>
          )}
          {view === "contactos" && (
            <ListPage title="Contactos" subtitle="Entidades e prestadores associados aos imóveis" action="Novo contacto" onAction={() => openNew("contact")} query={query} setQuery={setQuery}>
              <div className="integration-note">A integração é feita por ficheiro vCard (.vcf), compatível com Contactos e iCloud, sem guardar credenciais Apple.</div>
              <DataTable
                headers={["Nome", "Relação", "Imóvel", "Telefone", "Email", "Morada", "iCloud", "Ações"]}
                rows={filteredState.contacts.map((item) => [
                  item.name,
                  item.relation,
                  propertyName(item.propertyId),
                  item.phone || "—",
                  item.email || "—",
                  item.address || "—",
                  <Button key={`${item.id}-vcard`} variant="outline" size="sm" onClick={() => exportVCard(item)}>
                    Exportar vCard
                  </Button>,
                  <EditButton key={item.id} onClick={() => openEdit("contact", item.id)} />,
                ])}
                empty="Ainda não existem contactos."
              />
            </ListPage>
          )}
          {view === "documentos" && <DocumentsView state={filteredState} propertyName={propertyName} inputRef={documentRef} uploadDocument={uploadDocument} query={query} setQuery={setQuery} />}
          {view === "calendario" && <CalendarView state={filteredState} propertyName={propertyName} query={query} setQuery={setQuery} />}
        </section>
      </main>
      <EntityDialog
        key={`${dialog ?? "closed"}-${editId ?? "new"}-${JSON.stringify(dialogPrefill)}`}
        kind={dialog}
        editId={editId}
        prefill={dialogPrefill}
        onClose={closeDialog}
        state={state}
        onSave={(next) => {
          patch(next);
          closeDialog();
        }}
        onDelete={deleteEntity}
      />
    </div>
  );
}

function Dashboard({ state, propertyName, properties, occupied, income, occupancy, overdue, pendingCosts, maintenanceActual, onArchive, onNotice, onObligations }: { state: AppState; propertyName: (id: string) => string; properties: number; occupied: number; income: number; occupancy: number; overdue: number; pendingCosts: number; maintenanceActual: number; onArchive: (file?: File) => Promise<void>; onNotice: (message: string) => void; onObligations: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const alerts = alertFeed(state);
  const overdueAlerts = alerts.filter((item) => item.date < today).length;
  const currentLeases = state.leases.filter((lease) => lease.status === "ativo" && lease.start <= today && (!lease.end || lease.end >= today));
  const currentLeaseByProperty = new Map(currentLeases.map((lease) => [lease.propertyId, lease]));
  const occupiedProperties = state.properties.filter((property) => currentLeaseByProperty.has(property.id));
  const availableProperties = state.properties.filter((property) => !currentLeaseByProperty.has(property.id));
  const leaseTenants = (lease: Lease) => (lease.tenantIds ?? [lease.tenantId]).map((id) => state.tenants.find((tenant) => tenant.id === id)?.name).filter(Boolean).join(" e ");
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <>
      <div className="hero">
        <div>
          <span className="eyebrow">Visão geral</span>
          <h2>O seu património, num só lugar.</h2>
          <p>Operação, obrigações e documentação numa aplicação totalmente independente.</p>
        </div>
        <div className="hero-actions">
          <Button onClick={() => setReportOpen(true)}>
            <FileText />
            Gerar relatório patrimonial
          </Button>
        </div>
      </div>
      <div className="metrics">
        <Metric label="Imóveis" value={String(properties)} detail={`${occupied} ocupados`} />
        <Metric label="Renda mensal" value={money(income)} detail="Contratos ativos" />
        <Metric label="Obras realizadas" value={money(maintenanceActual)} detail="Custo real registado" />
        <Metric label="Encargos pendentes" value={money(pendingCosts)} detail="Impostos e condomínio" />
        <Metric label="Alertas vencidos" value={String(overdueAlerts + overdue)} detail="Obrigações e rendas" />
      </div>
      <div className="dashboard-grid">
        <article className="panel occupancy-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Operação</span>
              <h3>Estado do património</h3>
            </div>
            <span className="period">Atual</span>
          </div>
          <div className="occupancy">
            <div className="ring" style={{ "--progress": `${occupancy * 3.6}deg` } as React.CSSProperties}>
              <strong>{occupancy}%</strong>
              <span>ocupação</span>
            </div>
            <div className="legend">
              <p>
                <i className="dot green" />
                Ocupados <strong>{occupied}</strong>
              </p>
              <p>
                <i className="dot sand" />
                Disponíveis <strong>{Math.max(0, properties - occupied)}</strong>
              </p>
              <p>
                <i className="dot navy" />
                Total <strong>{properties}</strong>
              </p>
            </div>
          </div>
          <div className="occupancy-breakdown">
            <section className="occupancy-group occupied-list">
              <header>
                <span><i className="dot green" /> Imóveis ocupados</span>
                <strong>{occupiedProperties.length}</strong>
              </header>
              <div>
                {occupiedProperties.map((property) => {
                  const lease = currentLeaseByProperty.get(property.id)!;
                  return (
                    <article key={property.id}>
                      <strong>{property.name}</strong>
                      <small>{leaseTenants(lease) || "Inquilino por identificar"} · {money(lease.rent)}/mês{lease.portalContractNumber ? ` · Contrato ${lease.portalContractNumber}` : ""}</small>
                    </article>
                  );
                })}
                {!occupiedProperties.length && <p>Nenhum imóvel com contrato ativo.</p>}
              </div>
            </section>
            <section className="occupancy-group available-list">
              <header>
                <span><i className="dot sand" /> Imóveis livres</span>
                <strong>{availableProperties.length}</strong>
              </header>
              <div>
                {availableProperties.map((property) => (
                  <article key={property.id}>
                    <strong>{property.name}</strong>
                    <small>{property.address || "Morada por indicar"} · Sem contrato ativo</small>
                  </article>
                ))}
                {!availableProperties.length && <p>Todos os imóveis têm contrato ativo.</p>}
              </div>
            </section>
          </div>
        </article>
        <article className="panel obligations-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Atenção</span>
              <h3>Próximas obrigações</h3>
            </div>
            <button className="panel-link" onClick={onObligations}>
              Ver todas
            </button>
          </div>
          <div className="alert-list">
            {alerts.slice(0, 5).map((item) => (
              <button key={item.id} onClick={onObligations}>
                <span className={`alert-date ${item.date < today ? "late" : ""}`}>
                  <strong>{new Date(`${item.date}T00:00:00`).getDate()}</strong>
                  <small>{new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-PT", { month: "short" })}</small>
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {propertyName(item.propertyId)} · {item.category}
                  </small>
                </span>
                <i className={`priority-dot ${item.priority}`} />
              </button>
            ))}
            {!alerts.length && <p className="empty-mini">Sem obrigações pendentes.</p>}
          </div>
        </article>
      </div>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} state={state} propertyName={propertyName} onArchive={onArchive} onNotice={onNotice} />
    </>
  );
}

type ReportConfig = {
  referenceDate: string;
  from: string;
  to: string;
  propertyId: string;
  basis: "caixa" | "competencia" | "ambos";
  detail: "executivo" | "completo";
  pdf: boolean;
  excel: boolean;
  includePersonalData: boolean;
  archive: boolean;
  recentDays: number;
  contractDays: number;
};
type ReportSummary = {
  expected: number;
  received: number;
  expenses: number;
  financing: number;
  operating: number;
  net: number;
  collection: number;
};
type ReportModel = {
  generatedAt: string;
  config: ReportConfig;
  properties: Property[];
  tenants: Tenant[];
  leases: Lease[];
  ledger: LedgerRow[];
  summaries: { label: string; value: ReportSummary }[];
  freeProperties: Property[];
  activeLeases: Lease[];
  recentLeases: Lease[];
  endingLeases: Lease[];
  renewingLeases: Lease[];
  alerts: AlertItem[];
  expenses: (string | number)[][];
  insights: string[];
  quality: string[];
};

const daysFrom = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const inRange = (date: string, from: string, to: string) => Boolean(date && date >= from && date <= to);

function reportSummary(state: AppState, propertyIds: Set<string>, leaseIds: Set<string>, ledger: LedgerRow[], from: string, to: string, basis: "caixa" | "competencia", perspective: "total" | "owned" = "total"): ReportSummary {
  const value = (propertyId: string, amount: number, date: string) =>
    perspective === "owned"
      ? ownershipValue(
          state.properties.find((item) => item.id === propertyId),
          amount,
          date,
        )
      : amount;
  const expected = ledger.reduce((sum, row) => sum + value(row.lease.propertyId, row.amount, row.dueDate), 0);
  const received = state.movements.filter((item) => item.kind === "receita" && leaseIds.has(item.leaseId ?? "") && inRange(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate, from, to)).reduce((sum, item) => sum + value(item.propertyId, item.paidAmount ?? (item.paid ? item.amount : 0), basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
  const movementCosts = state.movements.filter((item) => item.kind === "despesa" && propertyIds.has(item.propertyId) && inRange(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate, from, to)).reduce((sum, item) => sum + value(item.propertyId, basis === "caixa" ? (item.paidAmount ?? (item.paid ? item.amount : 0)) : item.amount, basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
  const taxes = state.taxes.filter((item) => propertyIds.has(item.propertyId) && inRange(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate, from, to) && (basis === "competencia" || item.paid)).reduce((sum, item) => sum + value(item.propertyId, item.amount, basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
  const insurances = state.insurances.filter((item) => propertyIds.has(item.propertyId) && inRange(basis === "caixa" ? item.paymentDate || item.renewalDate || item.startDate : item.renewalDate || item.startDate, from, to) && (basis === "competencia" || item.paid)).reduce((sum, item) => sum + value(item.propertyId, item.premium, basis === "caixa" ? item.paymentDate || item.renewalDate || item.startDate : item.renewalDate || item.startDate), 0);
  const maintenance = state.maintenance.filter((item) => propertyIds.has(item.propertyId) && item.actualCost > 0 && inRange(item.executedDate || item.expectedDate, from, to)).reduce((sum, item) => sum + value(item.propertyId, item.actualCost, item.executedDate || item.expectedDate), 0);
  const condo = state.condominiums
    .filter((item) => inRange(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate, from, to) && (basis === "competencia" || item.paid))
    .reduce((sum, item) => {
      const allocationDate = basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate;
      if ((item.allocationMode ?? "directa") === "directa") return sum + (propertyIds.has(item.propertyId) ? value(item.propertyId, item.amount, allocationDate) : 0);
      const group = item.buildingGroup || state.properties.find((property) => property.id === item.propertyId)?.buildingGroup || "";
      const groupProperties = state.properties.filter((property) => property.buildingGroup === group);
      const totalPermillage = groupProperties.reduce((total, property) => total + (property.permillage || 0), 0);
      if (!group || totalPermillage <= 0) return sum;
      return sum + groupProperties.filter((property) => propertyIds.has(property.id)).reduce((total, property) => total + value(property.id, item.amount * ((property.permillage || 0) / totalPermillage), allocationDate), 0);
    }, 0);
  const expenses = movementCosts + taxes + insurances + maintenance + condo;
  const financing = state.financingPayments.filter((item) => propertyIds.has(item.propertyId) && inRange(item.paidDate, from, to)).reduce((sum, item) => sum + value(item.propertyId, item.amount, item.paidDate), 0);
  return {
    expected,
    received,
    expenses,
    financing,
    operating: received - expenses,
    net: received - expenses - financing,
    collection: expected ? (received / expected) * 100 : 0,
  };
}

function buildReportModel(state: AppState, config: ReportConfig): ReportModel {
  const properties = state.properties.filter((item) => !config.propertyId || item.id === config.propertyId);
  const propertyIds = new Set(properties.map((item) => item.id));
  const leases = state.leases.filter((item) => propertyIds.has(item.propertyId));
  const leaseIds = new Set(leases.map((item) => item.id));
  const ledger = rentLedger(state).filter((row) => leaseIds.has(row.lease.id) && inRange(row.dueDate, config.from, config.to));
  const tenantIds = new Set(leases.flatMap((lease) => lease.tenantIds ?? [lease.tenantId]));
  const tenants = state.tenants.filter((tenant) => tenantIds.has(tenant.id));
  const bases: ("caixa" | "competencia")[] = config.basis === "ambos" ? ["caixa", "competencia"] : [config.basis];
  const summaries = bases.flatMap((basis) => [
    {
      label: `${basis === "caixa" ? "Caixa" : "Competência"} — total dos imóveis`,
      value: reportSummary(state, propertyIds, leaseIds, ledger, config.from, config.to, basis, "total"),
    },
    {
      label: `${basis === "caixa" ? "Caixa" : "Competência"} — minha participação`,
      value: reportSummary(state, propertyIds, leaseIds, ledger, config.from, config.to, basis, "owned"),
    },
  ]);
  const activeLeases = leases.filter((lease) => lease.status === "ativo" && lease.start <= config.referenceDate && (!lease.end || lease.end >= config.referenceDate));
  const occupiedIds = new Set(activeLeases.map((lease) => lease.propertyId));
  const freeProperties = properties.filter((property) => !occupiedIds.has(property.id));
  const recentFrom = daysFrom(config.referenceDate, -config.recentDays);
  const futureTo = daysFrom(config.referenceDate, config.contractDays);
  const recentLeases = leases.filter((lease) => inRange(lease.start, recentFrom, config.referenceDate));
  const endingLeases = leases.filter((lease) => inRange(lease.end, config.referenceDate, futureTo));
  const renewingLeases = leases.filter((lease) => inRange(lease.renewalDate, config.referenceDate, futureTo));
  const alerts = alertFeed(state).filter((item) => !item.propertyId || propertyIds.has(item.propertyId));
  const expenses: (string | number)[][] = [...state.taxes.filter((item) => propertyIds.has(item.propertyId) && inRange(item.dueDate, config.from, config.to)).map((item) => ["Imposto", item.tax, item.propertyId, item.dueDate, item.amount, item.paid ? "Pago" : "Pendente"]), ...state.insurances.filter((item) => propertyIds.has(item.propertyId) && inRange(item.renewalDate || item.startDate, config.from, config.to)).map((item) => ["Seguro", item.scope, item.propertyId, item.renewalDate || item.startDate, item.premium, item.paid ? "Pago" : "Pendente"]), ...state.condominiums.filter((item) => propertyIds.has(item.propertyId) && inRange(item.dueDate, config.from, config.to)).map((item) => ["Condomínio", item.expenseType, item.propertyId, item.dueDate, item.amount, item.paid ? "Pago" : "Pendente"]), ...state.maintenance.filter((item) => propertyIds.has(item.propertyId) && item.actualCost > 0 && inRange(item.executedDate || item.expectedDate, config.from, config.to)).map((item) => [item.type, item.title, item.propertyId, item.executedDate || item.expectedDate, item.actualCost, item.status])];
  const overdueRows = ledger.filter((row) => row.dueDate < config.referenceDate && row.paid < row.amount);
  const missingReceipts = ledger.filter((row) => row.paid > 0 && !row.receiptEmitted);
  const insights: string[] = [];
  const primary = summaries[0]?.value;
  const ownedPrimary = summaries.find((item) => item.label.includes("minha participação"))?.value;
  if (primary?.net < 0) insights.push(`Cash flow negativo no período: ${money(primary.net)}.`);
  if (ownedPrimary && ownedPrimary.net < 0) insights.push(`Cash flow negativo da sua participação no período: ${money(ownedPrimary.net)}.`);
  if (overdueRows.length) insights.push(`${overdueRows.length} renda(s) em atraso, num total de ${money(overdueRows.reduce((sum, row) => sum + Math.max(0, row.amount - row.paid), 0))}.`);
  if (missingReceipts.length) insights.push(`${missingReceipts.length} recibo(s) por emitir para rendas com pagamento registado.`);
  if (freeProperties.length) insights.push(`${freeProperties.length} imóvel(is) livre(s) ou sem contrato ativo confirmado.`);
  if (endingLeases.length || renewingLeases.length) insights.push(`${endingLeases.length} contrato(s) a terminar e ${renewingLeases.length} a renovar nos próximos ${config.contractDays} dias.`);
  const quality: string[] = [];
  properties.filter((item) => item.buildingGroup && !item.permillage).forEach((item) => quality.push(`${item.name}: prédio indicado sem permilagem.`));
  leases.filter((item) => !item.end && !item.renewalDate).forEach((item) => quality.push(`${item.portalContractNumber || item.id}: contrato sem termo nem renovação.`));
  leases.filter((item) => !(item.tenantIds ?? [item.tenantId]).filter(Boolean).length).forEach((item) => quality.push(`${item.portalContractNumber || item.id}: contrato sem inquilino.`));
  state.financings.filter((item) => propertyIds.has(item.propertyId) && item.active && !state.financingPayments.some((payment) => payment.financingId === item.id && inRange(payment.paidDate, config.from, config.to))).forEach((item) => quality.push(`${item.institution} — ${properties.find((property) => property.id === item.propertyId)?.name}: financiamento sem pagamentos no período.`));
  state.taxes.filter((item) => propertyIds.has(item.propertyId) && item.paid && !item.paymentDate).forEach((item) => quality.push(`${item.tax}: imposto pago sem data de pagamento.`));
  state.insurances.filter((item) => propertyIds.has(item.propertyId) && item.paid && !item.paymentDate).forEach((item) => quality.push(`${item.policy}: seguro pago sem data de pagamento.`));
  state.condominiums.filter((item) => propertyIds.has(item.propertyId) && item.allocationMode === "permilagem" && !item.buildingGroup).forEach((item) => quality.push(`${item.expenseType}: despesa por permilagem sem grupo de repartição.`));
  if (!quality.length) quality.push("Não foram detetadas lacunas estruturais nos dados selecionados.");
  return {
    generatedAt: new Date().toISOString(),
    config,
    properties,
    tenants,
    leases,
    ledger,
    summaries,
    freeProperties,
    activeLeases,
    recentLeases,
    endingLeases,
    renewingLeases,
    alerts,
    expenses,
    insights,
    quality,
  };
}

type PdfLine = { text: string; bold?: boolean };
const reportTenantNames = (lease: Lease, model: ReportModel) =>
  (lease.tenantIds ?? [lease.tenantId])
    .map((id) => model.tenants.find((tenant) => tenant.id === id)?.name)
    .filter(Boolean)
    .join(", ") || "—";
const reportPropertyName = (propertyId: string, model: ReportModel) => model.properties.find((property) => property.id === propertyId)?.name ?? "—";
const line = (text: string, bold = false): PdfLine => ({ text, bold });

function reportPdfLines(model: ReportModel): PdfLine[] {
  const result: PdfLine[] = [line("RELATÓRIO PATRIMONIAL", true), line(`Gerado em ${new Date(model.generatedAt).toLocaleString("pt-PT")}`), line(`Período: ${shortDate(model.config.from)} a ${shortDate(model.config.to)} | Referência: ${shortDate(model.config.referenceDate)}`), line(`Âmbito: ${model.config.propertyId ? reportPropertyName(model.config.propertyId, model) : "Todo o património"}`), line("")];
  result.push(line("SUMÁRIO EXECUTIVO", true), line(`Imóveis: ${model.properties.length} | Ocupados: ${model.properties.length - model.freeProperties.length} | Livres/sem contrato: ${model.freeProperties.length}`), line(`Contratos ativos: ${model.activeLeases.length} | Inquilinos associados: ${model.tenants.length}`));
  model.summaries.forEach(({ label, value }) => result.push(line(`${label}: previsto ${money(value.expected)} | recebido ${money(value.received)} | despesas ${money(value.expenses)} | financiamento ${money(value.financing)} | cash flow ${money(value.net)} | cobrança ${value.collection.toFixed(1).replace(".", ",")}%`)));
  result.push(line(""), line("CONTRATOS A ACOMPANHAR", true), line(`Iniciados nos últimos ${model.config.recentDays} dias: ${model.recentLeases.length}`), ...model.recentLeases.map((lease) => line(`• ${lease.portalContractNumber || lease.id} | ${reportPropertyName(lease.propertyId, model)} | início ${shortDate(lease.start)} | ${money(lease.rent)}/mês`)), line(`A terminar nos próximos ${model.config.contractDays} dias: ${model.endingLeases.length}`), ...model.endingLeases.map((lease) => line(`• ${lease.portalContractNumber || lease.id} | termo ${shortDate(lease.end)} | ${reportTenantNames(lease, model)}`)), line(`A renovar nos próximos ${model.config.contractDays} dias: ${model.renewingLeases.length}`), ...model.renewingLeases.map((lease) => line(`• ${lease.portalContractNumber || lease.id} | renovação ${shortDate(lease.renewalDate)} | ${reportTenantNames(lease, model)}`)));
  result.push(line(""), line("INSIGHTS", true), ...(model.insights.length ? model.insights.map((item) => line(`• ${item}`)) : [line("Sem desvios prioritários detetados para os critérios selecionados.")]));
  result.push(line(""), line("QUALIDADE DOS DADOS", true), ...model.quality.map((item) => line(`• ${item}`)));
  if (model.config.detail === "completo") {
    result.push(line(""), line("IMÓVEIS", true), ...model.properties.map((property) => line(`• ${property.name} | ${property.status} | ${property.address} | Fração ${property.fraction || "—"} | Participação atual ${ownershipPercentage(property, model.config.referenceDate).toFixed(2).replace(".", ",")}% | Permilagem ${property.permillage || "—"}‰`)));
    result.push(line(""), line("INQUILINOS", true), ...model.tenants.map((tenant) => line(`• ${tenant.name}${model.config.includePersonalData ? ` | NIF ${tenant.taxId || "—"} | ${tenant.email || "—"} | ${tenant.mobile || tenant.phone || "—"}` : ""}`)));
    result.push(line(""), line("CONTRATOS", true), ...model.leases.map((lease) => line(`• ${lease.portalContractNumber || lease.id} | ${reportPropertyName(lease.propertyId, model)} | ${reportTenantNames(lease, model)} | ${shortDate(lease.start)} a ${shortDate(lease.end)} | ${money(lease.rent)}`)));
    result.push(line(""), line("RENDAS E RECIBOS", true), ...model.ledger.map((row) => line(`• ${row.period} | ${reportPropertyName(row.lease.propertyId, model)} | previsto ${money(row.amount)} | recebido ${money(row.paid)} | recibo ${row.receiptEmitted ? "emitido" : row.paid > 0 ? "por emitir" : "a aguardar"}`)));
    result.push(line(""), line("OBRIGAÇÕES", true), ...model.alerts.map((item) => line(`• ${shortDate(item.date)} | ${item.category} | ${item.title} | ${reportPropertyName(item.propertyId, model)}`)));
  }
  result.push(line(""), line("NOTA", true), line("Relatório gerado com os dados existentes na aplicação. Valores potenciais, dados incompletos e estimativas não constituem liquidação fiscal, avaliação imobiliária ou parecer jurídico."));
  return result;
}

function wrapPdfLines(lines: PdfLine[], width = 96): PdfLine[] {
  return lines.flatMap((item) => {
    if (!item.text) return [item];
    const words = item.text.split(/\s+/);
    const parts: string[] = [];
    let current = "";
    words.forEach((word) => {
      if ((current ? `${current} ${word}` : word).length > width && current) {
        parts.push(current);
        current = word;
      } else current = current ? `${current} ${word}` : word;
    });
    if (current) parts.push(current);
    return parts.map((text) => ({ text, bold: item.bold }));
  });
}
const pdfEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--");
function binaryBytes(value: string) {
  const euroAndSymbols: Record<number, number> = { 0x20ac: 0x80, 0x2022: 0x95 };
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes[index] = euroAndSymbols[code] ?? (code <= 255 ? code : 63);
  }
  return bytes;
}
function buildPdf(lines: PdfLine[]) {
  const wrapped = wrapPdfLines(lines);
  const perPage = 50;
  const pages = Array.from({ length: Math.max(1, Math.ceil(wrapped.length / perPage)) }, (_, index) => wrapped.slice(index * perPage, (index + 1) * perPage));
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  const contentIds = pages.map((_, index) => 6 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  pages.forEach((page, index) => {
    const content = [`BT`, `/F1 9 Tf`, `42 800 Td`, `13 TL`, ...page.flatMap((item) => [`/${item.bold ? "F2" : "F1"} ${item.bold ? 10 : 9} Tf`, `(${pdfEscape(item.text)}) Tj`, `T*`]), `ET`].join("\n");
    objects[pageIds[index]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
    objects[contentIds[index]] = `<< /Length ${binaryBytes(content).length} >>\nstream\n${content}\nendstream`;
  });
  const maxId = Math.max(...pageIds, ...contentIds, 4);
  const chunks: Uint8Array[] = [binaryBytes("%PDF-1.4\n%âãÏÓ\n")];
  const offsets = Array(maxId + 1).fill(0);
  let offset = chunks[0].length;
  for (let id = 1; id <= maxId; id += 1) {
    const chunk = binaryBytes(`${id} 0 obj\n${objects[id]}\nendobj\n`);
    offsets[id] = offset;
    chunks.push(chunk);
    offset += chunk.length;
  }
  const xrefOffset = offset;
  const xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((value) => `${String(value).padStart(10, "0")} 00000 n `)
    .join("\n")}\ntrailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(binaryBytes(xref));
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, cursor);
    cursor += chunk.length;
  });
  return output;
}

function downloadGeneratedFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function reportFiles(model: ReportModel) {
  const suffix = `${model.config.to}-${model.config.detail}`;
  const files: File[] = [];
  if (model.config.pdf) files.push(new File([buildPdf(reportPdfLines(model))], `relatorio-patrimonial-${suffix}.pdf`, { type: "application/pdf" }));
  if (model.config.excel) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const add = (name: string, rows: unknown[][]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
    add("Resumo", [["Relatório patrimonial"], ["Gerado", new Date(model.generatedAt).toLocaleString("pt-PT")], ["Período", model.config.from, model.config.to], ["Imóveis", model.properties.length], ["Livres ou sem contrato", model.freeProperties.length], ...model.summaries.flatMap(({ label, value }) => [[label], ["Previsto", value.expected], ["Recebido", value.received], ["Despesas", value.expenses], ["Financiamento", value.financing], ["Resultado operacional", value.operating], ["Cash flow", value.net], ["Taxa de cobrança", value.collection]])]);
    if (model.config.detail === "completo") {
      add("Imóveis", [["Imóvel", "Morada", "Fração", "Estado", "Prédio", "Permilagem", "Participação na referência (%)"], ...model.properties.map((item) => [item.name, item.address, item.fraction, item.status, item.buildingGroup || "", item.permillage || "", ownershipPercentage(item, model.config.referenceDate)])]);
      add("Histórico participação", [["Imóvel", "Percentagem", "Desde", "Até"], ...model.properties.flatMap((item) => (item.ownershipPeriods?.length ? item.ownershipPeriods : defaultOwnership()).map((period) => [item.name, period.percentage, period.startDate, period.endDate]))]);
      add("Inquilinos", [["Nome", ...(model.config.includePersonalData ? ["NIF", "Documento", "Número", "Email", "Telemóvel", "WhatsApp"] : [])], ...model.tenants.map((item) => [item.name, ...(model.config.includePersonalData ? [item.taxId, item.idDocumentType, item.idDocumentNumber, item.email, item.mobile, item.whatsapp] : [])])]);
      add("Contratos", [["Contrato", "Imóvel", "Inquilinos", "Início", "Termo", "Renovação", "Renda", "Estado", "Imposto do selo"], ...model.leases.map((item) => [item.portalContractNumber || item.id, reportPropertyName(item.propertyId, model), reportTenantNames(item, model), item.start, item.end, item.renewalDate, item.rent, item.status, item.stampDutyStatus])]);
      add("Rendas e recibos", [["Período", "Contrato", "Imóvel", "Vencimento", "Previsto", "Recebido", "Em falta", "Recibo"], ...model.ledger.map((item) => [item.period, item.lease.portalContractNumber || item.lease.id, reportPropertyName(item.lease.propertyId, model), item.dueDate, item.amount, item.paid, Math.max(0, item.amount - item.paid), item.receiptEmitted ? "Emitido" : item.paid > 0 ? "Por emitir" : "A aguardar"])]);
      add("Despesas", [["Categoria", "Descrição", "Imóvel", "Data", "Valor", "Estado"], ...model.expenses.map((row) => [row[0], row[1], reportPropertyName(String(row[2]), model), row[3], row[4], row[5]])]);
      add("Obrigações", [["Data", "Categoria", "Obrigação", "Imóvel", "Prioridade", "Origem"], ...model.alerts.map((item) => [item.date, item.category, item.title, reportPropertyName(item.propertyId, model), item.priority, item.source])]);
    }
    add("Insights", [["Insight"], ...(model.insights.length ? model.insights : ["Sem desvios prioritários detetados."]).map((item) => [item])]);
    add("Qualidade dos dados", [["Validação"], ...model.quality.map((item) => [item])]);
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    files.push(
      new File([bytes], `relatorio-patrimonial-${suffix}.xlsx`, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
  }
  return files;
}

function ReportDialog({ open, onOpenChange, state, propertyName, onArchive, onNotice }: { open: boolean; onOpenChange: (open: boolean) => void; state: AppState; propertyName: (id: string) => string; onArchive: (file?: File) => Promise<void>; onNotice: (message: string) => void }) {
  const current = new Date();
  const [config, setConfig] = useState<ReportConfig>(() => ({
    referenceDate: current.toISOString().slice(0, 10),
    from: `${current.getFullYear()}-01-01`,
    to: current.toISOString().slice(0, 10),
    propertyId: "",
    basis: "ambos",
    detail: "completo",
    pdf: true,
    excel: true,
    includePersonalData: false,
    archive: false,
    recentDays: 90,
    contractDays: 90,
  }));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => setConfig((currentConfig) => ({ ...currentConfig, [key]: value }));
  const generate = async () => {
    setError("");
    if (!config.pdf && !config.excel) {
      setError("Selecione pelo menos um formato.");
      return;
    }
    if (!config.from || !config.to || config.from > config.to) {
      setError("O período selecionado não é válido.");
      return;
    }
    setGenerating(true);
    try {
      const model = buildReportModel(state, config);
      const files = await reportFiles(model);
      files.forEach(downloadGeneratedFile);
      if (config.archive) for (const file of files) await onArchive(file);
      onNotice(`Relatório ${config.detail} gerado com sucesso${config.archive ? " e guardado em Documentos" : ""}.`);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o relatório.");
    } finally {
      setGenerating(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="report-dialog">
        <DialogHeader>
          <DialogTitle>Gerar relatório patrimonial</DialogTitle>
          <DialogDescription>Crie uma fotografia auditável do património com os dados existentes neste momento.</DialogDescription>
        </DialogHeader>
        <div className="report-form">
          <section>
            <h3>Período e âmbito</h3>
            <div className="report-fields">
              <Field label="Data de referência" type="date" value={config.referenceDate} onChange={(event) => set("referenceDate", event.target.value)} />
              <Field label="De" type="date" value={config.from} onChange={(event) => set("from", event.target.value)} />
              <Field label="Até" type="date" value={config.to} onChange={(event) => set("to", event.target.value)} />
              <SelectField
                label="Âmbito"
                value={config.propertyId}
                onChange={(event) => set("propertyId", event.target.value)}
                options={state.properties.map((property) => ({
                  value: property.id,
                  label: propertyName(property.id),
                }))}
              />
            </div>
          </section>
          <section>
            <h3>Conteúdo</h3>
            <div className="report-choice-grid">
              <ReportChoice selected={config.detail === "completo"} title="Relatório completo" text="Imóveis, inquilinos, contratos, rendas, despesas, obrigações, insights e qualidade dos dados." onClick={() => set("detail", "completo")} />
              <ReportChoice selected={config.detail === "executivo"} title="Relatório executivo" text="Indicadores, contratos a acompanhar, insights e principais lacunas." onClick={() => set("detail", "executivo")} />
            </div>
            <div className="report-fields compact">
              <SelectField
                label="Critério financeiro"
                value={config.basis}
                onChange={(event) => set("basis", event.target.value as ReportConfig["basis"])}
                options={[
                  { value: "ambos", label: "Caixa e competência" },
                  { value: "caixa", label: "Caixa" },
                  { value: "competencia", label: "Competência" },
                ]}
              />
              <Field label="Contrato recente (dias)" type="number" min="1" value={config.recentDays} onChange={(event) => set("recentDays", Number(event.target.value))} />
              <Field label="Termo / renovação (dias)" type="number" min="1" value={config.contractDays} onChange={(event) => set("contractDays", Number(event.target.value))} />
            </div>
          </section>
          <section>
            <h3>Formato e privacidade</h3>
            <div className="report-checks">
              <label>
                <input type="checkbox" checked={config.pdf} onChange={(event) => set("pdf", event.target.checked)} />
                <span>
                  <strong>PDF</strong>
                  <small>Documento pronto a consultar ou partilhar</small>
                </span>
              </label>
              <label>
                <input type="checkbox" checked={config.excel} onChange={(event) => set("excel", event.target.checked)} />
                <span>
                  <strong>Excel</strong>
                  <small>Folhas detalhadas para análise</small>
                </span>
              </label>
              <label>
                <input type="checkbox" checked={config.includePersonalData} onChange={(event) => set("includePersonalData", event.target.checked)} />
                <span>
                  <strong>Incluir dados pessoais</strong>
                  <small>NIF, identificação e contactos</small>
                </span>
              </label>
              <label>
                <input type="checkbox" checked={config.archive} onChange={(event) => set("archive", event.target.checked)} />
                <span>
                  <strong>Guardar em Documentos</strong>
                  <small>Arquiva uma fotografia histórica</small>
                </span>
              </label>
            </div>
          </section>
          {error && (
            <div className="report-error" role="alert">
              {error}
            </div>
          )}
          <div className="report-privacy">
            <ShieldCheck />
            <span>Os dados pessoais ficam excluídos por defeito. O relatório indica sempre o período, critérios e momento de geração.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={generate} disabled={generating}>
            <Download />
            {generating ? "A gerar…" : "Gerar agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportChoice({ selected, title, text, onClick }: { selected: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className={selected ? "report-choice selected" : "report-choice"} onClick={onClick}>
      <span>{selected ? "Selecionado" : "Selecionar"}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </button>
  );
}

type PerformanceRow = {
  propertyId: string;
  expected: number;
  received: number;
  expenses: number;
  financing: number;
  operating: number;
  net: number;
  collection: number;
};

function PerformanceView({ state, propertyName, openNew, openEdit }: { state: AppState; propertyName: (id: string) => string; openNew: (kind: DialogKind) => void; openEdit: (kind: DialogKind, id: string) => void }) {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const [basis, setBasis] = useState<"caixa" | "competencia">("caixa");
  const [perspective, setPerspective] = useState<"total" | "owned">("total");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedLease, setSelectedLease] = useState("");
  const [performanceTab, setPerformanceTab] = useState("carteira");
  const inPeriod = (date: string) => Boolean(date && date >= from && date <= to);
  const selectedLeaseRecord = state.leases.find((lease) => lease.id === selectedLease);
  const activePropertyIds = selectedLeaseRecord ? [selectedLeaseRecord.propertyId] : selectedProperty ? [selectedProperty] : state.properties.map((item) => item.id);
  const visibleLeases = state.leases.filter((lease) => activePropertyIds.includes(lease.propertyId) && (!selectedLease || lease.id === selectedLease));
  const visibleLeaseIds = new Set(visibleLeases.map((lease) => lease.id));
  const ledger = rentLedger(state).filter((row) => visibleLeaseIds.has(row.lease.id) && inPeriod(row.dueDate));
  const analysedValue = (propertyId: string, value: number, date: string) =>
    perspective === "owned"
      ? ownershipValue(
          state.properties.find((item) => item.id === propertyId),
          value,
          date,
        )
      : value;

  const propertyCosts = (propertyId: string) => {
    const movementCosts = state.movements.filter((item) => item.kind === "despesa" && item.propertyId === propertyId && inPeriod(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate)).reduce((sum, item) => sum + analysedValue(propertyId, basis === "caixa" ? (item.paidAmount ?? (item.paid ? item.amount : 0)) : item.amount, basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
    const taxes = state.taxes.filter((item) => item.propertyId === propertyId && inPeriod(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate) && (basis === "competencia" || item.paid)).reduce((sum, item) => sum + analysedValue(propertyId, item.amount, basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
    const insurance = state.insurances.filter((item) => item.propertyId === propertyId && inPeriod(basis === "caixa" ? item.paymentDate || item.renewalDate || item.startDate : item.renewalDate || item.startDate) && (basis === "competencia" || item.paid)).reduce((sum, item) => sum + analysedValue(propertyId, item.premium, basis === "caixa" ? item.paymentDate || item.renewalDate || item.startDate : item.renewalDate || item.startDate), 0);
    const maintenance = state.maintenance.filter((item) => item.propertyId === propertyId && item.actualCost > 0 && inPeriod(item.executedDate || item.expectedDate)).reduce((sum, item) => sum + analysedValue(propertyId, item.actualCost, item.executedDate || item.expectedDate), 0);
    const property = state.properties.find((item) => item.id === propertyId);
    const condo = state.condominiums
      .filter((item) => inPeriod(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate) && (basis === "competencia" || item.paid))
      .reduce((sum, item) => {
        const allocationDate = basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate;
        if ((item.allocationMode ?? "directa") === "directa") return sum + (item.propertyId === propertyId ? analysedValue(propertyId, item.amount, allocationDate) : 0);
        const group = item.buildingGroup || state.properties.find((candidate) => candidate.id === item.propertyId)?.buildingGroup || "";
        if (!group || property?.buildingGroup !== group) return sum;
        const groupProperties = state.properties.filter((candidate) => candidate.buildingGroup === group);
        const totalPermillage = groupProperties.reduce((total, candidate) => total + (candidate.permillage || 0), 0);
        return sum + analysedValue(propertyId, totalPermillage > 0 ? item.amount * ((property.permillage || 0) / totalPermillage) : 0, allocationDate);
      }, 0);
    return movementCosts + taxes + insurance + maintenance + condo;
  };
  const propertyFinancing = (propertyId: string) => state.financingPayments.filter((item) => item.propertyId === propertyId && inPeriod(item.paidDate)).reduce((sum, item) => sum + analysedValue(propertyId, item.amount, item.paidDate), 0);
  const propertyRows: PerformanceRow[] = activePropertyIds.map((propertyId) => {
    const leases = new Set(visibleLeases.filter((lease) => lease.propertyId === propertyId).map((lease) => lease.id));
    const propertyLedger = ledger.filter((row) => leases.has(row.lease.id));
    const expected = propertyLedger.reduce((sum, row) => sum + analysedValue(propertyId, row.amount, row.dueDate), 0);
    const received = state.movements.filter((item) => item.kind === "receita" && leases.has(item.leaseId ?? "") && inPeriod(basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate)).reduce((sum, item) => sum + analysedValue(propertyId, item.paidAmount ?? (item.paid ? item.amount : 0), basis === "caixa" ? item.paymentDate || item.dueDate : item.dueDate), 0);
    const expenses = propertyCosts(propertyId);
    const financing = propertyFinancing(propertyId);
    return {
      propertyId,
      expected,
      received,
      expenses,
      financing,
      operating: received - expenses,
      net: received - expenses - financing,
      collection: expected ? (received / expected) * 100 : 0,
    };
  });
  const totals = propertyRows.reduce(
    (sum, row) => ({
      expected: sum.expected + row.expected,
      received: sum.received + row.received,
      expenses: sum.expenses + row.expenses,
      financing: sum.financing + row.financing,
      operating: sum.operating + row.operating,
      net: sum.net + row.net,
    }),
    {
      expected: 0,
      received: 0,
      expenses: 0,
      financing: 0,
      operating: 0,
      net: 0,
    },
  );
  const collectionRate = totals.expected ? (totals.received / totals.expected) * 100 : 0;
  const occupancyRate = activePropertyIds.length ? Math.min(100, (new Set(state.leases.filter((lease) => lease.status === "ativo" && activePropertyIds.includes(lease.propertyId)).map((lease) => lease.propertyId)).size / activePropertyIds.length) * 100) : 0;
  const operatingMargin = totals.received ? (totals.operating / totals.received) * 100 : 0;
  const dueToday = new Date().toISOString().slice(0, 10);
  const overdueRows = ledger.filter((row) => row.dueDate < dueToday && row.paid < row.amount);
  const missingReceipts = ledger.filter((row) => row.paid > 0 && !row.receiptEmitted);
  const goals = state.performanceGoals.filter((goal) => (!goal.startDate || goal.startDate <= to) && (!goal.endDate || goal.endDate >= from) && (!goal.propertyId || activePropertyIds.includes(goal.propertyId)));
  const metricValue = (goal: PerformanceGoal) => {
    const rows = goal.propertyId ? propertyRows.filter((row) => row.propertyId === goal.propertyId) : propertyRows;
    const aggregate = rows.reduce(
      (sum, row) => ({
        expected: sum.expected + row.expected,
        received: sum.received + row.received,
        expenses: sum.expenses + row.expenses,
        financing: sum.financing + row.financing,
      }),
      { expected: 0, received: 0, expenses: 0, financing: 0 },
    );
    if (goal.metric === "netCashFlow") return aggregate.received - aggregate.expenses - aggregate.financing;
    if (goal.metric === "collectionRate") return aggregate.expected ? (aggregate.received / aggregate.expected) * 100 : 0;
    if (goal.metric === "operatingMargin") return aggregate.received ? ((aggregate.received - aggregate.expenses) / aggregate.received) * 100 : 0;
    if (goal.propertyId) return state.leases.some((lease) => lease.propertyId === goal.propertyId && lease.status === "ativo") ? 100 : 0;
    return occupancyRate;
  };
  const missedGoals = goals.filter((goal) => metricValue(goal) < goal.target);
  const insightCount = propertyRows.filter((row) => row.net < 0).length + (overdueRows.length ? 1 : 0) + (missingReceipts.length ? 1 : 0) + missedGoals.length;
  const metricLabels: Record<PerformanceGoal["metric"], string> = {
    netCashFlow: "Cash flow líquido",
    collectionRate: "Taxa de cobrança",
    occupancy: "Taxa de ocupação",
    operatingMargin: "Margem operacional",
  };

  return (
    <>
      <div className="page-heading performance-heading">
        <div>
          <span className="eyebrow">Análise financeira</span>
          <h2>Desempenho</h2>
          <p>Resultados por carteira, imóvel e contrato, calculados a partir dos registos reais.</p>
        </div>
        <div className="ownership-switch" aria-label="Perspetiva dos valores">
          <button className={perspective === "total" ? "active" : ""} onClick={() => setPerspective("total")}>
            Total do imóvel
          </button>
          <button className={perspective === "owned" ? "active" : ""} onClick={() => setPerspective("owned")}>
            Minha participação
          </button>
        </div>
      </div>
      <div className="performance-filters">
        <label>
          De
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          Imóvel
          <select
            value={selectedProperty}
            onChange={(event) => {
              setSelectedProperty(event.target.value);
              setSelectedLease("");
            }}
          >
            <option value="">Todos os imóveis</option>
            {state.properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contrato
          <select value={selectedLease} onChange={(event) => setSelectedLease(event.target.value)}>
            <option value="">Todos os contratos</option>
            {state.leases
              .filter((lease) => !selectedProperty || lease.propertyId === selectedProperty)
              .map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.portalContractNumber || lease.id} · {propertyName(lease.propertyId)}
                </option>
              ))}
          </select>
        </label>
        <div className="basis-switch" aria-label="Critério de análise">
          <button className={basis === "caixa" ? "active" : ""} onClick={() => setBasis("caixa")}>
            Caixa
          </button>
          <button className={basis === "competencia" ? "active" : ""} onClick={() => setBasis("competencia")}>
            Competência
          </button>
        </div>
      </div>
      <div className="metrics performance-metrics">
        <Metric label="Rendas recebidas" value={money(totals.received)} detail={`${collectionRate.toFixed(1).replace(".", ",")}% do previsto`} />
        <Metric label="Despesas operacionais" value={money(totals.expenses)} detail="Inclui obras no período" />
        <Metric label="Resultado operacional" value={money(totals.operating)} detail="Antes de financiamento" />
        <Metric label="Cash flow líquido" value={money(totals.net)} detail={`${money(totals.financing)} de financiamento`} />
      </div>
      <Tabs value={performanceTab} onValueChange={setPerformanceTab} className="performance-tabs">
        <TabsList>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="insights">Insights {insightCount > 0 && <span className="tab-count">{insightCount}</span>}</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
        </TabsList>
        <TabsContent value="carteira">
          <div className="performance-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Resultado</span>
                  <h3>Formação do cash flow</h3>
                </div>
                <span className="period">{basis === "caixa" ? "Movimentos pagos" : "Período económico"}</span>
              </div>
              <div className="waterfall">
                <div>
                  <span>Rendas</span>
                  <strong className="positive">+{money(totals.received)}</strong>
                </div>
                <div>
                  <span>Despesas</span>
                  <strong className="negative">−{money(totals.expenses)}</strong>
                </div>
                <div>
                  <span>Financiamento</span>
                  <strong className="negative">−{money(totals.financing)}</strong>
                </div>
                <div className="waterfall-total">
                  <span>Cash flow líquido</span>
                  <strong className={totals.net < 0 ? "negative" : "positive"}>{money(totals.net)}</strong>
                </div>
              </div>
            </article>
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Objetivos</span>
                  <h3>Indicadores do período</h3>
                </div>
              </div>
              <div className="performance-ratios">
                <Ratio label="Taxa de cobrança" value={collectionRate} suffix="%" />
                <Ratio label="Taxa de ocupação" value={occupancyRate} suffix="%" />
                <Ratio label="Margem operacional" value={operatingMargin} suffix="%" />
              </div>
            </article>
          </div>
        </TabsContent>
        <TabsContent value="imoveis">
          <div className="list-content">
            <DataTable
              headers={["Imóvel", "Previsto", "Recebido", "Despesas", "Financiamento", "Resultado operacional", "Cash flow", "Cobrança"]}
              rows={propertyRows.map((row) => [
                propertyName(row.propertyId),
                money(row.expected),
                money(row.received),
                money(row.expenses),
                money(row.financing),
                <span key={`${row.propertyId}-op`} className={row.operating < 0 ? "negative" : "positive"}>
                  {money(row.operating)}
                </span>,
                <span key={`${row.propertyId}-net`} className={row.net < 0 ? "negative" : "positive"}>
                  {money(row.net)}
                </span>,
                `${row.collection.toFixed(1).replace(".", ",")}%`,
              ])}
              empty="Ainda não existem imóveis com dados financeiros neste período."
            />
          </div>
        </TabsContent>
        <TabsContent value="contratos">
          <div className="list-content">
            <DataTable
              headers={["Contrato", "Imóvel", "Período", "Previsto", "Recebido", "Em falta", "Recibo"]}
              rows={ledger.map((row) => [
                row.lease.portalContractNumber || row.lease.id,
                propertyName(row.lease.propertyId),
                row.period,
                money(row.amount),
                money(row.paid),
                <span key={`${row.key}-missing`} className={row.paid < row.amount ? "negative" : "positive"}>
                  {money(Math.max(0, row.amount - row.paid))}
                </span>,
                row.paid > 0 ? (
                  row.receiptEmitted ? (
                    "Emitido"
                  ) : (
                    <span key={`${row.key}-receipt`} className="negative">
                      Por emitir
                    </span>
                  )
                ) : (
                  "—"
                ),
              ])}
              empty="Não existem rendas previstas para os filtros selecionados."
            />
          </div>
        </TabsContent>
        <TabsContent value="insights">
          <div className="insights-header">
            <div>
              <span className="eyebrow">Leitura assistida</span>
              <h3>Insights explicados</h3>
              <p>Os alertas mostram sempre dados, cálculo, impacto e ação recomendada.</p>
            </div>
          </div>
          <div className="insight-list">
            {propertyRows
              .filter((row) => row.net < 0)
              .map((row) => (
                <InsightCard key={`negative-${row.propertyId}`} icon={ArrowDownRight} tone="critical" title={`Cash flow negativo — ${propertyName(row.propertyId)}`} data={`${money(row.received)} recebidos; ${money(row.expenses)} de despesas; ${money(row.financing)} de financiamento`} calculation={`${money(row.received)} − ${money(row.expenses)} − ${money(row.financing)}`} impact={money(row.net)} recommendation="Rever as rubricas de custo e separar despesas extraordinárias das recorrentes." action="Ver imóvel" onAction={() => setPerformanceTab("imoveis")} />
              ))}
            {overdueRows.length > 0 && <InsightCard icon={CircleAlert} tone="critical" title={`${overdueRows.length} renda${overdueRows.length > 1 ? "s" : ""} em atraso`} data={`${money(overdueRows.reduce((sum, row) => sum + Math.max(0, row.amount - row.paid), 0))} por receber`} calculation="Valor previsto menos pagamentos associados" impact="Redução da taxa de cobrança" recommendation="Confirmar os movimentos e contactar o inquilino apenas após validação." action="Ver contratos" onAction={() => setPerformanceTab("contratos")} />}
            {missingReceipts.length > 0 && <InsightCard icon={ReceiptText} tone="warning" title={`${missingReceipts.length} recibo${missingReceipts.length > 1 ? "s" : ""} por emitir`} data="Rendas com pagamento registado e sem recibo emitido" calculation="Pagamentos recebidos sem recibo associado" impact="Arquivo documental incompleto" recommendation="Validar os recibos no Portal das Finanças e importar ou registar a emissão." action="Ver recibos" onAction={() => setPerformanceTab("contratos")} />}
            {missedGoals.map((goal) => (
              <InsightCard key={`goal-${goal.id}`} icon={Target} tone="warning" title={`Objetivo não atingido — ${metricLabels[goal.metric]}`} data={`Resultado: ${goal.metric === "netCashFlow" ? money(metricValue(goal)) : `${metricValue(goal).toFixed(1).replace(".", ",")}%`}; objetivo: ${goal.metric === "netCashFlow" ? money(goal.target) : `${goal.target}%`}`} calculation="Resultado do período comparado com o objetivo vigente" impact={goal.propertyId ? propertyName(goal.propertyId) : "Carteira global"} recommendation="Analisar a causa antes de alterar o objetivo parametrizado." action="Ver objetivo" onAction={() => setPerformanceTab("configuracao")} />
            ))}
            {insightCount === 0 && (
              <div className="insight-empty">
                <Sparkles />
                <h3>Sem desvios prioritários</h3>
                <p>Não foram detetados resultados negativos, rendas em atraso, recibos por emitir ou objetivos falhados para o período.</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="configuracao">
          <div className="performance-config">
            <ModuleBlock action="Novo financiamento" onAction={() => openNew("financing")}>
              <DataTable headers={["Imóvel", "Instituição", "Contrato", "Capital em dívida", "Prestação", "Taxa", "Estado", "Ações"]} rows={state.financings.map((item) => [propertyName(item.propertyId), item.institution, item.contractNumber || "—", money(item.outstandingCapital), money(item.monthlyPayment), `${item.interestRate.toFixed(2).replace(".", ",")}%`, item.active ? "Ativo" : "Terminado", <EditButton key={item.id} onClick={() => openEdit("financing", item.id)} />])} empty="Ainda não existem financiamentos." />
            </ModuleBlock>
            <ModuleBlock action="Registar pagamento" onAction={() => openNew("financingPayment")}>
              <DataTable headers={["Data", "Imóvel", "Financiamento", "Total", "Capital", "Juros", "Comissões", "Ações"]} rows={state.financingPayments.map((item) => [shortDate(item.paidDate), propertyName(item.propertyId), state.financings.find((financing) => financing.id === item.financingId)?.institution ?? "—", money(item.amount), money(item.principal), money(item.interest), money(item.fees), <EditButton key={item.id} onClick={() => openEdit("financingPayment", item.id)} />])} empty="Ainda não existem pagamentos de financiamento." />
            </ModuleBlock>
            <ModuleBlock action="Novo objetivo" onAction={() => openNew("goal")}>
              <DataTable headers={["Âmbito", "Indicador", "Objetivo", "Início", "Fim", "Ações"]} rows={state.performanceGoals.map((goal) => [goal.scope === "global" ? "Carteira global" : propertyName(goal.propertyId), metricLabels[goal.metric], goal.metric === "netCashFlow" ? money(goal.target) : `${goal.target}%`, shortDate(goal.startDate), shortDate(goal.endDate), <EditButton key={goal.id} onClick={() => openEdit("goal", goal.id)} />])} empty="Ainda não existem objetivos parametrizados." />
            </ModuleBlock>
          </div>
        </TabsContent>
      </Tabs>
      <div className="calculation-note">
        <Lightbulb />
        <span>As despesas diretamente associadas são imputadas integralmente. As despesas comuns configuradas por permilagem são distribuídas pelas frações do mesmo prédio. Obras e outras despesas extraordinárias contam no período em que são registadas.</span>
      </div>
    </>
  );
}

function Ratio({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div>
        <span>{label}</span>
        <strong>
          {value.toFixed(1).replace(".", ",")}
          {suffix}
        </strong>
      </div>
      <div className="ratio-track">
        <i style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, tone, title, data, calculation, impact, recommendation, action, onAction }: { icon: typeof CircleAlert; tone: "critical" | "warning"; title: string; data: string; calculation: string; impact: string; recommendation: string; action: string; onAction: () => void }) {
  return (
    <article className={`insight-card ${tone}`}>
      <span className="insight-icon">
        <Icon />
      </span>
      <div>
        <h4>{title}</h4>
        <p>{recommendation}</p>
        <dl>
          <div>
            <dt>Dados</dt>
            <dd>{data}</dd>
          </div>
          <div>
            <dt>Cálculo</dt>
            <dd>{calculation}</dd>
          </div>
          <div>
            <dt>Impacto</dt>
            <dd>{impact}</dd>
          </div>
        </dl>
      </div>
      <Button variant="outline" size="sm" onClick={onAction}>
        {action}
      </Button>
    </article>
  );
}

function ReceiptsView({ state, sourceState, patch, propertyName, openNew, openEdit, setNotice, query, setQuery }: { state: AppState; sourceState: AppState; patch: (next: Partial<AppState>) => void; propertyName: (id: string) => string; openNew: (prefill?: Record<string, string>) => void; openEdit: (id: string) => void; setNotice: (value: string) => void; query: string; setQuery: (value: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = rentLedger(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState("");
  const [importRows, setImportRows] = useState<ReceiptImportRow[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const selectedPayment = state.movements.find((item) => item.id === deleteId);
  const received = rows.reduce((sum, item) => sum + item.paid, 0);
  const outstanding = rows.reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
  const overdue = rows.filter((item) => item.paid < item.amount && item.dueDate < today).length;
  const missingReceipts = rows.filter((item) => item.paid > 0 && !item.receiptEmitted).length;
  const paymentRecords = state.movements.filter((item) => item.kind === "receita").sort((a, b) => (b.paymentDate || b.dueDate).localeCompare(a.paymentDate || a.dueDate));
  const leaseLabel = (lease: Lease) => `${propertyName(lease.propertyId)} · ${state.tenants.find((item) => item.id === lease.tenantId)?.name ?? "Sem inquilino"}`;

  async function downloadReceiptTemplate() {
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const template = XLSX.utils.aoa_to_sheet([RECEIPT_IMPORT_TEMPLATE_HEADERS, Array(RECEIPT_IMPORT_TEMPLATE_HEADERS.length).fill("")]);
      template["!cols"] = RECEIPT_IMPORT_TEMPLATE_HEADERS.map((header) => ({ wch: header.includes("Observações") ? 42 : header.includes("Locatário") || header.includes("Referência") ? 32 : header.includes("Descrição") ? 24 : 18 }));
      XLSX.utils.book_append_sheet(workbook, template, "ListaRecibos");
      const contracts = XLSX.utils.aoa_to_sheet([
        ["Nº de Contrato", "Imóvel", "Locatário", "Renda (€)", "Início", "Termo"],
        ...state.leases.map((lease) => [
          lease.portalContractNumber || "",
          propertyName(lease.propertyId),
          (lease.tenantIds ?? [lease.tenantId])
            .map((tenantId) => state.tenants.find((tenant) => tenant.id === tenantId)?.name)
            .filter(Boolean)
            .join(", "),
          lease.rent || "",
          lease.start || "",
          lease.end || "",
        ]),
      ]);
      contracts["!cols"] = [{ wch: 16 }, { wch: 42 }, { wch: 38 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, contracts, "Contratos");
      const notes = XLSX.utils.aoa_to_sheet([
        ["Campo", "Formato e regra"],
        ["Datas", "DD/MM/AAAA"],
        ["Período da renda", "MM/AAAA"],
        ["Tipo de pagamento", PAYMENT_METHODS.join(", ")],
        ["Estado do recibo", "Emitido, Anulado ou Por emitir"],
        ["Nº de recibo", "Obrigatório apenas quando o estado do recibo é Emitido"],
        ["Valor pago (€)", "Preencher com 0,00 quando ainda não existe pagamento"],
        ["Obrigatórios", RECEIPT_IMPORT_REQUIRED_HEADERS.join(", ") + " e uma data/período que identifique a renda"],
        ["Compatibilidade", "O importador continua a aceitar os cabeçalhos do ficheiro ListaRecibos do Portal das Finanças"],
      ]);
      notes["!cols"] = [{ wch: 24 }, { wch: 110 }];
      XLSX.utils.book_append_sheet(workbook, notes, "Notas");
      XLSX.writeFile(workbook, "template-rendas-recibos.xlsx");
      setNotice("Modelo Excel descarregado.");
    } catch {
      setNotice("Não foi possível gerar o modelo Excel.");
    }
  }

  async function readReceiptFile(file?: File) {
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: true,
      });
      const headers = data.length ? Object.keys(data[0]) : [];
      const hasHeader = (...aliases: string[]) => aliases.some((alias) => headers.includes(alias));
      const missing = [
        !hasHeader("Nº de Contrato") ? "Nº de Contrato" : "",
        !hasHeader("Valor devido (€)", "Valor (€)") ? "Valor devido (€) ou Valor (€)" : "",
        !hasHeader("Período da renda", "Data de início", "Data de Início", "Data de vencimento") ? "Período da renda ou data da renda" : "",
      ].filter(Boolean);
      if (missing.length) throw new Error(`Faltam colunas obrigatórias: ${missing.join(", ")}.`);
      const parsed = data.map((source, index) => {
        const value = (...aliases: string[]) => aliases.map((alias) => source[alias]).find((item) => clean(item) !== "") ?? "";
        const contractNumber = clean(value("Nº de Contrato"));
        const receiptNumber = clean(value("Nº de recibo", "Nº de Recibo"));
        const tenantName = normalText(value("Locatário"));
        const propertyRef = normalText(value("Imóvel"));
        const reference = normalText(value("Referência"));
        let candidates = state.leases.filter((lease) => clean(lease.portalContractNumber) === contractNumber && contractNumber);
        if (!candidates.length)
          candidates = state.leases.filter((lease) => {
            const tenant = state.tenants.find((item) => item.id === lease.tenantId);
            const property = state.properties.find((item) => item.id === lease.propertyId);
            const tenantMatches = tenantName && (normalText(tenant?.name) === tenantName || normalText(tenant?.name).includes(tenantName) || tenantName.includes(normalText(tenant?.name)));
            const propertyMatches = (propertyRef && normalText(property?.fiscalReference) === propertyRef) || (reference && normalText(property?.name) === reference);
            return Boolean(tenantMatches && propertyMatches);
          });
        const leaseId = candidates.length === 1 ? candidates[0].id : "";
        const duplicate = sourceState.movements.some((item) => clean(item.receiptNumber) === receiptNumber && receiptNumber && (!leaseId || item.leaseId === leaseId));
        const periodText = clean(value("Período da renda"));
        const normalizedPeriod = periodKey(periodText);
        const periodStart = isoDate(value("Data de início", "Data de Início")) || (/^\d{4}-\d{2}$/.test(normalizedPeriod) ? `${normalizedPeriod}-01` : "") || isoDate(value("Data de vencimento"));
        const dueDate = isoDate(value("Data de vencimento")) || periodStart;
        const receiptDate = isoDate(value("Data de emissão", "Data de Rec."));
        const paymentDate = isoDate(value("Data do pagamento"));
        const amount = Number(value("Valor devido (€)", "Valor (€)") || 0);
        const receivedAmount = Number(value("Valor pago (€)", "Importância recebida (€)") || 0);
        const status = clean(value("Estado do recibo", "Estado"));
        const emitted = normalText(status) === "emitido";
        const error = !periodStart ? "Período inválido" : !amount ? "Valor inválido" : emitted && !receiptNumber ? "Recibo emitido sem número" : candidates.length > 1 ? "Vários contratos possíveis" : !leaseId ? "Contrato por associar" : "";
        return {
          row: index + 2,
          reference: clean(source["Referência"]),
          contractNumber,
          receiptNumber,
          tenant: clean(source["Locatário"]),
          periodStart,
          periodEnd: isoDate(value("Data de fim", "Data de Fim")),
          receivedAt: receiptDate,
          dueDate,
          receiptDate,
          paymentDate,
          paymentMethod: clean(value("Tipo de pagamento")),
          description: clean(value("Descrição")) || "Renda",
          notes: clean(value("Observações")),
          amount,
          withholding: Number(value("Retenção IRS (€)") || 0),
          received: receivedAmount,
          propertyReference: clean(source["Imóvel"]),
          status,
          leaseId,
          duplicate,
          error,
        };
      });
      setImportFile(file.name);
      setImportRows(parsed);
      setImportOpen(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível ler o ficheiro Excel.");
    }
  }

  function confirmImport() {
    const acceptedRows = importRows.filter((row) => row.leaseId && !row.duplicate && !row.error);
    const movements: Movement[] = acceptedRows.map((row) => {
      const lease = state.leases.find((item) => item.id === row.leaseId)!;
      const emitted = normalText(row.status) === "emitido";
      return {
        id: uid("recibo"),
        propertyId: lease.propertyId,
        leaseId: lease.id,
        dueDate: row.dueDate,
        description: row.description,
        period: row.periodStart.slice(0, 7),
        amount: row.amount,
        paidAmount: row.received,
        paymentDate: row.paymentDate,
        kind: "receita",
        receipt: emitted,
        paid: row.received >= row.amount,
        receiptStatus: emitted ? "emitido" : normalText(row.status) === "anulado" ? "anulado" : "nao_emitido",
        receiptNumber: row.receiptNumber,
        receiptDate: row.receiptDate,
        paymentMethod: row.paymentMethod,
        source: "import",
        notes: [row.notes, `Contrato ${row.contractNumber}; referência ${row.reference}; imóvel ${row.propertyReference}; retenção IRS ${row.withholding.toFixed(2)} €; período até ${row.periodEnd || "não indicado"}.`].filter(Boolean).join(" "),
      };
    });
    const duplicates = importRows.filter((row) => row.duplicate).length;
    const rejected = importRows.length - acceptedRows.length - duplicates;
    patch({
      movements: [...sourceState.movements, ...movements],
      imports: [
        ...state.imports,
        {
          id: uid("lote"),
          fileName: importFile,
          importedAt: new Date().toISOString(),
          accepted: acceptedRows.length,
          rejected,
          duplicates,
        },
      ],
    });
    setImportOpen(false);
    setNotice(`Importação concluída: ${acceptedRows.length} recibos aceites, ${duplicates} duplicados e ${rejected} linhas por corrigir.`);
  }

  const paymentStatus = (item: LedgerRow) => (item.paid >= item.amount ? <span className="status paid">Pago</span> : item.paid > 0 ? <span className="status partial">Parcial</span> : item.dueDate < today ? <span className="status overdue">Em atraso</span> : <span className="status pending">Previsto</span>);
  const receiptStatus = (item: LedgerRow) => (item.receiptEmitted ? <span className="status paid">Emitido</span> : item.paid > 0 ? <span className="status overdue">Por emitir</span> : <span className="status pending">Aguardar pagamento</span>);
  const ledgerMovementIds = new Set(rows.flatMap((row) => row.movements.map((movement) => movement.id)));
  const unifiedRows: React.ReactNode[][] = rows.map((item) => {
    const movement = item.movements[0];
    const action = movement ? (
      <div key={item.key} className="record-action">
        <div className="row-actions">
          <EditButton onClick={() => openEdit(movement.id)} />
          <Button type="button" variant="outline" size="sm" className="delete-button" onClick={() => setDeleteId(movement.id)}>
            <Trash2 />
            Eliminar
          </Button>
        </div>
        <small>{movement.source === "import" ? "Importado do ficheiro de recibos" : movement.source === "contract" ? "Gerado pelo contrato e atualizado" : "Registo manual"}</small>
      </div>
    ) : (
      <div key={item.key} className="record-action">
        <EditButton
          onClick={() =>
            openNew({
              leaseId: item.lease.id,
              propertyId: item.lease.propertyId,
              dueDate: item.dueDate,
              period: item.period,
              description: "Renda",
              amount: String(item.amount),
              paidAmount: "0",
              receiptStatus: "nao_emitido",
              source: "contract",
            })
          }
        />
        <small>Gerado automaticamente pelo contrato</small>
      </div>
    );
    return [
      shortDate(item.dueDate),
      leaseLabel(item.lease),
      item.period,
      money(item.amount),
      money(item.paid),
      paymentStatus(item),
      receiptStatus(item),
      item.movements
        .map((entry) => entry.receiptNumber)
        .filter(Boolean)
        .join(", ") || "—",
      action,
    ];
  });
  paymentRecords
    .filter((movement) => !ledgerMovementIds.has(movement.id))
    .forEach((movement) => {
      const lease = state.leases.find((item) => item.id === movement.leaseId);
      const paidAmount = movement.paidAmount ?? (movement.paid ? movement.amount : 0);
      const receiptState = movement.receiptStatus ?? (movement.receipt ? "emitido" : "nao_emitido");
      unifiedRows.push([
        shortDate(movement.paymentDate || movement.dueDate),
        lease ? leaseLabel(lease) : propertyName(movement.propertyId),
        movement.period || "—",
        money(movement.amount),
        money(paidAmount),
        <Status key={`${movement.id}-paid`} active={paidAmount >= movement.amount} yes="Pago" no={paidAmount > 0 ? "Parcial" : "Não pago"} />,
        <Status key={`${movement.id}-receipt`} active={receiptState === "emitido"} yes="Emitido" no={receiptState === "anulado" ? "Anulado" : "Por emitir"} />,
        movement.receiptNumber || "—",
        <div key={`${movement.id}-action`} className="record-action">
          <div className="row-actions">
            <EditButton onClick={() => openEdit(movement.id)} />
            <Button type="button" variant="outline" size="sm" className="delete-button" onClick={() => setDeleteId(movement.id)}>
              <Trash2 />
              Eliminar
            </Button>
          </div>
          <small>{movement.source === "import" ? "Importado do ficheiro de recibos" : "Registo manual sem linha contratual correspondente"}</small>
        </div>,
      ]);
    });
  return (
    <>
      <ListPage title="Rendas e recibos" subtitle="Calendário automático por contrato, pagamentos e recibos" query={query} setQuery={setQuery}>
        <div className="receipt-actions">
          <Button onClick={() => openNew()}>
            <Plus />
            Registar pagamento
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload />
            Importar ListaRecibos.xlsx
          </Button>
          <Button variant="outline" onClick={downloadReceiptTemplate}>
            <Download />
            Modelo Excel
          </Button>
        </div>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => {
            readReceiptFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <SummaryStrip
          items={[
            { label: "Recebido", value: money(received) },
            {
              label: "Por receber",
              value: money(outstanding),
              negative: outstanding > 0,
            },
            {
              label: "Rendas em atraso",
              value: String(overdue),
              negative: overdue > 0,
            },
            {
              label: "Recibos por emitir",
              value: String(missingReceipts),
              negative: missingReceipts > 0,
            },
          ]}
        />
        <section className="unified-register">
          <div className="ledger-heading">
            <span className="eyebrow">Conta-corrente</span>
            <h3>Pagamentos e recibos</h3>
            <p>“Pago” confirma o recebimento; “Emitido” confirma a emissão do recibo. Todos os registos, incluindo os gerados pelo contrato, podem ser editados.</p>
          </div>
          <DataTable headers={["Vencimento / pagamento", "Contrato / inquilino", "Período", "Devido", "Pago", "Pagamento", "Recibo", "N.º recibo", "Ações"]} rows={unifiedRows} empty="Crie um contrato ativo ou registe um pagamento para iniciar a conta-corrente." />
        </section>
        <section className="payment-register">
          <div>
            <span className="eyebrow">Registos introduzidos</span>
            <h3>Pagamentos e recibos</h3>
            <p>Cada linha corresponde a um registo gravado. “Pago” confirma o recebimento; “Emitido” confirma que o recibo foi emitido.</p>
          </div>
          <DataTable
            headers={["Pagamento", "Contrato / imóvel", "Período", "Valor devido", "Valor pago", "Recebimento", "Recibo", "N.º recibo", "Ações"]}
            rows={paymentRecords.map((movement) => {
              const lease = state.leases.find((item) => item.id === movement.leaseId);
              const paidAmount = movement.paidAmount ?? (movement.paid ? movement.amount : 0);
              const receiptState = movement.receiptStatus ?? (movement.receipt ? "emitido" : "nao_emitido");
              return [
                shortDate(movement.paymentDate || movement.dueDate),
                lease ? leaseLabel(lease) : propertyName(movement.propertyId),
                movement.period || "—",
                money(movement.amount),
                money(paidAmount),
                <Status key={`${movement.id}-paid`} active={paidAmount >= movement.amount} yes="Pago" no={paidAmount > 0 ? "Parcial" : "Não pago"} />,
                <Status key={`${movement.id}-receipt`} active={receiptState === "emitido"} yes="Emitido" no={receiptState === "anulado" ? "Anulado" : "Por emitir"} />,
                movement.receiptNumber || "—",
                <div key={`${movement.id}-actions`} className="row-actions">
                  <EditButton onClick={() => openEdit(movement.id)} />
                  <Button type="button" variant="outline" size="sm" className="delete-button" onClick={() => setDeleteId(movement.id)}>
                    <Trash2 />
                    Eliminar
                  </Button>
                </div>,
              ];
            })}
            empty="Ainda não existem pagamentos ou recibos registados."
          />
        </section>
        <div className="ledger-heading">
          <span className="eyebrow">Calendário contratual</span>
          <h3>Rendas previstas</h3>
          <p>Estas linhas são geradas automaticamente pelos contratos ativos.</p>
        </div>
        <DataTable
          headers={["Vencimento", "Contrato / inquilino", "Período", "Devido", "Pago", "Pagamento", "Recibo", "N.º recibo", "Ações"]}
          rows={rows.map((item) => [
            shortDate(item.dueDate),
            leaseLabel(item.lease),
            item.period,
            money(item.amount),
            money(item.paid),
            paymentStatus(item),
            receiptStatus(item),
            item.movements
              .map((movement) => movement.receiptNumber)
              .filter(Boolean)
              .join(", ") || "—",
            item.movements[0] ? (
              <div key={item.key} className="row-actions">
                <EditButton onClick={() => openEdit(item.movements[0].id)} />
                <Button type="button" variant="outline" size="sm" className="delete-button" onClick={() => setDeleteId(item.movements[0].id)}>
                  <Trash2 />
                  Eliminar
                </Button>
              </div>
            ) : (
              <span key={item.key} className="muted-cell">
                Gerado pelo contrato
              </span>
            ),
          ])}
          empty="Crie um contrato ativo para gerar automaticamente o calendário mensal de rendas."
        />
        {state.imports.length > 0 && (
          <div className="import-history">
            <FileSpreadsheet />
            <span>
              Última importação: <strong>{state.imports.at(-1)?.fileName}</strong>
            </span>
            <small>
              {state.imports.at(-1)?.accepted} aceites · {state.imports.at(-1)?.duplicates} duplicados · {state.imports.at(-1)?.rejected} por corrigir
            </small>
          </div>
        )}
      </ListPage>
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar este pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O pagamento
              {selectedPayment?.receiptNumber ? ` e o recibo ${selectedPayment.receiptNumber}` : ""} será removido de Rendas e Recibos. A renda prevista pelo contrato continuará visível e voltará a surgir como não paga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  patch({
                    movements: sourceState.movements.filter((item) => item.id !== deleteId),
                  });
                  setNotice("Registo de pagamento eliminado.");
                }
                setDeleteId(null);
              }}
            >
              Eliminar pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="import-dialog">
          <DialogHeader>
            <DialogTitle>Validar recibos antes de importar</DialogTitle>
            <DialogDescription>Formato reconhecido de {importFile}. Associe manualmente apenas as linhas cujo contrato não foi identificado.</DialogDescription>
          </DialogHeader>
          <div className="import-summary">
            <span>{importRows.length} linhas</span>
            <span className="ok">{importRows.filter((row) => row.leaseId && !row.error && !row.duplicate).length} prontas</span>
            <span>{importRows.filter((row) => row.duplicate).length} duplicadas</span>
            <span className="bad">{importRows.filter((row) => row.error).length} por validar</span>
          </div>
          <div className="table-wrap import-table">
            <table>
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Recibo</th>
                  <th>Período</th>
                  <th>Locatário</th>
                  <th>Valor recebido</th>
                  <th>Contrato</th>
                  <th>Validação</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row, index) => (
                  <tr key={`${row.row}-${row.receiptNumber}`}>
                    <td>{row.row}</td>
                    <td>{row.receiptNumber}</td>
                    <td>{row.periodStart ? row.periodStart.slice(0, 7) : "—"}</td>
                    <td>{row.tenant}</td>
                    <td>{money(row.received)}</td>
                    <td>
                      <select
                        value={row.leaseId}
                        onChange={(event) =>
                          setImportRows((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    leaseId: event.target.value,
                                    error: event.target.value ? "" : "Contrato por associar",
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="">Selecionar…</option>
                        {state.leases.map((lease) => (
                          <option key={lease.id} value={lease.id}>
                            {lease.portalContractNumber ? `${lease.portalContractNumber} · ` : ""}
                            {leaseLabel(lease)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{row.duplicate ? <span className="status cancelled">Duplicado</span> : row.error ? <span className="status overdue">{row.error}</span> : <span className="status paid">Aceite</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport} disabled={!importRows.some((row) => row.leaseId && !row.error && !row.duplicate)}>
              Importar linhas aceites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Charges({ state, propertyName, open, openEdit, toggle, query, setQuery }: { state: AppState; propertyName: (id: string) => string; open: (kind: DialogKind) => void; openEdit: (kind: DialogKind, id: string) => void; toggle: (collection: "movements" | "taxes" | "insurances" | "condominiums", id: string) => void; query: string; setQuery: (value: string) => void }) {
  const [propertyId, setPropertyId] = useState("all");
  const matches = (id: string) => propertyId === "all" || id === propertyId;
  const filter = <PropertyFilter properties={state.properties} value={propertyId} onChange={setPropertyId} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Obrigações</span>
          <h2>Impostos, seguros e condomínio</h2>
          <p>Encargos, apólices e datas relevantes por imóvel</p>
        </div>
      </div>
      <SearchField query={query} setQuery={setQuery} />
      <Tabs defaultValue="impostos">
        <TabsList>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
          <TabsTrigger value="seguros">Seguros</TabsTrigger>
          <TabsTrigger value="condominio">Condomínio</TabsTrigger>
        </TabsList>
        {filter}
        <TabsContent value="impostos">
          <ModuleBlock action="Novo imposto" onAction={() => open("tax")}>
            <DataTable
              headers={["Imóvel", "Emissor", "Imposto", "Período", "Vencimento", "Valor", "Pagamento", "Ações"]}
              rows={state.taxes
                .filter((item) => matches(item.propertyId))
                .map((item) => [
                  propertyName(item.propertyId),
                  item.issuer,
                  item.tax,
                  item.period,
                  shortDate(item.dueDate),
                  money(item.amount),
                  <button key={item.id} className="status-button" onClick={() => toggle("taxes", item.id)}>
                    <Status active={item.paid} yes="Pago" no="Pendente" />
                  </button>,
                  <EditButton key={`${item.id}-edit`} onClick={() => openEdit("tax", item.id)} />,
                ])}
              empty="Ainda não existem impostos para o imóvel selecionado."
            />
          </ModuleBlock>
        </TabsContent>
        <TabsContent value="seguros">
          <ModuleBlock action="Novo seguro" onAction={() => open("insurance")}>
            <DataTable
              headers={["Imóvel", "Seguradora", "Âmbito", "Apólice", "Renovação", "Prémio", "Pagamento", "Ações"]}
              rows={state.insurances
                .filter((item) => matches(item.propertyId))
                .map((item) => [
                  propertyName(item.propertyId),
                  item.insurer,
                  item.scope,
                  item.policy,
                  shortDate(item.renewalDate),
                  money(item.premium),
                  <button key={item.id} className="status-button" onClick={() => toggle("insurances", item.id)}>
                    <Status active={Boolean(item.paid)} yes="Pago" no="Pendente" />
                  </button>,
                  <EditButton key={`${item.id}-edit`} onClick={() => openEdit("insurance", item.id)} />,
                ])}
              empty="Ainda não existem seguros para o imóvel selecionado."
            />
          </ModuleBlock>
        </TabsContent>
        <TabsContent value="condominio">
          <ModuleBlock action="Nova despesa" onAction={() => open("condo")}>
            <DataTable
              headers={["Imóvel", "Tipo", "Âmbito", "Imputação", "Vencimento", "Valor", "Pagamento", "Ações"]}
              rows={state.condominiums
                .filter((item) => matches(item.propertyId))
                .map((item) => [
                  propertyName(item.propertyId),
                  item.expenseType,
                  item.scope,
                  item.allocationMode === "permilagem" ? `Permilagem · ${item.buildingGroup || "grupo por indicar"}` : "Direta",
                  shortDate(item.dueDate),
                  money(item.amount),
                  <button key={item.id} className="status-button" onClick={() => toggle("condominiums", item.id)}>
                    <Status active={item.paid} yes="Pago" no="Pendente" />
                  </button>,
                  <EditButton key={`${item.id}-edit`} onClick={() => openEdit("condo", item.id)} />,
                ])}
              empty="Ainda não existem despesas de condomínio para o imóvel selecionado."
            />
          </ModuleBlock>
        </TabsContent>
      </Tabs>
    </>
  );
}

function PropertyFilter({ properties, value, onChange, label = "Filtrar por imóvel" }: { properties: Property[]; value: string; onChange: (value: string) => void; label?: string }) {
  return (
    <label className="module-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">Todos os imóveis</option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function DocumentsView({ state, propertyName, inputRef, uploadDocument, query, setQuery }: { state: AppState; propertyName: (id: string) => string; inputRef: React.RefObject<HTMLInputElement | null>; uploadDocument: (file?: File, propertyId?: string) => Promise<void>; query: string; setQuery: (value: string) => void }) {
  const [propertyId, setPropertyId] = useState("all");
  const documents = state.documents.filter((item) => propertyId === "all" || item.propertyId === propertyId);
  return (
    <ListPage title="Documentos" subtitle="Arquivo independente e protegido" action="Carregar documento" onAction={() => inputRef.current?.click()} query={query} setQuery={setQuery}>
      <PropertyFilter properties={state.properties} value={propertyId} onChange={setPropertyId} />
      <p className="filter-help">Ao carregar um documento com um imóvel selecionado, o ficheiro fica automaticamente associado a esse imóvel.</p>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
        onChange={(event) => {
          uploadDocument(event.target.files?.[0], propertyId === "all" ? "" : propertyId);
          event.target.value = "";
        }}
      />
      <DataTable
        headers={["Documento", "Imóvel", "Formato", "Tamanho", "Carregado"]}
        rows={documents.map((doc) => [
          <a key={doc.id} href={fileUrl(doc.key)} className="document-link">
            <Download />
            {doc.name}
          </a>,
          doc.propertyId ? propertyName(doc.propertyId) : "Sem associação",
          doc.type || "—",
          `${Math.max(1, Math.round(doc.size / 1024))} KB`,
          new Date(doc.createdAt).toLocaleDateString("pt-PT"),
        ])}
        empty="Ainda não existem documentos para o imóvel selecionado."
      />
    </ListPage>
  );
}

function Priority({ value }: { value: string }) {
  const label: Record<string, string> = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };
  return <span className={`status priority-${value}`}>{label[value] ?? value}</span>;
}

function ObligationsView({ state, query, setQuery, propertyName, openNew, openEdit, onDelete }: { state: AppState; query: string; setQuery: (value: string) => void; propertyName: (id: string) => string; openNew: () => void; openEdit: (kind: DialogKind, id: string, prefill?: Record<string, string>) => void; onDelete: (item: AlertItem) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const alerts = alertFeed(state);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const selected = alerts.find((item) => item.id === deleteId);
  const [mode, setMode] = useState<"lista" | "mes" | "intervalo">("lista");
  const [month, setMonth] = useState(() => new Date());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filteredAlerts = alerts;
  const rangeAlerts = filteredAlerts.filter((item) => (!dateFrom || item.date >= dateFrom) && (!dateTo || item.date <= dateTo));
  const monthYear = month.getFullYear(),
    monthIndex = month.getMonth(),
    monthDays = new Date(monthYear, monthIndex + 1, 0).getDate(),
    monthBlanks = new Date(monthYear, monthIndex, 1).getDay();
  const monthCells = [...Array(monthBlanks).fill(null), ...Array.from({ length: monthDays }, (_, index) => index + 1)];
  const propertiesToPrint = state.properties.filter((property) => filteredAlerts.some((item) => item.propertyId === property.id));
  const priorityLabel: Record<string, string> = {
    baixa: "Baixa",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };
  const detail = (id: string) => state.obligations.find((item) => item.id === id);
  const alertValue = (item: AlertItem): number | null => {
    if (item.id.startsWith("tax-")) return state.taxes.find((record) => record.id === item.sourceId)?.amount ?? null;
    if (item.id.startsWith("insurance-")) return state.insurances.find((record) => record.id === item.sourceId)?.premium ?? null;
    if (item.id.startsWith("condo-")) return state.condominiums.find((record) => record.id === item.sourceId)?.amount ?? null;
    if (item.id.startsWith("maintenance-")) return state.maintenance.find((record) => record.id === item.sourceId)?.expectedCost ?? null;
    if (item.id.startsWith("warranty-")) return state.inventory.find((record) => record.id === item.sourceId)?.value ?? null;
    if (item.id.startsWith("stamp-")) return state.leases.find((record) => record.id === item.sourceId)?.stampDutyAmount ?? null;
    if (item.id.startsWith("lease-")) return state.leases.find((record) => record.id === item.sourceId)?.rent ?? null;
    return null;
  };
  const formattedAlertValue = (item: AlertItem) => {
    const value = alertValue(item);
    return value === null ? "—" : money(value);
  };
  const originLabel = (item: AlertItem) => (item.source === "manual" ? "Origem: obrigação criada manualmente." : `Origem: obrigação gerada automaticamente pelo módulo de ${item.category.toLocaleLowerCase("pt-PT")}, a partir do registo que está a editar.`);
  const editAlert = (item: AlertItem) =>
    openEdit(item.sourceKind, item.sourceId, {
      _originLabel: originLabel(item),
    });
  const tableRows = (items: typeof alerts) =>
    items.map((item) => [
      <span key={`${item.id}-date`} className={item.date < today ? "negative" : ""}>
        {shortDate(item.date)}
      </span>,
      item.category,
      item.title,
      propertyName(item.propertyId),
      <Priority key={`${item.id}-priority`} value={item.priority} />,
      formattedAlertValue(item),
      <div key={item.id} className="row-actions">
        <EditButton onClick={() => editAlert(item)} />
        <Button type="button" variant="outline" size="sm" className="delete-button" onClick={() => setDeleteId(item.id)}>
          <Trash2 />
          Eliminar
        </Button>
      </div>,
    ]);
  return (
    <div className="obligations-page">
      <div className="screen-only">
        <ListPage title="Obrigações" subtitle="Prazos manuais e alertas gerados pelos restantes módulos" query={query} setQuery={setQuery}>
          <div className="obligation-commandbar">
            <div className="obligation-action-row">
              <div className="obligation-view-switch">
                <Button type="button" variant={mode === "lista" ? "default" : "outline"} onClick={() => setMode("lista")}>Lista</Button>
                <Button type="button" variant={mode === "mes" ? "default" : "outline"} onClick={() => setMode("mes")}>Calendário mensal</Button>
                <Button type="button" variant={mode === "intervalo" ? "default" : "outline"} onClick={() => setMode("intervalo")}>Entre datas</Button>
              </div>
              <div className="obligation-primary-actions">
                <Button type="button" onClick={openNew}><Plus />Nova obrigação</Button>
                <Button type="button" variant="outline" onClick={() => window.print()} disabled={!filteredAlerts.length}><Printer />Imprimir lista detalhada</Button>
              </div>
            </div>
          </div>
          <SummaryStrip
            items={[
              { label: "Pendentes", value: String(filteredAlerts.length) },
              {
                label: "Em atraso",
                value: String(filteredAlerts.filter((item) => item.date < today).length),
                negative: filteredAlerts.some((item) => item.date < today),
              },
              {
                label: "Próximos 30 dias",
                value: String(
                  filteredAlerts.filter((item) => {
                    const days = (new Date(item.date).getTime() - new Date(today).getTime()) / 86400000;
                    return days >= 0 && days <= 30;
                  }).length,
                ),
              },
              {
                label: "Manuais",
                value: String(filteredAlerts.filter((item) => item.source === "manual").length),
              },
            ]}
          />
          {mode === "lista" && <DataTable headers={["Data-limite", "Categoria", "Obrigação", "Imóvel", "Prioridade", "Valor", "Ações"]} rows={tableRows(filteredAlerts)} empty="Sem obrigações pendentes para o imóvel selecionado." />}
          {mode === "mes" && (
            <>
              <div className="calendar-toolbar">
                <div>
                  <Button variant="outline" onClick={() => setMonth(new Date(monthYear, monthIndex - 1, 1))}>
                    ‹
                  </Button>
                  <strong>
                    {month.toLocaleDateString("pt-PT", {
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <Button variant="outline" onClick={() => setMonth(new Date(monthYear, monthIndex + 1, 1))}>
                    ›
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setMonth(new Date())}>
                  Hoje
                </Button>
              </div>
              <div className="calendar-grid obligation-calendar">
                <div className="calendar-weekdays">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <strong key={day}>{day}</strong>
                  ))}
                </div>
                <div className="calendar-days">
                  {monthCells.map((day, index) => {
                    const date = day ? `${monthYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
                    const dayAlerts = filteredAlerts.filter((item) => item.date === date);
                    return (
                      <div key={index} className={day ? "calendar-day" : "calendar-day empty-day"}>
                        {day && (
                          <>
                            <strong>{day}</strong>
                            {dayAlerts.map((item) => (
                              <button key={item.id} type="button" className={`calendar-event ${item.date < today ? "late" : ""}`} onClick={() => editAlert(item)}>
                                <strong>{item.title}</strong>
                                <small>{propertyName(item.propertyId)}</small>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {mode === "intervalo" && (
            <>
              <div className="obligation-range">
                <DateField label="Data inicial" value={dateFrom} onChange={setDateFrom} />
                <DateField label="Data final" value={dateTo} onChange={setDateTo} />
                <span>{rangeAlerts.length} obrigações no período</span>
              </div>
              <DataTable headers={["Data-limite", "Categoria", "Obrigação", "Imóvel", "Prioridade", "Valor", "Ações"]} rows={tableRows(rangeAlerts)} empty="Não existem obrigações no intervalo selecionado." />
            </>
          )}
        </ListPage>
      </div>
      <section className="obligations-print-root print-only">
        <header>
          <span>Controller Home · Gestão Patrimonial</span>
          <h1>Lista detalhada de obrigações</h1>
          <p>
            Resultados apresentados · Emitido em {new Date().toLocaleDateString("pt-PT")}
          </p>
        </header>
        <div className="print-summary">
          <strong>{filteredAlerts.length}</strong> obrigações · <strong>{filteredAlerts.filter((item) => item.date < today).length}</strong> em atraso
        </div>
        {propertiesToPrint.map((property) => (
          <section key={property.id} className="print-property">
            <h2>{property.name}</h2>
            <p>{[property.address, property.postalCode, property.locality, property.fiscalReference].filter(Boolean).join(" · ")}</p>
            <table>
              <thead>
                <tr>
                  <th>Prazo</th>
                  <th>Estado</th>
                  <th>Categoria</th>
                  <th>Obrigação</th>
                  <th>Prioridade</th>
                  <th>Valor</th>
                  <th>Responsável</th>
                  <th>Recorrência</th>
                  <th>Fundamento / evidência</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts
                  .filter((item) => item.propertyId === property.id)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((item) => {
                    const record = detail(item.id);
                    return (
                      <tr key={item.id}>
                        <td>{shortDate(item.date)}</td>
                        <td>{item.date < today ? "Em atraso" : "Pendente"}</td>
                        <td>{item.category}</td>
                        <td>{item.title}</td>
                        <td>{priorityLabel[item.priority] ?? item.priority}</td>
                        <td>{formattedAlertValue(item)}</td>
                        <td>{record?.responsible || "—"}</td>
                        <td>{record?.recurrence || "—"}</td>
                        <td>{[record?.basis, record?.evidence, record?.notes].filter(Boolean).join(" · ") || "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        ))}
      </section>
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar esta obrigação?</AlertDialogTitle>
            <AlertDialogDescription>{selected?.source === "automatico" ? `A obrigação automática «${selected.title}» deixará de aparecer. O registo de origem será mantido e poderá continuar a ser editado no respetivo módulo.` : `A obrigação «${selected?.title ?? "selecionada"}» será removida.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (selected) onDelete(selected);
                setDeleteId(null);
              }}
            >
              Eliminar obrigação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MaintenanceView({ state, propertyName, openNew, openEdit, query, setQuery }: { state: AppState; propertyName: (id: string) => string; openNew: () => void; openEdit: (id: string) => void; query: string; setQuery: (value: string) => void }) {
  const open = state.maintenance.filter((item) => !["concluido", "cancelado"].includes(item.status));
  const actual = state.maintenance.reduce((sum, item) => sum + item.actualCost, 0);
  const statusLabel: Record<string, string> = {
    identificado: "Identificado",
    analise: "Em análise",
    orcamento: "A aguardar orçamento",
    aprovado: "Aprovado",
    agendado: "Agendado",
    execucao: "Em execução",
    concluido: "Concluído",
    garantia: "Em garantia",
    cancelado: "Cancelado",
  };
  const responsibilityLabel = {
    inquilino: "Inquilino",
    senhorio: "Senhorio",
    condominio: "Condomínio",
    outro: "Outro",
  };
  return (
    <ListPage title="Manutenção" subtitle="Pedidos, avarias, obras, custos e garantias" action="Nova intervenção" onAction={openNew} query={query} setQuery={setQuery}>
      <SummaryStrip
        items={[
          { label: "Intervenções abertas", value: String(open.length) },
          {
            label: "Urgentes",
            value: String(open.filter((item) => item.priority === "urgente").length),
            negative: open.some((item) => item.priority === "urgente"),
          },
          {
            label: "Custo previsto",
            value: money(open.reduce((sum, item) => sum + item.expectedCost, 0)),
          },
          { label: "Custo realizado", value: money(actual) },
        ]}
      />
      <DataTable headers={["Imóvel", "Tipo", "Intervenção", "Responsabilidade", "Prioridade", "Estado", "Data prevista", "Fornecedor", "Previsto", "Real", "Pagamento", "Ações"]} rows={state.maintenance.map((item) => [propertyName(item.propertyId), item.type, item.title, responsibilityLabel[item.responsibility ?? "senhorio"], <Priority key={`${item.id}-priority`} value={item.priority} />, statusLabel[item.status], shortDate(item.expectedDate), item.supplier || "—", money(item.expectedCost), money(item.actualCost), item.paymentType || "—", <EditButton key={item.id} onClick={() => openEdit(item.id)} />])} empty="Ainda não existem pedidos de manutenção, avarias ou obras registados." />
    </ListPage>
  );
}

function CalendarView({ state, propertyName, query, setQuery }: { state: AppState; propertyName: (id: string) => string; query: string; setQuery: (value: string) => void }) {
  const [mode, setMode] = useState<"mes" | "lista">("mes");
  const [month, setMonth] = useState(() => new Date());
  const events = alertFeed(state).map((item) => ({
    date: item.date,
    type: item.category,
    title: item.title,
    property: propertyName(item.propertyId),
  }));
  const year = month.getFullYear(),
    monthIndex = month.getMonth(),
    days = new Date(year, monthIndex + 1, 0).getDate(),
    blanks = new Date(year, monthIndex, 1).getDay();
  const cells = [...Array(blanks).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  return (
    <ListPage title="Calendário" subtitle="Vista mensal e lista de todos os prazos patrimoniais" query={query} setQuery={setQuery}>
      <div className="calendar-toolbar">
        <div>
          <Button variant="outline" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>
            ‹
          </Button>
          <strong>
            {month.toLocaleDateString("pt-PT", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <Button variant="outline" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>
            ›
          </Button>
        </div>
        <div>
          <Button variant={mode === "mes" ? "default" : "outline"} onClick={() => setMode("mes")}>
            Mês
          </Button>
          <Button variant={mode === "lista" ? "default" : "outline"} onClick={() => setMode("lista")}>
            Lista
          </Button>
        </div>
      </div>
      {mode === "mes" ? (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <strong key={day}>{day}</strong>
            ))}
          </div>
          <div className="calendar-days">
            {cells.map((day, index) => (
              <div key={index} className={!day ? "calendar-day empty-day" : "calendar-day"}>
                {day && (
                  <>
                    <span>{day}</span>
                    {events
                      .filter((event) => event.date === `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
                      .map((event) => (
                        <div className="calendar-event" key={`${event.date}-${event.title}`} title={`${event.title} · ${event.property}`}>
                          <strong>{event.title}</strong>
                          <small>
                            {event.type} · {event.property}
                          </small>
                        </div>
                      ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DataTable headers={["Data", "Categoria", "Evento", "Imóvel"]} rows={events.map((event) => [shortDate(event.date), event.type, event.title, event.property])} empty="Sem obrigações próximas. As datas dos restantes módulos surgirão aqui." />
      )}
    </ListPage>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function Status({ active, yes, no }: { active: boolean; yes: string; no: string }) {
  return <span className={`status ${active ? "paid" : "pending"}`}>{active ? yes : no}</span>;
}
function SummaryStrip({ items }: { items: { label: string; value: string; negative?: boolean }[] }) {
  return (
    <div className="summary-strip">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong className={item.negative ? "negative" : ""}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
function ModuleBlock({ action, onAction, children }: { action: string; onAction: () => void; children: React.ReactNode }) {
  return (
    <div className="module-block">
      <div className="module-actions">
        <Button size="sm" onClick={onAction}>
          <Plus />
          {action}
        </Button>
      </div>
      {children}
    </div>
  );
}
function ListPage({ title, subtitle, action, onAction, query, setQuery, children }: { title: string; subtitle: string; action?: string; onAction?: () => void; query?: string; setQuery?: (value: string) => void; children: React.ReactNode }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Gestão patrimonial</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action && (
          <Button onClick={onAction}>
            <Plus />
            {action}
          </Button>
        )}
      </div>
      {setQuery && <SearchField query={query ?? ""} setQuery={setQuery} />}
      <div className="list-content">{children}</div>
    </>
  );
}
function SearchField({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <label className="search">
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar nos registos apresentados" />
    </label>
  );
}
function DataTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <div className="table-empty">{empty}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: typeof Building2; title: string; text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="empty">
      <span>
        <Icon />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <Button variant="outline" onClick={onAction}>
          <Plus />
          {action}
        </Button>
      )}
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="edit-button" onClick={onClick}>
      <Pencil />
      Ver e editar
    </Button>
  );
}

function initialFields(kind: DialogKind | null, editId: string | null, state: AppState): Record<string, string> {
  if (!kind || !editId) return {};
  if (kind === "property") {
    const item = state.properties.find((x) => x.id === editId);
    return item
      ? {
          name: item.name,
          description: item.description,
          address: item.address,
          postalCode: item.postalCode,
          locality: item.locality,
          parish: item.parish,
          type: item.type,
          fraction: item.fraction,
          fiscalReference: item.fiscalReference ?? "",
          buildingGroup: item.buildingGroup ?? "",
          permillage: String(item.permillage ?? ""),
          ownershipPeriods: JSON.stringify(item.ownershipPeriods?.length ? item.ownershipPeriods : defaultOwnership()),
          yearBuilt: item.yearBuilt,
          energyRating: item.energyRating,
          housingLicense: item.housingLicense ?? "",
          mainPhotoKey: item.mainPhotoKey ?? "",
          gallery: JSON.stringify(item.gallery ?? []),
          area: String(item.area ?? ""),
          bedrooms: String(item.bedrooms ?? ""),
          bathrooms: String(item.bathrooms ?? ""),
          condition: item.condition ?? "",
          amenities: item.amenities ?? "",
          notes: item.notes ?? "",
        }
      : {};
  }
  if (kind === "tenant") {
    const item = state.tenants.find((x) => x.id === editId);
    return item
      ? {
          entityType: item.entityType,
          name: item.name,
          address: item.address,
          locality: item.locality,
          postalCode: item.postalCode,
          taxId: item.taxId,
          idDocumentType: item.idDocumentType ?? "",
          idDocumentNumber: item.idDocumentNumber ?? "",
          nationality: item.nationality ?? "",
          birthDate: item.birthDate ?? "",
          email: item.email,
          phone: item.phone,
          mobile: item.mobile,
          whatsapp: item.whatsapp ?? "",
          notes: item.notes ?? "",
        }
      : {};
  }
  if (kind === "lease") {
    const item = state.leases.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          tenantIds: JSON.stringify(item.tenantIds ?? [item.tenantId]),
          portalContractNumber: item.portalContractNumber ?? "",
          rentDueDay: String(item.rentDueDay ?? (item.start ? Number(item.start.slice(8, 10)) : 1)),
          rent: String(item.rent),
          depositRequired: item.depositRequired ? "sim" : "nao",
          deposit: String(item.deposit),
          advanceRents: String(item.advanceRents),
          updateRate: String(item.updateRate),
          stampDutyAmount: String(item.stampDutyAmount ?? 0),
          stampDutyDate: item.stampDutyDate ?? "",
          stampDutyReference: item.stampDutyReference ?? "",
          stampDutyStatus: item.stampDutyStatus ?? "pendente",
        }
      : {};
  }
  if (kind === "movement") {
    const item = state.movements.find((x) => x.id === editId);
    return item
      ? {
          propertyId: item.propertyId,
          leaseId: item.leaseId ?? "",
          dueDate: item.dueDate,
          description: item.description,
          period: item.period,
          amount: String(item.amount),
          paidAmount: String(item.paidAmount ?? (item.paid ? item.amount : 0)),
          paymentDate: item.paymentDate ?? "",
          movementKind: item.kind,
          receiptStatus: item.receiptStatus ?? (item.receipt ? "emitido" : "nao_emitido"),
          receiptNumber: item.receiptNumber ?? "",
          receiptDate: item.receiptDate ?? "",
          paymentMethod: item.paymentMethod ?? "",
          source: item.source ?? (item.paymentMethod === "Importação Portal das Finanças" ? "import" : "manual"),
          notes: item.notes ?? "",
        }
      : {};
  }
  if (kind === "tax") {
    const item = state.taxes.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          paymentDate: item.paymentDate ?? "",
          amount: String(item.amount),
          paid: item.paid ? "sim" : "nao",
        }
      : {};
  }
  if (kind === "insurance") {
    const item = state.insurances.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          paymentDate: item.paymentDate ?? "",
          paid: item.paid ? "sim" : "nao",
          premium: String(item.premium),
        }
      : {};
  }
  if (kind === "condo") {
    const item = state.condominiums.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          paymentDate: item.paymentDate ?? "",
          allocationMode: item.allocationMode ?? "directa",
          buildingGroup: item.buildingGroup ?? "",
          amount: String(item.amount),
          paid: item.paid ? "sim" : "nao",
        }
      : {};
  }
  if (kind === "obligation") {
    const item = state.obligations.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          leaseId: item.leaseId ?? "",
          alertDays: String(item.alertDays),
          completedAt: item.completedAt ?? "",
          evidence: item.evidence ?? "",
        }
      : {};
  }
  if (kind === "maintenance") {
    const item = state.maintenance.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          responsibility: item.responsibility ?? "senhorio",
          expectedCost: String(item.expectedCost),
          actualCost: String(item.actualCost),
          paymentType: item.paymentType ?? "",
        }
      : {};
  }
  if (kind === "inventory") {
    const item = state.inventory.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          quantity: String(item.quantity),
          value: String(item.value),
          photoKey: item.photoKey ?? "",
        }
      : {};
  }
  if (kind === "contact") {
    const item = state.contacts.find((x) => x.id === editId);
    return item ? { ...item } : {};
  }
  if (kind === "financing") {
    const item = state.financings.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          initialAmount: String(item.initialAmount),
          outstandingCapital: String(item.outstandingCapital),
          interestRate: String(item.interestRate),
          monthlyPayment: String(item.monthlyPayment),
          active: item.active ? "sim" : "nao",
        }
      : {};
  }
  if (kind === "financingPayment") {
    const item = state.financingPayments.find((x) => x.id === editId);
    return item
      ? {
          ...item,
          amount: String(item.amount),
          principal: String(item.principal),
          interest: String(item.interest),
          fees: String(item.fees),
        }
      : {};
  }
  if (kind === "goal") {
    const item = state.performanceGoals.find((x) => x.id === editId);
    return item ? { ...item, target: String(item.target) } : {};
  }
  return {};
}

function EntityDialog({ kind, editId, prefill, onClose, state, onSave, onDelete }: { kind: DialogKind | null; editId: string | null; prefill: Record<string, string>; onClose: () => void; state: AppState; onSave: (next: Partial<AppState>) => void; onDelete: (kind: DialogKind, id: string) => void }) {
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    ...initialFields(kind, editId, state),
    ...prefill,
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFields((current) => ({ ...current, [name]: event.target.value }));
  const setValue = (name: string, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const titles: Record<DialogKind, string> = {
    property: "imóvel",
    tenant: "inquilino",
    lease: "contrato",
    movement: "renda e recibo",
    tax: "imposto",
    insurance: "seguro",
    condo: "despesa de condomínio",
    obligation: "obrigação",
    maintenance: "intervenção de manutenção",
    inventory: "item de inventário",
    contact: "contacto",
    financing: "financiamento",
    financingPayment: "pagamento de financiamento",
    goal: "objetivo de desempenho",
  };
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (kind === "property") {
      const previous = state.properties.find((x) => x.id === editId);
      const ownershipPeriods = (JSON.parse(fields.ownershipPeriods || "[]") as OwnershipPeriod[]).map((period) => ({
        ...period,
        percentage: Math.min(100, Math.max(0, Number(period.percentage))),
      }));
      const record: Property = {
        id: editId ?? uid("imovel"),
        name: fields.name,
        description: fields.description || "",
        address: fields.address,
        postalCode: fields.postalCode || "",
        locality: fields.locality || "",
        parish: fields.parish || "",
        type: fields.type || "Apartamento",
        fraction: fields.fraction || "",
        fiscalReference: fields.fiscalReference || "",
        buildingGroup: fields.buildingGroup || "",
        permillage: Number(fields.permillage || 0),
        ownershipPeriods: ownershipPeriods.length ? ownershipPeriods : defaultOwnership(),
        yearBuilt: fields.yearBuilt || "",
        energyRating: fields.energyRating || "",
        housingLicense: fields.housingLicense || "",
        status: previous?.status ?? "livre",
        mainPhotoKey: fields.mainPhotoKey || "",
        gallery: JSON.parse(fields.gallery || "[]"),
        area: Number(fields.area || 0),
        bedrooms: Number(fields.bedrooms || 0),
        bathrooms: Number(fields.bathrooms || 0),
        condition: fields.condition || "",
        amenities: fields.amenities || "",
        notes: fields.notes || "",
      };
      onSave({ properties: upsert(state.properties, record, editId) });
    }
    if (kind === "tenant") {
      const record: Tenant = {
        id: editId ?? uid("inquilino"),
        entityType: fields.entityType === "empresa" ? "empresa" : "particular",
        name: fields.name,
        address: fields.address || "",
        locality: fields.locality || "",
        postalCode: fields.postalCode || "",
        taxId: fields.taxId || "",
        idDocumentType: fields.idDocumentType || "",
        idDocumentNumber: fields.idDocumentNumber || "",
        nationality: fields.nationality || "",
        birthDate: fields.birthDate || "",
        email: fields.email || "",
        phone: fields.phone || "",
        mobile: fields.mobile || "",
        whatsapp: fields.whatsapp || "",
        notes: fields.notes || "",
      };
      onSave({ tenants: upsert(state.tenants, record, editId) });
    }
    if (kind === "lease") {
      const tenantIds = JSON.parse(fields.tenantIds || "[]") as string[];
      const record: Lease = {
        id: editId ?? uid("contrato"),
        propertyId: fields.propertyId,
        tenantId: tenantIds[0] || "",
        tenantIds,
        portalContractNumber: fields.portalContractNumber || "",
        start: fields.start,
        end: fields.end || "",
        renewalDate: fields.renewalDate || "",
        rentDueDay: Math.min(31, Math.max(1, Number(fields.rentDueDay || fields.start?.slice(8, 10) || 1))),
        rent: Number(fields.rent),
        depositRequired: fields.depositRequired === "sim",
        deposit: Number(fields.deposit || 0),
        advanceRents: Number(fields.advanceRents || 0),
        updateRate: Number(fields.updateRate || 0),
        stampDutyStatus: (fields.stampDutyStatus || "pendente") as Lease["stampDutyStatus"],
        stampDutyAmount: Number(fields.stampDutyAmount || 0),
        stampDutyDate: fields.stampDutyDate || "",
        stampDutyReference: fields.stampDutyReference || "",
        notes: fields.notes || "",
        status: fields.status === "rascunho" ? "rascunho" : "ativo",
      };
      onSave({ leases: upsert(state.leases, record, editId) });
    }
    if (kind === "movement") {
      const paidAmount = Number(fields.paidAmount || 0);
      const amount = Number(fields.amount);
      const receiptStatus = (fields.receiptStatus || "nao_emitido") as Movement["receiptStatus"];
      const lease = state.leases.find((x) => x.id === fields.leaseId);
      const record: Movement = {
        id: editId ?? uid("mov"),
        propertyId: lease?.propertyId || fields.propertyId,
        leaseId: fields.leaseId || "",
        dueDate: fields.dueDate,
        description: fields.description || "Renda",
        period: fields.period || "",
        amount,
        paidAmount,
        paymentDate: fields.paymentDate || "",
        kind: "receita",
        receipt: receiptStatus === "emitido",
        paid: paidAmount >= amount,
        receiptStatus,
        receiptNumber: fields.receiptNumber || "",
        receiptDate: fields.receiptDate || "",
        paymentMethod: fields.paymentMethod || "",
        source: (fields.source || "manual") as Movement["source"],
        notes: fields.notes || "",
      };
      onSave({ movements: upsert(state.movements, record, editId) });
    }
    if (kind === "tax") {
      const record: Tax = {
        id: editId ?? uid("imposto"),
        propertyId: fields.propertyId,
        issuer: fields.issuer,
        tax: fields.tax,
        period: fields.period,
        dueDate: fields.dueDate,
        paymentDate: fields.paymentDate || "",
        paymentType: fields.paymentType || "",
        amount: Number(fields.amount),
        paid: fields.paid === "sim",
        notes: fields.notes || "",
      };
      onSave({ taxes: upsert(state.taxes, record, editId) });
    }
    if (kind === "insurance") {
      const record: Insurance = {
        id: editId ?? uid("seguro"),
        propertyId: fields.propertyId,
        insurer: fields.insurer,
        scope: fields.scope,
        policy: fields.policy,
        startDate: fields.startDate || "",
        renewalDate: fields.renewalDate,
        paymentDate: fields.paymentDate || "",
        paid: fields.paid === "sim",
        paymentType: fields.paymentType || "",
        premium: Number(fields.premium),
        notes: fields.notes || "",
      };
      onSave({ insurances: upsert(state.insurances, record, editId) });
    }
    if (kind === "condo") {
      const record: Condo = {
        id: editId ?? uid("condominio"),
        propertyId: fields.propertyId,
        expenseType: fields.expenseType,
        scope: fields.scope || "",
        amount: Number(fields.amount),
        dueDate: fields.dueDate || "",
        paymentDate: fields.paymentDate || "",
        paymentType: fields.paymentType || "",
        paid: fields.paid === "sim",
        allocationMode: fields.allocationMode === "permilagem" ? "permilagem" : "directa",
        buildingGroup: fields.buildingGroup || "",
        notes: fields.notes || "",
      };
      onSave({ condominiums: upsert(state.condominiums, record, editId) });
    }
    if (kind === "obligation") {
      const record: Obligation = {
        id: editId ?? uid("obrigacao"),
        propertyId: fields.propertyId || "",
        leaseId: fields.leaseId || "",
        category: fields.category || "Outra",
        title: fields.title,
        basis: fields.basis || "",
        dueDate: fields.dueDate,
        alertDays: Number(fields.alertDays || 15),
        recurrence: fields.recurrence || "Não recorrente",
        priority: (fields.priority || "normal") as Obligation["priority"],
        status: (fields.status || "pendente") as Obligation["status"],
        responsible: fields.responsible || "",
        completedAt: fields.completedAt || "",
        evidence: fields.evidence || "",
        notes: fields.notes || "",
      };
      onSave({ obligations: upsert(state.obligations, record, editId) });
    }
    if (kind === "maintenance") {
      const record: MaintenanceCase = {
        id: editId ?? uid("manutencao"),
        propertyId: fields.propertyId,
        type: fields.type || "Manutenção corretiva",
        title: fields.title,
        description: fields.description || "",
        priority: (fields.priority || "normal") as MaintenanceCase["priority"],
        status: (fields.status || "identificado") as MaintenanceCase["status"],
        responsibility: (fields.responsibility || "senhorio") as MaintenanceCase["responsibility"],
        supplier: fields.supplier || "",
        expectedDate: fields.expectedDate || "",
        executedDate: fields.executedDate || "",
        expectedCost: Number(fields.expectedCost || 0),
        actualCost: Number(fields.actualCost || 0),
        paymentType: fields.paymentType || "",
        warrantyUntil: fields.warrantyUntil || "",
        tenantImpact: fields.tenantImpact || "",
        notes: fields.notes || "",
      };
      onSave({ maintenance: upsert(state.maintenance, record, editId) });
    }
    if (kind === "inventory") {
      const record: Inventory = {
        id: editId ?? uid("item"),
        propertyId: fields.propertyId,
        room: fields.room || "",
        category: fields.category || "",
        item: fields.item,
        brand: fields.brand || "",
        model: fields.model || "",
        serial: fields.serial || "",
        quantity: Number(fields.quantity || 1),
        condition: fields.condition || "Bom",
        value: Number(fields.value || 0),
        acquiredAt: fields.acquiredAt || "",
        warrantyUntil: fields.warrantyUntil || "",
        supplier: fields.supplier || "",
        photoKey: fields.photoKey || "",
        notes: fields.notes || "",
      };
      onSave({ inventory: upsert(state.inventory, record, editId) });
    }
    if (kind === "contact") {
      const record: Contact = {
        id: editId ?? uid("contacto"),
        propertyId: fields.propertyId || "",
        name: fields.name,
        relation: fields.relation,
        address: fields.address || "",
        phone: fields.phone || "",
        email: fields.email || "",
      };
      onSave({ contacts: upsert(state.contacts, record, editId) });
    }
    if (kind === "financing") {
      const record: Financing = {
        id: editId ?? uid("financiamento"),
        propertyId: fields.propertyId,
        institution: fields.institution,
        contractNumber: fields.contractNumber || "",
        initialAmount: Number(fields.initialAmount || 0),
        outstandingCapital: Number(fields.outstandingCapital || 0),
        interestRate: Number(fields.interestRate || 0),
        monthlyPayment: Number(fields.monthlyPayment || 0),
        startDate: fields.startDate || "",
        endDate: fields.endDate || "",
        active: fields.active !== "nao",
        notes: fields.notes || "",
      };
      onSave({ financings: upsert(state.financings, record, editId) });
    }
    if (kind === "financingPayment") {
      const financing = state.financings.find((item) => item.id === fields.financingId);
      const amount = Number(fields.amount || 0);
      const record: FinancingPayment = {
        id: editId ?? uid("pagamento-financiamento"),
        financingId: fields.financingId,
        propertyId: financing?.propertyId || fields.propertyId || "",
        paidDate: fields.paidDate,
        amount,
        principal: Number(fields.principal || 0),
        interest: Number(fields.interest || 0),
        fees: Number(fields.fees || 0),
        notes: fields.notes || "",
      };
      onSave({
        financingPayments: upsert(state.financingPayments, record, editId),
      });
    }
    if (kind === "goal") {
      const record: PerformanceGoal = {
        id: editId ?? uid("objetivo"),
        scope: fields.scope === "property" ? "property" : "global",
        propertyId: fields.scope === "property" ? fields.propertyId || "" : "",
        metric: (fields.metric || "netCashFlow") as PerformanceGoal["metric"],
        target: Number(fields.target || 0),
        startDate: fields.startDate,
        endDate: fields.endDate || "",
        notes: fields.notes || "",
      };
      onSave({
        performanceGoals: upsert(state.performanceGoals, record, editId),
      });
    }
  }
  return (
    <>
      <Dialog open={Boolean(kind)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="entity-dialog">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{kind ? `${editId ? "Ficha e edição —" : "Novo"} ${titles[kind]}` : "Novo registo"}</DialogTitle>
              <DialogDescription>{editId ? "Consulte todos os dados e altere os campos necessários." : "O registo pertence apenas à aplicação de gestão patrimonial."}</DialogDescription>
            </DialogHeader>
            <div className="form-grid">
              <FormFields kind={kind} fields={fields} set={set} setValue={setValue} state={state} />
            </div>
            {fields._originLabel && <div className="record-origin-note">{fields._originLabel}</div>}
            <DialogFooter>
              {editId && (
                <Button type="button" variant="destructive" className="dialog-delete" onClick={() => setConfirmDelete(true)}>
                  <Trash2 />
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{editId ? "Guardar alterações" : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar este registo?</AlertDialogTitle>
            <AlertDialogDescription>{kind === "property" ? "O imóvel e todos os registos diretamente associados serão eliminados." : kind === "tenant" ? "O inquilino e contratos em que seja o único inquilino serão eliminados." : "Esta ação remove definitivamente o registo selecionado."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (kind && editId) onDelete(kind, editId);
              }}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FormFields({ kind, fields, set, setValue, state }: { kind: DialogKind | null; fields: Record<string, string>; set: (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; setValue: (name: string, value: string) => void; state: AppState }) {
  const property = (
    <SelectField
      label="Imóvel"
      value={fields.propertyId}
      onChange={set("propertyId")}
      options={state.properties.map((item) => ({
        value: item.id,
        label: item.name,
      }))}
      required
    />
  );
  if (kind === "movement")
    return (
      <>
        <SelectField
          label="Contrato"
          value={fields.leaseId}
          onChange={set("leaseId")}
          options={state.leases.map((lease) => ({
            value: lease.id,
            label: `${state.properties.find((item) => item.id === lease.propertyId)?.name ?? "Imóvel"} · ${state.tenants.find((item) => item.id === lease.tenantId)?.name ?? "Inquilino"}`,
          }))}
          required
        />
        <Field label="Período da renda" placeholder="08/2026" value={fields.period} onChange={set("period")} required />
        <Field label="Data de vencimento" type="date" value={fields.dueDate} onChange={set("dueDate")} required />
        <Field label="Descrição" value={fields.description ?? "Renda"} onChange={set("description")} />
        <Field label="Valor devido (€)" type="number" step="0.01" value={fields.amount} onChange={set("amount")} required />
        <Field label="Valor pago (€)" type="number" step="0.01" value={fields.paidAmount} onChange={set("paidAmount")} />
        <Field label="Data de pagamento" type="date" value={fields.paymentDate} onChange={set("paymentDate")} />
        <PaymentMethodField value={fields.paymentMethod} onChange={set("paymentMethod")} />
        <SelectField
          label="Estado do recibo"
          value={fields.receiptStatus ?? "nao_emitido"}
          onChange={set("receiptStatus")}
          options={[
            { value: "nao_emitido", label: "Por emitir" },
            { value: "emitido", label: "Emitido" },
            { value: "anulado", label: "Anulado" },
          ]}
        />
        <Field label="Número do recibo" value={fields.receiptNumber} onChange={set("receiptNumber")} />
        <Field label="Data de emissão" type="date" value={fields.receiptDate} onChange={set("receiptDate")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
        <small className="record-origin-note">Origem: {fields.source === "contract" ? "registo gerado automaticamente pelo contrato" : fields.source === "import" ? "importação do ficheiro de recibos" : "registo manual"}. Ao guardar, os estados de pagamento e recibo serão recalculados.</small>
      </>
    );
  if (kind === "property")
    return (
      <>
        <PhotoUploadField label="Imagem principal do imóvel" value={fields.mainPhotoKey} onChange={(value) => setValue("mainPhotoKey", value)} />
        <Field label="Designação" value={fields.name} onChange={set("name")} required />
        <OwnershipPeriodsField value={fields.ownershipPeriods} onChange={(value) => setValue("ownershipPeriods", value)} />
        <Field label="Descrição" value={fields.description} onChange={set("description")} />
        <Field label="Morada" value={fields.address} onChange={set("address")} required />
        <Field label="Código postal" value={fields.postalCode} onChange={set("postalCode")} />
        <Field label="Localidade" value={fields.locality} onChange={set("locality")} />
        <Field label="Freguesia" value={fields.parish} onChange={set("parish")} />
        <Field label="Tipo" value={fields.type} onChange={set("type")} />
        <Field label="Fração" value={fields.fraction} onChange={set("fraction")} />
        <Field label="Referência do imóvel nas Finanças" value={fields.fiscalReference} onChange={set("fiscalReference")} placeholder="Referência matricial" />
        <Field label="Prédio / grupo de repartição" value={fields.buildingGroup} onChange={set("buildingGroup")} placeholder="Ex.: edifício ou morada" />
        <Field label="Permilagem (‰)" type="number" min="0" max="1000" step="0.001" value={fields.permillage} onChange={set("permillage")} />
        <Field label="Área (m²)" type="number" step="0.01" value={fields.area} onChange={set("area")} />
        <Field label="Quartos" type="number" min="0" value={fields.bedrooms} onChange={set("bedrooms")} />
        <Field label="Casas de banho" type="number" min="0" value={fields.bathrooms} onChange={set("bathrooms")} />
        <Field label="Estado de conservação" value={fields.condition} onChange={set("condition")} />
        <Field label="Características e equipamentos" value={fields.amenities} onChange={set("amenities")} placeholder="Varanda, elevador, garagem, aquecimento…" />
        <Field label="Ano de construção" type="number" value={fields.yearBuilt} onChange={set("yearBuilt")} />
        <Field label="Classificação energética" value={fields.energyRating} onChange={set("energyRating")} />
        <Field label="Licença de habitação" value={fields.housingLicense} onChange={set("housingLicense")} placeholder="Número e/ou referência da licença" />
        <GalleryUploadField value={fields.gallery} onChange={(value) => setValue("gallery", value)} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "tenant")
    return (
      <>
        <SelectField
          label="Tipo"
          value={fields.entityType ?? "particular"}
          onChange={set("entityType")}
          options={[
            { value: "particular", label: "Particular" },
            { value: "empresa", label: "Empresa" },
          ]}
        />
        <Field label="Nome" value={fields.name} onChange={set("name")} required />
        <Field label="NIF" value={fields.taxId} onChange={set("taxId")} />
        <SelectField label="Documento de identificação" value={fields.idDocumentType} onChange={set("idDocumentType")} options={["Cartão de Cidadão", "Bilhete de Identidade", "Passaporte", "Título de residência", "Outro"].map((value) => ({ value, label: value }))} />
        <Field label="Número do documento" value={fields.idDocumentNumber} onChange={set("idDocumentNumber")} />
        <Field label="Nacionalidade" value={fields.nationality} onChange={set("nationality")} />
        <Field label="Data de nascimento" type="date" value={fields.birthDate} onChange={set("birthDate")} />
        <Field label="Morada" value={fields.address} onChange={set("address")} />
        <Field label="Localidade" value={fields.locality} onChange={set("locality")} />
        <Field label="Código postal" value={fields.postalCode} onChange={set("postalCode")} />
        <Field label="Telefone" value={fields.phone} onChange={set("phone")} />
        <Field label="Telemóvel" value={fields.mobile} onChange={set("mobile")} />
        <Field label="WhatsApp" type="tel" value={fields.whatsapp} onChange={set("whatsapp")} />
        <Field label="Email" type="email" value={fields.email} onChange={set("email")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "lease")
    return (
      <>
        {property}
        <MultiTenantField tenants={state.tenants} value={fields.tenantIds} onChange={(value) => setValue("tenantIds", value)} />
        <Field label="N.º do contrato nas Finanças" value={fields.portalContractNumber} onChange={set("portalContractNumber")} placeholder="Número do contrato" />
        <SelectField
          label="Estado"
          value={fields.status ?? "ativo"}
          onChange={set("status")}
          options={[
            { value: "ativo", label: "Ativo" },
            { value: "rascunho", label: "Rascunho" },
          ]}
        />
        <Field label="Data de início" type="date" value={fields.start} onChange={set("start")} required />
        <Field label="Data de termo" type="date" value={fields.end} onChange={set("end")} />
        <Field label="Data de renovação" type="date" value={fields.renewalDate} onChange={set("renewalDate")} />
        <Field label="Dia de vencimento da renda" type="number" min="1" max="31" value={fields.rentDueDay} onChange={set("rentDueDay")} placeholder="1" />
        <Field label="Renda mensal (€)" type="number" value={fields.rent} onChange={set("rent")} required />
        <YesNo label="Caução exigida?" value={fields.depositRequired} onChange={set("depositRequired")} />
        <Field label="Valor da caução (€)" type="number" value={fields.deposit} onChange={set("deposit")} />
        <Field label="Rendas antecipadas" type="number" value={fields.advanceRents} onChange={set("advanceRents")} />
        <Field label="Taxa de atualização (%)" type="number" step="0.01" value={fields.updateRate} onChange={set("updateRate")} />
        <SelectField
          label="Imposto do selo"
          value={fields.stampDutyStatus ?? "pendente"}
          onChange={set("stampDutyStatus")}
          options={[
            { value: "pendente", label: "Pendente / por confirmar" },
            { value: "pago", label: "Pago" },
            { value: "isento", label: "Isento" },
          ]}
        />
        <Field label="Valor do imposto do selo (€)" type="number" step="0.01" value={fields.stampDutyAmount} onChange={set("stampDutyAmount")} />
        <Field label="Data de pagamento" type="date" value={fields.stampDutyDate} onChange={set("stampDutyDate")} />
        <Field label="Referência / comprovativo" value={fields.stampDutyReference} onChange={set("stampDutyReference")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "tax")
    return (
      <>
        {property}
        <Field label="Emissor" value={fields.issuer} onChange={set("issuer")} required />
        <Field label="Imposto" value={fields.tax} onChange={set("tax")} required />
        <Field label="Período" value={fields.period} onChange={set("period")} required />
        <Field label="Data-limite" type="date" value={fields.dueDate} onChange={set("dueDate")} required />
        <Field label="Valor (€)" type="number" step="0.01" value={fields.amount} onChange={set("amount")} required />
        <PaymentMethodField value={fields.paymentType} onChange={set("paymentType")} />
        <YesNo label="Pago?" value={fields.paid} onChange={set("paid")} />
        <Field label="Data de pagamento" type="date" value={fields.paymentDate} onChange={set("paymentDate")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "insurance")
    return (
      <>
        {property}
        <Field label="Seguradora" value={fields.insurer} onChange={set("insurer")} required />
        <Field label="Âmbito / cobertura" value={fields.scope} onChange={set("scope")} required />
        <Field label="Número da apólice" value={fields.policy} onChange={set("policy")} required />
        <Field label="Data de início" type="date" value={fields.startDate} onChange={set("startDate")} />
        <Field label="Data de renovação" type="date" value={fields.renewalDate} onChange={set("renewalDate")} required />
        <Field label="Prémio (€)" type="number" step="0.01" value={fields.premium} onChange={set("premium")} required />
        <PaymentMethodField value={fields.paymentType} onChange={set("paymentType")} />
        <YesNo label="Pago?" value={fields.paid} onChange={set("paid")} />
        <Field label="Data de pagamento" type="date" value={fields.paymentDate} onChange={set("paymentDate")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "condo") {
    const expenseTypes = ["Quota ordinária", "Quota extraordinária", "Fundo comum de reserva", "Água", "Eletricidade", "Gás", "Limpeza", "Gestão do condomínio", "Resíduos", "Seguro do condomínio", "Seguro das partes comuns", "Franquia de sinistro", "Serviços jurídicos", "Contabilidade", "Taxas, licenças e certificações", "Acerto de contas", "Dívida anterior", "Reembolso", "Crédito ou estorno", "Outro"];
    const options = [...new Set([...(fields.expenseType && !expenseTypes.includes(fields.expenseType) ? [fields.expenseType] : []), ...expenseTypes])].map((value) => ({ value, label: value }));
    return (
      <>
        {property}
        <SelectField label="Tipo de despesa" value={fields.expenseType} onChange={set("expenseType")} options={options} required />
        <Field label="Âmbito" value={fields.scope} onChange={set("scope")} placeholder={fields.expenseType === "Outro" ? "Descrição obrigatória da despesa" : "Descrição do serviço ou período"} required={fields.expenseType === "Outro"} />
        <SelectField
          label="Imputação"
          value={fields.allocationMode ?? "directa"}
          onChange={set("allocationMode")}
          options={[
            { value: "directa", label: "Direta ao imóvel" },
            { value: "permilagem", label: "Repartir por permilagem" },
          ]}
        />
        {fields.allocationMode === "permilagem" && <Field label="Prédio / grupo de repartição" value={fields.buildingGroup} onChange={set("buildingGroup")} placeholder="Igual ao registado nas frações" required />}
        <Field label="Valor (€)" type="number" step="0.01" value={fields.amount} onChange={set("amount")} required />
        <DateField label="Data-limite" value={fields.dueDate} onChange={(value) => setValue("dueDate", value)} />
        <PaymentMethodField value={fields.paymentType} onChange={set("paymentType")} />
        <YesNo label="Pago?" value={fields.paid} onChange={set("paid")} />
        <DateField label="Data de pagamento" value={fields.paymentDate} onChange={(value) => setValue("paymentDate", value)} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  }
  if (kind === "obligation")
    return (
      <>
        {property}
        <SelectField
          label="Contrato (opcional)"
          value={fields.leaseId}
          onChange={set("leaseId")}
          options={state.leases.map((lease) => ({
            value: lease.id,
            label: `${state.properties.find((item) => item.id === lease.propertyId)?.name ?? "Imóvel"} · ${state.tenants.find((item) => item.id === lease.tenantId)?.name ?? "Inquilino"}`,
          }))}
        />
        <SelectField label="Categoria" value={fields.category ?? "Outra"} onChange={set("category")} options={["Renda", "Recibo", "Contrato", "Seguro", "Imposto", "Condomínio", "Inspeção", "Certificado", "Manutenção", "Garantia", "Documento", "Outra"].map((value) => ({ value, label: value }))} />
        <Field label="Obrigação" value={fields.title} onChange={set("title")} required />
        <Field label="Fundamento" value={fields.basis} onChange={set("basis")} placeholder="Contrato, apólice, regra interna…" />
        <Field label="Data-limite" type="date" value={fields.dueDate} onChange={set("dueDate")} required />
        <Field label="Antecedência do alerta (dias)" type="number" min="0" value={fields.alertDays ?? "15"} onChange={set("alertDays")} />
        <SelectField label="Recorrência" value={fields.recurrence ?? "Não recorrente"} onChange={set("recurrence")} options={["Não recorrente", "Mensal", "Trimestral", "Semestral", "Anual"].map((value) => ({ value, label: value }))} />
        <SelectField
          label="Prioridade"
          value={fields.priority ?? "normal"}
          onChange={set("priority")}
          options={[
            { value: "baixa", label: "Baixa" },
            { value: "normal", label: "Normal" },
            { value: "alta", label: "Alta" },
            { value: "urgente", label: "Urgente" },
          ]}
        />
        <SelectField
          label="Estado"
          value={fields.status ?? "pendente"}
          onChange={set("status")}
          options={[
            { value: "pendente", label: "Pendente" },
            { value: "concluida", label: "Concluída" },
            { value: "cancelada", label: "Cancelada" },
          ]}
        />
        <Field label="Responsável" value={fields.responsible} onChange={set("responsible")} />
        <Field label="Data de conclusão" type="date" value={fields.completedAt} onChange={set("completedAt")} />
        <Field label="Evidência / referência" value={fields.evidence} onChange={set("evidence")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "maintenance")
    return (
      <>
        {property}
        <SelectField label="Tipo de intervenção" value={fields.type ?? "Manutenção corretiva"} onChange={set("type")} options={["Pedido", "Avaria", "Incidente", "Inspeção", "Manutenção preventiva", "Manutenção corretiva", "Obra", "Melhoria", "Jardinagem", "Segurança", "Elevadores", "Portões e acessos", "Intercomunicadores", "Equipamentos comuns", "Canalização", "Esgotos", "Cobertura", "Fachada", "Pintura", "Obra de conservação", "Obra de reparação", "Obra de beneficiação", "Obra urgente", "Reparação de sinistro"].map((value) => ({ value, label: value }))} />
        <Field label="Intervenção" value={fields.title} onChange={set("title")} required />
        <Field label="Descrição" value={fields.description} onChange={set("description")} />
        <SelectField
          label="Responsabilidade"
          value={fields.responsibility ?? "senhorio"}
          onChange={set("responsibility")}
          options={[
            { value: "inquilino", label: "Inquilino" },
            { value: "senhorio", label: "Senhorio" },
            { value: "condominio", label: "Condomínio" },
            { value: "outro", label: "Outro" },
          ]}
        />
        <SelectField
          label="Prioridade"
          value={fields.priority ?? "normal"}
          onChange={set("priority")}
          options={[
            { value: "baixa", label: "Baixa" },
            { value: "normal", label: "Normal" },
            { value: "alta", label: "Alta" },
            { value: "urgente", label: "Urgente" },
          ]}
        />
        <SelectField
          label="Estado"
          value={fields.status ?? "identificado"}
          onChange={set("status")}
          options={[
            { value: "identificado", label: "Identificado" },
            { value: "analise", label: "Em análise" },
            { value: "orcamento", label: "A aguardar orçamento" },
            { value: "aprovado", label: "Aprovado" },
            { value: "agendado", label: "Agendado" },
            { value: "execucao", label: "Em execução" },
            { value: "concluido", label: "Concluído" },
            { value: "garantia", label: "Em garantia" },
            { value: "cancelado", label: "Cancelado" },
          ]}
        />
        <Field label="Fornecedor / técnico" value={fields.supplier} onChange={set("supplier")} />
        <Field label="Data prevista" type="date" value={fields.expectedDate} onChange={set("expectedDate")} />
        <Field label="Data de execução" type="date" value={fields.executedDate} onChange={set("executedDate")} />
        <Field label="Custo previsto (€)" type="number" step="0.01" value={fields.expectedCost} onChange={set("expectedCost")} />
        <Field label="Custo real (€)" type="number" step="0.01" value={fields.actualCost} onChange={set("actualCost")} />
        <PaymentMethodField value={fields.paymentType} onChange={set("paymentType")} />
        <Field label="Garantia até" type="date" value={fields.warrantyUntil} onChange={set("warrantyUntil")} />
        <Field label="Impacto no inquilino" value={fields.tenantImpact} onChange={set("tenantImpact")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "inventory")
    return (
      <>
        {property}
        <PhotoUploadField label="Fotografia do item" value={fields.photoKey} onChange={(value) => setValue("photoKey", value)} />
        <Field label="Divisão" value={fields.room} onChange={set("room")} />
        <Field label="Categoria" value={fields.category} onChange={set("category")} />
        <Field label="Item" value={fields.item} onChange={set("item")} required />
        <Field label="Marca" value={fields.brand} onChange={set("brand")} />
        <Field label="Modelo" value={fields.model} onChange={set("model")} />
        <Field label="Número de série" value={fields.serial} onChange={set("serial")} />
        <Field label="Quantidade" type="number" min="1" value={fields.quantity ?? "1"} onChange={set("quantity")} />
        <Field label="Estado" value={fields.condition} onChange={set("condition")} />
        <Field label="Valor unitário (€)" type="number" step="0.01" value={fields.value} onChange={set("value")} />
        <Field label="Data de aquisição" type="date" value={fields.acquiredAt} onChange={set("acquiredAt")} />
        <Field label="Garantia até" type="date" value={fields.warrantyUntil} onChange={set("warrantyUntil")} />
        <Field label="Fornecedor" value={fields.supplier} onChange={set("supplier")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "contact")
    return (
      <>
        {property}
        <Field label="Nome" value={fields.name} onChange={set("name")} required />
        <Field label="Relação / função" value={fields.relation} onChange={set("relation")} required />
        <Field label="Morada" value={fields.address} onChange={set("address")} />
        <Field label="Telefone" value={fields.phone} onChange={set("phone")} />
        <Field label="Email" type="email" value={fields.email} onChange={set("email")} />
      </>
    );
  if (kind === "financing")
    return (
      <>
        {property}
        <Field label="Instituição" value={fields.institution} onChange={set("institution")} required />
        <Field label="Número do contrato" value={fields.contractNumber} onChange={set("contractNumber")} />
        <Field label="Montante inicial (€)" type="number" min="0" step="0.01" value={fields.initialAmount} onChange={set("initialAmount")} />
        <Field label="Capital em dívida (€)" type="number" min="0" step="0.01" value={fields.outstandingCapital} onChange={set("outstandingCapital")} />
        <Field label="Taxa atual (%)" type="number" min="0" step="0.001" value={fields.interestRate} onChange={set("interestRate")} />
        <Field label="Prestação de referência (€)" type="number" min="0" step="0.01" value={fields.monthlyPayment} onChange={set("monthlyPayment")} />
        <Field label="Data de contratação" type="date" value={fields.startDate} onChange={set("startDate")} />
        <Field label="Data de termo" type="date" value={fields.endDate} onChange={set("endDate")} />
        <YesNo label="Financiamento ativo?" value={fields.active ?? "sim"} onChange={set("active")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "financingPayment")
    return (
      <>
        <SelectField
          label="Financiamento"
          value={fields.financingId}
          onChange={set("financingId")}
          options={state.financings.map((item) => ({
            value: item.id,
            label: `${item.institution} · ${state.properties.find((propertyItem) => propertyItem.id === item.propertyId)?.name ?? "Imóvel"}`,
          }))}
          required
        />
        <Field label="Data do pagamento" type="date" value={fields.paidDate} onChange={set("paidDate")} required />
        <Field label="Valor total (€)" type="number" min="0" step="0.01" value={fields.amount} onChange={set("amount")} required />
        <Field label="Capital amortizado (€)" type="number" min="0" step="0.01" value={fields.principal} onChange={set("principal")} />
        <Field label="Juros (€)" type="number" min="0" step="0.01" value={fields.interest} onChange={set("interest")} />
        <Field label="Comissões (€)" type="number" min="0" step="0.01" value={fields.fees} onChange={set("fees")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  if (kind === "goal")
    return (
      <>
        <SelectField
          label="Âmbito"
          value={fields.scope ?? "global"}
          onChange={set("scope")}
          options={[
            { value: "global", label: "Carteira global" },
            { value: "property", label: "Imóvel específico" },
          ]}
        />
        {fields.scope === "property" && property}
        <SelectField
          label="Indicador"
          value={fields.metric ?? "netCashFlow"}
          onChange={set("metric")}
          options={[
            { value: "netCashFlow", label: "Cash flow líquido (€)" },
            { value: "collectionRate", label: "Taxa de cobrança (%)" },
            { value: "occupancy", label: "Taxa de ocupação (%)" },
            { value: "operatingMargin", label: "Margem operacional (%)" },
          ]}
        />
        <Field label="Valor objetivo" type="number" step="0.01" value={fields.target} onChange={set("target")} required />
        <Field label="Início de vigência" type="date" value={fields.startDate} onChange={set("startDate")} required />
        <Field label="Fim de vigência" type="date" value={fields.endDate} onChange={set("endDate")} />
        <Field label="Observações" value={fields.notes} onChange={set("notes")} />
      </>
    );
  return null;
}

function OwnershipPeriodsField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const periods = (JSON.parse(value || "[]") as OwnershipPeriod[]).length ? (JSON.parse(value || "[]") as OwnershipPeriod[]) : defaultOwnership();
  const update = (id: string, patch: Partial<OwnershipPeriod>) => onChange(JSON.stringify(periods.map((period) => (period.id === id ? { ...period, ...patch } : period))));
  return (
    <fieldset className="ownership-periods">
      <legend>Participação no imóvel</legend>
      <p>Registe a percentagem que lhe pertence e a respetiva vigência. Os valores integrais permanecem disponíveis.</p>
      {periods.map((period, index) => (
        <div className="ownership-row" key={period.id}>
          <Field label="Percentagem (%)" type="number" min="0" max="100" step="0.01" value={period.percentage} onChange={(event) => update(period.id, { percentage: Number(event.target.value) })} required />
          <Field label="Desde" type="date" value={period.startDate} onChange={(event) => update(period.id, { startDate: event.target.value })} />
          <Field label="Até" type="date" value={period.endDate} onChange={(event) => update(period.id, { endDate: event.target.value })} />
          <button type="button" aria-label={`Eliminar período ${index + 1}`} disabled={periods.length === 1} onClick={() => onChange(JSON.stringify(periods.filter((item) => item.id !== period.id)))}>
            <Trash2 />
          </button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          onChange(
            JSON.stringify([
              ...periods,
              {
                id: uid("participacao"),
                percentage: periods.at(-1)?.percentage ?? 100,
                startDate: "",
                endDate: "",
              },
            ]),
          )
        }
      >
        <Plus />
        Adicionar período
      </Button>
      <small>Sem datas, a percentagem aplica-se a todo o histórico. Evite períodos sobrepostos.</small>
    </fieldset>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  if (props.type === "date") {
    return <DateField label={label} value={String(props.value ?? "")} required={Boolean(props.required)} onChange={(value) => props.onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>)} />;
  }
  return (
    <label>
      {label}
      <input {...props} value={props.value ?? ""} />
    </label>
  );
}
function PaymentMethodField({ value, onChange }: { value?: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void }) {
  const options = [...(value && !PAYMENT_METHODS.includes(value) ? [value] : []), ...PAYMENT_METHODS].map((method) => ({ value: method, label: method }));
  return <SelectField label="Tipo de pagamento" value={value} onChange={onChange} options={options} />;
}
function DateField({ label, value, onChange, required = false }: { label: string; value?: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label>
      {label}
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
        title="Introduza a data no formato DD/MM/AAAA"
        value={dateForInput(value)}
        required={required}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
          const formatted = digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
          onChange(dateFromInput(formatted));
        }}
      />
    </label>
  );
}
function SelectField({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      {label}
      <select {...props} value={props.value ?? ""}>
        <option value="">Selecionar…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function YesNo({ label, value, onChange }: { label: string; value?: string; onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <SelectField
      label={label}
      value={value ?? "nao"}
      onChange={onChange}
      options={[
        { value: "nao", label: "Não" },
        { value: "sim", label: "Sim" },
      ]}
    />
  );
}

async function optimiseImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Selecione um ficheiro de imagem.");
  const source = await createImageBitmap(file).catch(() => null);
  if (!source) throw new Error("Não foi possível ler esta imagem. Converta-a para JPEG, PNG ou WebP e tente novamente.");
  let width = source.width,
    height = source.height;
  const maxSide = 1600;
  if (Math.max(width, height) > maxSide) {
    const scale = maxSide / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    source.close();
    throw new Error("Não foi possível preparar a fotografia.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  source.close();
  let quality = 0.86;
  let blob: Blob | null = null;
  do {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    quality -= 0.1;
  } while (blob && blob.size > 750 * 1024 && quality >= 0.46);
  if (!blob) throw new Error("Não foi possível otimizar a fotografia.");
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "fotografia";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
async function uploadImage(file: File) {
  const prepared = await optimiseImage(file);
  const form = new FormData();
  form.append("file", prepared);
  const response = await fetch("/api/documents", {
    method: "POST",
    body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível carregar a imagem.");
  return String(result.key);
}
function PhotoUploadField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="photo-field">
      <span>{label}</span>
      {value ? (
        <img src={fileUrl(value)} alt="Pré-visualização" />
      ) : (
        <div className="photo-placeholder">
          <Upload />
        </div>
      )}
      <label className="upload-button">
        {busy ? "A otimizar e carregar…" : value ? "Substituir fotografia" : "Carregar fotografia"}
        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              onChange(await uploadImage(file));
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Não foi possível carregar a fotografia.");
            } finally {
              setBusy(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {error && <small className="upload-error">{error}</small>}
      {value && (
        <button type="button" className="remove-photo" onClick={() => onChange("")}>
          Remover fotografia
        </button>
      )}
    </div>
  );
}
function GalleryUploadField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const keys = JSON.parse(value || "[]") as string[];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="gallery-field">
      <span>Galeria de características</span>
      <div className="gallery-grid">
        {keys.map((key) => (
          <div key={key}>
            <img src={fileUrl(key)} alt="Característica do imóvel" />
            <button type="button" onClick={() => onChange(JSON.stringify(keys.filter((item) => item !== key)))}>
              <X />
            </button>
          </div>
        ))}
      </div>
      <label className="upload-button">
        {busy ? "A otimizar e carregar…" : "Adicionar fotografias"}
        <input
          hidden
          multiple
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={busy}
          onChange={async (event) => {
            const files = [...(event.target.files ?? [])];
            if (!files.length) return;
            setBusy(true);
            setError("");
            try {
              const uploaded: string[] = [];
              for (const file of files) uploaded.push(await uploadImage(file));
              onChange(JSON.stringify([...keys, ...uploaded]));
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Não foi possível carregar as fotografias.");
            } finally {
              setBusy(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {error && <small className="upload-error">{error}</small>}
    </div>
  );
}
function MultiTenantField({ tenants, value, onChange }: { tenants: Tenant[]; value?: string; onChange: (value: string) => void }) {
  const selected = JSON.parse(value || "[]") as string[];
  return (
    <fieldset className="multi-tenant">
      <legend>Inquilinos do contrato *</legend>
      {tenants.map((tenant) => (
        <label key={tenant.id}>
          <input type="checkbox" checked={selected.includes(tenant.id)} onChange={(event) => onChange(JSON.stringify(event.target.checked ? [...selected, tenant.id] : selected.filter((id) => id !== tenant.id)))} />
          {tenant.name}
        </label>
      ))}
      {!tenants.length && <small>Crie primeiro os inquilinos.</small>}
    </fieldset>
  );
}

