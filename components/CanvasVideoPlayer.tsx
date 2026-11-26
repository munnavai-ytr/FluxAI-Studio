'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Captions,
  CaptionsOff,
  Check,
  Code2,
  Copy,
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AspectRatio, VideoProject, VideoScene } from '@/types/studio';

interface CanvasVideoPlayerProps {
  project: VideoProject | null;
  previewAspectRatio: AspectRatio;
}

function getCanvasDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === '9:16') return { width: 720, height: 1280 };
  if (aspectRatio === '16:9') return { width: 1280, height: 720 };
  return { width: 1080, height: 1080 };
}

function formatClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function easeOutCubic(x: number): number {
  const clamped = Math.min(1, Math.max(0, x));
  return 1 - Math.pow(1 - clamped, 3);
}

function easeOutBack(x: number): number {
  const clamped = Math.min(1, Math.max(0, x));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 4
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  lines.push(current);
  return lines.slice(0, maxLines);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function renderSceneFrame(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  timeSec: number,
  width: number,
  height: number,
  showCaptions: boolean
) {
  const total = Math.max(1, project.totalDurationSec);
  const t = Math.min(total - 0.001, Math.max(0, timeSec));

  let activeIndex = project.scenes.findIndex(
    (s) => t >= s.startSec && t < s.endSec
  );
  if (activeIndex === -1) activeIndex = project.scenes.length - 1;
  const scene: VideoScene = project.scenes[activeIndex];

  const sceneDuration = Math.max(0.5, scene.endSec - scene.startSec);
  const sceneElapsed = Math.max(0, t - scene.startSec);
  const sceneProgress = Math.min(1, sceneElapsed / sceneDuration);

  const enterProgress = easeOutCubic(sceneElapsed / 0.55);
  const exitRemaining = scene.endSec - t;
  const exitAlpha = exitRemaining < 0.25 ? Math.max(0.15, exitRemaining / 0.25) : 1;

  // 1. Animated Gradient Background
  const angleShift = Math.sin(t * 0.6) * 0.15;
  const bgGrad = ctx.createLinearGradient(
    width * (0.1 + angleShift),
    0,
    width * (0.9 - angleShift),
    height
  );
  bgGrad.addColorStop(0, scene.bgGradient[0]);
  bgGrad.addColorStop(1, scene.bgGradient[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Ambient Radial Accent Glow
  const glowX = width * (0.5 + Math.cos(t * 0.7) * 0.2);
  const glowY = height * (0.36 + Math.sin(t * 0.5) * 0.1);
  const radial = ctx.createRadialGradient(
    glowX,
    glowY,
    20,
    glowX,
    glowY,
    Math.max(width, height) * 0.55
  );
  radial.addColorStop(0, hexToRgba(scene.accentColor, 0.28));
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Studio Grid Overlay
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridStep = width < 800 ? 64 : 80;
  for (let gx = gridStep; gx < width; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Floating Accent Particles
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const seed = i * 1.37;
    const px = (Math.sin(seed * 4.1 + t * 0.28) * 0.5 + 0.5) * width;
    const py = (Math.cos(seed * 3.3 + t * 0.35 + i * 0.2) * 0.5 + 0.5) * height;
    const radius = 1.5 + (i % 3) * 1.4;
    ctx.fillStyle = hexToRgba(scene.accentColor, 0.18 + (i % 4) * 0.08);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Top Story Progress Segments
  ctx.save();
  const topPad = width < 800 ? 36 : 32;
  const sidePad = Math.round(width * 0.07);
  const segGap = 10;
  const totalBarW = width - sidePad * 2;
  const segCount = project.scenes.length;
  const segW = (totalBarW - segGap * (segCount - 1)) / segCount;

  for (let i = 0; i < segCount; i++) {
    const sx = sidePad + i * (segW + segGap);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    drawRoundedRect(ctx, sx, topPad, segW, 5, 3);
    ctx.fill();

    let fillRatio = 0;
    if (i < activeIndex) fillRatio = 1;
    else if (i === activeIndex) fillRatio = sceneProgress;

    if (fillRatio > 0) {
      ctx.fillStyle = scene.accentColor;
      drawRoundedRect(ctx, sx, topPad, segW * fillRatio, 5, 3);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.font = `600 ${width < 800 ? 22 : 18}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `SCENE ${String(activeIndex + 1).padStart(2, '0')} / ${String(segCount).padStart(2, '0')}`,
    sidePad,
    topPad + 18
  );
  ctx.restore();

  // 5. Scene Motion Style Choreography
  const isPortrait = height > width;
  const headlineSize = isPortrait ? 64 : width === height ? 60 : 58;
  const subtextSize = isPortrait ? 30 : 26;
  const contentMaxWidth = width - sidePad * 2.2;
  const centerY = height * 0.43;

  ctx.save();
  ctx.globalAlpha = enterProgress * exitAlpha;

  if (scene.motionStyle === 'kinetic-pop') {
    const popScale = 0.86 + 0.14 * easeOutBack(sceneElapsed / 0.45);
    ctx.translate(width / 2, centerY);
    ctx.scale(popScale, popScale);
    ctx.translate(-width / 2, -centerY);

    ctx.font = `700 ${headlineSize}px Outfit, "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapTextLines(ctx, scene.headline, contentMaxWidth, 4);
    const lineHeight = headlineSize * 1.16;
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, idx) => {
      const wordDelay = Math.max(0, Math.min(1, (sceneElapsed - idx * 0.08) / 0.35));
      ctx.fillStyle = `rgba(255, 255, 255, ${wordDelay})`;
      ctx.fillText(line, width / 2, startY + idx * lineHeight);
    });

    const barW = Math.min(160, width * 0.22) * easeOutCubic(sceneElapsed / 0.6);
    const afterHeadlineY = startY + lines.length * lineHeight - lineHeight * 0.2;
    ctx.fillStyle = scene.accentColor;
    drawRoundedRect(ctx, width / 2 - barW / 2, afterHeadlineY + 14, barW, 6, 3);
    ctx.fill();

    if (scene.subtext) {
      ctx.font = `500 ${subtextSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const subLines = wrapTextLines(ctx, scene.subtext, contentMaxWidth, 3);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
      subLines.forEach((line, idx) => {
        ctx.fillText(
          line,
          width / 2,
          afterHeadlineY + 56 + idx * (subtextSize * 1.32)
        );
      });
    }
  } else if (scene.motionStyle === 'slide-zoom') {
    const slideX = (1 - easeOutCubic(sceneElapsed / 0.5)) * 70;
    const zoom = 1 + sceneProgress * 0.05;
    ctx.translate(width / 2, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2 - slideX, -centerY);

    const leftX = sidePad * 1.15;
    ctx.font = `700 ${headlineSize}px Outfit, "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const lines = wrapTextLines(ctx, scene.headline, contentMaxWidth - 28, 4);
    const lineHeight = headlineSize * 1.16;
    const blockH = lines.length * lineHeight;
    const startY = centerY - blockH / 2 + lineHeight * 0.4;

    ctx.fillStyle = scene.accentColor;
    drawRoundedRect(ctx, leftX - 24, startY - lineHeight * 0.45, 7, blockH, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, idx) => {
      ctx.fillText(line, leftX, startY + idx * lineHeight);
    });

    if (scene.subtext) {
      ctx.font = `500 ${subtextSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const subLines = wrapTextLines(ctx, scene.subtext, contentMaxWidth - 28, 3);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.86)';
      subLines.forEach((line, idx) => {
        ctx.fillText(
          line,
          leftX,
          startY + lines.length * lineHeight + 24 + idx * (subtextSize * 1.32)
        );
      });
    }
  } else if (scene.motionStyle === 'typewriter-glow') {
    const charWindow = Math.max(0.8, Math.min(2.4, sceneDuration * 0.55));
    const visibleChars = Math.ceil(
      scene.headline.length * Math.min(1, sceneElapsed / charWindow)
    );
    const typedText = scene.headline.slice(0, visibleChars);
    const showCursor = Math.floor(t * 3) % 2 === 0;

    ctx.font = `700 ${headlineSize}px Outfit, "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hexToRgba(scene.accentColor, 0.65);
    ctx.shadowBlur = 24;

    const lines = wrapTextLines(
      ctx,
      `${typedText}${showCursor ? '|' : ''}`,
      contentMaxWidth,
      4
    );
    const lineHeight = headlineSize * 1.18;
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

    ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, startY + idx * lineHeight);
    });

    ctx.shadowBlur = 0;

    if (scene.subtext) {
      const subAlpha = easeOutCubic((sceneElapsed - 0.35) / 0.5);
      ctx.font = `500 ${subtextSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const subLines = wrapTextLines(ctx, scene.subtext, contentMaxWidth, 3);
      ctx.fillStyle = `rgba(226, 232, 240, ${0.88 * subAlpha})`;
      subLines.forEach((line, idx) => {
        ctx.fillText(
          line,
          width / 2,
          startY + lines.length * lineHeight + 24 + idx * (subtextSize * 1.32)
        );
      });
    }
  } else {
    const cardW = width - sidePad * 2;
    const cardH = isPortrait ? height * 0.38 : height * 0.48;
    const cardX = sidePad;
    const cardY = centerY - cardH / 2 + (1 - enterProgress) * 28;

    ctx.fillStyle = 'rgba(11, 13, 18, 0.72)';
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();

    ctx.strokeStyle = hexToRgba(scene.accentColor, 0.55);
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.stroke();

    ctx.font = `700 ${Math.round(headlineSize * 0.92)}px Outfit, "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapTextLines(ctx, scene.headline, cardW - 64, 3);
    const lineHeight = headlineSize * 1.1;
    const headlineStartY =
      cardY + cardH * 0.42 - ((lines.length - 1) * lineHeight) / 2;

    ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, headlineStartY + idx * lineHeight);
    });

    if (scene.subtext) {
      ctx.font = `500 ${Math.round(subtextSize * 0.95)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const subLines = wrapTextLines(ctx, scene.subtext, cardW - 72, 2);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.9)';
      subLines.forEach((line, idx) => {
        ctx.fillText(
          line,
          width / 2,
          headlineStartY + lines.length * lineHeight + 22 + idx * (subtextSize * 1.25)
        );
      });
    }
  }

  ctx.restore();

  // 6. Synced Bottom Caption Bar (Controlled by showCaptions)
  if (showCaptions && scene.caption) {
    ctx.save();
    ctx.globalAlpha = enterProgress * exitAlpha;
    const captionFontSize = isPortrait ? 27 : 24;
    ctx.font = `600 ${captionFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const captionMaxW = width - sidePad * 2.6;
    const captionLines = wrapTextLines(ctx, scene.caption, captionMaxW, 2);
    const boxPadY = 18;
    const boxH = captionLines.length * (captionFontSize * 1.32) + boxPadY * 2;
    const boxW = Math.min(width - sidePad * 1.8, captionMaxW + 48);
    const boxX = (width - boxW) / 2;
    const boxY = height - boxH - (isPortrait ? 88 : 42);

    ctx.fillStyle = 'rgba(11, 13, 18, 0.84)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.stroke();

    ctx.fillStyle = scene.accentColor;
    drawRoundedRect(ctx, boxX + 14, boxY, (boxW - 28) * sceneProgress, 3, 2);
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    captionLines.forEach((line, idx) => {
      const ly = boxY + boxPadY + (idx + 0.5) * (captionFontSize * 1.32);
      ctx.fillText(line, width / 2, ly);
    });
    ctx.restore();
  }
}

function pickSupportedRecorderFormat(): { mimeType: string; ext: string } | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const candidates = [
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
    { mimeType: 'video/mp4', ext: 'mp4' },
  ];

  if (typeof MediaRecorder.isTypeSupported === 'function') {
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    }
  }

  return { mimeType: '', ext: 'webm' };
}

