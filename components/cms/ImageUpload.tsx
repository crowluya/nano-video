"use client";

import { generateAdminPresignedUploadUrl } from "@/actions/r2-resources";
import { R2ResourceSelector } from "@/components/tiptap/R2ResourceSelector";
import { Button } from "@/components/ui/button";
import { BLOGS_IMAGE_PATH } from "@/config/common";
import { getErrorMessage } from "@/lib/error-utils";
import { Cloud, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  imagePath?: string;
  maxSize?: number;
  r2PublicUrl?: string;
  enableR2Selector?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  imagePath = BLOGS_IMAGE_PATH,
  maxSize = 10 * 1024 * 1024, // 10MB
  r2PublicUrl,
  enableR2Selector = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Upload Error", {
        description: "Invalid file type.",
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error("Upload Error", {
        description: `File size cannot exceed ${maxSize / 1024 / 1024}MB.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);

    try {
      const filenamePrefix = "featured-image";

      const presignedUrlActionResponse = await generateAdminPresignedUploadUrl({
        fileName: file.name,
        contentType: file.type,
        prefix: filenamePrefix,
        path: imagePath,
      });

      if (
        !presignedUrlActionResponse.success ||
        !presignedUrlActionResponse.data
      ) {
        setPreviewUrl(null);
        toast.error("Upload Error", {
          description:
            presignedUrlActionResponse.error ||
            "Failed to generate presigned URL.",
        });
        return "";
      }

      const { presignedUrl, publicObjectUrl } = presignedUrlActionResponse.data;

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        let r2Error = "";
        try {
          r2Error = await uploadResponse.text();
        } catch {}
        console.error("R2 Upload Error:", r2Error, uploadResponse);
        throw new Error(r2Error);
      }

      onChange(publicObjectUrl);
      toast.success("Upload successful", {
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      setPreviewUrl(null);
      console.error("MDX Image Upload failed:", error);
      toast.error(
        getErrorMessage(error) || "An unexpected error occurred during upload."
      );
      throw error;
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        handleFileSelected(acceptedFiles[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    disabled: disabled || isLoading,
  });

  const handleLegacyFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileSelected(file || null);
  };

  const handleRemoveImage = async () => {
    setPreviewUrl(null);
    onChange("");
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`mt-2 flex flex-col items-center space-y-4 rounded-lg border border-dashed border-gray-300 p-6 transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : ""}
          ${
            disabled || isLoading
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-gray-400"
          }`}
      >
        <input
          {...getInputProps()}
          id="featured-image-upload"
          ref={fileInputRef}
          onChange={handleLegacyFileChange}
        />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative group">
            <Image
              src={previewUrl}
              alt="Featured image preview"
              width={1200}
              height={630}
              className="object-contain rounded-md max-h-48 w-auto"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              disabled={disabled}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? "Drop the image here..."
                : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
        {!isLoading && !previewUrl && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled || isLoading}
              className="mt-4"
            >
              Select Image
            </Button>
            {enableR2Selector && r2PublicUrl && (
              <R2ResourceSelector
                onSelect={(url) => {
                  const selectedUrl = Array.isArray(url) ? url[0] : url;
                  setPreviewUrl(selectedUrl);
                  onChange(selectedUrl);
                }}
                r2PublicUrl={r2PublicUrl}
                fileTypeFilter="image"
                multiple={false}
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || isLoading}
                  className="mt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Select from R2
                </Button>
              </R2ResourceSelector>
            )}
          </div>
        )}
        {!isLoading && previewUrl && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled || isLoading}
              className="mt-4"
            >
              Change Image
            </Button>
            {enableR2Selector && r2PublicUrl && (
              <R2ResourceSelector
                onSelect={(url) => {
                  const selectedUrl = Array.isArray(url) ? url[0] : url;
                  setPreviewUrl(selectedUrl);
                  onChange(selectedUrl);
                }}
                r2PublicUrl={r2PublicUrl}
                fileTypeFilter="image"
                multiple={false}
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || isLoading}
                  className="mt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Select from R2
                </Button>
              </R2ResourceSelector>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
