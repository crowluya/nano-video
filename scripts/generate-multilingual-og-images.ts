/**
 * Generate OG Images for all supported languages using Kie.ai Nano Banana Pro
 *
 * This script generates 1200x630 OG images with localized text for each language.
 * After generation, it uses sharp to optimize and convert to PNG format.
 */

import { config } from 'dotenv';
import { KieClient } from '@/lib/kie/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

// Load environment variables
config({ path: '.env.local' });

// Language configuration with OG image titles
const LANGUAGE_CONFIG = {
  en: { title: 'Nano Banana Video', subtitle: 'AI Video Generator', tagline: 'Create with Sora 2 & Veo 3.1' },
  zh: { title: '香蕉视频', subtitle: 'AI 视频生成器', tagline: '使用 Sora 2 和 Veo 3.1 创作' },
  ja: { title: 'バナナビデオ', subtitle: 'AI動画生成器', tagline: 'Sora 2 & Veo 3.1で作成' },
  es: { title: 'Nano Banana Video', subtitle: 'Generador de Video IA', tagline: 'Crea con Sora 2 y Veo 3.1' },
  fr: { title: 'Nano Banana Video', subtitle: 'Générateur Vidéo IA', tagline: 'Créez avec Sora 2 et Veo 3.1' },
  ko: { title: '나노 바나나 비디오', subtitle: 'AI 비디오 생성기', tagline: 'Sora 2와 Veo 3.1로 창작' },
  pt: { title: 'Nano Banana Video', subtitle: 'Gerador de Vídeo IA', tagline: 'Crie com Sora 2 e Veo 3.1' },
  de: { title: 'Nano Banana Video', subtitle: 'KI-Video-Generator', tagline: 'Erstellen mit Sora 2 & Veo 3.1' },
  it: { title: 'Nano Banana Video', subtitle: 'Generatore Video IA', tagline: 'Crea con Sora 2 e Veo 3.1' },
  nl: { title: 'Nano Banana Video', subtitle: 'AI Video Generator', tagline: 'Maak met Sora 2 & Veo 3.1' },
  ru: { title: 'Нано Банана Видео', subtitle: 'Генератор AI Видео', tagline: 'Создавайте с Sora 2 и Veo 3.1' },
  pl: { title: 'Nano Banana Video', subtitle: 'Generator Wideo AI', tagline: 'Twórz z Sora 2 i Veo 3.1' },
} as const;

type Locale = keyof typeof LANGUAGE_CONFIG;

const OUTPUT_DIR = join(process.cwd(), 'public/images/brand');
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Generate prompt for Kie.ai Nano Banana Pro
 */
function generatePrompt(locale: Locale): string {
  const config = LANGUAGE_CONFIG[locale];
  return `Professional OG image (open graph) for AI video generator website.
Title: "${config.title}"
Subtitle: "${config.subtitle}"
Tagline: "${config.tagline}"

Style: Modern tech startup, gradient background (purple to blue), clean typography,
white text, 1200x630 aspect ratio. High contrast, social media optimized.
Center layout with bold title prominent, subtitle below, small tagline at bottom.
Professional SaaS product style similar to Notion, Linear, or Vercel branding.`;
}

/**
 * Generate OG image using Kie.ai Nano Banana Pro
 */
