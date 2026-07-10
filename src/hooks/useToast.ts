'use client';
import { useStore } from '@/store/useStore';

export function useToast() {
  const toast = useStore((s) => s.toast);
  return { toast };
}
