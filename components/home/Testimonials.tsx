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
    <section id="testimonials" className="py-20 bg-indigo-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="gradient-text">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.content}
              className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm"
            >
              <div className="mb-4">
                <RatingStars rating={testimonial.rating} />
              </div>
              <p className="text-foreground mb-6">{testimonial.content}</p>
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
                    <span className="">{testimonial.author.position}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
