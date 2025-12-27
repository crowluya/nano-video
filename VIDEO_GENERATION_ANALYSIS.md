# Video Generation Feature Analysis

## Overview
This project supports **two main video generation models**: **Sora 2** (OpenAI) and **Veo 3.1** (Google), with multiple variants and capabilities.

---

## 📊 Supported Models

### 1. **Sora 2 Models** (OpenAI)

| Model ID | Name | Features | Credits | Aspect Ratios | Duration |
|----------|------|----------|---------|---------------|----------|
| `sora-2-text-to-video` | Sora 2 | Text-to-video | 100 | Portrait, Landscape | 10s, 15s |
| `sora-2-image-to-video` | Sora 2 Image | Image-to-video | 100 | Portrait, Landscape | 10s, 15s |
| `sora-2-pro-text-to-video` | Sora 2 Pro | Text-to-video (Pro) | 150 | Portrait, Landscape | 10s, 15s |
| `sora-2-pro-image-to-video` | Sora 2 Pro Image | Image-to-video (Pro) | 150 | Portrait, Landscape | 10s, 15s |

**Sora 2 Parameters:**
- `aspect_ratio`: "portrait" | "landscape"
- `n_frames`: "10" | "15" (duration in seconds)
- `remove_watermark`: boolean (removes watermarks from generated video)
- `image_urls`: array of image URLs for image-to-video

### 2. **Veo 3.1 Models** (Google)

| Model ID | Name | Features | Credits | Aspect Ratios | Generation Types |
|----------|------|----------|---------|---------------|------------------|
| `veo3` | Veo 3.1 Quality | Text/Image/Frame-to-video | 80 | 16:9, 9:16, Auto | TEXT_2_VIDEO, FIRST_AND_LAST_FRAMES_2_VIDEO |
| `veo3_fast` | Veo 3.1 Fast | Text/Image/Frame/Reference-to-video | 60 | 16:9, 9:16, Auto | TEXT_2_VIDEO, FIRST_AND_LAST_FRAMES_2_VIDEO, REFERENCE_2_VIDEO |

**Veo 3.1 Parameters:**
- `aspectRatio`: "16:9" | "9:16" | "Auto"
- `generationType`: 
  - `TEXT_2_VIDEO`: Pure text-to-video
  - `FIRST_AND_LAST_FRAMES_2_VIDEO`: Uses 1-2 images as keyframes
  - `REFERENCE_2_VIDEO`: Uses 2-3 reference images (veo3_fast only)
- `seeds`: number (10000-99999, optional for reproducibility)
- `enableTranslation`: boolean (auto-translate prompts)
- `imageUrls`: array of image URLs

---

## 🎯 Current Implementation

### **Two UI Implementations:**

#### 1. **Simple Video Generator** (`app/[locale]/(protected)/dashboard/video-gen/page.tsx`)
- Basic interface with single model selector
- Unified prompt input
- Optional image URL input
- Aspect ratio selector
- Real-time task progress tracking
- Generated videos gallery

**Pros:**
- Simple, straightforward UI
- Quick to use for basic generation
- Clear credit cost display

**Cons:**
- Limited parameter control
- No visual model comparison
- Single image input only (URL-based)
- No generation mode selector for Veo 3.1
- Mixed Sora 2 and Veo 3.1 parameters in one form

#### 2. **Advanced Video Generator** (`components/video-generation/VideoGenerationPage.tsx`)
- Sophisticated multi-panel layout
- Model-specific parameter panels
- Visual image upload with drag-and-drop
- Generation mode selector (for Veo 3.1)
- Storyboard prompt generator
- Real-time video preview
- Credit balance display

**Pros:**
- Model-specific UI adaptation
- Better visual feedback
- Multiple image upload support
- Intelligent mode detection
- Professional layout

**Cons:**
- More complex for beginners
- Requires more screen space
- Not currently linked in navigation

---

## 🔧 Technical Architecture

### **API Routes:**

1. **`/api/kie/video`** - Main video generation endpoint
   - Handles all video models (Sora 2, Veo 3.1, Runway, Wan)
   - Credit deduction and refund logic
   - Task-credit mapping for failure recovery
   - Activity logging

2. **`/api/ai-demo/video-generation`** - Demo/alternative endpoint
   - Similar functionality to main endpoint
   - Used by advanced video generator component

