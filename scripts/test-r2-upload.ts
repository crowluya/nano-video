/**
 * R2 上传测试脚本
 *
 * 运行: pnpm tsx scripts/test-r2-upload.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// 加载环境变量
config({ path: resolve(process.cwd(), ".env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function testR2Upload() {
  console.log("🧪 开始测试 R2 上传...\n");

  // 1. 检查环境变量
  const requiredEnvVars = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];

  console.log("📋 检查环境变量:");
  let missingVars = false;
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: 未设置`);
      missingVars = true;
    }
  }

  if (missingVars) {
    console.error("\n❌ 缺少必要的环境变量，请检查 .env.local");
    process.exit(1);
  }

  // 2. 创建 S3 客户端
  console.log("\n🔧 创建 R2 客户端...");
  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // 3. 创建测试图片 (1x1 红色像素 PNG)
  // PNG 文件头 + IHDR + IDAT + IEND
  const testPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xdd,
    0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  // 4. 上传测试
  const testKey = `test/r2-test-${Date.now()}.png`;
  console.log(`\n📤 上传测试图片: ${testKey}`);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: testKey,
        Body: testPngBuffer,
        ContentType: "image/png",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${testKey}`;

    console.log("\n✅ 上传成功!");
    console.log(`📎 公开 URL: ${publicUrl}`);
    console.log("\n💡 提示: 可以在浏览器中打开上面的 URL 验证图片是否可访问");

  } catch (error) {
    console.error("\n❌ 上传失败:", error);
    process.exit(1);
  }
}

testR2Upload();
