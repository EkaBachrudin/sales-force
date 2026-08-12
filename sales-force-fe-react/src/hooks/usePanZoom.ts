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

  const internalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    internalRef.current = node;
    setContainerNode(node);
  }, []);

  const [transform, setTransform] = useState<PanZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const initialTransform = useRef<PanZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isPanningRef = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    if (!containerNode) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerNode.getBoundingClientRect();
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
    };

    containerNode.addEventListener('wheel', handleWheel, { passive: false });
    return () => containerNode.removeEventListener('wheel', handleWheel);
  }, [containerNode, zoomStep, minZoom, maxZoom, syncState]);

  useEffect(() => {
    if (!containerNode) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanning(true);
      lastPosition.current = { x: e.clientX, y: e.clientY };
    };

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
      isPanningRef.current = false;
      setIsPanning(false);
      setTransform({ ...transformRef.current });
    };

    containerNode.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      containerNode.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerNode, applyTransform]);

  useEffect(() => {
    if (!containerNode) return;

    let initialTouchDistance = 0;
    let initialTouchScale = 1;
    let initialTouchMidpoint = { x: 0, y: 0 };
    let initialTouchTranslate = { x: 0, y: 0 };
    let lastSingleTouch = { x: 0, y: 0 };
    let isSingleFingerPanning = false;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getMidpoint = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isSingleFingerPanning = true;
        setIsPanning(true);
        lastSingleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isSingleFingerPanning = false;
        initialTouchDistance = getDistance(e.touches[0], e.touches[1]);
        initialTouchScale = transformRef.current.scale;
        initialTouchMidpoint = getMidpoint(e.touches[0], e.touches[1]);
        initialTouchTranslate = {
          x: transformRef.current.translateX,
          y: transformRef.current.translateY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isSingleFingerPanning) {
        const dx = e.touches[0].clientX - lastSingleTouch.x;
        const dy = e.touches[0].clientY - lastSingleTouch.y;
        lastSingleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        transformRef.current = {
          ...transformRef.current,
          translateX: transformRef.current.translateX + dx,
          translateY: transformRef.current.translateY + dy,
        };
        applyTransform(transformRef.current);
      } else if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const currentMidpoint = getMidpoint(e.touches[0], e.touches[1]);

        const scaleDelta = currentDistance / initialTouchDistance;
        const newScale = Math.min(
          Math.max(initialTouchScale * scaleDelta, minZoom),
          maxZoom,
        );

        const rect = containerNode.getBoundingClientRect();
        const midX = initialTouchMidpoint.x - rect.left;
        const midY = initialTouchMidpoint.y - rect.top;
        const svgX = (midX - initialTouchTranslate.x) / initialTouchScale;
        const svgY = (midY - initialTouchTranslate.y) / initialTouchScale;
        const deltaX = currentMidpoint.x - initialTouchMidpoint.x;
        const deltaY = currentMidpoint.y - initialTouchMidpoint.y;

        transformRef.current = {
          scale: newScale,
          translateX: midX + deltaX - svgX * newScale,
          translateY: midY + deltaY - svgY * newScale,
        };
        applyTransform(transformRef.current);
      }
    };

    const handleTouchEnd = () => {
      isSingleFingerPanning = false;
      setIsPanning(false);
      setTransform({ ...transformRef.current });
    };

    containerNode.addEventListener('touchstart', handleTouchStart, { passive: false });
    containerNode.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerNode.addEventListener('touchend', handleTouchEnd);
    containerNode.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      containerNode.removeEventListener('touchstart', handleTouchStart);
      containerNode.removeEventListener('touchmove', handleTouchMove);
      containerNode.removeEventListener('touchend', handleTouchEnd);
      containerNode.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerNode, minZoom, maxZoom, applyTransform]);

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
    isPanning,
    centerContent,
    zoomIn,
    zoomOut,
    resetTransform,
  } as const;
}
