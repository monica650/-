import { useState } from 'react';
import type { Project, DailyTask } from '../types';
import { getTodayData, getCurrentDayNum, getDayProgress } from '../hooks/useStore';

interface Props {
  project: Project;
  onComplete: (dayNum: number, taskId: string) => void;
  onSetUrl: (dayNum: number, taskId: string, url: string) => void;
  onBack: () => void;
}

export function TodayScreen({ project, onComplete, onSetUrl, onBack }: Props) {
  const dayNum = getCurrentDayNum(project);
  const today = getTodayData(project);
  const progress = today ? getDayProgress(today) : 0;
  const allMinDone = today ? today.minTasks.every(t => t.completed) : false;

  if (!today) {
    return (
      <div className="screen screen--center">
        <div className="congrats-card">
          <div className="congrats-emoji">🎉</div>
          <h1>全部完成！</h1>
          <p className="congrats-sub">「{project.title}」已完成所有 {project.totalDays} 天的计划！</p>
          <button className="btn-primary" onClick={onBack}>返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <div className="today-header-center">
          <span className="today-day-label">Day {dayNum} / {project.totalDays}</span>
          <span className="today-phase-label">{today.phase}</span>
        </div>
        <div />
      </header>

      <main className="focus-main">
        <div className="today-progress-row">
          <span className="progress-label-sm">
            今日必做 {today.minTasks.filter(t => t.completed).length}/{today.minTasks.length}
          </span>
          <div className="progress-bar-wrap progress-bar-wrap--big" style={{ flex: 1 }}>
            <div className="progress-bar progress-bar--animated" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-pct">{Math.round(progress)}%</span>
        </div>

        <div className="task-checklist">
          <div className="checklist-label">✅ 今日必做</div>
          {today.minTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={() => onComplete(dayNum, task.id)}
              onSetUrl={url => onSetUrl(dayNum, task.id, url)}
            />
          ))}
        </div>

        {today.bonusTasks.length > 0 && (
          <div className={`task-checklist task-checklist--bonus ${!allMinDone ? 'task-checklist--locked' : ''}`}>
            <div className="checklist-label">
              ✨ 加分任务
              {!allMinDone && <span className="lock-hint">（完成必做后解锁）</span>}
            </div>
            {today.bonusTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                disabled={!allMinDone}
                onComplete={() => onComplete(dayNum, task.id)}
                onSetUrl={url => onSetUrl(dayNum, task.id, url)}
              />
            ))}
          </div>
        )}

        {allMinDone && (
          <div className="day-done-banner">
            🌟 今天的必做任务全部完成！明天继续加油
          </div>
        )}
      </main>
    </div>
  );
}

function TaskRow({ task, disabled, onComplete, onSetUrl }: {
  task: DailyTask;
  disabled?: boolean;
  onComplete: () => void;
  onSetUrl: (url: string) => void;
}) {
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(task.resourceUrl ?? '');

  function saveUrl() {
    onSetUrl(urlInput.trim());
    setEditingUrl(false);
  }

  return (
    <div className={`task-row ${task.completed ? 'task-row--done' : ''} ${disabled ? 'task-row--disabled' : ''}`}>
      <button
        className={`task-check ${task.completed ? 'task-check--done' : ''}`}
        onClick={onComplete}
        disabled={task.completed || disabled}
      >
        {task.completed ? '✓' : ''}
      </button>

      <div className="task-row-content">
        <span className="task-row-title">{task.title}</span>
        <span className="task-row-meta">⏱ {task.estimatedMinutes} 分钟</span>

        {editingUrl ? (
          <div className="url-edit-row">
            <input
              className="url-input"
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveUrl()}
              autoFocus
            />
            <button className="url-save-btn" onClick={saveUrl}>保存</button>
            <button className="url-cancel-btn" onClick={() => setEditingUrl(false)}>×</button>
          </div>
        ) : (
          <div className="task-row-actions">
            {task.resourceUrl ? (
              <a className="resource-btn" href={task.resourceUrl} target="_blank" rel="noopener noreferrer">
                🔗 打开资源
              </a>
            ) : (
              !task.completed && !disabled && (
                <button className="add-link-btn" onClick={() => setEditingUrl(true)}>
                  + 添加链接
                </button>
              )
            )}
            {task.resourceUrl && !task.completed && (
              <button className="edit-link-btn" onClick={() => setEditingUrl(true)}>✎</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
