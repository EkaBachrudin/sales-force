import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './FileUpload.css';

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
    <div className={cn('file-upload', className)}>
      {currentAssetUrl && !currentFile ? (
        <div className="file-upload__current">
          <div className="file-upload__current-header">
            <p className="file-upload__current-title">Current Siteplan</p>
            <button
              onClick={handleDeleteAsset}
              className="file-upload__delete"
              title="Delete siteplan"
            >
              <Trash2 className="file-upload__delete-icon" />
            </button>
          </div>
          <div onClick={handleOpenPreview} className="file-upload__preview">
            <img src={currentAssetUrl} className="file-upload__preview-img" alt="Siteplan preview" />
            <div className="file-upload__preview-overlay">
              <span className="file-upload__preview-text">Click to preview</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn('file-upload__dropzone', isDragging && 'file-upload__dropzone--dragging')}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="file-upload__input"
          />

          <div className="file-upload__dropzone-content">
            <div
              className={cn(
                'file-upload__dropzone-icon',
                isDragging && 'file-upload__dropzone-icon--dragging'
              )}
            >
              <Upload className="file-upload__dropzone-icon-svg" />
            </div>

            <div>
              <p className="file-upload__dropzone-text">Drag & drop file or Browse</p>
              <p className="file-upload__dropzone-subtext">Supported formats: SVG</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="file-upload__error">{error}</p>}

      {currentFile && (
        <div className="file-upload__uploaded">
          <p className="file-upload__uploaded-title">Uploaded</p>
          <div className="file-upload__file">
            <div className="file-upload__file-info">
              <div className="file-upload__file-icon">
                <FileImage className="file-upload__file-icon-svg" />
              </div>
              <div className="file-upload__file-meta">
                <p className="file-upload__file-name">{currentFile.name}</p>
                <p className="file-upload__file-size">
                  {(currentFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="file-upload__remove"
              title="Remove file"
            >
              <X className="file-upload__remove-icon" />
            </button>
          </div>
        </div>
      )}

      {showPreview && currentAssetUrl && (
        <div className="file-upload__modal" onClick={handleClosePreview}>
          <div className="file-upload__modal-panel" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClosePreview} className="file-upload__modal-close">
              <X className="file-upload__modal-close-icon" />
            </button>
            <div className="file-upload__modal-body">
              <img
                src={currentAssetUrl}
                className="file-upload__modal-img"
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
