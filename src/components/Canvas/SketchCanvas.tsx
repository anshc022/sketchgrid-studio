'use client';
import Konva from 'konva';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '@/store/useStore';
import { clamp, LETTERS } from '@/lib/utils';
import type { CropRect, GridSettings } from '@/types';

interface SketchCanvasProps {
  processedCanvas: HTMLCanvasElement | null;
  orientedCanvas: HTMLCanvasElement | null;
  cropping: boolean;
  onCropChange: (crop: CropRect) => void;
  onViewChange: (pct: number) => void;
  registerFitAll: (fn: () => void) => void;
  registerZoom: (fn: (factor: number) => void) => void;
}

interface Dims {
  W: number;
  H: number;
}

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export function SketchCanvas({
  processedCanvas,
  orientedCanvas,
  cropping,
  onCropChange,
  onViewChange,
  registerFitAll,
  registerZoom,
}: SketchCanvasProps) {
  const grid = useStore((s) => s.project.grid);
  const filters = useStore((s) => s.project.filters);
  const crop = useStore((s) => s.project.crop);
  const split = useStore((s) => s.split);
  const locked = useStore((s) => s.locked);
  const setCrop = useStore((s) => s.setCrop);
  const cropAspect = useStore((s) => s.cropAspect);

  const gridRef = useRef(grid);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const imageLayerRef = useRef<Konva.Layer | null>(null);
  const gridLayerRef = useRef<Konva.Layer | null>(null);
  const imageNodeRef = useRef<Konva.Image | null>(null);
  const tintNodeRef = useRef<Konva.Rect | null>(null);
  const gridShapeRef = useRef<Konva.Shape | null>(null);
  const dimsRef = useRef<Dims | null>(null);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const hasPannedRef = useRef(false);
  const hasFitRef = useRef(false);

  // Refs for gesture handling
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const velRef = useRef({ vx: 0, vy: 0 });
  const momentumRafRef = useRef<number | null>(null);
  const doubleTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMoveRef = useRef<{ x: number; y: number } | null>(null);
  const penActiveRef = useRef(false);

  // Crop drag
  const [cropDraft, setCropDraft] = useState<CropRect | null>(null);
  const cropDragRef = useRef<{
    handle: string;
    startCrop: CropRect;
    startPt: { x: number; y: number };
  } | null>(null);

  const getImgDims = useCallback((): Dims | null => dimsRef.current, []);

  const applyView = useCallback(
    (v: ViewState) => {
      viewRef.current = v;
      const s = stageRef.current;
      if (!s) return;
      s.x(v.x);
      s.y(v.y);
      s.scaleX(v.scale);
      s.scaleY(v.scale);
      s.batchDraw();
      onViewChange(Math.round(v.scale * 100));
    },
    [onViewChange]
  );

  const fitView = useCallback(() => {
    const dims = getImgDims();
    if (!dims || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const pad = 40;
    const scale = clamp(
      Math.min((width - pad) / dims.W, (height - pad) / dims.H),
      0.02,
      32
    );
    applyView({
      x: (width - dims.W * scale) / 2,
      y: (height - dims.H * scale) / 2,
      scale,
    });
    hasPannedRef.current = false;
  }, [getImgDims, applyView]);

  const zoomTo = useCallback(
    (factor: number) => {
      const s = stageRef.current;
      if (!s || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cx = width / 2;
      const cy = height / 2;
      const oldScale = viewRef.current.scale;
      const newScale = clamp(oldScale * factor, 0.02, 32);
      applyView({
        x: cx - (cx - viewRef.current.x) * (newScale / oldScale),
        y: cy - (cy - viewRef.current.y) * (newScale / oldScale),
        scale: newScale,
      });
    },
    [applyView]
  );

  // Initialize Konva stage
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    const stage = new Konva.Stage({
      container,
      width,
      height,
    });
    stageRef.current = stage;

    const imageLayer = new Konva.Layer();
    const gridLayer = new Konva.Layer();
    stage.add(imageLayer);
    stage.add(gridLayer);
    imageLayerRef.current = imageLayer;
    gridLayerRef.current = gridLayer;

    // Image node
    const imageNode = new Konva.Image({
      x: 0,
      y: 0,
      image: undefined as unknown as HTMLImageElement,
    });
    imageLayer.add(imageNode);
    imageNodeRef.current = imageNode;

    // Tint overlay
    const tintNode = new Konva.Rect({
      x: 0,
      y: 0,
      visible: false,
      globalCompositeOperation: 'color' as '' | 'source-over' | 'color',
    });
    imageLayer.add(tintNode);
    tintNodeRef.current = tintNode;

    // Grid shape
    const gridShape = new Konva.Shape({
      x: 0,
      y: 0,
      sceneFunc: (ctx: Konva.Context) => {
        const G = gridRef.current;
        const dims = dimsRef.current;
        if (!G.on || !dims) return;
        const { W, H } = dims;
        const cw = W / G.cols;
        const rows = Math.max(1, Math.round(H / cw));
        const currentScale = stageRef.current?.scaleX() ?? 1;
        const raw = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;

        // Main grid lines
        raw.save();
        raw.strokeStyle = G.color;
        raw.lineWidth = G.width / currentScale;
        raw.globalAlpha = G.opacity;
        raw.beginPath();
        for (let i = 0; i <= G.cols; i++) {
          raw.moveTo(i * cw, 0);
          raw.lineTo(i * cw, H);
        }
        for (let j = 0; j <= rows; j++) {
          const y = Math.min(j * cw, H);
          raw.moveTo(0, y);
          raw.lineTo(W, y);
        }
        raw.stroke();

        // Diagonals
        if (G.diag) {
          raw.beginPath();
          for (let col = 0; col < G.cols; col++) {
            for (let row = 0; row < rows; row++) {
              const x0 = col * cw;
              const y0 = row * cw;
              const x1 = (col + 1) * cw;
              const y1 = Math.min((row + 1) * cw, H);
              raw.moveTo(x0, y0);
              raw.lineTo(x1, y1);
              raw.moveTo(x1, y0);
              raw.lineTo(x0, y1);
            }
          }
          raw.globalAlpha = G.opacity * 0.5;
          raw.stroke();
        }

        // Rule of thirds
        if (G.thirds) {
          raw.save();
          raw.strokeStyle = '#FFFFF0';
          raw.globalAlpha = G.opacity * 0.75;
          raw.setLineDash([6 / currentScale, 6 / currentScale]);
          raw.beginPath();
          raw.moveTo(W / 3, 0); raw.lineTo(W / 3, H);
          raw.moveTo((2 * W) / 3, 0); raw.lineTo((2 * W) / 3, H);
          raw.moveTo(0, H / 3); raw.lineTo(W, H / 3);
          raw.moveTo(0, (2 * H) / 3); raw.lineTo(W, (2 * H) / 3);
          raw.stroke();
          raw.setLineDash([]);
          raw.restore();
        }

        // Radial guides
        if (G.radial) {
          raw.save();
          raw.strokeStyle = G.color;
          raw.globalAlpha = G.opacity * 0.6;
          raw.beginPath();
          raw.moveTo(W / 2, 0); raw.lineTo(W / 2, H);
          raw.moveTo(0, H / 2); raw.lineTo(W, H / 2);
          raw.moveTo(0, 0); raw.lineTo(W, H);
          raw.moveTo(W, 0); raw.lineTo(0, H);
          raw.stroke();
          raw.restore();
        }

        // Labels — pinned to the visible edge like a ruler, constant screen size
        if (G.labels && currentScale * cw > 22) {
          const stage = stageRef.current;
          const sw = stage?.width() ?? 0;
          const sh = stage?.height() ?? 0;
          const view = viewRef.current;
          // Visible area in image coordinates
          const vx0 = -view.x / currentScale;
          const vy0 = -view.y / currentScale;
          const vx1 = vx0 + sw / currentScale;
          const vy1 = vy0 + sh / currentScale;

          const fs = 13 / currentScale; // 13px on screen regardless of zoom
          const pillR = fs * 0.95;
          // Pin the label row/column just inside whichever edge is visible
          const topY = clamp(Math.max(vy0, 0) + pillR + 4 / currentScale, pillR, H - pillR);
          const leftX = clamp(Math.max(vx0, 0) + pillR + 4 / currentScale, pillR, W - pillR);

          raw.globalAlpha = 1;
          raw.font = `700 ${fs}px -apple-system, sans-serif`;
          raw.textAlign = 'center';
          raw.textBaseline = 'middle';

          const pill = (tx: number, ty: number, txt: string) => {
            const tw = raw.measureText(txt).width;
            const pw = Math.max(tw + fs * 0.9, pillR * 2);
            const ph = pillR * 2;
            raw.fillStyle = 'rgba(18,17,16,0.88)';
            raw.beginPath();
            if (raw.roundRect) {
              raw.roundRect(tx - pw / 2, ty - ph / 2, pw, ph, ph / 2);
            } else {
              raw.rect(tx - pw / 2, ty - ph / 2, pw, ph);
            }
            raw.fill();
            raw.strokeStyle = 'rgba(255,255,255,0.22)';
            raw.lineWidth = 1 / currentScale;
            raw.stroke();
            raw.fillStyle = G.color;
            raw.fillText(txt, tx, ty + fs * 0.05);
          };

          // Column letters along the visible top; keep the label inside
          // the viewport for whichever columns are on screen
          for (let col = 0; col < G.cols; col++) {
            const c0 = col * cw;
            const c1 = (col + 1) * cw;
            if (c1 < vx0 || c0 > vx1) continue; // column not visible
            const tx = clamp(
              (col + 0.5) * cw,
              Math.max(vx0, c0) + pillR,
              Math.min(vx1, c1) - pillR
            );
            pill(tx, topY, LETTERS[col % 26] ?? String(col + 1));
          }
          // Row numbers along the visible left, same clamping per row
          for (let row = 0; row < rows; row++) {
            const r0 = row * cw;
            const r1 = Math.min((row + 1) * cw, H);
            if (r1 < vy0 || r0 > vy1) continue; // row not visible
            const ty = clamp(
              (r0 + r1) / 2,
              Math.max(vy0, r0) + pillR,
              Math.min(vy1, r1) - pillR
            );
            pill(leftX, ty, String(row + 1));
          }
        }

        raw.restore();
      },
    });
    gridLayer.add(gridShape);
    gridShapeRef.current = gridShape;

    // Wheel zoom
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const pointer = stage.getPointerPosition()!;
      const oldScale = viewRef.current.scale;
      const factor = e.evt.ctrlKey
        ? Math.exp(-e.evt.deltaY * 0.01)
        : e.evt.deltaY < 0
        ? 1.12
        : 0.893;
      const newScale = clamp(oldScale * factor, 0.02, 32);
      applyView({
        x: pointer.x - (pointer.x - viewRef.current.x) * (newScale / oldScale),
        y: pointer.y - (pointer.y - viewRef.current.y) * (newScale / oldScale),
        scale: newScale,
      });
      hasPannedRef.current = true;
    });

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      stage.width(width);
      stage.height(height);
      if (!hasPannedRef.current) {
        fitView();
      }
      stage.batchDraw();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      stage.destroy();
      stageRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update image when processedCanvas changes
  useEffect(() => {
    if (imageNodeRef.current && processedCanvas) {
      imageNodeRef.current.image(processedCanvas as unknown as HTMLImageElement);
      imageNodeRef.current.width(processedCanvas.width);
      imageNodeRef.current.height(processedCanvas.height);
      dimsRef.current = { W: processedCanvas.width, H: processedCanvas.height };

      // Also update tint node size
      if (tintNodeRef.current) {
        tintNodeRef.current.width(processedCanvas.width);
        tintNodeRef.current.height(processedCanvas.height);
      }
      // Update grid shape size
      if (gridShapeRef.current) {
        gridShapeRef.current.width(processedCanvas.width);
        gridShapeRef.current.height(processedCanvas.height);
      }

      imageLayerRef.current?.batchDraw();
      gridLayerRef.current?.batchDraw();

      if (!hasFitRef.current) {
        hasFitRef.current = true;
        hasPannedRef.current = false;
        setTimeout(() => fitView(), 50);
      }
    }
  }, [processedCanvas, fitView]);

  // Update grid when settings change
  useEffect(() => {
    gridShapeRef.current?.getLayer()?.batchDraw();
  }, [grid]);

  // Update tint
  useEffect(() => {
    const t = filters.tint;
    if (tintNodeRef.current) {
      if (t !== 'none') {
        tintNodeRef.current.fill(t);
        tintNodeRef.current.opacity(filters.tintAmt / 100);
        tintNodeRef.current.visible(true);
      } else {
        tintNodeRef.current.visible(false);
      }
      imageLayerRef.current?.batchDraw();
    }
  }, [filters.tint, filters.tintAmt]);

  // Register callbacks
  useEffect(() => {
    registerFitAll(fitView);
  }, [fitView, registerFitAll]);

  useEffect(() => {
    registerZoom((factor: number) => zoomTo(factor));
  }, [zoomTo, registerZoom]);

  // Gesture handling
  const getContainerPos = (e: PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: e.clientX, y: e.clientY };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const cancelMomentum = () => {
    if (momentumRafRef.current !== null) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  };

  const startMomentum = () => {
    cancelMomentum();
    let vx = velRef.current.vx;
    let vy = velRef.current.vy;
    const decay = 0.94;
    const tick = () => {
      vx *= decay;
      vy *= decay;
      if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) return;
      const v = viewRef.current;
      applyView({ x: v.x + vx, y: v.y + vy, scale: v.scale });
      momentumRafRef.current = requestAnimationFrame(tick);
    };
    momentumRafRef.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (locked) return;
      const pos = getContainerPos(e.nativeEvent);

      // Palm rejection: if pen is active, ignore touch
      if (e.pointerType === 'pen') {
        penActiveRef.current = true;
      }
      if (penActiveRef.current && e.pointerType === 'touch') return;

      cancelMomentum();
      activePointersRef.current.set(e.pointerId, pos);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Long press
      longPressMoveRef.current = pos;
      longPressRef.current = setTimeout(() => {
        // Long press action - could show context menu
        longPressRef.current = null;
      }, 480);

      // Double tap detection
      const now = Date.now();
      if (doubleTapRef.current && now - doubleTapRef.current.time < 350) {
        const dx = pos.x - doubleTapRef.current.x;
        const dy = pos.y - doubleTapRef.current.y;
        if (Math.hypot(dx, dy) < 40) {
          // Double tap: toggle between fit and 2.6x
          const v = viewRef.current;
          const dims = getImgDims();
          if (dims && containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            const pad = 40;
            const fitScale = clamp(
              Math.min((width - pad) / dims.W, (height - pad) / dims.H),
              0.02,
              32
            );
            if (Math.abs(v.scale - fitScale) < fitScale * 0.1) {
              // Zoom to 2.6x at tap point
              const newScale = fitScale * 2.6;
              applyView({
                x: pos.x - (pos.x - v.x) * (newScale / v.scale),
                y: pos.y - (pos.y - v.y) * (newScale / v.scale),
                scale: newScale,
              });
            } else {
              fitView();
            }
          }
          doubleTapRef.current = null;
          return;
        }
      }
      doubleTapRef.current = { time: now, x: pos.x, y: pos.y };
    },
    [locked, applyView, fitView, getImgDims]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (locked) return;
      if (penActiveRef.current && e.pointerType === 'touch') return;

      const pos = getContainerPos(e.nativeEvent);
      const prev = activePointersRef.current.get(e.pointerId);
      if (!prev) return;

      // Cancel long press if moved too much
      if (longPressMoveRef.current) {
        const dx = pos.x - longPressMoveRef.current.x;
        const dy = pos.y - longPressMoveRef.current.y;
        if (Math.hypot(dx, dy) > 9 && longPressRef.current) {
          clearTimeout(longPressRef.current);
          longPressRef.current = null;
        }
      }

      activePointersRef.current.set(e.pointerId, pos);
      const pointers = Array.from(activePointersRef.current.values());

      if (pointers.length === 1) {
        // Pan
        const dx = pos.x - prev.x;
        const dy = pos.y - prev.y;
        velRef.current = { vx: dx, vy: dy };
        const v = viewRef.current;
        applyView({ x: v.x + dx, y: v.y + dy, scale: v.scale });
        hasPannedRef.current = true;
      } else if (pointers.length === 2) {
        const [p1, p2] = pointers;
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (lastPinchDistRef.current !== null && lastPinchMidRef.current) {
          const oldDist = lastPinchDistRef.current;
          const oldMid = lastPinchMidRef.current;
          const scaleFactor = dist / oldDist;
          const v = viewRef.current;
          const newScale = clamp(v.scale * scaleFactor, 0.02, 32);
          const dx = mid.x - oldMid.x;
          const dy = mid.y - oldMid.y;
          applyView({
            x: mid.x - (mid.x - v.x) * (newScale / v.scale) + dx,
            y: mid.y - (mid.y - v.y) * (newScale / v.scale) + dy,
            scale: newScale,
          });
          hasPannedRef.current = true;
        }
        lastPinchDistRef.current = dist;
        lastPinchMidRef.current = mid;
      }
    },
    [locked, applyView]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'pen') {
        penActiveRef.current = false;
      }

      activePointersRef.current.delete(e.pointerId);
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
      }

      if (activePointersRef.current.size === 0) {
        lastPinchDistRef.current = null;
        lastPinchMidRef.current = null;
        startMomentum();
      } else if (activePointersRef.current.size < 2) {
        lastPinchDistRef.current = null;
        lastPinchMidRef.current = null;
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Crop overlay helpers
  const screenToImage = useCallback(
    (sx: number, sy: number): { x: number; y: number } => {
      const v = viewRef.current;
      return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
    },
    []
  );

  const imageToScreen = useCallback(
    (ix: number, iy: number): { x: number; y: number } => {
      const v = viewRef.current;
      return { x: ix * v.scale + v.x, y: iy * v.scale + v.y };
    },
    []
  );

  // Compute effective crop in image coords
  const effCrop = useCallback((): CropRect => {
    const dims = dimsRef.current;
    if (!dims) return { x: 0, y: 0, w: 1, h: 1 };
    if (cropDraft) return cropDraft;
    if (crop) return crop;
    return { x: 0, y: 0, w: dims.W, h: dims.H };
  }, [crop, cropDraft]);

  // Init crop draft when entering crop mode
  useEffect(() => {
    if (cropping) {
      const dims = dimsRef.current;
      const c = crop ?? (dims ? { x: 0, y: 0, w: dims.W, h: dims.H } : null);
      setCropDraft(c);
    } else {
      setCropDraft(null);
    }
  }, [cropping, crop]);

  // Reshape crop draft when an aspect ratio is picked
  useEffect(() => {
    if (!cropping || cropAspect <= 0) return;
    const dims = dimsRef.current;
    if (!dims) return;
    setCropDraft((prev) => {
      const cur = prev ?? { x: 0, y: 0, w: dims.W, h: dims.H };
      // Keep the current centre, fit the largest box with the new ratio
      let w = cur.w;
      let h = w / cropAspect;
      if (h > dims.H) {
        h = dims.H;
        w = h * cropAspect;
      }
      if (w > dims.W) {
        w = dims.W;
        h = w / cropAspect;
      }
      const cx = cur.x + cur.w / 2;
      const cy = cur.y + cur.h / 2;
      const next = {
        x: clamp(cx - w / 2, 0, dims.W - w),
        y: clamp(cy - h / 2, 0, dims.H - h),
        w,
        h,
      };
      onCropChange(next);
      return next;
    });
  }, [cropAspect, cropping, onCropChange]);

  // Crop handles
  const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'move'] as const;
  type HandleId = (typeof HANDLES)[number];

  const getCropScreenRect = () => {
    const ec = effCrop();
    const tl = imageToScreen(ec.x, ec.y);
    const br = imageToScreen(ec.x + ec.w, ec.y + ec.h);
    return { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
  };

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: HandleId) => {
    e.stopPropagation();
    const pos = getContainerPos(e.nativeEvent);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    cropDragRef.current = { handle, startCrop: effCrop(), startPt: pos };
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropDragRef.current) return;
    const pos = getContainerPos(e.nativeEvent);
    const { handle, startCrop, startPt } = cropDragRef.current;
    const dims = dimsRef.current;
    if (!dims) return;

    const dx = (pos.x - startPt.x) / viewRef.current.scale;
    const dy = (pos.y - startPt.y) / viewRef.current.scale;

    let { x, y, w, h } = startCrop;
    const minSize = 20;

    if (handle === 'move') {
      x = clamp(x + dx, 0, dims.W - w);
      y = clamp(y + dy, 0, dims.H - h);
    } else {
      if (handle.includes('w')) {
        const newX = clamp(x + dx, 0, x + w - minSize);
        w = w - (newX - x);
        x = newX;
      }
      if (handle.includes('e')) {
        w = clamp(w + dx, minSize, dims.W - x);
      }
      if (handle.includes('n')) {
        const newY = clamp(y + dy, 0, y + h - minSize);
        h = h - (newY - y);
        y = newY;
      }
      if (handle.includes('s')) {
        h = clamp(h + dy, minSize, dims.H - y);
      }

      // Constrain to aspect ratio (w/h = A)
      const A = cropAspect;
      if (A > 0) {
        if (handle === 'n' || handle === 's') {
          w = clamp(h * A, minSize, dims.W - x);
          h = w / A;
        } else {
          h = clamp(w / A, minSize, dims.H - y);
          w = h * A;
          if (handle.includes('n')) {
            y = clamp(startCrop.y + startCrop.h - h, 0, dims.H - h);
          }
        }
        if (handle.includes('w')) {
          x = clamp(startCrop.x + startCrop.w - w, 0, dims.W - w);
        }
      }
    }

    const newCrop = { x, y, w, h };
    setCropDraft(newCrop);
    onCropChange(newCrop);
  };

  const handleCropPointerUp = () => {
    cropDragRef.current = null;
  };

  // Split view
  if (split && processedCanvas && orientedCanvas) {
    return (
      <div className="absolute inset-0 flex" style={{ top: 56, bottom: 56, left: 72 }}>
        {/* Left: clean reference */}
        <div className="flex-1 relative bg-[#1A1918] border-r border-white/10 overflow-hidden">
          <SplitPane canvas={orientedCanvas} label="Reference" />
        </div>
        {/* Right: processed + grid */}
        <div className="flex-1 relative bg-[#232120] overflow-hidden">
          <SplitPane canvas={processedCanvas} label="Grid" showGrid grid={grid} />
        </div>
      </div>
    );
  }

  const cropScreenRect = cropping ? getCropScreenRect() : null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ top: 56, bottom: 56, left: 72, cursor: cropping ? 'default' : 'grab' }}
      onPointerDown={!cropping ? handlePointerDown : undefined}
      onPointerMove={!cropping ? handlePointerMove : undefined}
      onPointerUp={!cropping ? handlePointerUp : undefined}
      onPointerCancel={!cropping ? handlePointerUp : undefined}
    >
      {/* Konva canvas is mounted into containerRef by Konva.Stage */}

      {/* Crop overlay */}
      {cropping && cropScreenRect && (
        <div
          className="absolute inset-0 pointer-events-none"
          onPointerMove={handleCropPointerMove}
          onPointerUp={handleCropPointerUp}
          style={{ pointerEvents: 'none' }}
        >
          {/* Darken outside crop */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={cropScreenRect.left}
                    y={cropScreenRect.top}
                    width={cropScreenRect.right - cropScreenRect.left}
                    height={cropScreenRect.bottom - cropScreenRect.top}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.55)"
                mask="url(#crop-mask)"
              />
              {/* Crop border */}
              <rect
                x={cropScreenRect.left}
                y={cropScreenRect.top}
                width={cropScreenRect.right - cropScreenRect.left}
                height={cropScreenRect.bottom - cropScreenRect.top}
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Drag handles */}
          {(
            [
              ['nw', cropScreenRect.left, cropScreenRect.top],
              ['n', (cropScreenRect.left + cropScreenRect.right) / 2, cropScreenRect.top],
              ['ne', cropScreenRect.right, cropScreenRect.top],
              ['e', cropScreenRect.right, (cropScreenRect.top + cropScreenRect.bottom) / 2],
              ['se', cropScreenRect.right, cropScreenRect.bottom],
              ['s', (cropScreenRect.left + cropScreenRect.right) / 2, cropScreenRect.bottom],
              ['sw', cropScreenRect.left, cropScreenRect.bottom],
              ['w', cropScreenRect.left, (cropScreenRect.top + cropScreenRect.bottom) / 2],
            ] as [HandleId, number, number][]
          ).map(([handle, hx, hy]) => (
            <div
              key={handle}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ left: hx, top: hy, pointerEvents: 'all', cursor: getCursor(handle) }}
              onPointerDown={(e) => handleCropPointerDown(e, handle)}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
            >
              <div className="w-4 h-4 rounded-sm bg-white border-2 border-[#232120] shadow-md" />
            </div>
          ))}

          {/* Move handle - center */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: (cropScreenRect.left + cropScreenRect.right) / 2,
              top: (cropScreenRect.top + cropScreenRect.bottom) / 2,
              pointerEvents: 'all',
              cursor: 'move',
              width: Math.max(40, cropScreenRect.right - cropScreenRect.left - 80),
              height: Math.max(40, cropScreenRect.bottom - cropScreenRect.top - 80),
            }}
            onPointerDown={(e) => handleCropPointerDown(e, 'move')}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
          />
        </div>
      )}
    </div>
  );
}

