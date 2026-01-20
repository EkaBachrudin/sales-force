'use client';

import React, { useState } from 'react';
import { LeadCard, Lead } from './LeadCard';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';

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

export interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  className?: string;
}

export function KanbanBoard({ leads, onLeadClick, className }: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // Group leads by stage
  const columns: PipelineColumn[] = Object.entries(stageConfig).map(([stage, config]) => ({
    id: stage as PipelineStage,
    label: config.label,
    color: config.color,
    leads: leads.filter((lead) => lead.status === stage),
  }));

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
  };

  const handleDrop = (targetStage: PipelineStage) => {
    if (draggedLead) {
      // In a real app, this would update the lead's stage in the database
      console.log(`Moving lead ${draggedLead.id} to ${targetStage}`);
    }
  };

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
              'flex-shrink-0 w-80 rounded-xl border p-4',
              colorStyles[column.color]
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.id)}
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
            <div className="space-y-3">
              {column.leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead)}
                  onDragEnd={handleDragEnd}
                >
                  <LeadCard
                    lead={lead}
                    onClick={() => onLeadClick?.(lead)}
                    isDragging={draggedLead?.id === lead.id}
                  />
                </div>
              ))}

              {column.leads.length === 0 && (
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
