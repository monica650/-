import { useState } from 'react';
import type { Material, Task, SubTask } from '../types';
import { breakdownTask } from '../utils/deepseek';

interface Props {
  apiKey: string;
  materials: Material[];
  onBack: () => void;
  onTaskCreated: (task: Task) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function NewTaskScreen({ apiKey, materials, onBack, onTaskCreated }: Props) {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    materials.map(m => m.id)
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');

  function toggleMaterial(id: string) {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleBreakdown() {
    if (!taskTitle.trim()) return;
    setStatus('loading');
    setStreamText('');
    setError('');

    try {
      const chosen = materials.filter(m => selectedMaterials.includes(m.id));
      const result = await breakdownTask(apiKey, taskTitle.trim(), chosen, text => {
        setStreamText(text);
      });

      const task: Task = {
        id: uid(),
        title: result.title,
        materialIds: selectedMaterials,
        subtasks: result.subtasks as SubTask[],
        createdAt: Date.now(),
        status: 'active',
      };
      onTaskCreated(task);
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
          <h2>正在拆解任务...</h2>
          <p className="loading-hint">AI 正在阅读你的资料，把大任务切成小步骤</p>
          {streamText && (
            <div className="stream-preview">
              <pre>{streamText.slice(-300)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>新任务</h2>
        <div />
      </header>

      <main className="form-main">
        <div className="field">
          <label>你想完成什么？</label>
          <textarea
            className="textarea textarea--big"
            placeholder="例如：完成毕业论文第三章、学会 React 基础、整理杂乱的卧室..."
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>

        {materials.length > 0 && (
          <div className="field">
            <label>选择参考资料（AI 会基于这些拆解任务）</label>
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

        {materials.length === 0 && (
          <div className="tip-box">
            💡 没有资料也没关系，AI 会根据任务描述来拆解。如果想让结果更准确，可以先在「资料库」里上传相关资料。
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

        <button
          className="btn-primary"
          onClick={handleBreakdown}
          disabled={!taskTitle.trim()}
        >
          🪄 AI 帮我拆解
        </button>
      </main>
    </div>
  );
}
