import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import Features from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import Pricing from "@/components/home/Pricing";
import Testimonials from "@/components/home/Testimonials";
import UseCases from "@/components/home/UseCases";
import VideoWorkflows from "@/components/home/VideoWorkflows";
import { BG1 } from "@/components/shared/BGs";
import { getMessages } from "next-intl/server";

export default async function HomeComponent() {
  const messages = await getMessages();

  return (
    <div className="w-full">
      <BG1 />

      {messages.Landing.Hero && <Hero />}

      {messages.Landing.VideoWorkflows && <VideoWorkflows />}

      {messages.Landing.Features && <Features />}

      {messages.Landing.UseCases && <UseCases />}

      {messages.Landing.Pricing && <Pricing />}

      {messages.Landing.Testimonials && <Testimonials />}

      {messages.Landing.FAQ && <FAQ />}

      {messages.Landing.CTA && <CTA />}
    </div>
  );
}
