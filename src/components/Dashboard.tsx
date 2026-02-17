import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ACTIVE_LEAD_STAGES,
  CLOSED_LEAD_STAGES,
  LEAD_STAGE_ORDER,
} from '@/domain/lead/workflow';
import {
  type Customer,
  type EstimateStatus,
  type Lead,
  type LeadStage,
  type NewCustomerInput,
  type NewLeadInput,
} from '@/types/paintingEstimator';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers } from '@/hooks/useCustomers';
import { useEstimates } from '@/hooks/useEstimates';
import { useLeads } from '@/hooks/useLeads';
import CustomerModal from '@/components/modals/CustomerModal';
import LeadModal from '@/components/modals/LeadModal';
import { dashboardUi } from '@/components/dashboard/styleReference';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);

const formatDate = (date: Date | undefined) =>
  date ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

const formatPercent = (value: number) => `${Math.round(value)}%`;

const estimateStatusColor: Record<EstimateStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Sent: 'bg-cyan-100 text-cyan-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Archived: 'bg-amber-100 text-amber-700',
};

const leadStageColor: Record<LeadStage, string> = {
  Intake: 'bg-slate-100 text-slate-700',
  Qualified: 'bg-blue-100 text-blue-700',
  Nurturing: 'bg-violet-100 text-violet-700',
  OfferDraft: 'bg-amber-100 text-amber-700',
  OfferSent: 'bg-orange-100 text-orange-700',
  Negotiation: 'bg-rose-100 text-rose-700',
  Won: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-zinc-200 text-zinc-700',
};

const leadStageLabel: Record<LeadStage, string> = {
  Intake: 'Intake',
  Qualified: 'Qualified',
  Nurturing: 'Nurturing',
  OfferDraft: 'Offer Draft',
  OfferSent: 'Offer Sent',
  Negotiation: 'Negotiation',
  Won: 'Won',
  Lost: 'Lost',
};

type DashboardSection = 'overview' | 'leads' | 'estimates' | 'customers' | 'operations';

const dashboardSections: Array<{ id: DashboardSection; label: string; hint: string }> = [
  { id: 'overview', label: 'Overview', hint: 'Cross-team snapshot' },
  { id: 'leads', label: 'Leads', hint: 'Intake and pipeline' },
  { id: 'estimates', label: 'Estimates', hint: 'Pricing and approvals' },
  { id: 'customers', label: 'Customers', hint: 'Relationship base' },
  { id: 'operations', label: 'Operations', hint: 'Painter workload' },
];

const painterCapacities = [
  { name: 'Crew North', capacity: 8 },
  { name: 'Crew Central', capacity: 10 },
  { name: 'Crew South', capacity: 7 },
  { name: 'Subcontract Pool', capacity: 12 },
  { name: 'Unassigned', capacity: 0 },
] as const;

interface PainterLoadRow {
  name: string;
  capacity: number;
  activeLeads: number;
  offerWork: number;
  weightedValue: number;
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  accent: 'cyan' | 'emerald' | 'amber' | 'slate' | 'rose';
}

interface DashboardProps {
  onSignOut: () => Promise<void> | void;
  userEmail?: string | null;
}

const metricAccentClasses: Record<MetricCardProps['accent'], string> = {
  cyan: 'from-cyan-500/20 to-cyan-500/0 border-cyan-300/60',
  emerald: 'from-emerald-500/20 to-emerald-500/0 border-emerald-300/60',
  amber: 'from-amber-500/20 to-amber-500/0 border-amber-300/60',
  slate: 'from-slate-400/20 to-slate-400/0 border-slate-300/60',
  rose: 'from-rose-500/20 to-rose-500/0 border-rose-300/60',
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, accent }) => (
  <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${metricAccentClasses[accent]}`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-600">{subtext}</p>
  </article>
);

const EstimateStatusBadge: React.FC<{ status: EstimateStatus }> = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${estimateStatusColor[status]}`}>
    {status}
  </span>
);

