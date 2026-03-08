import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function BuiltWithButton() {
  return (
    <Link
      href="https://nanobananavideo.net"
      title="Visit Nano Banana Video"
      prefetch={false}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "px-4 rounded-md bg-transparent border-gray-500 hover:bg-gray-950 text-white hover:text-gray-100"
      )}
    >
      <span>Visit</span>
      <span>
        <LogoNanoVideo className="size-4 rounded-full" />
      </span>
      <span className="font-bold text-base-content flex gap-0.5 items-center tracking-tight">
        Nano Banana Video
      </span>
    </Link>
  );
}

function LogoNanoVideo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Nano Banana Video logo"
      title="Nano Banana Video"
      width={96}
      height={96}
      className={cn("size-8 rounded-md", className)}
    />
  );
}
