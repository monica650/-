import type { Project } from '../types';
import { getProjectProgress, getTodayData, getCurrentDayNum, getDayProgress } from '../hooks/useStore';

interface Props {
  projects: Project[];
  onNewProject: () => void;
  onToday: (projectId: string) => void;
  onProject: (projectId: string) => void;
  onMaterials: () => void;
  onSettings: () => void;
  onDeleteProject: (projectId: string) => void;
}

export function Dashboard({ projects, onNewProject, onToday, onProject, onMaterials, onSettings, onDeleteProject }: Props) {
  const active = projects.filter(p => p.status === 'active');
  const done = projects.filter(p => p.status === 'completed');

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
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h2>还没有项目</h2>
            <p>把你最头疼的那件事交给我，我帮你拆成每天能做完的小任务</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="section-title">进行中 ({active.length})</h2>
                <div className="task-list">
                  {active.map(p => <ProjectCard key={p.id} project={p} onToday={() => onToday(p.id)} onOverview={() => onProject(p.id)} onDelete={() => onDeleteProject(p.id)} />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section style={{ marginTop: '2rem' }}>
                <h2 className="section-title">已完成 🎉 ({done.length})</h2>
                <div className="task-list">
                  {done.map(p => <ProjectCard key={p.id} project={p} onToday={() => onProject(p.id)} onOverview={() => onProject(p.id)} onDelete={() => onDeleteProject(p.id)} completed />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fab-container">
        <button className="fab" onClick={onNewProject}>+ 新项目</button>
      </div>
    </div>
  );
}

function ProjectCard({ project, onToday, onOverview, onDelete, completed }: {
  project: Project; onToday: () => void; onOverview: () => void; onDelete: () => void; completed?: boolean;
}) {
  const progress = getProjectProgress(project);
  const showBar = progress >= 80 || completed;
  const dayNum = getCurrentDayNum(project);
  const today = getTodayData(project);
  const todayProgress = today ? getDayProgress(today) : 0;
  const todayDone = today ? today.minTasks.filter(t => t.completed).length : 0;
  const todayTotal = today ? today.minTasks.length : 0;

  return (
    <div className={`task-card ${completed ? 'task-card--done' : ''}`}>
      <div className="task-card-body">
        <div className="task-card-header">
          <h3 className="task-card-title">{project.title}</h3>
          {completed
            ? <span className="badge-done">✓ 完成</span>
            : <span className="day-badge">Day {dayNum}/{project.totalDays}</span>
          }
        </div>

        {!completed && today && (
          <div className="today-mini">
            <span className="today-mini-label">今天</span>
            <div className="today-mini-bar">
              <div className="today-mini-fill" style={{ width: `${todayProgress}%` }} />
            </div>
            <span className="today-mini-count">{todayDone}/{todayTotal}</span>
          </div>
        )}

        {showBar && (
          <div className="progress-bar-wrap" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {!completed && (
          <div className="card-actions">
            <button className="btn-today" onClick={onToday}>
              {todayDone === todayTotal && todayTotal > 0 ? '✓ 今日完成' : '今日任务 →'}
            </button>
            <button className="btn-overview" onClick={onOverview}>全览</button>
          </div>
        )}
      </div>

      <button className="task-delete-btn" onClick={e => { e.stopPropagation(); if (confirm('删除这个项目？')) onDelete(); }}>×</button>
    </div>
  );
}
