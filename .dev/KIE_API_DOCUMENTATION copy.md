# Kie.ai API Documentation

This document provides a comprehensive reference for the Kie.ai API integration implemented in this repository.

## 1. Base Information

- **Base URL**: `https://api.kie.ai`
- **File Upload URL**: `https://kieai.redpandaai.co`
- **Authentication**:
  - Header: `Authorization: Bearer ${KIE_API_KEY}`
  - Content-Type: `application/json`
- **Environment Variable**: Set `KIE_API_KEY` in your `.env.local` file.

### Common Response Format
```typescript
interface KieApiResponse<T> {
  code: number;  // 200 = Success
  msg: string;   // Error message or "success"
  data: T;       // Response payload
}
```

### Task Response Format
Most generation endpoints return a task ID immediately:
```typescript
interface KieTaskResponse {
  taskId: string;
}
```

---

## 2. Account API

### Get Account Credits
- **Endpoint**: `GET /api/v1/chat/credit`
- **Returns**: `number` (Remaining credits)

---

## 3. Video Generation APIs

### Veo 3.1 (Google)
Supports Text-to-Video, Image-to-Video, First/Last Frame, and Reference Video.

- **Create Task**: `POST /api/v1/veo/generate`
  - **Parameters**:
    - `prompt` (string, required): Description of the video.
    - `model` (string): `'veo3'` (Quality) or `'veo3_fast'` (Default).
    - `aspectRatio` (string): `'16:9'`, `'9:16'`, `'Auto'`.
    - `imageUrls` (string[]): 1-3 images for Image-to-Video or Reference modes.
    - `generationType` (string):
      - `'TEXT_2_VIDEO'`
      - `'FIRST_AND_LAST_FRAMES_2_VIDEO'`
      - `'REFERENCE_2_VIDEO'` (Only `veo3_fast` + `16:9`)
    - `seeds` (number): Random seed (10000-99999).
    - `enableTranslation` (boolean): Default `true`.
    - `watermark` (string): Optional watermark text.
    - `callBackUrl` (string): Webhook URL.

- **Check Status**: `GET /api/v1/veo/record-info?taskId={taskId}`
  - **Returns**: `successFlag` (1=Success), `resultUrls` (JSON string).

- **Get 1080p Video**: `GET /api/v1/veo/get-1080p-video?taskId={taskId}`

- **Extend Video**: `POST /api/v1/veo/extend`
  - **Parameters**: `{ taskId, prompt, callBackUrl }`

### Runway Gen-3 Alpha
- **Create Task**: `POST /api/v1/runway/generate`
  - **Parameters**:
    - `prompt` (string, required)
    - `duration` (number): `5` or `10`
    - `quality` (string): `'720p'` or `'1080p'`
    - `aspectRatio` (string): `'16:9'`, `'9:16'`, `'1:1'`, `'4:3'`, `'3:4'`
    - `imageUrl` (string): Optional for Image-to-Video.
    - `waterMark` (string): Optional.

- **Check Status**: `GET /api/v1/runway/record-detail?taskId={taskId}`
  - **Returns**: `state` ('success'/'fail'), `videoInfo.videoUrl`.

- **Extend Video**: `POST /api/v1/runway/extend`
  - **Parameters**: `{ taskId, prompt, quality, callBackUrl }`

### Runway Aleph (Video-to-Video)
- **Create Task**: `POST /api/v1/runway/aleph/generate`
  - **Parameters**: `{ prompt, videoUrl, callBackUrl, watermark }`

### Luma Ray 2 (Video Modification)
- **Create Task**: `POST /api/v1/modify/generate`
  - **Parameters**: `{ prompt, videoUrl, callBackUrl, watermark }`
- **Check Status**: `GET /api/v1/modify/record-info?taskId={taskId}`

### Sora 2 (OpenAI)
Uses the generic job endpoint.

- **Create Task**: `POST /api/v1/jobs/createTask`
  - **Parameters**:
    - `model` (string):
      - `'sora-2-text-to-video'`
      - `'sora-2-image-to-video'`
      - `'sora-2-pro-text-to-video'`
      - `'sora-2-pro-image-to-video'`
      - `'sora-watermark-remover'`
    - `input` (object):
      - `prompt` (string)
      - `image_urls` (string[]): For image-to-video.
      - `aspect_ratio` (string): `'portrait'` or `'landscape'`.
      - `n_frames` (string): `'10'` or `'15'`.
      - `remove_watermark` (boolean)

- **Check Status**: `GET /api/v1/jobs/recordInfo?taskId={taskId}`
  - **Returns**: `state`, `resultJson` (Parse to get `resultUrls`).

### Wan Video (2.2 / 2.5)
Uses the generic job endpoint.

- **Create Task**: `POST /api/v1/jobs/createTask`
  - **Wan 2.2 Models**: `'wan/2-2-a14b-image-to-video-turbo'`, `'wan/2-2-a14b-text-to-video-turbo'`
    - **Input**: `{ image_url, prompt, resolution: '480p'|'580p'|'720p', aspect_ratio: 'auto'|'16:9'|'9:16'|'1:1' }`
  - **Wan 2.5 Models**: `'wan/2-5-image-to-video'`, `'wan/2-5-text-to-video'`
    - **Input**: `{ prompt, image_url, duration: '5'|'10', resolution: '720p'|'1080p' }`

- **Check Status**: `GET /api/v1/jobs/recordInfo?taskId={taskId}`

---

## 4. Image Generation APIs

### GPT-4o Image
- **Create Task**: `POST /api/v1/gpt4o-image/generate`
  - **Parameters**:
    - `prompt` (string)
    - `size` (string): `'1:1'`, `'3:2'`, `'2:3'`
    - `nVariants` (number): `1`, `2`, `4`
    - `filesUrl` (string[]): Optional reference images.
    - `maskUrl` (string): Optional for editing.
    - `enableFallback` (boolean): Default false.

