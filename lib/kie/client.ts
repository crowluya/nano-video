/**
 * Kie.ai Unified API Client
 * 
 * This client provides a unified interface for all Kie.ai API operations:
 * - Image Generation (Nano Banana, Midjourney, Flux Kontext, GPT-4o Image)
 * - Video Generation (Sora 2, Veo 3.1, Runway, Wan)
 * - Music Generation (Suno)
 * - File Upload
 */

import {
  DEFAULT_POLLING_OPTIONS,
  FileBase64UploadRequest,
  FileUploadResponse,
  FileUrlUploadRequest,
  FluxKontextRequest,
  FluxKontextStatusResponse,
  GenericJobStatusResponse,
  Gpt4oImageRequest,
  Gpt4oImageStatusResponse,
  KieApiResponse,
  KieClientConfig,
  KieTaskResponse,
  LumaModifyRequest,
  LumaStatusResponse,
  MidjourneyRequest,
  MidjourneyStatusResponse,
  NanoBananaRequest,
  PollingOptions,
  RunwayAlephRequest,
  RunwayExtendRequest,
  RunwayGenerateRequest,
  RunwayStatusResponse,
  Sora2Request,
  Sora2StatusResponse,
  SunoExtendRequest,
  SunoGenerateRequest,
  SunoLyricsRequest,
  SunoLyricsResponse,
  SunoStatusResponse,
  Veo3ExtendRequest,
  Veo3GenerateRequest,
  Veo3Response,
  Veo3StatusResponse,
  WanStatusResponse,
  WanVideoRequest,
  ZImageRequest,
  ZImageStatusResponse
} from './types';

const DEFAULT_BASE_URL = 'https://api.kie.ai';
const DEFAULT_FILE_UPLOAD_URL = 'https://kieai.redpandaai.co';

export class KieClient {
  private apiKey: string;
  private baseUrl: string;
  private fileUploadUrl: string;
  private timeout: number;

