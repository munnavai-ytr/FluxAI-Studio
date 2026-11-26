'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Clapperboard,
  Cpu,
  FileText,
  KeyRound,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { CanvasVideoPlayer } from '@/components/CanvasVideoPlayer';
import { CURATED_GEMINI_MODELS, findCuratedModel } from '@/lib/gemini-models';
import {
  buildCanvasRenderCode,
  generateVideoPlan,
  type PlannerError,
} from '@/lib/gemini-planner';
import type {
  AspectRatio,
  InputMode,
  VideoProject,
  VideoScene,
  VideoTemplate,
} from '@/types/studio';

interface NewProjectViewProps {
  apiKey: string;
  hasApiKey: boolean;
  selectedModel: string;
  mode: InputMode;
  promptText: string;
  aspectRatio: AspectRatio;
  selectedTemplate: VideoTemplate | null;
  activeProject: VideoProject | null;
  onModeChange: (mode: InputMode) => void;
  onPromptTextChange: (text: string) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onSelectModel: (modelId: string) => void;
  onClearTemplate: () => void;
  onProjectGenerated: (project: VideoProject) => void;
  onUpdateActiveProject: (project: VideoProject) => void;
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
  selectedModel,
  mode,
  promptText,
  aspectRatio,
  selectedTemplate,
  activeProject,
  onModeChange,
  onPromptTextChange,
  onAspectRatioChange,
  onSelectModel,
  onClearTemplate,
  onProjectGenerated,
  onUpdateActiveProject,
  onGoToProfile,
}: NewProjectViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isKeyIssue: boolean;
    isModelIssue: boolean;
  } | null>(null);
  const [needsKeyPrompt, setNeedsKeyPrompt] = useState(false);

  const curatedMatch = findCuratedModel(selectedModel);

  async function handleGenerate() {
    setErrorInfo(null);

    if (!hasApiKey || !apiKey.trim()) {
      setNeedsKeyPrompt(true);
      return;
    }

    if (!promptText.trim()) {
      setErrorInfo({
        isKeyIssue: false,
        isModelIssue: false,
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
        model: selectedModel,
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
        isModelIssue:
          plannerErr.code === 'invalid_model' || plannerErr.code === 'quota',
        message:
          plannerErr.message ??
          'Unexpected error while generating video plan. Please retry.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSceneUpdate(
    sceneIndex: number,
    patch: { durationDelta?: number; caption?: string }
  ) {
    if (!activeProject) return;

    let cursor = 0;
    const updatedScenes: VideoScene[] = activeProject.scenes.map((scene, idx) => {
      const currentDuration = Math.max(2, Math.round(scene.endSec - scene.startSec));
      const nextDuration =
        idx === sceneIndex && typeof patch.durationDelta === 'number'
          ? Math.max(2, Math.min(20, currentDuration + patch.durationDelta))
          : currentDuration;

      const startSec = cursor;
      const endSec = startSec + nextDuration;
      cursor = endSec;

      return {
        ...scene,
        startSec,
        endSec,
        caption:
          idx === sceneIndex && typeof patch.caption === 'string'
            ? patch.caption
            : scene.caption,
      };
    });

    const updatedProject: VideoProject = {
      ...activeProject,
      totalDurationSec: cursor,
      scenes: updatedScenes,
      renderCode: buildCanvasRenderCode({
        title: activeProject.title,
        aspectRatio: activeProject.aspectRatio,
        totalDurationSec: cursor,
        scenes: updatedScenes,
      }),
    };

    onUpdateActiveProject(updatedProject);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#232938] pb-5">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            New Project
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Generate multi-scene code-driven motion videos and export directly from Canvas.
          </p>
        </div>

        {/* Active Model Quick Indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-[#141821] border border-[#232938] px-3 py-2 self-start sm:self-auto">
          <Cpu className="h-4 w-4 text-[#8B5CF6] shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-xs font-mono text-white truncate block max-w-[180px]">
              {selectedModel}
            </span>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${
              curatedMatch?.tierTone === 'pro'
                ? 'bg-indigo-500/15 text-indigo-300'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {curatedMatch ? curatedMatch.badge : 'Custom'}
          </span>
          <button
            type="button"
            onClick={onGoToProfile}
            className="text-xs font-medium text-[#A5B4FC] hover:text-white underline underline-offset-2 whitespace-nowrap ml-1"
          >
            Change
          </button>
        </div>
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
            {/* Quick Model Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="quick-model-select"
                  className="text-xs font-medium text-slate-300"
                >
                  Gemini Model
                </label>
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="text-xs text-[#A5B4FC] hover:text-white transition-colors"
                >
                  Custom ID in Profile
                </button>
              </div>
              <select
                id="quick-model-select"
                value={curatedMatch ? selectedModel : '__custom__'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    onGoToProfile();
                  } else {
                    onSelectModel(val);
                    setErrorInfo(null);
                  }
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] px-3.5 py-2 text-xs sm:text-sm text-white outline-none transition-colors"
              >
                {CURATED_GEMINI_MODELS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.id} — {preset.badge}
                  </option>
                ))}
                {!curatedMatch && (
                  <option value="__custom__">
                    Custom: {selectedModel}
                  </option>
                )}
              </select>
            </div>

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
                  {(errorInfo.isKeyIssue || errorInfo.isModelIssue) && (
                    <button
                      type="button"
                      onClick={onGoToProfile}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-3.5 py-2 text-xs font-medium text-white transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {errorInfo.isModelIssue
                          ? 'Switch Model in Profile'
                          : 'Check Key in Profile'}
                      </span>
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

        {/* Right Column: Live Canvas Video Player & Editable Scene Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          <CanvasVideoPlayer
            key={activeProject?.id ?? 'empty-stage'}
            project={activeProject}
            previewAspectRatio={aspectRatio}
          />

          {activeProject && (
            <section
              aria-label="Scene Timing and Captions"
              className="rounded-2xl bg-[#141821] border border-[#232938] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232938] pb-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Scene Timing &amp; Captions
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tweak scene durations or caption text before exporting.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#A5B4FC]">
                  Total: {activeProject.totalDurationSec}s
                </span>
              </div>

              <div className="divide-y divide-[#232938]">
                {activeProject.scenes.map((scene, idx) => {
                  const durationSec = Math.max(
                    2,
                    Math.round(scene.endSec - scene.startSec)
                  );
                  return (
                    <div
                      key={scene.id}
                      className="py-4 first:pt-0 last:pb-0 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono tabular-nums text-[#A5B4FC]">
                          Scene {String(idx + 1).padStart(2, '0')} · {scene.motionStyle} ·{' '}
                          {scene.startSec}s–{scene.endSec}s
                        </span>

                        {/* Duration Stepper */}
                        <div className="inline-flex items-center gap-1 rounded-lg bg-[#0B0D12] border border-[#232938] p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleSceneUpdate(idx, { durationDelta: -1 })
                            }
                            disabled={durationSec <= 2}
                            aria-label={`Decrease scene ${idx + 1} duration`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-300 hover:bg-[#1B2130] disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="px-2 text-xs font-mono tabular-nums text-white">
                            {durationSec}s
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleSceneUpdate(idx, { durationDelta: 1 })
                            }
                            disabled={durationSec >= 20}
                            aria-label={`Increase scene ${idx + 1} duration`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-300 hover:bg-[#1B2130] disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-display text-sm sm:text-base font-semibold text-white">
                        {scene.headline}
                      </h3>

                      <div className="space-y-1">
                        <label
                          htmlFor={`scene-caption-${scene.id}`}
                          className="block text-[11px] font-medium text-slate-400"
                        >
                          Synced Caption
                        </label>
                        <input
                          id={`scene-caption-${scene.id}`}
                          type="text"
                          value={scene.caption}
                          onChange={(e) =>
                            handleSceneUpdate(idx, { caption: e.target.value })
                          }
                          placeholder="Enter synced caption for this scene..."
                          className="w-full min-h-[40px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