- **Check Status**: `GET /api/v1/gpt4o-image/record-info?taskId={taskId}`
  - **Returns**: `successFlag` (0=Generating, 1=Success, 2=Failed), `response.resultUrls`.

- **Get Download URL**: `POST /api/v1/gpt4o-image/download-url`
  - **Body**: `{ imageUrl }`

### Flux Kontext (Pro/Max)
- **Create Task**: `POST /api/v1/flux/kontext/generate`
  - **Parameters**:
    - `prompt` (string)
    - `model` (string): `'flux-kontext-pro'` or `'flux-kontext-max'`
    - `aspectRatio` (string): `'21:9'`, `'16:9'`, `'4:3'`, `'1:1'`, `'3:4'`, `'9:16'`, `'16:21'`
    - `inputImage` (string): Optional.
    - `outputFormat` (string): `'jpeg'` or `'png'`.

- **Check Status**: `GET /api/v1/flux/kontext/record-info?taskId={taskId}`

### Nano Banana (Google Gemini Image)
Uses the generic job endpoint.

- **Create Task**: `POST /api/v1/jobs/createTask`
  - **Models**:
    - `'google/nano-banana'` (Standard)
    - `'google/nano-banana-edit'` (Editing)
    - `'nano-banana-pro'` (Pro/4K)
  - **Input Parameters**:
    - `prompt` (string)
    - `image_size` / `aspect_ratio`: `'1:1'`, `'16:9'`, `'9:16'`, `'4:3'`, `'3:4'`, `'21:9'`, `'auto'`
    - `output_format`: `'png'` or `'jpg'`
    - `resolution` (Pro only): `'1K'`, `'2K'`, `'4K'`
    - `image_urls` / `image_input`: Array of image URLs (for Edit/Pro).

- **Check Status**: `GET /api/v1/jobs/recordInfo?taskId={taskId}`

### Midjourney
- **Create Task**: `POST /api/v1/mj/generate`
  - **Parameters**:
    - `taskType`: `'mj_txt2img'`, `'mj_img2img'`, `'mj_video'`, `'mj_style_reference'`, `'mj_omni_reference'`
    - `prompt` (string)
    - `aspectRatio` (string): `'16:9'`, `'1:1'`, etc.
    - `version` (string): `'7'`, `'6.1'`, `'6'`, `'5.2'`, `'niji6'`
    - `speed` (string): `'relaxed'`, `'fast'`, `'turbo'`
    - `fileUrls` (string[]): Reference images.

- **Check Status**: `GET /api/v1/mj/record-info?taskId={taskId}`
  - **Returns**: `resultUrls` (Array of strings).

---

## 5. Music Generation API (Suno)

- **Create Task**: `POST /api/v1/generate`
  - **Parameters**:
    - `prompt` (string)
    - `customMode` (boolean)
    - `instrumental` (boolean)
    - `model` (string): `'V3_5'`, `'V4'`, `'V4_5'`, `'V5'`
    - `style` (string), `title` (string)

- **Extend Music**: `POST /api/v1/generate/extend`
  - **Parameters**: `{ audioId, prompt, continueAt, ... }`

- **Generate Lyrics**: `POST /api/v1/lyrics`
  - **Parameters**: `{ prompt }`

- **Check Status**: `GET /api/v1/generate/record-info?taskId={taskId}`
  - **Returns**: `status` ('SUCCESS', 'PENDING', etc.), `response.sunoData`.

---

## 6. File Upload API

- **URL Upload**: `POST https://kieai.redpandaai.co/api/file-url-upload`
  - **Body**: `{ fileUrl, uploadPath?, fileName? }`
  - **Returns**: `{ fileUrl, downloadUrl, ... }`

- **Base64 Upload**: `POST https://kieai.redpandaai.co/api/file-base64-upload`
  - **Body**: `{ base64Data, uploadPath?, fileName? }`

---

## 7. Client Usage Example

```typescript
import { getKieClient } from './lib/kie';

// Initialize client (uses KIE_API_KEY from env)
const client = getKieClient();

// Example: Generate an Image
async function generateImage() {
  try {
    // 1. Create Task
    const taskId = await client.generate4oImage({
      prompt: 'A futuristic city with flying cars',
      size: '16:9'
    });
    console.log('Task ID:', taskId);

    // 2. Wait for Completion (Polling)
    const imageUrls = await client.waitFor4oImageCompletion(taskId);
    console.log('Generated Image:', imageUrls[0]);
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

// Example: Generate a Video
async function generateVideo() {
  try {
    const taskId = await client.generateVeo3Video({
      prompt: 'A cinematic drone shot of a waterfall',
      model: 'veo3_fast',
      aspectRatio: '16:9'
    });
    
    // Poll for status
    const resultUrls = await client.waitForVeo3Completion(taskId);
    console.log('Video URL:', resultUrls[0]);
  } catch (error) {
    console.error('Video failed:', error);
  }
}
```

## 8. Polling Strategy

The client includes helper methods (`waitFor...Completion`) that implement polling logic:
- **Video**: Polls every 10-30 seconds. Max wait time ~10-15 minutes.
- **Image**: Polls every 3-10 seconds. Max wait time ~3-5 minutes.

## 9. Common Errors

- **401 Unauthorized**: Invalid API Key. Check `.env.local`.
- **403 Forbidden**: API Key does not have permission for this model.
- **429 Too Many Requests**: Rate limit exceeded.
- **404 Not Found**: Endpoint incorrect or model not available.
- **422 Unprocessable Entity**: Invalid parameters (e.g., wrong aspect ratio for model).
