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
    if (!trimmed.startsWith('sk-')) {
      setError('API Key 格式不对，应该以 sk- 开头');
      return;
    }
    onSave(trimmed);
  }

  return (
    <div className="screen setup-screen">
      <div className="setup-card">
        <div className="setup-icon">🧩</div>
        <h1>一步一步</h1>
        <p className="setup-subtitle">专为 ADHD 设计的任务拆解工具</p>

        <div className="setup-steps">
          <div className="setup-step">
            <span className="step-num">1</span>
            <span>访问 <strong>platform.deepseek.com</strong> 注册账号</span>
          </div>
          <div className="setup-step">
            <span className="step-num">2</span>
            <span>进入「API Keys」，创建一个新 Key</span>
          </div>
          <div className="setup-step">
            <span className="step-num">3</span>
            <span>充值 ¥10（够用很久），粘贴到下方</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <input
            type="password"
            placeholder="sk-xxxxxxxxxxxxxxxx"
            value={key}
            onChange={e => {
              setKey(e.target.value);
              setError('');
            }}
            className="key-input"
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={!key.trim()}>
            开始使用 →
          </button>
        </form>

        <p className="setup-note">Key 只存在你的浏览器本地，不会上传到任何服务器</p>
      </div>
    </div>
  );
}
