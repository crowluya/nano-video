"use client";

import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapImage from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Markdown } from "tiptap-markdown";
import { ImageGrid } from "./ImageGridExtension";

interface TiptapRendererProps {
  content: string;
}

export function TiptapRenderer({ content }: TiptapRendererProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({
        levels: [2, 3, 4],
        HTMLAttributes: {
          class: "scroll-mt-20",
        },
      }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const level = this.options.levels.includes(node.attrs.level)
            ? node.attrs.level
            : this.options.levels[0];
          const classes: string[] = [];

          let textContent = "";
          node.content.forEach((child: any) => {
            if (child.text) {
              textContent += child.text;
            }
          });

          const id = textContent
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
            .replace(/^-|-$/g, "");

          return [
            `h${level}`,
            {
              ...HTMLAttributes,
              id,
              class:
                `${HTMLAttributes.class || ""} ${classes.join(" ")}`.trim(),
            },
            0,
          ];
        },
      }),
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class:
            "rounded-md max-w-full h-auto my-4 border border-4 border-primary/10",
        },
      }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote.configure({
        HTMLAttributes: {
          class: "border-l-4 border-primary pl-4 italic my-4",
        },
      }),
      CodeBlock,
      HorizontalRule.configure({
        HTMLAttributes: {
          class: "my-8 border-border",
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-border",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-border bg-muted font-bold p-3 text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-3",
        },
      }),
      Markdown.configure({
        html: true,
        transformPastedText: false,
        transformCopiedText: false,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: "block w-full max-w-full h-auto aspect-video rounded-xl my-4",
        },
      }),
      ImageGrid.configure({
        readOnly: true,
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md max-w-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}
