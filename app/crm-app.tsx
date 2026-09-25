"use client";

import { useEffect, useMemo, useState } from "react";
import { Operations } from "./operations";
import {Journey} from './journey';
import { StudioOverview, Workflows, ResourceLibrary, RecordEditor, RecordsView } from "./studio";
import {
  BarChart3, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight,
  CircleHelp, Clock3, CreditCard, FileSignature, FolderKanban, HandCoins,
  Headphones, LayoutDashboard, Menu, MoreHorizontal, PackageCheck, Plus,
  ReceiptText, Search, Settings2, Sparkles, Target, Users, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";

type Page = "overview" | "pipeline" | "clients" | "projects" | "services" | "billing" | "subscriptions" | "support" | "operations" | "workflows" | "library" | "records" | "journey";
type Payload = Record<string, unknown>;
type CRMRecord = { id: string; type: string; name: string; clientId: string | null; status: string; value: number; payload: Payload; createdAt: string; updatedAt: string };
type Service = { id: string; category: string; name: string; description: string; price: number; unit: string; recommended?: boolean };

const money = (pence = 0) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);
const asString = (value: unknown) => typeof value === "string" ? value : "";
const asNumber = (value: unknown) => typeof value === "number" ? value : 0;
const asList = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

const services: Service[] = [
  { id: "brand-workshop", category: "Brand strategy", name: "Brand discovery workshop", description: "90-minute leadership session, audit and strategic direction.", price: 75000, unit: "project" },
  { id: "brand-strategy", category: "Brand strategy", name: "Brand strategy & positioning", description: "Audience, market position, promise, personality and messaging spine.", price: 175000, unit: "project", recommended: true },
  { id: "naming", category: "Brand strategy", name: "Naming & tagline", description: "Research, naming routes, checks and shortlist presentation.", price: 95000, unit: "project" },
  { id: "logo", category: "Brand identity", name: "Logo identity system", description: "Primary mark, responsive variants, colour and final asset suite.", price: 150000, unit: "project", recommended: true },
  { id: "visual-identity", category: "Brand identity", name: "Complete visual identity", description: "Logo, palette, typography, graphic language and applications.", price: 325000, unit: "project", recommended: true },
  { id: "guidelines", category: "Brand identity", name: "Brand guidelines", description: "Practical digital brand book with usage rules and examples.", price: 125000, unit: "project" },
  { id: "social-kit", category: "Brand identity", name: "Social media launch kit", description: "Avatar, banners and 12 editable launch templates.", price: 65000, unit: "project" },
  { id: "packaging", category: "Brand identity", name: "Packaging design", description: "Creative direction and print-ready artwork for one SKU.", price: 85000, unit: "per SKU" },
  { id: "copy", category: "Content", name: "Website copywriting", description: "Conversion-led copy for up to six core pages.", price: 110000, unit: "project" },
  { id: "photo-direction", category: "Content", name: "Creative direction", description: "Moodboard, shot list and production direction for a campaign.", price: 95000, unit: "project" },
  { id: "starter-site", category: "Websites", name: "Business website", description: "Strategy, UX, copy support and up to six responsive pages.", price: 220000, unit: "project", recommended: true },
  { id: "ecommerce", category: "Websites", name: "E-commerce website", description: "Conversion-led online shop, payment, delivery and core automations.", price: 500000, unit: "from" },
  { id: "lms", category: "Websites", name: "Membership or LMS website", description: "Course, member, access and payment experience.", price: 450000, unit: "from" },
  { id: "bespoke-site", category: "Websites", name: "Bespoke digital experience", description: "Custom UX, motion, complex content and integrations.", price: 750000, unit: "from", recommended: true },
  { id: "landing", category: "Websites", name: "Campaign landing page", description: "Focused conversion page with tracking and lead capture.", price: 125000, unit: "project" },
  { id: "web-app", category: "Websites", name: "Web application", description: "Product design and development for a scoped web platform.", price: 850000, unit: "from" },
  { id: "booking", category: "Websites", name: "Booking system setup", description: "Services, staff, locations, payments and notifications.", price: 125000, unit: "project" },
  { id: "migration", category: "Websites", name: "Platform migration", description: "Content, redirects, products and launch assurance.", price: 150000, unit: "from" },
  { id: "seo-foundations", category: "SEO & growth", name: "SEO foundations", description: "Research, technical setup, on-page optimisation and tracking.", price: 125000, unit: "project" },
  { id: "seo-retainer", category: "SEO & growth", name: "SEO Growth", description: "Monthly technical, content and authority programme.", price: 85000, unit: "month", recommended: true },
  { id: "social-management", category: "SEO & growth", name: "Social media management", description: "Strategy, 12 posts, design, scheduling and monthly report.", price: 120000, unit: "month" },
  { id: "analytics", category: "SEO & growth", name: "Analytics & Search Console", description: "GA4, Search Console, events and conversion dashboard.", price: 45000, unit: "project" },
  { id: "care", category: "Care plans", name: "Website Care", description: "Hosting, updates, security, backups and monthly support.", price: 16600, unit: "month", recommended: true },
  { id: "commerce-care", category: "Care plans", name: "Commerce Care", description: "Store monitoring, updates, reporting and two support hours.", price: 32500, unit: "month" },
  { id: "growth-partner", category: "Care plans", name: "Growth Partner", description: "Care, analytics, optimisation and four retained hours.", price: 65000, unit: "month" },
];

