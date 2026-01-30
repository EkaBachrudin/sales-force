'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LeadCard, Lead } from './LeadCard';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

export type { Lead } from './LeadCard';

export type PipelineStage = 'new' | 'contacted' | 'surveyed' | 'negotiating' | 'closed' | 'cancelled';

export interface PipelineColumn {
  id: PipelineStage;
  label: string;
  color: 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red';
  leads: Lead[];
}

const stageConfig: Record<PipelineStage, { label: string; color: PipelineColumn['color'] }> = {
  new: { label: 'Baru Masuk', color: 'gray' },
  contacted: { label: 'Dikontak', color: 'blue' },
  surveyed: { label: 'Survey', color: 'purple' },
  negotiating: { label: 'Negosiasi', color: 'orange' },
  closed: { label: 'Closing', color: 'green' },
  cancelled: { label: 'Batal', color: 'red' },
};

const colorStyles = {
  gray: 'bg-gray-50 border-gray-200',
  blue: 'bg-blue-50 border-blue-200',
  purple: 'bg-purple-50 border-purple-200',
  orange: 'bg-orange-50 border-orange-200',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
};

const headerColorStyles = {
  gray: 'text-gray-700 bg-gray-100',
  blue: 'text-blue-700 bg-blue-100',
  purple: 'text-purple-700 bg-purple-100',
  orange: 'text-orange-700 bg-orange-100',
  green: 'text-green-700 bg-green-100',
  red: 'text-red-700 bg-red-100',
};

// Custom type for drag data
const DRAG_TYPE = 'application/vnd.lead.card';

export interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStageChange?: (leadId: string, newStage: PipelineStage) => void;
  className?: string;
}

// Touch state interface
interface TouchState {
  leadId: string;
  lead: Lead;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  element: HTMLElement;
  clone: HTMLElement | null;
}

