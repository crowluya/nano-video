/**
 * 重新生成模板3: Sunset Surfing 视频
 *
 * 运行: pnpm tsx scripts/regenerate-surfing-video.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { KieClient } from "../lib/kie/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  console.log("🏄 重新生成 Sunset Surfing 视频\n");

  const client = new KieClient({
    apiKey: process.env.KIE_API_KEY!,
    timeout: 60000, // 增加超时时间到60秒
  });

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const prompt = "Cinematic shot of a surfer riding a perfect wave at golden sunset, ocean spray catching the light, dramatic orange and purple sky, beach atmosphere, natural ocean wave sounds, immersive audio, 4K cinematic quality";

  console.log(`📝 Prompt: ${prompt.slice(0, 60)}...`);

  try {
    // 生成视频
    const taskId = await client.generateVeo3Video({
      prompt,
      aspectRatio: "16:9",
      duration: 8,
    });

    console.log(`✅ TaskId: ${taskId}`);
    console.log(`⏳ 等待视频生成 (可能需要2-5分钟)...\n`);

    // 等待完成
    const urls = await client.waitForVeo3Completion(taskId, {
      intervalMs: 15000, // 每15秒检查一次
      maxAttempts: 40,   // 最多等待10分钟
      onProgress: (attempt) => {
        console.log(`   检查进度... (${attempt * 15}s)`);
      },
    });

    if (urls.length === 0) {
      console.log("❌ 未返回视频URL");
      return;
    }

    console.log(`\n✅ 视频生成完成: ${urls[0]}`);

    // 下载并上传到 R2
    console.log(`\n☁️  上传到 R2...`);
    const response = await fetch(urls[0]);
    const buffer = Buffer.from(await response.arrayBuffer());

    const r2Key = "website/showcase/audio-showcase/case-1/output.mp4";
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: "video/mp4",
      })
    );

    const r2Url = `${process.env.R2_PUBLIC_URL}/${r2Key}`;
    console.log(`✅ 上传完成: ${r2Url}`);

  } catch (error) {
    console.error("❌ 失败:", error);
  }
}

main();
