'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LeadCard, Lead } from './LeadCard';
import { cn } from '@/lib/utils';
import { Plus, GripVertical } from 'lucide-react';

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

export function KanbanBoard({ leads, onLeadClick, onStageChange, className }: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState<{ stage: PipelineStage; index: number } | null>(null);
  const draggedLeadRef = useRef<Lead | null>(null);

  // Clear all drag states when leads prop changes (after drop and re-render)
  useEffect(() => {
    setDraggedLeadId(null);
    setPlaceholderIndex(null);
    draggedLeadRef.current = null;
  }, [leads]);

  // Group leads by stage
  const columns: PipelineColumn[] = Object.entries(stageConfig).map(([stage, config]) => ({
    id: stage as PipelineStage,
    label: config.label,
    color: config.color,
    leads: leads.filter((lead) => lead.status === stage),
  }));

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
      <div className="flex gap-4 overflow-x-auto pb-4">
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

            {/* Add Lead Button */}
            <button className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed mb-3 text-sm font-medium transition-colors',
              column.color === 'gray' && 'border-gray-300 text-gray-500 hover:bg-gray-100',
              column.color === 'blue' && 'border-blue-300 text-blue-500 hover:bg-blue-100',
              column.color === 'purple' && 'border-purple-300 text-purple-500 hover:bg-purple-100',
              column.color === 'orange' && 'border-orange-300 text-orange-500 hover:bg-orange-100',
              column.color === 'green' && 'border-green-300 text-green-500 hover:bg-green-100',
              column.color === 'red' && 'border-red-300 text-red-500 hover:bg-red-100',
            )}>
              <Plus className="w-4 h-4" />
              Add Lead
            </button>

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
                      className={cn(
                        'transition-all',
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
