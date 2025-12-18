"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadZoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploadZone({
  images,
  onImagesChange,
  maxImages = 1,
  disabled = false,
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (maxImages === 1) {
          onImagesChange([result]);
        } else {
          if (images.length >= maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
          }
          onImagesChange([...images, result]);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read the image file");
      };
      reader.readAsDataURL(file);
    },
    [images, maxImages, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const getImageLabel = (index: number) => {
    if (maxImages > 1) {
      const labels = ["Start Frame", "End Frame", "Reference 1", "Reference 2", "Reference 3"];
      return labels[index] || `Image ${index + 1}`;
    }
    return "Image";
  };

  return (
    <div className="space-y-3">
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
            id="image-upload"
            multiple={maxImages > 1}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <div className="text-sm font-medium mb-1">
              Click to upload or drag and drop
            </div>
            <div className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, WEBP
              <br />
              Maximum file size: 10MB
              {maxImages > 1 && `; Maximum files: ${maxImages}`}
            </div>
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-3",
            maxImages === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-video border-2 border-border rounded-lg overflow-hidden bg-muted">
                <Image
                  src={image}
                  alt={getImageLabel(index)}
                  fill
                  className="object-cover"
                />
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {maxImages > 1 && (
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {getImageLabel(index)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