const LeadStageBadge: React.FC<{ stage: LeadStage }> = ({ stage }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${leadStageColor[stage]}`}>
    {leadStageLabel[stage]}
  </span>
);

const Dashboard: React.FC<DashboardProps> = ({ onSignOut, userEmail }) => {
  const { user } = useAuth();
  const router = useRouter();

  const {
    estimates,
    isLoading: isLoadingEstimates,
    error: errorEstimates,
    hasAttemptedFetch: hasAttemptedEstimateFetch,
    createEstimate,
    deleteEstimate,
    duplicateEstimate,
  } = useEstimates(user?.uid);

  const {
    customers,
    isLoading: isLoadingCustomers,
    error: errorCustomers,
    hasAttemptedFetch: hasAttemptedCustomerFetch,
    addCustomer,
  } = useCustomers(user?.uid);

  const {
    leads,
    isLoading: isLoadingLeads,
    error: errorLeads,
    hasAttemptedFetch: hasAttemptedLeadFetch,
    createLead,
    updateLeadStage,
    markLeadConverted,
  } = useLeads(user?.uid);

  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [estimateSearchTerm, setEstimateSearchTerm] = useState('');
  const [estimateStatusFilter, setEstimateStatusFilter] = useState<EstimateStatus | ''>('');
  const [estimateViewMode, setEstimateViewMode] = useState<'grid' | 'table'>('grid');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<LeadStage | ''>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isConvertingLeadId, setIsConvertingLeadId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredEstimates = useMemo(() => {
    return estimates.filter((estimate) => {
      const normalizedSearch = estimateSearchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        estimate.customerName.toLowerCase().includes(normalizedSearch) ||
        estimate.projectAddress.toLowerCase().includes(normalizedSearch) ||
        estimate.estimateNumber.toLowerCase().includes(normalizedSearch);

      const matchesStatus = estimateStatusFilter === '' || estimate.status === estimateStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, estimateSearchTerm, estimateStatusFilter]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const normalizedSearch = leadSearchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        lead.name.toLowerCase().includes(normalizedSearch) ||
        lead.email.toLowerCase().includes(normalizedSearch) ||
        lead.phone.toLowerCase().includes(normalizedSearch) ||
        lead.projectAddress.toLowerCase().includes(normalizedSearch) ||
        lead.scopeSummary.toLowerCase().includes(normalizedSearch);

      const matchesStage = leadStageFilter === '' || lead.stage === leadStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [leads, leadSearchTerm, leadStageFilter]);

  const leadsByStage = useMemo(() => {
    const byStage = Object.fromEntries(LEAD_STAGE_ORDER.map((stage) => [stage, [] as Lead[]])) as Record<
      LeadStage,
      Lead[]
    >;

    leads.forEach((lead) => {
      byStage[lead.stage].push(lead);
    });

    return byStage;
  }, [leads]);

  const openLeads = useMemo(() => leads.filter((lead) => ACTIVE_LEAD_STAGES.includes(lead.stage)), [leads]);
  const wonLeads = useMemo(() => leads.filter((lead) => lead.stage === 'Won'), [leads]);
  const lostLeads = useMemo(() => leads.filter((lead) => lead.stage === 'Lost'), [leads]);

  const leadConversionRate = useMemo(() => {
    const closedLeads = leads.filter((lead) => CLOSED_LEAD_STAGES.includes(lead.stage));
    if (closedLeads.length === 0) {
      return 0;
    }
    return (wonLeads.length / closedLeads.length) * 100;
  }, [leads, wonLeads.length]);

  const grossPipelineValue = useMemo(() => openLeads.reduce((sum, lead) => sum + lead.expectedValue, 0), [openLeads]);

  const weightedPipelineValue = useMemo(
    () => openLeads.reduce((sum, lead) => sum + lead.expectedValue * (lead.confidence / 100), 0),
    [openLeads]
  );

  const totalEstimateValue = useMemo(() => estimates.reduce((sum, estimate) => sum + (estimate.total || 0), 0), [estimates]);

  const sentEstimateCount = useMemo(
    () => estimates.filter((estimate) => estimate.status === 'Sent').length,
    [estimates]
  );

  const approvedEstimateValue = useMemo(
    () =>
      estimates
        .filter((estimate) => estimate.status === 'Approved')
        .reduce((sum, estimate) => sum + (estimate.total || 0), 0),
    [estimates]
  );

  const followUpsDue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return openLeads.filter((lead) => {
      if (!lead.nextActionDate) {
        return false;
      }

      const dueDate = new Date(lead.nextActionDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });
  }, [openLeads]);

  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);
  }, [customers]);

  const customerEstimateSummary = useMemo(() => {
    const summary = new Map<string, { count: number; value: number; lastTouched?: Date }>();

    estimates.forEach((estimate) => {
      const current = summary.get(estimate.customerId) ?? { count: 0, value: 0, lastTouched: undefined };
      current.count += 1;
      current.value += estimate.total || 0;
      if (!current.lastTouched || estimate.lastModified > current.lastTouched) {
        current.lastTouched = estimate.lastModified;
      }
      summary.set(estimate.customerId, current);
    });

    return summary;
  }, [estimates]);

  const painterLoad = useMemo(() => {
    const loadMap = new Map<string, PainterLoadRow>(
      painterCapacities.map((row) => [
        row.name,
        {
          name: row.name,
          capacity: row.capacity,
          activeLeads: 0,
          offerWork: 0,
          weightedValue: 0,
        },
      ])
    );

    openLeads.forEach((lead) => {
      const painterName = lead.assignedPainter?.trim() || 'Unassigned';
      if (!loadMap.has(painterName)) {
        loadMap.set(painterName, {
          name: painterName,
          capacity: 0,
          activeLeads: 0,
          offerWork: 0,
          weightedValue: 0,
        });
      }

      const row = loadMap.get(painterName);
      if (!row) {
        return;
      }

      row.activeLeads += 1;
      if (lead.stage === 'OfferDraft' || lead.stage === 'OfferSent' || lead.stage === 'Negotiation') {
        row.offerWork += 1;
      }
      row.weightedValue += lead.expectedValue * (lead.confidence / 100);
    });

    return [...loadMap.values()].sort((a, b) => b.weightedValue - a.weightedValue);
  }, [openLeads]);

  const handleCustomerSelected = async (customerData: Customer | NewCustomerInput) => {
    setIsCustomerModalOpen(false);
    if (!user) {
      return;
    }

    let customerId: string | null = null;
    let customerName = '';

    if ('id' in customerData) {
      customerId = customerData.id;
      customerName = customerData.name;
    } else {
      customerName = customerData.name;
      customerId = await addCustomer(customerData);
    }

    if (!customerId) {
      window.alert('Unable to create/select customer.');
      return;
    }

    const estimateId = await createEstimate(customerId, customerName, '');
    if (!estimateId) {
      window.alert('Unable to create estimate.');
      return;
    }

    router.push(`/estimate/${estimateId}`);
  };

  const handleCreateLead = async (input: NewLeadInput) => {
    const leadId = await createLead(input);
    if (!leadId) {
      throw new Error('Unable to create lead.');
    }

    setActiveSection('leads');
  };

  const handleLeadStageChange = async (leadId: string, nextStage: LeadStage) => {
    const updated = await updateLeadStage(leadId, nextStage);
    if (!updated) {
      window.alert('Lead stage update failed.');
    }
  };

  const handleConvertLeadToCustomer = async (leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) {
      return;
    }

    setIsConvertingLeadId(leadId);

    try {
      const normalizedEmail = lead.email.trim().toLowerCase();
      const normalizedPhone = lead.phone.replace(/\s+/g, '');

      const existingCustomer = customers.find(
        (customer) =>
          customer.email.trim().toLowerCase() === normalizedEmail ||
          customer.phone.replace(/\s+/g, '') === normalizedPhone
      );

      let customerId = existingCustomer?.id ?? null;

      if (!customerId) {
        customerId = await addCustomer({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
        });
      }

      if (!customerId) {
        window.alert('Failed to create customer for this lead.');
        return;
      }

      const converted = await markLeadConverted(leadId, customerId);
      if (!converted) {
        window.alert('Lead conversion failed.');
      }
    } finally {
      setIsConvertingLeadId(null);
    }
  };

  const handleCreateEstimateFromLead = async (lead: Lead) => {
    if (!lead.customerId) {
      window.alert('Convert this lead to a customer first.');
      return;
    }

    const estimateId = await createEstimate(lead.customerId, lead.name, lead.projectAddress);
    if (!estimateId) {
      window.alert('Unable to create estimate from lead.');
      return;
    }

    router.push(`/estimate/${estimateId}`);
  };

  const handleDuplicateEstimate = async (estimateId: string) => {
    const duplicatedEstimateId = await duplicateEstimate(estimateId);
    if (!duplicatedEstimateId) {
      window.alert('Duplicate failed.');
      return;
    }

    router.push(`/estimate/${duplicatedEstimateId}`);
  };

  const primaryButtonClass = `${dashboardUi.buttonBase} ${dashboardUi.buttonPrimary}`;
  const secondaryButtonClass = `${dashboardUi.buttonBase} ${dashboardUi.buttonSecondary}`;
  const dangerButtonClass = `${dashboardUi.buttonBase} ${dashboardUi.buttonDanger}`;

  const activeSectionMeta = dashboardSections.find((section) => section.id === activeSection);
  const activeSectionLabel = activeSectionMeta?.label ?? 'Dashboard';

  const handleOpenLeadModal = () => {
    setIsLeadModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleOpenEstimateModal = () => {
    setIsCustomerModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSelectSection = (sectionId: DashboardSection) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]" style={{ fontFamily: dashboardUi.fontFamily }}>
      <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
        <section className={dashboardUi.sidebarPanel}>
          <div className="space-y-2">
            <button onClick={handleOpenLeadModal} className={`${primaryButtonClass} w-full`}>
              New Lead
            </button>
            <button onClick={handleOpenEstimateModal} className={`${secondaryButtonClass} w-full`}>
              New Estimate
            </button>
          </div>
        </section>

        <nav className={dashboardUi.sidebarPanel}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboards</p>
          <div className="space-y-2">
            {dashboardSections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className={`${dashboardUi.sidebarItemBase} ${
                    isActive ? dashboardUi.sidebarItemActive : dashboardUi.sidebarItemInactive
                  }`}
                >
                  <p className="text-sm font-semibold">{section.label}</p>
                  <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{section.hint}</p>
                </button>
              );
            })}
          </div>
        </nav>

        <section className={dashboardUi.sidebarPanel}>
          <details className={dashboardUi.accountPanel}>
            <summary className={dashboardUi.accountSummary}>Account</summary>
            <div className="mt-3 space-y-3">
              <p className="truncate text-xs text-slate-500">{userEmail || 'Signed in user'}</p>
              <button onClick={() => void onSignOut()} className={`${dangerButtonClass} w-full`}>
                Sign Out
              </button>
            </div>
          </details>
        </section>
      </aside>

      <main className="space-y-6">
        <section className={dashboardUi.topBanner}>
          <div className="flex h-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`${secondaryButtonClass} inline-flex h-8 items-center px-3 text-xs leading-none lg:hidden`}
                aria-label="Open dashboard menu"
              >
                <span className="inline-flex items-center gap-2 leading-none">
                  <span className="inline-flex flex-col gap-[2px]">
                    <span className="block h-[2px] w-3 bg-slate-700" />
                    <span className="block h-[2px] w-3 bg-slate-700" />
                    <span className="block h-[2px] w-3 bg-slate-700" />
                  </span>
                  Menu
                </span>
              </button>
              <p className="text-sm font-semibold text-slate-900">{activeSectionLabel}</p>
            </div>
            <p className="max-w-[50vw] truncate text-xs text-slate-600">{userEmail || 'Signed in user'}</p>
          </div>
        </section>

        {activeSection === 'overview' ? (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Open Leads"
                value={String(openLeads.length)}
                subtext={`${wonLeads.length} won / ${lostLeads.length} lost`}
                accent="cyan"
              />
              <MetricCard
                label="Weighted Pipeline"
                value={formatCurrency(weightedPipelineValue)}
                subtext={`Gross ${formatCurrency(grossPipelineValue)}`}
                accent="emerald"
              />
              <MetricCard
                label="Pending Estimate Approvals"
                value={String(sentEstimateCount)}
                subtext={`${filteredEstimates.length} estimates in active filters`}
                accent="amber"
              />
              <MetricCard
                label="Lead Win Rate"
                value={formatPercent(leadConversionRate)}
                subtext={`${leads.length} tracked opportunities`}
                accent="rose"
              />
              <MetricCard
                label="Customers"
                value={String(customers.length)}
                subtext={`${recentCustomers.length} recently onboarded`}
                accent="slate"
              />
              <MetricCard
                label="Estimate Portfolio"
                value={formatCurrency(totalEstimateValue)}
                subtext={`${estimates.length} total estimates`}
                accent="cyan"
              />
              <MetricCard
                label="Approved Value"
                value={formatCurrency(approvedEstimateValue)}
                subtext="Ready for contract and invoicing"
                accent="emerald"
              />
              <MetricCard
                label="Follow-Ups Due"
                value={String(followUpsDue.length)}
                subtext="Leads requiring immediate touch"
                accent="amber"
              />
            </div>

            <div className={dashboardUi.panel}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Lead Stage Pipeline</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intake to close progression</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {LEAD_STAGE_ORDER.map((stage) => {
                  const stageLeads = leadsByStage[stage];
                  const stageValue = stageLeads.reduce((sum, lead) => sum + lead.expectedValue, 0);

                  return (
                    <article key={stage} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <LeadStageBadge stage={stage} />
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stageLeads.length}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(stageValue)}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className={dashboardUi.panel}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Upcoming Follow-Ups</h3>
                  <button onClick={() => setActiveSection('leads')} className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
                    Open Leads Dashboard
                  </button>
                </div>

                {followUpsDue.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No overdue follow-ups right now.</p>
                ) : (
                  <ul className="space-y-2">
                    {followUpsDue.slice(0, 6).map((lead) => (
                      <li key={lead.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                            <p className="text-xs text-slate-600">{lead.nextAction || 'No action note'}</p>
                          </div>
                          <div className="text-right">
                            <LeadStageBadge stage={lead.stage} />
                            <p className="mt-1 text-xs text-slate-600">Due {formatDate(lead.nextActionDate)}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={dashboardUi.panel}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Painter Workload Snapshot</h3>
                  <button
                    onClick={() => setActiveSection('operations')}
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                  >
                    Open Operations Dashboard
                  </button>
                </div>

                <div className="space-y-2">
                  {painterLoad.slice(0, 5).map((row) => {
                    const utilization = row.capacity > 0 ? Math.min(100, (row.activeLeads / row.capacity) * 100) : 0;

                    return (
                      <article key={row.name} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                          <p className="text-xs text-slate-600">{row.activeLeads} active leads</p>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${utilization}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                          <span>{row.offerWork} offer-stage leads</span>
                          <span>{formatCurrency(row.weightedValue)} weighted</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {activeSection === 'leads' ? (
          <section className="space-y-4">
            <div className={dashboardUi.panel}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={leadSearchTerm}
                    onChange={(event) => setLeadSearchTerm(event.target.value)}
                    placeholder="Search name, email, phone, address, or scope"
                    className={`${dashboardUi.input} w-full sm:flex-1`}
                  />
                  <select
                    value={leadStageFilter}
                    onChange={(event) => setLeadStageFilter(event.target.value as LeadStage | '')}
                    className={`${dashboardUi.input} sm:w-56`}
                  >
                    <option value="">All stages</option>
                    {LEAD_STAGE_ORDER.map((stage) => (
                      <option key={stage} value={stage}>
                        {leadStageLabel[stage]}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setIsLeadModalOpen(true)} className={primaryButtonClass}>
                  Add Lead
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              {LEAD_STAGE_ORDER.map((stage) => {
                const stageLeads = leadsByStage[stage];
                const weighted = stageLeads.reduce((sum, lead) => sum + lead.expectedValue * (lead.confidence / 100), 0);
                return (
                  <article key={stage} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <LeadStageBadge stage={stage} />
                    <p className="mt-2 text-xl font-bold text-slate-900">{stageLeads.length}</p>
                    <p className="text-xs text-slate-500">Weighted {formatCurrency(weighted)}</p>
                  </article>
                );
              })}
            </div>

            <div className={dashboardUi.panel}>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Lead Pipeline Workboard</h3>

              {isLoadingLeads ? (
                <p className="text-sm text-slate-600">Loading leads...</p>
              ) : errorLeads ? (
                <p className="text-sm text-red-600">Error loading leads: {errorLeads}</p>
              ) : hasAttemptedLeadFetch && filteredLeads.length === 0 ? (
                <p className="text-sm text-slate-600">No leads match the current filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Next Action</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Painter</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-sm">
                            <p className="font-semibold text-slate-900">{lead.name}</p>
                            <p className="text-xs text-slate-600">{lead.email}</p>
                            <p className="text-xs text-slate-500">{lead.projectAddress}</p>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <div className="mb-1">
                              <LeadStageBadge stage={lead.stage} />
                            </div>
                            <select
                              value={lead.stage}
                              onChange={(event) => handleLeadStageChange(lead.id, event.target.value as LeadStage)}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900"
                            >
                              {LEAD_STAGE_ORDER.map((stage) => (
                                <option key={stage} value={stage}>
                                  {leadStageLabel[stage]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-700">
                            <p>{formatCurrency(lead.expectedValue)}</p>
                            <p className="text-xs text-slate-500">Confidence {formatPercent(lead.confidence)}</p>
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-700">
                            <p>{lead.nextAction || 'Not set'}</p>
                            <p className="text-xs text-slate-500">{formatDate(lead.nextActionDate)}</p>
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-700">{lead.assignedPainter || 'Unassigned'}</td>
                          <td className="px-3 py-3 text-sm text-slate-700">
                            {lead.customerId ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Linked
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                Not linked
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              {lead.stage === 'Won' && !lead.customerId ? (
                                <button
                                  onClick={() => handleConvertLeadToCustomer(lead.id)}
                                  disabled={isConvertingLeadId === lead.id}
                                  className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isConvertingLeadId === lead.id ? 'Converting...' : 'Convert to Customer'}
                                </button>
                              ) : null}

                              {lead.customerId ? (
                                <button
                                  onClick={() => handleCreateEstimateFromLead(lead)}
                                  className="rounded-xl bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                                >
                                  Create Estimate
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === 'estimates' ? (
          <section className="space-y-4">
            <div className={dashboardUi.panel}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Search estimate number, customer, address"
                    value={estimateSearchTerm}
                    onChange={(event) => setEstimateSearchTerm(event.target.value)}
                    className={`${dashboardUi.input} w-full sm:flex-1`}
                  />
                  <select
                    value={estimateStatusFilter}
                    onChange={(event) => setEstimateStatusFilter(event.target.value as EstimateStatus | '')}
                    className={`${dashboardUi.input} sm:w-44`}
                  >
                    <option value="">All statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="flex overflow-hidden rounded-xl border border-slate-300">
                  <button
                    onClick={() => setEstimateViewMode('grid')}
                    className={`px-3 py-1.5 text-sm font-semibold ${
                      estimateViewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setEstimateViewMode('table')}
                    className={`px-3 py-1.5 text-sm font-semibold ${
                      estimateViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Filtered Estimates"
                value={String(filteredEstimates.length)}
                subtext="Current search and status filter"
                accent="slate"
              />
              <MetricCard
                label="Filtered Revenue"
                value={formatCurrency(filteredEstimates.reduce((sum, estimate) => sum + (estimate.total || 0), 0))}
                subtext="Potential contract value"
                accent="cyan"
              />
              <MetricCard
                label="Awaiting Approval"
                value={String(filteredEstimates.filter((estimate) => estimate.status === 'Sent').length)}
                subtext="Sent and pending decision"
                accent="amber"
              />
            </div>

            <div className={dashboardUi.panel}>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Estimate Production Board</h3>

              {isLoadingEstimates ? (
                <p className="text-sm text-slate-600">Loading estimates...</p>
              ) : errorEstimates ? (
                <p className="text-sm text-red-600">Error loading estimates: {errorEstimates}</p>
              ) : hasAttemptedEstimateFetch && filteredEstimates.length === 0 ? (
                <p className="text-sm text-slate-600">No estimates match the current filters.</p>
              ) : estimateViewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEstimates.map((estimate) => (
                    <article
                      key={estimate.id}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-cyan-400 hover:shadow"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{estimate.customerName}</p>
                          <p className="text-xs text-slate-500">#{estimate.estimateNumber}</p>
                        </div>
                        <EstimateStatusBadge status={estimate.status} />
                      </div>

                      <p className="text-sm text-slate-600">{estimate.projectAddress || 'Project address not set'}</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(estimate.total || 0)}</p>
                      <p className="text-xs text-slate-500">Updated {formatDate(estimate.lastModified)}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => router.push(`/estimate/${estimate.id}`)}
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDuplicateEstimate(estimate.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteEstimate(estimate.id)}
                          className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Address</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredEstimates.map((estimate) => (
                        <tr key={estimate.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-sm text-slate-700">{estimate.estimateNumber}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-slate-900">{estimate.customerName}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{estimate.projectAddress || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{formatCurrency(estimate.total || 0)}</td>
                          <td className="px-3 py-2 text-sm">
                            <EstimateStatusBadge status={estimate.status} />
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-700">{formatDate(estimate.lastModified)}</td>
                          <td className="px-3 py-2 text-right text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => router.push(`/estimate/${estimate.id}`)}
                                className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                Open
                              </button>
                              <button
                                onClick={() => handleDuplicateEstimate(estimate.id)}
                                className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => deleteEstimate(estimate.id)}
                                className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === 'customers' ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Total Customers"
                value={String(customers.length)}
                subtext="Active database records"
                accent="slate"
              />
              <MetricCard
                label="Customers With Estimates"
                value={String(customers.filter((customer) => customerEstimateSummary.has(customer.id)).length)}
                subtext="Connected to estimate flow"
                accent="cyan"
              />
              <MetricCard
                label="Needs Follow-Up"
                value={String(
                  customers.filter((customer) => {
                    const summary = customerEstimateSummary.get(customer.id);
                    return !summary || summary.count === 0;
                  }).length
                )}
                subtext="No estimate activity yet"
                accent="amber"
              />
            </div>

            <div className={dashboardUi.panel}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Customer Accounts</h3>
                <button onClick={() => setIsCustomerModalOpen(true)} className={primaryButtonClass}>
                  Start Estimate
                </button>
              </div>

              {isLoadingCustomers ? (
                <p className="text-sm text-slate-600">Loading customers...</p>
              ) : errorCustomers ? (
                <p className="text-sm text-red-600">Error loading customers: {errorCustomers}</p>
              ) : hasAttemptedCustomerFetch && recentCustomers.length === 0 ? (
                <p className="text-sm text-slate-600">No customers available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estimates</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recentCustomers.map((customer) => {
                        const summary = customerEstimateSummary.get(customer.id);

                        return (
                          <tr key={customer.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-sm font-semibold text-slate-900">{customer.name}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">
                              <p>{customer.email}</p>
                              <p className="text-xs text-slate-500">{customer.phone}</p>
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-700">{formatDate(customer.createdAt)}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{summary?.count || 0}</td>
                            <td className="px-3 py-2 text-sm text-slate-700">{formatCurrency(summary?.value || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === 'operations' ? (
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <section className={dashboardUi.panel}>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Painter Capacity Radar</h3>
                <div className="space-y-3">
                  {painterLoad.map((row) => {
                    const utilization = row.capacity > 0 ? Math.min(100, (row.activeLeads / row.capacity) * 100) : 0;
                    return (
                      <article key={row.name} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                          <p className="text-xs text-slate-600">
                            {row.activeLeads} active / {row.capacity || 'n/a'} capacity
                          </p>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${utilization > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                          <span>{row.offerWork} offer-stage opportunities</span>
                          <span>{formatCurrency(row.weightedValue)} weighted value</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className={dashboardUi.panel}>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">Estimate Workflow Queue</h3>
                <div className="space-y-3">
                  {(['Draft', 'Sent', 'Approved', 'Archived'] as EstimateStatus[]).map((status) => {
                    const count = estimates.filter((estimate) => estimate.status === status).length;
                    const value = estimates
                      .filter((estimate) => estimate.status === status)
                      .reduce((sum, estimate) => sum + (estimate.total || 0), 0);

                    return (
                      <article key={status} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <EstimateStatusBadge status={status} />
                            <p className="mt-1 text-sm font-semibold text-slate-900">{count} estimates</p>
                          </div>
                          <p className="text-sm text-slate-700">{formatCurrency(value)}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-900">Operations Note</p>
                  <p className="text-xs text-amber-800">
                    Painter planning is currently generated from lead assignments. Crew calendar and production-rate
                    tracking can be layered in as the next module.
                  </p>
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </main>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/55"
            aria-label="Close dashboard menu overlay"
          />
          <div className="absolute inset-0 overflow-y-auto bg-slate-50 p-4">
            <div className="mx-auto w-full max-w-7xl space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Dashboard Menu</p>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${secondaryButtonClass} px-3 py-1.5 text-xs`}
                >
                  Close
                </button>
              </div>

              <section className={dashboardUi.sidebarPanel}>
                <div className="space-y-2">
                  <button onClick={handleOpenLeadModal} className={`${primaryButtonClass} w-full`}>
                    New Lead
                  </button>
                  <button onClick={handleOpenEstimateModal} className={`${secondaryButtonClass} w-full`}>
                    New Estimate
                  </button>
                </div>
              </section>

              <nav className={dashboardUi.sidebarPanel}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboards</p>
                <div className="space-y-2">
                  {dashboardSections.map((section) => {
                    const isActive = section.id === activeSection;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSelectSection(section.id)}
                        className={`${dashboardUi.sidebarItemBase} ${
                          isActive ? dashboardUi.sidebarItemActive : dashboardUi.sidebarItemInactive
                        }`}
                      >
                        <p className="text-sm font-semibold">{section.label}</p>
                        <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{section.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <section className={dashboardUi.sidebarPanel}>
                <details className={dashboardUi.accountPanel} open>
                  <summary className={dashboardUi.accountSummary}>Account</summary>
                  <div className="mt-3 space-y-3">
                    <p className="truncate text-xs text-slate-500">{userEmail || 'Signed in user'}</p>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        void onSignOut();
                      }}
                      className={`${dangerButtonClass} w-full`}
                    >
                      Sign Out
                    </button>
                  </div>
                </details>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerSelect={handleCustomerSelected}
      />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
};

export default Dashboard;