export function KanbanBoard({ leads, onLeadClick, onStageChange, className }: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<{ stage: PipelineStage; index: number } | null>(null);
  const draggedLeadRef = useRef<Lead | null>(null);

  // Touch-specific state
  const touchStateRef = useRef<TouchState | null>(null);
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const columnsRef = useRef<PipelineColumn[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentTouchPosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll configuration
  const SCROLL_EDGE_THRESHOLD = 50; // Distance from edge (px) to trigger auto-scroll
  const SCROLL_SPEED = 8; // Pixels per scroll step

  // Clear all drag states when leads prop changes (after drop and re-render)
  useEffect(() => {
    setDraggedLeadId(null);
    setPlaceholderIndex(null);
    draggedLeadRef.current = null;
    touchStateRef.current = null;
    isDraggingRef.current = false;
  }, [leads]);

  // Clean up touch state on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (touchStateRef.current?.clone) {
        touchStateRef.current.clone.remove();
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // Check if device supports touch
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Group leads by stage - memoized for performance
  const columns: PipelineColumn[] = React.useMemo(() =>
    Object.entries(stageConfig).map(([stage, config]) => ({
      id: stage as PipelineStage,
      label: config.label,
      color: config.color,
      leads: leads.filter((lead) => lead.status === stage),
    })), [leads]);

  // Keep columnsRef in sync
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Handle drag start - set up drag data
  const handleDragStart = useCallback((e: React.DragEvent, lead: Lead) => {
    draggedLeadRef.current = lead;
    setDraggedLeadId(lead.id);

    // Set the drag effect to move
    e.dataTransfer.effectAllowed = 'move';

    // Set custom drag type for identification
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ leadId: lead.id, currentStage: lead.status }));

    // Create a custom drag image (optional)
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // Handle drag end - cleanup
  const handleDragEnd = useCallback(() => {
    setDraggedLeadId(null);
    setPlaceholderIndex(null);
    draggedLeadRef.current = null;
  }, []);

  // === Touch Event Handlers for Mobile ===

  const handleTouchStart = useCallback((e: React.TouchEvent, lead: Lead) => {
    if (!isTouchDevice()) return;

    // Store the lead reference immediately for potential click
    draggedLeadRef.current = lead;

    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;

    // Store current touch position - will be updated during touch moves
    currentTouchPosRef.current = { clientX: touch.clientX, clientY: touch.clientY };

    // Start long press timer to distinguish tap from drag
    longPressTimerRef.current = setTimeout(() => {
      // Get the latest touch position (may have moved during long press)
      const currentTouch = currentTouchPosRef.current;
      if (!currentTouch) return;

      isDraggingRef.current = true;
      setDraggedLeadId(lead.id);

      // Create a visual clone for dragging
      const rect = element.getBoundingClientRect();
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.opacity = '0.8';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '9999';
      clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      clone.style.transition = 'none'; // Disable transitions for instant updates
      document.body.appendChild(clone);

      // Add visual feedback to original
      element.style.opacity = '0.3';

      // Use CURRENT touch position as startX/startY, not the initial touch position
      // This ensures the clone follows the finger correctly even if it moved during long press
      touchStateRef.current = {
        leadId: lead.id,
        lead,
        startX: currentTouch.clientX,
        startY: currentTouch.clientY,
        currentX: currentTouch.clientX,
        currentY: currentTouch.clientY,
        element,
        clone,
      };
    }, 200); // 200ms long press to initiate drag
  }, [isTouchDevice]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];

    // Always update current touch position, even before drag starts
    // This ensures we have the correct position when long press completes
    if (currentTouchPosRef.current) {
      currentTouchPosRef.current = { clientX: touch.clientX, clientY: touch.clientY };
    }

    if (!touchStateRef.current || !isDraggingRef.current) return;

    e.preventDefault(); // Prevent scrolling while dragging

    // Auto-scroll logic
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const viewportWidth = window.innerWidth;
      const touchX = touch.clientX;

      // Clear any existing auto-scroll interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      // Check if near left edge
      if (touchX < SCROLL_EDGE_THRESHOLD && scrollContainer.scrollLeft > 0) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft -= SCROLL_SPEED;
          }
        }, 16); // ~60fps
      }
      // Check if near right edge
      else if (touchX > viewportWidth - SCROLL_EDGE_THRESHOLD) {
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (scrollContainer.scrollLeft < maxScrollLeft) {
          autoScrollIntervalRef.current = setInterval(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft += SCROLL_SPEED;
            }
          }, 16); // ~60fps
        }
      }
    }

    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const touch = e.touches[0];
      const touchState = touchStateRef.current;
      if (!touchState) return;

      // Update position
      touchState.currentX = touch.clientX;
      touchState.currentY = touch.clientY;

      // Move the clone with GPU acceleration
      if (touchState.clone) {
        const deltaX = touch.clientX - touchState.startX;
        const deltaY = touch.clientY - touchState.startY;
        touchState.clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.05)`;
      }

      // Find which column we're over
      const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const columnElement = touchTarget?.closest('[data-stage]');

      if (columnElement) {
        const stage = columnElement.getAttribute('data-stage') as PipelineStage;
        const column = columnsRef.current.find(col => col.id === stage);

        if (column) {
          // Find position within column
          const targetList = columnElement;
          const targetElements = Array.from(targetList.children).filter(
            child => child instanceof HTMLElement && child.dataset.leadId
          );

          const draggingOverElement = targetElements.find((element) => {
            const rect = element.getBoundingClientRect();
            return touch.clientY >= rect.top && touch.clientY <= rect.bottom;
          });

          if (draggingOverElement) {
            const overElementId = (draggingOverElement as HTMLElement).dataset.leadId;
            if (overElementId === touchState.leadId) return;

            const index = column.leads.findIndex(lead => lead.id === overElementId);
            if (index !== -1) {
              setPlaceholderIndex({ stage, index });
            }
          } else {
            setPlaceholderIndex({ stage, index: 0 });
          }
        }
      }

      rafRef.current = null;
    });
  }, []); // No dependencies - uses refs instead

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    const lead = draggedLeadRef.current;

    if (!isDraggingRef.current) {
      // It was a tap (not a drag), treat as click
      if (lead) {
        // Prevent the native click from firing
        e.preventDefault();
        onLeadClick?.(lead);
      }
      // Clean up
      draggedLeadRef.current = null;
      currentTouchPosRef.current = null;
      return;
    }

    if (!touchStateRef.current) {
      draggedLeadRef.current = null;
      currentTouchPosRef.current = null;
      return;
    }

    const touchState = touchStateRef.current;
    const touch = e.changedTouches[0];

    // Find drop target
    const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const columnElement = touchTarget?.closest('[data-stage]');

    if (columnElement) {
      const targetStage = columnElement.getAttribute('data-stage') as PipelineStage;

      if (touchState.lead.status !== targetStage && onStageChange) {
        onStageChange(touchState.leadId, targetStage);
      }
    }

    // Clean up
    if (touchState.clone) {
      touchState.clone.remove();
    }
    touchState.element.style.opacity = '1';

    setPlaceholderIndex(null);
    setDraggedLeadId(null);
    draggedLeadRef.current = null;
    touchStateRef.current = null;
    currentTouchPosRef.current = null;
    isDraggingRef.current = false;
  }, [onStageChange, onLeadClick]);

  // Set up global touch move listener - only once on mount
  useEffect(() => {
    if (!isTouchDevice()) return;

    const handleTouchMoveGlobal = (e: Event) => {
      if (e instanceof TouchEvent) {
        handleTouchMove(e);
      }
    };

    document.addEventListener('touchmove', handleTouchMoveGlobal, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleTouchMoveGlobal);
      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isTouchDevice]); // Only depends on isTouchDevice (stable)

  // === End Touch Event Handlers ===

  // Handle drag over - determine placeholder position
  const handleDragOver = useCallback((e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();

    // Only accept lead cards
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) {
      return;
    }

    // Set drop effect to move
    e.dataTransfer.dropEffect = 'move';

    // Find the column's leads container
    const column = columns.find(col => col.id === targetStage);
    if (!column) return;

    const targetList = e.currentTarget;
    const targetElements = Array.from(targetList.children).filter(
      child => child instanceof HTMLElement && child.dataset.leadId
    );

    // Find which element we're hovering over
    const draggingOverElement = targetElements.find((element) => {
      const rect = element.getBoundingClientRect();
      return e.clientY >= rect.top && e.clientY <= rect.bottom;
    });

    if (draggingOverElement) {
      const overElementId = (draggingOverElement as HTMLElement).dataset.leadId;
      if (overElementId === draggedLeadId) return;

      const index = column.leads.findIndex(lead => lead.id === overElementId);
      if (index !== -1) {
        setPlaceholderIndex({ stage: targetStage, index });
      }
    } else {
      // No specific element being hovered - place at the TOP (index 0)
      const firstLead = column.leads[0];
      if (firstLead?.id !== draggedLeadId) {
        setPlaceholderIndex({ stage: targetStage, index: 0 });
      }
    }
  }, [columns, draggedLeadId]);

  // Handle drag leave - remove placeholder when leaving column
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Check if we're still within the column bounds
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setPlaceholderIndex(null);
    }
  }, []);

  // Handle drop - move the lead to the new stage
  const handleDrop = useCallback((e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();

    const draggedLead = draggedLeadRef.current;
    if (!draggedLead) return;

    // Call the onStageChange callback if the stage actually changed
    if (draggedLead.status !== targetStage && onStageChange) {
      onStageChange(draggedLead.id, targetStage);
    }

    // Clear all drag states immediately
    setPlaceholderIndex(null);
    setDraggedLeadId(null);
    draggedLeadRef.current = null;
  }, [onStageChange]);

  return (
    <div className={cn('w-full', className)}>
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Pipeline
        </h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-gray-50 transition-colors">
            Board
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-80 rounded-xl border p-4 min-h-[500px]',
              colorStyles[column.color]
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold',
                headerColorStyles[column.color]
              )}>
                {column.label}
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {column.leads.length}
              </span>
            </div>

            {/* Leads List */}
            <div className="space-y-3" data-stage={column.id}>
              {/* Show placeholder at the top when dragging to empty column or index 0 */}
              {placeholderIndex?.stage === column.id && placeholderIndex.index === 0 && (
                <div className={cn(
                  'rounded-lg border-2 border-dashed',
                  column.color === 'gray' && 'border-gray-300 bg-gray-100',
                  column.color === 'blue' && 'border-blue-300 bg-blue-100',
                  column.color === 'purple' && 'border-purple-300 bg-purple-100',
                  column.color === 'orange' && 'border-orange-300 bg-orange-100',
                  column.color === 'green' && 'border-green-300 bg-green-100',
                  column.color === 'red' && 'border-red-300 bg-red-100',
                )} style={{ height: '80px' }} />
              )}

              {column.leads.map((lead, index) => {
                const showPlaceholder = placeholderIndex?.stage === column.id && placeholderIndex.index === index && index !== 0;
                const isDragging = draggedLeadId === lead.id;

                return (
                  <React.Fragment key={lead.id}>
                    {/* Placeholder (for positions other than top) */}
                    {showPlaceholder && (
                      <div className={cn(
                        'rounded-lg border-2 border-dashed',
                        column.color === 'gray' && 'border-gray-300 bg-gray-100',
                        column.color === 'blue' && 'border-blue-300 bg-blue-100',
                        column.color === 'purple' && 'border-purple-300 bg-purple-100',
                        column.color === 'orange' && 'border-orange-300 bg-orange-100',
                        column.color === 'green' && 'border-green-300 bg-green-100',
                        column.color === 'red' && 'border-red-300 bg-red-100',
                      )} style={{ height: '80px' }} />
                    )}

                    {/* Lead Card */}
                    <div
                      data-lead-id={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, lead)}
                      onTouchEnd={handleTouchEnd}
                      className={cn(
                        'transition-all touch-none',
                        isDragging && 'opacity-40 cursor-grabbing'
                      )}
                    >
                      <div className={cn(
                        'relative',
                        isDragging && 'scale-95'
                      )}>
                        {isDragging && (
                          <div className="absolute -top-1 -left-1 w-6 h-6 rounded bg-[var(--primary)] flex items-center justify-center">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <LeadCard
                          lead={lead}
                          onClick={() => onLeadClick?.(lead)}
                          isDragging={isDragging}
                          disableClick={isTouchDevice()}
                        />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {column.leads.length === 0 && !placeholderIndex && (
                <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                  No leads in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
