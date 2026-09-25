import React, { useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import type { CRMRecord, StaffUser } from './crmTypes';
import { money } from './crmTypes';

interface DashboardLead {
  id: string;
  name: string;
  category?: string;
  email?: string;
  status: string;
  siteStatus?: string;
}

interface DashboardViewProps {
  currentUser: StaffUser;
  leads: DashboardLead[];
  records: CRMRecord[];
  summary: { totalClients?: number; activeProjects?: number; pipelineValuePence?: number; monthlyRecurringPence?: number; openTasks?: number } | null;
  onNavigateToTab: (tab: string) => void;
  onUpdateRecord: (id: string, updates: Partial<CRMRecord>) => Promise<void>;
}

const STAGES = [
  { id: 'discovery', label: 'Discovery', color: '#8B7CFF' },
  { id: 'proposal', label: 'Proposal', color: '#45E3C9' },
  { id: 'negotiation', label: 'Negotiation', color: '#FFC24B' },
  { id: 'won', label: 'Won', color: '#C8F542' },
];

type TaskTab = 'today' | 'upcoming' | 'overdue' | 'done';

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, leads, records, summary, onNavigateToTab, onUpdateRecord }) => {
  const [taskTab, setTaskTab] = useState<TaskTab>('today');

  const deals = records.filter(r => r.type === 'lead');
  const openDeals = deals.filter(d => d.status !== 'won' && d.status !== 'lost');
  const wonDeals = deals.filter(d => d.status === 'won');
  const closedDeals = deals.filter(d => d.status === 'won' || d.status === 'lost');
  const winRate = closedDeals.length ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
  const invoices = records.filter(r => r.type === 'invoice');
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((a, i) => a + (i.value || 0) - (i.payload?.paid || 0), 0);

  const stageTotals = STAGES.map(s => {
    const list = deals.filter(d => d.status === s.id);
    return { ...s, count: list.length, value: list.reduce((a, d) => a + (d.value || 0), 0) };
  });
  const maxStage = Math.max(1, ...stageTotals.map(s => s.value));

  // Revenue trend: paid invoice amounts by month, last 6 months
  const trend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), value: 0 };
    });
    for (const inv of invoices) {
      const paid = inv.payload?.paid || (inv.status === 'paid' ? inv.value : 0);
      if (!paid) continue;
      const d = new Date(inv.updatedAt || inv.createdAt);
      const m = months.find(x => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.value += paid;
    }
    return months;
  }, [invoices]);
  const revenueYTD = trend.reduce((a, m) => a + m.value, 0);

  // Tasks
  const today = dayKey(new Date());
  const tasks = records.filter(r => r.type === 'task');
  const bucket = (t: CRMRecord): TaskTab => {
    if (t.status === 'complete') return 'done';
    const due = t.payload?.due as string | undefined;
    if (!due) return 'upcoming';
    if (due < today) return 'overdue';
    if (due === today) return 'today';
    return 'upcoming';
  };
  const taskCounts = { today: 0, upcoming: 0, overdue: 0, done: 0 } as Record<TaskTab, number>;
  tasks.forEach(t => { taskCounts[bucket(t)]++; });
  const shownTasks = tasks.filter(t => bucket(t) === taskTab).slice(0, 6);

  const recentLeads = leads.slice(0, 5);
  const firstName = currentUser.name.split(' ')[0];
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

  // Chart geometry
  const W = 660, H = 230, P = { l: 52, r: 14, t: 18, b: 28 };
  const max = Math.max(1, ...trend.map(m => m.value)) * 1.15;
  const x = (i: number) => P.l + i * ((W - P.l - P.r) / (trend.length - 1));
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const line = trend.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(trend.length - 1)} ${H - P.b} L${P.l} ${H - P.b} Z`;

  return (
    <div className="mace-page">
      <div className="mace-head">
        <div>
          <div className="mace-eyebrow">{dateLabel}</div>
          <h1 className="mace-h1">Welcome back, {firstName} <span style={{ color: 'var(--lime-ink)' }}>✦</span></h1>
        </div>
        <div className="mace-head-meta">{openDeals.length} open deals<br />{taskCounts.today + taskCounts.overdue} tasks due</div>
      </div>

      <div className="mace-grid-4">
        <div className="mace-kpi lime">
          <div className="mace-kpi-label">PIPELINE VALUE</div>
          <div className="mace-kpi-value">{money(summary?.pipelineValuePence || 0)}</div>
          <span className="mace-pill">{openDeals.length} open deals</span>
        </div>
        <div className="mace-kpi">
          <div className="mace-kpi-label">CLIENTS</div>
          <div className="mace-kpi-value">{summary?.totalClients || 0}</div>
          <span className="mace-pill tone-lime">{summary?.activeProjects || 0} active projects</span>
        </div>
        <div className="mace-kpi">
          <div className="mace-kpi-label">WIN RATE</div>
          <div className="mace-kpi-value">{winRate}%</div>
          <span className="mace-pill tone-teal">{wonDeals.length} won</span>
        </div>
        <div className="mace-kpi">
          <div className="mace-kpi-label">OUTSTANDING</div>
          <div className="mace-kpi-value">{money(outstanding)}</div>
          <span className="mace-pill tone-purple">MRR {money(summary?.monthlyRecurringPence || 0)}</span>
        </div>
      </div>

      <div className="mace-grid-bento">
        <div className="glass-card">
          <div className="mace-card-head">
            <div className="mace-card-title">Revenue trend</div>
            <span className="mace-legend"><span className="mace-dot" style={{ background: '#C8F542' }} /> Paid · {money(revenueYTD)}</span>
            <button type="button" className="mace-link" onClick={() => onNavigateToTab('billing')}>INVOICES →</button>
          </div>
          <svg className="mace-chart" viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <linearGradient id="maceLimeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8F542" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#C8F542" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[0, 0.33, 0.66, 1].map(f => (
              <g key={f}>
                <line className="grid" x1={P.l} x2={W - P.r} y1={y(max * f / 1.15)} y2={y(max * f / 1.15)} />
                <text className="axis" x={P.l - 8} y={y(max * f / 1.15) + 3} textAnchor="end">£{Math.round((max * f / 1.15) / 100000)}k</text>
              </g>
            ))}
            <path d={area} fill="url(#maceLimeFill)" />
            <path className="closed" d={line} fill="none" strokeWidth={2.4} strokeLinecap="round" />
            {trend.map((m, i) => (
              <g key={m.key}>
                <circle className="point" cx={x(i)} cy={y(m.value)} r={3.4} strokeWidth={2} />
                <text className="month" x={x(i)} y={H - 8} textAnchor="middle">{m.label}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="mace-col">
          <div className="glass-card">
            <div className="mace-card-head">
              <div className="mace-card-title">Pipeline</div>
              <button type="button" className="mace-link" onClick={() => onNavigateToTab('pipeline')}>VIEW →</button>
            </div>
            <div className="mace-col" style={{ gap: 14 }}>
              {stageTotals.map(s => (
                <div key={s.id} className="mace-stage-row">
                  <div className="mace-stage-name">{s.label}</div>
                  <div className="mace-bar"><div style={{ width: `${Math.max(4, (s.value / maxStage) * 100)}%`, background: s.color, boxShadow: `0 0 10px ${s.color}66` }} /></div>
                  <div className="mace-small mace-right">{money(s.value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1 }}>
            <div className="mace-card-head">
              <div className="mace-card-title">Tasks</div>
              <button type="button" className="mace-link" onClick={() => onNavigateToTab('projects')}>DELIVERY DESK →</button>
            </div>
            <div className="mace-tabs">
              {(['today', 'upcoming', 'overdue', 'done'] as TaskTab[]).map(k => (
                <button key={k} type="button" className={`mace-tab${taskTab === k ? ' active' : ''}`} onClick={() => setTaskTab(k)}>
                  {k[0].toUpperCase() + k.slice(1)} <span className="mace-tab-count">{taskCounts[k]}</span>
                </button>
              ))}
            </div>
            {shownTasks.map(t => {
              const done = t.status === 'complete';
              return (
                <button key={t.id} type="button" className="mace-task" onClick={() => onUpdateRecord(t.id, { status: done ? 'in-progress' : 'complete' })}>
                  <span className={`mace-check${done ? ' done' : ''}`}><Check size={13} /></span>
                  <span className={`mace-task-title${done ? ' done' : ''}`}>{t.name}</span>
                  <span className={`mace-due tone-${taskTab === 'overdue' ? 'red' : taskTab === 'today' ? 'lime' : taskTab === 'done' ? 'grey' : 'teal'}`}>{t.payload?.due ? new Date(t.payload.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                </button>
              );
            })}
            {shownTasks.length === 0 && (
              <div className="mace-empty" style={{ padding: '28px 12px 12px' }}>
                <div className="mace-empty-icon" style={{ width: 52, height: 52, fontSize: 20, borderColor: 'rgba(69,227,201,0.45)', color: 'var(--teal-ink)' }}>✓</div>
                <div className="mace-empty-body" style={{ marginBottom: 0 }}>Nothing in {taskTab}.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: 16 }}>
        <div className="mace-card-head">
          <div className="mace-card-title">Recent outbound leads</div>
          <button type="button" className="mace-link" onClick={() => onNavigateToTab('outbound')}>ALL LEADS <ArrowRight size={12} /></button>
        </div>
        {recentLeads.length === 0 ? (
          <div className="mace-empty">
            <div className="mace-empty-icon" style={{ borderColor: 'rgba(200,245,66,0.4)', color: 'var(--lime-ink)' }}>⌀</div>
            <div className="mace-empty-title">No leads yet</div>
            <div className="mace-empty-body">Import a list or scrape a niche to start filling the pipeline.</div>
            <button type="button" className="btn btn-primary" onClick={() => onNavigateToTab('outbound')}>＋ Add Lead</button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Business</th><th>Category</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeads.map(l => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-main)' }}>{l.name}</td>
                    <td>{l.category || '—'}</td>
                    <td className="mace-mono">{l.email || '—'}</td>
                    <td><span className={`badge badge-${l.status}`}>{l.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
