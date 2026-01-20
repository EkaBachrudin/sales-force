'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Property, CreatePropertyDto } from '@/lib/types';
import { useProperties, usePropertyMutations } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';

const propertyTypeExamples = [
  'Rumah',
  'Rumah 1/2 Lantai',
  'Rumah 2 Lantai',
  'Apartemen',
  'Ruko',
  'Tanah Kavling'
];

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; property_type: string }) => Promise<void>;
  property?: Property;
  isLoading: boolean;
}

function PropertyModal({ isOpen, onClose, onSubmit, property, isLoading }: PropertyModalProps) {
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [customType, setCustomType] = useState('');
  const [useCustomType, setUseCustomType] = useState(false);

  useEffect(() => {
    if (property) {
      setName(property.name);
      if (propertyTypeExamples.includes(property.property_type)) {
        setPropertyType(property.property_type);
        setUseCustomType(false);
      } else {
        setCustomType(property.property_type);
        setUseCustomType(true);
      }
    } else {
      setName('');
      setPropertyType('');
      setCustomType('');
      setUseCustomType(false);
    }
  }, [property, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalPropertyType = useCustomType ? customType.trim() : propertyType;

    if (!name.trim()) {
      return;
    }

    if (!finalPropertyType) {
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        property_type: finalPropertyType,
      });
    } catch (err) {
      // Error is handled by the mutation onError
      throw err;
    }
  };

  const handleClose = () => {
    setName('');
    setPropertyType('');
    setCustomType('');
    setUseCustomType(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Property Name
            </label>
            <Input
              placeholder="e.g., Cluster A Type 36/60"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Max 100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Property Type
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="typeOption"
                  checked={!useCustomType}
                  onChange={() => {
                    setUseCustomType(false);
                    setCustomType('');
                  }}
                  className="w-4 h-4 text-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Select from examples</span>
              </label>

              {!useCustomType && (
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
                  required
                >
                  <option value="">Select a type</option>
                  {propertyTypeExamples.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="typeOption"
                  checked={useCustomType}
                  onChange={() => {
                    setUseCustomType(true);
                    setPropertyType('');
                  }}
                  className="w-4 h-4 text-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Custom type</span>
              </label>

              {useCustomType && (
                <Input
                  placeholder="e.g., Rumah 3 Lantai"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  maxLength={50}
                  required
                />
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Max 50 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !name.trim() || (!useCustomType && !propertyType) || (useCustomType && !customType.trim())}
            >
              {isLoading ? 'Saving...' : property ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  propertyName: string;
  isLoading: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, propertyName, isLoading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Delete Property
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete <span className="font-medium text-[var(--text-primary)]">{propertyName}</span>?
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [deletingProperty, setDeletingProperty] = useState<Property | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Fetch properties with custom hook
  const { data: properties = [], isLoading } = useProperties(search);

  // Mutations with custom hook
  const { createProperty, updateProperty, deleteProperty, isCreating, isUpdating, isDeleting } =
    usePropertyMutations({
      onCreateSuccess: () => {
        setIsModalOpen(false);
        setEditingProperty(undefined);
        setError(null);
      },
      onUpdateSuccess: () => {
        setIsModalOpen(false);
        setEditingProperty(undefined);
        setError(null);
      },
      onDeleteSuccess: () => {
        setIsDeleteModalOpen(false);
        setDeletingProperty(undefined);
        setError(null);
      },
      onError: (err: any) => {
        setError(err.message || 'An error occurred');
      },
    });

  const handleCreateProperty = async (data: CreatePropertyDto) => {
    await createProperty(data);
  };

  const handleUpdateProperty = async (data: { name: string; property_type: string }) => {
    if (!editingProperty) return;
    await updateProperty({ id: editingProperty.id, data });
  };

  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;
    await deleteProperty(deletingProperty.id);
  };

  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const openDeleteModal = (property: Property) => {
    setDeletingProperty(property);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProperty(undefined);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingProperty(undefined);
  };

  return (
    <>
      <DashboardLayout
        title="Properties"
        subtitle="Manage your property types"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Add Property
          </Button>
        }
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {search ? 'No properties found matching your search' : 'No properties yet'}
              </p>
              {!search && (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
                  Add Your First Property
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {property.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {property.property_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(property)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(property)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      <PropertyModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingProperty ? handleUpdateProperty : handleCreateProperty}
        property={editingProperty}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProperty}
        propertyName={deletingProperty?.name || ''}
        isLoading={isDeleting}
      />
    </>
  );
}
