/**
 * 上传所有 Gallery 视频到 R2
 *
 * 运行: pnpm tsx scripts/upload-gallery-videos-to-r2.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs/promises";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// 从 gallery-videos-final.json 读取视频列表
const VIDEOS = [
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
  {
    id: "3d-1",
    category: "3d",
    videoUrl: "https://tempfile.aiquickdraw.com/v/82c87d2b1549a2c31133e12b1a2e71a8_1769247832.mp4",
  },
  {
    id: "3d-2",
    category: "3d",
    videoUrl: "https://tempfile.aiquickdraw.com/v/1cf6ddbfd5373d02f57b712eeb80aa40_1769247931.mp4",
  },
  {
    id: "3d-3",
    category: "3d",
    videoUrl: "https://tempfile.aiquickdraw.com/v/ea8b82aa5dcd26f8d0cabe0b6c1229d3_1769248031.mp4",
  },
];

interface FinalVideo {
  id: string;
  category: string;
  originalUrl: string;
  cdnUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  duration: number;
}

const FINAL_VIDEOS: FinalVideo[] = [];

/**
 * 下载文件到 Buffer
 */
async function downloadToBuffer(url: string): Promise<Buffer> {
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
    return cdnUrl;
  } catch (error) {
    console.error(`      ❌ 上传失败:`, error);
    throw error;
  }
}

/**
 * 处理单个视频
 */
async function processVideo(video: typeof VIDEOS[0], index: number) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${index + 1}/${VIDEOS.length} 处理视频: ${video.id}`);
  console.log(`${"=".repeat(70)}`);

  try {
    // 1. 下载视频
    console.log(`   📥 下载视频...`);
    const buffer = await downloadToBuffer(video.videoUrl);
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`   ✅ 下载完成: ${sizeMB} MB`);

    // 2. 上传到 R2
    console.log(`   ☁️  上传到 R2...`);
    const r2Key = `website/gallery/${video.category}/${video.id}.mp4`;
    const cdnUrl = await uploadToR2(buffer, r2Key, "video/mp4");
    console.log(`   ✅ 上传成功!`);
    console.log(`      CDN: ${cdnUrl}`);

    // 3. 添加到最终列表
    FINAL_VIDEOS.push({
      id: video.id,
      category: video.category,
      originalUrl: video.videoUrl,
      cdnUrl,
      thumbnailUrl: "", // 后续生成
      title: video.id,
      description: `${video.category} style video`,
      duration: 10,
    });

    console.log(`   ✅ ${video.id} 处理完成!`);

  } catch (error) {
    console.error(`   ❌ ${video.id} 处理失败:`, error);
  }
}

async function main() {
  console.log("\n🚀 上传 Gallery 视频到 R2\n");
  console.log(`配置: ${VIDEOS.length} 个视频`);
  console.log(`预计时间: 5-10 分钟\n`);

  for (let i = 0; i < VIDEOS.length; i++) {
    await processVideo(VIDEOS[i], i);

    // 短暂等待避免 API 限流
    if (i < VIDEOS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 输出结果
  console.log(`\n${"=".repeat(70)}`);
  console.log(`✅ 完成! 成功上传 ${FINAL_VIDEOS.length} 个视频`);
  console.log(`${"=".repeat(70)}\n`);

  // 按分类输出
  const categories = ["realistic", "ugc", "3d"];
  for (const category of categories) {
    const videos = FINAL_VIDEOS.filter((v) => v.category === category);
    if (videos.length > 0) {
      console.log(`${category.toUpperCase()} (${videos.length}):`);
      videos.forEach((v) => {
        console.log(`  ${v.id}:`);
        console.log(`    ${v.cdnUrl}`);
      });
      console.log("");
    }
  }

  // 保存到文件
  const outputPath = resolve(process.cwd(), "gallery-videos-cdn.json");
  writeFileSync(outputPath, JSON.stringify(FINAL_VIDEOS, null, 2));
  console.log(`✅ CDN URL 列表已保存到: ${outputPath}\n`);
}

main();
