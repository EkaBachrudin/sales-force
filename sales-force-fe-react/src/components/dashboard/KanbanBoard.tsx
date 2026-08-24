
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LeadCard } from './LeadCard';
import type { Lead, PipelineStage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GripVertical, Loader2 } from 'lucide-react';
import './KanbanBoard.css';

export type { Lead, PipelineStage };

export interface PipelineColumn {
  id: PipelineStage;
  label: string;
  color: 'gray' | 'blue' | 'purple' | 'orange' | 'teal' | 'green' | 'red';
  leads: Lead[];
}

const stageConfig: Record<PipelineStage, { label: string; color: PipelineColumn['color'] }> = {
  new: { label: 'New', color: 'gray' },
  contacted: { label: 'Contacted', color: 'blue' },
  surveyed: { label: 'Surveyed', color: 'purple' },
  negotiating: { label: 'Negotiating', color: 'orange' },
  booked: { label: 'Booked', color: 'teal' },
  closed: { label: 'Closed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

const colorStyles = {
  gray: 'kanban-board__column--gray',
  blue: 'kanban-board__column--blue',
  purple: 'kanban-board__column--purple',
  orange: 'kanban-board__column--orange',
  teal: 'kanban-board__column--teal',
  green: 'kanban-board__column--green',
  red: 'kanban-board__column--red',
};

const headerColorStyles = {
  gray: 'kanban-board__column-label--gray',
  blue: 'kanban-board__column-label--blue',
  purple: 'kanban-board__column-label--purple',
  orange: 'kanban-board__column-label--orange',
  teal: 'kanban-board__column-label--teal',
  green: 'kanban-board__column-label--green',
  red: 'kanban-board__column-label--red',
};

// Custom type for drag data
const DRAG_TYPE = 'application/vnd.lead.card';

export interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStageChange?: (leadId: string, newStage: PipelineStage) => void;
  className?: string;
  isUpdating?: boolean;
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

export function KanbanBoard({ leads, onLeadClick, onStageChange, className, isUpdating }: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [draggedOverStage, setDraggedOverStage] = useState<PipelineStage | null>(null);
  const draggedLeadRef = useRef<Lead | null>(null);

  // Touch-specific state
  const touchStateRef = useRef<TouchState | null>(null);
  const isDraggingRef = useRef(false);
  const columnsRef = useRef<PipelineColumn[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentTouchPosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll configuration
  const SCROLL_EDGE_THRESHOLD = 80; // Distance from edge (px) to trigger auto-scroll
  const SCROLL_SPEED = 15; // Pixels per scroll step

  // Clear all drag states when leads prop changes (after drop and re-render)
  useEffect(() => {
    setDraggedLeadId(null);
    setDraggedOverStage(null);
    draggedLeadRef.current = null;
    touchStateRef.current = null;
    isDraggingRef.current = false;
  }, [leads]);

  // Clean up touch state on unmount
  useEffect(() => {
    return () => {
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
    setDraggedOverStage(null);
    draggedLeadRef.current = null;
  }, []);

  // === Touch Event Handlers for Mobile ===

  const handleTouchStart = useCallback((e: React.TouchEvent, lead: Lead) => {
    if (!isTouchDevice()) return;

    // Prevent the touch from propagating to card click
    e.stopPropagation();

    const touch = e.touches[0];
    // Get the card element (parent of the drag handle), not the handle itself
    const handleElement = e.currentTarget as HTMLElement;
    const element = handleElement.closest('[data-lead-id]') as HTMLElement;

    if (!element) return;

    // Store current touch position - will be updated during touch moves
    currentTouchPosRef.current = { clientX: touch.clientX, clientY: touch.clientY };

    // Immediately start dragging on touch (no long press needed for drag handle)
    isDraggingRef.current = true;
    setDraggedLeadId(lead.id);

    // Create a visual clone for dragging - clone the card, not the handle
    const rect = element.getBoundingClientRect();
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.borderRadius = '10px';
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

    // Add visual feedback to original card
    element.style.opacity = '0.3';

    touchStateRef.current = {
      leadId: lead.id,
      lead,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      element,
      clone,
    };
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

      // Find which column we're over using bounding box detection
      // This allows detection anywhere in the column, not just on [data-stage] elements
      const allColumns = Array.from(document.querySelectorAll('[data-stage]'));
      let targetStage: PipelineStage | null = null;

      for (const columnEl of allColumns) {
        const rect = columnEl.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          targetStage = columnEl.getAttribute('data-stage') as PipelineStage;
          break;
        }
      }

      // Also check the column container itself (in case we're above the leads list)
      if (!targetStage) {
        // Get all pipeline stage columns by checking their color classes or structure
        const columnContainers = Array.from(
          document.querySelectorAll('.kanban-board__column')
        );

        for (const container of columnContainers) {
          const rect = container.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            // Find the data-stage attribute within this container
            const stageEl = container.querySelector('[data-stage]');
            if (stageEl) {
              targetStage = stageEl.getAttribute('data-stage') as PipelineStage;
              break;
            }
          }
        }
      }

      if (targetStage) {
        setDraggedOverStage(targetStage);
      } else {
        setDraggedOverStage(null);
      }

      rafRef.current = null;
    });
  }, []); // No dependencies - uses refs instead

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Prevent the touch from propagating to card click
    e.stopPropagation();

    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Drag handle is always for dragging, not clicking
    if (!touchStateRef.current || !isDraggingRef.current) {
      draggedLeadRef.current = null;
      currentTouchPosRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    const touchState = touchStateRef.current;
    const touch = e.changedTouches[0];

    // Find drop target using bounding box detection (same logic as handleTouchMove)
    let targetStage: PipelineStage | null = null;

    // First try to find [data-stage] elements
    const allColumns = Array.from(document.querySelectorAll('[data-stage]'));
    for (const columnEl of allColumns) {
      const rect = columnEl.getBoundingClientRect();
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        targetStage = columnEl.getAttribute('data-stage') as PipelineStage;
        break;
      }
    }

    // If not found, check column containers
    if (!targetStage) {
      const columnContainers = Array.from(
        document.querySelectorAll('.kanban-board__column')
      );

      for (const container of columnContainers) {
        const rect = container.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const stageEl = container.querySelector('[data-stage]');
          if (stageEl) {
            targetStage = stageEl.getAttribute('data-stage') as PipelineStage;
            break;
          }
        }
      }
    }

    if (targetStage && touchState.lead.status !== targetStage && onStageChange) {
      onStageChange(touchState.leadId, targetStage);
    }

    // Clean up
    if (touchState.clone) {
      touchState.clone.remove();
    }
    touchState.element.style.opacity = '1';

    setDraggedOverStage(null);
    setDraggedLeadId(null);
    draggedLeadRef.current = null;
    touchStateRef.current = null;
    currentTouchPosRef.current = null;
    isDraggingRef.current = false;
  }, [onStageChange]);

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

    // Set the dragged over stage for visual indicator
    setDraggedOverStage(targetStage);
  }, []);

  // Handle drag leave - remove placeholder when leaving column
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Check if we're still within the column bounds
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDraggedOverStage(null);
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
    setDraggedOverStage(null);
    setDraggedLeadId(null);
    draggedLeadRef.current = null;
  }, [onStageChange]);

  return (
    <div className={cn('kanban-board', className)}>
      {/* Board Header */}
      <div className="kanban-board__header">
        <h2 className="kanban-board__title">Pipeline</h2>
        <div className="kanban-board__header-actions">
          <button className="kanban-board__board-button">Board</button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div ref={scrollContainerRef} className="kanban-board__columns">
        {columns.map((column) => {
          const isDraggedOver = draggedOverStage === column.id;
          return (
            <div
              key={column.id}
              className={cn(
                'kanban-board__column',
                colorStyles[column.color],
                isDraggedOver && 'kanban-board__column--dragged-over'
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
            {/* Column Header */}
            <div className="kanban-board__column-header">
              <div className={cn('kanban-board__column-label', headerColorStyles[column.color])}>
                {column.label}
              </div>
              <span className="kanban-board__column-count">{column.leads.length}</span>
            </div>

            {/* Leads List */}
            <div className="kanban-board__leads" data-stage={column.id}>

              {column.leads.map((lead) => {
                const isDragging = draggedLeadId === lead.id;

                return (
                  <React.Fragment key={lead.id}>
                    {/* Lead Card */}
                    <div
                      data-lead-id={lead.id}
                      className={cn('kanban-board__lead', isDragging && 'kanban-board__lead--dragging')}
                    >
                      <div className={cn('kanban-board__lead-inner', isDragging && 'kanban-board__lead-inner--dragging')}>
                        {/* Drag Handle - Only this is draggable */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleTouchStart(e, lead)}
                          onTouchEnd={handleTouchEnd}
                          className={cn('kanban-board__drag-handle', isDragging && 'kanban-board__drag-handle--dragging')}
                        >
                          <GripVertical className={cn('kanban-board__drag-icon', isDragging && 'kanban-board__drag-icon--dragging')} />
                        </div>
                        <LeadCard
                          lead={lead}
                          onClick={() => onLeadClick?.(lead)}
                          isDragging={isDragging}
                          disableClick={false}
                        />
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {column.leads.length === 0 && (
                <div className="kanban-board__empty">No leads in this stage</div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Loading overlay for drag-drop operations */}
      {isUpdating && (
        <div className="kanban-board__loading">
          <div className="kanban-board__loading-card">
            <Loader2 className="kanban-board__loading-icon" />
            <span className="kanban-board__loading-text">Updating lead status...</span>
          </div>
        </div>
      )}
    </div>
  );
}
