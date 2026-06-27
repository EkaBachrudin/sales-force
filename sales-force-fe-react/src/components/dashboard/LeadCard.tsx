
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Lead, ReminderData, KprSimulation } from '@/lib/types';

export type { Lead, ReminderData, KprSimulation };

export interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
  disableClick?: boolean; // Disable click when using touch drag
}

export function LeadCard({ lead, onClick, isDragging, className, disableClick }: LeadCardProps) {
  const [hasFollowUp, setHasFollowUp] = useState(false);

  useEffect(() => {
    if (lead.followUpDate) {
      setHasFollowUp(new Date(lead.followUpDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
  }, [lead.followUpDate]);

  return (
    <div
      onClick={disableClick ? undefined : onClick}
      className={cn(
        'bg-white rounded-lg border-gray-400 border p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary active:scale-[0.98]',
        isDragging && 'opacity-90 shadow-lg',
        className
      )}
    >
      {/* Header - Property Type & Timestamp */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="blue" size="sm">
          {lead.property.name}
        </Badge>
        <span className="text-[11px] text-text-secondary">
          {formatRelativeTime(lead.created_at)}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {lead.name}
      </h3>

      {/* Follow Up Reminder */}
      {hasFollowUp && lead.followUpDate && (
        <div className="flex items-center gap-2 text-[11px] text-warning">
          <Bell className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Follow up: {new Date(lead.followUpDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
