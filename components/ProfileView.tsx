'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Film,
  KeyRound,
  Loader2,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  CURATED_GEMINI_MODELS,
  findCuratedModel,
} from '@/lib/gemini-models';
import { testGeminiRestKey } from '@/lib/gemini-planner';
import type { VideoProject } from '@/types/studio';

interface ProfileViewProps {
  apiKey: string;
  hasApiKey: boolean;
  verifiedAt: string | null;
  selectedModel: string;
  projects: VideoProject[];
  onSaveApiKey: (key: string, verifiedAt?: string | null) => void;
  onMarkKeyVerified: (timestamp: string) => void;
  onRemoveApiKey: () => void;
  onSelectModel: (modelId: string) => void;
  onStartNewProject: () => void;
  onOpenProject: (project: VideoProject) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProfileView({
  apiKey,
  hasApiKey,
  verifiedAt,
  selectedModel,
  projects,
  onSaveApiKey,
  onMarkKeyVerified,
  onRemoveApiKey,
  onSelectModel,
  onStartNewProject,
  onOpenProject,
  onDeleteProject,
}: ProfileViewProps) {
  const [draftKey, setDraftKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isPreset = Boolean(findCuratedModel(selectedModel));
  const [customModeOpen, setCustomModeOpen] = useState(!isPreset);
  const [customModelDraft, setCustomModelDraft] = useState(
    !isPreset ? selectedModel : ''
  );
  const [modelNotice, setModelNotice] = useState<string | null>(null);

  function handleSaveKey() {
    const trimmed = draftKey.trim();
    if (!trimmed) {
      setFeedback({
        type: 'error',
        message: 'Enter a Gemini API key before saving.',
      });
      return;
    }

    onSaveApiKey(trimmed, null);
    setDraftKey(trimmed);
    setFeedback({
      type: 'info',
      message:
        'API key saved locally in your browser. Click Test Connection to verify it.',
    });
  }

  async function handleTestConnection() {
    const keyToTest = draftKey.trim() || apiKey.trim();
    if (!keyToTest) {
      setFeedback({
        type: 'error',
        message: 'Enter or save a Gemini API key first.',
      });
      return;
    }

    setIsTesting(true);
    setFeedback(null);

    const result = await testGeminiRestKey(keyToTest, selectedModel);
    setIsTesting(false);

    if (!result.ok) {
      setFeedback({
        type: 'error',
        message: result.error,
      });
      return;
    }

    onSaveApiKey(keyToTest, result.verifiedAt);
    onMarkKeyVerified(result.verifiedAt);
    setDraftKey(keyToTest);
    setFeedback({
      type: 'success',
      message: `Connected successfully using ${result.model}.`,
    });
  }

  function handleRemoveKey() {
    onRemoveApiKey();
    setDraftKey('');
    setShowKey(false);
    setFeedback({
      type: 'info',
      message: 'Gemini API key removed from local browser storage.',
    });
  }

  function handleChoosePreset(modelId: string) {
    setCustomModeOpen(false);
    setModelNotice(null);
    onSelectModel(modelId);
  }

  function handleApplyCustomModel() {
    const trimmed = customModelDraft.trim();
    if (!trimmed) {
      setModelNotice('Enter a custom Gemini model ID before applying.');
      return;
    }
    onSelectModel(trimmed);
    setModelNotice(`Active model set to "${trimmed}".`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1.5 border-b border-[#232938] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Profile &amp; BYOK Settings
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Manage your local Gemini API key, select a model, and replay saved projects.
        </p>
      </header>

      {/* Gemini API Key Manager */}
      <section
        aria-label="Gemini API Key Manager"
        className="rounded-2xl bg-[#141821] border border-[#232938] p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-white">
              Gemini API Key
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Saved only in this browser&apos;s localStorage. Tested against{' '}
              <span className="font-mono text-slate-300">{selectedModel}</span>.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3 py-1 text-xs font-medium border whitespace-nowrap ${
              verifiedAt && hasApiKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : hasApiKey
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800/70 text-slate-300 border-[#232938]'
            }`}
          >
            {verifiedAt && hasApiKey ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>Verified</span>
              </>
            ) : hasApiKey ? (
              <>
                <KeyRound className="h-3.5 w-3.5 text-[#A5B4FC]" aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Not Set</span>
              </>
            )}
          </span>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="gemini-api-key-input"
            className="block text-xs font-medium text-slate-300"
          >
            Google Gemini API Key
          </label>

          <div className="relative flex items-center">
            <input
              id="gemini-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={draftKey}
              onChange={(e) => {
                setDraftKey(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder="AIzaSy..."
              autoComplete="off"
              spellCheck={false}
              className="w-full min-h-[46px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] pl-4 pr-12 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-1 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveKey}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            Save Key
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2C354B] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleRemoveKey}
            disabled={!hasApiKey && !draftKey}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-200 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Remove Key
          </button>
        </div>

        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : feedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-[#0B0D12] border-[#232938] text-slate-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4 text-[#A5B4FC] shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </section>

      {/* Gemini Model Selector */}
      <section
        aria-label="Gemini Model Selector"
        className="rounded-2xl bg-[#141821] border border-[#232938] p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-white">
              Gemini Model Selection
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Free-tier-friendly fast models are listed first. Saved locally in your browser.
            </p>
          </div>
          <span className="text-xs font-mono text-[#A5B4FC] self-start sm:self-auto">
            {selectedModel}
          </span>
        </div>

        <div className="space-y-2.5">
          {CURATED_GEMINI_MODELS.map((preset) => {
            const isSelected = !customModeOpen && selectedModel === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleChoosePreset(preset.id)}
                aria-pressed={isSelected}
                className={`w-full min-h-[56px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  isSelected
                    ? 'bg-[#6366F1]/12 border-[#6366F1]'
                    : 'bg-[#0B0D12] border-[#232938] hover:border-[#343D54]'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-white">
                      {preset.label}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {preset.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{preset.description}</p>
                </div>

                <span
                  className={`self-start sm:self-center shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                    preset.tierTone === 'free'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}

          {/* Custom Model Option */}
          <div
            className={`rounded-xl border p-4 space-y-3 transition-colors ${
              customModeOpen
                ? 'bg-[#6366F1]/10 border-[#6366F1]'
                : 'bg-[#0B0D12] border-[#232938]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setCustomModeOpen(true);
                setModelNotice(null);
              }}
              aria-pressed={customModeOpen}
              className="w-full flex items-center justify-between gap-3 text-left focus-visible:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-[#8B5CF6] shrink-0" aria-hidden="true" />
                <div>
                  <span className="block font-display text-sm font-semibold text-white">
                    Custom Model ID
                  </span>
                  <span className="block text-xs text-slate-400">
                    Type any specific Gemini model name manually
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                {customModeOpen ? 'Active' : 'Configure'}
              </span>
            </button>

            {customModeOpen && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="text"
                  aria-label="Custom Gemini model ID"
                  value={customModelDraft}
                  onChange={(e) => {
                    setCustomModelDraft(e.target.value);
                    if (modelNotice) setModelNotice(null);
                  }}
                  placeholder="e.g. gemini-2.5-flash-preview-05-20"
                  spellCheck={false}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#0B0D12] border border-[#232938] focus:border-[#6366F1] px-3.5 py-2 font-mono text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomModel}
                  className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                  Apply Model
                </button>
              </div>
            )}

            {modelNotice && (
              <p className="text-xs text-[#C4B5FD]">{modelNotice}</p>
            )}
          </div>
        </div>
      </section>

      {/* Project History */}
      <section
        aria-label="Project History"
        className="rounded-2xl bg-[#141821] border border-[#232938] p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#232938] pb-4">
          <h2 className="font-display text-lg font-semibold text-white">
            Project History
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B0D12] border border-[#232938] text-slate-400">
              <Film className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-display text-base font-semibold text-white">
                No saved projects yet
              </h3>
              <p className="text-sm text-slate-400">
                Projects you generate are saved automatically to projectHistory in your browser.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartNewProject}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Start a New Project</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#232938]">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <button
                  type="button"
                  onClick={() => onOpenProject(project)}
                  className="min-w-0 flex-1 text-left space-y-1 rounded-xl p-1 -m-1 hover:bg-[#1B2130]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  <h3 className="font-display text-base font-semibold text-white truncate">
                    {project.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono tabular-nums">{project.aspectRatio}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{project.mode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {project.totalDurationSec}s
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {project.scenes.length} scenes
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {new Date(project.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-4 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                  >
                    <Play className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                    <span>Open &amp; Play</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    aria-label={`Delete ${project.title}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#232938] text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