const nav = [
  { id: "overview" as Page, label: "Overview", icon: LayoutDashboard },
  { id: "journey" as Page, label: "Client journeys", icon: BriefcaseBusiness },
  { id: "operations" as Page, label: "Delivery desk", icon: Check },
  { id: "pipeline" as Page, label: "Sales pipeline", icon: Target },
  { id: "clients" as Page, label: "Clients", icon: Users },
  { id: "projects" as Page, label: "Projects", icon: FolderKanban },
  { id: "services" as Page, label: "Services & pricing", icon: PackageCheck },
  { id: "billing" as Page, label: "Proposals & invoices", icon: ReceiptText },
  { id: "subscriptions" as Page, label: "Subscriptions", icon: CreditCard },
  { id: "support" as Page, label: "Support", icon: Headphones },
  { id: "workflows" as Page, label: "Workflows", icon: BriefcaseBusiness },
  { id: "library" as Page, label: "Studio library", icon: FolderKanban },
  { id: "records" as Page, label: "Manage records", icon: Settings2 },
];

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200", strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200", success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  proposal: "bg-violet-50 text-violet-700 border-violet-200", negotiation: "bg-amber-50 text-amber-800 border-amber-200",
  discovery: "bg-blue-50 text-blue-700 border-blue-200", design: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  development: "bg-cyan-50 text-cyan-700 border-cyan-200", review: "bg-amber-50 text-amber-800 border-amber-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200", "part-paid": "bg-amber-50 text-amber-800 border-amber-200",
  open: "bg-rose-50 text-rose-700 border-rose-200", resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function Status({ value }: { value: string }) {
  return <Badge variant="outline" className={`capitalize ${statusStyles[value.toLowerCase()] ?? "bg-slate-50 text-slate-700"}`}>{value.replaceAll("-", " ")}</Badge>;
}

