"use client";

import { Button } from "@/components/ui/button";
import { Editor } from "@tiptap/react";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TableMenuProps {
  editor: Editor;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [isTableActive, setIsTableActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMenu = () => {
      const isActive = editor.isActive("table");
      setIsTableActive(isActive);

      if (isActive) {
        // 获取当前选中的表格元素
        const { state } = editor;
        const { from } = state.selection;
        const node = editor.view.domAtPos(from);

        // 找到表格元素
        let tableElement = node.node as HTMLElement;
        while (tableElement && tableElement.tagName !== "TABLE") {
          tableElement = tableElement.parentElement as HTMLElement;
        }

        if (tableElement) {
          const editorElement = editor.view.dom;
          const editorRect = editorElement.getBoundingClientRect();
          const tableRect = tableElement.getBoundingClientRect();

          // 计算相对于编辑器容器的位置
          const scrollTop = editorElement.scrollTop || 0;
          const scrollLeft = editorElement.scrollLeft || 0;

          const menuHeight = 45;
          const relativeTop = tableRect.top - editorRect.top + scrollTop;

          const shouldDisplayBelow = relativeTop < menuHeight;

          setPosition({
            top: shouldDisplayBelow
              ? tableRect.bottom - editorRect.top + scrollTop + 5
              : relativeTop - menuHeight,
            left: tableRect.left - editorRect.left + scrollLeft,
          });
        }
      }
    };

    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    updateMenu();

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor]);

  if (!isTableActive) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center gap-1 p-1 bg-background border rounded-md shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Add Row Above"
        className="h-8 px-2"
      >
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Row↑</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Add Row Below"
        className="h-8 px-2"
      >
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Row↓</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Add Column Left"
        className="h-8 px-2"
      >
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Column←</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Add Column Right"
        className="h-8 px-2"
      >
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Column→</span>
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete Row"
        className="h-8 px-2"
      >
        <Trash2 className="h-3 w-3" />
        <span className="text-xs ml-1">Row</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete Column"
        className="h-8 px-2"
      >
        <Trash2 className="h-3 w-3" />
        <span className="text-xs ml-1">Column</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete Table"
        className="h-8 px-2"
      >
        <Trash2 className="h-3 w-3" />
        <span className="text-xs ml-1">Table</span>
      </Button>
    </div>
  );
}
