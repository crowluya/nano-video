"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Film,
  Music,
  Plus,
  Trash2,
  Download,
  Check,
  Save,
} from "lucide-react";
import { Asset, AssetType } from "@/lib/remotion/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AssetLibraryProps {
  assets: Asset[];
  selectedAssetIds?: string[];
  onSelectAsset?: (asset: Asset) => void;
  onAddAsset?: (asset: Asset) => void;
  onRemoveAsset?: (assetId: string) => void;
  onSaveToR2?: (asset: Asset) => Promise<void>;
  selectionMode?: "single" | "multiple" | "none";
  className?: string;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  assets,
  selectedAssetIds = [],
  onSelectAsset,
  onAddAsset,
  onRemoveAsset,
  onSaveToR2,
  selectionMode = "none",
  className,
}) => {
  const [activeTab, setActiveTab] = useState<AssetType | "all">("all");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const filteredAssets =
    activeTab === "all"
      ? assets
      : assets.filter((a) => a.type === activeTab);

  const handleSaveToR2 = useCallback(
    async (asset: Asset) => {
      if (!onSaveToR2) return;

      setSavingIds((prev) => new Set([...prev, asset.id]));
      try {
        await onSaveToR2(asset);
        toast.success("Asset saved to permanent storage");
      } catch (error) {
        toast.error("Failed to save asset");
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(asset.id);
          return next;
        });
      }
    },
    [onSaveToR2]
  );

  const getTypeIcon = (type: AssetType) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Film className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
    }
  };

  const getCounts = () => ({
    all: assets.length,
    image: assets.filter((a) => a.type === "image").length,
    video: assets.filter((a) => a.type === "video").length,
    audio: assets.filter((a) => a.type === "audio").length,
  });

  const counts = getCounts();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Asset Library</span>
          <span className="text-xs text-muted-foreground font-normal">
            {assets.length} assets
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as AssetType | "all")}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid grid-cols-4 w-full mb-2">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs">
              <Image className="h-3 w-3 mr-1" />
              {counts.image}
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs">
              <Film className="h-3 w-3 mr-1" />
              {counts.video}
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs">
              <Music className="h-3 w-3 mr-1" />
              {counts.audio}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2 p-1">
              {filteredAssets.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                  No {activeTab === "all" ? "assets" : activeTab + "s"} yet
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssetIds.includes(asset.id)}
                    isSaving={savingIds.has(asset.id)}
                    selectionMode={selectionMode}
                    onSelect={() => onSelectAsset?.(asset)}
                    onRemove={() => onRemoveAsset?.(asset.id)}
                    onSave={() => handleSaveToR2(asset)}
                    showSaveButton={
                      !!onSaveToR2 && asset.source !== "r2"
                    }
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  isSaving: boolean;
  selectionMode: "single" | "multiple" | "none";
  onSelect?: () => void;
  onRemove?: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  isSaving,
  selectionMode,
  onSelect,
  onRemove,
  onSave,
  showSaveButton,
}) => {
  const isSelectable = selectionMode !== "none";

  return (
    <div
      className={cn(
        "relative group rounded-lg border overflow-hidden transition-all",
        isSelectable && "cursor-pointer",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={isSelectable ? onSelect : undefined}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative">
        {asset.type === "image" && (
          <img
            src={asset.thumbnailUrl || asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        )}
        {asset.type === "video" && (
          <video
            src={asset.url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        )}
        {asset.type === "audio" && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-orange-600/20">
            <Music className="h-8 w-8 text-orange-500" />
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}

        {/* Duration badge for video/audio */}
        {asset.duration && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatDuration(asset.duration)}
          </div>
        )}

        {/* Source badge */}
        <div
          className={cn(
            "absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded",
            asset.source === "r2"
              ? "bg-green-500/80 text-white"
              : "bg-yellow-500/80 text-black"
          )}
        >
          {asset.source === "r2" ? "Saved" : "Temp"}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium truncate" title={asset.name}>
          {asset.name}
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {showSaveButton && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.();
            }}
            disabled={isSaving}
          >
            <Save className={cn("h-4 w-4", isSaving && "animate-pulse")} />
          </Button>
        )}
        <a
          href={asset.url}
          download={asset.name}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </a>
        {onRemove && (
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default AssetLibrary;