export function AdeolaCRM() {
  const [page, setPage] = useState<Page>("overview");
  const [records, setRecords] = useState<CRMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"client" | "project" | "invoice" | "ticket" | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CRMRecord | null>(null);
  const [editing,setEditing]=useState<CRMRecord|null>(null);
  const currentRecords=records.filter(r=>r.status!=="archived");

  const load = async () => {
    setLoadError("");
    try {
      const response = await fetch("/api/crm", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the workspace");
      const data = await response.json() as { records: CRMRecord[] };
      setRecords(data.records);
    } catch (error) {
      setLoadError("Unable to load saved records. Please retry before making changes.");
      toast.error(error instanceof Error ? error.message : "Could not load the workspace");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const context = typeof document === "undefined" ? undefined : (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    void register({ name: "create_crm_record", title: "Create CRM record", description: "Create a client, lead, project, invoice, subscription, task or support ticket in Adeola CRM.", inputSchema: { type: "object", properties: { type: { type: "string", enum: ["client", "lead", "project", "invoice", "subscription", "task", "ticket"] }, name: { type: "string" }, status: { type: "string" }, value: { type: "number", description: "Value in pence" } }, required: ["type", "name"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const response = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); if (!response.ok) throw new Error("Record creation failed"); const data = await response.json() as {record:CRMRecord}; await load(); return { id: data.record.id, status: data.record.status }; } });
    void register({ name: "read_crm_summary", title: "Read CRM summary", description: "Return concise pipeline, project and revenue totals from Adeola CRM.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: async () => ({ clients: records.filter(r => r.type === "client").length, activeProjects: records.filter(r => r.type === "project" && r.status !== "complete").length, pipelineValuePence: records.filter(r => r.type === "lead").reduce((sum, r) => sum + r.value, 0), monthlyRecurringPence: records.filter(r => r.type === "subscription" && r.status === "active").reduce((sum, r) => sum + r.value, 0) }) });
    return () => lifecycle.abort();
  }, [records]);

  const clients = currentRecords.filter((record) => record.type === "client");
  const projects = currentRecords.filter((record) => record.type === "project").map(p=>{const linked=currentRecords.filter(t=>t.type==='task'&&t.payload.projectId===p.id);return linked.length?{...p,payload:{...p.payload,progress:Math.round(linked.filter(t=>t.status==='complete').length/linked.length*100)}}:p});
  const leads = currentRecords.filter((record) => record.type === "lead");
  const invoices = currentRecords.filter((record) => record.type === "invoice" || record.type === "proposal");
  const subscriptions = currentRecords.filter((record) => record.type === "subscription");
  const tickets = currentRecords.filter((record) => record.type === "ticket");
  const tasks = currentRecords.filter((record) => record.type === "task");
  const activities = records.filter((record) => record.type === "activity").slice(0, 5);
  const clientName = (id: string | null) => clients.find((client) => client.id === id)?.name ?? "Unassigned";

  const createRecord = async (record: Partial<CRMRecord>) => {
    const response = await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
    if (!response.ok) throw new Error(((await response.json()) as {error?:string}).error ?? "Could not save record");
    await load();
  };
  const updateRecord = async (id: string, changes: Partial<CRMRecord>) => {
    const response = await fetch("/api/crm", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...changes }) });
    if (!response.ok) throw new Error("Could not update record");
    await load();
  };

  const pageTitle = nav.find((item) => item.id === page)?.label ?? "Overview";
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => `${record.name} ${record.type} ${record.status} ${JSON.stringify(record.payload)}`.toLowerCase().includes(term));
  }, [records, search]);

  return (
    <SidebarProvider className="adeola-workspace">
      <Sidebar variant="inset" collapsible="offcanvas" className="border-r-0">
        <SidebarHeader className="px-5 pb-3 pt-6">
          <button onClick={() => setPage("overview")} className="flex items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#0d2340] text-base font-bold text-white shadow-sm">A</span>
            <span><strong className="block text-[17px] tracking-[-.02em]">Adeola CRM</strong><span className="block text-xs text-sidebar-foreground/55">Studio operations</span></span>
          </button>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>{nav.map((item) => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={page === item.id} onClick={() => {setSearch('');setPage(item.id)}} className="h-10 rounded-xl px-3 text-[14px]"><item.icon /><span>{item.label}</span>{item.id === "support" && tickets.filter(t => t.status === "open").length > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">{tickets.filter(t => t.status === "open").length}</span>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d2340] p-4 text-white">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#85d8c4]"><Sparkles className="size-4" />Focus</div>
            <p className="text-sm font-medium">{tasks.filter(task => task.status !== "complete").length} open tasks</p><p className="mt-1 text-xs leading-5 text-white/60">{money(leads.reduce((sum, lead) => sum + lead.value, 0))} in your sales pipeline.</p>
          </div>
          <div className="mt-3 flex items-center gap-3 px-1 py-2"><span className="grid size-9 place-items-center rounded-full bg-[#dff6ef] text-sm font-bold text-[#0d624f]">KE</span><span className="min-w-0"><strong className="block truncate text-sm">Kunle Eboda</strong><span className="block text-xs text-sidebar-foreground/50">Administrator</span></span><Settings2 className="ml-auto size-4 text-sidebar-foreground/45" /></div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#f5f7f8]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-7">
          <SidebarTrigger className="md:hidden" />
          <div className="relative min-w-0 flex-1 max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients, projects, invoices…" className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-[15px] shadow-none" /></div>
          <div className="ml-auto hidden items-center gap-2 sm:flex"><Button variant="outline" className="rounded-xl" onClick={() => setModal("client")}><Users /> New client</Button><Button className="rounded-xl bg-[#0d2340] text-white hover:bg-[#15375d]" onClick={() => setQuoteOpen(true)}><Plus /> New estimate</Button></div>
          <Button size="icon" className="rounded-xl bg-[#0d2340] sm:hidden" onClick={() => setQuoteOpen(true)}><Plus /></Button>
        </header>

        <main className="mx-auto w-full max-w-[1560px] px-4 pb-14 pt-6 md:px-7 md:pt-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-[#0d8069]">{new Date().toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long"})}</p><h1 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-[-.045em] text-[#10243e]">{pageTitle}</h1></div><div className="flex gap-2 sm:hidden"><Button variant="outline" onClick={() => setModal("client")}>Client</Button><Button onClick={() => setQuoteOpen(true)}>Estimate</Button></div></div>
          {loadError ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">{loadError}<Button className="ml-4" onClick={() => void load()}>Retry</Button></div> : loading ? <Loading /> : <>
            {search.trim() ? <RecordsView records={records} onOpen={setEditing} query={search}/> : <>
            {page === "overview" && <StudioOverview records={currentRecords} onOpen={setEditing} onNavigate={p=>setPage(p as Page)}/>}
            {page === "journey" && <Journey onRefresh={load}/>}
            {page === "workflows" && <Workflows records={currentRecords} createRecord={createRecord} updateRecord={updateRecord} reload={load}/>}
            {page === "library" && <ResourceLibrary records={currentRecords} createRecord={createRecord} updateRecord={updateRecord} reload={load}/>}
            {page === "records" && <RecordsView records={records} onOpen={setEditing}/>}
            {page === "operations" && <Operations records={currentRecords} createRecord={createRecord} updateRecord={updateRecord}/>}
            {page === "pipeline" && <Pipeline leads={leads} createRecord={createRecord} updateRecord={updateRecord} />}
            {page === "clients" && <Clients records={filteredRecords.filter(r => r.type === "client" && r.status!=="archived")} onAdd={() => setModal("client")} />}
            {page === "projects" && <Projects projects={projects} clientName={clientName} onAdd={() => setModal("project")} updateRecord={updateRecord} />}
            {page === "services" && <Services onSelect={() => setQuoteOpen(true)} />}
            {page === "billing" && <Billing invoices={invoices} clientName={clientName} onNew={() => setModal("invoice")} onOpen={setSelectedInvoice} />}
            {page === "subscriptions" && <Subscriptions records={subscriptions} clientName={clientName} clients={clients} createRecord={createRecord} />}
            {page === "support" && <Support tickets={tickets} clientName={clientName} onNew={() => setModal("ticket")} updateRecord={updateRecord} />}
            </>}
          </>}
        </main>
      </SidebarInset>
      <QuickCreate kind={modal} onClose={() => setModal(null)} clients={clients} createRecord={createRecord} />
      <QuoteBuilder open={quoteOpen} onOpenChange={setQuoteOpen} clients={clients} createRecord={createRecord} />
      <InvoiceSheet record={selectedInvoice} clientName={clientName} onClose={() => setSelectedInvoice(null)} />
      {editing&&<RecordEditor key={editing.id} record={editing} records={records} onClose={()=>setEditing(null)} updateRecord={updateRecord}/>}
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}

function Loading() { return <div className="grid gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[22px] border border-slate-200 bg-white" />)}</div>; }

function Metric({ label, value, note, icon: Icon, accent = "navy" }: { label: string; value: string; note: string; icon: typeof Users; accent?: string }) {
  const colours: Record<string, string> = { navy: "bg-[#e9eef5] text-[#173a63]", green: "bg-[#dff6ef] text-[#0d8069]", amber: "bg-[#fff0d8] text-[#9b5b00]", violet: "bg-[#eee9ff] text-[#6648c8]" };
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,36,62,.03)]"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-[28px] font-semibold tracking-[-.04em] text-[#10243e]">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${colours[accent]}`}><Icon className="size-5" /></span></div><p className="mt-3 text-xs font-medium text-slate-500">{note}</p></section>;
}

function Overview({ leads, projects, invoices, subscriptions, tasks, activities, clientName, onNavigate, onProject }: { leads: CRMRecord[]; projects: CRMRecord[]; invoices: CRMRecord[]; subscriptions: CRMRecord[]; tasks: CRMRecord[]; activities: CRMRecord[]; clientName: (id: string | null) => string; onNavigate: (page: Page) => void; onProject: () => void }) {
  const pipeline = leads.reduce((sum, record) => sum + record.value, 0);
  const outstanding = invoices.filter(r => r.type === "invoice" && r.status!=="void").reduce((sum, record) => sum + Math.max(0, record.value - asNumber(record.payload.paid)), 0);
  const mrr = subscriptions.filter(r => r.status === "active").reduce((sum, record) => sum + record.value, 0);
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Open pipeline" value={money(pipeline)} note={`${leads.length} live opportunities`} icon={Target} accent="violet" /><Metric label="Active projects" value={String(projects.length)} note="Across design, build and review" icon={FolderKanban} accent="navy" /><Metric label="Outstanding" value={money(outstanding)} note="Invoices awaiting full payment" icon={HandCoins} accent="amber" /><Metric label="Monthly recurring" value={money(mrr)} note={`${subscriptions.length} retained relationships`} icon={BarChart3} accent="green" /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold tracking-[-.02em] text-[#10243e]">Live projects</h2><p className="text-sm text-slate-500">What is moving through the studio</p></div><Button variant="ghost" onClick={() => onNavigate("projects")}>View all <ChevronRight /></Button></div><div className="space-y-3">{projects.map(project => <article key={project.id} className="group rounded-2xl border border-slate-200 p-4 transition hover:border-[#8dcbbb] hover:bg-[#fbfefd]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.11em] text-[#0d8069]">{clientName(project.clientId)}</p><h3 className="mt-1 font-semibold text-[#10243e]">{project.name}</h3></div><Status value={project.status} /></div><div className="mt-4 flex items-center gap-3"><Progress value={asNumber(project.payload.progress)} className="h-1.5 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-[#20a889]" /><span className="text-sm font-semibold text-slate-600">{asNumber(project.payload.progress)}%</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />Due {asString(project.payload.due)}</span><span>Next: {asString(project.payload.nextMilestone)}</span></div></article>)}</div><Button variant="outline" className="mt-4 w-full rounded-xl border-dashed" onClick={onProject}><Plus /> Add project</Button></section>
      <div className="space-y-6"><section className="rounded-[24px] bg-[#10243e] p-5 text-white md:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#85d8c4]">Today</p><h2 className="mt-1 text-lg font-semibold">Priority desk</h2></div><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Check className="size-5" /></span></div><div className="mt-5 space-y-2">{tasks.slice(0,3).map((task, index) => <div key={task.id} className="flex items-start gap-3 rounded-xl bg-white/[.07] p-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-white/25 text-[10px]">{index + 1}</span><div><p className="text-sm font-medium">{task.name}</p><p className="mt-0.5 text-xs text-white/55">{clientName(task.clientId)} · {asString(task.payload.priority)}</p></div></div>)}</div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold tracking-[-.02em] text-[#10243e]">Recent activity</h2><div className="mt-4 space-y-4">{activities.map(activity => <div key={activity.id} className="flex gap-3"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${activity.status === "success" ? "bg-[#20a889]" : "bg-[#7458d6]"}`} /><div><p className="text-sm font-medium text-slate-800">{activity.name}</p><p className="text-sm leading-5 text-slate-500">{asString(activity.payload.detail)}</p><p className="mt-1 text-xs text-slate-400">{asString(activity.payload.when)}</p></div></div>)}</div></section></div>
    </div>
  </div>;
}