  constructor(config: KieClientConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = DEFAULT_BASE_URL;
      this.fileUploadUrl = DEFAULT_FILE_UPLOAD_URL;
      this.timeout = 30000;
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
      this.fileUploadUrl = config.fileUploadUrl || DEFAULT_FILE_UPLOAD_URL;
      this.timeout = config.timeout || 30000;
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isFileUpload = false
  ): Promise<T> {
    const url = isFileUpload
      ? `${this.fileUploadUrl}${endpoint}`
      : `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kie API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Handle API-level errors
      if (data.code && data.code !== 200) {
        throw new Error(`Kie API Error: ${data.msg || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Kie API request timeout');
      }
      throw error;
    }
  }

  private async poll<T>(
    statusFn: () => Promise<T>,
    isComplete: (status: T) => boolean,
    options: PollingOptions = {}
  ): Promise<T> {
    const { intervalMs = 5000, maxAttempts = 60, onProgress } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await statusFn();

      if (onProgress) {
        onProgress(attempt, status);
      }

      if (isComplete(status)) {
        return status;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Polling timeout after ${maxAttempts} attempts`);
  }

  // ===========================================================================
  // Account API
  // ===========================================================================

  async getCredits(): Promise<number> {
    const response = await this.request<KieApiResponse<number>>(
      '/api/v1/chat/credit',
      { method: 'GET' }
    );
    return response.data;
  }

  // ===========================================================================
  // Image Generation - GPT-4o Image
  // ===========================================================================

  async generate4oImage(params: Gpt4oImageRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/gpt4o-image/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async get4oImageStatus(taskId: string): Promise<Gpt4oImageStatusResponse> {
    const response = await this.request<KieApiResponse<Gpt4oImageStatusResponse>>(
      `/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async get4oImageDownloadUrl(imageUrl: string): Promise<string> {
    const response = await this.request<KieApiResponse<{ downloadUrl: string }>>(
      '/api/v1/gpt4o-image/download-url',
      {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      }
    );
    return response.data.downloadUrl;
  }

  async waitFor4oImageCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.get4oImageStatus(taskId),
      (status) => status.successFlag === 1 || status.successFlag === 2 || status.successFlag === 3,
      { ...DEFAULT_POLLING_OPTIONS.image, ...options }
    );

    if (finalStatus.successFlag !== 1) {
      throw new Error('GPT-4o Image generation failed');
    }

    return finalStatus.response?.resultUrls || [];
  }

  // ===========================================================================
  // Image Generation - Flux Kontext
  // ===========================================================================

  async generateFluxKontextImage(params: FluxKontextRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/flux/kontext/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getFluxKontextStatus(taskId: string): Promise<FluxKontextStatusResponse> {
    const response = await this.request<KieApiResponse<FluxKontextStatusResponse>>(
      `/api/v1/flux/kontext/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForFluxKontextCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getFluxKontextStatus(taskId),
      (status) => status.successFlag === 1 || status.successFlag === 2 || status.successFlag === 3,
      { ...DEFAULT_POLLING_OPTIONS.image, ...options }
    );

    if (finalStatus.successFlag !== 1) {
      const errorMsg = finalStatus.errorMessage || 'Flux Kontext Image generation failed';
      throw new Error(errorMsg);
    }

    // Extract URL from response.resultImageUrl (actual API format)
    let urls: string[] = [];
    if (finalStatus.response?.resultImageUrl) {
      urls = [finalStatus.response.resultImageUrl];
    } else if (finalStatus.resultUrls && finalStatus.resultUrls.length > 0) {
      urls = finalStatus.resultUrls;
    } else if (finalStatus.resultUrl) {
      urls = [finalStatus.resultUrl];
    }
    return urls;
  }

  // ===========================================================================
  // Image Generation - Nano Banana (via jobs endpoint)
  // ===========================================================================

  async generateNanoBananaImage(params: NanoBananaRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/jobs/createTask',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }
  
  // ===========================================================================
  // Image Generation - Z-Image (Tongyi-MAI)
  // ===========================================================================

  async generateZImage(params: ZImageRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/jobs/createTask',
      {
        method: 'POST',
        body: JSON.stringify({
          model: 'z-image',
          input: params,
        }),
      }
    );
    return response.data.taskId;
  }

  async getZImageStatus(taskId: string): Promise<ZImageStatusResponse> {
    const response = await this.request<KieApiResponse<ZImageStatusResponse>>(
      `/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForZImageCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getZImageStatus(taskId),
      (status) => status.state === 'success' || status.state === 'fail' || status.state === 'failed',
      { ...DEFAULT_POLLING_OPTIONS.image, ...options }
    );

    if (finalStatus.state !== 'success') {
      throw new Error('Z-Image generation failed');
    }

    if (finalStatus.resultJson) {
      const result = JSON.parse(finalStatus.resultJson);
      return result.resultUrls || result.result_urls || [];
    }

    return finalStatus.resultUrls || [];
  }

  async getNanoBananaStatus(taskId: string): Promise<GenericJobStatusResponse> {
    const response = await this.request<KieApiResponse<GenericJobStatusResponse>>(
      `/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForNanoBananaCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getNanoBananaStatus(taskId),
      (status) => status.state === 'success' || status.state === 'fail' || status.state === 'failed',
      { ...DEFAULT_POLLING_OPTIONS.image, ...options }
    );

    if (finalStatus.state !== 'success') {
      throw new Error('Nano Banana Image generation failed');
    }

    if (finalStatus.resultJson) {
      const result = JSON.parse(finalStatus.resultJson);
      return result.resultUrls || result.result_urls || [];
    }

    return [];
  }

  // ===========================================================================
  // Image Generation - Midjourney
  // ===========================================================================

  async generateMidjourneyImage(params: MidjourneyRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/mj/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getMidjourneyStatus(taskId: string): Promise<MidjourneyStatusResponse> {
    const response = await this.request<KieApiResponse<MidjourneyStatusResponse>>(
      `/api/v1/mj/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForMidjourneyCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getMidjourneyStatus(taskId),
      (status) => status.successFlag === 1 || status.successFlag === 2 || status.successFlag === 3 ||
                  status.state === 'success' || status.state === 'fail',
      { ...DEFAULT_POLLING_OPTIONS.image, ...options }
    );

    if (finalStatus.successFlag !== 1 && finalStatus.state !== 'success') {
      const errorMsg = finalStatus.errorMessage || 'Midjourney Image generation failed';
      throw new Error(errorMsg);
    }

    // Extract URLs from resultInfoJson.resultUrls array
    if (finalStatus.resultInfoJson?.resultUrls) {
      return finalStatus.resultInfoJson.resultUrls.map(item => item.resultUrl);
    }

    // Fallback to legacy format
    return finalStatus.resultUrls || [];
  }

  // ===========================================================================
  // Video Generation - Veo 3.1
  // ===========================================================================

  async generateVeo3Video(params: Veo3GenerateRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/veo/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          generationType: 'TEXT_2_VIDEO',
          model: 'veo3_fast',
          ...params,
        }),
      }
    );
    return response.data.taskId;
  }

  async getVeo3Status(taskId: string): Promise<Veo3StatusResponse> {
    const response = await this.request<KieApiResponse<Veo3StatusResponse>>(
      `/api/v1/veo/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async extendVeo3Video(params: Veo3ExtendRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/veo/extend',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getVeo31080pVideo(taskId: string): Promise<string> {
    const response = await this.request<KieApiResponse<{ videoUrl: string }>>(
      `/api/v1/veo/get-1080p-video?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data.videoUrl;
  }

  async waitForVeo3Completion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getVeo3Status(taskId),
      (status) => status.successFlag === 1 || status.successFlag === 2 || status.successFlag === 3,
      { ...DEFAULT_POLLING_OPTIONS.video, ...options }
    );

    if (finalStatus.successFlag !== 1) {
      throw new Error('Veo 3.1 Video generation failed');
    }

    // Priority 1: Extract from response.resultUrls (actual API format)
    if (finalStatus.response?.resultUrls && finalStatus.response.resultUrls.length > 0) {
      return finalStatus.response.resultUrls;
    }

    // Priority 2: Parse legacy resultUrls JSON string
    if (finalStatus.resultUrls) {
      try {
        const urls = JSON.parse(finalStatus.resultUrls);
        const result = Array.isArray(urls) ? urls : [urls];
        return result;
      } catch {
        return [finalStatus.resultUrls];
      }
    }

    // Priority 3: Use videoUrl if exists
    if (finalStatus.videoUrl) {
      return [finalStatus.videoUrl];
    }

    // Priority 4: Try to get 1080p video URL as fallback (may not be ready immediately)
    try {
      const videoUrl1080p = await this.getVeo31080pVideo(taskId);
      if (videoUrl1080p) {
        return [videoUrl1080p];
      }
    } catch {
      // Ignore error - 1080p may not be ready yet, but 720p should be in response.resultUrls
    }

    return [];
  }

  // ===========================================================================
  // Video Generation - Sora 2
  // ===========================================================================

  async generateSora2Video(params: Sora2Request): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/jobs/createTask',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getSora2Status(taskId: string): Promise<Sora2StatusResponse> {
    const response = await this.request<KieApiResponse<Sora2StatusResponse>>(
      `/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForSora2Completion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getSora2Status(taskId),
      (status) => status.state === 'success' || status.state === 'fail' || status.state === 'failed',
      { ...DEFAULT_POLLING_OPTIONS.video, ...options }
    );

    if (finalStatus.state !== 'success') {
      throw new Error('Sora 2 Video generation failed');
    }

    if (finalStatus.resultJson) {
      try {
        const result = JSON.parse(finalStatus.resultJson);
        const urls = result.resultUrls || result.result_urls || [];
        return urls;
      } catch {
        return [];
      }
    }

    return [];
  }

  // ===========================================================================
  // Video Generation - Runway
  // ===========================================================================

  async generateRunwayVideo(params: RunwayGenerateRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/runway/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getRunwayStatus(taskId: string): Promise<RunwayStatusResponse> {
    const response = await this.request<KieApiResponse<RunwayStatusResponse>>(
      `/api/v1/runway/record-detail?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async extendRunwayVideo(params: RunwayExtendRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/runway/extend',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async generateRunwayAlephVideo(params: RunwayAlephRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/runway/aleph/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async waitForRunwayCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getRunwayStatus(taskId),
      (status) => status.state === 'success' || status.state === 'fail',
      { ...DEFAULT_POLLING_OPTIONS.video, ...options }
    );

    if (finalStatus.state !== 'success') {
      throw new Error('Runway Video generation failed');
    }

    return finalStatus.videoInfo?.videoUrl ? [finalStatus.videoInfo.videoUrl] : [];
  }

  // ===========================================================================
  // Video Generation - Luma Ray 2
  // ===========================================================================

  async modifyLumaVideo(params: LumaModifyRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/modify/generate',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getLumaStatus(taskId: string): Promise<LumaStatusResponse> {
    const response = await this.request<KieApiResponse<LumaStatusResponse>>(
      `/api/v1/modify/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForLumaCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getLumaStatus(taskId),
      (status) => status.successFlag === 1 || status.successFlag === 2 || status.successFlag === 3,
      { ...DEFAULT_POLLING_OPTIONS.video, ...options }
    );

    if (finalStatus.successFlag !== 1) {
      throw new Error('Luma Video modification failed');
    }

    return finalStatus.videoUrl ? [finalStatus.videoUrl] : [];
  }

  // ===========================================================================
  // Video Generation - Wan Video
  // ===========================================================================

  async generateWanVideo(params: WanVideoRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/jobs/createTask',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async getWanVideoStatus(taskId: string): Promise<WanStatusResponse> {
    const response = await this.request<KieApiResponse<WanStatusResponse>>(
      `/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForWanVideoCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<string[]> {
    const finalStatus = await this.poll(
      () => this.getWanVideoStatus(taskId),
      (status) => status.state === 'success' || status.state === 'fail' || status.state === 'failed',
      { ...DEFAULT_POLLING_OPTIONS.video, ...options }
    );

    if (finalStatus.state !== 'success') {
      throw new Error('Wan Video generation failed');
    }

    if (finalStatus.resultJson) {
      const result = JSON.parse(finalStatus.resultJson);
      return result.resultUrls || result.result_urls || [];
    }

    return [];
  }

  // ===========================================================================
  // Music Generation - Suno
  // ===========================================================================

  async generateSunoMusic(params: SunoGenerateRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          model: 'V4',
          ...params,
        }),
      }
    );
    return response.data.taskId;
  }

  async extendSunoMusic(params: SunoExtendRequest): Promise<string> {
    const response = await this.request<KieApiResponse<KieTaskResponse>>(
      '/api/v1/generate/extend',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data.taskId;
  }

  async generateSunoLyrics(params: SunoLyricsRequest): Promise<SunoLyricsResponse> {
    const response = await this.request<KieApiResponse<SunoLyricsResponse>>(
      '/api/v1/lyrics',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    return response.data;
  }

  async getSunoStatus(taskId: string): Promise<SunoStatusResponse> {
    const response = await this.request<KieApiResponse<SunoStatusResponse>>(
      `/api/v1/generate/record-info?taskId=${taskId}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async waitForSunoCompletion(
    taskId: string,
    options?: PollingOptions
  ): Promise<SunoStatusResponse['response']> {
    const finalStatus = await this.poll(
      () => this.getSunoStatus(taskId),
      (status) => status.status === 'SUCCESS' || status.status === 'FAILED',
      { ...DEFAULT_POLLING_OPTIONS.music, ...options }
    );

    if (finalStatus.status !== 'SUCCESS') {
      throw new Error('Suno Music generation failed');
    }

    return finalStatus.response;
  }

  // ===========================================================================
  // File Upload
  // ===========================================================================

  async uploadFileFromUrl(params: FileUrlUploadRequest): Promise<FileUploadResponse> {
    const response = await this.request<KieApiResponse<FileUploadResponse>>(
      '/api/file-url-upload',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      true // isFileUpload
    );
    return response.data;
  }

  async uploadFileBase64(params: FileBase64UploadRequest): Promise<FileUploadResponse> {
    const response = await this.request<KieApiResponse<FileUploadResponse>>(
      '/api/file-base64-upload',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      true // isFileUpload
    );
    return response.data;
  }
}

// =============================================================================
// Singleton Instance Helper
// =============================================================================

let clientInstance: KieClient | null = null;

export function getKieClient(): KieClient {
  if (!clientInstance) {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      throw new Error('KIE_API_KEY environment variable is not set');
    }
    clientInstance = new KieClient(apiKey);
  }
  return clientInstance;
}

export function createKieClient(config: KieClientConfig | string): KieClient {
  return new KieClient(config);
}

