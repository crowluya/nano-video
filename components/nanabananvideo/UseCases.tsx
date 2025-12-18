import { DynamicIcon } from "@/components/DynamicIcon";
import FeatureBadge from "@/components/shared/FeatureBadge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useTranslations } from "next-intl";

type UseCase = {
  title: string;
  description: string;
  image: string;
  icon: string;
};

const UseCaseCard = ({ useCase }: { useCase: UseCase }) => {
  return (
    <li className="min-h-64 list-none">
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
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xl lg:text-2xl font-semibold font-sans">
                <div className="w-fit rounded-lg border-border p-2 bg-primary text-white dark:text-white">
                  <DynamicIcon name={useCase.icon} className="w-4 h-4" />
                </div>
                {useCase.title}
              </h3>
              <p className="md:[&_b]:font-semibold md:[&_strong]:font-semibold font-sans text-sm leading-4.5 md:text-base md:leading-5.5 text-muted-foreground">
                {useCase.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default function NanoBananaUseCases() {
  const t = useTranslations("NanoBananaVideo.UseCases");

  const useCases: UseCase[] = t.raw("cases").map((item: UseCase) => ({
    title: item.title,
    description: item.description,
    image: item.image,
    icon: item.icon,
  }));

  return (
    <section id="use-cases" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            className="mb-8"
          />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.title} useCase={useCase} />
          ))}
        </ul>
      </div>
    </section>
  );
}

