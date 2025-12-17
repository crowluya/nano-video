/**
 * Kie.ai API Type Definitions
 * 
 * This file contains all TypeScript types for the Kie.ai API integration.
 * Covers: Image Generation, Video Generation, Music Generation, and File Upload.
 */

// =============================================================================
// Common Types
// =============================================================================

export interface KieApiResponse<T> {
  code: number;  // 200 = Success
  msg: string;   // Error message or "success"
  data: T;       // Response payload
}

export interface KieTaskResponse {
  taskId: string;
}

export type TaskSuccessFlag = 0 | 1 | 2 | 3;
// 0 = generating, 1 = success, 2 = create_task_failed, 3 = generate_failed

export type TaskState = 'pending' | 'processing' | 'success' | 'fail' | 'failed';

// =============================================================================
// Image Generation Types
// =============================================================================

// --- GPT-4o Image ---
export interface Gpt4oImageRequest {
  prompt: string;
  size?: '1:1' | '3:2' | '2:3';
  nVariants?: 1 | 2 | 4;
  filesUrl?: string[];
  maskUrl?: string;
  enableFallback?: boolean;
}

export interface Gpt4oImageStatusResponse {
  successFlag: TaskSuccessFlag;
  response?: {
    resultUrls: string[];
  };
}

// --- Flux Kontext ---
export type FluxKontextModel = 'flux-kontext-pro' | 'flux-kontext-max';
export type FluxKontextAspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export interface FluxKontextRequest {
  prompt: string;
  model: FluxKontextModel;
  aspectRatio?: FluxKontextAspectRatio;
  inputImage?: string;
  outputFormat?: 'jpeg' | 'png';
  enableTranslation?: boolean; // Default: true
  promptUpsampling?: boolean; // Default: false
}

export interface FluxKontextResponse {
  originImageUrl?: string | null;
  resultImageUrl?: string | null;
}

export interface FluxKontextStatusResponse {
  successFlag: TaskSuccessFlag;
  resultUrl?: string;
  resultUrls?: string[];
  response?: FluxKontextResponse; // API returns URL in response.resultImageUrl
  errorMessage?: string;
  errorCode?: string | null;
}

// --- Nano Banana (Google Gemini Image) ---
export type NanoBananaModel = 'google/nano-banana' | 'google/nano-banana-edit' | 'nano-banana-pro';
export type NanoBananaAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto';
export type NanoBananaResolution = '1K' | '2K' | '4K';

export interface NanoBananaInput {
  prompt: string;
  image_size?: NanoBananaAspectRatio;
  aspect_ratio?: NanoBananaAspectRatio;
  output_format?: 'png' | 'jpg';
  resolution?: NanoBananaResolution; // Pro only
  image_urls?: string[]; // For Edit/Pro
  image_input?: string[];
}

export interface NanoBananaRequest {
  model: NanoBananaModel;
  input: NanoBananaInput;
}

// --- Z-Image (Tongyi-MAI) ---
export type ZImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

export interface ZImageRequest {
  prompt: string;
  aspect_ratio: ZImageAspectRatio;
}

export interface ZImageStatusResponse {
  state: TaskState;
  resultJson?: string;
  resultUrls?: string[];
}

// --- Midjourney ---
export type MidjourneyTaskType = 'mj_txt2img' | 'mj_img2img' | 'mj_video' | 'mj_style_reference' | 'mj_omni_reference';
export type MidjourneyVersion = '7' | '6.1' | '6' | '5.2' | 'niji6';
export type MidjourneySpeed = 'relaxed' | 'fast' | 'turbo';

