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
      "Nexty helped us launch our AI content generator in just 1 day. The authentication, payment integration, and AI capabilities were ready out of the box, saving us at least 2 weeks of development time.",
    author: {
      name: "Michael Chen",
      position: "Indie Maker",
      avatar: "/images/users/user1.jpeg",
    },
    rating: 5.0,
  },
  {
    content:
      "As a product manager with limited technical resources, Nexty was a game-changer. We built and launched our analytics dashboard with subscription tiers in 3 days instead of 4 weeks. The documentation is exceptional.",
    author: {
      name: "Sarah Johnson",
      position: "CTO",
      avatar: "/images/users/user2.jpeg",
    },
    rating: 4.8,
  },
  {
    content:
      "我们团队使用 Nexty 开发了一个订阅制 AI 工具 SaaS 平台，第一个版本的开发仅用了 1天时间。内置的多语言支持和 SEO 友好的页面结构帮助我们迅速获得用户认可，投资回报率超出预期。",
    author: {
      name: "Kang",
      position: "Product Manager",
      avatar: "/images/users/user3.png",
    },
    rating: 5.0,
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

export default function Testimonials() {
  const t = useTranslations("Landing.Testimonials");

  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FeatureBadge label={t("badge.label")} className="mb-8" />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground text-transparent">
              {t("title")}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {testimonials.map((testimonial) => (
            <li key={testimonial.content} className="min-h-[16rem] list-none">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
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
