import FeatureBadge from "@/components/shared/FeatureBadge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Star, StarHalf } from "lucide-react";
import { useTranslations } from "next-intl";

type Testimonial = {
  content: string;
  author: {
    name: string;
    position: string;
    avatar: string;
  };
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    content:
      "Nano Banana to Video helped us create UGC ads for TikTok in minutes. The Veo 3.1 Fast model is incredibly quick and the quality is amazing. We've scaled our ad production 10x without hiring a video team.",
    author: {
      name: "Sarah Chen",
      position: "E-commerce Brand Owner",
      avatar: "/images/users/user1.jpeg",
    },
    rating: 5.0,
  },
  {
    content:
      "As a faceless YouTube creator, this tool is a game-changer. I can now produce 3-4 videos per day instead of 1 per week. The Sora 2 model creates incredibly realistic motion. My channel growth has doubled since I started using it.",
    author: {
      name: "Marcus Thompson",
      position: "YouTube Creator",
      avatar: "/images/users/user2.jpeg",
    },
    rating: 5.0,
  },
  {
    content:
      "我们使用 Nano Banana to Video 为我们的 Shopify 商店创建产品视频。转化率提高了 35%。无水印且质量专业，完全可以用于商业用途。性价比极高！",
    author: {
      name: "Wei Zhang",
      position: "Shopify Store Owner",
      avatar: "/images/users/user3.png",
    },
    rating: 4.8,
  },
];

const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center">
      <div className="text-yellow-400 flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="fill-current h-5 w-5" />
        ))}
        {hasHalfStar && <StarHalf className="fill-current h-5 w-5" />}
      </div>
      <span className="ml-2 text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function NanoBananaTestimonials() {
  const t = useTranslations("NanoBananaVideo.Testimonials");

  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FeatureBadge label={t("badge.label")} className="mb-8" />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {testimonials.map((testimonial) => (
            <li key={testimonial.content} className="min-h-64 list-none">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-3xl md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-xs dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <RatingStars rating={testimonial.rating} />
                    <p className="text-foreground">{testimonial.content}</p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        <img
                          src={testimonial.author.avatar}
                          alt={testimonial.author.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {testimonial.author.name},{" "}
                          <span className="">
                            {testimonial.author.position}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

