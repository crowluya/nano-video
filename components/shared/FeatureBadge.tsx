import { ArrowRight } from "lucide-react";

interface FeatureBadgeProps {
  label?: string;
  text?: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  className?: string;
}

export default function FeatureBadge({
  label,
  text,
  href,
  target = "_self",
  rel = "",
  className = "",
}: FeatureBadgeProps) {
  const content = (
    <div className="rounded-full border px-2 py-1 pr-2 text-center text-sm font-medium hover:bg-muted hover:border-primary/20 group hidden items-center gap-x-2 md:flex transition-all duration-300 ease-in-out">
      {label && (
        <div className="text-white highlight-bg rounded-2xl border px-1.5 py-0.5 text-xs font-semibold tracking-tight">
          {label}
        </div>
      )}

      {text && <div className="px-2 text-sm text-primary">{text}</div>}

      {href && (
        <div className="pr-3 transition-transform duration-300 group-hover:translate-x-1">
          <ArrowRight
            name="ArrowRight"
            className="h-4 w-4 text-gray-400 dark:text-gray-500"
          />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <div className={`mb-8 flex ${className}`}>
        <a href={href} target={target} rel={rel} className="inline-flex">
          {content}
        </a>
      </div>
    );
  }

  return <div className={`flex justify-center ${className}`}>{content}</div>;
}
