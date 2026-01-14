/**
 * Brand Assets Generation Script
 *
 * Uses kie.ai API to generate placeholder images for:
 * - Features section (6 images)
 * - UseCases section (5 images)
 *
 * Usage: pnpm tsx scripts/generate-brand-images.ts
 */

import { loadEnvConfig } from '@next/env';
import { KieClient } from '../lib/kie/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const client = new KieClient(process.env.KIE_API_KEY!);

// Output directory
const OUTPUT_DIR = join(process.cwd(), 'public', 'images', 'brand');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Image generation configurations
interface ImageConfig {
  filename: string;
  prompt: string;
  model: 'google/nano-banana' | 'nano-banana-pro';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

// Features images - showcase different capabilities
const featuresImages: ImageConfig[] = [
  {
    filename: 'feature-video-conversion.webp',
    prompt: 'A sleek modern dashboard interface showing AI video generation, with a clean UI displaying a video timeline, preview window, and generation controls. Professional SaaS platform design, purple and blue gradient accents, white background.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'feature-ai-models.webp',
    prompt: 'A comparison chart showing three AI video models side by side - Sora, Veo, and Nano Banana. Each with quality bars and speed indicators. Modern tech visualization, clean data visualization style, gradient colors.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'feature-free-trial.webp',
    prompt: 'A modern pricing card design showing "Free Trial" with highlighted benefits, no watermark badge, and credit counter. Clean UI design, purple accent colors, professional SaaS look.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'feature-commercial-use.webp',
    prompt: 'A collage of social media and commerce logos - TikTok, Instagram, Shopify, YouTube - arranged in a modern grid pattern with "Commercial Use" badge. Professional business style.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'feature-keyframes.webp',
    prompt: 'A storyboard-style layout showing 3 keyframe images with arrows between them, depicting cinematic scene progression. Film production aesthetic, clean illustration style.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'feature-fast-generation.webp',
    prompt: 'A progress bar animation showing fast video generation, with timer display showing "3 minutes". Modern loading UI, green success indicators, clean design.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  }
];

// UseCases images - showcase different use scenarios
const useCasesImages: ImageConfig[] = [
  {
    filename: 'usecase-ugc-ads.webp',
    prompt: 'A split-screen mockup showing a TikTok-style vertical video on left, Instagram post on right. Both displaying product advertisements. Social media marketing theme, vibrant colors.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'usecase-youtube.webp',
    prompt: 'A YouTube video thumbnail and channel layout showing faceless content style - educational video with text overlays and illustrations. Clean thumbnail design.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'usecase-ecommerce.webp',
    prompt: 'An e-commerce product page mockup showing a product video player on the left, product details on the right. Professional online store design, clean layout.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'usecase-cinematic.webp',
    prompt: 'A film strip style layout showing 5 frames from a cinematic video, with camera movement arrows and scene labels. Professional film production aesthetic.',
    model: 'google/nano-banana',
    aspectRatio: '16:9'
  },
  {
    filename: 'usecase-tiktok.webp',
    prompt: 'A TikTok mobile phone mockup displaying a vertical video with engagement icons (likes, comments, shares). Social media content creation theme.',
    model: 'google/nano-banana',
    aspectRatio: '9:16'
  }
];

// Helper function to download and save image
async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filepath, buffer);
  console.log(`  Saved: ${filepath}`);
}

// Helper function to wait
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a single image
async function generateImage(config: ImageConfig, index: number, total: number): Promise<string> {
  console.log(`\n[${index + 1}/${total}] Generating: ${config.filename}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  Aspect Ratio: ${config.aspectRatio}`);
  console.log(`  Prompt: ${config.prompt.slice(0, 100)}...`);

  try {
    // Create task
    const taskId = await client.generateNanoBananaImage({
      model: config.model,
      input: {
        prompt: config.prompt,
        aspect_ratio: config.aspectRatio,
        output_format: 'png',
      },
    });
    console.log(`  Task ID: ${taskId}`);

    // Poll for completion
    const urls = await client.waitForNanoBananaCompletion(taskId, {
      intervalMs: 5000,
      maxAttempts: 60,
      onProgress: (attempt) => {
        if (attempt % 10 === 0) {
          console.log(`  Checking... attempt ${attempt}/60`);
        }
      },
    });

    if (!urls || urls.length === 0) {
      throw new Error('No image URL returned');
    }

    const imageUrl = urls[0];
    console.log(`  Image URL: ${imageUrl}`);

    // Download and save
    const filepath = join(OUTPUT_DIR, config.filename);
    await downloadImage(imageUrl, filepath);

    return `/images/brand/${config.filename}`;
  } catch (error) {
    console.error(`  Error generating ${config.filename}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🎨 Brand Assets Generation Script');
  console.log('================================\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    console.error('❌ KIE_API_KEY environment variable is not set');
    process.exit(1);
  }

  const allImages: ImageConfig[] = [...featuresImages, ...useCasesImages];
  const generatedPaths: string[] = [];

  // Generate all images
  for (let i = 0; i < allImages.length; i++) {
    try {
      const path = await generateImage(allImages[i], i, allImages.length);
      generatedPaths.push(path);
      // Small delay between generations
      await wait(2000);
    } catch (error) {
      console.error(`\n❌ Failed to generate ${allImages[i].filename}`);
      console.error('Continuing with next image...\n');
    }
  }

  // Summary
  console.log('\n================================');
  console.log(`\n✅ Generated ${generatedPaths.length}/${allImages.length} images\n`);

  if (generatedPaths.length > 0) {
    console.log('Generated images:');
    generatedPaths.forEach(path => console.log(`  - ${path}`));
  }

  console.log('\nNext steps:');
  console.log('1. Review the generated images in: public/images/brand/');
  console.log('2. Update i18n/messages/*/NanoBananaVideo.json with the new paths');
  console.log('3. Run the site to verify the images display correctly\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
