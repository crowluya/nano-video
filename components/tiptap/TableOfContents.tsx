"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, List } from "lucide-react";
import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  mobile?: boolean;
}

export function TableOfContents({
  content,
  mobile = false,
}: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const extractHeadings = () => {
      if (!content || typeof content !== "string") {
        return;
      }

      const headings: TocItem[] = [];

      const lines = content.split("\n");

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        const h2Match = trimmedLine.match(/^##\s+(.+)$/);
        if (h2Match) {
          const text = h2Match[1].trim();
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
            .replace(/^-|-$/g, "");

          headings.push({
            id,
            text,
            level: 2,
          });
          return;
        }

        const h3Match = trimmedLine.match(/^###\s+(.+)$/);
        if (h3Match) {
          const text = h3Match[1].trim();
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
            .replace(/^-|-$/g, "");

          headings.push({
            id,
            text,
            level: 3,
          });
        }
      });

      setTocItems(headings);
    };

    extractHeadings();
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = tocItems.map((item) =>
        document.getElementById(item.id)
      );

      let currentActiveId = "";

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveId = tocItems[i].id;
            break;
          }
        }
      }

      setActiveId(currentActiveId);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveId(hash);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("hashchange", handleHashChange);
    handleScroll();
    handleHashChange();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    window.location.hash = id;
    if (mobile) {
      setIsOpen(false);
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  if (mobile) {
    return (
      <div className="mb-8 border rounded-lg bg-card">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <List className="h-5 w-5" />
            <span className="font-semibold">Table of Contents</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
        {isOpen && (
          <div className="px-4 pb-4">
            <ul className="space-y-2 text-sm">
              {tocItems.map((item) => (
                <li
                  key={item.id}
                  className={`${item.level === 3 ? "ml-4" : ""}`}
                >
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`text-left w-full py-1 px-2 rounded transition-colors hover:bg-muted ${
                      activeId === item.id
                        ? "text-primary font-medium bg-muted"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="toc-container">
      <div className="sticky top-24">
        <div className="flex items-center gap-2 mb-4">
          <List className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Table of Contents</h3>
        </div>
        <ul className="space-y-2 text-sm">
          {tocItems.map((item) => (
            <li key={item.id} className={`${item.level === 3 ? "ml-4" : ""}`}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`text-left w-full py-1 px-2 rounded transition-colors hover:bg-muted ${
                  activeId === item.id
                    ? "text-primary font-medium bg-muted"
                    : "text-muted-foreground"
                }`}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
