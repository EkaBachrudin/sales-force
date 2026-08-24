
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Lead, ReminderData, KprSimulation } from '@/lib/types';
import './LeadCard.css';

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
      className={cn('lead-card', isDragging && 'lead-card--dragging', className)}
    >
      {/* Header - Property Type & Timestamp */}
      <div className="lead-card__header">
        <Badge variant="blue" size="sm">
          {lead.property.name}
        </Badge>
        <span className="lead-card__time">{formatRelativeTime(lead.created_at)}</span>
      </div>

      {/* Name */}
      <h3 className="lead-card__name">{lead.name}</h3>

      {/* Follow Up Reminder */}
      {hasFollowUp && lead.followUpDate && (
        <div className="lead-card__follow-up">
          <Bell className="lead-card__follow-up-icon" />
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
