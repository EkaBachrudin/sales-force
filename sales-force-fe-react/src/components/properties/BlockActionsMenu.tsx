import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './BlockActionsMenu.css';

export interface BlockActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  ariaLabel?: string;
}

export function BlockActionsMenu({ onEdit, onDelete, ariaLabel = 'Block actions' }: BlockActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + 4,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownHeight = dropdownRef.current.offsetHeight;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow >= dropdownHeight + gap) {
      top = rect.bottom + gap;
    } else if (spaceAbove >= dropdownHeight + gap) {
      top = rect.top - dropdownHeight - gap;
    } else {
      top = Math.max(gap, window.innerHeight - dropdownHeight - gap);
    }

    setPosition({
      top,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside =
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target);
      if (!isInside) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handleScrollOrResize = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="block-actions-menu" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        className="block-actions-menu__button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <MoreVertical className="block-actions-menu__icon" />
      </Button>

      {isOpen && position && createPortal(
        <div
          ref={dropdownRef}
          className="block-actions-menu__dropdown"
          style={{ top: position.top, right: position.right }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="block-actions-menu__item"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="block-actions-menu__item block-actions-menu__item--danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
