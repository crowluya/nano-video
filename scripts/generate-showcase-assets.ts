/**
 * 生成展示视频素材脚本
 *
 * 运行: pnpm tsx scripts/generate-showcase-assets.ts
 *
 * 生成三种展示模板的素材:
 * 1. Reference Images → Video (日式咖啡店)
 * 2. Start > End 首尾帧 (陶艺创作)
 * 3. Context-Aware Audio (海边冲浪)
 */

import { config } from "dotenv";
import { resolve } from "path";

// 加载环境变量
config({ path: resolve(process.cwd(), ".env.local") });

import { KieClient } from "../lib/kie/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// =============================================================================
// 配置
// =============================================================================

const R2_BASE_PATH = "website/showcase";

interface ShowcaseCase {
  id: string;
  name: string;
  type: "reference-to-video" | "start-end-frames" | "audio-showcase";
  images: {
    id: string;
    prompt: string;
    aspectRatio?: string;
  }[];
  video: {
    prompt: string;
    useImages?: boolean; // 是否使用生成的图片作为参考
    model: "veo3" | "sora2";
  };
}

const SHOWCASE_CASES: ShowcaseCase[] = [
  // 模板1: 日式咖啡店
  {
    id: "case-1",
    name: "Japanese Coffee Shop",
    type: "reference-to-video",
    images: [
      {
        id: "ref-1",
        prompt: "Portrait of an Asian male barista wearing brown apron, warm smile, soft lighting, coffee shop background blur, professional headshot style",
        aspectRatio: "1:1",
      },
      {
        id: "ref-2",
        prompt: "Pour-over coffee dripper on wooden table, glass carafe, minimalist style, warm morning light, product photography",
        aspectRatio: "1:1",
      },
      {
        id: "ref-3",
        prompt: "Latte art in ceramic cup, heart shape foam design, wooden saucer, top view, cafe aesthetic, warm tones",
        aspectRatio: "1:1",
      },
      {
        id: "ref-4",
        prompt: "Japanese minimalist cafe interior, morning sunlight through large window, wooden furniture, plants, cozy atmosphere, wide shot",
        aspectRatio: "16:9",
      },
    ],
    video: {
      prompt: "Cinematic shot of a barista making pour-over coffee in a minimalist Japanese cafe, morning sunlight streaming through window, steam rising from the dripper, warm cozy atmosphere, slow and deliberate movements, 4K quality",
      useImages: true,
      model: "veo3",
    },
  },
  // 模板2: 陶艺创作
  {
    id: "case-1",
    name: "Pottery Making",
    type: "start-end-frames",
    images: [
      {
        id: "first-frame",
        prompt: "Potter's hands resting beside a lump of clay on pottery wheel, about to begin, soft studio lighting, artistic composition, ready to create, anticipation moment",
        aspectRatio: "16:9",
      },
    ],
    video: {
      prompt: "Cinematic shot of a potter shaping clay on a spinning wheel, hands forming a beautiful vase, soft studio lighting, water splashing gently, artistic craftsmanship, smooth continuous motion, 4K quality",
      useImages: true,
      model: "sora2",
    },
  },
  // 模板3: 海边冲浪
  {
    id: "case-1",
    name: "Sunset Surfing",
    type: "audio-showcase",
    images: [],
    video: {
      prompt: "Cinematic shot of a surfer riding a perfect wave at golden sunset, ocean spray catching the light, dramatic orange and purple sky, beach atmosphere, natural ocean wave sounds, immersive audio, 4K cinematic quality",
      useImages: false,
      model: "veo3",
    },
  },
];

// =============================================================================
// 工具函数
// =============================================================================

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function uploadToR2(
  s3Client: S3Client,
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// 主逻辑
// =============================================================================

async function generateImages(
  client: KieClient,
  images: ShowcaseCase["images"]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const img of images) {
    console.log(`  📸 生成图片: ${img.id}`);
    console.log(`     Prompt: ${img.prompt.slice(0, 50)}...`);

    try {
      const taskId = await client.generateNanoBananaImage({
        model: "google/nano-banana",
        input: {
          prompt: img.prompt,
          aspect_ratio: (img.aspectRatio as "1:1" | "16:9") || "1:1",
          output_format: "png",
        },
      });

      console.log(`     TaskId: ${taskId}`);

      // 等待完成
      const urls = await client.waitForNanoBananaCompletion(taskId, {
        intervalMs: 5000,
        maxAttempts: 60,
        onProgress: (attempt) => {
          if (attempt % 6 === 0) {
            console.log(`     等待中... (${attempt * 5}s)`);
          }
        },
      });

      if (urls.length > 0) {
        results.set(img.id, urls[0]);
        console.log(`     ✅ 完成: ${urls[0].slice(0, 50)}...`);
      } else {
        console.log(`     ❌ 未返回图片URL`);
      }
    } catch (error) {
      console.error(`     ❌ 失败:`, error);
    }

    // 避免请求过快
    await sleep(2000);
  }

  return results;
}

