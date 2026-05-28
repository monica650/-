import { useState, useCallback } from 'react';
import type { Store, Material, Project, DailyTask } from '../types';

const STORAGE_KEY = 'adhd-planner-v2';

const defaultStore: Store = {
  apiKey: '',
  materials: [],
  projects: [],
  reminderEnabled: false,
  reminderTime: '09:00',
};

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore;
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return defaultStore;
  }
}

function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useStore() {
  const [store, setStore] = useState<Store>(load);

  const update = useCallback((partial: Partial<Store>) => {
    setStore(prev => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  const setApiKey = useCallback((apiKey: string) => update({ apiKey }), [update]);

  const addMaterial = useCallback((material: Material) => {
    setStore(prev => {
      const next = { ...prev, materials: [...prev.materials, material] };
      save(next);
      return next;
    });
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setStore(prev => {
      const next = { ...prev, materials: prev.materials.filter(m => m.id !== id) };
      save(next);
      return next;
    });
  }, []);

  const addProject = useCallback((project: Project) => {
    setStore(prev => {
      const next = { ...prev, projects: [project, ...prev.projects] };
      save(next);
      return next;
    });
  }, []);

  const completeTask = useCallback((projectId: string, dayNum: number, taskId: string) => {
    setStore(prev => {
      const next = {
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p;
          const updated = {
            ...p,
            days: p.days.map(d => {
              if (d.dayNum !== dayNum) return d;
              return {
                ...d,
                minTasks: d.minTasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                bonusTasks: d.bonusTasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
              };
            }),
          };
          const allDone = updated.days.every(d =>
            d.minTasks.every(t => t.completed)
          );
          return { ...updated, status: allDone ? 'completed' as const : 'active' as const };
        }),
      };
      save(next);
      return next;
    });
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setStore(prev => {
      const next = { ...prev, projects: prev.projects.filter(p => p.id !== projectId) };
      save(next);
      return next;
    });
  }, []);

  const setReminder = useCallback(
    (enabled: boolean, time: string) => update({ reminderEnabled: enabled, reminderTime: time }),
    [update]
  );

  return {
    store,
    setApiKey,
    addMaterial,
    deleteMaterial,
    addProject,
    completeTask,
    deleteProject,
    setReminder,
  };
}

export function getCurrentDayNum(project: Project): number {
  const start = new Date(project.startDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(diff + 1, project.totalDays));
}

export function getTodayData(project: Project) {
  const dayNum = getCurrentDayNum(project);
  return project.days.find(d => d.dayNum === dayNum) ?? null;
}

export function getProjectProgress(project: Project): number {
  let total = 0;
  let done = 0;
  for (const d of project.days) {
    total += d.minTasks.length;
    done += d.minTasks.filter(t => t.completed).length;
  }
  if (total === 0) return 0;
  return (done / total) * 100;
}

export function getDayProgress(day: { minTasks: DailyTask[] }): number {
  if (day.minTasks.length === 0) return 0;
  return (day.minTasks.filter(t => t.completed).length / day.minTasks.length) * 100;
}