async function generateOgImage(locale: Locale, client: KieClient): Promise<Buffer> {
  console.log(`🎨 Generating OG image for ${locale}...`);

  const prompt = generatePrompt(locale);

  // Use Nano Banana Pro for image generation
  const taskId = await client.generateNanoBananaImage({
    model: 'nano-banana-pro',
    input: {
      prompt,
      aspect_ratio: '16:9', // Standard OG image aspect ratio
    },
  });

  console.log(`  Task ID: ${taskId}`);

  // Wait for completion
  const urls = await client.waitForNanoBananaCompletion(taskId, {
    intervalMs: 3000,
    maxAttempts: 60,
    onProgress: (attempt, status) => {
      console.log(`  Progress: attempt ${attempt}, state: ${(status as { state: string }).state}`);
    },
  });

  if (!urls || urls.length === 0) {
    throw new Error(`No image URL returned for locale ${locale}`);
  }

  const imageUrl = urls[0];
  console.log(`  Image URL: ${imageUrl}`);

  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

/**
 * Process and save OG image using sharp
 */
async function processOgImage(buffer: Buffer, locale: Locale): Promise<void> {
  const outputPath = locale === 'en'
    ? join(OUTPUT_DIR, 'og.png')
    : join(OUTPUT_DIR, `og_${locale}.png`);

  console.log(`📸 Processing ${locale} OG image...`);

  // Use sharp to resize to exact 1200x630 and ensure PNG format
  await sharp(buffer)
    .resize(OG_WIDTH, OG_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .png({
      quality: 90,
      compressionLevel: 9,
    })
    .toFile(outputPath);

  console.log(`  ✅ Saved to ${outputPath}`);
}

/**
 * Generate OG images for specific locales only
 */
async function generateSpecificOgImages(locales: Locale[]): Promise<void> {
  console.log(`🚀 Starting OG image generation for: ${locales.join(', ')}...\n`);

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Initialize Kie.ai client
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY environment variable is not set');
  }
  const client = new KieClient(apiKey);

  // Check credits
  try {
    const credits = await client.getCredits();
    console.log(`💰 Available credits: ${credits}\n`);
  } catch (error) {
    console.warn(`⚠️  Could not check credits: ${error}\n`);
  }

  for (const locale of locales) {
    try {
      const buffer = await generateOgImage(locale, client);
      await processOgImage(buffer, locale);
      console.log(`✨ ${locale} OG image complete!\n`);
    } catch (error) {
      console.error(`❌ Failed to generate ${locale} OG image: ${error}\n`);
    }
  }

  console.log('🎉 All requested OG images generated!');
}

/**
 * Generate all OG images for all languages
 */
async function generateAllOgImages(): Promise<void> {
  const locales: Locale[] = Object.keys(LANGUAGE_CONFIG) as Locale[];
  await generateSpecificOgImages(locales);
}

/**
 * Generate favicon from main OG image
 */
async function generateFavicon(): Promise<void> {
  console.log('🔧 Generating favicon and icons...');

  const sourcePath = join(OUTPUT_DIR, 'og.png');

  // Generate favicon.ico (16x16 and 32x32)
  const faviconPath = join(process.cwd(), 'public', 'favicon.ico');

  const sizes = [16, 32];
  const icons = await Promise.all(
    sizes.map(size =>
      sharp(sourcePath)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .toBuffer()
    )
  );

  // Create ICO file (simplified - just use 32x32 for now)
  await sharp(icons[1])
    .toFile(faviconPath);

  console.log(`  ✅ favicon.ico created`);

  // Generate apple-touch-icon (180x180)
  const appleIconPath = join(process.cwd(), 'public', 'apple-touch-icon.png');
  await sharp(sourcePath)
    .resize(180, 180, { fit: 'cover', position: 'center' })
    .png()
    .toFile(appleIconPath);
  console.log(`  ✅ apple-touch-icon.png created`);

  // Generate logo.png (192x192)
  const logoPath = join(process.cwd(), 'public', 'logo.png');
  await sharp(sourcePath)
    .resize(192, 192, { fit: 'cover', position: 'center' })
    .png()
    .toFile(logoPath);
  console.log(`  ✅ logo.png created`);

  // Generate logo-512.png (512x512)
  const logo512Path = join(process.cwd(), 'public', 'logo-512.png');
  await sharp(sourcePath)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .png()
    .toFile(logo512Path);
  console.log(`  ✅ logo-512.png created`);

  console.log('🎉 All icons generated!\n');
}

// Main execution
async function main() {
  try {
    // Only regenerate en, zh, ja to match new style
    await generateSpecificOgImages(['en', 'zh', 'ja']);
    await generateFavicon();
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateAllOgImages, generateFavicon };
