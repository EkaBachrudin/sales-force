import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Building2, Map, MapPin, Ruler } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Property } from '@/lib/types';
import { useProperties, usePropertyMutations } from '@/hooks/useProperties';
import { useAuth } from '@/contexts/AuthContext';
import './PropertiesPage.css';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  property?: Property;
  isLoading: boolean;
}

function PropertyModal({ isOpen, onClose, onSubmit, property, isLoading }: PropertyModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [landArea, setLandArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [siteplanFile, setSiteplanFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property) {
      setName(property.name);
      setCity('');
      setLandArea('');
      setAddress('');
      setDescription('');
      setSiteplanFile(null);
      setErrors({});
    } else {
      setName('');
      setCity('');
      setLandArea('');
      setAddress('');
      setDescription('');
      setSiteplanFile(null);
      setErrors({});
    }
  }, [property, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Property name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Property name must be less than 100 characters';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    } else if (city.length > 100) {
      newErrors.city = 'City must be less than 100 characters';
    }

    if (!landArea.trim()) {
      newErrors.landArea = 'Land area is required';
    } else {
      const area = parseFloat(landArea);
      if (isNaN(area) || area <= 0) {
        newErrors.landArea = 'Land area must be a positive number';
      }
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    } else if (address.length > 500) {
      newErrors.address = 'Address must be less than 500 characters';
    }

    if (description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('city', city.trim());
      formData.append('land_area', landArea);
      formData.append('address', address.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (siteplanFile) {
        formData.append('siteplan_file', siteplanFile);
      }

      await onSubmit(formData);
    } catch (err) {
      throw err;
    }
  };

  const handleClose = () => {
    setName('');
    setCity('');
    setLandArea('');
    setAddress('');
    setDescription('');
    setSiteplanFile(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="property-modal">
      <div className="property-modal__panel">
        <div className="property-modal__header">
          <h2 className="property-modal__title">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="property-modal__form">
          <div className="property-modal__grid">
            {/* Left Column */}
            <div className="property-modal__column">
              <Input
                label="Property Name"
                placeholder="e.g., Cluster A Type 36/60"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                error={errors.name}
                helperText={!errors.name ? 'Max 100 characters' : undefined}
              />

              <Input
                label="City"
                placeholder="e.g., Jakarta"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                required
                error={errors.city}
                helperText={!errors.city ? 'Max 100 characters' : undefined}
              />

              <Input
                label="Land Area"
                type="number"
                placeholder="e.g., 500"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                min="0"
                step="0.01"
                required
                error={errors.landArea}
                helperText={!errors.landArea ? 'Enter land area in square meters' : undefined}
              />

              <Textarea
                label="Address"
                placeholder="Enter complete property address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={500}
                required
                error={errors.address}
                helperText={!errors.address ? 'Max 500 characters' : undefined}
                showCharacterCount
              />
            </div>

            {/* Right Column */}
            <div className="property-modal__column">
              <Textarea
                label="Description"
                placeholder="Enter property description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                error={errors.description}
                helperText={!errors.description ? 'Max 1000 characters' : undefined}
                showCharacterCount
              />

              <div>
                <label className="property-modal__field-label">Siteplan</label>
                <FileUpload
                  onFileSelect={setSiteplanFile}
                  currentFile={siteplanFile}
                  maxSizeMB={10}
                />
              </div>
            </div>
          </div>

          <div className="property-modal__footer">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              className="property-modal__footer-button"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="property-modal__footer-button" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
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
    <div className="property-delete-modal">
      <div className="property-delete-modal__panel">
        <div className="property-delete-modal__body">
          <div className="property-delete-modal__icon">
            <Trash2 className="property-delete-modal__icon-svg" />
          </div>
          <h2 className="property-delete-modal__title">Delete Property</h2>
          <p className="property-delete-modal__text">
            Are you sure you want to delete{' '}
            <span className="property-delete-modal__highlight">{propertyName}</span>?
            This action cannot be undone.
          </p>
        </div>

        <div className="property-delete-modal__actions">
          <Button onClick={onClose} className="property-delete-modal__button" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="property-delete-modal__button property-delete-modal__button--danger"
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
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<Property | undefined>();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const canModify = user?.role === 'Admin' || user?.role === 'Supervisor';

  // Fetch properties with custom hook
  const { data: properties = [], isLoading } = useProperties(search);

  // Mutations with custom hook
  const { createProperty, deleteProperty, isCreating, isDeleting } =
    usePropertyMutations({
      onCreateSuccess: () => {
        setIsModalOpen(false);
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

  const handleCreateProperty = async (formData: FormData) => {
    await createProperty(formData);
  };

  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;
    await deleteProperty(deletingProperty.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openDeleteModal = (property: Property) => {
    setDeletingProperty(property);
    setIsDeleteModalOpen(true);
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
          <Button leftIcon={<Plus className="properties-page__add-icon" />} onClick={() => setIsModalOpen(true)}>
            Add Property
          </Button>
        }
      >
        {error && (
          <div className="properties-page__error">
            <p className="properties-page__error-text">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="properties-page__search">
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="properties-page__search-icon" />}
          />
        </div>

        {/* Properties List */}
        <div className="properties-page__list-container">
          {isLoading ? (
            <div className="properties-page__loading">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="properties-page__empty">
              <Building2 className="properties-page__empty-icon" />
              <p className="properties-page__empty-text">
                {search ? 'No properties found matching your search' : 'No properties yet'}
              </p>
              {!search && (
                <Button leftIcon={<Plus className="properties-page__add-icon" />} onClick={() => setIsModalOpen(true)}>
                  Add Your First Property
                </Button>
              )}
            </div>
          ) : (
            <div className="properties-page__list">
              {properties.map((property) => (
                <div key={property.id} className="properties-page__property">
                  <div className="properties-page__property-info">
                    <h3 className="properties-page__property-name">{property.name}</h3>
                    <div className="properties-page__property-meta">
                      {property.city && (
                        <p className="properties-page__property-meta-item">
                          <MapPin className="properties-page__property-meta-icon" />
                          {property.city}
                        </p>
                      )}
                      {property.land_area != null && (
                        <p className="properties-page__property-meta-item">
                          <Ruler className="properties-page__property-meta-icon" />
                          {property.land_area} m²
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="properties-page__actions">
                    {canModify && (
                      <button
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="properties-page__action-btn"
                        title="Edit"
                      >
                        <Pencil className="properties-page__action-btn-icon" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/properties/${property.id}/siteplan`)}
                      className="properties-page__action-btn"
                      title="Siteplan"
                    >
                      <Map className="properties-page__action-btn-icon" />
                    </button>
                    {canModify && (
                      <button
                        onClick={() => openDeleteModal(property)}
                        className="properties-page__action-btn properties-page__action-btn--delete"
                        title="Delete"
                      >
                        <Trash2 className="properties-page__action-btn-icon" />
                      </button>
                    )}
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
        onSubmit={handleCreateProperty}
        isLoading={isCreating}
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
