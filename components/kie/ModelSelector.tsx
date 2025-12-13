"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  KIE_IMAGE_MODELS,
  KIE_VIDEO_MODELS,
  KIE_MUSIC_MODELS,
} from "@/config/models";
import { Coins } from "lucide-react";

type ModelType = "image" | "video" | "music";

interface ModelSelectorProps {
  type: ModelType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  type,
  value,
  onChange,
  disabled,
  className,
}) => {
  const models = getModelsForType(type);
  const selectedModel = models.find((m) => m.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={`Select ${type} model`}>
          {selectedModel ? (
            <div className="flex items-center gap-2">
              <span>{selectedModel.name}</span>
              <Badge variant="secondary" className="text-xs">
                <Coins className="h-3 w-3 mr-1" />
                {selectedModel.creditsPerGeneration}
              </Badge>
            </div>
          ) : (
            `Select ${type} model`
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-xs text-muted-foreground">
            {type.charAt(0).toUpperCase() + type.slice(1)} Models
          </SelectLabel>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  <Coins className="h-3 w-3 mr-1" />
                  {model.creditsPerGeneration}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

// Model cards for displaying available models
interface ModelCardProps {
  model: {
    id: string;
    name: string;
    description: string;
    features: readonly string[];
    creditsPerGeneration: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-muted hover:border-muted-foreground/50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{model.name}</h4>
        <Badge variant="secondary">
          <Coins className="h-3 w-3 mr-1" />
          {model.creditsPerGeneration}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
      <div className="flex flex-wrap gap-1">
        {model.features.slice(0, 3).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
      </div>
    </button>
  );
};

// Helper function to get models by type
function getModelsForType(type: ModelType) {
  switch (type) {
    case "image":
      return KIE_IMAGE_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        features: m.features,
        creditsPerGeneration: m.creditsPerGeneration,
      }));
    case "video":
      return KIE_VIDEO_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        features: m.features,
        creditsPerGeneration: m.creditsPerGeneration,
      }));
    case "music":
      return KIE_MUSIC_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        features: m.features,
        creditsPerGeneration: m.creditsPerGeneration,
      }));
    default:
      return [];
  }
}

// Export helper for getting model info
export function getModelInfo(type: ModelType, modelId: string) {
  const models = getModelsForType(type);
  return models.find((m) => m.id === modelId);
}

export default ModelSelector;

