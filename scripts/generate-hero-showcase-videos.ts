import { KieClient } from '@/lib/kie/client';
import { writeFile } from 'fs/promises';

// Initialize KieClient
const kieClient = new KieClient({
  apiKey: process.env.KIE_API_KEY!,
});

// Trending AI video concepts for 2025-2026
const videoPrompts = [
  {
    id: 'hero-1',
    prompt: 'A stunning AI-generated product showcase video featuring a futuristic smartphone floating in a minimalist studio environment. The phone rotates slowly, revealing its sleek design. The background is a gradient of deep purple to cyan, with dynamic light particles flowing around the product. Cinematic lighting, 4K quality, photorealistic rendering.',
    description: 'Futuristic Product Showcase',
  },
  {
    id: 'hero-2',
    prompt: 'A mesmerizing morphing video showing a golden liquid transforming into various shapes - a sphere, a cube, then a complex geometric pattern. The liquid has realistic physics with beautiful reflections and refractions. Dark background with dramatic rim lighting. Macro lens perspective, 8K resolution, ultra-detailed.',
    description: 'Liquid Morphing Art',
  },
  {
    id: 'hero-3',
    prompt: 'An AI-generated digital avatar (stylized human) walking through a futuristic cyberpunk city at night. Neon signs, holographic displays, flying cars in the background. The avatar has glowing blue accents and is wearing futuristic fashion. Rain effects, volumetric fog, blade runner aesthetic. 16:9 aspect ratio, cinematic quality.',
    description: 'Cyberpunk Avatar Walk',
  },
];

async function generateVideos() {
  const results = [];

  for (const videoConfig of videoPrompts) {
    console.log(`\n🎬 Generating: ${videoConfig.description}`);
    console.log(`   Prompt: ${videoConfig.prompt.substring(0, 100)}...`);

    try {
      // Use Veo 3 Fast for video generation
      const taskId = await kieClient.generateVeo3Video({
        prompt: videoConfig.prompt,
        model: 'veo3_fast',
        generationType: 'TEXT_2_VIDEO',
        aspectRatio: '16:9',
      });

      console.log(`   ✅ Task ID: ${taskId}`);
      console.log(`   ⏳ Waiting for completion...`);

      // Poll for result using waitForVeo3Completion
      const urls = await kieClient.waitForVeo3Completion(taskId, {
        intervalMs: 5000,
        maxAttempts: 120,
        onProgress: (attempt) => {
          console.log(`   ⏳ Checking... (${attempt * 5}s)`);
        },
      });

      if (urls.length > 0) {
        const videoUrl = urls[0];
        console.log(`   🎉 Success! URL: ${videoUrl}`);

        results.push({
          id: videoConfig.id,
          description: videoConfig.description,
          url: videoUrl,
          taskId,
        });
      } else {
        console.log(`   ❌ No video URL returned`);
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  // Save results to JSON
  const outputFile = './hero-showcase-videos.json';
  await writeFile(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${outputFile}`);
  console.log(`📊 Generated ${results.length}/${videoPrompts.length} videos`);
}

// Run the generation
generateVideos().catch(console.error);
