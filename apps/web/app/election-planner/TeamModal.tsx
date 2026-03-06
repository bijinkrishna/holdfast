'use client';

import React, { useState, useEffect } from 'react';
import { Team } from './types';

interface TeamModalProps {
  team: Team | null;        // null = create new
  taskCount?: number;       // for delete warning
  onSave: (team: Team) => void;
  onDelete?: (teamId: string) => void;
  onClose: () => void;
}

const PALETTE = [
  '#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#06b6d4',
  '#84cc16', '#eab308', '#8b5cf6', '#22c55e', '#64748b',
  '#f43f5e', '#0ea5e9', '#d946ef', '#fb923c', '#a3e635',
];

export default function TeamModal({ team, taskCount = 0, onSave, onDelete, onClose }: TeamModalProps) {
  const [form, setForm] = useState<Omit<Team, 'id'>>({
    name: team?.name ?? '',
    color: team?.color ?? PALETTE[0],
    lead: team?.lead ?? '',
    description: team?.description ?? '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      id: team?.id ?? `team-${Date.now()}`,
      ...form,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-slate-700"
          style={{ borderTop: `3px solid ${form.color}` }}
        >
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
              {team ? 'Edit Team' : 'New Team'}
            </p>
            <h2 className="text-lg font-semibold text-slate-100">
              {form.name || 'Untitled Team'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 grid gap-4">
          {/* Name */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team Name *</label>
            <input
              autoFocus
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. EVM / VVPAT Team"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Lead */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team Lead</label>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. ADM (EVM)"
              value={form.lead}
              onChange={e => set('lead', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Brief description of team responsibilities..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="grid gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team Color</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#fff' : 'transparent',
                    boxShadow: form.color === c ? `0 0 0 1px ${c}` : undefined,
                  }}
                />
              ))}
              {/* Custom hex input */}
              <label className="w-7 h-7 rounded-full border-2 border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors overflow-hidden" title="Custom color">
                <input
                  type="color"
                  className="opacity-0 absolute w-1 h-1"
                  value={form.color}
                  onChange={e => set('color', e.target.value)}
                />
                <span className="text-slate-400 text-xs">+</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex-none" style={{ backgroundColor: form.color }} />
              <span className="text-xs font-mono text-slate-400">{form.color}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-700 bg-slate-900">
          {team && onDelete && (
            confirmDelete ? (
              <>
                <div className="flex-1">
                  <p className="text-sm text-red-400">Delete this team?</p>
                  {taskCount > 0 && (
                    <p className="text-xs text-red-300/70 mt-0.5">
                      {taskCount} activit{taskCount === 1 ? 'y' : 'ies'} will also be deleted.
                    </p>
                  )}
                </div>
                <button
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  onClick={() => { onDelete(team.id); onClose(); }}
                >Confirm</button>
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
          {!(team && confirmDelete) && (
            <>
              <button
                className="ml-auto px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
                onClick={onClose}
              >Cancel</button>
              <button
                className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: form.color }}
                onClick={handleSave}
                disabled={!form.name.trim()}
              >
                {team ? 'Save Changes' : 'Create Team'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
