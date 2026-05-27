import { useState } from 'react';

interface Props {
  apiKey: string;
  reminderEnabled: boolean;
  reminderTime: string;
  onSaveApiKey: (key: string) => void;
  onSaveReminder: (enabled: boolean, time: string) => void;
  onBack: () => void;
}

export function SettingsScreen({
  apiKey,
  reminderEnabled,
  reminderTime,
  onSaveApiKey,
  onSaveReminder,
  onBack,
}: Props) {
  const [key, setKey] = useState(apiKey);
  const [enabled, setEnabled] = useState(reminderEnabled);
  const [time, setTime] = useState(reminderTime);
  const [saved, setSaved] = useState(false);

  async function handleEnableReminder(val: boolean) {
    setEnabled(val);
    if (val && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setEnabled(false);
        alert('请在浏览器设置中允许通知权限');
        return;
      }
    }
    onSaveReminder(val, time);
  }

  function handleSave() {
    const trimmed = key.trim();
    if (trimmed) onSaveApiKey(trimmed);
    onSaveReminder(enabled, time);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>⚙️ 设置</h2>
        <div />
      </header>

      <main className="form-main">
        <div className="field">
          <label>DeepSeek API Key</label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            className="text-input"
            placeholder="sk-xxxxxxxxxxxxxxxx"
          />
        </div>

        <div className="field">
          <label>每日提醒</label>
          <div className="reminder-row">
            <button
              className={`toggle-btn ${enabled ? 'toggle-btn--on' : ''}`}
              onClick={() => handleEnableReminder(!enabled)}
            >
              {enabled ? '✓ 已开启' : '关闭'}
            </button>
            {enabled && (
              <input
                type="time"
                value={time}
                onChange={e => {
                  setTime(e.target.value);
                  onSaveReminder(true, e.target.value);
                }}
                className="time-input"
              />
            )}
          </div>
          {enabled && (
            <p className="field-hint">每天 {time} 会弹出浏览器通知提醒你</p>
          )}
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
      </main>
    </div>
  );
}
