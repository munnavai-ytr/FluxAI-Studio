import { DEFAULT_GEMINI_MODEL } from '@/lib/gemini-models';
import type {
  AspectRatio,
  InputMode,
  MotionStyle,
  VideoProject,
  VideoScene,
} from '@/types/studio';

function buildGeminiEndpoint(modelId: string): string {
  const safeModel = modelId.trim() || DEFAULT_GEMINI_MODEL;
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    safeModel
  )}:generateContent`;
}

const VALID_MOTION_STYLES: MotionStyle[] = [
  'kinetic-pop',
  'slide-zoom',
  'typewriter-glow',
  'split-card',
];

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function sanitizeHex(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (HEX_COLOR_RE.test(trimmed)) {
      return trimmed;
    }
  }
  return fallback;
}

function sanitizeMotionStyle(value: unknown, index: number): MotionStyle {
  if (
    typeof value === 'string' &&
    VALID_MOTION_STYLES.includes(value as MotionStyle)
  ) {
    return value as MotionStyle;
  }
  return VALID_MOTION_STYLES[index % VALID_MOTION_STYLES.length];
}

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export function buildCanvasRenderCode(params: {
  title: string;
  aspectRatio: AspectRatio;
  totalDurationSec: number;
  scenes: VideoScene[];
}): string {
  const dims =
    params.aspectRatio === '9:16'
      ? { width: 720, height: 1280 }
      : params.aspectRatio === '16:9'
        ? { width: 1280, height: 720 }
        : { width: 1080, height: 1080 };

  const serializedScenes = JSON.stringify(params.scenes, null, 2);

  return `// FrameScript Self-Contained HTML5 Canvas Renderer
// Project: ${params.title} (${params.aspectRatio}, ${params.totalDurationSec}s)

const CONFIG = {
  width: ${dims.width},
  height: ${dims.height},
  totalDurationSec: ${params.totalDurationSec},
};

const SCENES = ${serializedScenes};

export function renderFrame(ctx, timeSec, showCaptions = true) {
  const t = ((timeSec % CONFIG.totalDurationSec) + CONFIG.totalDurationSec) % CONFIG.totalDurationSec;
  const scene = SCENES.find((s) => t >= s.startSec && t < s.endSec) || SCENES[SCENES.length - 1];
  const duration = Math.max(0.5, scene.endSec - scene.startSec);
  const progress = Math.min(1, Math.max(0, (t - scene.startSec) / duration));

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, CONFIG.width, CONFIG.height);
  grad.addColorStop(0, scene.bgGradient[0]);
  grad.addColorStop(1, scene.bgGradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // Motion reveal
  const ease = 1 - Math.pow(1 - Math.min(1, progress * 3), 3);
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 56px Outfit, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(scene.headline, CONFIG.width / 2, CONFIG.height * 0.44);

  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.font = '500 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(scene.subtext, CONFIG.width / 2, CONFIG.height * 0.53);

  if (showCaptions && scene.caption) {
    ctx.fillStyle = scene.accentColor;
    ctx.fillRect(CONFIG.width * 0.12, CONFIG.height * 0.84, (CONFIG.width * 0.76) * progress, 4);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 26px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(scene.caption, CONFIG.width / 2, CONFIG.height * 0.90);
  }
  ctx.restore();
}
`;
}

export interface PlannerError {
  message: string;
  code:
    | 'missing_key'
    | 'invalid_key'
    | 'invalid_model'
    | 'quota'
    | 'network'
    | 'parse'
    | 'unknown';
}

function mapHttpError(
  status: number,
  rawMessage: string,
  modelId: string
): PlannerError {
  const lower = rawMessage.toLowerCase();

  if (
    status === 404 ||
    lower.includes('not_found') ||
    lower.includes('is not found') ||
    lower.includes('not supported for generatecontent')
  ) {
    return {
      code: 'invalid_model',
      message: `Model "${modelId}" was not found or is unavailable for your key. Switch to gemini-2.5-flash in Profile or the quick selector. ("${modelId}" মডেলটি পাওয়া যায়নি বা সাপোর্টেড নয় — gemini-2.5-flash বেছে নিন।)`,
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied')
  ) {
    return {
      code: 'invalid_key',
      message:
        'Invalid or expired Gemini API key. Please check your key in Profile. (আপনার Gemini API key টি সঠিক নয় বা মেয়াদ শেষ হয়েছে — Profile থেকে যাচাই করুন।)',
    };
  }

  if (
    status === 429 ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit')
  ) {
    return {
      code: 'quota',
      message: `Rate limit or quota reached for "${modelId}". Try switching to a free/fast model like gemini-2.5-flash-lite or wait a moment. ("${modelId}" এর API লিমিট শেষ হয়েছে — gemini-2.5-flash-lite ব্যবহার করুন বা কিছুক্ষণ পর চেষ্টা করুন।)`,
    };
  }

  if (status === 400 && lower.includes('model')) {
    return {
      code: 'invalid_model',
      message: `Invalid model ID "${modelId}". Check the custom model name and try again. (মডেল নাম "${modelId}" সঠিক নয়।)`,
    };
  }

  return {
    code: 'unknown',
    message: rawMessage || 'Gemini API request failed. Please try again.',
  };
}

export async function testGeminiRestKey(
  apiKey: string,
  modelId: string = DEFAULT_GEMINI_MODEL
): Promise<{ ok: true; verifiedAt: string; model: string } | { ok: false; error: string }> {
  const trimmedKey = apiKey.trim();
  const cleanModel = modelId.trim() || DEFAULT_GEMINI_MODEL;
  if (!trimmedKey) {
    return { ok: false, error: 'Please enter a Gemini API key first.' };
  }

  try {
    const res = await fetch(
      `${buildGeminiEndpoint(cleanModel)}?key=${encodeURIComponent(trimmedKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
          generationConfig: {
            maxOutputTokens: 16,
            temperature: 0,
          },
        }),
      }
    );

    const payload = (await res.json()) as {
      error?: { message?: string; status?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!res.ok) {
      const mapped = mapHttpError(res.status, payload.error?.message ?? '', cleanModel);
      return { ok: false, error: mapped.message };
    }

    return { ok: true, verifiedAt: new Date().toISOString(), model: cleanModel };
  } catch {
    return {
      ok: false,
      error:
        'Network error while testing your Gemini API key. Check your internet connection. (নেটওয়ার্ক সমস্যা হয়েছে, সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।)',
    };
  }
}

