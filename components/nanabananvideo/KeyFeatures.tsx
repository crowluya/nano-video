'use client';

import { Shield, Sparkles, Zap } from 'lucide-react';

const keyFeatures = [
  {
    icon: Sparkles,
    title: 'No Watermark',
    description: 'All generated videos are watermark-free for professional use',
  },
  {
    icon: Shield,
    title: 'Commercial Rights',
    description: 'Full commercial license included with every video generated',
  },
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Create stunning videos in just 3-10 minutes',
  },
];

export function KeyFeatures() {
  return (
    <section className="relative w-full border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {keyFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
