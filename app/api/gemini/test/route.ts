import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Failed to verify Gemini API key.';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { apiKey?: unknown };
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid Gemini API key.' },
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

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: 'Respond with exactly: OK',
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const reply = (response.text ?? '').trim();

    return NextResponse.json({
      ok: true,
      model: 'gemini-4-hydrogen',
      reply: reply || 'OK',
      verifiedAt: new Date().toISOString(),
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
          ? 'This Gemini API key was rejected. Double-check the key in Google AI Studio and try again.'
          : message,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
