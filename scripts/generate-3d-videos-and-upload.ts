/**
 * 生成 3D Animation 风格视频并上传到 R2
 *
 * 运行: pnpm tsx scripts/generate-3d-videos-and-upload.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs/promises";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

import { KieClient } from "../lib/kie/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const KIE_API_KEY = process.env.KIE_API_KEY!;

const kieClient = new KieClient({
  apiKey: KIE_API_KEY,
  timeout: 60000
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// 3D Animation 风格视频配置
const THREE_D_VIDEOS = [
  {
    id: "3d-1",
    category: "3d",
    prompt: "3D animated product showcase, sleek wireless headphones rotating smoothly 360 degrees on pristine white circular pedestal, professional studio lighting with soft shadows, floating subtle particles effect, premium branding quality, Pixar-style 3D render quality, clean product advertisement",
    aspectRatio: "16:9" as const,
  },
  {
    id: "3d-2",
    category: "3d",
    prompt: "Cute 3D animated character walking confidently and happily towards camera, vibrant colorful fantasy background with floating elements, Disney-Pixar animation style, smooth natural movement, cheerful friendly expression, high-quality 3D render, family-friendly entertainment content",
    aspectRatio: "16:9" as const,
  },
  {
    id: "3d-3",
    category: "3d",
    prompt: "3D brand logo animation, geometric shapes assembling elegantly into modern logo, metallic and glass texture materials, dynamic cinematic lighting, professional intro animation style, clean white background, high-end corporate identity motion graphics",
    aspectRatio: "16:9" as const,
  },
];

// 已生成的视频 (从之前的脚本)
const EXISTING_VIDEOS = [
  {
    id: "realistic-1",
    category: "realistic",
    videoUrl: "https://tempfile.aiquickdraw.com/v/c8159dcbb96dd96f63609222f6dcadab_1769245988.mp4",
  },
  {
    id: "realistic-2",
    category: "realistic",
    videoUrl: "https://tempfile.aiquickdraw.com/v/2cbad6b36631e999192122c6e55ad31e_1769246080.mp4",
  },
  {
    id: "realistic-3",
    category: "realistic",
    videoUrl: "https://tempfile.aiquickdraw.com/v/8e3ac29bb4b417e8c6dcde8141dba227_1769245895.mp4",
  },
  {
    id: "ugc-1",
    category: "ugc",
    videoUrl: "https://tempfile.aiquickdraw.com/v/3e3bf0cb9ee7a1653b0ba6d1569b42fd_1769246180.mp4",
  },
  {
    id: "ugc-2",
    category: "ugc",
    videoUrl: "https://tempfile.aiquickdraw.com/v/d1e5a6a8971ae4810b186109d3ff4877_1769246275.mp4",
  },
  {
    id: "ugc-3",
    category: "ugc",
    videoUrl: "https://tempfile.aiquickdraw.com/v/1c564f525f03d1a86293bde7f95b8670_1769246367.mp4",
  },
];

interface FinalVideo {
  id: string;
  category: string;
  videoUrl: string;
  cdnUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  duration: number;
  aspectRatio: string;
}

const FINAL_VIDEOS: FinalVideo[] = [];

/**
 * 下载文件到 Buffer
 */
async function downloadToBuffer(url: string): Promise<Buffer> {
  console.log(`      📥 下载中...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: ${response.statusText}`);
  }
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
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const cdnUrl = `${R2_PUBLIC_URL}/${key}`;
    console.log(`      ✅ 上传成功: ${cdnUrl}`);
    return cdnUrl;
  } catch (error) {
    console.error(`      ❌ 上传失败:`, error);
    throw error;
  }
}

/**
 * 生成 3D 视频
 */