3. **`/api/kie/status`** - Task status polling
   - Unified status checking for all generation types
   - Returns task progress and result URLs

### **Client Library** (`lib/kie/client.ts`):

**Sora 2 Methods:**
- `generateSora2Video(params)` - Start generation
- `getSora2Status(taskId)` - Check status
- `waitForSora2Completion(taskId)` - Poll until complete

**Veo 3.1 Methods:**
- `generateVeo3Video(params)` - Start generation
- `getVeo3Status(taskId)` - Check status
- `extendVeo3Video(params)` - Extend existing video
- `getVeo31080pVideo(taskId)` - Get 1080p version
- `waitForVeo3Completion(taskId)` - Poll until complete

---

## 🎨 UI Components

### **Shared Components:**
- `ModelSelector` - Dropdown model picker with credit display
- `TaskProgress` - Real-time progress tracking with estimated time
- `ModelCard` - Visual model selection cards

### **Advanced Components:**
- `VideoModelSelector` - Grouped Sora 2 / Veo 3.1 model buttons
- `VideoGenerationModeSelector` - Veo 3.1 generation type picker
- `VideoParameterPanel` - Model-specific parameter controls
- `ImageUploadZone` - Drag-and-drop image upload
- `VideoPreviewPanel` - Video player with download/share
- `StoryboardPromptGenerator` - AI-powered prompt generation from images

---

## 🚨 Current Issues & Pain Points

### **1. Confusing Model Selection**
- Users don't understand the difference between Sora 2 and Veo 3.1
- No clear guidance on which model to use for what purpose
- Credit costs not prominently displayed during selection

### **2. Parameter Complexity**
- Different parameters for different models (aspect_ratio vs aspectRatio)
- Generation types (Veo 3.1) are not well explained
- Users don't know when to use image-to-video vs text-to-video

### **3. Image Upload UX**
- Simple generator only accepts URLs (not user-friendly)
- No clear indication of how many images are needed
- Reference mode (2-3 images) requirements not obvious

### **4. Inconsistent UI**
- Two different video generation pages with different capabilities
- Navigation doesn't clearly indicate which is which
- Advanced features hidden in components folder

### **5. Status Polling**
- Long wait times (2-10 minutes) with minimal feedback
- No intermediate progress updates
- Users don't know if generation is stuck or progressing

### **6. Result Management**
- No history of generated videos
- No way to regenerate with similar parameters
- No comparison between different model outputs

---

## 💡 Optimization Recommendations

### **Priority 1: Unified, Intuitive Interface**

**Consolidate into single video generation page with:**
- Clear model comparison cards showing:
  - Model name and provider
  - Key features and strengths
  - Credit cost
  - Estimated generation time
  - Example use cases
- Tabbed interface: "Sora 2" | "Veo 3.1" | "Compare"
- Smart parameter panel that adapts to selected model
- Unified image upload (drag-and-drop + URL)

### **Priority 2: Better Guidance & Education**

**Add contextual help:**
- Tooltips explaining each parameter
- Example prompts for each model
- Visual guide showing generation types (Veo 3.1)
- "Recommended for you" model suggestions based on input
- Credit cost calculator with breakdown

### **Priority 3: Enhanced Image-to-Video Flow**

**Improve image handling:**
- Visual preview of uploaded images
- Clear indication of image requirements per mode
- Automatic mode detection based on image count
- Image editing tools (crop, adjust)
- Template library for common scenarios

### **Priority 4: Better Progress Feedback**

**Enhanced status tracking:**
- Stage-based progress (Queued → Processing → Rendering → Complete)
- Estimated time remaining with confidence level
- Queue position indicator
- Ability to cancel generation and get refund
- Push notifications when complete

### **Priority 5: Result Management**

**Video library features:**
- History of all generated videos
- Favorite/bookmark videos
- Regenerate with variations
- Side-by-side comparison tool
- Export settings and parameters
- Share generated videos

### **Priority 6: Smart Defaults & Presets**

**Reduce decision fatigue:**
- "Quick Generate" mode with smart defaults
- Preset templates: "Social Media", "Cinematic", "Product Demo"
- Remember user preferences
- One-click "Generate Similar" button
- Batch generation queue

---

