/**
 * Migrate public images to R2 and update references
 * Usage: pnpm tsx scripts/migrate-images-to-r2.ts
 */

import { loadEnvConfig } from '@next/env';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { writeFileSync } from 'fs';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Initialize R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Get all image files recursively
function getAllImageFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllImageFiles(filePath, fileList);
    } else if (/\.(png|jpg|jpeg|webp|svg)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Get content type from file extension
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const types: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  };
  return types[ext || ''] || 'application/octet-stream';
}

// Upload file to R2
async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  const fileBuffer = readFileSync(localPath);
  const contentType = getContentType(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${r2Key}`;
}

// Update JSON file with new URLs
function updateJsonFile(filePath: string, replacements: Map<string, string>) {
  let content = readFileSync(filePath, 'utf-8');
  let updated = false;

  replacements.forEach((newUrl, oldPath) => {
    if (content.includes(oldPath)) {
      content = content.replace(new RegExp(oldPath, 'g'), newUrl);
      updated = true;
    }
  });

  if (updated) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Updated: ${filePath}`);
  }
}

async function main() {
  console.log('🚀 Starting image migration to R2...\n');

  // Check environment variables
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error('❌ Missing R2 environment variables');
    process.exit(1);
  }

  const publicDir = join(projectDir, 'public');
  const imagesDir = join(publicDir, 'images');

  // Get all image files
  const imageFiles = getAllImageFiles(imagesDir);
  console.log(`📁 Found ${imageFiles.length} image files\n`);

  // Upload images and track replacements
  const replacements = new Map<string, string>();
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const localPath of imageFiles) {
    const relativePath = relative(publicDir, localPath).replace(/\\/g, '/');
    const r2Key = `website/${relativePath}`;
    const publicPath = `/${relativePath}`;

    try {
      // Skip if already uploaded (check if it's a large file worth uploading)
      const stats = statSync(localPath);
      if (stats.size < 10 * 1024) { // Skip files smaller than 10KB (icons, etc.)
        console.log(`  ⏭️  Skipped (too small): ${relativePath}`);
        skippedCount++;
        continue;
      }

      console.log(`  📤 Uploading: ${relativePath} (${(stats.size / 1024).toFixed(1)}KB)`);
      const r2Url = await uploadToR2(localPath, r2Key);
      replacements.set(publicPath, r2Url);
      uploadedCount++;
      console.log(`  ✅ Uploaded: ${r2Url}`);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${relativePath}:`, error);
    }
  }

  console.log(`\n📊 Upload Summary:`);
  console.log(`  ✅ Uploaded: ${uploadedCount} files`);
  console.log(`  ⏭️  Skipped: ${skippedCount} files`);

  // Update i18n JSON files
  console.log(`\n🔄 Updating references in i18n files...`);
  const i18nFiles = [
    'i18n/messages/en/NanoBananaVideo.json',
    'i18n/messages/zh/NanoBananaVideo.json',
    'i18n/messages/ja/NanoBananaVideo.json',
    'i18n/messages/en/Landing.json',
    'i18n/messages/zh/Landing.json',
    'i18n/messages/ja/Landing.json',
  ];

  i18nFiles.forEach(file => {
    const filePath = join(projectDir, file);
    try {
      updateJsonFile(filePath, replacements);
    } catch (error) {
      console.error(`  ❌ Failed to update ${file}:`, error);
    }
  });

  console.log(`\n✅ Migration completed!`);
  console.log(`\n📝 Summary of replacements:`);
  replacements.forEach((newUrl, oldPath) => {
    console.log(`  ${oldPath} → ${newUrl}`);
  });
}

main().catch(console.error);
