import { useState } from 'react';
import { useStore } from './hooks/useStore';
import { useNotifications } from './hooks/useNotifications';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { MaterialsScreen } from './components/MaterialsScreen';
import { NewTaskScreen } from './components/NewTaskScreen';
import { FocusScreen } from './components/FocusScreen';
import { SettingsScreen } from './components/SettingsScreen';
import type { View, Task } from './types';

export default function App() {
  const {
    store,
    setApiKey,
    addMaterial,
    deleteMaterial,
    addTask,
    completeSubTask,
    deleteTask,
    setReminder,
  } = useStore();

  const [view, setView] = useState<View>(store.apiKey ? 'dashboard' : 'setup');
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  useNotifications(store.reminderEnabled, store.reminderTime);

  const currentTask = focusTaskId ? store.tasks.find(t => t.id === focusTaskId) ?? null : null;

  function handleSaveApiKey(key: string) {
    setApiKey(key);
    setView('dashboard');
  }

  function handleFocus(taskId: string) {
    setFocusTaskId(taskId);
    setView('focus');
  }

  function handleTaskCreated(task: Task) {
    addTask(task);
    setFocusTaskId(task.id);
    setView('focus');
  }

  if (view === 'setup' || !store.apiKey) {
    return <SetupScreen onSave={handleSaveApiKey} />;
  }

  if (view === 'materials') {
    return (
      <MaterialsScreen
        materials={store.materials}
        onAdd={addMaterial}
        onDelete={deleteMaterial}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'new-task') {
    return (
      <NewTaskScreen
        apiKey={store.apiKey}
        materials={store.materials}
        onBack={() => setView('dashboard')}
        onTaskCreated={handleTaskCreated}
      />
    );
  }

  if (view === 'focus' && currentTask) {
    return (
      <FocusScreen
        task={currentTask}
        onComplete={subtaskId => completeSubTask(currentTask.id, subtaskId)}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'settings') {
    return (
      <SettingsScreen
        apiKey={store.apiKey}
        reminderEnabled={store.reminderEnabled}
        reminderTime={store.reminderTime}
        onSaveApiKey={setApiKey}
        onSaveReminder={setReminder}
        onBack={() => setView('dashboard')}
      />
    );
  }

  return (
    <Dashboard
      tasks={store.tasks}
      onNewTask={() => setView('new-task')}
      onFocus={handleFocus}
      onMaterials={() => setView('materials')}
      onSettings={() => setView('settings')}
      onDeleteTask={deleteTask}
    />
  );
}
