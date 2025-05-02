'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, File, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
  disabled?: boolean;
  type?: 'image' | 'document';
}

export default function FileUpload({
  onChange,
  onRemove,
  value,
  disabled,
  type = 'image',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageHover, setImageHover] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFile(files[0]);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send the file to our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Upload failed');
      }

      const data = await response.json();
      if (data.url) {
        onChange(data.url);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(typeof error === 'string' ? error : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setIsDragging(true);
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, [disabled, isUploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    // Check if the file type matches what we're expecting
    const file = files[0];
    if (type === 'image' && !file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }
    
    if (type === 'document' && !(
      file.type === 'application/pdf' || 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )) {
      setUploadError('Please upload a PDF or Word document');
      return;
    }
    
    uploadFile(file);
  }, [disabled, isUploading, type, uploadFile]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {value.map((url) => (
          <div 
            key={url} 
            className="relative w-[100px] h-[100px] rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all"
            onMouseEnter={() => setImageHover(url)}
            onMouseLeave={() => setImageHover(null)}
          >
            {type === 'image' ? (
              <>
                <div className={`z-10 absolute inset-0 flex flex-col items-center justify-center bg-black/50 transition-opacity ${imageHover === url ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-1 text-white text-xs"
                  >
                    View
                  </a>
                </div>
                <img
                  src={url}
                  alt="Upload"
                  className="object-cover w-full h-full"
                />
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-secondary/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-1">
                    <div className="text-xs font-medium">Doc</div>
                    <button
                      type="button"
                      onClick={() => onRemove(url)}
                      className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <File className="h-8 w-8 text-primary" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate max-w-[80px] px-1 py-0.5 rounded"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={type === 'image' ? 'image/*' : (type === 'document' ? '.pdf,.doc,.docx' : '*')}
        className="hidden"
      />

      <button
        ref={dropZoneRef}
        type="button"
        disabled={disabled || isUploading}
        onClick={handleUploadClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full p-3 text-center border-2 border-dashed rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 dark:border-gray-700 hover:bg-secondary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isDragging ? (
            <div className="p-2 rounded-full bg-primary/20">
              {type === 'image' ? <ImageIcon className="h-6 w-6 text-primary" /> : <File className="h-6 w-6 text-primary" />}
            </div>
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <div className="text-xs text-muted-foreground">
            {isUploading
              ? 'Uploading...'
              : isDragging
              ? `Drop ${type === 'image' ? 'image' : 'document'} here`
              : `Drag and drop or click to upload ${type === 'image' ? 'images' : 'documents'}`}
          </div>
        </div>
      </button>
      
      {uploadError && (
        <p className="text-sm text-red-500 mt-2">{uploadError}</p>
      )}
    </div>
  );
} 