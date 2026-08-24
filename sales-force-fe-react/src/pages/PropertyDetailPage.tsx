import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Building2, Trash2, ChevronLeft, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { AddBlockModal } from '@/components/properties/AddBlockModal';
import { EditBlockModal } from '@/components/properties/EditBlockModal';
import { DeleteBlockModal } from '@/components/properties/DeleteBlockModal';
import { ManageUnitsModal } from '@/components/properties/ManageUnitsModal';
import { AddUnitModal } from '@/components/properties/AddUnitModal';
import { EditUnitModal } from '@/components/properties/EditUnitModal';
import type { BlockListItem, UnitListItem } from '@/lib/types';
import { usePropertyDetail, usePropertyUpdate } from '@/hooks/usePropertyDetail';
import { useBlockMutations } from '@/hooks/useBlocks';
import { useUnits, useUnitMutations } from '@/hooks/useUnits';
import './PropertyDetailPage.css';

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
  const [isEditBlockModalOpen, setIsEditBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockListItem | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<BlockListItem | undefined>(undefined);
  const [isManageUnitsModalOpen, setIsManageUnitsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockListItem | undefined>(undefined);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitListItem | undefined>(undefined);
  const [unitsData, setUnitsData] = useState<UnitListItem[]>([]);

  const { data: propertyData, isLoading, error } = usePropertyDetail(id || '');

  const updateMutation = usePropertyUpdate();
  const { createBlock, updateBlock, deleteBlock, isCreating, isUpdating, isDeleting } = useBlockMutations();
  const { createUnit, updateUnit, deleteUnit, isCreating: isCreatingUnit, isUpdating: isUpdatingUnit } = useUnitMutations();

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

  const handleEditBlock = (block: BlockListItem) => {
    setEditingBlock(block);
    setIsEditBlockModalOpen(true);
  };

  const handleEditBlockSubmit = async (blockName: string) => {
    if (!editingBlock) return;

    try {
      await updateBlock({ blockId: editingBlock.id, name: blockName });
      setIsEditBlockModalOpen(false);
      setEditingBlock(undefined);
      setSuccessMessage('Block updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update block' });
    }
  };

  const handleManageUnit = (block: BlockListItem) => {
    setSelectedBlock(block);
    setIsManageUnitsModalOpen(true);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!selectedBlock) return;

    if (!confirm('Are you sure you want to delete this unit?')) {
      return;
    }

    try {
      await deleteUnit({ unitId, blockId: selectedBlock.id });
      setSuccessMessage('Unit deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to delete unit' });
    }
  };

  const handleUnitsLoaded = (units: UnitListItem[]) => {
    setUnitsData(units);
  };

  const handleManageUnitDetail = (unitId: string) => {
    const unit = unitsData?.find((u) => u.id === unitId);
    if (unit) {
      setEditingUnit(unit);
      setIsManageUnitsModalOpen(false);
      setIsEditUnitModalOpen(true);
    }
  };

  const handleEditUnitSubmit = async (unitId: string, unitName: string, landArea?: number) => {
    if (!selectedBlock) return;

    try {
      await updateUnit({ unitId, name: unitName, land_area: landArea, blockId: selectedBlock.id });
      setSuccessMessage('Unit updated successfully');
      setEditingUnit(undefined);
      setIsEditUnitModalOpen(false);
      setIsManageUnitsModalOpen(true);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update unit' });
    }
  };

  const handleEditUnitCancel = () => {
    setIsEditUnitModalOpen(false);
    setEditingUnit(undefined);
    setIsManageUnitsModalOpen(true);
  };

  const handleAddUnit = (blockId: string) => {
    if (!selectedBlock || selectedBlock.id !== blockId) {
      return;
    }
    // Tutup ManageUnitsModal dulu, lalu buka AddUnitModal
    setIsManageUnitsModalOpen(false);
    setIsAddUnitModalOpen(true);
  };

  const handleAddUnitCancel = () => {
    // Tutup AddUnitModal, lalu buka kembali ManageUnitsModal
    setIsAddUnitModalOpen(false);
    setIsManageUnitsModalOpen(true);
  };

  const handleAddUnitSubmit = async (unitName: string, landArea?: number) => {
    if (!selectedBlock) return;

    try {
      await createUnit({ blockId: selectedBlock.id, name: unitName, land_area: landArea });
      setSuccessMessage('Unit created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Tutup AddUnitModal, lalu buka kembali ManageUnitsModal setelah sukses
      setIsAddUnitModalOpen(false);
      setIsManageUnitsModalOpen(true);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create unit' });
    }
  };

  const handleDeleteBlockFromModal = () => {
    if (selectedBlock) {
      setIsManageUnitsModalOpen(false);
      handleDeleteBlock(selectedBlock);
    }
  };

  const handleDeleteBlock = (block: BlockListItem) => {
    setDeletingBlock(block);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBlock) return;

    try {
      await deleteBlock({ blockId: deletingBlock.id });
      setIsDeleteModalOpen(false);
      setDeletingBlock(undefined);
      setSuccessMessage('Block deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to delete block' });
    }
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
      <DashboardLayout title="Property Detail" subtitle="View and manage property details">
        <div className="property-detail-page__loading">
          <div className="property-detail-page__loading-text">Loading property details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !propertyData) {
    return (
      <DashboardLayout title="Property Detail" subtitle="View and manage property details">
        <div className="property-detail-page__error">
          <p className="property-detail-page__error-text">
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
          leftIcon={<ChevronLeft className="property-detail-page__back-icon" />}
          onClick={() => navigate('/properties')}
        >
          Back to Properties
        </Button>
      }
    >
      {successMessage && (
        <div className="property-detail-page__success">
          <p className="property-detail-page__success-text">{successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="property-detail-page__error">
          <p className="property-detail-page__error-text">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="property-detail-page__form">
        <div className="property-detail-page__card">
          <h2 className="property-detail-page__card-title">Property Information</h2>

          <div className="property-detail-page__grid">
            <div className="property-detail-page__column">
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

            <div className="property-detail-page__column">
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
                <label className="property-detail-page__field-label">Siteplan</label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  currentFile={siteplanFile}
                  currentAssetUrl={!hideSiteplanPreview && property.siteplan_assets ? `${API_URL}${property.siteplan_assets}` : undefined}
                  onDeleteAsset={handleDeleteSiteplan}
                  maxSizeMB={10}
                />
                {errors.siteplan && (
                  <p className="property-detail-page__siteplan-error">{errors.siteplan}</p>
                )}
              </div>
            </div>
          </div>

          <div className="property-detail-page__footer">
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

      <div className="property-detail-page__blocks">
        <div className="property-detail-page__blocks-header">
          <h3 className="property-detail-page__blocks-title">Manage Blocks</h3>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="property-detail-page__add-block-icon" />}
            onClick={handleAddBlock}
          >
            Add Block
          </Button>
        </div>

        {blocks.length === 0 ? (
          <div className="property-detail-page__blocks-empty">
            <Building2 className="property-detail-page__blocks-empty-icon" />
            <p className="property-detail-page__blocks-empty-title">No blocks yet</p>
            <p className="property-detail-page__blocks-empty-text">
              Add blocks to manage your property units
            </p>
          </div>
        ) : (
          <div className="property-detail-page__blocks-grid">
            {blocks.map((block) => (
              <div key={block.id} className="property-detail-page__block">
                <h4 className="property-detail-page__block-name">{property.name}</h4>
                <p className="property-detail-page__block-sub">{block.name}</p>

                <div className="property-detail-page__block-stats">
                  <p className="property-detail-page__block-count">{block.total_units}</p>
                  <p className="property-detail-page__block-label">Total Units</p>
                </div>

                <div className="property-detail-page__block-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    className="property-detail-page__block-manage"
                    onClick={() => handleManageUnit(block)}
                  >
                    Manage Unit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit2 className="property-detail-page__block-icon" />}
                    onClick={() => handleEditBlock(block)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="property-detail-page__block-icon" />}
                    onClick={() => handleDeleteBlock(block)}
                  />
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
      <EditBlockModal
        isOpen={isEditBlockModalOpen}
        onClose={() => {
          setIsEditBlockModalOpen(false);
          setEditingBlock(undefined);
        }}
        onSubmit={handleEditBlockSubmit}
        isLoading={isUpdating}
        block={editingBlock}
      />
      <DeleteBlockModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBlock(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        blockName={deletingBlock?.name}
      />
      {selectedBlock && (
        <ManageUnitsModalWrapper
          isOpen={isManageUnitsModalOpen}
          onClose={() => {
            setIsManageUnitsModalOpen(false);
            setSelectedBlock(undefined);
          }}
          onAddUnit={handleAddUnit}
          onDeleteBlock={handleDeleteBlockFromModal}
          onDeleteUnit={handleDeleteUnit}
          onManageUnit={handleManageUnitDetail}
          propertyName={property.name}
          blockName={selectedBlock.name}
          blockId={selectedBlock.id}
          onUnitsLoaded={handleUnitsLoaded}
        />
      )}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={handleAddUnitCancel}
        onSubmit={handleAddUnitSubmit}
        isLoading={isCreatingUnit}
      />
      <EditUnitModal
        isOpen={isEditUnitModalOpen}
        onClose={handleEditUnitCancel}
        onSubmit={handleEditUnitSubmit}
        isLoading={isUpdatingUnit}
        unit={editingUnit}
      />
    </DashboardLayout>
  );
}

function ManageUnitsModalWrapper({
  isOpen,
  onClose,
  onAddUnit,
  onDeleteBlock,
  onDeleteUnit,
  onManageUnit,
  propertyName,
  blockName,
  blockId,
  onUnitsLoaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: (blockId: string) => void;
  onDeleteBlock: () => void;
  onDeleteUnit: (unitId: string) => void;
  onManageUnit: (unitId: string) => void;
  propertyName: string;
  blockName: string;
  blockId: string;
  onUnitsLoaded: (units: UnitListItem[]) => void;
}) {
  const { data, isLoading } = useUnits(isOpen ? blockId : '');

  useEffect(() => {
    if (data?.data?.units) {
      onUnitsLoaded(data.data.units);
    }
  }, [data, onUnitsLoaded]);

  return (
    <ManageUnitsModal
      isOpen={isOpen}
      onClose={onClose}
      onAddUnit={() => onAddUnit(blockId)}
      onDeleteBlock={onDeleteBlock}
      onDeleteUnit={onDeleteUnit}
      onManageUnit={onManageUnit}
      isLoading={isLoading}
      units={data?.data?.units || []}
      propertyName={propertyName}
      blockName={blockName}
    />
  );
}
