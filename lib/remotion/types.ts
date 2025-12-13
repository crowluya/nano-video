/**
 * Remotion Video Editor Type Definitions
 * 
 * Types for the browser-based video editing functionality
 */

// =============================================================================
// Timeline Track Types
// =============================================================================

export type TrackType = 'video' | 'image' | 'audio' | 'text';

export interface BaseTrack {
  id: string;
  type: TrackType;
  startTime: number;     // Start time in seconds
  duration: number;      // Duration in seconds
  layer: number;         // Layer/z-index for stacking
  name?: string;
}

export interface VideoTrack extends BaseTrack {
  type: 'video';
  src: string;
  trimStart?: number;    // Trim start in seconds (from original video)
  trimEnd?: number;      // Trim end in seconds
  volume?: number;       // 0-1
  muted?: boolean;
  playbackRate?: number; // Speed: 0.5, 1, 2, etc.
}

export interface ImageTrack extends BaseTrack {
  type: 'image';
  src: string;
  fit?: 'cover' | 'contain' | 'fill';
  position?: {
    x: number;
    y: number;
  };
  scale?: number;
}

export interface AudioTrack extends BaseTrack {
  type: 'audio';
  src: string;
  trimStart?: number;
  trimEnd?: number;
  volume?: number;       // 0-1
  fadeIn?: number;       // Fade in duration in seconds
  fadeOut?: number;      // Fade out duration in seconds
}

export interface TextTrack extends BaseTrack {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  position?: {
    x: number;           // Percentage 0-100
    y: number;           // Percentage 0-100
  };
  align?: 'left' | 'center' | 'right';
  animation?: TextAnimation;
}

export type TimelineTrack = VideoTrack | ImageTrack | AudioTrack | TextTrack;

// =============================================================================
// Animation Types
// =============================================================================

export type TransitionType = 
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe-left'
  | 'wipe-right';

export interface Transition {
  type: TransitionType;
  duration: number;      // Duration in seconds
}

export type TextAnimation = 
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'slide-in'
  | 'typewriter'
  | 'bounce'
  | 'scale-in';

export interface TrackEffect {
  type: 'blur' | 'grayscale' | 'sepia' | 'brightness' | 'contrast' | 'saturate';
  value: number;
}

// =============================================================================
// Project Types
// =============================================================================

export interface ProjectResolution {
  width: number;
  height: number;
}

export const RESOLUTIONS = {
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '4K': { width: 3840, height: 2160 },
  'vertical-1080p': { width: 1080, height: 1920 },
  'vertical-720p': { width: 720, height: 1280 },
  'square': { width: 1080, height: 1080 },
} as const;

export type ResolutionPreset = keyof typeof RESOLUTIONS;

export interface EditProject {
  id: string;
  name: string;
  timeline: TimelineTrack[];
  duration: number;      // Total duration in seconds
  fps: number;           // Frames per second (24, 30, 60)
  resolution: ProjectResolution;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Asset Types (for asset library)
// =============================================================================

export type AssetType = 'video' | 'image' | 'audio';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;     // For video/audio
  width?: number;        // For video/image
  height?: number;       // For video/image
  createdAt: Date;
  source: 'generated' | 'uploaded' | 'r2';
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Editor State Types
// =============================================================================

export interface EditorState {
  project: EditProject;
  selectedTrackId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;          // Timeline zoom level
  volume: number;        // Preview volume
}

export interface EditorActions {
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  moveTrack: (trackId: string, newStartTime: number) => void;
  selectTrack: (trackId: string | null) => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  setZoom: (zoom: number) => void;
}

// =============================================================================
// Export Types
// =============================================================================

export type ExportFormat = 'mp4' | 'webm' | 'gif';
export type ExportQuality = 'low' | 'medium' | 'high';

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: ResolutionPreset;
  fps: number;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number;      // 0-100
  estimatedTimeRemaining?: number;
  error?: string;
}

// =============================================================================
// AI Edit Suggestion Types
// =============================================================================

export interface EditSuggestionRequest {
  description: string;
  assets: Asset[];
  style?: 'cinematic' | 'fast-paced' | 'minimal' | 'dynamic';
  targetDuration?: number;
}

export interface EditSuggestionResponse {
  project: Omit<EditProject, 'id' | 'createdAt' | 'updatedAt'>;
  explanation: string;
}

// =============================================================================
// Remotion Composition Props
// =============================================================================

export interface CompositionProps {
  tracks: TimelineTrack[];
  resolution: ProjectResolution;
  backgroundColor?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

export function createEmptyProject(name: string = 'Untitled Project'): EditProject {
  return {
    id: `project-${Date.now()}`,
    name,
    timeline: [],
    duration: 30,
    fps: 30,
    resolution: RESOLUTIONS['1080p'],
    backgroundColor: '#000000',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createVideoTrack(src: string, options: Partial<VideoTrack> = {}): VideoTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'video',
    src,
    startTime: 0,
    duration: 5,
    layer: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    ...options,
  };
}

export function createImageTrack(src: string, options: Partial<ImageTrack> = {}): ImageTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'image',
    src,
    startTime: 0,
    duration: 3,
    layer: 0,
    fit: 'cover',
    scale: 1,
    ...options,
  };
}

export function createAudioTrack(src: string, options: Partial<AudioTrack> = {}): AudioTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'audio',
    src,
    startTime: 0,
    duration: 10,
    layer: -1, // Audio tracks typically below visual tracks
    volume: 1,
    ...options,
  };
}

export function createTextTrack(text: string, options: Partial<TextTrack> = {}): TextTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'text',
    text,
    startTime: 0,
    duration: 3,
    layer: 10, // Text tracks typically on top
    fontSize: 48,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#ffffff',
    position: { x: 50, y: 50 },
    align: 'center',
    animation: 'none',
    ...options,
  };
}

export function calculateProjectDuration(tracks: TimelineTrack[]): number {
  if (tracks.length === 0) return 0;
  
  return Math.max(...tracks.map(t => t.startTime + t.duration));
}

export function sortTracksByLayer(tracks: TimelineTrack[]): TimelineTrack[] {
  return [...tracks].sort((a, b) => a.layer - b.layer);
}

export function getTracksAtTime(tracks: TimelineTrack[], time: number): TimelineTrack[] {
  return tracks.filter(t => time >= t.startTime && time < t.startTime + t.duration);
}

