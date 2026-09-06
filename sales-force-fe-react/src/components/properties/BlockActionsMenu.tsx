import { useState, useRef, useEffect } from 'react';
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

  const updatePosition = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
  };

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
