import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import type { AspectRatio, InputMode, VideoScene } from '@/types/studio';

interface GenerateRequestBody {
  apiKey?: unknown;
  mode?: unknown;
  promptText?: unknown;
  aspectRatio?: unknown;
  templateTitle?: unknown;
  styleDirection?: unknown;
}

interface GeneratedBlueprintPayload {
  title?: string;
  scenes?: Array<{
    durationSec?: number;
    headline?: string;
    visualCue?: string;
    motionDirective?: string;
    voiceover?: string;
  }>;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Video blueprint generation failed.';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const promptText = typeof body.promptText === 'string' ? body.promptText.trim() : '';
    const mode: InputMode = body.mode === 'script' ? 'script' : 'describe';
    const aspectRatio: AspectRatio =
      body.aspectRatio === '16:9' || body.aspectRatio === '1:1' ? body.aspectRatio : '9:16';
    const templateTitle =
      typeof body.templateTitle === 'string' && body.templateTitle.trim()
        ? body.templateTitle.trim()
        : undefined;
    const styleDirection =
      typeof body.styleDirection === 'string' && body.styleDirection.trim()
        ? body.styleDirection.trim()
        : 'Modern dark-mode kinetic motion design with crisp typography and smooth easing.';

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Missing Gemini API key. Add your key in Profile first.' },
        { status: 400 }
      );
    }

    if (!promptText) {
      return NextResponse.json(
        { ok: false, error: 'Please provide a topic or script before generating.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const userContext = [
      `Input Mode: ${mode === 'script' ? 'Exact Script Provided' : 'Topic / Idea Description'}`,
      `Aspect Ratio: ${aspectRatio}`,
      templateTitle ? `Selected Template: ${templateTitle}` : 'Selected Template: Custom Composition',
      `Visual Style Direction: ${styleDirection}`,
      `User Input:\n${promptText}`,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userContext,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        systemInstruction:
          'You are a code-driven motion graphics director. Convert the user input into a tight, production-ready 3 to 5 scene video blueprint with crisp headlines, visual cues, motion directives (easing, scale, slide, reveal), and concise voiceover/caption lines.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short 3-6 word project title.',
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  durationSec: {
                    type: Type.INTEGER,
                    description: 'Duration of this scene in seconds (3 to 12).',
                  },
                  headline: {
                    type: Type.STRING,
                    description: 'On-screen focal headline text (max 8 words).',
                  },
                  visualCue: {
                    type: Type.STRING,
                    description: 'Layout and visual composition description.',
                  },
                  motionDirective: {
                    type: Type.STRING,
                    description: 'Specific code animation behavior (e.g. spring scale-in, slide up).',
                  },
                  voiceover: {
                    type: Type.STRING,
                    description: 'Spoken narration or timed caption line.',
                  },
                },
                required: ['durationSec', 'headline', 'visualCue', 'motionDirective', 'voiceover'],
              },
            },
          },
          required: ['title', 'scenes'],
        },
      },
    });

    const rawJson = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawJson) as GeneratedBlueprintPayload;

    const scenes: VideoScene[] = (parsed.scenes ?? []).slice(0, 6).map((scene, idx) => ({
      index: idx + 1,
      durationSec: Math.max(2, Math.min(20, Number(scene.durationSec) || 5)),
      headline: (scene.headline ?? `Scene ${idx + 1}`).trim(),
      visualCue: (scene.visualCue ?? 'Centered focal composition').trim(),
      motionDirective: (scene.motionDirective ?? 'Ease-out fade and upward translate').trim(),
      voiceover: (scene.voiceover ?? '').trim(),
    }));

    if (scenes.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Model returned an empty scene list. Please try refining your prompt.' },
        { status: 502 }
      );
    }

    const totalDurationSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);

    return NextResponse.json({
      ok: true,
      title: (parsed.title ?? templateTitle ?? 'Untitled Video').trim(),
      totalDurationSec,
      scenes,
    });
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    const normalized = message.toLowerCase();
    const isAuthError =
      normalized.includes('api_key_invalid') ||
      normalized.includes('api key not valid') ||
      normalized.includes('permission_denied') ||
      normalized.includes('401') ||
      normalized.includes('403');

    return NextResponse.json(
      {
        ok: false,
        error: isAuthError
          ? 'Your Gemini API key was rejected. Please verify or replace it in Profile.'
          : message,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
