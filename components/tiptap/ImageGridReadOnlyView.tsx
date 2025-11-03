"use client";

import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

interface ImageGridItem {
  src: string;
  alt?: string;
  caption?: string;
  link?: string;
}

export function ImageGridReadOnlyView({ node }: NodeViewProps) {
  const { images, columns } = node.attrs;

  const handleImageClick = (link?: string) => {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <NodeViewWrapper className="image-grid-wrapper my-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {images.map((image: ImageGridItem, index: number) => (
          <div key={image.src} className="flex flex-col gap-1">
            <div
              className={`relative overflow-hidden rounded-xl bg-background flex items-center justify-center ${
                image.link
                  ? "cursor-pointer hover:opacity-90 transition-opacity"
                  : ""
              }`}
              style={{ aspectRatio: "1/1" }}
              onClick={() => handleImageClick(image.link)}
              role={image.link ? "button" : undefined}
              tabIndex={image.link ? 0 : undefined}
              onKeyDown={(e) => {
                if (image.link && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleImageClick(image.link);
                }
              }}
            >
              <img
                src={image.src}
                alt={image.alt || `Image ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
            {image.caption && (
              <span
                className={`text-sm text-muted-foreground text-center px-1 leading-tight ${
                  image.link
                    ? "cursor-pointer hover:text-foreground transition-colors"
                    : ""
                }`}
                onClick={() => handleImageClick(image.link)}
                role={image.link ? "button" : undefined}
                tabIndex={image.link ? 0 : undefined}
                onKeyDown={(e) => {
                  if (image.link && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleImageClick(image.link);
                  }
                }}
              >
                {image.caption}
              </span>
            )}
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}
