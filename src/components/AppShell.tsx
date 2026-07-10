'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useImagePipeline } from '@/hooks/useImagePipeline';
import { TopBar } from './Toolbar/TopBar';
import { LeftRail } from './Toolbar/LeftRail';
import { BottomBar } from './Toolbar/BottomBar';
import { Inspector } from './Inspector/Inspector';
import { SketchCanvas } from './Canvas/SketchCanvas';
import { EmptyState } from './EmptyState';
import { FocusDot } from './FocusDot';
import { Toast } from './Toast';
import { readProjects, readSession, writeProject, writeSession } from '@/lib/db';
import { thumbURL } from '@/lib/imageProcessing';
import type { CropRect, ProjectRecord } from '@/types';

export default function AppShell() {
  const project = useStore((s) => s.project);
  const setTool = useStore((s) => s.setTool);
  const setCrop = useStore((s) => s.setCrop);
  const loadProject = useStore((s) => s.loadProject);
  const showToast = useStore((s) => s.showToast);
  const commit = useStore((s) => s.commit);
  const focus = useStore((s) => s.focus);
  const zoomPct = useStore((s) => s.zoomPct);
  const setZoomPct = useStore((s) => s.setZoomPct);

  const { orientedCanvas, processedCanvas, loadFile, loadSample } = useImagePipeline();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fitAllRef = useRef<(() => void) | null>(null);
  const zoomRef = useRef<((factor: number) => void) | null>(null);

  const [cropping, setCropping] = useState(false);
  const [cropDraft, setCropDraft] = useState<CropRect | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [a2hsPrompt, setA2hsPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Register A2HS
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setA2hsPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Session restore
  useEffect(() => {
    readSession().then((id) => {
      if (!id) return;
      readProjects().then((projects) => {
        const rec = projects.find((p) => p.id === id);
        if (rec) {
          const proj = {
            id: rec.id,
            name: rec.name,
            updated: rec.updated,
            img: rec.data.img,
            orient: rec.data.orient,
            crop: rec.data.crop,
            grid: rec.data.grid,
            filters: rec.data.filters,
          };
          loadProject(proj);
        }
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save (debounced 900ms)
  useEffect(() => {
    if (!project.img) return;
    const t = setTimeout(async () => {
      const thumb = processedCanvas ? thumbURL(processedCanvas) : '';
      const rec: ProjectRecord = {
        id: project.id,
        name: project.name,
        updated: project.updated,
        thumb,
        data: {
          img: project.img,
          orient: project.orient,
          crop: project.crop,
          grid: project.grid,
          filters: project.filters,
        },
      };
      await writeProject(rec).catch(console.error);
      await writeSession(project.id).catch(console.error);
    }, 900);
    return () => clearTimeout(t);
  }, [project, processedCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.getState().redo();
        } else {
          useStore.getState().undo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        useStore.getState().redo();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        fitAllRef.current?.();
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        useStore.getState().setGrid({ on: !useStore.getState().project.grid.on });
        return;
      }
      if (e.key === '+' || e.key === '=') {
        zoomRef.current?.(1.2);
        return;
      }
      if (e.key === '-') {
        zoomRef.current?.(1 / 1.2);
        return;
      }
      if (e.key === 'Escape') {
        if (cropping) {
          handleCropCancel();
        } else {
          setTool(null);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cropping, setTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) loadFile(file);
  };

  // Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/')
      );
      if (item) {
        const file = item.getAsFile();
        if (file) loadFile(file);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadFile]);

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
      setTool(null);
    }
    e.target.value = '';
  };

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Crop
  const handleCropApply = () => {
    if (cropDraft) {
      setCrop(cropDraft);
      commit();
    }
    setCropping(false);
    setTool(null);
    showToast('Crop applied');
  };

  const handleCropCancel = () => {
    setCropping(false);
    setCropDraft(null);
    setTool(null);
  };

  // Enter/exit crop mode with the crop tool
  const activeTool = useStore((s) => s.activeTool);
  useEffect(() => {
    if (activeTool === 'crop') {
      setCropping(true);
    } else {
      setCropping(false);
      setCropDraft(null);
      useStore.getState().setCropAspect(0);
    }
  }, [activeTool]);

  // Toolbar visibility during focus mode
  const toolbarStyle = {
    opacity: focus ? 0 : 1,
    pointerEvents: focus ? ('none' as const) : ('auto' as const),
    transition: 'opacity 0.3s ease',
  };

  // Zoom cycle
  const handleZoomCycle = () => {
    const current = zoomPct;
    if (current < 95) {
      // Go to 100%
      zoomRef.current?.((100 / current) * 0.01 * 100);
    } else if (current < 190) {
      // Go to 200%
      zoomRef.current?.((200 / current));
    } else {
      fitAllRef.current?.();
    }
  };

  const registerFitAll = useCallback((fn: () => void) => {
    fitAllRef.current = fn;
  }, []);

  const registerZoom = useCallback((fn: (factor: number) => void) => {
    zoomRef.current = fn;
  }, []);

  const handleCropChange = useCallback((crop: CropRect) => {
    setCropDraft(crop);
  }, []);

  const hasImage = !!project.img;

  return (
    <div
      className="fixed inset-0 bg-[#232120]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbars */}
      <div style={toolbarStyle}>
        <TopBar
          onExport={() => setTool('export')}
          zoomPct={zoomPct}
          onZoomCycle={handleZoomCycle}
        />
        <LeftRail />
        <BottomBar
          onZoomIn={() => zoomRef.current?.(1.2)}
          onZoomOut={() => zoomRef.current?.(1 / 1.2)}
          onFitAll={() => fitAllRef.current?.()}
        />
      </div>

      {/* Canvas */}
      <SketchCanvas
        processedCanvas={processedCanvas}
        orientedCanvas={orientedCanvas}
        cropping={cropping}
        onCropChange={handleCropChange}
        onViewChange={setZoomPct}
        registerFitAll={registerFitAll}
        registerZoom={registerZoom}
      />

      {/* Inspector panel */}
      <div style={toolbarStyle}>
        <Inspector
          onImport={triggerImport}
          onSample={() => { loadSample(); setTool(null); }}
          onCropApply={handleCropApply}
          onCropCancel={handleCropCancel}
          processedCanvas={processedCanvas}
          orientedCanvas={orientedCanvas}
        />
      </div>

      {/* Empty state */}
      {!hasImage && (
        <EmptyState onImport={triggerImport} onSample={loadSample} />
      )}

      {/* Focus dot */}
      <FocusDot />

      {/* Toast */}
      <Toast />

      {/* Drag overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(95,182,232,0.15)', backdropFilter: 'blur(2px)' }}
          >
            <div className="border-2 border-dashed border-[#5FB6E8] rounded-2xl px-10 py-6 text-center">
              <p className="text-[#5FB6E8] font-semibold text-lg">Drop image here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A2HS banner */}
      <AnimatePresence>
        {a2hsPrompt && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(32,30,28,0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span className="text-sm text-[#EDEAE3]">Add SketchGrid to your home screen?</span>
            <button
              type="button"
              className="text-sm font-semibold text-[#5FB6E8] hover:text-[#7AC4EE]"
              onClick={() => {
                a2hsPrompt.prompt();
                setA2hsPrompt(null);
              }}
            >
              Add
            </button>
            <button
              type="button"
              className="text-sm text-[#A39D93]"
              onClick={() => setA2hsPrompt(null)}
            >
              Not now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}

// Type for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
