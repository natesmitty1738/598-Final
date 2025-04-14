'use client';

import { useState, useCallback } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { X, Upload } from 'lucide-react';

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
  const [isMounted, setIsMounted] = useState(false);

  useState(() => {
    setIsMounted(true);
  });

  const onUpload = useCallback((result: any) => {
    onChange(result.info.secure_url);
  }, [onChange]);

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value.map((url) => (
          <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden">
            {type === 'image' ? (
              <div className="z-10 absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-secondary/20">
                <div className="flex items-center justify-between p-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate max-w-[150px]"
                  >
                    {url.split('/').pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            {type === 'image' && (
              <img
                src={url}
                alt="Upload"
                className="object-cover w-full h-full"
              />
            )}
          </div>
        ))}
      </div>
      <CldUploadWidget
        onUpload={onUpload}
        uploadPreset="your-preset"
        options={{
          maxFiles: 10,
          resourceType: type === 'image' ? 'image' : 'auto',
        }}
      >
        {({ open }) => {
          const onClick = () => {
            if (disabled) return;
            open();
          };

          return (
            <button
              type="button"
              disabled={disabled}
              onClick={onClick}
              className="w-full p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-secondary/50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <div className="text-sm text-muted-foreground">
                  Click to upload {type === 'image' ? 'images' : 'documents'}
                </div>
              </div>
            </button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
} 