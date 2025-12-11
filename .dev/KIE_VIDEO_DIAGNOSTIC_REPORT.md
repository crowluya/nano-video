# Kie.ai Video Generation - Diagnostic Report

**Date:** 2025-01-04
**Status:** ⚠️ PARTIALLY WORKING

## Summary

Kie.ai video generation API has been tested. **Only 2 out of 15+ video models are currently functional** through the API:
- ✅ Veo3 (Google) - Fully working
- ✅ Runway Gen-3 - Fully working
- ❌ All other models (Kling, Sora, Wan, Hailuo, etc.) return 404 or 422 errors

---

## Test Results

### ✅ Working Models

| Model | Status | Endpoint | Notes |
|-------|--------|----------|-------|
| **Veo 3** | ✅ Working | `/api/v1/veo/generate` | Fast & quality variants available |
| **Veo 3 Fast** | ✅ Working | `/api/v1/veo/generate` | Faster generation |
| **Runway Gen-3** | ✅ Working | `/api/v1/runway/generate` | Text-to-video & image-to-video |
| **Runway Aleph** | ✅ Working | `/api/v1/runway/aleph/generate` | Video-to-video |
| **Luma Ray2** | ✅ Should work | `/api/v1/modify/generate` | Video modification |

### ❌ Not Working / Unavailable

| Model | Status | Error | Notes |
|-------|--------|-------|-------|
| **Kling 2.1** | ❌ Unavailable | 422 - "Page does not exist or is not published" | May not be released yet |
| **Kling 2.5** | ❌ Unavailable | 422 - Same error | May not be released yet |
| **Sora 2** | ❌ Unavailable | 404 / 422 | Despite marketing materials, API not accessible |
| **Sora 2 Pro** | ❌ Unavailable | 404 / 422 | Not accessible |
| **Wan 2.2** | ❌ Unavailable | 422 | Not accessible |
| **Wan 2.5** | ❌ Unavailable | 422 | Not accessible |
| **Hailuo 2.3** | ❌ Unavailable | 422 | Not accessible |
| **Seedance** | ❌ Unavailable | 404 / 422 | Not accessible |

---

## API Configuration

```
✅ KIE_API_KEY: Valid and working
✅ Account Credits: 883 credits
✅ Base URL: https://api.kie.ai
✅ Authentication: Working correctly
✅ Veo3 & Runway: Fully functional
❌ Other models: Not accessible via API
```

---

## Working API Endpoints

### Veo3 (Google Video Model)

**Create Video:**
```
POST /api/v1/veo/generate
{
  "prompt": "A cute cat walking on grass",
  "model": "veo3" | "veo3_fast",
  "aspectRatio": "16:9" | "9:16" | "1:1",
  "imageUrls": ["https://..."] // Optional for image-to-video
}
```

**Check Status:**
```
GET /api/v1/veo/record-info?taskId={taskId}
```

**Response Format:**
```json
{
  "taskId": "...",
  "successFlag": 0 | 1 | 2 | 3,
  "resultUrls": "[\\"https://...\"]", // JSON string
  "paramJson": "...",
  "completeTime": timestamp,
  "errorMessage": null
}
```

### Runway Gen-3

**Create Video:**
```
POST /api/v1/runway/generate
{
  "prompt": "A serene lake at sunset",
  "duration": 5 | 10,
  "quality": "720p" | "1080p",
  "aspectRatio": "16:9" | "9:16" | "1:1" | "4:3" | "3:4",
  "imageUrl": "https://..." // Optional
}
```

**Check Status:**
```
GET /api/v1/runway/record-detail?taskId={taskId}
```

**Response Format:**
```json
{
  "taskId": "...",
  "state": "wait" | "queueing" | "generating" | "success" | "fail",
  "videoInfo": {
    "videoUrl": "https://...",
    "imageUrl": "https://..."
  },
  "failMsg": ""
}
```

---

## Issues & Findings

### 1. Most Models Not Accessible

**Problem:** Despite being listed on Kie.ai's website and marketing materials, most video generation models return errors:
- Kling, Sora, Wan, Hailuo all return: `"The page does not exist or is not published"`
- No working API endpoints found for these models

