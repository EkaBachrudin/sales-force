import { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MoreVertical className="block-actions-menu__icon" />
      </Button>

      {isOpen && (
        <div className="block-actions-menu__dropdown" role="menu">
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
        </div>
      )}
    </div>
  );
}