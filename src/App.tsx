import { useState } from 'react';
import { useStore } from './hooks/useStore';
import { useNotifications } from './hooks/useNotifications';
import { SetupScreen } from './components/SetupScreen';
import { Dashboard } from './components/Dashboard';
import { MaterialsScreen } from './components/MaterialsScreen';
import { NewProjectScreen } from './components/NewProjectScreen';
import { TodayScreen } from './components/TodayScreen';
import { ProjectScreen } from './components/ProjectScreen';
import { SettingsScreen } from './components/SettingsScreen';
import type { View, Project } from './types';
import { getCurrentDayNum } from './hooks/useStore';

export default function App() {
  const { store, setApiKey, addMaterial, deleteMaterial, addProject, completeTask, setTaskUrl, deleteProject, setReminder } = useStore();
  const [view, setView] = useState<View>(store.apiKey ? 'dashboard' : 'setup');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [focusDayNum, setFocusDayNum] = useState<number | null>(null);

  useNotifications(store.reminderEnabled, store.reminderTime);

  const activeProject: Project | null = activeProjectId
    ? store.projects.find(p => p.id === activeProjectId) ?? null
    : null;

  function goToday(projectId: string) {
    setActiveProjectId(projectId);
    setFocusDayNum(null);
    setView('today');
  }

  function goProject(projectId: string) {
    setActiveProjectId(projectId);
    setView('project');
  }

  function handleProjectCreated(project: Project) {
    addProject(project);
    setActiveProjectId(project.id);
    setFocusDayNum(null);
    setView('today');
  }

  if (!store.apiKey || view === 'setup') {
    return <SetupScreen onSave={key => { setApiKey(key); setView('dashboard'); }} />;
  }

  if (view === 'materials') {
    return <MaterialsScreen materials={store.materials} onAdd={addMaterial} onDelete={deleteMaterial} onBack={() => setView('dashboard')} />;
  }

  if (view === 'new-project') {
    return (
      <NewProjectScreen
        apiKey={store.apiKey}
        materials={store.materials}
        onBack={() => setView('dashboard')}
        onProjectCreated={handleProjectCreated}
      />
    );
  }

  if (view === 'today' && activeProject) {
    const dayNum = focusDayNum ?? getCurrentDayNum(activeProject);
    const projectWithDay = { ...activeProject };
    return (
      <TodayScreen
        project={{ ...projectWithDay, days: projectWithDay.days }}
        onComplete={(dn, taskId) => completeTask(activeProject.id, dn, taskId)}
        onSetUrl={(dn, taskId, url) => setTaskUrl(activeProject.id, dn, taskId, url)}
        onBack={() => setView('dashboard')}
        key={dayNum}
      />
    );
  }

  if (view === 'project' && activeProject) {
    return (
      <ProjectScreen
        project={activeProject}
        onGoToDay={dn => { setFocusDayNum(dn); setView('today'); }}
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
      projects={store.projects}
      onNewProject={() => setView('new-project')}
      onToday={goToday}
      onProject={goProject}
      onMaterials={() => setView('materials')}
      onSettings={() => setView('settings')}
      onDeleteProject={deleteProject}
    />
  );
}
