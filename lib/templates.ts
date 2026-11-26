import type { VideoTemplate } from '@/types/studio';

export const STARTER_TEMPLATES: VideoTemplate[] = [
  {
    id: 'kinetic-typography-hook',
    title: 'Kinetic Typography Hook',
    subtitle: 'Beat-synced bold word reveals built for 3-second retention.',
    aspectRatio: '9:16',
    durationLabel: '15s',
    category: 'Short-Form Hook',
    defaultMode: 'describe',
    starterPrompt:
      'Create a punchy 15-second kinetic typography hook explaining why 90% of landing pages lose visitors in the first 3 seconds, ending with 3 actionable fixes.',
    starterScript:
      'Most websites lose 90% of visitors in 3 seconds.\nNot because of bad design.\nBecause nobody knows what you actually do.\nFix the headline.\nShow the product.\nWatch conversions double.',
    styleDirection:
      'High-contrast oversized display type, crisp spring scale-ins, rapid rhythm cuts on key nouns.',
    visualKind: 'kinetic-typography',
  },
  {
    id: 'tech-explainer',
    title: 'Tech Explainer',
    subtitle: 'Modular system diagrams and crisp callouts for product walkthroughs.',
    aspectRatio: '16:9',
    durationLabel: '45s',
    category: 'Product & Dev',
    defaultMode: 'describe',
    starterPrompt:
      'Explain how edge caching cuts API latency from 420ms to 18ms using clean animated architecture nodes and subtle code callouts.',
    starterScript:
      'Every millisecond costs user trust.\nTraditional requests travel across continents to a single origin server.\nWith edge compute, requests resolve at the nearest regional node in under 20 milliseconds.',
    styleDirection:
      'Precision grid lines, indigo node connectors, clean monospace telemetry labels, smooth camera pans.',
    visualKind: 'tech-explainer',
  },
  {
    id: 'viral-story-reel',
    title: 'Viral Story Reel',
    subtitle: 'Paced vertical narrative captions with dynamic focal framing.',
    aspectRatio: '9:16',
    durationLabel: '30s',
    category: 'Storytelling',
    defaultMode: 'script',
    starterPrompt:
      'Tell the 30-second behind-the-scenes story of shipping a side project over one weekend that reached 10,000 users.',
    starterScript:
      'Friday, 8 PM: Blank repository and a stubborn idea.\nSaturday, 2 PM: First working prototype.\nSunday, 9 PM: One demo clip goes live.\nMonday morning: 10,400 builders signed in.',
    styleDirection:
      'Stacked chapter cards, subtle Ken Burns zoom, dynamic highlight captions synced to narrative beats.',
    visualKind: 'viral-story',
  },
  {
    id: 'data-chart-motion',
    title: 'Data & Chart Motion',
    subtitle: 'Animated bar progressions, tabular counters, and metric callouts.',
    aspectRatio: '16:9',
    durationLabel: '30s',
    category: 'Analytics',
    defaultMode: 'describe',
    starterPrompt:
      'Visualize Q1 to Q4 developer adoption growing from 12K to 184K active workspaces with animated bar progressions and milestone markers.',
    starterScript:
      'In Q1, 12,000 teams automated their weekly reports.\nBy Q3, adoption surged 6x.\nToday, over 184,000 workspaces ship faster with zero manual spreadsheets.',
    styleDirection:
      'Eased bar chart growth, tabular numeric roll-ups, crisp axis lines and single-accent peak bars.',
    visualKind: 'data-motion',
  },
  {
    id: 'quote-lyric-visual',
    title: 'Quote & Lyric Visual',
    subtitle: 'Expressive editorial pacing over atmospheric dark motion fields.',
    aspectRatio: '9:16',
    durationLabel: '20s',
    category: 'Editorial',
    defaultMode: 'script',
    starterPrompt:
      'Create an atmospheric 20-second visual quote piece on creative craft and patience.',
    starterScript:
      'Simplicity is about subtracting the obvious\nand adding the meaningful.\n— John Maeda',
    styleDirection:
      'Staggered line-by-line opacity fades, subtle ambient indigo-violet gradient drift, wide letter-spaced attribution.',
    visualKind: 'quote-lyric',
  },
  {
    id: 'product-spotlight',
    title: 'Product Spotlight',
    subtitle: 'Rim-lit feature highlights and clean launch CTA sequences.',
    aspectRatio: '16:9',
    durationLabel: '25s',
    category: 'Launch Reel',
    defaultMode: 'describe',
    starterPrompt:
      'Showcase a sleek mechanical creator keyboard with 3 rapid feature callouts: hot-swappable tactile switches, CNC aluminum frame, and wireless low-latency sync.',
    starterScript:
      'Precision milled from solid aerospace aluminum.\nTuned for effortless flow.\nZero wires. Zero lag.\nMeet StudioKey Pro.',
    styleDirection:
      'Studio dark pedestal framing, crisp directional rim lighting, floating spec callouts with clean exit wipe.',
    visualKind: 'product-spotlight',
  },
];
