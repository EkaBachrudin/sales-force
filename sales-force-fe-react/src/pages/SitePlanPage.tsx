import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Map as MapIcon, ArrowLeft } from 'lucide-react';
import { usePropertySiteplan } from '@/hooks/usePropertySiteplan';
import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { UnitsDrawer } from '@/components/properties/UnitsDrawer';

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
      [id]:hover {
        fill: #3b82f6;
        cursor: pointer;
        transition: fill 0.2s ease;
      }
    `;
    doc.documentElement.prepend(style);
    
    data.units.forEach((unit: { name: string; status: string }) => {
      const element = doc.getElementById(unit.name);
      if (element) {
        element.classList.add('unit-element');
        element.dataset.status = unit.status;
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

  const handleMouseMove = (_e: MouseEvent<HTMLDivElement>) => {
  };

  const handleMouseLeave = () => {
  };

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
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="w-full h-full object-contain"
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
    </div>
  );
}