interface RawSceneInput {
  id?: unknown;
  startSec?: unknown;
  endSec?: unknown;
  headline?: unknown;
  subtext?: unknown;
  caption?: unknown;
  motionStyle?: unknown;
  bgGradient?: unknown;
  accentColor?: unknown;
}

interface RawPlanPayload {
  title?: unknown;
  aspectRatio?: unknown;
  totalDurationSec?: unknown;
  theme?: unknown;
  scenes?: unknown;
  renderCode?: unknown;
}

export async function generateVideoPlan(params: {
  apiKey: string;
  model?: string;
  mode: InputMode;
  promptText: string;
  aspectRatio: AspectRatio;
  templateId?: string;
  templateTitle?: string;
  styleDirection?: string;
}): Promise<VideoProject> {
  const trimmedKey = params.apiKey.trim();
  const cleanModel = params.model?.trim() || DEFAULT_GEMINI_MODEL;

  if (!trimmedKey) {
    const err: PlannerError = {
      code: 'missing_key',
      message:
        'No Gemini API key found. Add your API key in Profile first. (কোনো Gemini API key পাওয়া যায়নি — Profile থেকে key যোগ করুন।)',
    };
    throw err;
  }

  const systemPrompt = `You are FrameScript, an expert code-driven motion graphics director.
Return ONLY strict, valid JSON (no markdown fences, no commentary) matching this exact structure:
{
  "title": "Short 3-6 word project title",
  "aspectRatio": "${params.aspectRatio}",
  "totalDurationSec": number between 15 and 45,
  "theme": "Short palette and visual style summary",
  "scenes": [
    {
      "id": "scene-1",
      "startSec": 0,
      "endSec": 5,
      "headline": "Punchy headline (max 7 words)",
      "subtext": "Concise supporting line (max 14 words)",
      "caption": "Synced short caption line (max 12 words)",
      "motionStyle": "kinetic-pop" | "slide-zoom" | "typewriter-glow" | "split-card",
      "bgGradient": ["#0B0D12", "#1B1E3A"],
      "accentColor": "#6366F1"
    }
  ],
  "renderCode": "Clean self-contained HTML5 Canvas render loop code string reflecting these scenes"
}

Rules:
- Generate 3 to 6 contiguous scenes where scene[0].startSec = 0, each scene.endSec = next scene.startSec, and the final endSec equals totalDurationSec.
- Every color in bgGradient and accentColor MUST be a valid 6-digit hex color (e.g. "#0F172A"). Keep backgrounds rich and dark-mode friendly so white text has high contrast.
- Vary motionStyle across scenes for a high-edit kinetic feel.
- Match the language of the user's input (e.g., if user writes in Bangla or English, keep headlines/captions in that language).`;

  const userPrompt = [
    `Mode: ${params.mode === 'script' ? 'Full Script' : 'Topic / Idea Description'}`,
    `Target Aspect Ratio: ${params.aspectRatio}`,
    params.templateTitle
      ? `Template Style: ${params.templateTitle} (${params.styleDirection ?? ''})`
      : 'Template Style: Custom Studio Motion',
    `User Input:\n${params.promptText.trim()}`,
  ].join('\n\n');

  let response: Response;
  try {
    response = await fetch(
      `${buildGeminiEndpoint(cleanModel)}?key=${encodeURIComponent(trimmedKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );
  } catch {
    const err: PlannerError = {
      code: 'network',
      message:
        'Network error reaching Gemini API. Check your connection and retry. (নেটওয়ার্ক ত্রুটি হয়েছে — ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।)',
    };
    throw err;
  }

  let apiJson: {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  try {
    apiJson = (await response.json()) as typeof apiJson;
  } catch {
    const err: PlannerError = {
      code: 'parse',
      message:
        'Received an unreadable response from Gemini API. Please retry. (API থেকে অস্পষ্ট রেসপন্স এসেছে — আবার চেষ্টা করুন।)',
    };
    throw err;
  }

  if (!response.ok) {
    throw mapHttpError(resStatusOrFallback(response.status), apiJson.error?.message ?? '', cleanModel);
  }

  const rawText = apiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText.trim()) {
    const err: PlannerError = {
      code: 'parse',
      message:
        'Gemini returned an empty response. Try refining your prompt and retry. (Gemini কোনো দৃশ্য তৈরি করেনি — আপনার লেখাটি সামান্য পরিবর্তন করে আবার চেষ্টা করুন।)',
    };
    throw err;
  }

  let parsed: RawPlanPayload;
  try {
    parsed = JSON.parse(stripMarkdownFences(rawText)) as RawPlanPayload;
  } catch {
    const err: PlannerError = {
      code: 'parse',
      message:
        'Could not parse the generated video plan JSON. Please click Retry. (জেনারেট করা JSON পড়া যায়নি — অনুগ্রহ করে আবার চেষ্টা করুন।)',
    };
    throw err;
  }

  const rawScenes = Array.isArray(parsed.scenes)
    ? (parsed.scenes as RawSceneInput[]).slice(0, 6)
    : [];

  if (rawScenes.length === 0) {
    const err: PlannerError = {
      code: 'parse',
      message:
        'No scenes were generated in the plan. Please try again. (কোনো scene পাওয়া যায়নি — অনুগ্রহ করে আবার চেষ্টা করুন।)',
    };
    throw err;
  }

  let cursorSec = 0;
  const normalizedScenes: VideoScene[] = rawScenes.map((scene, idx) => {
    const rawStart = Number(scene.startSec);
    const rawEnd = Number(scene.endSec);
    const duration =
      Number.isFinite(rawStart) && Number.isFinite(rawEnd) && rawEnd > rawStart
        ? Math.max(2, Math.min(15, Math.round(rawEnd - rawStart)))
        : 5;

    const startSec = cursorSec;
    const endSec = startSec + duration;
    cursorSec = endSec;

    const bgArray = Array.isArray(scene.bgGradient) ? scene.bgGradient : [];
    const bg0 = sanitizeHex(bgArray[0], '#0B0D12');
    const bg1 = sanitizeHex(bgArray[1], idx % 2 === 0 ? '#181E38' : '#211638');
    const accent = sanitizeHex(scene.accentColor, '#6366F1');

    return {
      id:
        typeof scene.id === 'string' && scene.id.trim()
          ? scene.id.trim()
          : `scene-${idx + 1}`,
      startSec,
      endSec,
      headline:
        typeof scene.headline === 'string' && scene.headline.trim()
          ? scene.headline.trim()
          : `Scene ${idx + 1}`,
      subtext:
        typeof scene.subtext === 'string' ? scene.subtext.trim() : '',
      caption:
        typeof scene.caption === 'string' && scene.caption.trim()
          ? scene.caption.trim()
          : typeof scene.headline === 'string'
            ? scene.headline.trim()
            : '',
      motionStyle: sanitizeMotionStyle(scene.motionStyle, idx),
      bgGradient: [bg0, bg1],
      accentColor: accent,
    };
  });

  const totalDurationSec = cursorSec;
  const title =
    typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : params.templateTitle ?? 'Untitled Motion Video';
  const theme =
    typeof parsed.theme === 'string' && parsed.theme.trim()
      ? parsed.theme.trim()
      : 'Dark studio kinetic motion with electric indigo accents';

  const generatedRenderCode =
    typeof parsed.renderCode === 'string' && parsed.renderCode.trim().length > 40
      ? parsed.renderCode.trim()
      : buildCanvasRenderCode({
          title,
          aspectRatio: params.aspectRatio,
          totalDurationSec,
          scenes: normalizedScenes,
        });

  return {
    id: `proj_${Date.now()}`,
    title,
    mode: params.mode,
    promptText: params.promptText.trim(),
    aspectRatio: params.aspectRatio,
    totalDurationSec,
    theme,
    scenes: normalizedScenes,
    renderCode: generatedRenderCode,
    timestamp: new Date().toISOString(),
    templateId: params.templateId,
    templateTitle: params.templateTitle,
  };
}

function resStatusOrFallback(status: number): number {
  return Number.isFinite(status) ? status : 500;
}
