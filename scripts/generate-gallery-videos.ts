/**
 * Gallery 视频批量生成脚本
 *
 * 功能:
 * 1. 生成首尾帧图片 (Nano Banana Pro)
 * 2. 使用首尾帧生成视频 (Veo 3.1 Fast) 或纯文本生成 (Sora 2)
 * 3. 下载视频
 * 4. 上传到 R2
 * 5. 生成缩略图
 * 6. 输出 CDN URL 列表
 *
 * 运行: pnpm tsx scripts/generate-gallery-videos.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs/promises";

config({ path: resolve(process.cwd(), ".env.local") });

import { KieClient } from "../lib/kie/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ============================================================================
// 配置
// ============================================================================

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const KIE_API_KEY = process.env.KIE_API_KEY!;

// ============================================================================
// 视频配置
// ============================================================================

interface VideoConfig {
  id: string;
  category: "realistic" | "ugc" | "3d";
  model: "sora-2" | "veo3_fast";
  mode: "text-to-video" | "image-to-video" | "first-last-frames";
  prompt: string;
  aspectRatio: "16:9" | "9:16";
  firstFramePrompt?: string; // 用于首尾帧模式
  lastFramePrompt?: string;  // 用于首尾帧模式
  referencePrompt?: string;  // 用于图转视频模式
}

const VIDEO_CONFIGS: VideoConfig[] = [
  // ==================== Realistic 风格 (Veo 3.1 Fast - 先测试纯文本) ====================
  {
    id: "realistic-1",
    category: "realistic",
    model: "veo3_fast",
    mode: "text-to-video", // 暂时改为纯文本测试
    prompt: "Professional AI-generated spokesperson presenting a sleek smartphone product, smooth hand movements showing phone features from multiple angles, studio lighting, clean white background, 4K cinematic quality, confident and friendly presentation style",
    aspectRatio: "16:9",
    // firstFramePrompt: "Professional AI spokesperson standing confidently holding smartphone product, studio lighting, clean white background, beginning presentation gesture, 4K product photography style",
    // lastFramePrompt: "Professional AI spokesperson smiling and showcasing smartphone screen close-up, product features visible, studio lighting, clean white background, 4K cinematic product shot"
  },
  {
    id: "realistic-2",
    category: "realistic",
    model: "veo3_fast",
    mode: "first-last-frames",
    prompt: "Close-up shot of barista creating latte art, slow pour of steamed milk into coffee cup, forming beautiful heart pattern, steam rising elegantly, warm cozy café ambiance, golden hour sunlight streaming through window, shallow depth of field, cinematic food photography",
    aspectRatio: "16:9",
    firstFramePrompt: "Barista holding pitcher filled with steamed milk above coffee cup, ready to pour, warm café lighting, golden hour sunlight through window, professional food photography",
    lastFramePrompt: "Completed latte art with beautiful heart pattern in coffee cup, steam rising elegantly, warm cozy café atmosphere, golden hour sunlight, shallow depth of field, perfect food photography"
  },
  {
    id: "realistic-3",
    category: "realistic",
    model: "veo3_fast",
    mode: "text-to-video",
    prompt: "Time-lapse of modern city skyline at twilight, sleek skyscrapers with windows lighting up gradually from bottom to top, smooth traffic light trails below, dramatic sky color transition from deep blue to vibrant orange and pink, urban lifestyle, high-quality architectural cinematography",
    aspectRatio: "16:9"
  },

  // ==================== UGC 风格 (Veo 3.1 Fast + 首尾帧) ====================
  {
    id: "ugc-1",
    category: "ugc",
    model: "veo3_fast",
    mode: "first-last-frames",
    prompt: "First-person POV unboxing experience, hands carefully and excitedly opening premium minimalist headphones packaging, revealing product slowly, genuine excitement and curiosity, natural bright bedroom lighting, authentic UGC style, vertical video format, TikTok aesthetic",
    aspectRatio: "9:16",
    firstFramePrompt: "First-person POV of premium minimalist headphones box on clean white desk, hands reaching toward box, excited anticipation, natural bedroom lighting, authentic UGC unboxing style, vertical composition",
    lastFramePrompt: "Premium headphones held up in hands after unboxing, product detail visible, genuine excitement expression, natural bedroom lighting, authentic UGC style reveal moment, vertical composition"
  },
  {
    id: "ugc-2",
    category: "ugc",
    model: "veo3_fast",
    mode: "first-last-frames",
    prompt: "Energetic fitness workout in bright modern living room, person doing enthusiastic jumping jacks with genuine smile, motivational workout atmosphere, athletic wear, natural sunlight streaming through large windows, high energy authentic UGC fitness content, vertical video",
    aspectRatio: "9:16",
    firstFramePrompt: "Fitness person in athletic wear standing ready in bright modern living room, natural sunlight, motivational workout atmosphere, beginning jumping jack position, vertical composition, authentic UGC fitness style",
    lastFramePrompt: "Fitness person completing jumping jack with arms raised overhead, big genuine smile, energetic posture, bright modern living room with natural sunlight, motivational workout atmosphere, vertical composition, authentic UGC fitness content"
  },
  {
    id: "ugc-3",
    category: "ugc",
    model: "veo3_fast",
    mode: "first-last-frames",
    prompt: "Hands preparing colorful and healthy avocado toast in bright sunny kitchen, fresh ingredients, knife spreading mashed avocado, adding toppings with care, sunny morning vibe, ASMR-style food preparation, natural lighting, lifestyle content creator aesthetic, vertical video format",
    aspectRatio: "9:16",
    firstFramePrompt: "Fresh ingredients arranged on bright kitchen counter - ripe avocado, sourdough bread, cherry tomatoes, eggs, sunny morning natural lighting, lifestyle food blogger aesthetic, ready to cook, vertical composition",
    lastFramePrompt: "Completed beautiful avocado toast on wooden board, perfectly arranged toppings, garnished, bright sunny kitchen, morning lifestyle food photography, Instagram-worthy presentation, vertical composition"
  },

  // ==================== 3D Animation 风格 (Sora 2) ====================
  {
    id: "3d-1",
    category: "3d",
    model: "sora-2",
    mode: "image-to-video",
    prompt: "3D animated product showcase, sleek wireless headphones rotating smoothly 360 degrees on pristine white circular pedestal, professional studio lighting with soft shadows, floating subtle particles effect, premium branding quality, Pixar-style 3D render quality, clean product advertisement",
    aspectRatio: "16:9",
    referencePrompt: "Sleek wireless headphones product shot on pure white background, studio lighting, professional product photography, 3D render style, premium branding"
  },
  {
    id: "3d-2",
    category: "3d",
    model: "sora-2",
    mode: "text-to-video",
    prompt: "Cute 3D animated character walking confidently and happily towards camera, vibrant colorful fantasy background with floating elements, Disney-Pixar animation style, smooth natural movement, cheerful friendly expression, high-quality 3D render, family-friendly entertainment content",
    aspectRatio: "16:9"
  },
  {
    id: "3d-3",
    category: "3d",
    model: "sora-2",
    mode: "image-to-video",
    prompt: "3D brand logo animation, geometric shapes assembling elegantly into modern logo, metallic and glass texture materials, dynamic cinematic lighting, professional intro animation style, clean white background, high-end corporate identity motion graphics",
    aspectRatio: "16:9",
    referencePrompt: "Modern minimalist geometric logo on pure white background, professional corporate branding, clean design, metallic texture, high-end identity"
  }
];

// ============================================================================
// 工具函数
// ============================================================================

const kieClient = new KieClient({
  apiKey: KIE_API_KEY,
  timeout: 60000 // 60秒超时
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * 生成图片 (使用 Nano Banana Pro)
 */
