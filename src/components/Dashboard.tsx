import type { Task } from '../types';
import { getProgress, getLeafSubtasks } from '../hooks/useStore';

interface Props {
  tasks: Task[];
  onNewTask: () => void;
  onFocus: (taskId: string) => void;
  onMaterials: () => void;
  onSettings: () => void;
  onDeleteTask: (taskId: string) => void;
}

export function Dashboard({ tasks, onNewTask, onFocus, onMaterials, onSettings, onDeleteTask }: Props) {
  const active = tasks.filter(t => t.status === 'active');
  const done = tasks.filter(t => t.status === 'completed');

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="app-title">🧩 一步一步</h1>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={onMaterials} title="资料库">📚</button>
          <button className="icon-btn" onClick={onSettings} title="设置">⚙️</button>
        </div>
      </header>

      <main className="dashboard-main">
        {active.length === 0 && done.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h2>还没有任务</h2>
            <p>点击下方按钮，把你脑海里最让你头疼的那件事交给我</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="section-title">进行中 ({active.length})</h2>
                <div className="task-list">
                  {active.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onFocus={() => onFocus(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {done.length > 0 && (
              <section style={{ marginTop: '2rem' }}>
                <h2 className="section-title">已完成 🎉 ({done.length})</h2>
                <div className="task-list">
                  {done.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onFocus={() => onFocus(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                      completed
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fab-container">
        <button className="fab" onClick={onNewTask}>
          + 新任务
        </button>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onFocus,
  onDelete,
  completed,
}: {
  task: Task;
  onFocus: () => void;
  onDelete: () => void;
  completed?: boolean;
}) {
  const progress = getProgress(task);
  const leaves = getLeafSubtasks(task.subtasks);
  const doneCount = leaves.filter(l => l.completed).length;
  const show = progress >= 80;

  return (
    <div className={`task-card ${completed ? 'task-card--done' : ''}`}>
      <div className="task-card-body" onClick={completed ? undefined : onFocus}>
        <div className="task-card-header">
          <h3 className="task-card-title">{task.title}</h3>
          {completed && <span className="badge-done">✓ 完成</span>}
        </div>

        <div className="task-card-meta">
          {completed ? (
            <span className="meta-text">共 {leaves.length} 步，全部完成！</span>
          ) : (
            <span className="meta-text">
              {doneCount}/{leaves.length} 步
              {!show && doneCount > 0 && ' · 继续加油'}
            </span>
          )}
        </div>

        {show && (
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {!completed && (
          <button className="task-start-btn" onClick={onFocus}>
            {doneCount === 0 ? '开始' : '继续'} →
          </button>
        )}
      </div>

      <button
        className="task-delete-btn"
        onClick={e => {
          e.stopPropagation();
          if (confirm('确定删除这个任务吗？')) onDelete();
        }}
        title="删除"
      >
        ×
      </button>
    </div>
  );
}
