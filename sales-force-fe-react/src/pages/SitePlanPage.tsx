import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Map as MapIcon, ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react';
import { usePropertySiteplan } from '@/hooks/usePropertySiteplan';
import { useState, useEffect, useMemo } from 'react';
import { UnitsDrawer } from '@/components/properties/UnitsDrawer';
import { updateSvgTextContent } from '@/lib/svgUtils';
import { usePanZoom } from '@/hooks/usePanZoom';

export default function SitePlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  const { data, isLoading, error } = usePropertySiteplan(id || '');

  useEffect(() => {
    if (data && data.property.siteplan_assets) {
      const siteplanUrl = `${API_URL}${data.property.siteplan_assets}`;
      fetch(siteplanUrl)
        .then(res => res.text())
        .then(setSvgContent)
        .catch(err => console.error('Failed to load SVG:', err));
    }
  }, [data, API_URL]);

  const enhancedSvg = useMemo(() => {
    if (!svgContent || !data) return null;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    const style = doc.createElement('style');
    style.textContent = `
      * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      text {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        text-anchor: middle;
      }

      tspan {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        text-anchor: middle;
      }

      .unit-element:hover {
        cursor: pointer;
      }

      .unit-element:hover [id^="unitline"] {
        fill: #3b82f6;
        cursor: pointer;
        transition: fill 0.1s ease;
      }
      
      .unit-element:hover [id^="unitline"] ~ text {
        fill: white;
      }

      .unit-status-available [id^="unitline"] {
        fill: #4C8944;
        transition: fill 0.3s ease;
      }

      .unit-status-sold [id^="unitline"] {
        fill: #A20101;
        transition: fill 0.3s ease;
      }

      .unit-status-reserved [id^="unitline"] {
        fill: #6a03a6;
        transition: fill 0.3s ease;
      }

      .unit-status-booked [id^="unitline"] {
        fill: #cf8302;
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
    
    data.units.forEach((unit: { name: string; land_area?: number; status: string }) => {
      const element = doc.getElementById(unit.name);
      if (element) {
        element.classList.add('unit-element');
        element.classList.add(`unit-status-${unit.status}`);
        element.dataset.status = unit.status;

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

  const handleBack = () => {
    navigate('/properties');
  };

  const handleLeftMenuClick = () => {
    console.log('Left menu click - Main sidebar toggle');
  };

  const handleRightMenuClick = () => {
    setRightSidebarOpen(true);
  };

  const {
    containerRef,
    contentRef,
    scale,
    translateX,
    translateY,
    isPanning,
    centerContent,
    zoomIn,
    zoomOut,
    resetTransform,
  } = usePanZoom({ padding: 0.85 });

  useEffect(() => {
    if (enhancedSvg) {
      const raf = requestAnimationFrame(() => {
        centerContent();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [enhancedSvg, centerContent]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Failed to load siteplan
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading the siteplan.'}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-4 right-4 z-50 bg-white rounded-lg p-2 shadow-md hover:bg-gray-100 transition-colors"
        title="Back to Properties"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Floating Menu */}
      <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-md p-3 flex items-center gap-4 min-w-[280px] max-w-[400px]">
        <button
          onClick={handleLeftMenuClick}
          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Main sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 hover:text-primary transition-colors" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-text-primary truncate" title={data?.property.name}>
            {data?.property.name}
          </h1>
        </div>

        <button
          onClick={handleRightMenuClick}
          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Block details sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Siteplan Image */}
      <div className="w-full h-full">
        {enhancedSvg ? (
          <div
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div
              ref={contentRef}
              className="absolute top-0 left-0"
              style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: '0 0',
                willChange: 'transform',
              }}
              dangerouslySetInnerHTML={{ __html: enhancedSvg }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-text-secondary">No siteplan image available</p>
            </div>
          </div>
        )}
      </div>

      <UnitsDrawer
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        property={data.property}
        units={data.units}
      />

      {enhancedSvg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-1 flex items-center gap-0.5">
          <button
            onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 min-w-[44px] text-center select-none tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={resetTransform}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}