## 📐 Proposed UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 AI Video Generator                    Credits: 1,250    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Sora 2     │  │  Veo 3.1    │  │  Compare    │         │
│  │  (Active)   │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Model Selection                                        │  │
│  │                                                         │  │
│  │  ○ Sora 2 (100 credits)      ● Sora 2 Pro (150)      │  │
│  │  ○ Sora 2 Image (100)        ○ Sora 2 Pro Image (150)│  │
│  │                                                         │  │
│  │  💡 Best for: Cinematic videos, smooth motion         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📝 Prompt                                              │  │
│  │  A serene mountain landscape at sunset...             │  │
│  │                                                         │  │
│  │  [✨ Enhance Prompt]  [📋 Use Template]               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🖼️ Images (Optional)                                  │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐                           │  │
│  │  │ IMG │  │ IMG │  │ +   │                           │  │
│  │  └─────┘  └─────┘  └─────┘                           │  │
│  │  Mode: Image-to-Video (auto-detected)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚙️ Parameters                                          │  │
│  │  Aspect Ratio:  [Landscape ▼]                         │  │
│  │  Duration:      [10s ▼]                               │  │
│  │  □ Remove Watermark                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [🎬 Generate Video (100 credits)]                          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📹 Preview                                             │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │                                                   │  │  │
│  │  │         [Video Player / Progress]                │  │  │
│  │  │                                                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  [⬇️ Download]  [🔗 Share]  [🔄 Regenerate]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📚 Recent Generations                                  │  │
│  │  [Thumbnail] [Thumbnail] [Thumbnail] [View All →]     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Metrics

**User Experience:**
- Reduce time-to-first-generation from 5 min → 2 min
- Increase successful generations (no errors) from 70% → 90%
- Reduce support tickets about "how to use" by 50%

**Engagement:**
- Increase repeat usage rate by 40%
- Increase average generations per user from 2 → 5
- Increase credit purchases by 30%

**Technical:**
- Reduce API error rate from 15% → 5%
- Improve status polling efficiency (reduce API calls by 30%)
- Add proper error recovery and retry logic

---

## 📝 Implementation Phases

### **Phase 1: Quick Wins** (1-2 days)
- Add tooltips and help text to existing UI
- Improve error messages
- Add model comparison table
- Fix parameter naming inconsistencies

### **Phase 2: UI Consolidation** (3-5 days)
- Merge two video generation pages
- Implement tabbed model selection
- Add smart parameter panel
- Improve image upload UX

### **Phase 3: Enhanced Features** (1 week)
- Add video history/library
- Implement preset templates
- Add progress stage indicators
- Build comparison tool

### **Phase 4: Polish & Optimization** (3-5 days)
- Performance optimization
- Mobile responsiveness
- Accessibility improvements
- Analytics integration

---

## 🔗 Related Files

**Configuration:**
- `config/models.ts` - Model definitions and metadata
- `lib/kie/types.ts` - TypeScript type definitions
- `lib/kie/client.ts` - API client implementation

**API Routes:**
- `app/api/kie/video/route.ts` - Main video generation endpoint
- `app/api/kie/status/route.ts` - Status polling endpoint
- `app/api/ai-demo/video-generation/route.ts` - Alternative endpoint

**UI Components:**
- `app/[locale]/(protected)/dashboard/video-gen/page.tsx` - Simple generator
- `components/video-generation/VideoGenerationPage.tsx` - Advanced generator
- `components/kie/ModelSelector.tsx` - Model selection component
- `components/kie/TaskProgress.tsx` - Progress tracking component

**Actions:**
- `actions/usage/activity-logs.ts` - Activity logging
- `lib/kie/credits.ts` - Credit management

---

## 🎓 User Education Needs

**Documentation to create:**
1. "Sora 2 vs Veo 3.1: Which to Choose?"
2. "Understanding Generation Types (Veo 3.1)"
3. "Writing Effective Video Prompts"
4. "Image-to-Video Best Practices"
5. "Troubleshooting Common Issues"

**In-app guidance:**
- Interactive tutorial on first use
- Contextual tips based on user actions
- Example gallery with prompts and settings
- FAQ section in sidebar

---

## 🚀 Next Steps

1. **Review this analysis** with the team
2. **Prioritize recommendations** based on user feedback and business goals
3. **Create detailed design mockups** for approved changes
4. **Implement Phase 1** quick wins
5. **User testing** of new interface
6. **Iterate** based on feedback
7. **Roll out** remaining phases

---

*Last Updated: December 27, 2025*