async function generateVideo(
  client: KieClient,
  videoConfig: ShowcaseCase["video"],
  imageUrls?: string[]
): Promise<string | null> {
  console.log(`  🎬 生成视频 (${videoConfig.model})`);
  console.log(`     Prompt: ${videoConfig.prompt.slice(0, 50)}...`);

  try {
    let taskId: string;

    if (videoConfig.model === "veo3") {
      taskId = await client.generateVeo3Video({
        prompt: videoConfig.prompt,
        aspectRatio: "16:9",
        duration: 8,
      });

      console.log(`     TaskId: ${taskId}`);

      const urls = await client.waitForVeo3Completion(taskId, {
        intervalMs: 10000,
        maxAttempts: 120,
        onProgress: (attempt) => {
          if (attempt % 6 === 0) {
            console.log(`     等待中... (${attempt * 10}s)`);
          }
        },
      });

      if (urls.length > 0) {
        console.log(`     ✅ 完成: ${urls[0].slice(0, 50)}...`);
        return urls[0];
      }
    } else if (videoConfig.model === "sora2") {
      // Sora 2 图生视频
      const model = imageUrls && imageUrls.length > 0
        ? "sora-2-image-to-video"
        : "sora-2-text-to-video";

      taskId = await client.generateSora2Video({
        model: model as any,
        input: {
          prompt: videoConfig.prompt,
          image_urls: imageUrls,
          aspect_ratio: "landscape",
          n_frames: "10",
          size: "Standard",
        },
      });

      console.log(`     TaskId: ${taskId}`);

      const urls = await client.waitForSora2Completion(taskId, {
        intervalMs: 10000,
        maxAttempts: 120,
        onProgress: (attempt) => {
          if (attempt % 6 === 0) {
            console.log(`     等待中... (${attempt * 10}s)`);
          }
        },
      });

      if (urls.length > 0) {
        console.log(`     ✅ 完成: ${urls[0].slice(0, 50)}...`);
        return urls[0];
      }
    }

    console.log(`     ❌ 未返回视频URL`);
    return null;
  } catch (error) {
    console.error(`     ❌ 失败:`, error);
    return null;
  }
}

async function processCase(
  client: KieClient,
  s3Client: S3Client,
  caseConfig: ShowcaseCase
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📦 处理: ${caseConfig.name} (${caseConfig.type})`);
  console.log(`${"=".repeat(60)}`);

  const r2Path = `${R2_BASE_PATH}/${caseConfig.type}/${caseConfig.id}`;
  const uploadedUrls: { id: string; url: string }[] = [];

  // Step 1: 生成图片
  if (caseConfig.images.length > 0) {
    console.log(`\n📸 Step 1: 生成图片 (${caseConfig.images.length}张)`);
    const imageResults = await generateImages(client, caseConfig.images);

    // 上传图片到 R2
    console.log(`\n☁️  上传图片到 R2...`);
    for (const [id, url] of imageResults) {
      try {
        const buffer = await downloadFile(url);
        const r2Key = `${r2Path}/${id}.webp`;
        const r2Url = await uploadToR2(s3Client, buffer, r2Key, "image/webp");
        uploadedUrls.push({ id, url: r2Url });
        console.log(`   ✅ ${id}: ${r2Url}`);
      } catch (error) {
        console.error(`   ❌ ${id} 上传失败:`, error);
      }
    }
  }

  // Step 2: 生成视频
  console.log(`\n🎬 Step 2: 生成视频`);
  const imageUrlsForVideo = caseConfig.video.useImages
    ? uploadedUrls.map((u) => u.url)
    : undefined;

  const videoUrl = await generateVideo(client, caseConfig.video, imageUrlsForVideo);

  if (videoUrl) {
    // 上传视频到 R2
    console.log(`\n☁️  上传视频到 R2...`);
    try {
      const buffer = await downloadFile(videoUrl);
      const r2Key = `${r2Path}/output.mp4`;
      const r2Url = await uploadToR2(s3Client, buffer, r2Key, "video/mp4");
      console.log(`   ✅ output.mp4: ${r2Url}`);
    } catch (error) {
      console.error(`   ❌ 视频上传失败:`, error);
    }
  }

  console.log(`\n✅ ${caseConfig.name} 处理完成`);
}

async function main() {
  console.log("🚀 开始生成展示素材\n");

  // 检查环境变量
  const requiredEnvVars = [
    "KIE_API_KEY",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(`❌ 缺少环境变量: ${varName}`);
      process.exit(1);
    }
  }

  const client = new KieClient(process.env.KIE_API_KEY!);
  const s3Client = createR2Client();

  // 检查 kie.ai 余额
  try {
    const credits = await client.getCredits();
    console.log(`💰 Kie.ai 余额: ${credits} credits\n`);
  } catch (error) {
    console.error("❌ 无法获取 kie.ai 余额:", error);
  }

  // 处理每个案例
  for (const caseConfig of SHOWCASE_CASES) {
    await processCase(client, s3Client, caseConfig);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 所有素材生成完成!");
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
