'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, Team, TaskStatus } from './types';

interface TaskModalProps {
  task: Task | null;          // null = create new
  teams: Team[];
  allTasks: Task[];
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
}

const EMPTY_TASK: Omit<Task, 'id'> = {
  teamId: '',
  name: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  status: 'not-started',
  progress: 0,
  assignee: '',
  priority: 'medium',
  dependencies: [],
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'on-hold', label: 'On Hold' },
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  'not-started': 'text-slate-400',
  'in-progress': 'text-blue-400',
  'completed': 'text-emerald-400',
  'delayed': 'text-red-400',
  'on-hold': 'text-yellow-400',
};

export default function TaskModal({ task, teams, allTasks, onSave, onDelete, onClose }: TaskModalProps) {
  const [form, setForm] = useState<Omit<Task, 'id'>>(
    task ? { ...task } : { ...EMPTY_TASK, teamId: teams[0]?.id ?? '' }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [showDeps, setShowDeps] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim() || !form.teamId || !form.startDate || !form.endDate) return;
    const saved: Task = {
      id: task?.id ?? `task-${Date.now()}`,
      ...form,
    };
    onSave(saved);
  }

  function toggleDep(depId: string, checked: boolean) {
    if (checked) {
      set('dependencies', [...form.dependencies, depId]);
    } else {
      set('dependencies', form.dependencies.filter(d => d !== depId));
    }
  }

  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t])), [teams]);

  // Available tasks to depend on (exclude self)
  const availableTasks = useMemo(() => {
    const selfId = task?.id;
    return allTasks
      .filter(t => t.id !== selfId)
      .filter(t => {
        if (!depSearch.trim()) return true;
        return t.name.toLowerCase().includes(depSearch.toLowerCase());
      });
  }, [allTasks, task?.id, depSearch]);

  // Warn about scheduling conflicts: dep ends after this task starts
  const conflictIds = useMemo(() => {
    return new Set(
      form.dependencies.filter(depId => {
        const dep = allTasks.find(t => t.id === depId);
        if (!dep || !form.startDate) return false;
        return dep.endDate > form.startDate;
      })
    );
  }, [form.dependencies, form.startDate, allTasks]);

  const selectedTeam = teams.find(t => t.id === form.teamId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-none"
          style={{ borderTop: `3px solid ${selectedTeam?.color ?? '#6366f1'}` }}>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
              {task ? 'Edit Activity' : 'New Activity'}
            </p>
            <h2 className="text-lg font-semibold text-slate-100">
              {form.name || 'Untitled Activity'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 grid gap-4">
          {/* Team */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team *</label>
            <select
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.teamId}
              onChange={e => set('teamId', e.target.value)}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Activity Name *</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. EVM First-Level Checking"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Brief description of the activity..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start Date *</label>
              <input
                type="date"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">End Date *</label>
              <input
                type="date"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.endDate}
                min={form.startDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</label>
              <select
                className={`w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLOR[form.status]}`}
                value={form.status}
                onChange={e => set('status', e.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="text-slate-100">{o.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</label>
              <select
                className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.priority}
                onChange={e => set('priority', e.target.value as Task['priority'])}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Progress */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between">
              Progress <span className="text-slate-200">{form.progress}%</span>
            </label>
            <input
              type="range" min={0} max={100} step={5}
              className="w-full accent-indigo-500"
              value={form.progress}
              onChange={e => {
                const p = Number(e.target.value);
                set('progress', p);
                if (p === 100) set('status', 'completed');
                else if (p > 0 && form.status === 'not-started') set('status', 'in-progress');
              }}
            />
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${form.progress}%`,
                  backgroundColor: selectedTeam?.color ?? '#6366f1',
                }}
              />
            </div>
          </div>

          {/* Assignee */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assignee / Responsible Officer</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. ADM Training"
              value={form.assignee}
              onChange={e => set('assignee', e.target.value)}
            />
          </div>

          {/* Dependencies */}
          <div className="grid gap-1.5">
            <button
              type="button"
              className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              onClick={() => setShowDeps(v => !v)}
            >
              <span className="flex items-center gap-1.5">
                Dependencies
                {form.dependencies.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 normal-case font-normal tracking-normal">
                    {form.dependencies.length} selected
                  </span>
                )}
                {conflictIds.size > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 normal-case font-normal tracking-normal">
                    {conflictIds.size} conflict{conflictIds.size > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              <span className="text-slate-500">{showDeps ? '▲' : '▼'}</span>
            </button>

            {showDeps && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
                {/* Search */}
                <div className="px-3 py-2 border-b border-slate-700">
                  <input
                    className="w-full bg-transparent text-slate-200 text-sm placeholder-slate-500 focus:outline-none"
                    placeholder="Search activities..."
                    value={depSearch}
                    onChange={e => setDepSearch(e.target.value)}
                  />
                </div>
                {/* Task list */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-700/50">
                  {availableTasks.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-500 text-center">No activities found</p>
                  ) : availableTasks.map(t => {
                    const team = teamMap[t.teamId];
                    const isSelected = form.dependencies.includes(t.id);
                    const isConflict = conflictIds.has(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-700/50'}`}
                      >
                        <input
                          type="checkbox"
                          className="accent-indigo-500 flex-none"
                          checked={isSelected}
                          onChange={e => toggleDep(t.id, e.target.checked)}
                        />
                        {team && (
                          <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: team.color }} />
                        )}
                        <span className="flex-1 text-xs text-slate-200 truncate">{t.name}</span>
                        {team && (
                          <span className="text-xs text-slate-500 flex-none truncate max-w-[80px]">{team.name}</span>
                        )}
                        {isConflict && isSelected && (
                          <span title="This dependency ends after this task starts" className="text-amber-400 text-xs flex-none">⚠</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conflict warning */}
            {conflictIds.size > 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <span>⚠</span>
                {conflictIds.size} selected {conflictIds.size === 1 ? 'dependency ends' : 'dependencies end'} after this activity&apos;s start date.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-700 bg-slate-900 flex-none">
          {task && onDelete && (
            confirmDelete ? (
              <>
                <span className="text-sm text-red-400 flex-1">Delete this activity?</span>
                <button
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  onClick={() => { onDelete(task.id); onClose(); }}
                >Confirm Delete</button>
                <button
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
                  onClick={() => setConfirmDelete(false)}
                >Cancel</button>
              </>
            ) : (
              <button
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                onClick={() => setConfirmDelete(true)}
              >Delete</button>
            )
          )}
          {!(task && confirmDelete) && (
            <>
              <button
                className="ml-auto px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
                onClick={onClose}
              >Cancel</button>
              <button
                className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: selectedTeam?.color ?? '#6366f1' }}
                onClick={handleSave}
                disabled={!form.name.trim() || !form.teamId}
              >
                {task ? 'Save Changes' : 'Add Activity'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