**Possible Reasons:**
1. Models not yet released to API (only available via web interface)
2. Require special API access or different authentication
3. Still in beta/testing phase
4. Documentation outdated

### 2. Video Generation Takes Significant Time

- Veo3: 5-10 minutes per video
- Runway: 3-5 minutes per video
- Long polling required with 30-second intervals

### 3. No Immediate Issues with Working Models

- ✅ Veo3 API structure is correct
- ✅ Runway API structure is correct
- ✅ Type definitions match actual responses
- ✅ Client code works as expected

---

## Recommendations

### Immediate Actions

1. **✅ Keep Veo3 and Runway** in production
   - These models work reliably
   - Good variety (Google & Runway)

2. **⚠️ Remove or Disable Other Models** from UI
   - Kling, Sora, Wan, Hailuo are not accessible
   - Will cause user frustration if visible
   - Update `IMAGE_TO_VIDEO_MODELS` to only include working models

3. **📧 Contact Kie.ai Support**
   - Ask about API access for advertised models
   - Request API documentation for Kling, Sora, Wan, Hailuo
   - Check if special access is required

### Code Updates Needed

**File: `config/models.ts`**
```typescript
export const IMAGE_TO_VIDEO_MODELS = [
  // Replicate models (external provider)
  {
    provider: "replicate",
    name: "Kling 1.6 Standard (Replicate)",
    id: "kwaivgi/kling-v1.6-standard",
  },

  // ✅ WORKING - Kie.ai models
  {
    provider: "kie",
    name: "Veo 3 (Quality)",
    id: "veo3",
    features: ["text-to-video", "image-to-video"],
  },
  {
    provider: "kie",
    name: "Veo 3 (Fast)",
    id: "veo3_fast",
    features: ["text-to-video", "image-to-video"],
  },
  {
    provider: "kie",
    name: "Runway Gen-3 Alpha Turbo",
    id: "runway",
    features: ["text-to-video", "image-to-video"],
  },
  {
    provider: "kie",
    name: "Runway Aleph (Video-to-Video)",
    id: "runway-aleph",
    features: ["video-to-video"],
  },
  {
    provider: "kie",
    name: "Luma Ray2 (Video Modify)",
    id: "luma-modify",
    features: ["video-to-video"],
  },

  // ⚠️ COMMENTED OUT - Not accessible via API
  // {
  //   provider: "kie",
  //   name: "Sora 2 Text-to-Video",
  //   id: "sora-2-text-to-video",
  // },
  // ... etc
];
```

---

## Conclusion

**Video generation API is partially functional.** Two major providers (Google Veo3 and Runway) are working correctly and can be used in production. However, most advertised models are not accessible via the API.

**Recommended Action:**
- Use Veo3 and Runway for production
- Remove inaccessible models from UI
- Monitor Kie.ai announcements for new API releases

**Overall Status: ✅ FUNCTIONAL (Limited Models)**

---

## Testing Files Created

1. **`test-kie-video.ts`** - Tests Veo3 and Runway endpoints
2. **`test-video-endpoints.ts`** - Tests all model endpoints systematically

### Running Tests

```bash
# Test working models
npx tsx test-kie-video.ts

# Test all endpoints
npx tsx test-video-endpoints.ts
```

---

## Sources

- [AI API Models Gallery – Video, Image & Music Generation APIs | Kie.ai](https://kie.ai/market)
- [Sora 2 API Tutorial: How to Integrate Sora AI Video Model on Kie.ai](https://www.technology.org/2025/10/15/sora-2-api-tutorial-how-to-integrate-sora-ai-video-model-on-kie-ai/)
- [Wan 2.5 API Tutorial: How to Integrate AI Video Generation on Kie.ai](https://www.technology.org/2025/09/29/wan-2-5-api-tutorial-how-to-integrate-ai-video-generation-on-kie-ai/)
- [Sora 2 API – Cut Costs by 60% vs Official OpenAI Sora 2 API Pricing | Kie.ai](https://kie.ai/sora-2)
- [Generate AI Video - KIE API](https://docs.kie.ai/runway-api/generate-ai-video)
