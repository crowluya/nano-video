/**
 * Restore Favicon from AI-generated Logo
 * 使用 AI 生成的 logo-base.png 重新生成 favicon
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const TEMP_DIR = join(process.cwd(), '.temp-brand');

async function main() {
  console.log('🔄 Restoring Favicon from AI-generated Logo...\n');

  // 读取 AI 生成的 logo
  const logoBase = readFileSync(join(TEMP_DIR, 'logo-base.png'));
  console.log('  ✓ Loaded logo-base.png');

  const png16Path = join(TEMP_DIR, 'favicon-16.png');
  const png32Path = join(TEMP_DIR, 'favicon-32.png');

  // 16x16 - 透明背景
  await sharp(logoBase)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(png16Path);
  console.log('  ✓ favicon-16.png');

  // 32x32 - 透明背景
  await sharp(logoBase)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(png32Path);
  console.log('  ✓ favicon-32.png');

  // 生成 ICO
  const icoBuffer = await pngToIco([png16Path, png32Path]);
  writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ favicon.ico (16x16 + 32x32)');

  // 同时恢复 logo.png 系列
  await sharp(logoBase)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo.png'));
  console.log('  ✓ logo.png (192x192)');

  await sharp(logoBase)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'logo-512.png'));
  console.log('  ✓ logo-512.png (512x512)');

  console.log('\n✅ Favicon restored from AI-generated logo!');
}

main().catch(console.error);
