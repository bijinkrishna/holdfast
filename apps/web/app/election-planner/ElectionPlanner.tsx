'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, ViewMode, TimeScale, ElectionPlan } from './types';
import { defaultElectionPlan } from './defaultData';
import GanttChart from './GanttChart';
import TaskModal from './TaskModal';
import { loadPlan, upsertPlan } from './actions';

// ─────────────────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  'completed': 'Completed', 'in-progress': 'In Progress',
  'not-started': 'Not Started', 'delayed': 'Delayed', 'on-hold': 'On Hold',
};

const STATUS_BG: Record<string, string> = {
  'completed': 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  'in-progress': 'bg-blue-900/60 text-blue-300 border-blue-700',
  'not-started': 'bg-slate-800 text-slate-400 border-slate-600',
  'delayed': 'bg-red-900/60 text-red-300 border-red-700',
  'on-hold': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
};

const PRIORITY_BG: Record<string, string> = {
  critical: 'bg-red-900/60 text-red-300 border-red-700',
  high: 'bg-orange-900/60 text-orange-300 border-orange-700',
  medium: 'bg-blue-900/60 text-blue-300 border-blue-700',
  low: 'bg-slate-800 text-slate-400 border-slate-600',
};

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border bg-slate-900 p-4 flex flex-col gap-1`} style={{ borderColor: color + '44' }}>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_ID_KEY = 'wb-election-plan-id-v1';

type SyncStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

export default function ElectionPlanner() {
  const [plan, setPlan] = useState<ElectionPlan>(defaultElectionPlan);
  const [planId, setPlanId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [view, setView] = useState<ViewMode>('gantt');
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined); // undefined = closed
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingPlan, setEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({ title: plan.title, electionDate: plan.electionDate, district: plan.district });

  // Load plan from DB on mount
  useEffect(() => {
    async function initPlan() {
      const storedId = localStorage.getItem(PLAN_ID_KEY);
      if (storedId) {
        const loaded = await loadPlan(storedId);
        if (loaded) {
          setPlan(loaded);
          setPlanId(storedId);
          setSyncStatus('idle');
          return;
        }
      }
      // No plan in DB yet — persist the default plan to DB
      try {
        const newId = await upsertPlan(null, defaultElectionPlan);
        localStorage.setItem(PLAN_ID_KEY, newId);
        setPlanId(newId);
      } catch {
        // DB not configured — silently continue with in-memory state
      }
      setSyncStatus('idle');
    }
    initPlan();
  }, []);

  const savePlan = useCallback((updated: ElectionPlan) => {
    setPlan(updated); // optimistic update
    setSyncStatus('saving');
    upsertPlan(planId, updated)
      .then(id => {
        if (id !== planId) {
          setPlanId(id);
          localStorage.setItem(PLAN_ID_KEY, id);
        }
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 2000);
      })
      .catch(() => setSyncStatus('error'));
  }, [planId]);

  function handleSaveTask(task: Task) {
    const exists = plan.tasks.find(t => t.id === task.id);
    const tasks = exists
      ? plan.tasks.map(t => t.id === task.id ? task : t)
      : [...plan.tasks, task];
    savePlan({ ...plan, tasks });
    setModalTask(undefined);
  }

  function handleDeleteTask(id: string) {
    savePlan({ ...plan, tasks: plan.tasks.filter(t => t.id !== id) });
    setModalTask(undefined);
  }

  function handleSavePlanMeta() {
    savePlan({ ...plan, ...planForm });
    setEditingPlan(false);
  }

  function handleReset() {
    if (!window.confirm('Reset to default election plan? All changes will be lost.')) return;
    localStorage.removeItem(PLAN_ID_KEY);
    setPlanId(null);
    savePlan(defaultElectionPlan);
  }

  // Filtered tasks
  const filteredTasks = plan.tasks.filter(t => {
    if (filterTeam !== 'all' && t.teamId !== filterTeam) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase()) &&
      !t.assignee.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const total = plan.tasks.length;
  const completed = plan.tasks.filter(t => t.status === 'completed').length;
  const inProgress = plan.tasks.filter(t => t.status === 'in-progress').length;
  const delayed = plan.tasks.filter(t => t.status === 'delayed').length;
  const overallProgress = total ? Math.round(plan.tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;
  const daysLeft = daysUntil(plan.electionDate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" aria-busy={syncStatus === 'loading'}>
      {/* ─── Header ─── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.3rem] text-teal-400">District Election Office · WB</p>
            {editingPlan ? (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <input
                  className="text-lg font-bold bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={planForm.title}
                  onChange={e => setPlanForm(p => ({ ...p, title: e.target.value }))}
                />
                <input
                  type="date"
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={planForm.electionDate}
                  onChange={e => setPlanForm(p => ({ ...p, electionDate: e.target.value }))}
                />
                <input
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-100 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="District"
                  value={planForm.district}
                  onChange={e => setPlanForm(p => ({ ...p, district: e.target.value }))}
                />
                <button onClick={handleSavePlanMeta} className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded text-sm text-white transition-colors">Save</button>
                <button onClick={() => setEditingPlan(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300 transition-colors">Cancel</button>
              </div>
            ) : (
              <button className="mt-0.5 text-left group" onClick={() => { setPlanForm({ title: plan.title, electionDate: plan.electionDate, district: plan.district }); setEditingPlan(true); }}>
                <h1 className="text-xl font-bold text-slate-100 group-hover:text-teal-300 transition-colors truncate">
                  {plan.title}
                  <span className="ml-2 text-xs text-slate-500 group-hover:text-teal-500">✎ edit</span>
                </h1>
              </button>
            )}
          </div>

          {/* Day countdown */}
          <div className={`text-center px-4 py-1.5 rounded-xl border ${daysLeft <= 7 ? 'border-red-700 bg-red-900/40' : daysLeft <= 30 ? 'border-orange-700 bg-orange-900/30' : 'border-slate-700 bg-slate-800'}`}>
            <p className="text-2xl font-black text-slate-100">{daysLeft < 0 ? 'Done' : daysLeft}</p>
            <p className="text-xs text-slate-400">{daysLeft >= 0 ? 'days to election' : 'days past'}</p>
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-700 overflow-hidden">
            {(['dashboard', 'gantt', 'list'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${view === v ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >{v}</button>
            ))}
          </div>

          {/* Sync status indicator */}
          {syncStatus === 'loading' && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />Loading…
            </span>
          )}
          {syncStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />Saving…
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />Saved
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400" title="Could not reach database">
              <span className="w-2 h-2 rounded-full bg-red-400" />Sync failed
            </span>
          )}

          <button
            onClick={() => setModalTask(null)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >+ Add Activity</button>
        </div>
      </header>

      {/* ─── Filter bar ─── */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2 max-w-[1600px] mx-auto w-full flex flex-wrap gap-2 items-center">
        <input
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
          placeholder="Search activities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
        >
          <option value="all">All Teams</option>
          {plan.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          className="rounded-lg bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
          <option value="on-hold">On Hold</option>
        </select>
        {view === 'gantt' && (
          <div className="flex rounded-lg border border-slate-700 overflow-hidden ml-auto">
            {(['month', 'week'] as TimeScale[]).map(s => (
              <button key={s} onClick={() => setTimeScale(s)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${timeScale === s ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <button onClick={handleReset} className="ml-auto text-xs text-slate-500 hover:text-red-400 transition-colors">Reset to defaults</button>
      </div>

      {/* ─── Main content ─── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4 flex flex-col gap-4">

        {/* ── Dashboard view ── */}
        {view === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Activities" value={total} color="#94a3b8" />
              <StatCard label="Completed" value={completed} sub={`${total ? Math.round(completed / total * 100) : 0}% of total`} color="#34d399" />
              <StatCard label="In Progress" value={inProgress} color="#60a5fa" />
              <StatCard label="Delayed" value={delayed} color="#f87171" />
              <StatCard label="Overall Progress" value={`${overallProgress}%`} color="#a78bfa" />
              <StatCard label="Election Date" value={plan.electionDate} sub={plan.district} color="#f59e0b" />
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300 font-medium">Overall Election Preparation Progress</span>
                <span className="text-sm text-slate-400">{overallProgress}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>

            {/* Team progress */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plan.teams.map(team => {
                const tTasks = plan.tasks.filter(t => t.teamId === team.id);
                const tDone = tTasks.filter(t => t.status === 'completed').length;
                const tProg = tTasks.length ? Math.round(tTasks.reduce((s, t) => s + t.progress, 0) / tTasks.length) : 0;
                const tDelayed = tTasks.filter(t => t.status === 'delayed').length;
                return (
                  <div key={team.id} className="rounded-xl border bg-slate-900 p-4 flex flex-col gap-3"
                    style={{ borderColor: team.color + '44' }}>
                    <div className="flex items-start gap-2">
                      <span className="w-3 h-3 rounded-full flex-none mt-0.5" style={{ backgroundColor: team.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: team.color }}>{team.name}</p>
                        <p className="text-xs text-slate-500">{team.lead}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>{tTasks.length} activities</span>
                      <span className="text-emerald-400">{tDone} done</span>
                      {tDelayed > 0 && <span className="text-red-400">{tDelayed} delayed</span>}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-300">{tProg}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${tProg}%`, backgroundColor: team.color }} />
                      </div>
                    </div>
                    {/* Mini task list */}
                    <div className="flex flex-col gap-1 mt-1">
                      {tTasks.slice(0, 4).map(t => (
                        <button key={t.id} onClick={() => setModalTask(t)}
                          className="flex items-center gap-2 text-left hover:bg-slate-800 rounded px-1 py-0.5 transition-colors group">
                          <span className={`w-1.5 h-1.5 rounded-full flex-none ${
                            t.status === 'completed' ? 'bg-emerald-400' :
                            t.status === 'in-progress' ? 'bg-blue-400' :
                            t.status === 'delayed' ? 'bg-red-400' : 'bg-slate-600'
                          }`} />
                          <span className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">{t.name}</span>
                        </button>
                      ))}
                      {tTasks.length > 4 && (
                        <span className="text-xs text-slate-600 px-1">+{tTasks.length - 4} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Critical path tasks */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Critical Activities — Upcoming 14 Days</h3>
              <div className="grid gap-2">
                {plan.tasks
                  .filter(t => {
                    const d = daysUntil(t.endDate);
                    return d >= 0 && d <= 14 && t.status !== 'completed';
                  })
                  .sort((a, b) => a.endDate.localeCompare(b.endDate))
                  .slice(0, 8)
                  .map(t => {
                    const team = plan.teams.find(te => te.id === t.teamId);
                    return (
                      <button key={t.id} onClick={() => setModalTask(t)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left">
                        <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: team?.color ?? '#6366f1' }} />
                        <span className="text-sm text-slate-300 flex-1 truncate">{t.name}</span>
                        <span className="text-xs text-slate-500 flex-none">{t.endDate}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-none ${STATUS_BG[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </button>
                    );
                  })}
                {plan.tasks.filter(t => { const d = daysUntil(t.endDate); return d >= 0 && d <= 14 && t.status !== 'completed'; }).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No activities due in the next 14 days</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Gantt view ── */}
        {view === 'gantt' && (
          <GanttChart
            tasks={filteredTasks}
            teams={plan.teams}
            electionDate={plan.electionDate}
            timeScale={timeScale}
            onTaskClick={t => setModalTask(t)}
          />
        )}

        {/* ── List view ── */}
        {view === 'list' && (
          <div className="flex flex-col gap-3">
            {plan.teams.map(team => {
              const tTasks = filteredTasks.filter(t => t.teamId === team.id);
              if (!tTasks.length) return null;
              return (
                <div key={team.id} className="rounded-xl border bg-slate-900 overflow-hidden"
                  style={{ borderColor: team.color + '44' }}>
                  <div className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{ borderColor: team.color + '33', background: team.color + '12' }}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="font-semibold text-sm" style={{ color: team.color }}>{team.name}</span>
                    <span className="text-xs text-slate-500 ml-1">— {team.lead}</span>
                    <span className="ml-auto text-xs text-slate-500">{tTasks.length} activit{tTasks.length === 1 ? 'y' : 'ies'}</span>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {tTasks.map(task => (
                      <button key={task.id} onClick={() => setModalTask(task)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left">
                        {/* Progress circle */}
                        <div className="relative w-8 h-8 flex-none">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" fill="none" stroke="#1e293b" strokeWidth="4" />
                            <circle cx="16" cy="16" r="12" fill="none" strokeWidth="4"
                              stroke={team.color}
                              strokeDasharray={`${2 * Math.PI * 12 * task.progress / 100} ${2 * Math.PI * 12}`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-300">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{task.name}</p>
                          {task.description && <p className="text-xs text-slate-500 truncate">{task.description}</p>}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 flex-none">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_BG[task.priority]}`}>{task.priority}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BG[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                        </div>
                        <div className="hidden md:block text-right flex-none">
                          <p className="text-xs text-slate-400">{task.startDate}</p>
                          <p className="text-xs text-slate-400">{task.endDate}</p>
                        </div>
                        <div className="hidden lg:block text-xs text-slate-500 flex-none w-32 truncate text-right">
                          {task.assignee}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <p className="text-4xl mb-3">📋</p>
                <p>No activities match your filters.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-600">
        District Election Officer · West Bengal LA Elections · Data persisted to Supabase
        {planId && <span className="ml-2 font-mono opacity-50">· {planId.slice(0, 8)}</span>}
      </footer>

      {/* ─── Task modal ─── */}
      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          teams={plan.teams}
          allTasks={plan.tasks}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setModalTask(undefined)}
        />
      )}
    </div>
  );
}
