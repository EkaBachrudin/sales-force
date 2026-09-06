import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useUnits } from '@/hooks/useUnits';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlockListItem, UnitListItem } from '@/lib/types';
import './ManageUnitsModal.css';

const PAGE_SIZE = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadgeModifier(status: string): string {
  switch (status.toLowerCase()) {
    case 'available':
      return 'manage-units__badge--available';
    case 'sold':
      return 'manage-units__badge--sold';
    case 'reserved':
      return 'manage-units__badge--reserved';
    case 'booked':
      return 'manage-units__badge--booked';
    default:
      return 'manage-units__badge--default';
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'available':
      return <CheckCircle2 className="manage-units__badge-icon" />;
    default:
      return <Circle className="manage-units__badge-icon" />;
  }
}

function formatLandArea(area: number | string): string {
  const num = typeof area === 'string' ? parseFloat(area) : area;
  return isNaN(num) ? '-' : num.toFixed(0);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('manage-units__badge', getStatusBadgeModifier(status))}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ManageUnitsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddUnit?: (blockId: string) => void;
  onDeleteBlock?: () => void;
  onDeleteUnit?: (unitId: string) => void;
  onDeleteUnits?: (unitIds: string[]) => void;
  onManageUnit?: (unitId: string) => void;
  onEditBlock?: (block: BlockListItem) => void;
  onActiveBlockChange?: (block: BlockListItem) => void;
  onUnitsLoaded?: (units: UnitListItem[]) => void;
  blocks?: BlockListItem[];
  initialBlockId?: string;
  propertyName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageUnitsModal({
  isOpen = false,
  onClose,
  onAddUnit,
  onDeleteBlock,
  onDeleteUnit,
  onDeleteUnits,
  onManageUnit,
  onEditBlock,
  onActiveBlockChange,
  onUnitsLoaded,
  blocks = [],
  initialBlockId,
  propertyName = '',
}: ManageUnitsModalProps) {
  useLockBodyScroll(isOpen);

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<string>(initialBlockId ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);

  const blockMenuRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeTab) ?? blocks[0],
    [blocks, activeTab],
  );

  const { data: unitsResponse, isLoading: isUnitsLoading } = useUnits(
    isOpen && activeBlock ? activeBlock.id : '',
  );
  const units = useMemo(() => unitsResponse?.data?.units ?? [], [unitsResponse]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(units.map((u) => u.status))),
    [units],
  );

  // Filter
  const filteredUnits = useMemo(() => {
    let result = units;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter(
        (u) => u.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    return result;
  }, [units, searchQuery, statusFilter]);

  // Pagination
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUnits.length / PAGE_SIZE)),
    [filteredUnits],
  );

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUnits.slice(start, start + PAGE_SIZE);
  }, [filteredUnits, currentPage]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  // Select-all helpers
  const isAllSelected =
    paginatedUnits.length > 0 &&
    paginatedUnits.every((u) => selectedUnits.has(u.id));

  const paginationInfo = {
    start: filteredUnits.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1,
    end: Math.min(currentPage * PAGE_SIZE, filteredUnits.length),
    total: filteredUnits.length,
  };

  // -----------------------------------------------------------------------
  // Effects
  // -----------------------------------------------------------------------

  // Sync activeTab when modal opens with a specific block
  useEffect(() => {
    if (isOpen && initialBlockId) {
      setActiveTab(initialBlockId);
    }
  }, [isOpen, initialBlockId]);

  // Reset local filters whenever tab or open state changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setStatusFilter('');
      setSelectedUnits(new Set());
      setCurrentPage(1);
    }
  }, [isOpen, activeTab]);

  // Report active block back to parent
  useEffect(() => {
    if (isOpen && activeBlock) {
      onActiveBlockChange?.(activeBlock);
    }
  }, [isOpen, activeBlock, onActiveBlockChange]);

  // Report loaded units back to parent (for edit-lookup while modal is closed)
  useEffect(() => {
    if (isOpen && units.length > 0) {
      onUnitsLoaded?.(units);
    }
  }, [isOpen, units, onUnitsLoaded]);

  // Close block menu on outside click
  useEffect(() => {
    if (!isBlockMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (blockMenuRef.current && !blockMenuRef.current.contains(e.target as Node)) {
        setIsBlockMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBlockMenuOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleTabChange = (blockId: string) => {
    setActiveTab(blockId);
    setIsBlockMenuOpen(false);
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUnits(new Set());
    } else {
      setSelectedUnits(new Set(paginatedUnits.map((u) => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUnits.size === 0) return;
    const ids = Array.from(selectedUnits);

    if (onDeleteUnits) {
      await onDeleteUnits(ids);
    } else if (onDeleteUnit) {
      for (const id of ids) {
        await onDeleteUnit(id);
      }
    }

    setSelectedUnits(new Set());
  };

  const handleAddUnit = () => {
    if (activeBlock) onAddUnit?.(activeBlock.id);
  };

  const handleEditBlock = () => {
    if (!activeBlock) return;
    setIsBlockMenuOpen(false);
    onEditBlock?.(activeBlock);
  };

  const handleDeleteBlock = () => {
    setIsBlockMenuOpen(false);
    onDeleteBlock?.();
  };

  // -----------------------------------------------------------------------
  // Early returns
  // -----------------------------------------------------------------------
  if (!isOpen) return null;

  if (blocks.length === 0) {
    return createPortal(
      <>
        <div className="manage-units__backdrop" onClick={onClose} />
        <div
          className="manage-units__overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="manage-units__empty">
            <p className="manage-units__empty-text">
              No blocks available for this property.
            </p>
            <button onClick={onClose} className="manage-units__empty-close">
              Close
            </button>
          </div>
        </div>
      </>,
      document.body,
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="manage-units__backdrop" onClick={onClose} />

      {/* Panel */}
      <div
        className="manage-units__overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Manage Units - ${propertyName}`}
      >
        <div className="manage-units__panel">
          {/* ============================================================ */}
          {/* Header                                                       */}
          {/* ============================================================ */}
          <div className="manage-units__header">
            <div className="manage-units__header-info">
              <h2 className="manage-units__title">Manage Unit</h2>
              <p className="manage-units__subtitle">{propertyName}</p>
            </div>
            <button
              onClick={handleAddUnit}
              className="manage-units__add-btn"
              aria-label="Add new unit"
            >
              <Plus className="manage-units__add-btn-icon" />
              Add Unit
            </button>
          </div>

          {/* ============================================================ */}
          {/* Block Tabs                                                    */}
          {/* ============================================================ */}
          <div className="manage-units__tabs-row">
            <div
              className="manage-units__tabs"
              role="tablist"
              aria-label="Block navigation"
            >
              {blocks.map((block) => (
                <button
                  key={block.id}
                  role="tab"
                  aria-selected={activeTab === block.id}
                  className={cn(
                    'manage-units__tab',
                    activeTab === block.id && 'manage-units__tab--active',
                  )}
                  onClick={() => handleTabChange(block.id)}
                >
                  {block.name}
                </button>
              ))}
            </div>

            {/* Desktop: Block Actions */}
            <div className="manage-units__block-actions">
              <button
                onClick={handleEditBlock}
                className="manage-units__block-action manage-units__block-action--edit"
                aria-label="Edit block"
              >
                <Edit2 className="manage-units__block-action-icon" />
                Edit Block
              </button>
              <button
                onClick={handleDeleteBlock}
                className="manage-units__block-action manage-units__block-action--delete"
                aria-label="Delete block"
              >
                <Trash2 className="manage-units__block-action-icon" />
                Delete Block
              </button>
            </div>

            {/* Mobile: Block Actions Dropdown */}
            <div className="manage-units__menu" ref={blockMenuRef}>
              <button
                onClick={() => setIsBlockMenuOpen((prev) => !prev)}
                className="manage-units__menu-btn"
                aria-label="Block actions"
                aria-haspopup="menu"
                aria-expanded={isBlockMenuOpen}
              >
                <MoreVertical className="manage-units__menu-icon" />
              </button>
              {isBlockMenuOpen && (
                <div className="manage-units__menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="manage-units__menu-item"
                    onClick={handleEditBlock}
                  >
                    <Edit2 className="manage-units__menu-item-icon manage-units__menu-item-icon--primary" />
                    Edit Block
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="manage-units__menu-item manage-units__menu-item--danger"
                    onClick={handleDeleteBlock}
                  >
                    <Trash2 className="manage-units__menu-item-icon" />
                    Delete Block
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Search & Filter                                               */}
          {/* ============================================================ */}
          <div className="manage-units__controls">
            {/* Search Input */}
            <div className="manage-units__search">
              <Search className="manage-units__search-icon" />
              <input
                type="text"
                placeholder="Search Unit (e.g., B4)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="manage-units__search-input"
                aria-label="Search units"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="manage-units__filter"
              aria-label="Filter by status"
            >
              <option value="">Show All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            {/* Bulk Delete (conditional) */}
            {selectedUnits.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="manage-units__bulk-btn"
                aria-label={`Delete ${selectedUnits.size} selected units`}
              >
                <Trash2 className="manage-units__bulk-btn-icon" />
                Hapus Terpilih ({selectedUnits.size})
              </button>
            )}
          </div>

          {/* ============================================================ */}
          {/* Content                                                      */}
          {/* ============================================================ */}
          <div className="manage-units__content">
            {isUnitsLoading ? (
              <div className="manage-units__state">
                <p className="manage-units__state-text">Loading units...</p>
              </div>
            ) : units.length === 0 ? (
              <div className="manage-units__state">
                <p className="manage-units__state-title">No units yet</p>
                <p className="manage-units__state-text">
                  Add units to this block to get started
                </p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="manage-units__state">
                <p className="manage-units__state-title">No results</p>
                <p className="manage-units__state-text">
                  No units match your search or filter criteria
                </p>
              </div>
            ) : (
              <>
                {/* -------------------------------------------------------- */}
                {/* Desktop Table                                             */}
                {/* -------------------------------------------------------- */}
                <table className="manage-units__table">
                  <thead>
                    <tr className="manage-units__table-head">
                      <th className="manage-units__table-th manage-units__table-th--checkbox">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate =
                                !isAllSelected &&
                                paginatedUnits.some((u) => selectedUnits.has(u.id));
                          }}
                          onChange={toggleSelectAll}
                          className="manage-units__checkbox"
                          aria-label="Select all units on this page"
                        />
                      </th>
                      <th className="manage-units__table-th">Unit ID</th>
                      <th className="manage-units__table-th">
                        Land Area (m&sup2;)
                      </th>
                      <th className="manage-units__table-th">Status</th>
                      <th className="manage-units__table-th manage-units__table-th--right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUnits.map((unit) => (
                      <tr key={unit.id} className="manage-units__table-tr">
                        <td className="manage-units__table-td">
                          <input
                            type="checkbox"
                            checked={selectedUnits.has(unit.id)}
                            onChange={() => toggleUnit(unit.id)}
                            className="manage-units__checkbox"
                            aria-label={`Select ${unit.name}`}
                          />
                        </td>
                        <td className="manage-units__table-td manage-units__table-td--name">
                          {unit.name}
                        </td>
                        <td className="manage-units__table-td manage-units__table-td--area">
                          {unit.land_area != null
                            ? `${formatLandArea(unit.land_area)} m\u00B2`
                            : '-'}
                        </td>
                        <td className="manage-units__table-td">
                          <StatusBadge status={unit.status} />
                        </td>
                        <td className="manage-units__table-td manage-units__table-td--right">
                          <div className="manage-units__row-actions manage-units__row-actions--right">
                            <button
                              type="button"
                              onClick={() => onManageUnit?.(unit.id)}
                              className="manage-units__row-action manage-units__row-action--edit"
                              aria-label={`Edit ${unit.name}`}
                            >
                              <Edit2 className="manage-units__row-action-icon" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteUnit?.(unit.id)}
                              className="manage-units__row-action manage-units__row-action--delete"
                              aria-label={`Delete ${unit.name}`}
                            >
                              <Trash2 className="manage-units__row-action-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* -------------------------------------------------------- */}
                {/* Mobile Cards                                              */}
                {/* -------------------------------------------------------- */}
                <div className="manage-units__cards">
                  {paginatedUnits.map((unit) => (
                    <div key={unit.id} className="manage-units__card">
                      {/* Row 1: Checkbox + Area */}
                      <div className="manage-units__card-top">
                        <input
                          type="checkbox"
                          checked={selectedUnits.has(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                          className="manage-units__checkbox manage-units__checkbox--card"
                          aria-label={`Select ${unit.name}`}
                        />
                        <span className="manage-units__card-area">
                          {unit.land_area != null
                            ? `${formatLandArea(unit.land_area)} m\u00B2`
                            : '-'}
                        </span>
                      </div>

                      {/* Row 2: Unit name */}
                      <h3 className="manage-units__card-name">{unit.name}</h3>

                      {/* Row 3: Status badge + action icons */}
                      <div className="manage-units__card-bottom">
                        <StatusBadge status={unit.status} />
                        <div className="manage-units__row-actions">
                          <button
                            type="button"
                            onClick={() => onManageUnit?.(unit.id)}
                            className="manage-units__row-action manage-units__row-action--edit"
                            aria-label={`Edit ${unit.name}`}
                          >
                            <Edit2 className="manage-units__row-action-icon" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteUnit?.(unit.id)}
                            className="manage-units__row-action manage-units__row-action--delete"
                            aria-label={`Delete ${unit.name}`}
                          >
                            <Trash2 className="manage-units__row-action-icon" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ============================================================ */}
          {/* Footer                                                       */}
          {/* ============================================================ */}
          <div className="manage-units__footer">
            {/* Pagination row */}
            <div className="manage-units__pagination">
              <p className="manage-units__pagination-info">
                Showing {paginationInfo.start}–{paginationInfo.end} of{' '}
                {paginationInfo.total} Units
              </p>

              <div className="manage-units__pagination-btns">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="manage-units__page-btn manage-units__page-btn--nav"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="manage-units__page-icon" />
                  Prev
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'manage-units__page-btn manage-units__page-btn--number',
                      currentPage === page && 'manage-units__page-btn--active',
                    )}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="manage-units__page-btn manage-units__page-btn--nav"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="manage-units__page-icon" />
                </button>
              </div>
            </div>

            {/* Close */}
            <div className="manage-units__close-row">
              <button
                type="button"
                onClick={onClose}
                className="manage-units__close-btn"
              >
                <X className="manage-units__close-icon" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
