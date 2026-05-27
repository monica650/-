import { useState, useCallback } from 'react';
import type { Store, Material, Task, SubTask } from '../types';

const STORAGE_KEY = 'adhd-task-breaker';

const defaultStore: Store = {
  apiKey: '',
  materials: [],
  tasks: [],
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

  const addTask = useCallback((task: Task) => {
    setStore(prev => {
      const next = { ...prev, tasks: [task, ...prev.tasks] };
      save(next);
      return next;
    });
  }, []);

  const updateTask = useCallback((taskId: string, updater: (task: Task) => Task) => {
    setStore(prev => {
      const next = {
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? updater(t) : t)),
      };
      save(next);
      return next;
    });
  }, []);

  const completeSubTask = useCallback((taskId: string, subtaskId: string) => {
    function markDone(subtasks: SubTask[]): SubTask[] {
      return subtasks.map(st => {
        if (st.id === subtaskId) return { ...st, completed: true, completedAt: Date.now() };
        if (st.subtasks.length > 0) return { ...st, subtasks: markDone(st.subtasks) };
        return st;
      });
    }

    setStore(prev => {
      const next = {
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.id !== taskId) return t;
          const updated = { ...t, subtasks: markDone(t.subtasks) };
          const leaves = getLeafSubtasks(updated.subtasks);
          if (leaves.every(l => l.completed)) {
            updated.status = 'completed';
          }
          return updated;
        }),
      };
      save(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setStore(prev => {
      const next = { ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) };
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
    addTask,
    updateTask,
    completeSubTask,
    deleteTask,
    setReminder,
  };
}

export function getLeafSubtasks(subtasks: SubTask[]): SubTask[] {
  const leaves: SubTask[] = [];
  function walk(sts: SubTask[]) {
    for (const st of sts) {
      if (st.subtasks.length === 0) {
        leaves.push(st);
      } else {
        walk(st.subtasks);
      }
    }
  }
  walk(subtasks);
  return leaves;
}

export function getProgress(task: Task): number {
  const leaves = getLeafSubtasks(task.subtasks);
  if (leaves.length === 0) return 0;
  return (leaves.filter(l => l.completed).length / leaves.length) * 100;
}

export function getNextLeaf(task: Task): SubTask | null {
  const leaves = getLeafSubtasks(task.subtasks);
  return leaves.find(l => !l.completed) ?? null;
}
