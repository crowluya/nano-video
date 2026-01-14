/**
 * Brand Assets Generation Script
 * Usage: pnpm tsx scripts/generate-brand-assets.ts
 */

import { loadEnvConfig } from '@next/env';
import { KieClient } from '../lib/kie/client';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const client = new KieClient(process.env.KIE_API_KEY!);

const PUBLIC_DIR = join(process.cwd(), 'public');
const TEMP_DIR = join(process.cwd(), '.temp-brand');

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function waitForImage(taskId: string): Promise<string> {
  console.log(`  Waiting for task ${taskId}...`);
  const urls = await client.waitForNanoBananaCompletion(taskId, {
    intervalMs: 5000,
    maxAttempts: 60,
    onProgress: (attempt) => {
      if (attempt % 6 === 0) console.log(`  Still generating... (${attempt * 5}s)`);
    },
  });
  if (!urls || urls.length === 0) throw new Error('No image URL returned');
  return urls[0];
}

async function generateLogoBase(): Promise<Buffer> {
  console.log('\n📦 Step 1: Generating Logo Base Image...');

  const prompt = `A modern minimalist logo icon for "Nano Banana Video" - an AI video generation platform. Design: A stylized banana shape combined with a play button or video frame element. Style: Clean geometric design, gradient from purple (#8B5CF6) to blue (#3B82F6). Background: Solid dark (#0F172A). Requirements: Simple, recognizable at small sizes, professional tech company aesthetic. No text, icon only, centered, square format.`;

  const taskId = await client.generateNanoBananaImage({
    model: 'nano-banana-pro',
    input: {
      prompt,
      aspect_ratio: '1:1',
      output_format: 'png',
      resolution: '2K',
    },
  });

  console.log(`  Task ID: ${taskId}`);
  const imageUrl = await waitForImage(taskId);
  console.log(`  ✓ Logo generated: ${imageUrl}`);

  const buffer = await downloadImage(imageUrl);
  writeFileSync(join(TEMP_DIR, 'logo-base.png'), buffer);
  return buffer;
}

async function processLogoSizes(baseBuffer: Buffer): Promise<void> {
  console.log('\n📐 Step 2: Processing Logo Sizes...');

  await sharp(baseBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo.png'));
  console.log('  ✓ logo.png (192x192)');

  await sharp(baseBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-512.png'));
  console.log('  ✓ logo-512.png (512x512)');

  await sharp(baseBuffer)
    .resize(154, 154, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .extend({ top: 19, bottom: 19, left: 19, right: 19, background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-maskable.png'));
  console.log('  ✓ logo-maskable.png (192x192)');

  await sharp(baseBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-512-maskable.png'));
  console.log('  ✓ logo-512-maskable.png (512x512)');

  await sharp(baseBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (180x180)');
}

async function generateFavicon(baseBuffer: Buffer): Promise<void> {
  console.log('\n🔷 Step 3: Generating Favicon...');

  const png16Path = join(TEMP_DIR, 'favicon-16.png');
  const png32Path = join(TEMP_DIR, 'favicon-32.png');

  await sharp(baseBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(png16Path);

  await sharp(baseBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(png32Path);

  const icoBuffer = await pngToIco([png16Path, png32Path]);
  writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ favicon.ico (16x16 + 32x32)');
}

async function generateOGImages(): Promise<void> {
  console.log('\n🖼️ Step 4: Generating OG Images...');

  const ogPrompt = `A professional marketing banner for "Nano Banana Video" AI video generation platform. Design: Modern gradient background from deep purple to blue, with subtle tech patterns. Elements: Abstract video/film elements, AI neural network patterns. Style: Clean, professional, SaaS marketing aesthetic. Wide banner format. Colors: Purple (#8B5CF6), Blue (#3B82F6), Dark background (#0F172A).`;

  console.log('  Generating OG background...');
  const taskId = await client.generateNanoBananaImage({
    model: 'nano-banana-pro',
    input: {
      prompt: ogPrompt,
      aspect_ratio: '16:9',
      output_format: 'png',
      resolution: '2K',
    },
  });

  const imageUrl = await waitForImage(taskId);
  const bgBuffer = await downloadImage(imageUrl);
  console.log('  ✓ OG background generated');

  const ogBase = await sharp(bgBuffer).resize(1200, 630, { fit: 'cover' }).png().toBuffer();

  const ogConfigs = [
    { filename: 'og.png', title: 'Nano Banana Video', subtitle: 'AI-Powered Video Generation', description: 'Create stunning videos with Sora 2 and Veo 3.1' },
    { filename: 'og_zh.png', title: 'Nano Banana Video', subtitle: 'AI 视频生成平台', description: '使用 Sora 2 和 Veo 3.1 创建精彩视频' },
    { filename: 'og_ja.png', title: 'Nano Banana Video', subtitle: 'AI ビデオ生成', description: 'Sora 2 と Veo 3.1 で素晴らしいビデオを作成' },
  ];

  for (const config of ogConfigs) {
    const textSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#8B5CF6"/><stop offset="100%" style="stop-color:#3B82F6"/></linearGradient></defs>
      <rect width="1200" height="630" fill="rgba(15, 23, 42, 0.7)"/>
      <text x="600" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">${config.title}</text>
      <text x="600" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="url(#textGrad)">${config.subtitle}</text>
      <text x="600" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">${config.description}</text>
    </svg>`;

    await sharp(ogBase)
      .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
      .png()
      .toFile(join(PUBLIC_DIR, config.filename));
    console.log(`  ✓ ${config.filename}`);
  }
}

function generateSVGLogo(): void {
  console.log('\n✨ Step 5: Generating SVG Logo...');
  const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8B5CF6"/><stop offset="100%" style="stop-color:#3B82F6"/></linearGradient></defs>
  <circle cx="50" cy="50" r="45" fill="url(#grad)"/>
  <polygon points="40,30 40,70 70,50" fill="white"/>
</svg>`;
  writeFileSync(join(PUBLIC_DIR, 'logo.svg'), svgLogo);
  console.log('  ✓ logo.svg');
}

async function main() {
  console.log('🎨 Brand Assets Generation Script');
  console.log('==================================');

  if (!process.env.KIE_API_KEY) {
    console.error('❌ KIE_API_KEY not set');
    process.exit(1);
  }

  try {
    const logoBase = await generateLogoBase();
    await processLogoSizes(logoBase);
    await generateFavicon(logoBase);
    await generateOGImages();
    generateSVGLogo();

    console.log('\n==================================');
    console.log('✅ All brand assets generated!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
