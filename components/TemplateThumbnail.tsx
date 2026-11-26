'use client';

import type { AspectRatio, TemplateVisualKind } from '@/types/studio';

interface TemplateThumbnailProps {
  kind: TemplateVisualKind;
  aspectRatio: Extract<AspectRatio, '9:16' | '16:9'>;
  durationLabel: string;
}

export function TemplateThumbnail({
  kind,
  aspectRatio,
  durationLabel,
}: TemplateThumbnailProps) {
  return (
    <div className="relative h-44 w-full overflow-hidden bg-[#0B0D12] border-b border-[#232938] select-none">
      {/* Subtle Grid Texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.22) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Ambient Accent Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/20 blur-2xl"
      />

      {/* Aspect Ratio & Duration Indicators */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-[#0B0D12]/85 border border-[#232938] px-2.5 py-1 text-[11px] font-mono tabular-nums text-slate-200 backdrop-blur-sm">
        <span>{aspectRatio}</span>
      </div>

      <div className="absolute bottom-3 left-3 z-10 rounded-md bg-[#0B0D12]/80 border border-[#232938] px-2 py-0.5 text-[11px] font-mono tabular-nums text-slate-300">
        {durationLabel}
      </div>

      {/* Bespoke Code-Driven Motion Preview Composition */}
      <div className="relative z-0 flex h-full w-full items-center justify-center p-4">
        {kind === 'kinetic-typography' && (
          <div className="flex h-32 w-20 flex-col items-center justify-center rounded-xl border border-[#6366F1]/40 bg-gradient-to-b from-[#171B2B] to-[#0E1118] px-2 text-center shadow-lg transition-transform duration-300 group-hover:scale-105">
            <span className="font-display text-lg font-bold leading-none tracking-tight text-white">
              90%
            </span>
            <span className="mt-1 font-display text-[10px] font-semibold uppercase tracking-wider text-[#A5B4FC]">
              Drop Off
            </span>
            <span className="mt-1.5 h-0.5 w-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
            <span className="mt-1.5 font-mono text-[9px] text-slate-400">in 3.0s</span>
          </div>
        )}

        {kind === 'tech-explainer' && (
          <div className="flex h-28 w-48 flex-col justify-between rounded-xl border border-[#2A3245] bg-[#111521] p-3 shadow-lg transition-transform duration-300 group-hover:scale-[1.03]">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Edge Node</span>
              <span className="text-emerald-400 tabular-nums">18ms</span>
            </div>
            <div className="flex items-center justify-between gap-2 my-auto">
              <div className="h-7 w-10 rounded-md border border-[#232938] bg-[#191F2E] flex items-center justify-center text-[9px] font-mono text-slate-300">
                API
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
              <div className="h-7 w-12 rounded-md border border-[#6366F1]/50 bg-[#6366F1]/15 flex items-center justify-center text-[9px] font-mono text-[#C4B5FD]">
                CDN
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#8B5CF6] to-emerald-400/70" />
              <div className="h-7 w-10 rounded-md border border-[#232938] bg-[#191F2E] flex items-center justify-center text-[9px] font-mono text-slate-300">
                App
              </div>
            </div>
            <div className="h-1.5 w-24 rounded-full bg-[#232938]" />
          </div>
        )}

        {kind === 'viral-story' && (
          <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-105">
            <div className="h-28 w-16 rounded-lg border border-[#232938] bg-[#141821] p-2 flex flex-col justify-between opacity-65 -rotate-3">
              <div className="h-1.5 w-8 rounded-full bg-slate-600" />
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded bg-slate-700" />
                <div className="h-1.5 w-2/3 rounded bg-slate-700" />
              </div>
            </div>
            <div className="h-32 w-20 rounded-xl border border-[#8B5CF6]/50 bg-gradient-to-b from-[#1B2032] to-[#111521] p-2.5 flex flex-col justify-between shadow-lg">
              <span className="font-mono text-[9px] text-[#A5B4FC]">Scene 02</span>
              <p className="font-display text-[11px] font-semibold leading-tight text-white">
                Shipped in 48 hours.
              </p>
              <div className="h-1 w-full rounded-full bg-[#232938] overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
              </div>
            </div>
          </div>
        )}

        {kind === 'data-motion' && (
          <div className="flex h-28 w-48 flex-col justify-between rounded-xl border border-[#2A3245] bg-[#111521] p-3 shadow-lg transition-transform duration-300 group-hover:scale-[1.03]">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium text-slate-400">Growth</span>
              <span className="font-mono text-xs font-semibold text-white tabular-nums">
                184K
              </span>
            </div>
            <div className="flex items-end gap-2 h-14 pt-1">
              <div className="flex-1 h-4 rounded-t bg-[#232938]" />
              <div className="flex-1 h-7 rounded-t bg-[#2E364D]" />
              <div className="flex-1 h-10 rounded-t bg-[#4F46E5]/70" />
              <div className="flex-1 h-14 rounded-t bg-gradient-to-t from-[#6366F1] to-[#8B5CF6]" />
            </div>
          </div>
        )}

        {kind === 'quote-lyric' && (
          <div className="flex h-32 w-22 flex-col items-center justify-center rounded-xl border border-[#2A3245] bg-gradient-to-br from-[#191D2E] via-[#121622] to-[#0B0D12] px-3 text-center shadow-lg transition-transform duration-300 group-hover:scale-105">
            <span className="font-display text-xs font-medium leading-snug text-white">
              &ldquo;Subtract the obvious.&rdquo;
            </span>
            <span className="mt-2 h-px w-6 bg-[#8B5CF6]" />
            <span className="mt-1.5 text-[9px] text-slate-400">John Maeda</span>
          </div>
        )}

        {kind === 'product-spotlight' && (
          <div className="relative flex h-28 w-48 items-center justify-center rounded-xl border border-[#2A3245] bg-gradient-to-b from-[#171C2B] to-[#0E1118] p-3 shadow-lg transition-transform duration-300 group-hover:scale-[1.03]">
            <div className="relative flex flex-col items-center">
              <div className="h-10 w-24 rounded-lg border border-[#6366F1]/50 bg-gradient-to-b from-[#232938] to-[#141821] shadow-md flex items-center justify-center">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-2.5 rounded-[2px] ${
                        i === 4 ? 'bg-[#8B5CF6]' : 'bg-slate-600/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-[#6366F1]/60 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
