import { useParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react';
import { usePropertySiteplan } from '@/hooks/usePropertySiteplan';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { UnitsDrawer } from '@/components/properties/UnitsDrawer';
import { UnitDetailDrawer } from '@/components/properties/UnitDetailDrawer';
import { updateSvgTextContent } from '@/lib/svgUtils';
import { usePanZoom } from '@/hooks/usePanZoom';
import './SitePlanPage.css';

export default function SitePlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnitName, setSelectedUnitName] = useState('');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const hasCenteredRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTargetRef = useRef<Element | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTargetRef = useRef<Element | null>(null);

  const { data, isLoading, error } = usePropertySiteplan(id || '');

  useEffect(() => {
    if (data?.property.siteplan_assets) {
      const siteplanUrl = `${API_URL}${data.property.siteplan_assets}`;
      fetch(siteplanUrl)
        .then(res => res.text())
        .then(setSvgContent)
        .catch(err => console.error('Failed to load SVG:', err));
    }
  }, [data?.property.siteplan_assets, API_URL]);

  const enhancedSvg = useMemo(() => {
    if (!svgContent || !data) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    const style = doc.createElement('style');
    style.textContent = `
      * {
        font-family: 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      .unit-element text {
        font-family: 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        text-anchor: middle;
      }

      .unit-element tspan {
        font-family: 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        text-anchor: middle;
      }

      .unit-element:hover {
        cursor: pointer;
      }

      .unit-element:hover [id^="unitline"] {
        fill: var(--primary);
        cursor: pointer;
        transition: fill 0.1s ease;
      }

      .unit-element:hover [id^="unitline"] ~ text {
        fill: white;
      }

      .unit-status-available [id^="unitline"] {
        fill: var(--status-available);
        transition: fill 0.3s ease;
      }

      .unit-status-sold [id^="unitline"] {
        fill: var(--status-sold);
        transition: fill 0.3s ease;
      }

      .unit-status-reserved [id^="unitline"] {
        fill: var(--status-reserved);
        transition: fill 0.3s ease;
      }

      .unit-status-booked [id^="unitline"] {
        fill: var(--status-booked);
        transition: fill 0.3s ease;
      }

      .unit-status-available [id^="unitline"] ~ text {
        fill: white;
      }

      .unit-status-sold [id^="unitline"] ~ text {
        fill: white;
      }

      .unit-status-reserved [id^="unitline"] ~ text {
       fill: white;
      }

      .unit-status-booked [id^="unitline"] ~ text {
        fill: white;
      }

    `;
    doc.documentElement.prepend(style);

    data.units.forEach((unit: { id: string; name: string; land_area?: number; status: string }) => {
      const element = doc.getElementById(unit.name);
      if (element) {
        element.classList.add('unit-element');
        element.classList.add(`unit-status-${unit.status}`);
        element.dataset.status = unit.status;
        element.dataset.unitId = unit.id;
        element.dataset.unitName = unit.name;

        const unitnameTexts = element.querySelectorAll('[id^="unitname"]');
        if (unitnameTexts.length === 0) {
          console.log(`No unitname text elements found for unit: ${unit.name}`);
        } else {
          unitnameTexts.forEach((text) => {
            updateSvgTextContent(text, unit.name, doc, {
              unitName: unit.name,
              fieldType: 'unitname'
            });
          });
        }

        const landareaTexts = element.querySelectorAll('[id^="landarea"]');
        if (landareaTexts.length === 0) {
          console.log(`No landarea text elements found for unit: ${unit.name}`);
        } else {
          landareaTexts.forEach((text) => {
            updateSvgTextContent(text, `${unit.land_area || 0}m2`, doc, {
              unitName: unit.name,
              fieldType: 'landarea'
            });
          });
        }

        const statusTexts = element.querySelectorAll('[id^="status"]');
        if (statusTexts.length === 0) {
          console.log(`No status text elements found for unit: ${unit.name}`);
        } else {
          statusTexts.forEach((text) => {
            updateSvgTextContent(text, unit.status, doc, {
              unitName: unit.name,
              fieldType: 'status'
            });
          });
        }
      } else {
        console.log(`No SVG element found for unit: ${unit.name}`);
      }
    });

    return doc.documentElement.outerHTML;
  }, [svgContent, data]);

  const handleLeftMenuClick = () => {
    navigate('/properties');
  };

  const handleRightMenuClick = () => {
    setRightSidebarOpen(true);
  };

  const openUnitFromTarget = useCallback((target: Element) => {
    const unitEl = target.closest('.unit-element');
    if (!unitEl) return;

    const unitId = unitEl.getAttribute('data-unit-id');
    const unitName = unitEl.getAttribute('data-unit-name');
    if (!unitId) return;

    setSelectedUnitId(unitId);
    setSelectedUnitName(unitName || '');
    setDetailDrawerOpen(true);
  }, []);

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    mouseDownTargetRef.current = e.target as Element;
    onMouseDown(e);
  };

  const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const down = mouseDownPosRef.current;
    const target = mouseDownTargetRef.current;
    const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 0;
    if (!target || (down && moved > 5)) {
      mouseDownPosRef.current = null;
      mouseDownTargetRef.current = null;
      return;
    }
    openUnitFromTarget(target);
    mouseDownPosRef.current = null;
    mouseDownTargetRef.current = null;
  };

  const {
    containerRef,
    contentRef,
    scale,
    translateX,
    translateY,
    centerContent,
    zoomIn,
    zoomOut,
    resetTransform,
    onWheel,
    onMouseDown,
  } = usePanZoom({ padding: 0.85 });

  useEffect(() => {
    hasCenteredRef.current = false;
  }, [id]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStartPosRef.current = { x: t.clientX, y: t.clientY };
        touchStartTargetRef.current = e.target as Element;
      } else {
        touchStartPosRef.current = null;
        touchStartTargetRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const start = touchStartPosRef.current;
      if (!start) return;
      if (e.touches.length !== 1) {
        touchStartTargetRef.current = null;
        return;
      }
      const t = e.touches[0];
      if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) {
        touchStartTargetRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      const target = touchStartTargetRef.current;
      touchStartPosRef.current = null;
      touchStartTargetRef.current = null;
      if (!target) return;
      openUnitFromTarget(target);
    };

    const handleTouchCancel = () => {
      touchStartPosRef.current = null;
      touchStartTargetRef.current = null;
    };

    content.addEventListener('touchstart', handleTouchStart, { passive: true });
    content.addEventListener('touchmove', handleTouchMove, { passive: true });
    content.addEventListener('touchend', handleTouchEnd);
    content.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
      content.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enhancedSvg, contentRef, openUnitFromTarget]);

  useEffect(() => {
    if (enhancedSvg && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      const raf = requestAnimationFrame(() => {
        centerContent();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [enhancedSvg, centerContent]);

  if (isLoading) {
    return (
      <div className="site-plan-page__loading">
        <div className="site-plan-page__spinner"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="site-plan-page__error">
        <div className="site-plan-page__error-card">
          <div className="site-plan-page__error-icon">
            <MapIcon className="site-plan-page__error-icon-svg" />
          </div>
          <h2 className="site-plan-page__error-title">Failed to load siteplan</h2>
          <p className="site-plan-page__error-text">
            {error instanceof Error ? error.message : 'An error occurred while loading the siteplan.'}
          </p>
          <button onClick={() => navigate('/properties')} className="site-plan-page__back-button">
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="site-plan-page">
      {/* Floating Menu */}
      <div className="site-plan-page__menu">
        <button
          onClick={handleLeftMenuClick}
          className="site-plan-page__menu-button"
          title="Main sidebar"
        >
          <ArrowLeft className="site-plan-page__menu-icon" />
        </button>

        <div className="site-plan-page__menu-title-wrapper">
          <h1 className="site-plan-page__menu-title" title={data?.property.name}>
            {data?.property.name}
          </h1>
        </div>

        <button
          onClick={handleRightMenuClick}
          className="site-plan-page__menu-button"
          title="Block details sidebar"
        >
          <div className="site-plan-page__menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0 2.97515C0 1.33202 1.33202 0 2.97515 0H16.8592C18.5023 0 19.8344 1.33202 19.8344 2.97515V16.8592C19.8344 18.5023 18.5023 19.8344 16.8592 19.8344H2.97515C1.33202 19.8344 0 18.5023 0 16.8592V2.97515ZM6.94203 17.8509H16.8592C17.4069 17.8509 17.8509 17.4069 17.8509 16.8592V2.97515C17.8509 2.42744 17.4069 1.98344 16.8592 1.98344H6.94203V17.8509ZM4.95859 1.98344V17.8509H2.97515C2.42744 17.8509 1.98344 17.4069 1.98344 16.8592V2.97515C1.98344 2.42744 2.42744 1.98344 2.97515 1.98344H4.95859Z" fill="currentColor"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Siteplan Image */}
      <div className="site-plan-page__content">
        {enhancedSvg ? (
          <div
            ref={containerRef}
            onWheel={onWheel}
            onMouseDown={handleContainerMouseDown}
            onMouseUp={handleContainerMouseUp}
            className="site-plan-page__pan"
          >
            <div
              ref={contentRef}
              className="site-plan-page__svg"
              style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: '0 0',
                willChange: 'transform',
              }}
              dangerouslySetInnerHTML={{ __html: enhancedSvg }}
            />
          </div>
        ) : (
          <div className="site-plan-page__empty">
            <div className="site-plan-page__empty-inner">
              <MapIcon className="site-plan-page__empty-icon" />
              <p className="site-plan-page__empty-text">No siteplan image available</p>
            </div>
          </div>
        )}
      </div>

      <UnitsDrawer
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        property={data.property}
        units={data.units}
        onSeeMore={(unit) => {
          setSelectedUnitId(unit.id);
          setSelectedUnitName(unit.name);
          setDetailDrawerOpen(true);
        }}
      />

      <UnitDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        unitId={selectedUnitId}
        unitName={selectedUnitName}
      />

      {enhancedSvg && (
        <div className="site-plan-page__zoom">
          <button
            onClick={zoomOut}
            className="site-plan-page__zoom-button"
            title="Zoom out"
          >
            <Minus className="site-plan-page__zoom-icon" />
          </button>
          <span className="site-plan-page__zoom-label">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="site-plan-page__zoom-button"
            title="Zoom in"
          >
            <Plus className="site-plan-page__zoom-icon" />
          </button>
          <div className="site-plan-page__zoom-divider" />
          <button
            onClick={resetTransform}
            className="site-plan-page__zoom-button"
            title="Reset view"
          >
            <RotateCcw className="site-plan-page__zoom-icon" />
          </button>
        </div>
      )}
    </div>
  );
}
