import { useState, useRef, useCallback, useEffect } from 'react';

interface PanZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  padding?: number;
}

export function usePanZoom(options: UsePanZoomOptions = {}) {
  const { minZoom = 0.1, maxZoom = 5, zoomStep = 0.1, padding = 0.85 } = options;

  const internalRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [transform, setTransform] = useState<PanZoomState>({ scale: 1, translateX: 0, translateY: 0 });

  const initialTransform = useRef<PanZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isPanningRef = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const setPanning = useCallback((v: boolean) => {
    isPanningRef.current = v;
    if (internalRef.current) {
      internalRef.current.classList.toggle('cursor-grabbing', v);
      internalRef.current.classList.toggle('cursor-grab', !v);
    }
  }, []);

  const applyTransform = useCallback((t: PanZoomState) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${t.translateX}px, ${t.translateY}px) scale(${t.scale})`;
    }
  }, []);

  const syncState = useCallback((t?: PanZoomState) => {
    const next = t ?? transformRef.current;
    transformRef.current = next;
    applyTransform(next);
    setTransform(next);
  }, [applyTransform]);

  const centerContent = useCallback(() => {
    const container = internalRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const svg = content.querySelector('svg');
    if (!svg) return;

    let svgWidth: number;
    let svgHeight: number;

    if (svg.viewBox?.baseVal?.width && svg.viewBox.baseVal.width > 0) {
      svgWidth = svg.viewBox.baseVal.width;
      svgHeight = svg.viewBox.baseVal.height;
    } else {
      const svgRect = svg.getBoundingClientRect();
      svgWidth = svgRect.width;
      svgHeight = svgRect.height;
    }

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const scale = Math.min(
      (containerWidth * padding) / svgWidth,
      (containerHeight * padding) / svgHeight,
      1,
    );

    const translateX = (containerWidth - svgWidth * scale) / 2;
    const translateY = (containerHeight - svgHeight * scale) / 2;

    const next: PanZoomState = { scale, translateX, translateY };
    initialTransform.current = next;
    syncState(next);
  }, [padding, syncState]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const { scale: s, translateX: tx, translateY: ty } = transformRef.current;
    const pointBeforeX = (cursorX - tx) / s;
    const pointBeforeY = (cursorY - ty) / s;

    const factor = e.deltaY < 0 ? 1 + zoomStep : 1 / (1 + zoomStep);
    const newScale = Math.min(Math.max(s * factor, minZoom), maxZoom);

    syncState({
      scale: newScale,
      translateX: cursorX - pointBeforeX * newScale,
      translateY: cursorY - pointBeforeY * newScale,
    });
  }, [zoomStep, minZoom, maxZoom, syncState]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setPanning(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, [setPanning]);

  const touchStateRef = useRef({
    distance: 0, scale: 1, midpoint: { x: 0, y: 0 }, translate: { x: 0, y: 0 },
    single: { x: 0, y: 0 },
    isSingle: false,
  });

  const touchHandlersRef = useRef<{
    start: (e: TouchEvent) => void;
    move: (e: TouchEvent) => void;
    end: () => void;
  }>(null!);

  touchHandlersRef.current = {
    start(e: TouchEvent) {
      if (e.touches.length === 1) {
        touchStateRef.current.isSingle = true;
        setPanning(true);
        touchStateRef.current.single = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStateRef.current.isSingle = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStateRef.current.distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        touchStateRef.current.scale = transformRef.current.scale;
        touchStateRef.current.midpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        touchStateRef.current.translate = { x: transformRef.current.translateX, y: transformRef.current.translateY };
      }
    },
    move(e: TouchEvent) {
      const s = e.currentTarget as HTMLDivElement;
      if (!s) return;
      const ts = touchStateRef.current;

      if (e.touches.length === 1 && ts.isSingle) {
        const dx = e.touches[0].clientX - ts.single.x;
        const dy = e.touches[0].clientY - ts.single.y;
        ts.single = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        transformRef.current = {
          ...transformRef.current,
          translateX: transformRef.current.translateX + dx,
          translateY: transformRef.current.translateY + dy,
        };
        applyTransform(transformRef.current);
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentMidpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

        const scaleDelta = currentDistance / ts.distance;
        const newScale = Math.min(Math.max(ts.scale * scaleDelta, minZoom), maxZoom);

        const rect = s.getBoundingClientRect();
        const midX = ts.midpoint.x - rect.left;
        const midY = ts.midpoint.y - rect.top;
        const svgX = (midX - ts.translate.x) / ts.scale;
        const svgY = (midY - ts.translate.y) / ts.scale;
        const deltaX = currentMidpoint.x - ts.midpoint.x;
        const deltaY = currentMidpoint.y - ts.midpoint.y;

        transformRef.current = {
          scale: newScale,
          translateX: midX + deltaX - svgX * newScale,
          translateY: midY + deltaY - svgY * newScale,
        };
        applyTransform(transformRef.current);
      }
    },
    end() {
      touchStateRef.current.isSingle = false;
      setPanning(false);
      setTransform({ ...transformRef.current });
    },
  };

  const attachedRef = useRef(false);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    internalRef.current = node;

    if (node && !attachedRef.current) {
      attachedRef.current = true;

      const touchStart = (e: TouchEvent) => { e.preventDefault(); touchHandlersRef.current.start(e); };
      const touchMove = (e: TouchEvent) => { e.preventDefault(); touchHandlersRef.current.move(e); };
      const touchEnd = () => touchHandlersRef.current.end();

      node.addEventListener('touchstart', touchStart, { passive: false });
      node.addEventListener('touchmove', touchMove, { passive: false });
      node.addEventListener('touchend', touchEnd);
      node.addEventListener('touchcancel', touchEnd);
    } else if (!node && attachedRef.current) {
      attachedRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;

      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      lastPosition.current = { x: e.clientX, y: e.clientY };

      transformRef.current = {
        ...transformRef.current,
        translateX: transformRef.current.translateX + dx,
        translateY: transformRef.current.translateY + dy,
      };
      applyTransform(transformRef.current);
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        if (internalRef.current) {
          internalRef.current.classList.remove('cursor-grabbing');
          internalRef.current.classList.add('cursor-grab');
        }
        setTransform({ ...transformRef.current });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applyTransform]);

  const zoomIn = useCallback(() => {
    const container = internalRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const { scale: s, translateX: tx, translateY: ty } = transformRef.current;
    const px = (cx - tx) / s;
    const py = (cy - ty) / s;

    const newScale = Math.min(s * (1 + zoomStep), maxZoom);
    syncState({
      scale: newScale,
      translateX: cx - px * newScale,
      translateY: cy - py * newScale,
    });
  }, [zoomStep, maxZoom, syncState]);

  const zoomOut = useCallback(() => {
    const container = internalRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const { scale: s, translateX: tx, translateY: ty } = transformRef.current;
    const px = (cx - tx) / s;
    const py = (cy - ty) / s;

    const newScale = Math.max(s / (1 + zoomStep), minZoom);
    syncState({
      scale: newScale,
      translateX: cx - px * newScale,
      translateY: cy - py * newScale,
    });
  }, [zoomStep, minZoom, syncState]);

  const resetTransform = useCallback(() => {
    syncState({ ...initialTransform.current });
  }, [syncState]);

  return {
    containerRef,
    contentRef,
    scale: transform.scale,
    translateX: transform.translateX,
    translateY: transform.translateY,
    centerContent,
    zoomIn,
    zoomOut,
    resetTransform,
    onWheel,
    onMouseDown,
  } as const;
}
