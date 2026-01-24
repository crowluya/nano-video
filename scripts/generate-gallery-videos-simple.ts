/**
 * Gallery 视频生成简化脚本 - 仅生成视频，收集URL
 *
 * 运行: pnpm tsx scripts/generate-gallery-videos-simple.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs/promises";

config({ path: resolve(process.cwd(), ".env.local") });

import { KieClient } from "../lib/kie/client";

const KIE_API_KEY = process.env.KIE_API_KEY!;

const kieClient = new KieClient({
  apiKey: KIE_API_KEY,
  timeout: 60000
});

// 简化的视频配置 - 先只生成 realistic-3 (纯文本，最简单)
const VIDEOS = [
  {
    id: "realistic-3",
    category: "realistic",
    prompt: "Time-lapse of modern city skyline at twilight, sleek skyscrapers with windows lighting up gradually from bottom to top, smooth traffic light trails below, dramatic sky color transition from deep blue to vibrant orange and pink, urban lifestyle, high-quality architectural cinematography",
    aspectRatio: "16:9" as const,
  },
  {
    id: "realistic-1",
    category: "realistic",
    prompt: "Professional AI-generated spokesperson presenting a sleek smartphone product, smooth hand movements showing phone features from multiple angles, studio lighting, clean white background, 4K cinematic quality, confident and friendly presentation style",
    aspectRatio: "16:9" as const,
  },
  {
    id: "realistic-2",
    category: "realistic",
    prompt: "Close-up shot of barista creating latte art, slow pour of steamed milk into coffee cup, forming beautiful heart pattern, steam rising elegantly, warm cozy café ambiance, golden hour sunlight streaming through window, shallow depth of field, cinematic food photography",
    aspectRatio: "16:9" as const,
  },
  {
    id: "ugc-1",
    category: "ugc",
    prompt: "First-person POV unboxing experience, hands carefully and excitedly opening premium minimalist headphones packaging, revealing product slowly, genuine excitement and curiosity, natural bright bedroom lighting, authentic UGC style, vertical video format, TikTok aesthetic",
    aspectRatio: "9:16" as const,
  },
  {
    id: "ugc-2",
    category: "ugc",
    prompt: "Energetic fitness workout in bright modern living room, person doing enthusiastic jumping jacks with genuine smile, motivational workout atmosphere, athletic wear, natural sunlight streaming through large windows, high energy authentic UGC fitness content, vertical video",
    aspectRatio: "9:16" as const,
  },
  {
    id: "ugc-3",
    category: "ugc",
    prompt: "Hands preparing colorful and healthy avocado toast in bright sunny kitchen, fresh ingredients, knife spreading mashed avocado, adding toppings with care, sunny morning vibe, ASMR-style food preparation, natural lighting, lifestyle content creator aesthetic, vertical video format",
    aspectRatio: "9:16" as const,
  },
];

interface GeneratedVideo {
  id: string;
  category: string;
  videoUrl: string;
  prompt: string;
  aspectRatio: string;
}

const GENERATED_VIDEOS: GeneratedVideo[] = [];

async function generateVideo(config: typeof VIDEOS[0], index: number) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${index + 1}/${VIDEOS.length} 生成视频: ${config.id}`);
  console.log(`${"=".repeat(80)}`);

  try {
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
      return;
    }

    const videoUrl = urls[0];
    console.log(`   ✅ 视频生成完成: ${videoUrl}`);

    GENERATED_VIDEOS.push({
      id: config.id,
      category: config.category,
      videoUrl,
      prompt: config.prompt,
      aspectRatio: config.aspectRatio,
    });

  } catch (error) {
    console.error(`   ❌ ${config.id} 失败:`, error);
  }
}

async function main() {
  console.log("\n🎬 Gallery 视频生成 (简化版)\n");
  console.log(`配置: ${VIDEOS.length} 个视频 (纯文本模式)`);
  console.log(`预计时间: 1-1.5 小时\n`);

  for (let i = 0; i < VIDEOS.length; i++) {
    await generateVideo(VIDEOS[i], i);

    // 等待5秒再生成下一个，避免API限流
    if (i < VIDEOS.length - 1) {
      console.log(`\n⏳ 等待5秒后继续...\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 输出结果
  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ 完成! 生成了 ${GENERATED_VIDEOS.length} 个视频`);
  console.log(`${"=".repeat(80)}\n`);

  // 按分类输出
  const categories = ["realistic", "ugc"];
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
  const outputPath = resolve(process.cwd(), "gallery-videos-simple.json");
  await fs.writeFile(outputPath, JSON.stringify(GENERATED_VIDEOS, null, 2));
  console.log(`✅ 结果已保存到: ${outputPath}`);
}

main();
