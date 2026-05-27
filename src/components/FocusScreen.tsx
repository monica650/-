import { useState, useEffect } from 'react';
import type { Task, SubTask } from '../types';
import { getLeafSubtasks, getProgress, getNextLeaf } from '../hooks/useStore';

interface Props {
  task: Task;
  onComplete: (subtaskId: string) => void;
  onBack: () => void;
}

export function FocusScreen({ task, onComplete, onBack }: Props) {
  const [celebrating, setCelebrating] = useState(false);
  const [prevProgress, setPrevProgress] = useState(getProgress(task));

  const progress = getProgress(task);
  const leaves = getLeafSubtasks(task.subtasks);
  const doneCount = leaves.filter(l => l.completed).length;
  const current = getNextLeaf(task);
  const showProgress = progress >= 80;
  const allDone = task.status === 'completed';

  // Find parent of current leaf for breadcrumb
  const parentTitle = current ? findParent(task.subtasks, current.id) : null;

  useEffect(() => {
    if (progress > prevProgress) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 800);
      setPrevProgress(progress);
      return () => clearTimeout(t);
    }
  }, [progress, prevProgress]);

  function handleDone() {
    if (!current) return;
    onComplete(current.id);
  }

  if (allDone) {
    return (
      <div className="screen screen--center">
        <div className="congrats-card">
          <div className="congrats-emoji">🎉</div>
          <h1>全部完成！</h1>
          <p>「{task.title}」</p>
          <p className="congrats-sub">你完成了 {leaves.length} 个步骤，太厉害了！</p>
          <button className="btn-primary" onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`screen focus-screen ${celebrating ? 'focus-screen--celebrate' : ''}`}>
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <span className="focus-task-title">{task.title}</span>
        <div />
      </header>

      <main className="focus-main">
        {/* Progress bar only at 80%+ */}
        {showProgress && (
          <div className="progress-section">
            <div className="progress-label">
              快完成了！{doneCount}/{leaves.length} 步
            </div>
            <div className="progress-bar-wrap progress-bar-wrap--big">
              <div
                className="progress-bar progress-bar--animated"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Current subtask */}
        {current && (
          <div className="subtask-card">
            {parentTitle && (
              <div className="breadcrumb">📂 {parentTitle}</div>
            )}
            <h2 className="subtask-title">{current.title}</h2>
            {current.description && (
              <p className="subtask-desc">{current.description}</p>
            )}
            <div className="subtask-meta">
              ⏱ 大约 {current.estimatedMinutes} 分钟
            </div>

            <button className="btn-done" onClick={handleDone}>
              ✓ 完成这一步！
            </button>
          </div>
        )}

        {/* Subtle hint about remaining */}
        {!showProgress && doneCount > 0 && (
          <p className="keep-going-hint">
            继续！已完成 {doneCount} 步 🌟
          </p>
        )}

        {!showProgress && doneCount === 0 && (
          <p className="start-hint">
            从这一步开始，你能做到的 💪
          </p>
        )}

        {/* Overview toggle */}
        <details className="task-overview">
          <summary>查看全部步骤</summary>
          <SubtaskTree subtasks={task.subtasks} />
        </details>
      </main>
    </div>
  );
}

function SubtaskTree({ subtasks, depth = 0 }: { subtasks: SubTask[]; depth?: number }) {
  return (
    <ul className="overview-list" style={{ paddingLeft: depth > 0 ? '1.25rem' : 0 }}>
      {subtasks.map(st => (
        <li key={st.id} className={`overview-item ${st.completed ? 'overview-item--done' : ''}`}>
          <span className="overview-check">{st.completed ? '✓' : st.subtasks.length === 0 ? '○' : '▸'}</span>
          <span className="overview-text">{st.title}</span>
          {st.subtasks.length > 0 && (
            <SubtaskTree subtasks={st.subtasks} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

function findParent(subtasks: SubTask[], targetId: string): string | null {
  for (const st of subtasks) {
    if (st.subtasks.some(c => c.id === targetId)) return st.title;
    if (st.subtasks.length > 0) {
      const found = findParent(st.subtasks, targetId);
      if (found) return found;
    }
  }
  return null;
}
