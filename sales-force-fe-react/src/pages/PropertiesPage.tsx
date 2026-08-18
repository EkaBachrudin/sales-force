import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Building2, Map } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Property } from '@/lib/types';
import { useProperties, usePropertyMutations } from '@/hooks/useProperties';



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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-text-primary">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-5">
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
            <div className="space-y-5">
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
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Siteplan
                </label>
                <FileUpload
                  onFileSelect={setSiteplanFile}
                  currentFile={siteplanFile}
                  maxSizeMB={10}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Delete Property
          </h2>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-medium text-text-primary">{propertyName}</span>?
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
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<Property | undefined>();
  const [error, setError] = useState<string | null>(null);

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
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-4">
                {search ? 'No properties found matching your search' : 'No properties yet'}
              </p>
              {!search && (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
                  Add Your First Property
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {property.name}
                    </h3>
                  </div>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => navigate(`/properties/${property.id}`)}
                       className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                       title="Edit"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => navigate(`/properties/${property.id}/siteplan`)}
                       className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                       title="Siteplan"
                     >
                       <Map className="w-4 h-4" />
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