export function CanvasVideoPlayer({
  project,
  previewAspectRatio,
}: CanvasVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(() => Boolean(project));
  const [currentTime, setCurrentTime] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Video export state
  const [isRecording, setIsRecording] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const timeRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const exportCancelledRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeAspectRatio = project?.aspectRatio ?? previewAspectRatio;
  const dims = getCanvasDimensions(activeAspectRatio);

  // Stop any active recording on unmount
  useEffect(() => {
    return () => {
      exportCancelledRef.current = true;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Real-time requestAnimationFrame render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const tick = (now: number) => {
      if (isPlaying) {
        if (lastFrameRef.current !== null) {
          const deltaSec = Math.min(0.1, (now - lastFrameRef.current) / 1000);
          const total = Math.max(1, project.totalDurationSec);

          if (isRecordingRef.current) {
            const nextSec = timeRef.current + deltaSec;
            if (nextSec >= total) {
              timeRef.current = total;
              setCurrentTime(total);
              setExportProgress(100);
              renderSceneFrame(
                ctx,
                project,
                total - 0.01,
                dims.width,
                dims.height,
                showCaptions
              );

              if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === 'recording'
              ) {
                mediaRecorderRef.current.stop();
              }
              setIsPlaying(false);
              return;
            }
            timeRef.current = nextSec;
            setCurrentTime(nextSec);
            setExportProgress(Math.min(99, Math.round((nextSec / total) * 100)));
          } else {
            timeRef.current = (timeRef.current + deltaSec) % total;
            setCurrentTime(timeRef.current);
          }
        }
        lastFrameRef.current = now;
      } else {
        lastFrameRef.current = null;
      }

      renderSceneFrame(
        ctx,
        project,
        timeRef.current,
        dims.width,
        dims.height,
        showCaptions
      );
      rafId = window.requestAnimationFrame(tick);
    };

    renderSceneFrame(
      ctx,
      project,
      timeRef.current,
      dims.width,
      dims.height,
      showCaptions
    );
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [project, isPlaying, dims.width, dims.height, showCaptions]);

  function handleSeek(nextSec: number) {
    if (!project || isRecording) return;
    const clamped = Math.min(project.totalDurationSec, Math.max(0, nextSec));
    timeRef.current = clamped;
    lastFrameRef.current = null;
    setCurrentTime(clamped);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      renderSceneFrame(
        ctx,
        project,
        clamped,
        dims.width,
        dims.height,
        showCaptions
      );
    }
  }

  function handleRestart() {
    if (isRecording) return;
    handleSeek(0);
    setIsPlaying(true);
  }

  function handleCancelExport() {
    exportCancelledRef.current = true;
    isRecordingRef.current = false;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setExportProgress(0);
  }

  function handleDownloadVideo() {
    if (!project || isRecording) return;
    setExportError(null);
    setExportSuccess(false);

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function') {
      setExportError(
        'Your browser does not support HTML5 Canvas video recording (captureStream). Try Chrome, Edge, or Firefox on desktop/Android.'
      );
      return;
    }

    const format = pickSupportedRecorderFormat();
    if (!format) {
      setExportError(
        'MediaRecorder is not supported in this browser. You can still inspect and copy the generated Canvas code.'
      );
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      streamRef.current = stream;

      const recorderOptions: MediaRecorderOptions = format.mimeType
        ? { mimeType: format.mimeType, videoBitsPerSecond: 4_000_000 }
        : { videoBitsPerSecond: 4_000_000 };

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      exportCancelledRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        setExportError('Video recording failed in this browser. Please try again.');
      };

      recorder.onstop = () => {
        isRecordingRef.current = false;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);

        if (exportCancelledRef.current || chunks.length === 0) {
          return;
        }

        const blobType = recorder.mimeType || format.mimeType || 'video/webm';
        const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: blobType });
        const url = URL.createObjectURL(blob);

        const slug = project.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const filename = `${slug || 'framescript-video'}-${project.aspectRatio.replace(':', 'x')}.${ext}`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        setExportSuccess(true);
        window.setTimeout(() => setExportSuccess(false), 3500);
      };

      // Reset to frame 0 and start real-time capture
      timeRef.current = 0;
      lastFrameRef.current = null;
      setCurrentTime(0);
      setExportProgress(0);
      isRecordingRef.current = true;
      setIsRecording(true);
      setIsPlaying(true);

      recorder.start(250);
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      setExportError(
        'Could not start MediaRecorder in this browser. Try a modern Chromium or Firefox browser.'
      );
    }
  }

  async function handleCopyCode() {
    if (!project?.renderCode) return;
    try {
      await navigator.clipboard.writeText(project.renderCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  const stageAspectClass =
    activeAspectRatio === '9:16'
      ? 'aspect-[9/16] w-full max-w-[290px] sm:max-w-[320px] mx-auto'
      : activeAspectRatio === '1:1'
        ? 'aspect-square w-full max-w-[360px] sm:max-w-[420px] mx-auto'
        : 'aspect-video w-full';

  const activeSceneIndex = project
    ? Math.max(
        0,
        project.scenes.findIndex(
          (s) => currentTime >= s.startSec && currentTime < s.endSec
        )
      )
    : 0;

  return (
    <div className="rounded-2xl bg-[#141821] border border-[#232938] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-lg font-semibold text-white truncate">
            {project ? project.title : 'Live Canvas Preview'}
          </h2>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {activeAspectRatio} · {dims.width}×{dims.height}
            {project ? ` · ${project.scenes.length} scenes` : ''}
          </p>
        </div>

        {project && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCaptions((prev) => !prev)}
              aria-pressed={showCaptions}
              className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                showCaptions
                  ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-[#C4B5FD]'
                  : 'bg-[#1B2130] border-[#2B3347] text-slate-400 hover:text-white'
              }`}
            >
              {showCaptions ? (
                <>
                  <Captions className="h-4 w-4" aria-hidden="true" />
                  <span>Captions On</span>
                </>
              ) : (
                <>
                  <CaptionsOff className="h-4 w-4" aria-hidden="true" />
                  <span>Captions Off</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-3 py-2 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            >
              <Code2 className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
              <span>View Code</span>
            </button>
          </div>
        )}
      </div>

      {/* Responsive Canvas Stage */}
      <div className="w-full rounded-xl bg-[#0B0D12] border border-[#232938] p-3 sm:p-4 flex items-center justify-center overflow-hidden">
        {project ? (
          <div
            className={`${stageAspectClass} relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-[#232938]`}
          >
            <canvas
              ref={canvasRef}
              width={dims.width}
              height={dims.height}
              className="h-full w-full block"
            />
          </div>
        ) : (
          <div
            className={`${stageAspectClass} rounded-xl border border-dashed border-[#2A3245] bg-[#0E1118] flex flex-col items-center justify-center p-6 text-center space-y-3`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#141821] border border-[#232938] text-slate-400">
              <Film className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-sm font-medium text-slate-200">
                Canvas Stage Ready ({previewAspectRatio})
              </p>
              <p className="text-xs text-slate-400">
                Enter a topic or script and click Generate Video to render animated scenes here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Playback Controls + Export */}
      {project && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              disabled={isRecording}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:opacity-95 disabled:opacity-60 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              disabled={isRecording}
              aria-label="Restart video"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] text-slate-200 disabled:opacity-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex-1 min-w-0 px-1">
              <input
                type="range"
                aria-label="Seek video timeline"
                min={0}
                max={project.totalDurationSec}
                step={0.05}
                value={currentTime}
                disabled={isRecording}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#232938] accent-[#6366F1] disabled:opacity-60"
              />
            </div>

            <span className="text-xs font-mono tabular-nums text-slate-300 whitespace-nowrap shrink-0">
              {formatClock(currentTime)} / {formatClock(project.totalDurationSec)}
            </span>
          </div>

          {/* Scene Jump Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {project.scenes.map((scene, idx) => {
              const isCurrent = idx === activeSceneIndex;
              return (
                <button
                  key={scene.id}
                  type="button"
                  disabled={isRecording}
                  onClick={() => handleSeek(scene.startSec)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                    isCurrent
                      ? 'bg-[#6366F1]/15 border-[#6366F1] text-white'
                      : 'bg-[#0B0D12] border-[#232938] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-mono tabular-nums mr-1.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{scene.motionStyle}</span>
                </button>
              );
            })}
          </div>

          {/* Download / Export Video Action Bar */}
          <div className="pt-1 space-y-2.5">
            {isRecording ? (
              <div className="rounded-xl bg-[#0B0D12] border border-[#6366F1]/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-white">
                    <Loader2 className="h-4 w-4 animate-spin text-[#8B5CF6]" aria-hidden="true" />
                    <span className="tabular-nums">
                      Recording video ({exportProgress}% · {formatClock(currentTime)} /{' '}
                      {formatClock(project.totalDurationSec)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="min-h-[36px] rounded-lg border border-[#232938] bg-[#141821] hover:bg-[#1B2130] px-3 py-1 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#232938] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-150"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDownloadVideo}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-4 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
              >
                <Download className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
                <span>Download Video (.webm)</span>
              </button>
            )}

            {exportSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-xs text-emerald-200"
              >
                <Check className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Video exported and downloaded to your device.</span>
              </div>
            )}

            {exportError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-200"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{exportError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Code Viewer Modal */}
      {showCodeModal && project && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Generated Canvas Video Code"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-2xl max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#141821] border border-[#232938] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#232938]">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold text-white truncate">
                  Generated Canvas Motion Code
                </h3>
                <p className="text-xs text-slate-400 truncate">{project.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#1B2130] hover:bg-[#232B3E] border border-[#2B3347] px-3 py-2 text-xs font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  aria-label="Close code viewer"
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2130] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-5 bg-[#0B0D12]">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                <code>{project.renderCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
