'use client';
import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('./AppShell'), { ssr: false });

export function ClientRoot() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AppShell />
    </div>
  );
}
