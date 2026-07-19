import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Building2, Trash2, ChevronLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { AddBlockModal } from '@/components/properties/AddBlockModal';
import type { BlockListItem } from '@/lib/types';
import { usePropertyDetail, usePropertyUpdate } from '@/hooks/usePropertyDetail';
import { useBlockMutations } from '@/hooks/useBlocks';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [landArea, setLandArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [siteplanFile, setSiteplanFile] = useState<File | null>(null);
  const [hideSiteplanPreview, setHideSiteplanPreview] = useState(false);
  const [deleteSiteplan, setDeleteSiteplan] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);

  const { data: propertyData, isLoading, error } = usePropertyDetail(id || '');

  const updateMutation = usePropertyUpdate();
  const { createBlock, isCreating } = useBlockMutations();

  useEffect(() => {
    if (propertyData?.property) {
      const property = propertyData.property;
      setName(property.name);
      setCity(property.city);
      setLandArea(property.land_area?.toString() || '');
      setAddress(property.address || '');
      setDescription(property.description || '');
      setErrors({});
      setHideSiteplanPreview(false);
      setDeleteSiteplan(false);
      setSiteplanFile(null);
    }
  }, [propertyData]);

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
    setSuccessMessage('');

    if (!validateForm() || !id) {
      return;
    }

    const newErrors: Record<string, string> = {};

    if (deleteSiteplan && siteplanFile) {
      newErrors.siteplan = 'Cannot delete siteplan and upload new file at the same time';
      setErrors(newErrors);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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

      await updateMutation.mutateAsync({ propertyId: id, formData, deleteSiteplan });
      setSuccessMessage('Property updated successfully');
      setSiteplanFile(null);
      setHideSiteplanPreview(false);
      setDeleteSiteplan(false);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to update property' });
    }
  };

  const handleAddBlock = () => {
    setIsAddBlockModalOpen(true);
  };

  const handleBlockSubmit = async (blockName: string) => {
    try {
      await createBlock({ propertyId: id || '', name: blockName });
      setIsAddBlockModalOpen(false);
      setSuccessMessage('Block created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create block' });
    }
  };

  const handleManageUnit = (block: BlockListItem) => {
    console.log('Manage Unit clicked for block:', block.id);
  };

  const handleDeleteBlock = (block: BlockListItem) => {
    console.log('Delete Block clicked for block:', block.id);
  };

  const handleFileSelect = (file: File | null) => {
    setSiteplanFile(file);
    if (file) {
      setDeleteSiteplan(false);
      setHideSiteplanPreview(false);
      setErrors(prev => {
        const { siteplan, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDeleteSiteplan = () => {
    setHideSiteplanPreview(true);
    setDeleteSiteplan(true);
    setSiteplanFile(null);
    setErrors(prev => {
      const { siteplan, ...rest } = prev;
      return rest;
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Property Detail"
        subtitle="View and manage property details"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-text-secondary">Loading property details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !propertyData) {
    return (
      <DashboardLayout
        title="Property Detail"
        subtitle="View and manage property details"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load property details'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { property, blocks } = propertyData;

  return (
    <DashboardLayout
      title="Property Detail"
      subtitle="View and manage property details"
      action={
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          onClick={() => navigate('/properties')}
        >
          Back to Properties
        </Button>
      }
    >
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Property Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  onFileSelect={handleFileSelect}
                  currentFile={siteplanFile}
                  currentAssetUrl={!hideSiteplanPreview && property.siteplan_assets ? `${API_URL}${property.siteplan_assets}` : undefined}
                  onDeleteAsset={handleDeleteSiteplan}
                  maxSizeMB={10}
                />
                {errors.siteplan && (
                  <p className="mt-2 text-sm text-red-600">{errors.siteplan}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-border p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Manage Blocks</h3>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddBlock}
          >
            Add Block
          </Button>
        </div>

        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-sm font-medium text-text-primary mb-2">No blocks yet</p>
            <p className="text-xs text-text-secondary mb-4">
              Add blocks to manage your property units
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="max-w-[304px] w-full bg-white border border-border rounded-lg p-4"
              >
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  {property.name}
                </h4>
                <p className="text-xs text-text-secondary mb-3">{block.name}</p>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-text-primary">
                    {block.total_units}
                  </p>
                  <p className="text-xs text-text-secondary">Total Units</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleManageUnit(block)}
                  >
                    Manage Unit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDeleteBlock(block)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddBlockModal
        isOpen={isAddBlockModalOpen}
        onClose={() => setIsAddBlockModalOpen(false)}
        onSubmit={handleBlockSubmit}
        isLoading={isCreating}
      />
    </DashboardLayout>
  );
}