async function generate3DVideo(config: typeof THREE_D_VIDEOS[0], index: number) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${index + 1}/${THREE_D_VIDEOS.length} 生成 3D 视频: ${config.id}`);
  console.log(`${"=".repeat(80)}`);

  console.log(`   📝 Prompt: ${config.prompt.slice(0, 80)}...`);

  const taskId = await kieClient.generateVeo3Video({
    prompt: config.prompt,
    generationType: "TEXT_2_VIDEO",
    aspectRatio: config.aspectRatio,
  });

  console.log(`   ✅ TaskId: ${taskId}`);
  console.log(`   ⏳ 等待视频生成...`);

  const urls = await kieClient.waitForVeo3Completion(taskId, {
    intervalMs: 15000,
    maxAttempts: 40,
    onProgress: (attempt) => {
      console.log(`      检查进度... (${attempt * 15}s)`);
    },
  });

  if (urls.length === 0) {
    console.log(`   ❌ 未返回视频URL`);
    return null;
  }

  const videoUrl = urls[0];
  console.log(`   ✅ 视频生成完成: ${videoUrl}`);

  return { id: config.id, category: config.category, videoUrl, aspectRatio: config.aspectRatio };
}

/**
 * 处理视频：下载并上传到 R2
 */
async function processVideo(
  video: { id: string; category: string; videoUrl: string; aspectRatio?: string },
  index: number,
  total: number
) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${index + 1}/${total} 处理视频: ${video.id}`);
  console.log(`${"=".repeat(80)}`);

  try {
    // 1. 下载视频
    console.log(`   📥 下载视频...`);
    const buffer = await downloadToBuffer(video.videoUrl);
    console.log(`   ✅ 下载完成: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // 2. 上传到 R2
    console.log(`   ☁️  上传到 R2...`);
    const r2Key = `website/gallery/${video.category}/${video.id}.mp4`;
    const cdnUrl = await uploadToR2(buffer, r2Key, "video/mp4");

    // 3. 生成缩略图 URL (暂时使用占位符)
    const thumbnailUrl = `${R2_PUBLIC_URL}/website/gallery/thumbnails/${video.id}.webp`;

    // 4. 添加到最终列表
    const finalVideo: FinalVideo = {
      id: video.id,
      category: video.category,
      videoUrl: video.videoUrl,
      cdnUrl,
      thumbnailUrl,
      title: video.id, // 后续可以手动添加标题
      description: `${video.category} style video`,
      duration: 10,
      aspectRatio: video.aspectRatio || "16:9",
    };

    FINAL_VIDEOS.push(finalVideo);
    console.log(`   ✅ ${video.id} 处理完成!`);

  } catch (error) {
    console.error(`   ❌ ${video.id} 处理失败:`, error);
  }
}

async function main() {
  console.log("\n🎬 生成 3D Animation 视频并上传到 R2\n");
  console.log(`步骤:`);
  console.log(`  1. 生成 3 个 3D Animation 视频`);
  console.log(`  2. 下载所有 9 个视频`);
  console.log(`  3. 上传到 R2`);
  console.log(`  4. 生成最终 URL 列表\n`);

  const generated3DVideos: Array<{ id: string; category: string; videoUrl: string; aspectRatio: string }> = [];

  // 步骤 1: 生成 3D 视频
  console.log(`\n${"=".repeat(80)}`);
  console.log(`步骤 1/4: 生成 3D Animation 视频`);
  console.log(`${"=".repeat(80)}`);

  for (let i = 0; i < THREE_D_VIDEOS.length; i++) {
    const result = await generate3DVideo(THREE_D_VIDEOS[i], i);
    if (result) {
      generated3DVideos.push(result);
    }

    // 等待5秒再生成下一个
    if (i < THREE_D_VIDEOS.length - 1) {
      console.log(`\n⏳ 等待5秒后继续...\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 合并所有视频
  const allVideos = [...EXISTING_VIDEOS, ...generated3DVideos];

  // 步骤 2-4: 下载并上传到 R2
  console.log(`\n${"=".repeat(80)}`);
  console.log(`步骤 2-4: 下载并上传所有 ${allVideos.length} 个视频到 R2`);
  console.log(`${"=".repeat(80)}`);

  for (let i = 0; i < allVideos.length; i++) {
    await processVideo(allVideos[i], i, allVideos.length);

    // 短暂等待避免 R2 API 限流
    if (i < allVideos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 输出结果
  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ 全部完成! 处理了 ${FINAL_VIDEOS.length} 个视频`);
  console.log(`${"=".repeat(80)}\n`);

  // 按分类输出
  const categories = ["realistic", "ugc", "3d"];
  for (const category of categories) {
    const videos = FINAL_VIDEOS.filter((v) => v.category === category);
    if (videos.length > 0) {
      console.log(`${category.toUpperCase()} (${videos.length}):`);
      videos.forEach((v) => {
        console.log(`  ${v.id}:`);
        console.log(`    CDN: ${v.cdnUrl}`);
        console.log(`    缩略图: ${v.thumbnailUrl}`);
      });
      console.log("");
    }
  }

  // 保存到文件
  const outputPath = resolve(process.cwd(), "gallery-videos-final.json");
  writeFileSync(outputPath, JSON.stringify(FINAL_VIDEOS, null, 2));
  console.log(`✅ 最终结果已保存到: ${outputPath}`);
}

main();
