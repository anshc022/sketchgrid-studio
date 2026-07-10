'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export function Toast() {
  const toast = useStore((s) => s.toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div className="bg-[rgba(32,30,28,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            <p className="text-[#EDEAE3] text-sm font-medium whitespace-nowrap">{toast}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
