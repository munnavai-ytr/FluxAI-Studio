'use client';

import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { STARTER_TEMPLATES } from '@/lib/templates';
import { TemplateThumbnail } from '@/components/TemplateThumbnail';
import type { VideoTemplate } from '@/types/studio';

interface HomeViewProps {
  hasApiKey: boolean;
  onUseTemplate: (template: VideoTemplate) => void;
  onGoToProfile: () => void;
}

export function HomeView({
  hasApiKey,
  onUseTemplate,
  onGoToProfile,
}: HomeViewProps) {
  return (
    <div className="space-y-8">
      {/* Header with App Title & API Status Action */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#232938] pb-6">
        <div className="space-y-1.5 min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            FrameScript Studio
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Pick a code-driven video template to launch in your workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToProfile}
          className={`min-h-[44px] self-start sm:self-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
            hasApiKey
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
              : 'bg-amber-500/10 text-amber-200 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          {hasApiKey ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>API Connected</span>
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>Add API Key</span>
            </>
          )}
        </button>
      </header>

      {/* Starter Video Templates Grid */}
      <section aria-label="Starter Video Templates" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-white">
            Starter Templates
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {STARTER_TEMPLATES.length} templates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STARTER_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="group flex flex-col rounded-2xl bg-[#141821] border border-[#232938] overflow-hidden transition-colors hover:border-[#343D54]"
            >
              <TemplateThumbnail
                kind={template.visualKind}
                aspectRatio={template.aspectRatio}
                durationLabel={template.durationLabel}
              />

              <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{template.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{template.aspectRatio}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{template.durationLabel}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white leading-snug">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {template.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onUseTemplate(template)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B2130] hover:bg-gradient-to-r hover:from-[#6366F1] hover:to-[#8B5CF6] border border-[#2B3347] hover:border-transparent px-4 py-2.5 text-sm font-medium text-white transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  <span>Use Template</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
