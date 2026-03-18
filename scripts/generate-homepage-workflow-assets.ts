/**
 * Generate homepage Veo 3.1 workflow assets and upload them to R2.
 *
 * Output targets:
 * - website/home/workflows/single-image/reference-frame.png
 * - website/home/workflows/single-image/generated-video.mp4
 * - website/home/workflows/first-last/starting-frame.png
 * - website/home/workflows/first-last/ending-frame.png
 * - website/home/workflows/first-last/generated-video.mp4
 * - homepage-video-workflows-assets.json
 *
 * Run:
 * pnpm tsx scripts/generate-homepage-workflow-assets.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { KieClient } from "../lib/kie/client";
import {
  FluxKontextRequest,
  Veo3GenerateRequest,
  Veo3GenerationType,
} from "../lib/kie/types";

const requiredEnv = [
  "KIE_API_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const KIE_API_KEY = process.env.KIE_API_KEY!;

const kieClient = new KieClient({
  apiKey: KIE_API_KEY,
  timeout: 60_000,
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const PATHS = {
  singleImageReference:
    "website/home/workflows/single-image/reference-frame.png",
  singleImageVideo:
    "website/home/workflows/single-image/generated-video.mp4",
  firstLastStart:
    "website/home/workflows/first-last/starting-frame.png",
  firstLastEnd:
    "website/home/workflows/first-last/ending-frame.png",
  firstLastVideo:
    "website/home/workflows/first-last/generated-video.mp4",
} as const;

async function downloadFile(
  url: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType =
    response.headers.get("content-type") || "application/octet-stream";

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

async function saveRemoteFileToR2(
  remoteUrl: string,
  key: string,
  expectedType: string
): Promise<string> {
  const { buffer, contentType } = await downloadFile(remoteUrl);
  const finalContentType =
    contentType === "application/octet-stream" ? expectedType : contentType;

  return uploadToR2(buffer, key, finalContentType);
}

async function generateFluxImageToR2(
  params: FluxKontextRequest,
  r2Key: string,
  label: string
): Promise<{ tempUrl: string; cdnUrl: string }> {
  console.log(`\n[image] ${label}`);
  console.log(`prompt: ${params.prompt}`);

  const taskId = await kieClient.generateFluxKontextImage(params);
  console.log(`taskId: ${taskId}`);

  const imageUrls = await kieClient.waitForFluxKontextCompletion(taskId, {
    intervalMs: 8_000,
    maxAttempts: 40,
    onProgress: (attempt) => {
      console.log(`  polling image status (${attempt})`);
    },
  });

  if (imageUrls.length === 0) {
    throw new Error(`No image URL returned for ${label}`);
  }

  const tempUrl = imageUrls[0];
  const cdnUrl = await saveRemoteFileToR2(tempUrl, r2Key, "image/png");

  console.log(`saved to ${cdnUrl}`);

  return { tempUrl, cdnUrl };
}

async function generateVeoVideoToR2(
  params: Veo3GenerateRequest,
  r2Key: string,
  label: string
): Promise<{ tempUrl: string; cdnUrl: string }> {
  console.log(`\n[video] ${label}`);
  console.log(`prompt: ${params.prompt}`);

  const taskId = await kieClient.generateVeo3Video(params);
  console.log(`taskId: ${taskId}`);

  const videoUrls = await kieClient.waitForVeo3Completion(taskId, {
    intervalMs: 15_000,
    maxAttempts: 48,
    onProgress: (attempt) => {
      console.log(`  polling video status (${attempt})`);
    },
  });

  if (videoUrls.length === 0) {
    throw new Error(`No video URL returned for ${label}`);
  }

  const tempUrl = videoUrls[0];
  const cdnUrl = await saveRemoteFileToR2(tempUrl, r2Key, "video/mp4");

  console.log(`saved to ${cdnUrl}`);

  return { tempUrl, cdnUrl };
}

async function main() {
  const singleImagePrompt =
    "Luxury skincare bottle on a pale stone pedestal, soft natural daylight, drifting silk ribbon, subtle condensation on frosted glass, premium beauty campaign, clean editorial composition, 16:9";
  const singleImageVideoPrompt =
    "Start from the exact reference frame. Slow cinematic orbit around the skincare bottle, silk ribbon drifting gently in the air, subtle light sweep across the frosted glass, elegant premium beauty ad motion, realistic detail, stable composition.";

  const firstLastStartPrompt =
    "Electric concept coupe parked on a wet rooftop at blue hour, low wide camera angle, reflective puddles, distant skyline, premium automotive commercial look, cinematic lighting, 16:9";
  const firstLastEndPrompt =
    "Transform this same electric concept coupe scene into the final hero frame: camera pushed in much closer to the car, headlights on, city lights brighter, more dramatic reflections on the wet rooftop, premium automotive commercial, keep the same vehicle and setting, 16:9";
  const firstLastVideoPrompt =
    "Begin on the exact starting frame and end on the exact ending frame. Smooth forward dolly toward the electric coupe, headlights turning on during the move, reflections intensify across the wet rooftop, premium automotive reveal, cinematic pacing, stable subject continuity.";

  const singleImage = await generateFluxImageToR2(
    {
      prompt: singleImagePrompt,
      model: "flux-kontext-pro",
      aspectRatio: "16:9",
      outputFormat: "png",
      promptUpsampling: true,
    },
    PATHS.singleImageReference,
    "single image reference"
  );

  const firstLastStart = await generateFluxImageToR2(
    {
      prompt: firstLastStartPrompt,
      model: "flux-kontext-pro",
      aspectRatio: "16:9",
      outputFormat: "png",
      promptUpsampling: true,
    },
    PATHS.firstLastStart,
    "first-last starting frame"
  );

  const firstLastEnd = await generateFluxImageToR2(
    {
      prompt: firstLastEndPrompt,
      model: "flux-kontext-pro",
      aspectRatio: "16:9",
      inputImage: firstLastStart.cdnUrl,
      outputFormat: "png",
      promptUpsampling: true,
    },
    PATHS.firstLastEnd,
    "first-last ending frame"
  );

  const singleImageVideo = await generateVeoVideoToR2(
    {
      prompt: singleImageVideoPrompt,
      generationType: "IMAGE_2_VIDEO",
      aspectRatio: "16:9",
      imageUrls: [singleImage.cdnUrl],
      model: "veo3_fast",
    },
    PATHS.singleImageVideo,
    "single image workflow video"
  );

  const firstLastVideo = await generateVeoVideoToR2(
    {
      prompt: firstLastVideoPrompt,
      generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO" as Veo3GenerationType,
      aspectRatio: "16:9",
      imageUrls: [firstLastStart.cdnUrl, firstLastEnd.cdnUrl],
      model: "veo3_fast",
    },
    PATHS.firstLastVideo,
    "first-last workflow video"
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    singleImage: {
      referenceFrame: singleImage.cdnUrl,
      generatedVideo: singleImageVideo.cdnUrl,
    },
    firstLast: {
      startingFrame: firstLastStart.cdnUrl,
      endingFrame: firstLastEnd.cdnUrl,
      generatedVideo: firstLastVideo.cdnUrl,
    },
  };

  writeFileSync(
    resolve(process.cwd(), "homepage-video-workflows-assets.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  console.log("\nDone.");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error("\nAsset generation failed.");
  console.error(error);
  process.exit(1);
});
