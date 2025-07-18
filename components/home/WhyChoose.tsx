import { DynamicIcon } from "@/components/DynamicIcon";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

type BenefitItem = {
  text: string;
};

type BenefitGroup = {
  title: string;
  icon: string;
  items: BenefitItem[];
};

export default function WhyChoose() {
  const t = useTranslations("Landing.WhyChoose");

  const benefits: BenefitGroup[] = t.raw("groups").map((group: any) => ({
    title: group.title,
    icon: group.icon,
    items: group.items.map((item: any) => ({
      text: item.text,
    })),
  }));
  return (
    <section id="why-choose" className="py-20 highlight-bg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((group) => (
            <div
              key={group.title}
              className="bg-white bg-opacity-10 rounded-xl p-8 backdrop-blur-sm"
            >
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <DynamicIcon name={group.icon} className="mr-3 h-6 w-6" />
                {group.title}
              </h3>
              <ul className="space-y-4">
                {group.items.map((item) => (
                  <li key={item.text} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
