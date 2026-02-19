'use client';

import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatDateTime } from '@/lib/utils';

export interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  property: string;
  scheduledFor: Date | string;
  type: 'follow-up' | 'call' | 'site-visit' | 'meeting';
  notes?: string;
}

export interface RemindersSectionProps {
  reminders: Reminder[];
  onReminderClick?: (reminder: Reminder) => void;
  onWhatsApp?: (reminder: Reminder) => void;
  onCall?: (reminder: Reminder) => void;
  onSnooze?: (reminder: Reminder) => void;
  maxItems?: number;
  className?: string;
}

export function RemindersSection({
  reminders,
  onReminderClick,
  onWhatsApp,
  onCall,
  onSnooze,
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
    <div className={cn('bg-white rounded-xl border border-border', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            <h3 className="text-base font-semibold text-text-primary">
              Upcoming Reminders
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-1 ml-7">
            Menampilkan jadwal follow-up untuk hari ini hingga 7 hari ke depan
          </p>
        </div>
        {reminders.length > maxItems && (
          <button className="text-sm text-primary hover:underline font-medium self-start sm:self-auto">
            See all →
          </button>
        )}
      </div>

      {/* Reminders List */}
      <div className="divide-y divide-[var(--border)]">
        {displayReminders.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-sm text-text-secondary">
            No upcoming reminders
          </div>
        ) : (
          displayReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="p-3 sm:p-4 hover:bg-orange-50/30 transition-colors cursor-pointer"
              onClick={() => onReminderClick?.(reminder)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Time & Name - Stack on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">
                      {isClient ? getTimeLabel(reminder.scheduledFor) : 'Loading...'}
                    </span>
                    <span className="text-xs text-text-secondary">
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
                  <p className="text-sm text-text-primary mb-0.5 truncate">
                    {reminder.leadName}
                  </p>

                  {/* Property */}
                  <p className="text-xs text-text-secondary mb-1 truncate">
                    Property: {reminder.property}
                  </p>

                  {/* Notes */}
                  {reminder.notes && (
                    <div className="relative pl-3 mb-2">
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full"></div>
                      <p className="text-xs text-gray-600 italic line-clamp-2">
                        "{reminder.notes}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhatsApp?.(reminder);
                      }}
                      className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall?.(reminder);
                      }}
                      className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSnooze?.(reminder);
                      }}
                      className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      title="Snooze"
                    >
                      <Clock className="w-4 h-4" />
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
