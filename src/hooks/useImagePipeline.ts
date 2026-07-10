'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import {
  buildOriented,
  buildProcessed,
  storableDataURL,
  mkCanvas,
} from '@/lib/imageProcessing';

export function useImagePipeline() {
  const project = useStore((s) => s.project);
  const newProjectWithImage = useStore((s) => s.newProjectWithImage);
  const showToast = useStore((s) => s.showToast);

  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const [orientedCanvas, setOrientedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);

  const orientedRef = useRef<HTMLCanvasElement | null>(null);

  // Rebuild processed canvas
  const rebuildProcessed = useCallback(
    (oriented: HTMLCanvasElement) => {
      const processed = buildProcessed(oriented, project.crop, project.filters);
      setProcessedCanvas(processed);
    },
    [project.crop, project.filters]
  );

  // Rebuild oriented canvas
  const rebuildOriented = useCallback(
    (img: HTMLImageElement) => {
      const oriented = buildOriented(img, project.orient);
      orientedRef.current = oriented;
      setOrientedCanvas(oriented);
      rebuildProcessed(oriented);
    },
    [project.orient, rebuildProcessed]
  );

  // When img data URL changes, load new image
  useEffect(() => {
    if (!project.img) {
      setOrientedCanvas(null);
      setProcessedCanvas(null);
      baseImgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      baseImgRef.current = img;
      rebuildOriented(img);
    };
    img.onerror = () => showToast('Failed to load image');
    img.src = project.img;
  }, [project.img]); // eslint-disable-line react-hooks/exhaustive-deps

  // When orient changes, rebuild oriented + processed
  useEffect(() => {
    if (!baseImgRef.current) return;
    rebuildOriented(baseImgRef.current);
  }, [project.orient]); // eslint-disable-line react-hooks/exhaustive-deps

  // When crop/filters change, rebuild processed only
  useEffect(() => {
    if (!orientedRef.current) return;
    rebuildProcessed(orientedRef.current);
  }, [project.crop, project.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFromDataURL = useCallback(
    (dataUrl: string) => {
      newProjectWithImage(dataUrl);
    },
    [newProjectWithImage]
  );

  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const url = storableDataURL(img);
          // Every import starts a fresh project with default settings
          const base = file.name.replace(/\.[^.]+$/, '').slice(0, 40);
          newProjectWithImage(url, base || undefined);
          showToast('Reference loaded — pinch to zoom, drag to pan');
        };
        img.onerror = () => showToast('Failed to load image');
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [newProjectWithImage, showToast]
  );

  const loadSample = useCallback(() => {
    // Programmatic still life
    const W = 800;
    const H = 600;
    const c = mkCanvas(W, H);
    const ctx = c.getContext('2d')!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#C8B89A');
    bg.addColorStop(1, '#8C7B6B');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Table surface
    ctx.fillStyle = '#A08060';
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Cast shadows
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(W * 0.27, H * 0.63, 70, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.55, H * 0.63, 52, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.76, H * 0.65, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sphere (left)
    const sg = ctx.createRadialGradient(W * 0.24, H * 0.33, 10, W * 0.27, H * 0.38, 95);
    sg.addColorStop(0, '#FFFFFF');
    sg.addColorStop(0.3, '#E8D5B0');
    sg.addColorStop(0.7, '#C4904A');
    sg.addColorStop(1, '#7A4E1A');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(W * 0.27, H * 0.46, 95, 0, Math.PI * 2);
    ctx.fill();

    // Cube (centre)
    ctx.fillStyle = '#D4C09A';
    ctx.beginPath();
    ctx.moveTo(W * 0.47, H * 0.24);
    ctx.lineTo(W * 0.63, H * 0.30);
    ctx.lineTo(W * 0.63, H * 0.62);
    ctx.lineTo(W * 0.47, H * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#B8A27E';
    ctx.beginPath();
    ctx.moveTo(W * 0.47, H * 0.24);
    ctx.lineTo(W * 0.63, H * 0.30);
    ctx.lineTo(W * 0.73, H * 0.22);
    ctx.lineTo(W * 0.57, H * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9A856A';
    ctx.beginPath();
    ctx.moveTo(W * 0.63, H * 0.30);
    ctx.lineTo(W * 0.73, H * 0.22);
    ctx.lineTo(W * 0.73, H * 0.54);
    ctx.lineTo(W * 0.63, H * 0.62);
    ctx.closePath();
    ctx.fill();

    // Jug / pitcher (right)
    ctx.fillStyle = '#8FA89C';
    ctx.beginPath();
    ctx.ellipse(W * 0.77, H * 0.34, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7B9490';
    ctx.beginPath();
    ctx.moveTo(W * 0.74, H * 0.34);
    ctx.bezierCurveTo(W * 0.70, H * 0.42, W * 0.68, H * 0.54, W * 0.70, H * 0.63);
    ctx.lineTo(W * 0.84, H * 0.63);
    ctx.bezierCurveTo(W * 0.86, H * 0.54, W * 0.84, H * 0.42, W * 0.80, H * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6B8480';
    ctx.beginPath();
    ctx.ellipse(W * 0.77, H * 0.63, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Handle
    ctx.strokeStyle = '#6B8480';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.bezierCurveTo(W * 0.83, H * 0.42, W * 0.92, H * 0.42, W * 0.89, H * 0.55);
    ctx.moveTo(W * 0.80, H * 0.40);
    ctx.bezierCurveTo(W * 0.92, H * 0.38, W * 0.96, H * 0.52, W * 0.84, H * 0.58);
    ctx.stroke();

    // Subtle highlight on table
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, H * 0.6, W, 3);

    const url = c.toDataURL('image/jpeg', 0.92);
    newProjectWithImage(url, 'Still life study');
  }, [newProjectWithImage]);

  return {
    orientedCanvas,
    processedCanvas,
    loadFromDataURL,
    loadFile,
    loadSample,
  };
}
