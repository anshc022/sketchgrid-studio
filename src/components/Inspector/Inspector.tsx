'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { GridPanel } from './GridPanel';
import { FiltersPanel } from './FiltersPanel';
import { CropPanel } from './CropPanel';
import { SplitPanel } from './SplitPanel';
import { ExportPanel } from './ExportPanel';
import { ProjectsPanel } from './ProjectsPanel';
import { ImportPanel } from './ImportPanel';
import { EffectsPanel } from './EffectsPanel';
import { useIsMobile } from '@/hooks/useIsMobile';

const PANEL_TITLES: Record<string, string> = {
  import: 'Import',
  crop: 'Crop & Orient',
  grid: 'Grid',
  filters: 'Filters',
  effects: 'Effects',
  split: 'Split View',
  projects: 'Projects',
  export: 'Export',
};

interface InspectorProps {
  onImport: () => void;
  onSample: () => void;
  onCropApply: () => void;
  onCropCancel: () => void;
  processedCanvas: HTMLCanvasElement | null;
  orientedCanvas: HTMLCanvasElement | null;
}

export function Inspector({
  onImport,
  onSample,
  onCropApply,
  onCropCancel,
  processedCanvas,
  orientedCanvas,
}: InspectorProps) {
  const activeTool = useStore((s) => s.activeTool);
  const setTool = useStore((s) => s.setTool);
  const isMobile = useIsMobile();

  const panelStyle: React.CSSProperties = isMobile
    ? {
        // Bottom sheet above the phone tool bar
        left: 0,
        right: 0,
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        maxHeight: '58vh',
        background: 'rgba(32,30,28,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -10px 34px rgba(0,0,0,0.45)',
      }
    : {
        top: 68,
        bottom: 68,
        right: 12,
        width: 320,
        background: 'rgba(32,30,28,0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 22,
        boxShadow: '0 10px 34px rgba(0,0,0,0.45)',
      };

  return (
    <AnimatePresence>
      {activeTool && (
        <motion.div
          key={`inspector-${isMobile ? 'sheet' : 'panel'}`}
          initial={isMobile ? { y: '110%' } : { x: '110%', opacity: 0 }}
          animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
          exit={isMobile ? { y: '110%' } : { x: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="fixed z-50 flex flex-col"
          style={panelStyle}
        >
          {/* Sheet grabber (phones) */}
          {isMobile && (
            <div className="flex justify-center pt-2 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/25" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
            <h2 className="font-semibold text-[#EDEAE3] text-base">
              {PANEL_TITLES[activeTool ?? ''] ?? ''}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTool(null)}
              aria-label="Close panel"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-1">
            {activeTool === 'import' && (
              <ImportPanel onImport={onImport} onSample={onSample} />
            )}
            {activeTool === 'grid' && <GridPanel />}
            {activeTool === 'filters' && (
              <FiltersPanel processedCanvas={processedCanvas} />
            )}
            {activeTool === 'effects' && (
              <EffectsPanel orientedCanvas={orientedCanvas} />
            )}
            {activeTool === 'crop' && (
              <CropPanel onApply={onCropApply} onCancel={onCropCancel} />
            )}
            {activeTool === 'split' && <SplitPanel />}
            {activeTool === 'export' && (
              <ExportPanel
                processedCanvas={processedCanvas}
                orientedCanvas={orientedCanvas}
              />
            )}
            {activeTool === 'projects' && <ProjectsPanel />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
