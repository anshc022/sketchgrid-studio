'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Eye } from 'lucide-react';

export function FocusDot() {
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);

  return (
    <AnimatePresence>
      {focus && (
        <motion.button
          key="focus-dot"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          onClick={() => setFocus(false)}
          className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full bg-[#5FB6E8]/20 border border-[#5FB6E8]/40 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Exit focus mode"
        >
          <Eye size={20} className="text-[#5FB6E8]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
