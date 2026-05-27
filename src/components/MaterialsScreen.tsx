import { useState, useRef } from 'react';
import type { Material } from '../types';

interface Props {
  materials: Material[];
  onAdd: (material: Material) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function MaterialsScreen({ materials, onAdd, onDelete, onBack }: Props) {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = ev => setContent(String(ev.target?.result ?? ''));
    reader.readAsText(file, 'utf-8');
  }

  function handleSave() {
    if (!name.trim() || !content.trim()) return;
    onAdd({ id: uid(), name: name.trim(), content: content.trim(), createdAt: Date.now() });
    setName('');
    setContent('');
    setMode('list');
  }

  if (mode === 'add') {
    return (
      <div className="screen">
        <header className="topbar">
          <button className="back-btn" onClick={() => setMode('list')}>← 返回</button>
          <h2>添加资料</h2>
          <div />
        </header>
        <main className="form-main">
          <div className="field">
            <label>资料名称</label>
            <input
              type="text"
              placeholder="例如：项目背景、学习笔记"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="field">
            <label>内容</label>
            <div className="upload-row">
              <button className="btn-outline" onClick={() => fileRef.current?.click()}>
                📎 上传文件（txt/md）
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.csv"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
            </div>
            <textarea
              className="textarea"
              placeholder="或者直接粘贴文本内容..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !content.trim()}
          >
            保存资料
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>📚 资料库</h2>
        <button className="icon-btn" onClick={() => setMode('add')}>＋</button>
      </header>

      <main className="dashboard-main">
        {materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>还没有资料</h2>
            <p>上传你的学习笔记、项目背景等，AI 会根据这些来拆解任务</p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setMode('add')}>
              添加第一份资料
            </button>
          </div>
        ) : (
          <div className="material-list">
            {materials.map(m => (
              <div key={m.id} className="material-card">
                <div className="material-info">
                  <span className="material-name">{m.name}</span>
                  <span className="material-meta">{m.content.length} 字</span>
                </div>
                <button
                  className="task-delete-btn"
                  onClick={() => {
                    if (confirm(`删除「${m.name}」？`)) onDelete(m.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="btn-outline add-more-btn" onClick={() => setMode('add')}>
              ＋ 添加更多资料
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
