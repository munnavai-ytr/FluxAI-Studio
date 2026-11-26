export interface GeminiModelPreset {
  id: string;
  label: string;
  badge: string;
  tierTone: 'free' | 'pro';
  description: string;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const CURATED_GEMINI_MODELS: GeminiModelPreset[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    badge: 'Free / Fast',
    tierTone: 'free',
    description: 'Best free-tier default for fast, structured multi-scene video plans.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    badge: 'Free / Ultra-Fast',
    tierTone: 'free',
    description: 'Lowest latency and highest free-tier throughput for rapid iterations.',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    badge: 'Pro / Quality',
    tierTone: 'pro',
    description: 'Stronger reasoning and storytelling nuance for complex scripts.',
  },
];

export function findCuratedModel(modelId: string): GeminiModelPreset | undefined {
  return CURATED_GEMINI_MODELS.find((preset) => preset.id === modelId);
}
