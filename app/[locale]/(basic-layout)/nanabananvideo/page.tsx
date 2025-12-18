import NanoBananaVideoPage from "@/components/nanabananvideo";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Nano Banana to Video - Free AI Video Generator | Sora 2 & Veo 3.1";
  const description = "Convert Nano Banana images to professional videos instantly. Support Sora 2 and Veo 3.1 Fast. Free trial, no watermark. Perfect for UGC ads and e-commerce.";
  const keywords = [
    "nano banana to video",
    "nano banana video",
    "sora 2",
    "veo 3.1",
    "ai video generator",
    "free video generator",
    "no watermark",
    "ugc ads",
    "tiktok video",
    "instagram video",
    "shopify video",
    "faceless youtube",
    "text to video",
    "image to video",
    "keyframes to video",
    "1080p video",
    "commercial use",
    "video generation",
    "ai video",
    "nano banana edit",
    "nano banana pro"
  ];

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Nano Banana to Video - AI Video Generator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: "/nanabananvideo",
    },
  };
}

export default function Page() {
  // Structured Data for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How to convert Nano Banana to video?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Converting Nano Banana to video is simple: 1) Select your preferred AI model (Sora 2 or Veo 3.1), 2) Choose your generation mode (text-to-video or image-to-video), 3) Upload your Nano Banana image if using image-to-video, 4) Enter your prompt describing the video motion, 5) Click generate and wait 3-10 minutes for your video to be ready."
        }
      },
      {
        "@type": "Question",
        "name": "Is Nano Banana to video free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We offer free trial credits so you can test the video generation without any payment. All generated videos are watermark-free. After using your free credits, you can choose to pay as you go or subscribe for unlimited video generation."
        }
      },
      {
        "@type": "Question",
        "name": "How to remove watermark from Nano Banana videos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All videos generated on our platform are automatically watermark-free! You don't need to do anything special. Unlike other platforms, we don't add watermarks to your videos, so they're ready for professional and commercial use immediately."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use Nano Banana videos commercially?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! All videos generated on our platform come with commercial use rights. You can use them for UGC ads, TikTok content, YouTube videos, e-commerce stores, and any other commercial purposes without any restrictions."
        }
      },
      {
        "@type": "Question",
        "name": "How to get 1080p video from Nano Banana?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All videos generated on our platform are automatically created in 1080p resolution! Simply generate your video as normal using either Sora 2 or Veo 3.1, and the output will be in full HD 1080p quality, perfect for professional use."
        }
      }
    ]
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Nano Banana to Video",
    "applicationCategory": "MultimediaApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "128"
    },
    "description": "Convert Nano Banana images to professional videos instantly with AI. Support Sora 2 and Veo 3.1 Fast. Free trial, no watermark.",
    "operatingSystem": "Web Browser"
  };

  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "How to Convert Nano Banana to Video",
    "description": "Learn how to convert Nano Banana images to professional videos using Sora 2 and Veo 3.1 AI models. Free, no watermark, commercial use.",
    "thumbnailUrl": "/og-image.jpg",
    "uploadDate": "2024-01-01T00:00:00Z",
    "duration": "PT5M",
    "contentUrl": "/nanabananvideo#video-demo"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <NanoBananaVideoPage />
    </>
  );
}