function Pipeline({ leads, createRecord, updateRecord }: { leads: CRMRecord[]; createRecord: (record: Partial<CRMRecord>) => Promise<void>; updateRecord: (id: string, changes: Partial<CRMRecord>) => Promise<void> }) {
  const stages = ["discovery", "proposal", "negotiation", "won"];
  const [adding, setAdding] = useState(false);
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-3 text-sm text-slate-500"><span><strong className="text-[#10243e]">{money(leads.reduce((s,r)=>s+r.value,0))}</strong> total value</span><span>·</span><span><strong className="text-[#10243e]">{leads.length}</strong> opportunities</span></div><Button onClick={() => setAdding(true)} className="rounded-xl bg-[#0d2340]"><Plus /> Add opportunity</Button></div><div className="grid gap-4 xl:grid-cols-4">{stages.map(stage => <section key={stage} className="min-h-[440px] rounded-[22px] border border-slate-200 bg-slate-100/70 p-3"><div className="mb-3 flex items-center justify-between px-1"><h2 className="font-semibold capitalize text-[#10243e]">{stage}</h2><Badge variant="secondary">{leads.filter(l => l.status === stage).length}</Badge></div><div className="space-y-3">{leads.filter(l => l.status === stage).map(lead => <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(16,36,62,.04)]"><p className="font-semibold text-[#10243e]">{lead.name}</p><p className="mt-1 text-sm text-slate-500">{asString(lead.payload.contact)}</p><p className="mt-4 text-xl font-semibold tracking-[-.03em]">{money(lead.value)}</p><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{asNumber(lead.payload.probability)}% likely</span><span>{asString(lead.payload.due)}</span></div><Progress value={asNumber(lead.payload.probability)} className="mt-2 h-1 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-[#20a889]" /><Select value={lead.status} onValueChange={(value) => void updateRecord(lead.id, { status: value })}><SelectTrigger className="mt-4 h-8 w-full border-slate-200 text-xs"><SelectValue /></SelectTrigger><SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</SelectItem>)}</SelectContent></Select></article>)}</div></section>)}</div><LeadDialog open={adding} onOpenChange={setAdding} createRecord={createRecord} /></div>;
}

function Clients({ records, onAdd }: { records: CRMRecord[]; onAdd: () => void }) {
  return <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-semibold text-[#10243e]">Client directory</h2><p className="text-sm text-slate-500">Relationships, value and current health</p></div><Button onClick={onAdd} className="rounded-xl bg-[#0d2340]"><Plus /> Add client</Button></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Contact</TableHead><TableHead>Industry</TableHead><TableHead>Relationship value</TableHead><TableHead>Health</TableHead><TableHead>Last contact</TableHead></TableRow></TableHeader><TableBody>{records.map(client => <TableRow key={client.id} className="h-20"><TableCell><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e8f6f1] font-semibold text-[#0d8069]">{client.name.split(" ").map(p=>p[0]).slice(0,2).join("")}</span><div><p className="font-semibold text-[#10243e]">{client.name}</p><p className="text-xs text-slate-500">via {asString(client.payload.source)}</p></div></div></TableCell><TableCell><p className="font-medium">{asString(client.payload.contact)}</p><p className="text-xs text-slate-500">{asString(client.payload.email)}</p></TableCell><TableCell>{asString(client.payload.industry)}</TableCell><TableCell className="font-semibold">{money(client.value)}</TableCell><TableCell><Status value={asString(client.payload.health) || "On track"} /></TableCell><TableCell>{asString(client.payload.lastContact)}</TableCell></TableRow>)}</TableBody></Table></div>{records.length === 0 && <Empty title="No matching clients" text="Try a different search or add a new client." />}</section>;
}

function Projects({ projects, clientName, onAdd, updateRecord }: { projects: CRMRecord[]; clientName: (id: string | null) => string; onAdd: () => void; updateRecord: (id: string, changes: Partial<CRMRecord>) => Promise<void> }) {
  return <div className="space-y-5"><div className="flex justify-end"><Button onClick={onAdd} className="rounded-xl bg-[#0d2340]"><Plus /> New project</Button></div><div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{projects.map(project => <article key={project.id} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.11em] text-[#0d8069]">{clientName(project.clientId)}</p><h2 className="mt-1 text-lg font-semibold tracking-[-.02em] text-[#10243e]">{project.name}</h2></div><Status value={project.status} /></div><p className="mt-4 text-sm leading-6 text-slate-500">{asString(project.payload.portalUpdate)}</p><div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">Overall progress</span><strong>{asNumber(project.payload.progress)}%</strong></div><Progress value={asNumber(project.payload.progress)} className="bg-slate-100 [&_[data-slot=progress-indicator]]:bg-[#20a889]" /></div><dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm"><div><dt className="text-xs text-slate-500">Next milestone</dt><dd className="mt-1 font-medium text-slate-800">{asString(project.payload.nextMilestone)}</dd></div><div><dt className="text-xs text-slate-500">Due date</dt><dd className="mt-1 font-medium text-slate-800">{asString(project.payload.due)}</dd></div></dl><div className="mt-4 flex flex-wrap gap-1.5">{asList(project.payload.services).map(service => <Badge key={service} variant="secondary">{service}</Badge>)}</div><Select value={project.status} onValueChange={value => void updateRecord(project.id, { status: value })}><SelectTrigger className="mt-5 w-full"><SelectValue /></SelectTrigger><SelectContent>{["onboarding","strategy","design","development","review","launch","complete"].map(status => <SelectItem key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}</SelectItem>)}</SelectContent></Select></article>)}</div></div>;
}

function Services({ onSelect }: { onSelect: () => void }) {
  const [category, setCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(services.map(service => service.category)))];
  const shown = category === "All" ? services : services.filter(service => service.category === category);
  return <div className="space-y-5"><section className="rounded-[24px] bg-[#10243e] p-6 text-white md:flex md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-[#85d8c4]">Adeola rate card · 2026</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Price with confidence and consistency.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Suggested Adeola selling prices, not verified market averages or existing client agreements. Confirm scope before quoting. Prices exclude VAT unless selected.</p></div><Button onClick={onSelect} className="mt-5 rounded-xl bg-[#85d8c4] text-[#10243e] hover:bg-white md:mt-0"><Plus /> Build estimate</Button></section><Tabs value={category} onValueChange={setCategory}><TabsList className="h-auto flex-wrap justify-start rounded-xl bg-white p-1.5">{categories.map(item => <TabsTrigger key={item} value={item} className="rounded-lg px-4">{item}</TabsTrigger>)}</TabsList></Tabs><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map(service => <article key={service.id} className="flex min-h-52 flex-col rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#8dcbbb] hover:shadow-lg hover:shadow-[#0d8069]/5"><div className="flex items-start justify-between"><Badge variant="secondary">{service.category}</Badge>{service.recommended && <span className="text-xs font-semibold text-[#0d8069]">Popular</span>}</div><h3 className="mt-4 text-lg font-semibold text-[#10243e]">{service.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{service.description}</p><div className="mt-5 flex items-end justify-between"><div><span className="text-2xl font-semibold tracking-[-.04em] text-[#10243e]">{money(service.price)}</span><span className="ml-1 text-xs text-slate-400">/{service.unit}</span></div><Button size="sm" variant="outline" onClick={onSelect}>Add</Button></div></article>)}</div></div>;
}

function Billing({ invoices, clientName, onNew, onOpen }: { invoices: CRMRecord[]; clientName: (id: string | null) => string; onNew: () => void; onOpen: (record: CRMRecord) => void }) {
  const outstanding = invoices.filter(r => r.type === "invoice" && r.status!=="void").reduce((sum, r) => sum + Math.max(0, r.value - asNumber(r.payload.paid)), 0);
  const paid = invoices.filter(r=>r.type==="invoice"&&r.status!=="void").reduce((sum, r) => sum + asNumber(r.payload.paid), 0);
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Invoiced" value={money(invoices.filter(r=>r.type==="invoice"&&r.status!=="void").reduce((s,r)=>s+r.value,0))} note={`${invoices.length} documents`} icon={ReceiptText} /><Metric label="Collected" value={money(paid)} note="Recorded payments" icon={HandCoins} accent="green" /><Metric label="Outstanding" value={money(outstanding)} note="Follow-up required" icon={Clock3} accent="amber" /></div><section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-semibold text-[#10243e]">Commercial documents</h2><p className="text-sm text-slate-500">Proposals and invoices in one place</p></div><Button onClick={onNew} className="rounded-xl bg-[#0d2340]"><Plus /> New invoice</Button></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Client</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{invoices.map(invoice => <TableRow key={invoice.id} className="h-16"><TableCell className="font-semibold text-[#10243e]">{invoice.name}</TableCell><TableCell>{clientName(invoice.clientId)}</TableCell><TableCell>{asString(invoice.payload.issueDate)}</TableCell><TableCell>{asString(invoice.payload.dueDate)}</TableCell><TableCell className="font-semibold">{money(invoice.value)}</TableCell><TableCell><Status value={invoice.status} /></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => onOpen(invoice)}>Open <ChevronRight /></Button></TableCell></TableRow>)}</TableBody></Table></div></section></div>;
}

function Subscriptions({ records, clientName, clients, createRecord }: { records: CRMRecord[]; clientName: (id: string | null) => string; clients: CRMRecord[]; createRecord: (record: Partial<CRMRecord>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Monthly recurring" value={money(records.filter(r=>r.status==="active").reduce((s,r)=>s+r.value,0))} note="Predictable retained revenue" icon={BarChart3} accent="green" /><Metric label="Active plans" value={String(records.filter(r=>r.status==="active").length)} note="Across care and growth" icon={CreditCard} /><Metric label="Annualised value" value={money(records.filter(r=>r.status==="active").reduce((s,r)=>s+r.value*12,0))} note="Current run rate" icon={Sparkles} accent="violet" /></div><section className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#10243e]">Retainer relationships</h2><p className="text-sm text-slate-500">Care, SEO and ongoing growth agreements</p></div><Button className="rounded-xl bg-[#0d2340]" onClick={() => setOpen(true)}><Plus /> Add subscription</Button></div><div className="grid gap-4 lg:grid-cols-2">{records.map(record => <article key={record.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.11em] text-[#0d8069]">{clientName(record.clientId)}</p><h3 className="mt-1 text-lg font-semibold text-[#10243e]">{record.name}</h3></div><Status value={record.status} /></div><p className="mt-4 text-2xl font-semibold tracking-[-.04em]">{money(record.value)}<span className="text-sm font-normal text-slate-400"> / month</span></p><div className="mt-4 flex flex-wrap gap-2">{asList(record.payload.included).map(item => <Badge variant="secondary" key={item}><Check />{item}</Badge>)}</div><p className="mt-4 text-sm text-slate-500">Next billing: {asString(record.payload.nextBilling)}</p></article>)}</div></section><SubscriptionDialog open={open} onOpenChange={setOpen} clients={clients} createRecord={createRecord} /></div>;
}

function Support({ tickets, clientName, onNew, updateRecord }: { tickets: CRMRecord[]; clientName: (id: string | null) => string; onNew: () => void; updateRecord: (id: string, changes: Partial<CRMRecord>) => Promise<void> }) {
  return <div className="grid gap-6 xl:grid-cols-[1fr_340px]"><section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-semibold text-[#10243e]">Support queue</h2><p className="text-sm text-slate-500">Requests from active client relationships</p></div><Button onClick={onNew} className="rounded-xl bg-[#0d2340]"><Plus /> New ticket</Button></div><div className="divide-y divide-slate-100">{tickets.map(ticket => <article key={ticket.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-[#10243e]">{ticket.name}</h3><Status value={ticket.status} /></div><p className="mt-2 text-sm text-slate-500">{asString(ticket.payload.summary)}</p><p className="mt-3 text-xs text-slate-400">{clientName(ticket.clientId)} · {asString(ticket.payload.channel)} · {asString(ticket.payload.created)}</p></div>{ticket.status !== "resolved" && <Button variant="outline" size="sm" onClick={() => void updateRecord(ticket.id, { status: "resolved" })}><Check /> Resolve</Button>}</div></article>)}</div>{tickets.length === 0 && <Empty title="Inbox clear" text="New client requests will appear here." />}</section><aside className="rounded-[24px] bg-[#10243e] p-6 text-white"><CircleHelp className="size-8 text-[#85d8c4]" /><h2 className="mt-5 text-xl font-semibold">Support standards</h2><div className="mt-5 space-y-4 text-sm text-white/70"><p><strong className="block text-white">Critical</strong>Site down, checkout or security issue · respond within 2 hours.</p><p><strong className="block text-white">Normal</strong>Content, styling or admin request · respond within 1 working day.</p><p><strong className="block text-white">Enhancement</strong>New scope requiring an estimate · respond within 2 working days.</p></div></aside></div>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="grid place-items-center px-6 py-16 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-slate-100"><BriefcaseBusiness className="size-5 text-slate-400" /></span><h3 className="mt-4 font-semibold text-[#10243e]">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>; }

function QuickCreate({ kind, onClose, clients, createRecord }: { kind: "client" | "project" | "invoice" | "ticket" | null; onClose: () => void; clients: CRMRecord[]; createRecord: (record: Partial<CRMRecord>) => Promise<void> }) {
  const [form, setForm] = useState<Record<string,string>>({});
  useEffect(() => setForm({}), [kind]);
  if (!kind) return null;
  const submit = async () => {
    if (!form.name?.trim()) return toast.error("Please add a name");
    try {
      if (kind === "client") await createRecord({ type: "client", name: form.name, status: "active", value: 0, payload: { contact: form.contact, email: form.email, phone: form.phone, industry: form.industry, source: form.source || "Direct", health: "On track", lastContact: "Today" } });
      if (kind === "project") await createRecord({ type: "project", name: form.name, clientId: form.clientId, status: "onboarding", value: Math.round(Number(form.value || 0) * 100), payload: { progress: 0, owner: "Kunle", due: form.due, nextMilestone: "Onboarding complete", services: [], portalUpdate: "Your project is now in onboarding." } });
      if (kind === "invoice") await createRecord({ type: "invoice", name: `INV-${crypto.randomUUID().slice(0,8).toUpperCase()}`, clientId: form.clientId, status: "draft", value: Math.round(Number(form.value || 0) * 100), payload: { issueDate: new Date().toISOString().slice(0,10), dueDate: form.due, paid: 0, description: form.name, lineItems: [{ description: form.name, quantity: 1, rate: Math.round(Number(form.value || 0) * 100) }] } });
      if (kind === "ticket") await createRecord({ type: "ticket", name: form.name, clientId: form.clientId, status: "open", value: 0, payload: { priority: form.priority || "Normal", created: new Date().toISOString().slice(0,10), channel: "Internal", summary: form.summary } });
      toast.success(`${kind[0].toUpperCase()+kind.slice(1)} created`); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save"); }
  };
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>New {kind}</DialogTitle><DialogDescription>Add the essential details. These records are private to this workspace.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><Field label={kind === "client" ? "Company name" : kind === "invoice" ? "Invoice description" : kind === "ticket" ? "Request title" : "Project name"} value={form.name} onChange={value => setForm({...form,name:value})} />{kind !== "client" && <SelectField label="Client" value={form.clientId} onChange={value => setForm({...form,clientId:value})} options={clients.map(c=>({value:c.id,label:c.name}))} />}{kind === "client" && <><Field label="Main contact" value={form.contact} onChange={value => setForm({...form,contact:value})} /><Field label="Email" type="email" value={form.email} onChange={value => setForm({...form,email:value})} /><Field label="Phone" value={form.phone} onChange={value => setForm({...form,phone:value})} /><Field label="Industry" value={form.industry} onChange={value => setForm({...form,industry:value})} /></>}{(kind === "project" || kind === "invoice") && <><Field label="Value (£)" type="number" value={form.value} onChange={value => setForm({...form,value:value})} /><Field label={kind === "project" ? "Target completion" : "Payment due"} type="date" value={form.due} onChange={value => setForm({...form,due:value})} /></>}{kind === "ticket" && <><SelectField label="Priority" value={form.priority} onChange={value => setForm({...form,priority:value})} options={["Normal","Critical","Enhancement"].map(v=>({value:v,label:v}))} /><label className="grid gap-1.5 text-sm font-medium">Details<Textarea value={form.summary || ""} onChange={event=>setForm({...form,summary:event.target.value})} /></label></>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => void submit()} className="bg-[#0d2340]">Create {kind}</Button></DialogFooter></DialogContent></Dialog>;
}

function LeadDialog({ open, onOpenChange, createRecord }: { open: boolean; onOpenChange: (open:boolean)=>void; createRecord: (record: Partial<CRMRecord>)=>Promise<void> }) {
  const [form,setForm]=useState({name:"",value:"",contact:""});
  const submit=async()=>{if(!form.name)return toast.error("Add an opportunity name"); await createRecord({type:"lead",name:form.name,status:"discovery",value:Math.round(Number(form.value||0)*100),payload:{contact:form.contact,probability:25,next:"Discovery call",due:"This week",source:"Direct"}}); toast.success("Opportunity added"); setForm({name:"",value:"",contact:""}); onOpenChange(false);};
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>New opportunity</DialogTitle><DialogDescription>Add a potential project to the sales pipeline.</DialogDescription></DialogHeader><div className="grid gap-4"><Field label="Company or opportunity" value={form.name} onChange={name=>setForm({...form,name})}/><Field label="Contact" value={form.contact} onChange={contact=>setForm({...form,contact})}/><Field label="Estimated value (£)" type="number" value={form.value} onChange={value=>setForm({...form,value})}/></div><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button className="bg-[#0d2340]" onClick={()=>void submit()}>Add to pipeline</Button></DialogFooter></DialogContent></Dialog>;
}

function SubscriptionDialog({ open,onOpenChange,clients,createRecord }:{open:boolean;onOpenChange:(open:boolean)=>void;clients:CRMRecord[];createRecord:(record:Partial<CRMRecord>)=>Promise<void>}){
  const [clientId,setClientId]=useState(""); const [plan,setPlan]=useState("Website Care");
  const plans:Record<string,number>={"Website Care":16600,"Commerce Care":32500,"Growth Partner":65000,"SEO Growth":85000};
  const submit=async()=>{if(!clientId)return toast.error("Select a client");await createRecord({type:"subscription",name:plan,clientId,status:"active",value:plans[plan],payload:{cadence:"monthly",nextBilling:"Next month",included:["Priority support","Monthly reporting","Ongoing optimisation"]}});toast.success("Subscription added");onOpenChange(false)};
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add subscription</DialogTitle><DialogDescription>Track an agreed plan internally. This does not charge clients or schedule payments.</DialogDescription></DialogHeader><SelectField label="Client" value={clientId} onChange={setClientId} options={clients.map(c=>({value:c.id,label:c.name}))}/><SelectField label="Plan" value={plan} onChange={setPlan} options={Object.keys(plans).map(value=>({value,label:`${value} · ${money(plans[value])}/month`}))}/><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button className="bg-[#0d2340]" onClick={()=>void submit()}>Save subscription record</Button></DialogFooter></DialogContent></Dialog>;
}

function QuoteBuilder({ open, onOpenChange, clients, createRecord }: { open: boolean; onOpenChange: (open:boolean)=>void; clients: CRMRecord[]; createRecord: (record:Partial<CRMRecord>)=>Promise<void> }) {
  const [selected,setSelected]=useState<string[]>([]); const [clientId,setClientId]=useState(""); const [discount,setDiscount]=useState("0"); const [vat,setVat]=useState(false); const [filter,setFilter]=useState("All");
  const items=services.filter(service=>selected.includes(service.id)); const subtotal=items.reduce((s,i)=>s+i.price,0); const discountValue=Math.round(subtotal*Math.min(100,Math.max(0,Number(discount)||0))/100); const net=subtotal-discountValue; const total=net+(vat?Math.round(net*.2):0);
  const save=async()=>{if(!clientId)return toast.error("Select a client");if(!items.length)return toast.error("Select at least one service");await createRecord({type:"proposal",name:`EST-${crypto.randomUUID().slice(0,8).toUpperCase()}`,clientId,status:"draft",value:total,payload:{issueDate:new Date().toISOString().slice(0,10),dueDate:"Valid for 14 days",paid:0,description:"Selected Adeola services",discount:Math.min(100,Math.max(0,Number(discount)||0)),vat,lineItems:items.map(item=>({description:item.name,quantity:1,rate:item.price}))}});toast.success("Estimate saved to billing");setSelected([]);onOpenChange(false)};
  const categories=["All",...Array.from(new Set(services.map(s=>s.category)))];
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[760px]"><SheetHeader className="border-b border-slate-200 p-6"><SheetTitle className="text-2xl tracking-[-.03em] text-[#10243e]">Build an estimate</SheetTitle><SheetDescription>Select services, set terms and save a consistent commercial proposal.</SheetDescription></SheetHeader><div className="grid gap-6 p-6"><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Client" value={clientId} onChange={setClientId} options={clients.map(c=>({value:c.id,label:c.name}))}/><SelectField label="Service group" value={filter} onChange={setFilter} options={categories.map(value=>({value,label:value}))}/></div><div className="grid gap-2">{services.filter(s=>filter==="All"||s.category===filter).map(service=><button key={service.id} onClick={()=>setSelected(current=>current.includes(service.id)?current.filter(id=>id!==service.id):[...current,service.id])} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected.includes(service.id)?"border-[#20a889] bg-[#effaf7]":"border-slate-200 hover:border-slate-300"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${selected.includes(service.id)?"border-[#20a889] bg-[#20a889] text-white":"border-slate-300"}`}>{selected.includes(service.id)&&<Check className="size-4"/>}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#10243e]">{service.name}</strong><span className="text-xs text-slate-500">{service.category}</span></span><strong className="text-sm">{money(service.price)}</strong></button>)}</div><section className="rounded-2xl bg-[#10243e] p-5 text-white"><div className="grid gap-4 sm:grid-cols-2"><Field label="Discount (%)" type="number" value={discount} onChange={setDiscount} dark/><label className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm"><span>Apply VAT (20%)</span><input type="checkbox" checked={vat} onChange={event=>setVat(event.target.checked)} className="size-5 accent-[#85d8c4]" /></label></div><div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm"><div className="flex justify-between text-white/65"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discountValue>0&&<div className="flex justify-between text-[#85d8c4]"><span>Discount</span><span>−{money(discountValue)}</span></div>}<div className="flex justify-between text-xl font-semibold"><span>Total{vat?" incl. VAT":""}</span><span>{money(total)}</span></div></div></section><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button className="bg-[#0d2340]" onClick={()=>void save()}><FileSignature /> Save estimate</Button></div></div></SheetContent></Sheet>;
}

function InvoiceSheet({ record, clientName, onClose }: { record: CRMRecord | null; clientName: (id:string|null)=>string; onClose:()=>void }) {
  if(!record)return null; const items=Array.isArray(record.payload.lineItems)?record.payload.lineItems as Array<{description:string;quantity:number;rate:number}>:[];
  return <Sheet open onOpenChange={open=>!open&&onClose()}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[680px]"><SheetHeader className="sr-only"><SheetTitle>{record.name}</SheetTitle><SheetDescription>Invoice document</SheetDescription></SheetHeader><div id="invoice-print" className="min-h-full bg-white p-8 md:p-12"><div className="flex items-start justify-between"><div><span className="grid size-12 place-items-center rounded-2xl bg-[#10243e] text-xl font-bold text-white">A</span><p className="mt-3 font-semibold text-[#10243e]">AdeOla Media Solutions</p><p className="text-sm text-slate-500">Brand · Web · Growth</p></div><div className="text-right"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#0d8069]">{record.type === "proposal" ? "Estimate" : "Invoice"}</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em] text-[#10243e]">{record.name}</h2><Status value={record.status}/></div></div><div className="mt-12 grid grid-cols-2 gap-8 border-y border-slate-200 py-6"><div><p className="text-xs font-semibold uppercase tracking-[.1em] text-slate-400">Bill to</p><p className="mt-2 font-semibold text-[#10243e]">{clientName(record.clientId)}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-400">Issue date</p><p className="mt-1 font-medium">{asString(record.payload.issueDate)}</p></div><div><p className="text-slate-400">Due date</p><p className="mt-1 font-medium">{asString(record.payload.dueDate)}</p></div></div></div><Table className="mt-8"><TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{items.map((item,index)=><TableRow key={index}><TableCell className="py-5 font-medium">{item.description}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">{money(item.rate)}</TableCell><TableCell className="text-right font-semibold">{money(item.quantity*item.rate)}</TableCell></TableRow>)}</TableBody></Table><div className="ml-auto mt-8 max-w-xs space-y-3"><div className="flex justify-between text-slate-500"><span>Paid</span><span>{money(asNumber(record.payload.paid))}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-semibold text-[#10243e]"><span>Balance due</span><span>{money(record.value-asNumber(record.payload.paid))}</span></div></div><div className="mt-14 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500"><strong className="block text-[#10243e]">Payment details</strong>Payment instructions have not been configured. Add them before sending this document to a client.</div><div className="mt-8 flex justify-end gap-2 print:hidden"><Button variant="outline" onClick={onClose}>Close</Button><Button className="bg-[#0d2340]" onClick={()=>window.print()}><ReceiptText/>Print / Save PDF</Button></div></div></SheetContent></Sheet>;
}

function Field({ label,value,onChange,type="text",dark=false }:{label:string;value?:string;onChange:(value:string)=>void;type?:string;dark?:boolean}){return <label className={`grid gap-1.5 text-sm font-medium ${dark?"text-white":"text-slate-700"}`}>{label}<Input type={type} value={value||""} onChange={event=>onChange(event.target.value)} className={dark?"border-white/15 bg-white/10 text-white":""}/></label>}
function SelectField({label,value,onChange,options}:{label:string;value?:string;onChange:(value:string)=>void;options:{value:string;label:string}[]}){return <label className="grid gap-1.5 text-sm font-medium text-slate-700">{label}<Select value={value||undefined} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue placeholder={`Select ${label.toLowerCase()}`}/></SelectTrigger><SelectContent>{options.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></label>}
