import { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
}

export function SetupScreen({ onSave }: Props) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (trimmed.length < 10) {
      setError('API Key 好像太短了，请重新粘贴');
      return;
    }
    onSave(trimmed);
  }

  return (
    <div className="screen setup-screen">
      <div className="setup-card">
        <div className="setup-icon">🧩</div>
        <h1>一步一步</h1>
        <p className="setup-subtitle">专为 ADHD 设计的每日任务规划工具</p>

        <div className="setup-steps">
          <div className="setup-step">
            <span className="step-num">1</span>
            <span>打开 <strong>aistudio.google.com</strong>（需能访问 Google）</span>
          </div>
          <div className="setup-step">
            <span className="step-num">2</span>
            <span>点右上角「Get API key」→「Create API key」</span>
          </div>
          <div className="setup-step">
            <span className="step-num">3</span>
            <span>复制 Key，粘贴到下方。免费，无需充值</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="password"
            placeholder="AIza..."
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            className="key-input"
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={!key.trim()}>
            开始使用 →
          </button>
        </form>

        <p className="setup-note">Key 只存在你的浏览器本地，不会上传任何服务器</p>
      </div>
    </div>
  );
}
