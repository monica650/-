import { useState } from 'react';
import type { Material, Project, Phase, Day } from '../types';
import { createProjectPlan } from '../utils/gemini';

interface Props {
  apiKey: string;
  materials: Material[];
  onBack: () => void;
  onProjectCreated: (project: Project) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function NewProjectScreen({ apiKey, materials, onBack, onProjectCreated }: Props) {
  const [title, setTitle] = useState('');
  const [totalDays, setTotalDays] = useState(14);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(materials.map(m => m.id));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  function toggleMaterial(id: string) {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setStatus('loading');
    setError('');

    try {
      const chosen = materials.filter(m => selectedMaterials.includes(m.id));
      const result = await createProjectPlan(
        apiKey, title.trim(), totalDays, chosen,
        msg => setStatusMsg(msg)
      );

      const project: Project = {
        id: uid(),
        title: result.title,
        totalDays,
        startDate: todayStr(),
        phases: result.phases as Phase[],
        days: result.days as Day[],
        materialIds: selectedMaterials,
        createdAt: Date.now(),
        status: 'active',
      };
      onProjectCreated(project);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="screen screen--center">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h2>{statusMsg || 'AI 正在规划...'}</h2>
          <p className="loading-hint">Gemini 正在为你制定 {totalDays} 天计划，每天都有具体任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>新项目</h2>
        <div />
      </header>

      <main className="form-main">
        <div className="field">
          <label>你想完成什么？</label>
          <textarea
            className="textarea textarea--big"
            placeholder="例如：通过科目一考试、学完 Python 基础、准备面试..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>

        <div className="field">
          <label>计划用几天完成？</label>
          <div className="days-picker">
            {[7, 14, 21, 30, 45, 60].map(d => (
              <button
                key={d}
                className={`days-btn ${totalDays === d ? 'days-btn--selected' : ''}`}
                onClick={() => setTotalDays(d)}
              >
                {d}天
              </button>
            ))}
          </div>
          <div className="days-custom">
            <span>或自定义：</span>
            <input
              type="number"
              min={1}
              max={90}
              value={totalDays}
              onChange={e => setTotalDays(Math.max(1, Math.min(90, Number(e.target.value))))}
              className="days-input"
            />
            <span>天</span>
          </div>
        </div>

        {materials.length > 0 && (
          <div className="field">
            <label>参考资料（可选）</label>
            <div className="material-tags">
              {materials.map(m => (
                <button
                  key={m.id}
                  className={`material-tag ${selectedMaterials.includes(m.id) ? 'material-tag--selected' : ''}`}
                  onClick={() => toggleMaterial(m.id)}
                >
                  {selectedMaterials.includes(m.id) ? '✓ ' : ''}{m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            ❌ {error}
            <button className="btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => setStatus('idle')}>
              重试
            </button>
          </div>
        )}

        <button className="btn-primary" onClick={handleCreate} disabled={!title.trim()}>
          🗓 AI 帮我制定计划
        </button>
      </main>
    </div>
  );
}
