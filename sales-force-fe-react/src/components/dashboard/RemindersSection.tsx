
import { useState, useEffect } from 'react';
import { Bell, MessageCircle, Phone, Clock } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { Reminder } from '@/lib/types';
import './RemindersSection.css';

export type { Reminder };

export interface RemindersSectionProps {
  reminders: Reminder[];
  onReminderClick?: (reminder: Reminder) => void;
  onWhatsApp?: (reminder: Reminder) => void;
  onCall?: (reminder: Reminder) => void;
  onSnooze?: (reminder: Reminder) => void;
  onSeeAll?: () => void;
  maxItems?: number;
  className?: string;
}

export function RemindersSection({
  reminders,
  onReminderClick,
  onWhatsApp,
  onCall,
  onSnooze,
  onSeeAll,
  maxItems = 3,
  className,
}: RemindersSectionProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const displayReminders = reminders.slice(0, maxItems);

  const isToday = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const isTomorrow = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate()
    );
  };

  const getTimeLabel = (date: Date | string) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDateTime(date);
  };

  return (
    <div className={cn('reminders', className)}>
      {/* Header */}
      <div className="reminders__header">
        <div>
          <div className="reminders__title-row">
            <Bell className="reminders__title-icon" />
            <h3 className="reminders__title">Upcoming Reminders</h3>
          </div>
          <p className="reminders__subtitle">
            Menampilkan jadwal follow-up untuk hari ini hingga 7 hari ke depan
          </p>
        </div>
        {onSeeAll && reminders.length > maxItems && (
          <button onClick={onSeeAll} className="reminders__see-all">
            See all →
          </button>
        )}
      </div>

      {/* Reminders List */}
      <div className="reminders__list">
        {displayReminders.length === 0 ? (
          <div className="reminders__empty">No upcoming reminders</div>
        ) : (
          displayReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="reminders__item"
              onClick={() => onReminderClick?.(reminder)}
            >
              <div className="reminders__item-inner">
                {/* Icon */}
                <div className="reminders__icon">
                  <Bell className="reminders__icon-svg" />
                </div>

                {/* Content */}
                <div className="reminders__content">
                  {/* Time & Name - Stack on mobile */}
                  <div className="reminders__meta">
                    <span className="reminders__time">
                      {isClient ? getTimeLabel(reminder.scheduledFor) : 'Loading...'}
                    </span>
                    <span className="reminders__time-value">
                      {isClient ? (() => {
                        const d = typeof reminder.scheduledFor === 'string'
                          ? new Date(reminder.scheduledFor)
                          : reminder.scheduledFor;
                        const hours = d.getHours().toString().padStart(2, '0');
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        return `${hours}:${minutes}`;
                      })() : '--:--'}
                    </span>
                  </div>

                  {/* Lead Name */}
                  <p className="reminders__name">{reminder.leadName}</p>

                  {/* Property */}
                  <p className="reminders__property">Property: {reminder.property}</p>

                  {/* Notes */}
                  {reminder.notes && (
                    <div className="reminders__notes">
                      <div className="reminders__notes-bar"></div>
                      <p className="reminders__notes-text">"{reminder.notes}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="reminders__actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhatsApp?.(reminder);
                      }}
                      className="reminders__action reminders__action--whatsapp"
                      title="WhatsApp"
                    >
                      <MessageCircle className="reminders__action-icon" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall?.(reminder);
                      }}
                      className="reminders__action reminders__action--call"
                      title="Call"
                    >
                      <Phone className="reminders__action-icon" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSnooze?.(reminder);
                      }}
                      className="reminders__action reminders__action--snooze"
                      title="Snooze"
                    >
                      <Clock className="reminders__action-icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
