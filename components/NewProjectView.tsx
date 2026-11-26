'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Clapperboard,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AspectRatio,
  InputMode,
  VideoProject,
  VideoTemplate,
} from '@/types/studio';

interface NewProjectViewProps {
  apiKey: string;
  hasApiKey: boolean;
  mode: InputMode;
  promptText: string;
  aspectRatio: AspectRatio;
  selectedTemplate: VideoTemplate | null;
  activeProject: VideoProject | null;
  onModeChange: (mode: InputMode) => void;
  onPromptTextChange: (text: string) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onClearTemplate: () => void;
  onProjectGenerated: (project: VideoProject) => void;
  onGoToProfile: () => void;
}

const ASPECT_OPTIONS: Array<{
  value: AspectRatio;
  label: string;
  frameClass: string;
}> = [
  { value: '9:16', label: 'Portrait', frameClass: 'h-5 w-3' },
  { value: '16:9', label: 'Widescreen', frameClass: 'h-3.5 w-6' },
  { value: '1:1', label: 'Square', frameClass: 'h-4 w-4' },
];

export function NewProjectView({
  apiKey,
  hasApiKey,
  mode,
  promptText,
  aspectRatio,
  selectedTemplate,
  activeProject,
  onModeChange,
  onPromptTextChange,
  onAspectRatioChange,
  onClearTemplate,
  onProjectGenerated,
  onGoToProfile,
}: NewProjectViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsKeyPrompt, setNeedsKeyPrompt] = useState(false);

  async function handleGenerate() {
    setErrorMsg(null);

    if (!hasApiKey) {
      setNeedsKeyPrompt(true);
      return;
    }

    if (!promptText.trim()) {
      setErrorMsg(
        mode === 'describe'
          ? 'Describe your video topic or idea before generating.'
          : 'Enter or paste your video script before generating.'
      );
      return;
    }

    setNeedsKeyPrompt(false);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          mode,
          promptText,
          aspectRatio,
          templateTitle: selectedTemplate?.title,
          styleDirection: selectedTemplate?.styleDirection,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        title?: string;
        totalDurationSec?: number;
        scenes?: VideoProject['scenes'];
      };

      if (!response.ok || !data.ok || !data.scenes) {
        setErrorMsg(data.error ?? 'Could not generate video blueprint. Please try again.');
        return;
      }

      const newProject: VideoProject = {
        id: `proj_${Date.now()}`,
        title: data.title || selectedTemplate?.title || 'Untitled Video',
        mode,
        promptText: promptText.trim(),
        aspectRatio,
        templateId: selectedTemplate?.id,
        templateTitle: selectedTemplate?.title,
        createdAt: new Date().toISOString(),
        totalDurationSec: data.totalDurationSec ?? 15,
        scenes: data.scenes,
      };

      onProjectGenerated(newProject);
    } catch {
      setErrorMsg('Network error while connecting to Gemini. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1.5 border-b border-[#232938] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          New Project
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Choose an input mode, set your frame ratio, and generate a structured motion blueprint.
        </p>
      </header>

      {/* Active Template Strip */}
      {selectedTemplate && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#141821] border border-[#6366F1]/40 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-[#A5B4FC] font-medium">Active Template</p>
            <p className="text-sm font-medium text-white truncate">
              {selectedTemplate.title} · {selectedTemplate.aspectRatio}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearTemplate}
            aria-label="Clear selected template"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#1C2230] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Workspace Card */}
      <section className="rounded-2xl bg-[#141821] border border-[#232938] p-5 sm:p-6 space-y-6">
        {/* Mode Toggle */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-300">
            Input Mode
          </span>
          <div
            role="tablist"
            aria-label="Video Input Mode"
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#0B0D12] border border-[#232938] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'describe'}
              onClick={() => onModeChange('describe')}
              className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                mode === 'describe'
                  ? 'bg-[#1D2333] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[#8B5CF6]" aria-hidden="true" />
              <span>Describe</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'script'}
              onClick={() => onModeChange('script')}
              className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                mode === 'script'
                  ? 'bg-[#1D2333] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 text-[#6366F1]" aria-hidden="true" />
              <span>Script</span>
            </button>
          </div>
        </div>

        {/* Textarea Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="project-prompt-input"
              className="text-xs font-medium text-slate-300"
            >
              {mode === 'describe' ? 'Topic or Video Idea' : 'Full Voiceover or Caption Script'}
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {promptText.length} chars
            </span>
          </div>

          <textarea
            id="project-prompt-input"
            value={promptText}
            onChange={(e) => {
              onPromptTextChange(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            rows={6}
            placeholder={
              mode === 'describe'
                ? 'Example: Create a 20-second vertical explainer showing how local-first apps keep user data private and instant...'
                : 'Paste or write your script line by line. Each line can become a timed motion beat...'
            }
            className="w-full min-h-[160px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] p-4 text-sm sm:text-base text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
          />
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-300">
            Aspect Ratio
          </span>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_OPTIONS.map((option) => {
              const selected = aspectRatio === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onAspectRatioChange(option.value)}
                  aria-pressed={selected}
                  className={`min-h-[56px] flex flex-col sm:flex-row items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                    selected
                      ? 'bg-[#6366F1]/15 border-[#6366F1] text-white'
                      : 'bg-[#0B0D12] border-[#232938] text-slate-400 hover:text-white hover:border-[#343D54]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`rounded-[3px] border-2 ${option.frameClass} ${
                      selected ? 'border-[#A5B4FC]' : 'border-slate-500'
                    }`}
                  />
                  <span className="font-mono tabular-nums text-xs sm:text-sm">
                    {option.value}
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-400">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Missing Key Prompt */}
        {(!hasApiKey || needsKeyPrompt) && (
          <div
            role="status"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4"
          >
            <div className="flex items-start gap-3">
              <KeyRound className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-100">
                  Gemini API key required
                </p>
                <p className="text-xs text-amber-200/80">
                  Add your personal Gemini API key in Profile to generate videos locally.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToProfile}
              className="min-h-[44px] shrink-0 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Add Key in Profile
            </button>
          </div>
        )}

        {/* Inline Error Message */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-200"
          >
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Generate CTA */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden="true" />
              <span>Generating Video Blueprint...</span>
            </>
          ) : (
            <>
              <Clapperboard className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Generate Video</span>
            </>
          )}
        </button>
      </section>

      {/* Generated Storyboard Output */}
      {activeProject && (
        <section
          aria-label="Generated Video Blueprint"
          className="rounded-2xl bg-[#141821] border border-[#232938] p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#232938]">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                {activeProject.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                {activeProject.aspectRatio} · {activeProject.scenes.length} scenes ·{' '}
                {activeProject.totalDurationSec}s total
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-400">
              Saved to Profile History
            </span>
          </div>

          <div className="divide-y divide-[#232938]">
            {activeProject.scenes.map((scene) => (
              <div key={scene.index} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono tabular-nums text-[#A5B4FC]">
                    Scene {String(scene.index).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {scene.durationSec}s
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-white">
                  {scene.headline}
                </h3>
                <p className="text-sm text-slate-300">{scene.visualCue}</p>
                <p className="text-xs text-slate-400">
                  Motion: {scene.motionDirective}
                </p>
                {scene.voiceover && (
                  <p className="text-xs text-slate-300 italic pt-1">
                    &ldquo;{scene.voiceover}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
