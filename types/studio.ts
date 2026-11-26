export type TabId = 'home' | 'new-project' | 'profile';

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type InputMode = 'describe' | 'script';

export type MotionStyle =
  | 'kinetic-pop'
  | 'slide-zoom'
  | 'typewriter-glow'
  | 'split-card';

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
  id: string;
  startSec: number;
  endSec: number;
  headline: string;
  subtext: string;
  caption: string;
  motionStyle: MotionStyle;
  bgGradient: [string, string];
  accentColor: string;
}

export interface VideoProject {
  id: string;
  title: string;
  mode: InputMode;
  promptText: string;
  aspectRatio: AspectRatio;
  totalDurationSec: number;
  theme: string;
  scenes: VideoScene[];
  renderCode: string;
  timestamp: string;
  templateId?: string;
  templateTitle?: string;
}