export interface MidjourneyRequest {
  taskType: MidjourneyTaskType;
  prompt: string;
  aspectRatio?: string;
  version?: MidjourneyVersion;
  speed?: MidjourneySpeed;
  fileUrl?: string; // Single image URL (legacy, use fileUrls instead)
  fileUrls?: string[]; // Array of image URLs (recommended)
  variety?: number; // 0-100, controls diversity
  stylization?: number; // 0-1000, controls artistic style
  weirdness?: number; // 0-3000, controls creativity
  ow?: number; // 1-1000, omni intensity (for mj_omni_reference)
  waterMark?: string; // Watermark identifier
  callBackUrl?: string; // Callback URL for completion notifications
  enableTranslation?: boolean; // Enable prompt translation
}

export interface MidjourneyResultUrl {
  resultUrl: string;
}

export interface MidjourneyResultInfo {
  resultUrls: MidjourneyResultUrl[];
}

export interface MidjourneyStatusResponse {
  taskId?: string;
  taskType?: string;
  paramJson?: string;
  completeTime?: number | string;
  resultInfoJson?: MidjourneyResultInfo;
  successFlag: TaskSuccessFlag;
  createTime?: number | string;
  errorCode?: string | null;
  errorMessage?: string | null;
  // Legacy support
  resultUrls?: string[];
  state?: TaskState;
}

// =============================================================================
// Video Generation Types
// =============================================================================

// --- Veo 3.1 (Google) ---
export type Veo3Model = 'veo3' | 'veo3_fast';
export type Veo3GenerationType = 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
export type Veo3AspectRatio = '16:9' | '9:16' | 'Auto';

export interface Veo3GenerateRequest {
  prompt: string;
  model?: Veo3Model;
  aspectRatio?: Veo3AspectRatio;
  imageUrls?: string[];
  generationType?: Veo3GenerationType;
  seeds?: number;
  enableTranslation?: boolean;
  watermark?: string;
  callBackUrl?: string;
}

export interface Veo3ExtendRequest {
  taskId: string;
  prompt: string;
  callBackUrl?: string;
}

export interface Veo3Response {
  taskId?: string;
  resolution?: string;
  originUrls?: string[] | null;
  resultUrls?: string[];
  hasAudioList?: boolean[];
  seeds?: number[];
}

export interface Veo3StatusResponse {
  taskId?: string;
  paramJson?: string;
  response?: Veo3Response | null;
  successFlag: TaskSuccessFlag;
  fallbackFlag?: boolean;
  completeTime?: number | null;
  createTime?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  // Legacy fields for backward compatibility
  resultUrls?: string; // JSON string that needs to be parsed
  videoUrl?: string;
}

// --- Sora 2 (OpenAI) ---
export type Sora2Model = 
  | 'sora-2-text-to-video'
  | 'sora-2-image-to-video'
  | 'sora-2-pro-text-to-video'
  | 'sora-2-pro-image-to-video'
  | 'sora-watermark-remover';

export type Sora2AspectRatio = 'portrait' | 'landscape';
export type Sora2Frames = '10' | '15';

export interface Sora2Input {
  prompt: string;
  image_urls?: string[];
  aspect_ratio?: Sora2AspectRatio;
  n_frames?: Sora2Frames;
  remove_watermark?: boolean;
}

export interface Sora2Request {
  model: Sora2Model;
  input: Sora2Input;
}

export interface Sora2StatusResponse {
  state: TaskState;
  resultJson?: string; // JSON string with resultUrls
}

// --- Runway Gen-3 Alpha ---
export type RunwayQuality = '720p' | '1080p';
export type RunwayAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface RunwayGenerateRequest {
  prompt: string;
  duration?: 5 | 10;
  quality?: RunwayQuality;
  aspectRatio?: RunwayAspectRatio;
  imageUrl?: string;
  waterMark?: string;
}

export interface RunwayExtendRequest {
  taskId: string;
  prompt: string;
  quality?: RunwayQuality;
  callBackUrl?: string;
}

export interface RunwayStatusResponse {
  state: TaskState;
  videoInfo?: {
    videoUrl: string;
  };
}

