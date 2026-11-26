'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Clapperboard,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { CanvasVideoPlayer } from '@/components/CanvasVideoPlayer';
import { generateVideoPlan, type PlannerError } from '@/lib/gemini-planner';
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
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isKeyIssue: boolean;
  } | null>(null);
  const [needsKeyPrompt, setNeedsKeyPrompt] = useState(false);

  async function handleGenerate() {
    setErrorInfo(null);

    if (!hasApiKey || !apiKey.trim()) {
      setNeedsKeyPrompt(true);
      return;
    }

    if (!promptText.trim()) {
      setErrorInfo({
        isKeyIssue: false,
        message:
          mode === 'describe'
            ? 'Please describe your video idea first. (অনুগ্রহ করে ভিডিওর বিষয়টি লিখুন।)'
            : 'Please enter or paste your script first. (অনুগ্রহ করে আপনার স্ক্রিপ্ট লিখুন বা পেস্ট করুন।)',
      });
      return;
    }

    setNeedsKeyPrompt(false);
    setIsGenerating(true);

    try {
      const project = await generateVideoPlan({
        apiKey,
        mode,
        promptText,
        aspectRatio,
        templateId: selectedTemplate?.id,
        templateTitle: selectedTemplate?.title,
        styleDirection: selectedTemplate?.styleDirection,
      });

      onProjectGenerated(project);
    } catch (err: unknown) {
      const plannerErr = err as Partial<PlannerError>;
      setErrorInfo({
        isKeyIssue:
          plannerErr.code === 'missing_key' || plannerErr.code === 'invalid_key',
        message:
          plannerErr.message ??
          'Unexpected error while generating video plan. Please retry.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 border-b border-[#232938] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          New Project
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Generate multi-scene code-driven motion videos and preview them live on Canvas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Prompt */}
        <div className="lg:col-span-5 space-y-5">
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

          <section className="rounded-2xl bg-[#141821] border border-[#232938] p-5 space-y-5">
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
                  {mode === 'describe'
                    ? 'Topic or Video Idea'
                    : 'Full Voiceover or Caption Script'}
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
                  if (errorInfo) setErrorInfo(null);
                }}
                rows={5}
                placeholder={
                  mode === 'describe'
                    ? 'Example: Create a 20-second vertical explainer on why local-first apps keep user data private and instant...'
                    : 'Paste or write your script line by line. Each beat becomes a timed animated scene...'
                }
                className="w-full min-h-[140px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] p-4 text-sm sm:text-base text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-300">
                Aspect Ratio
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {ASPECT_OPTIONS.map((option) => {
                  const selected = aspectRatio === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onAspectRatioChange(option.value)}
                      aria-pressed={selected}
                      className={`min-h-[52px] flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
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
                      <span className="font-mono tabular-nums">{option.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Missing Key Alert */}
            {(!hasApiKey || needsKeyPrompt) && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <KeyRound
                    className="h-5 w-5 text-amber-300 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-amber-100">
                      Gemini API key required
                    </p>
                    <p className="text-xs text-amber-200/80">
                      Save your personal Gemini API key in Profile to generate videos. (ভিডিও তৈরি করতে Profile থেকে আপনার Gemini API key যোগ করুন।)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="min-h-[44px] w-full rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  Go to Profile &amp; Add API Key
                </button>
              </div>
            )}

            {/* Generation Error Alert with Retry */}
            {errorInfo && (
              <div
                role="alert"
                className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 space-y-3"
              >
                <div className="flex items-start gap-3 text-sm text-rose-200">
                  <AlertCircle
                    className="h-5 w-5 text-rose-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{errorInfo.message}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 px-3.5 py-2 text-xs font-medium text-rose-100 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                  {errorInfo.isKeyIssue && (
                    <button
                      type="button"
                      onClick={onGoToProfile}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-3.5 py-2 text-xs font-medium text-white transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Check Key in Profile</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Generate Video CTA */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden="true" />
                  <span>Generating Motion Video...</span>
                </>
              ) : (
                <>
                  <Clapperboard className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{activeProject ? 'Regenerate Video' : 'Generate Video'}</span>
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Live Canvas Video Player & Scene Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          <CanvasVideoPlayer
            key={activeProject?.id ?? 'empty-stage'}
            project={activeProject}
            previewAspectRatio={aspectRatio}
          />

          {activeProject && (
            <section
              aria-label="Generated Scene Breakdown"
              className="rounded-2xl bg-[#141821] border border-[#232938] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232938] pb-3">
                <h2 className="font-display text-base font-semibold text-white">
                  Scene Breakdown
                </h2>
                <span className="text-xs text-slate-400 truncate max-w-xs">
                  {activeProject.theme}
                </span>
              </div>

              <div className="divide-y divide-[#232938]">
                {activeProject.scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="py-3.5 first:pt-0 last:pb-0 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono tabular-nums text-[#A5B4FC]">
                        Scene {String(idx + 1).padStart(2, '0')} · {scene.motionStyle}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        {scene.startSec}s – {scene.endSec}s
                      </span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-semibold text-white">
                      {scene.headline}
                    </h3>
                    {scene.subtext && (
                      <p className="text-xs sm:text-sm text-slate-300">
                        {scene.subtext}
                      </p>
                    )}
                    {scene.caption && (
                      <p className="text-xs text-slate-400 italic">
                        Caption: &ldquo;{scene.caption}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
