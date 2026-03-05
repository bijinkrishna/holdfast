'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Task, Team, TimeScale } from './types';

interface GanttChartProps {
  tasks: Task[];
  teams: Team[];
  electionDate: string;
  timeScale: TimeScale;
  onTaskClick: (task: Task) => void;
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}


const STATUS_DOT: Record<string, string> = {
  'completed': 'bg-emerald-400',
  'in-progress': 'bg-blue-400 animate-pulse',
  'not-started': 'bg-slate-500',
  'delayed': 'bg-red-400',
  'on-hold': 'bg-yellow-400',
};

export default function GanttChart({
  tasks, teams, electionDate, timeScale, onTaskClick,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [todayOffset, setTodayOffset] = useState(0);
  const [showDeps, setShowDeps] = useState(true);

  // Compute date range
  const allDates = tasks.flatMap(t => [parseDate(t.startDate), parseDate(t.endDate)]);
  allDates.push(parseDate(electionDate));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  allDates.push(today);

  const rawMin = new Date(Math.min(...allDates.map(d => d.getTime())));
  const rawMax = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Add padding
  const minDate = addDays(rawMin, -7);
  const maxDate = addDays(rawMax, 14);
  const totalDays = daysBetween(minDate, maxDate);

  // DAY_WIDTH in px
  const DAY_WIDTH = timeScale === 'week' ? 32 : 14;
  const totalWidth = totalDays * DAY_WIDTH;

  // Build header columns
  const headerCols: { label: string; days: number }[] = [];
  if (timeScale === 'week') {
    // Week columns
    let cur = new Date(minDate);
    while (cur <= maxDate) {
      const weekStart = new Date(cur);
      const weekEnd = addDays(cur, 6);
      const label = formatDate(weekStart) + ' – ' + formatDate(weekEnd > maxDate ? maxDate : weekEnd);
      const daysInView = Math.min(7, daysBetween(cur, maxDate) + 1);
      headerCols.push({ label, days: daysInView });
      cur = addDays(cur, 7);
    }
  } else {
    // Month columns
    let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const colStart = cur < minDate ? minDate : cur;
      const colEnd = nextMonth > maxDate ? maxDate : addDays(nextMonth, -1);
      const days = daysBetween(colStart, colEnd) + 1;
      headerCols.push({ label: formatMonth(cur), days });
      cur = nextMonth;
    }
  }

  // Scroll to today on mount
  useEffect(() => {
    const offset = daysBetween(minDate, today);
    const px = offset * DAY_WIDTH - 200;
    setTodayOffset(offset * DAY_WIDTH);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, px);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeScale]);

  // Group tasks by team
  const teamGroups = teams
    .map(team => ({
      team,
      tasks: tasks.filter(t => t.teamId === team.id),
    }))
    .filter(g => g.tasks.length > 0);

  const ROW_H = 44;
  const HEADER_H = 56;
  const LABEL_W = 260;
  const BAR_TOP = 8; // top offset within row
  const BAR_H = 28; // bar height

  // Compute task positions for dependency arrows
  const taskPositions = useMemo(() => {
    const map: Record<string, { rowY: number; barLeft: number; barRight: number }> = {};
    let rowOffset = 0;
    for (const { tasks: tTasks } of teamGroups) {
      rowOffset += ROW_H; // skip team header row
      for (const task of tTasks) {
        const start = parseDate(task.startDate);
        const end = parseDate(task.endDate);
        const barLeft = daysBetween(minDate, start) * DAY_WIDTH;
        const barRight = (daysBetween(minDate, end) + 1) * DAY_WIDTH;
        const rowY = rowOffset + ROW_H / 2;
        map[task.id] = { rowY, barLeft, barRight };
        rowOffset += ROW_H;
      }
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, teams, timeScale]);

  const totalRowsHeight = teamGroups.reduce((sum, g) => sum + (1 + g.tasks.length) * ROW_H, 0);

  // Build dependency arrows data
  const arrows = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; conflict: boolean }[] = [];
    for (const task of tasks) {
      const to = taskPositions[task.id];
      if (!to) continue;
      for (const depId of task.dependencies) {
        const from = taskPositions[depId];
        if (!from) continue;
        const dep = tasks.find(t => t.id === depId);
        const conflict = dep ? dep.endDate > task.startDate : false;
        result.push({
          x1: from.barRight,
          y1: from.rowY,
          x2: to.barLeft,
          y2: to.rowY,
          conflict,
        });
      }
    }
    return result;
  }, [tasks, taskPositions]);

  function taskBar(task: Task, team: Team) {
    const start = parseDate(task.startDate);
    const end = parseDate(task.endDate);
    const left = daysBetween(minDate, start) * DAY_WIDTH;
    const width = Math.max((daysBetween(start, end) + 1) * DAY_WIDTH, DAY_WIDTH);
    const progressW = Math.round((task.progress / 100) * width);

    const isDelayed = task.status === 'delayed' || (task.status !== 'completed' && end < today);

    return (
      <div
        key={task.id}
        className="absolute top-2 h-7 rounded-md cursor-pointer group transition-transform hover:scale-y-110 hover:z-20"
        style={{
          left,
          width,
          backgroundColor: team.color + '33',
          border: `1.5px solid ${team.color}`,
          boxShadow: isDelayed ? `0 0 0 1.5px #ef4444` : undefined,
        }}
        onClick={() => onTaskClick(task)}
        title={`${task.name}\n${task.startDate} → ${task.endDate}\nProgress: ${task.progress}%`}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-md transition-all"
          style={{ width: progressW, backgroundColor: team.color + '99' }}
        />
        {/* Label */}
        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate text-white z-10"
          style={{ textShadow: '0 1px 3px #0008' }}>
          {task.name}
        </span>
        {/* Tooltip */}
        <div className="hidden group-hover:flex absolute -top-10 left-0 z-30 min-w-max bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded-lg px-3 py-2 shadow-xl flex-col gap-0.5">
          <span className="font-semibold">{task.name}</span>
          <span className="text-slate-400">{task.startDate} → {task.endDate} | {task.progress}% done</span>
          {task.dependencies.length > 0 && (
            <span className="text-slate-400">
              {task.dependencies.length} {task.dependencies.length === 1 ? 'dependency' : 'dependencies'}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-b border-slate-700 bg-slate-800/50 text-xs">
        {Object.entries({ 'Completed': 'bg-emerald-400', 'In Progress': 'bg-blue-400', 'Not Started': 'bg-slate-500', 'Delayed': 'bg-red-400', 'On Hold': 'bg-yellow-400' }).map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1.5 text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-slate-300 ml-auto">
          <span className="w-0.5 h-4 bg-blue-400 rounded" />Today
          <span className="w-0.5 h-4 bg-red-400 rounded ml-2" />Election Day
        </span>
        {/* Dependency toggle */}
        <button
          onClick={() => setShowDeps(v => !v)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-colors text-xs ${
            showDeps
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
              : 'border-slate-600 text-slate-400 hover:border-slate-500'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2" cy="6" r="1.5" fill="currentColor" />
            <circle cx="10" cy="6" r="1.5" fill="currentColor" />
            <path d="M3.5 6 H8.5" stroke="currentColor" strokeWidth="1.2" markerEnd="url(#arr)" />
          </svg>
          Dependencies
        </button>
      </div>

      <div className="flex overflow-hidden" style={{ minHeight: 300 }}>
        {/* Fixed label column */}
        <div className="flex-none bg-slate-900 border-r border-slate-700 z-10" style={{ width: LABEL_W }}>
          {/* Header spacer */}
          <div style={{ height: HEADER_H }} className="border-b border-slate-700 bg-slate-800/80 flex items-end px-3 pb-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Team / Activity</span>
          </div>
          {teamGroups.map(({ team, tasks: tTasks }) => (
            <div key={team.id}>
              {/* Team header row */}
              <div
                className="flex items-center gap-2 px-3 border-b border-slate-700/60"
                style={{ height: ROW_H, background: team.color + '18' }}
              >
                <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: team.color }} />
                <span className="text-xs font-semibold truncate" style={{ color: team.color }}>{team.name}</span>
              </div>
              {/* Task rows */}
              {tTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors"
                  style={{ height: ROW_H }}
                  onClick={() => onTaskClick(task)}
                >
                  <span className={`w-2 h-2 rounded-full flex-none ${STATUS_DOT[task.status]}`} />
                  <span className="text-xs text-slate-300 truncate flex-1">{task.name}</span>
                  <span className="text-xs text-slate-500 flex-none">{task.progress}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Scrollable Gantt area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto"
          style={{ position: 'relative' }}
        >
          <div style={{ width: totalWidth, minWidth: totalWidth }}>
            {/* Time header */}
            <div
              className="flex border-b border-slate-700 bg-slate-800/80 sticky top-0 z-10"
              style={{ height: HEADER_H }}
            >
              {headerCols.map((col, i) => (
                <div
                  key={i}
                  className="flex-none border-r border-slate-700 flex items-end justify-center pb-1"
                  style={{ width: col.days * DAY_WIDTH }}
                >
                  <span className="text-xs text-slate-400">{col.label}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div style={{ position: 'relative' }}>
              {teamGroups.map(({ team, tasks: tTasks }) => (
                <div key={team.id}>
                  {/* Team header row — background stripe */}
                  <div
                    className="border-b border-slate-700/60"
                    style={{ height: ROW_H, background: team.color + '0c' }}
                  />
                  {/* Task rows */}
                  {tTasks.map(task => (
                    <div
                      key={task.id}
                      className="relative border-b border-slate-800"
                      style={{ height: ROW_H }}
                    >
                      {/* Column gridlines */}
                      {headerCols.reduce((acc, col, i) => {
                        const x = headerCols.slice(0, i).reduce((s, c) => s + c.days * DAY_WIDTH, 0);
                        acc.push(
                          <div key={i} className="absolute top-0 bottom-0 border-r border-slate-800/50" style={{ left: x + col.days * DAY_WIDTH }} />
                        );
                        return acc;
                      }, [] as React.ReactNode[])}
                      {taskBar(task, team)}
                    </div>
                  ))}
                </div>
              ))}

              {/* Dependency arrows SVG overlay */}
              {showDeps && arrows.length > 0 && (
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  width={totalWidth}
                  height={totalRowsHeight}
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <marker id="dep-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#818cf8" />
                    </marker>
                    <marker id="dep-arrow-conflict" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                    </marker>
                  </defs>
                  {arrows.map((a, i) => {
                    const color = a.conflict ? '#fbbf24' : '#818cf8';
                    const markerId = a.conflict ? 'dep-arrow-conflict' : 'dep-arrow';
                    // Elbow connector: from right of dep bar to left of task bar
                    const ELBOW = 10;
                    let d: string;
                    if (a.x1 + ELBOW < a.x2 - ELBOW) {
                      // Normal: dep ends before task starts — L-shaped elbow
                      const midX = (a.x1 + a.x2) / 2;
                      d = `M${a.x1},${a.y1} H${midX} V${a.y2} H${a.x2 - 2}`;
                    } else {
                      // Conflict: dep ends after task starts — route around
                      const rightX = a.x1 + ELBOW;
                      d = `M${a.x1},${a.y1} H${rightX} V${a.y2} H${a.x2 - 2}`;
                    }
                    return (
                      <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        strokeDasharray={a.conflict ? '4 2' : undefined}
                        markerEnd={`url(#${markerId})`}
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Today line */}
            {todayOffset > 0 && todayOffset < totalWidth && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-400/80 z-20 pointer-events-none"
                style={{ left: todayOffset, top: HEADER_H }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-blue-300 text-[10px] font-bold whitespace-nowrap bg-slate-900 px-1 rounded">Today</div>
              </div>
            )}

            {/* Election date line */}
            {(() => {
              const elOffset = daysBetween(minDate, parseDate(electionDate)) * DAY_WIDTH;
              if (elOffset > 0 && elOffset < totalWidth) {
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400/80 z-20 pointer-events-none"
                    style={{ left: elOffset, top: HEADER_H }}
                  >
                    <div className="absolute -top-1 left-1 text-red-300 text-[10px] font-bold whitespace-nowrap bg-slate-900 px-1 rounded">Election Day</div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
