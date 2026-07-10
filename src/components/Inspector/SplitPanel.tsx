'use client';
import { useStore } from '@/store/useStore';
import { Switch } from '@/components/ui/switch';

export function SplitPanel() {
  const split = useStore((s) => s.split);
  const syncZoom = useStore((s) => s.syncZoom);
  const setSplit = useStore((s) => s.setSplit);
  const setSyncZoom = useStore((s) => s.setSyncZoom);

  return (
    <div className="space-y-1">
      <Switch
        label="Split view"
        checked={split}
        onCheckedChange={setSplit}
      />
      <Switch
        label="Synchronize zoom & pan"
        checked={syncZoom}
        onCheckedChange={setSyncZoom}
      />

      <div className="mt-4 py-3 px-3 bg-white/6 rounded-xl">
        <p className="text-xs text-[#A39D93] leading-relaxed">
          Split view shows your clean reference alongside the gridded version side by side.
          Enable sync to pan and zoom both panes together.
        </p>
      </div>
    </div>
  );
}