function getCursor(handle: string): string {
  const map: Record<string, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    e: 'e-resize', se: 'se-resize', s: 's-resize',
    sw: 'sw-resize', w: 'w-resize', move: 'move',
  };
  return map[handle] ?? 'pointer';
}

// Simple split pane component
function SplitPane({
  canvas,
  label,
  showGrid,
  grid,
}: {
  canvas: HTMLCanvasElement;
  label: string;
  showGrid?: boolean;
  grid?: GridSettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !canvas) return;
    const parent = c.parentElement;
    if (!parent) return;
    const draw = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      c.width = width;
      c.height = height;
      const ctx = c.getContext('2d')!;
      const scale = Math.min((width - 24) / canvas.width, (height - 24) / canvas.height);
      const dw = canvas.width * scale;
      const dh = canvas.height * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(canvas, dx, dy, dw, dh);

      if (showGrid && grid?.on) {
        const cw = dw / grid.cols;
        const rows = Math.max(1, Math.round(dh / cw));
        ctx.save();
        ctx.translate(dx, dy);
        ctx.strokeStyle = grid.color;
        ctx.lineWidth = Math.max(1, grid.width * 0.75);
        ctx.globalAlpha = grid.opacity;
        ctx.beginPath();
        for (let i = 0; i <= grid.cols; i++) {
          ctx.moveTo(i * cw, 0);
          ctx.lineTo(i * cw, dh);
        }
        for (let j = 0; j <= rows; j++) {
          const y = Math.min(j * cw, dh);
          ctx.moveTo(0, y);
          ctx.lineTo(dw, y);
        }
        ctx.stroke();
        if (grid.diag) {
          ctx.globalAlpha = grid.opacity * 0.5;
          ctx.beginPath();
          for (let i = 0; i < grid.cols; i++)
            for (let j = 0; j < rows; j++) {
              const x0 = i * cw;
              const y0 = j * cw;
              const y1 = Math.min((j + 1) * cw, dh);
              ctx.moveTo(x0, y0);
              ctx.lineTo(x0 + cw, y1);
              ctx.moveTo(x0 + cw, y0);
              ctx.lineTo(x0, y1);
            }
          ctx.stroke();
        }
        if (grid.radial) {
          ctx.globalAlpha = grid.opacity * 0.6;
          ctx.beginPath();
          ctx.moveTo(dw / 2, 0); ctx.lineTo(dw / 2, dh);
          ctx.moveTo(0, dh / 2); ctx.lineTo(dw, dh / 2);
          ctx.moveTo(0, 0); ctx.lineTo(dw, dh);
          ctx.moveTo(dw, 0); ctx.lineTo(0, dh);
          ctx.stroke();
        }
        if (grid.labels && cw > 26) {
          const fs = 11;
          ctx.globalAlpha = 1;
          ctx.font = `600 ${fs}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < grid.cols; i++) {
            const tx = (i + 0.5) * cw;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(tx - fs * 0.7, fs * 0.2, fs * 1.4, fs * 1.4);
            ctx.fillStyle = grid.color;
            ctx.fillText(LETTERS[i % 26], tx, fs * 0.9);
          }
          for (let j = 0; j < rows; j++) {
            const ty = Math.min((j + 0.5) * cw, dh - fs);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(fs * 0.2, ty - fs * 0.7, fs * 1.4, fs * 1.4);
            ctx.fillStyle = grid.color;
            ctx.fillText(String(j + 1), fs * 0.9, ty);
          }
        }
        ctx.restore();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvas, showGrid, grid]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2">
        <span className="text-xs text-[#A39D93] bg-black/40 rounded-full px-3 py-1">{label}</span>
      </div>
    </>
  );
}
