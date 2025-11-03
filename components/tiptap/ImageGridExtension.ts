import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageGridNodeView } from "./ImageGridNodeView";
import { ImageGridReadOnlyView } from "./ImageGridReadOnlyView";

export interface ImageGridOptions {
  HTMLAttributes: Record<string, any>;
  readOnly?: boolean;
}

export interface ImageGridItem {
  src: string;
  alt?: string;
  caption?: string;
  link?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGrid: {
      /**
       * Insert an image grid
       */
      setImageGrid: (options: {
        images: Array<ImageGridItem>;
        columns?: number;
      }) => ReturnType;
    };
  }
}

export const ImageGrid = Node.create<ImageGridOptions>({
  name: "imageGrid",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      readOnly: false,
    };
  },

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element: HTMLElement) => {
          const imagesData = element.getAttribute("data-images");
          try {
            return imagesData ? JSON.parse(imagesData) : [];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.images || attributes.images.length === 0) {
            return {};
          }
          return {
            "data-images": JSON.stringify(attributes.images),
          };
        },
      },
      columns: {
        default: 2,
        parseHTML: (element: HTMLElement) => {
          const cols = element.getAttribute("data-columns");
          return cols ? parseInt(cols, 10) : 2;
        },
        renderHTML: (attributes: Record<string, any>) => {
          return {
            "data-columns": attributes.columns,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='image-grid']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "image-grid",
      }),
    ];
  },

  addNodeView() {
    if (this.options.readOnly) {
      return ReactNodeViewRenderer(ImageGridReadOnlyView);
    }
    return ReactNodeViewRenderer(ImageGridNodeView);
  },

  addCommands() {
    return {
      setImageGrid:
        (options: { images: Array<ImageGridItem>; columns?: number }) =>
          ({ commands }: any) => {
            return commands.insertContent({
              type: this.name,
              attrs: {
                images: options.images,
                columns: options.columns || 2,
              },
            });
          },
    };
  },
});

