/**
 * Update i18n Image Paths Script
 *
 * Updates all placeholder.webp paths with new brand images in:
 * - i18n/messages/en/NanoBananaVideo.json
 * - i18n/messages/zh/NanoBananaVideo.json
 * - i18n/messages/ja/NanoBananaVideo.json
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Image mapping: index -> new path
const featuresImageMap = [
  '/images/brand/feature-video-conversion.webp',
  '/images/brand/feature-ai-models.webp',
  '/images/brand/feature-free-trial.webp',
  '/images/brand/feature-commercial-use.webp',
  '/images/brand/feature-keyframes.webp',
  '/images/brand/feature-fast-generation.webp',
];

const useCasesImageMap = [
  '/images/brand/usecase-ugc-ads.webp',
  '/images/brand/usecase-youtube.webp',
  '/images/brand/usecase-ecommerce.webp',
  '/images/brand/usecase-cinematic.webp',
  '/images/brand/usecase-tiktok.webp',
];

function updateNanoBananaVideoJson(filePath: string, locale: string) {
  console.log(`Updating ${locale}...`);

  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  // Update Features images
  data.Features.items.forEach((item: any, index: number) => {
    if (index < featuresImageMap.length) {
      item.images = [featuresImageMap[index]];
    }
  });

  // Update UseCases images
  data.UseCases.cases.forEach((item: any, index: number) => {
    if (index < useCasesImageMap.length) {
      item.image = useCasesImageMap[index];
    }
  });

  // Write back
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ Updated ${filePath}`);
}

async function main() {
  console.log('📝 Updating i18n image paths\n');

  const baseDir = join(process.cwd(), 'i18n', 'messages');

  // Update English
  updateNanoBananaVideoJson(join(baseDir, 'en', 'NanoBananaVideo.json'), 'en');

  // Update Chinese
  updateNanoBananaVideoJson(join(baseDir, 'zh', 'NanoBananaVideo.json'), 'zh');

  // Update Japanese
  updateNanoBananaVideoJson(join(baseDir, 'ja', 'NanoBananaVideo.json'), 'ja');

  console.log('\n✅ All image paths updated!\n');
  console.log('Features images:');
  featuresImageMap.forEach(path => console.log(`  - ${path}`));
  console.log('\nUseCases images:');
  useCasesImageMap.forEach(path => console.log(`  - ${path}`));
}

main().catch(console.error);
