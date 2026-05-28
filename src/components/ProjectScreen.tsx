import { useState } from 'react';
import type { Project, Day } from '../types';
import { getProjectProgress, getCurrentDayNum, getDayProgress } from '../hooks/useStore';

interface Props {
  project: Project;
  onGoToDay: (dayNum: number) => void;
  onBack: () => void;
}

export function ProjectScreen({ project, onGoToDay, onBack }: Props) {
  const [openPhase, setOpenPhase] = useState<string | null>(project.phases[0]?.title ?? null);
  const progress = getProjectProgress(project);
  const currentDay = getCurrentDayNum(project);
  const showOverall = progress >= 80 || project.status === 'completed';

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="project-screen-title">{project.title}</h2>
        <div />
      </header>

      <main className="dashboard-main">
        <div className="project-meta">
          <span className="meta-pill">📅 {project.totalDays} 天计划</span>
          <span className="meta-pill">Day {currentDay} / {project.totalDays}</span>
          {showOverall && (
            <span className="meta-pill meta-pill--progress">总进度 {Math.round(progress)}%</span>
          )}
        </div>

        {showOverall && (
          <div className="progress-bar-wrap progress-bar-wrap--big" style={{ marginBottom: '1.25rem' }}>
            <div className="progress-bar progress-bar--animated" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="phases-list">
          {project.phases.map(phase => {
            const phaseDays = project.days.filter(d => d.dayNum >= phase.startDay && d.dayNum <= phase.endDay);
            const isOpen = openPhase === phase.title;
            const doneDays = phaseDays.filter(d => d.minTasks.every(t => t.completed)).length;
            const isCurrent = currentDay >= phase.startDay && currentDay <= phase.endDay;

            return (
              <div key={phase.title} className={`phase-block ${isCurrent ? 'phase-block--current' : ''}`}>
                <button
                  className="phase-header"
                  onClick={() => setOpenPhase(isOpen ? null : phase.title)}
                >
                  <div className="phase-header-left">
                    <span className="phase-icon">{isOpen ? '▾' : '▸'}</span>
                    <div>
                      <div className="phase-title">
                        {isCurrent && <span className="current-dot" />}
                        {phase.title}
                      </div>
                      <div className="phase-range">Day {phase.startDay}–{phase.endDay} · {doneDays}/{phaseDays.length} 天完成</div>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="phase-days">
                    {phaseDays.map(day => (
                      <DayRow
                        key={day.dayNum}
                        day={day}
                        isCurrent={day.dayNum === currentDay}
                        isPast={day.dayNum < currentDay}
                        onClick={() => onGoToDay(day.dayNum)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function DayRow({ day, isCurrent, isPast, onClick }: { day: Day; isCurrent: boolean; isPast: boolean; onClick: () => void }) {
  const p = getDayProgress(day);
  const allDone = day.minTasks.every(t => t.completed);
  const anyDone = day.minTasks.some(t => t.completed);

  let statusIcon = '○';
  if (allDone) statusIcon = '✓';
  else if (anyDone) statusIcon = '◑';

  return (
    <button
      className={`day-row ${isCurrent ? 'day-row--current' : ''} ${allDone ? 'day-row--done' : ''} ${isPast && !allDone ? 'day-row--overdue' : ''}`}
      onClick={onClick}
    >
      <span className="day-status">{statusIcon}</span>
      <div className="day-row-info">
        <span className="day-row-num">Day {day.dayNum}</span>
        <span className="day-row-tasks">{day.minTasks.length} 个必做任务</span>
      </div>
      {anyDone && !allDone && (
        <div className="day-mini-bar">
          <div className="day-mini-fill" style={{ width: `${p}%` }} />
        </div>
      )}
      <span className="day-row-arrow">→</span>
    </button>
  );
}
