import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  currentFile?: File | null;
  currentAssetUrl?: string;
  onDeleteAsset?: () => void;
  className?: string;
}

const FileUpload = ({
  onFileSelect,
  acceptedFormats = ['.svg', 'image/svg+xml'],
  maxSizeMB = 10,
  currentFile,
  currentAssetUrl,
  onDeleteAsset,
  className
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    const isValidType = acceptedFormats.some(format => {
      if (format.startsWith('.')) {
        return file.name.toLowerCase().endsWith(format.toLowerCase());
      }
      return file.type === format;
    });

    if (!isValidType) {
      setError('Invalid file type. Please upload an SVG file.');
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      onFileSelect(null);
      setError('');
      return;
    }

    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteAsset) {
      onDeleteAsset();
    }
  };

  const handleOpenPreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className={cn('w-full', className)}>
      {currentAssetUrl && !currentFile ? (
        <div className="border border-border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text-primary">Current Siteplan</p>
            <button
              onClick={handleDeleteAsset}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete siteplan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div
            onClick={handleOpenPreview}
            className="cursor-pointer group relative bg-white rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
          >
            <img
              src={currentAssetUrl}
              className="w-full h-32 object-contain"
              alt="Siteplan preview"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
              <span className="text-xs text-text-secondary group-hover:text-primary transition-colors">
                Click to preview
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            'hover:border-primary/50 hover:bg-blue-50/30',
            isDragging ? 'border-primary bg-blue-50/50' : 'border-blue-300 bg-blue-50/20'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary text-white' : 'bg-blue-100 text-primary'
            )}>
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-text-primary">
                Drag & drop file or Browse
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Supported formats: SVG
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger mt-2">{error}</p>
      )}

      {currentFile && (
        <div className="mt-4">
          <p className="text-xs font-medium text-text-primary mb-2">Uploaded</p>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentFile.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {(currentFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showPreview && currentAssetUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClosePreview}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-[calc(90vh-8rem)] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={currentAssetUrl}
                className="w-full h-full object-contain"
                alt="Full size siteplan preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { FileUpload };