'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Mail, Bell, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatPhone, formatRelativeTime } from '@/lib/utils';

export interface ReminderData {
  id: string;
  user_id: string;
  lead_id: string;
  remind_at: string;
  message: string;
  is_completed: string;
  created_at: string;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nik?: string;
  npwp?: string;
  property: {
    name: string;
    property_type: string;
  };
  budget_range: {
    max: number;
    min: number;
  }
  kpr_simulation?: KprSimulation;
  status: string;
  followUpDate?: Date | string;
  created_at: Date | string;
  source?: string;
  notes?: string;
  reminders?: ReminderData[];
  kprPrice?: number;
  kprDownPayment?: number;
  interest_rate?: number;
  loan_term_years?: number;
  property_id: string;
}

export interface KprSimulation {
  property_price: number;
  down_payment_percentage: number;
  down_payment: number;
  interest_rate: number;
  loan_term_years: number;
  estimated_monthly_payment: string;
}

export interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

export function LeadCard({ lead, onClick, isDragging, className }: LeadCardProps) {
  const [hasFollowUp, setHasFollowUp] = useState(false);

  useEffect(() => {
    if (lead.followUpDate) {
      setHasFollowUp(new Date(lead.followUpDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
  }, [lead.followUpDate]);

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--primary)] active:scale-[0.98]',
        isDragging && 'opacity-90 shadow-lg',
        className
      )}
    >
      {/* Header - Property Type & Timestamp */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="blue" size="sm">
          {lead.property.name}
        </Badge>
        <span className="text-[11px] text-[var(--text-secondary)]">
          {formatRelativeTime(lead.created_at)}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {lead.name}
      </h3>

      {/* Phone */}
      <a
        href={`tel:${lead.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] mb-3"
      >
        <Phone className="w-3 h-3" />
        {formatPhone(lead.phone)}
      </a>

      {/* Divider */}
      <div className="w-1/2 h-px bg-[var(--border)] mb-3" />

      {/* Follow Up Reminder */}
      {hasFollowUp && lead.followUpDate && (
        <div className="flex items-center gap-2 text-[11px] text-[var(--warning)]">
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-[var(--border)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
          }}
          className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
          title="WhatsApp"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `tel:${lead.phone}`;
          }}
          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          title="Call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