async function generateImage(prompt: string): Promise<string> {
  console.log(`   📸 生成图片: ${prompt.slice(0, 60)}...`);

  const taskId = await kieClient.generateNanoBananaImage({
    model: 'nano-banana-pro',
    input: {
      prompt,
      aspect_ratio: '16:9', // 默认16:9
    }
  });

  const imageUrl = await kieClient.waitForNanoBananaCompletion(taskId, {
    intervalMs: 10000,
    maxAttempts: 30,
  });

  console.log(`   ✅ 图片生成完成: ${imageUrl}`);
  return imageUrl;
}

/**
 * 下载文件到 Buffer
 */
async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 上传到 R2
 */
async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const cdnUrl = `${R2_PUBLIC_URL}/${key}`;
  console.log(`   ☁️  上传到 R2: ${cdnUrl}`);
  return cdnUrl;
}

/**
 * 生成视频 (Veo 3.1 Fast 首尾帧模式)
 */
async function generateVideoWithFirstLastFrames(
  config: VideoConfig,
  firstFrameUrl: string,
  lastFrameUrl: string
): Promise<string> {
  console.log(`\n🎬 生成视频 ${config.id} (Veo 3.1 Fast + 首尾帧)`);
  console.log(`   📝 Prompt: ${config.prompt.slice(0, 80)}...`);

  const taskId = await kieClient.generateVeo3Video({
    prompt: config.prompt,
    generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO",
    imageUrls: [firstFrameUrl, lastFrameUrl],
    aspectRatio: config.aspectRatio,
  });

  console.log(`   ✅ TaskId: ${taskId}`);
  console.log(`   ⏳ 等待视频生成 (可能需要3-8分钟)...`);

  const urls = await kieClient.waitForVeo3Completion(taskId, {
    intervalMs: 15000,
    maxAttempts: 40,
    onProgress: (attempt) => {
      console.log(`      检查进度... (${attempt * 15}s)`);
    },
  });

  if (urls.length === 0) {
    throw new Error("未返回视频URL");
  }

  console.log(`   ✅ 视频生成完成: ${urls[0]}`);
  return urls[0];
}

