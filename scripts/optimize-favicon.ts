/**
 * Optimize Favicon Script
 *
 * 优化 favicon：
 * 1. 透明背景
 * 2. 更高对比度的渐变色
 * 3. 更亮的播放按钮图标
 *
 * Usage: pnpm tsx scripts/optimize-favicon.ts
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const TEMP_DIR = join(process.cwd(), '.temp-brand');

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

// 创建高对比度 SVG Logo（透明背景 + 更亮的渐变）
function createHighContrastSVG(size: number): Buffer {
  // 使用更亮、更鲜艳的颜色
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- 圆形背景 - 渐变 -->
  <circle cx="50" cy="50" r="46" fill="url(#grad)"/>
  <!-- 播放按钮 - 白色带轻微阴影 -->
  <polygon points="38,28 38,72 72,50" fill="white" filter="url(#glow)"/>
</svg>`;
  return Buffer.from(svg);
}

// 创建简化版 SVG（用于小尺寸 favicon）
function createSimpleSVG(size: number): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#grad)"/>
  <polygon points="36,25 36,75 76,50" fill="white"/>
</svg>`;
  return Buffer.from(svg);
}

async function main() {
  console.log('🎨 Optimizing Favicon & Logo');
  console.log('============================\n');

  // 1. 生成优化的 SVG Logo
  console.log('📐 Step 1: Creating optimized SVG logo...');
  const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="46" fill="url(#grad)"/>
  <polygon points="38,28 38,72 72,50" fill="white"/>
</svg>`;
  writeFileSync(join(PUBLIC_DIR, 'logo.svg'), svgLogo);
  console.log('  ✓ logo.svg (高对比度渐变)');

  // 2. 生成 favicon PNG 文件（透明背景）
  console.log('\n🔷 Step 2: Creating favicon with transparent background...');

  const png16Path = join(TEMP_DIR, 'favicon-16.png');
  const png32Path = join(TEMP_DIR, 'favicon-32.png');
  const png48Path = join(TEMP_DIR, 'favicon-48.png');

  // 16x16 - 简化版
  await sharp(createSimpleSVG(64))
    .resize(16, 16)
    .png()
    .toFile(png16Path);
  console.log('  ✓ favicon-16.png');

  // 32x32 - 简化版
  await sharp(createSimpleSVG(128))
    .resize(32, 32)
    .png()
    .toFile(png32Path);
  console.log('  ✓ favicon-32.png');

  // 48x48 - 高清版
  await sharp(createHighContrastSVG(192))
    .resize(48, 48)
    .png()
    .toFile(png48Path);
  console.log('  ✓ favicon-48.png');

  // 3. 生成 ICO 文件
  console.log('\n📦 Step 3: Creating favicon.ico...');
  const icoBuffer = await pngToIco([png16Path, png32Path, png48Path]);
  writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ favicon.ico (16x16 + 32x32 + 48x48, 透明背景)');

  // 4. 更新 logo.png 系列（使用高对比度版本）
  console.log('\n🖼️ Step 4: Updating logo PNG files...');

  // logo.png - 192x192
  await sharp(createHighContrastSVG(512))
    .resize(192, 192)
    .png()
    .toFile(join(PUBLIC_DIR, 'logo.png'));
  console.log('  ✓ logo.png (192x192)');

  // logo-512.png - 512x512
  await sharp(createHighContrastSVG(1024))
    .resize(512, 512)
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-512.png'));
  console.log('  ✓ logo-512.png (512x512)');

  // logo-maskable.png - 192x192 带安全区（需要背景色）
  const maskableSvg192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="192" height="192">
  <rect width="100" height="100" fill="#0F172A"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="36" fill="url(#grad)"/>
  <polygon points="43,35 43,65 63,50" fill="white"/>
</svg>`;
  await sharp(Buffer.from(maskableSvg192))
    .resize(192, 192)
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-maskable.png'));
  console.log('  ✓ logo-maskable.png (192x192, 带安全区)');

  // logo-512-maskable.png - 512x512 带安全区
  const maskableSvg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
  <rect width="100" height="100" fill="#0F172A"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="36" fill="url(#grad)"/>
  <polygon points="43,35 43,65 63,50" fill="white"/>
</svg>`;
  await sharp(Buffer.from(maskableSvg512))
    .resize(512, 512)
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-512-maskable.png'));
  console.log('  ✓ logo-512-maskable.png (512x512, 带安全区)');

  // apple-touch-icon.png - 180x180（需要背景色）
  const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180">
  <rect width="100" height="100" rx="22" fill="#0F172A"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="50%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#6366F1"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="38" fill="url(#grad)"/>
  <polygon points="42,32 42,68 68,50" fill="white"/>
</svg>`;
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (180x180)');

  console.log('\n============================');
  console.log('✅ Favicon & Logo optimized!');
  console.log('\n改进内容:');
  console.log('  • 透明背景 (favicon)');
  console.log('  • 更亮的渐变色 (#A78BFA → #8B5CF6 → #6366F1)');
  console.log('  • 更大的播放按钮图标');
  console.log('  • 添加 48x48 尺寸到 ICO');
}

main().catch(console.error);
