import { create } from 'zustand';
import { uid } from '@/lib/utils';
import type { Project, GridSettings, FilterSettings, OrientSettings, CropRect, ToolId } from '@/types';

export function defaultFilters(): FilterSettings {
  return {
    brightness: 100,
    contrast: 100,
    exposure: 100,
    saturation: 100,
    grayscale: 0,
    posterize: 0,
    edge: 'off',
    edgeGain: 130,
    tint: 'none',
    tintAmt: 40,
  };
}

export function defaultProject(): Project {
  return {
    id: uid(),
    name: 'Untitled sketch',
    updated: Date.now(),
    img: null,
    orient: { rot: 0, fh: false, fv: false },
    crop: null,
    grid: {
      on: true,
      cols: 5,
      width: 2,
      color: '#5FB6E8',
      opacity: 0.8,
      labels: true,
      diag: false,
      thirds: false,
      radial: false,
      paper: 'a4',
      paperOrient: 'v',
    },
    filters: defaultFilters(),
  };
}

interface StoreState {
  project: Project;
  activeTool: ToolId;
  split: boolean;
  syncZoom: boolean;
  locked: boolean;
  focus: boolean;
  zoomPct: number;
  toast: string | null;
  undoStack: string[];
  redoStack: string[];
  prevSnap: string | null;
  cropAspect: number; // 0 = free, otherwise w/h ratio

  // Actions
  setProjectName: (name: string) => void;
  setGrid: (partial: Partial<GridSettings>) => void;
  setFilters: (partial: Partial<FilterSettings>) => void;
  setOrient: (orient: OrientSettings) => void;
  setCrop: (crop: CropRect | null) => void;
  setProjectImg: (img: string | null) => void;
  loadProject: (project: Project) => void;
  newProject: () => void;
  newProjectWithImage: (img: string, name?: string) => void;
  setTool: (tool: ToolId) => void;
  setSplit: (on: boolean) => void;
  setSyncZoom: (on: boolean) => void;
  setLocked: (on: boolean) => void;
  setFocus: (on: boolean) => void;
  setZoomPct: (pct: number) => void;
  setCropAspect: (a: number) => void;
  showToast: (msg: string) => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

function snapshot(p: Project): string {
  return JSON.stringify({
    name: p.name,
    orient: p.orient,
    crop: p.crop,
    grid: p.grid,
    filters: p.filters,
  });
}

function applySnapshot(p: Project, snap: string): Project {
  const parsed = JSON.parse(snap) as {
    name: string;
    orient: OrientSettings;
    crop: CropRect | null;
    grid: GridSettings;
    filters: FilterSettings;
  };
  return {
    ...p,
    name: parsed.name,
    orient: parsed.orient,
    crop: parsed.crop,
    grid: parsed.grid,
    filters: parsed.filters,
    updated: Date.now(),
  };
}

const initialProject = defaultProject();

export const useStore = create<StoreState>((set, get) => ({
  project: initialProject,
  activeTool: null,
  split: false,
  syncZoom: true,
  locked: false,
  focus: false,
  zoomPct: 100,
  toast: null,
  undoStack: [],
  redoStack: [],
  prevSnap: snapshot(initialProject),
  cropAspect: 0,

  setProjectName: (name) =>
    set((s) => ({ project: { ...s.project, name, updated: Date.now() } })),

  setGrid: (partial) =>
    set((s) => ({
      project: { ...s.project, grid: { ...s.project.grid, ...partial }, updated: Date.now() },
    })),

  setFilters: (partial) =>
    set((s) => ({
      project: { ...s.project, filters: { ...s.project.filters, ...partial }, updated: Date.now() },
    })),

  setOrient: (orient) =>
    set((s) => ({ project: { ...s.project, orient, updated: Date.now() } })),

  setCrop: (crop) =>
    set((s) => ({ project: { ...s.project, crop, updated: Date.now() } })),

  setProjectImg: (img) =>
    set((s) => ({ project: { ...s.project, img, updated: Date.now() } })),

  loadProject: (project) =>
    set({ project, undoStack: [], redoStack: [], prevSnap: snapshot(project) }),

  newProject: () => {
    const p = defaultProject();
    set({ project: p, undoStack: [], redoStack: [], prevSnap: snapshot(p) });
  },

  newProjectWithImage: (img, name) => {
    const p = { ...defaultProject(), img, ...(name ? { name } : {}) };
    set({ project: p, undoStack: [], redoStack: [], prevSnap: snapshot(p) });
  },

  setTool: (activeTool) => set({ activeTool }),

  setSplit: (split) => set({ split }),

  setSyncZoom: (syncZoom) => set({ syncZoom }),

  setLocked: (locked) => set({ locked }),

  setFocus: (focus) => set({ focus }),

  setZoomPct: (zoomPct) => set({ zoomPct }),

  setCropAspect: (cropAspect) => set({ cropAspect }),

  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 2200);
  },

  commit: () => {
    const { project, undoStack, prevSnap } = get();
    const now = snapshot(project);
    const base = prevSnap ?? now;
    if (now === base) {
      set({ prevSnap: now });
      return;
    }
    set({
      undoStack: [...undoStack, base].slice(-60),
      redoStack: [],
      prevSnap: now,
    });
  },

  undo: () => {
    const { project, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    const currentSnap = snapshot(project);
    const prev = undoStack[undoStack.length - 1];
    set({
      project: applySnapshot(project, prev),
      undoStack: undoStack.slice(0, -1),
      redoStack: [currentSnap, ...redoStack],
      prevSnap: prev,
    });
  },

  redo: () => {
    const { project, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    const currentSnap = snapshot(project);
    const next = redoStack[0];
    set({
      project: applySnapshot(project, next),
      undoStack: [...undoStack, currentSnap],
      redoStack: redoStack.slice(1),
      prevSnap: next,
    });
  },
}));
