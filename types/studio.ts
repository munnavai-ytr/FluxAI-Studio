export type TabId = 'home' | 'new-project' | 'profile';

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type InputMode = 'describe' | 'script';

export type TemplateVisualKind =
  | 'kinetic-typography'
  | 'tech-explainer'
  | 'viral-story'
  | 'data-motion'
  | 'quote-lyric'
  | 'product-spotlight';

export interface VideoTemplate {
  id: string;
  title: string;
  subtitle: string;
  aspectRatio: Extract<AspectRatio, '9:16' | '16:9'>;
  durationLabel: string;
  category: string;
  defaultMode: InputMode;
  starterPrompt: string;
  starterScript: string;
  styleDirection: string;
  visualKind: TemplateVisualKind;
}

export interface VideoScene {
  index: number;
  durationSec: number;
  headline: string;
  visualCue: string;
  motionDirective: string;
  voiceover: string;
}

export interface VideoProject {
  id: string;
  title: string;
  mode: InputMode;
  promptText: string;
  aspectRatio: AspectRatio;
  templateId?: string;
  templateTitle?: string;
  createdAt: string;
  totalDurationSec: number;
  scenes: VideoScene[];
}

export interface KeyConnectionState {
  hasKey: boolean;
  verified: boolean;
  lastTestedAt?: string;
}