/**
 * 生成视频 (Veo 3.1 Fast 纯文本模式)
 */
async function generateVideoTextToVideo(config: VideoConfig): Promise<string> {
  console.log(`\n🎬 生成视频 ${config.id} (Veo 3.1 Fast Text-to-Video)`);
  console.log(`   📝 Prompt: ${config.prompt.slice(0, 80)}...`);

  const taskId = await kieClient.generateVeo3Video({
    prompt: config.prompt,
    generationType: "TEXT_2_VIDEO",
    aspectRatio: config.aspectRatio,
  });

  console.log(`   ✅ TaskId: ${taskId}`);
  console.log(`   ⏳ 等待视频生成 (可能需要3-8分钟)...`);

  const urls = await kieClient.waitForVeo3Completion(taskId, {
    intervalMs: 15000,
    maxAttempts: 40,
    onProgress: (attempt) => {
      console.log(`      检查进度... (${attempt * 15}s)`);
    },
  });

  if (urls.length === 0) {
    throw new Error("未返回视频URL");
  }

  console.log(`   ✅ 视频生成完成: ${urls[0]}`);
  return urls[0];
}

/**
 * 生成视频 (Sora 2 图转视频模式)
 */
async function generateVideoImageToVideo(
  config: VideoConfig,
  referenceImageUrl: string
): Promise<string> {
  console.log(`\n🎬 生成视频 ${config.id} (Sora 2 Image-to-Video)`);
  console.log(`   📝 Prompt: ${config.prompt.slice(0, 80)}...`);
  console.log(`   🖼️  参考图: ${referenceImageUrl}`);

  const taskId = await kieClient.generateSora2Video({
    prompt: config.prompt,
    imageUrls: [referenceImageUrl],
    aspectRatio: config.aspectRatio === "16:9" ? "landscape" : "portrait",
    nFrames: "10", // 10秒
    removeWatermark: true,
  });

  console.log(`   ✅ TaskId: ${taskId}`);
  console.log(`   ⏳ 等待视频生成 (可能需要5-10分钟)...`);

  const urls = await kieClient.waitForSora2Completion(taskId, {
    intervalMs: 15000,
    maxAttempts: 50,
    onProgress: (attempt) => {
      console.log(`      检查进度... (${attempt * 15}s)`);
    },
  });

  if (urls.length === 0) {
    throw new Error("未返回视频URL");
  }

  console.log(`   ✅ 视频生成完成: ${urls[0]}`);
  return urls[0];
}

/**
 * 提取视频缩略图 (简化版 - 使用首帧)
 */
async function extractThumbnail(
  videoUrl: string,
  videoId: string
): Promise<string> {
  console.log(`   🖼️  提取缩略图...`);

  // 暂时使用首帧图片URL作为缩略图
  // 后续可以用 ffmpeg 提取真实视频首帧
  const thumbnailUrl = videoUrl.replace(".mp4", "-thumb.webp");

  console.log(`   ✅ 缩略图: ${thumbnailUrl}`);
  return thumbnailUrl;
}

// ============================================================================
// 主流程
// ============================================================================

interface GeneratedVideo {
  id: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  duration: number;
}

const GENERATED_VIDEOS: GeneratedVideo[] = [];

