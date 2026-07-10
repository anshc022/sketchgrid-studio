'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { readProjects, deleteProject, clearAll } from '@/lib/db';
import type { ProjectRecord } from '@/types';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProjectsPanel() {
  const loadProject = useStore((s) => s.loadProject);
  const newProject = useStore((s) => s.newProject);
  const setTool = useStore((s) => s.setTool);
  const showToast = useStore((s) => s.showToast);
  const currentId = useStore((s) => s.project.id);

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const loadList = useCallback(async () => {
    const list = await readProjects();
    list.sort((a, b) => b.updated - a.updated);
    setProjects(list);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openProject = (rec: ProjectRecord) => {
    const project = {
      id: rec.id,
      name: rec.name,
      updated: rec.updated,
      img: rec.data.img,
      orient: rec.data.orient,
      crop: rec.data.crop,
      grid: rec.data.grid,
      filters: rec.data.filters,
    };
    loadProject(project);
    setTool(null);
    showToast(`Opened "${rec.name}"`);
  };

  const handleDelete = async (id: string) => {
    if (deleteTarget === id) {
      await deleteProject(id);
      setDeleteTarget(null);
      await loadList();
      showToast('Project deleted');
    } else {
      setDeleteTarget(id);
      setTimeout(() => setDeleteTarget(null), 2500);
    }
  };

  const handleClearAll = async () => {
    if (clearConfirm) {
      await clearAll();
      setClearConfirm(false);
      newProject();
      await loadList();
      showToast('All projects cleared');
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  const handleNew = () => {
    newProject();
    setTool(null);
    showToast('New project created');
  };

  return (
    <div className="space-y-3">
      <Button variant="default" size="md" className="w-full" onClick={handleNew}>
        <Plus size={16} className="mr-2" />
        New project
      </Button>

      {projects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[#A39D93] text-sm">No saved projects yet.</p>
          <p className="text-[#A39D93] text-xs mt-1">
            Import an image to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((rec) => (
            <div
              key={rec.id}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                currentId === rec.id
                  ? 'bg-[#5FB6E8]/10 border border-[#5FB6E8]/30'
                  : 'bg-white/6 hover:bg-white/10'
              }`}
              onClick={() => openProject(rec)}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
                {rec.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rec.thumb}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#EDEAE3] font-medium truncate">{rec.name}</p>
                <p className="text-xs text-[#A39D93] mt-0.5">{formatDate(rec.updated)}</p>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(rec.id);
                }}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                  deleteTarget === rec.id
                    ? 'bg-[#E06A50] text-white'
                    : 'text-[#A39D93] hover:text-[#E06A50] hover:bg-[#E06A50]/10'
                }`}
                aria-label={deleteTarget === rec.id ? 'Tap again to confirm delete' : 'Delete project'}
              >
                {deleteTarget === rec.id ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="h-px bg-white/8 mt-4" />
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            onClick={handleClearAll}
          >
            {clearConfirm ? 'Tap again to confirm clear all' : 'Clear all projects'}
          </Button>
        </>
      )}
    </div>
  );
}