// --- Runway Aleph (Video-to-Video) ---
export interface RunwayAlephRequest {
  prompt: string;
  videoUrl: string;
  callBackUrl?: string;
  watermark?: string;
}

// --- Luma Ray 2 (Video Modification) ---
export interface LumaModifyRequest {
  prompt: string;
  videoUrl: string;
  callBackUrl?: string;
  watermark?: string;
}

export interface LumaStatusResponse {
  successFlag: TaskSuccessFlag;
  videoUrl?: string;
}

// --- Wan Video (2.2 / 2.5) ---
export type Wan22Model = 'wan/2-2-a14b-image-to-video-turbo' | 'wan/2-2-a14b-text-to-video-turbo';
export type Wan25Model = 'wan/2-5-image-to-video' | 'wan/2-5-text-to-video';
export type WanModel = Wan22Model | Wan25Model;

export interface Wan22Input {
  prompt: string;
  image_url?: string;
  resolution?: '480p' | '580p' | '720p';
  aspect_ratio?: 'auto' | '16:9' | '9:16' | '1:1';
}

export interface Wan25Input {
  prompt: string;
  image_url?: string;
  duration?: '5' | '10';
  resolution?: '720p' | '1080p';
}

export interface WanVideoRequest {
  model: WanModel;
  input: Wan22Input | Wan25Input;
}

export interface WanStatusResponse {
  state: TaskState;
  resultJson?: string;
}

// =============================================================================
// Music Generation Types (Suno)
// =============================================================================

export type SunoModel = 'V3_5' | 'V4' | 'V4_5' | 'V4_5_Plus' | 'V5';

export interface SunoGenerateRequest {
  prompt: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: SunoModel;
  style?: string;
  title?: string;
}

export interface SunoExtendRequest {
  audioId: string;
  prompt: string;
  continueAt?: number;
  model?: SunoModel;
  style?: string;
  title?: string;
}

export interface SunoLyricsRequest {
  prompt: string;
}

export interface SunoLyricsResponse {
  lyrics: string;
  title?: string;
}

export type SunoStatus = 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'FAILED';

export interface SunoTrack {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  video_url?: string;
  duration: number;
  style?: string;
}

export interface SunoStatusResponse {
  status: SunoStatus;
  response?: {
    sunoData: SunoTrack[];
  };
}

// =============================================================================
// File Upload Types
// =============================================================================

export interface FileUrlUploadRequest {
  fileUrl: string;
  uploadPath?: string;
  fileName?: string;
}

export interface FileBase64UploadRequest {
  base64Data: string;
  uploadPath?: string;
  fileName?: string;
}

export interface FileUploadResponse {
  success: boolean;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  // Legacy field for backward compatibility
  fileUrl?: string;
}

// =============================================================================
// Generic Job Types (for jobs/createTask endpoint)
// =============================================================================

export interface GenericJobRequest {
  model: string;
  input: Record<string, unknown>;
}

export interface GenericJobStatusResponse {
  state: TaskState;
  resultJson?: string;
  successFlag?: TaskSuccessFlag;
}

// =============================================================================
// Client Configuration
// =============================================================================

export interface KieClientConfig {
  apiKey: string;
  baseUrl?: string;
  fileUploadUrl?: string;
  timeout?: number;
}

// =============================================================================
// Polling Configuration
// =============================================================================

export interface PollingOptions {
  intervalMs?: number;
  maxAttempts?: number;
  onProgress?: (attempt: number, status: unknown) => void;
}

export const DEFAULT_POLLING_OPTIONS = {
  image: {
    intervalMs: 5000,    // 5 seconds
    maxAttempts: 60,     // 5 minutes max
  },
  video: {
    intervalMs: 15000,   // 15 seconds
    maxAttempts: 60,     // 15 minutes max
  },
  music: {
    intervalMs: 10000,   // 10 seconds
    maxAttempts: 36,     // 6 minutes max
  },
} as const;