async function processVideoConfig(config: VideoConfig, index: number) {
  const total = VIDEO_CONFIGS.length;
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${index}/${total} 处理视频: ${config.id}`);
  console.log(`${"=".repeat(80)}`);

  let videoUrl: string;
  let thumbnailUrl: string;

  try {
    // 根据模式生成视频
    if (config.mode === "first-last-frames") {
      // 1. 生成首帧
      console.log(`\n📸 步骤 1/4: 生成首帧`);
      const firstFrameUrl = await generateImage(config.firstFramePrompt!);

      // 2. 生成尾帧
      console.log(`\n📸 步骤 2/4: 生成尾帧`);
      const lastFrameUrl = await generateImage(config.lastFramePrompt!);

      // 3. 生成视频
      console.log(`\n🎬 步骤 3/4: 生成视频`);
      videoUrl = await generateVideoWithFirstLastFrames(config, firstFrameUrl, lastFrameUrl);

      // 4. 提取缩略图 (使用首帧)
      thumbnailUrl = firstFrameUrl;

    } else if (config.mode === "image-to-video") {
      // 1. 生成参考图
      console.log(`\n📸 步骤 1/3: 生成参考图`);
      const referenceImageUrl = await generateImage(config.referencePrompt!);

      // 2. 生成视频
      console.log(`\n🎬 步骤 2/3: 生成视频`);
      videoUrl = await generateVideoImageToVideo(config, referenceImageUrl);

      // 3. 提取缩略图
      thumbnailUrl = referenceImageUrl;

    } else {
      // text-to-video
      console.log(`\n🎬 步骤 1/2: 生成视频`);
      videoUrl = await generateVideoTextToVideo(config);

      // 2. 提取缩略图 (暂时使用占位图)
      thumbnailUrl = `${R2_PUBLIC_URL}/website/gallery/thumbnails/${config.id}.webp`;
    }

    // 5. 下载并上传到 R2
    console.log(`\n☁️  步骤: 上传到 R2`);

    // 下载视频
    console.log(`   📥 下载视频...`);
    const videoBuffer = await downloadToBuffer(videoUrl);
    const videoKey = `website/gallery/${config.category}/${config.id}.mp4`;
    const finalVideoUrl = await uploadToR2(videoBuffer, videoKey, "video/mp4");

    // 上传缩略图
    if (config.mode === "text-to-video" && !thumbnailUrl.startsWith("http")) {
      // 生成占位缩略图
      console.log(`   📥 生成占位缩略图...`);
      const thumbnailKey = `website/gallery/thumbnails/${config.id}.webp`;
      // TODO: 使用 ffmpeg 或 sharp 生成真实缩略图
      // 暂时跳过
    }

    // 6. 保存结果
    const result: GeneratedVideo = {
      id: config.id,
      category: config.category,
      videoUrl: finalVideoUrl,
      thumbnailUrl: thumbnailUrl,
      title: config.id, // 后续可以手动添加标题
      description: config.prompt.slice(0, 100),
      duration: 10, // 默认10秒
    };

    GENERATED_VIDEOS.push(result);

    console.log(`\n✅ ${config.id} 完成!`);
    console.log(`   视频: ${finalVideoUrl}`);
    console.log(`   缩略图: ${thumbnailUrl}`);

  } catch (error) {
    console.error(`\n❌ ${config.id} 失败:`, error);
    throw error;
  }
}

async function main() {
  console.log("\n🎬 Gallery 视频批量生成脚本\n");
  console.log(`配置: ${VIDEO_CONFIGS.length} 个视频`);
  console.log(`预计时间: 2-3 小时\n`);

  try {
    for (let i = 0; i < VIDEO_CONFIGS.length; i++) {
      await processVideoConfig(VIDEO_CONFIGS[i], i + 1);
    }

    // 输出结果
    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ 全部完成!`);
    console.log(`${"=".repeat(80)}\n`);

    console.log(`生成的视频 (${GENERATED_VIDEOS.length} 个):\n`);

    // 按分类输出
    const categories = ["realistic", "ugc", "3d"];
    for (const category of categories) {
      const videos = GENERATED_VIDEOS.filter((v) => v.category === category);
      if (videos.length > 0) {
        console.log(`${category.toUpperCase()}:`);
        videos.forEach((v) => {
          console.log(`  ${v.id}: ${v.videoUrl}`);
        });
        console.log("");
      }
    }

    // 保存到文件
    const outputPath = resolve(process.cwd(), "gallery-videos-output.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(GENERATED_VIDEOS, null, 2)
    );
    console.log(`✅ 结果已保存到: ${outputPath}`);

  } catch (error) {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  }
}

// 运行
main();
