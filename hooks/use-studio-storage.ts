'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_GEMINI_MODEL } from '@/lib/gemini-models';
import type { VideoProject, VideoScene } from '@/types/studio';

const API_KEY_STORAGE = 'framescript_gemini_api_key';
const KEY_VERIFIED_AT_STORAGE = 'framescript_gemini_verified_at';
const SELECTED_MODEL_STORAGE = 'selectedGeminiModel';
const PROJECTS_STORAGE = 'projectHistory';
const LEGACY_PROJECTS_STORAGE = 'framescript_projects_v1';

interface StudioSnapshot {
  hydrated: boolean;
  apiKey: string;
  verifiedAt: string | null;
  selectedModel: string;
  projects: VideoProject[];
}

const EMPTY_PROJECTS: VideoProject[] = [];

const SERVER_SNAPSHOT: StudioSnapshot = {
  hydrated: false,
  apiKey: '',
  verifiedAt: null,
  selectedModel: DEFAULT_GEMINI_MODEL,
  projects: EMPTY_PROJECTS,
};

let cachedKey = '';
let cachedVerifiedAt: string | null = null;
let cachedModel = DEFAULT_GEMINI_MODEL;
let cachedRawProjects: string | null = null;
let cachedProjects: VideoProject[] = EMPTY_PROJECTS;
let cachedSnapshot: StudioSnapshot = {
  hydrated: true,
  apiKey: '',
  verifiedAt: null,
  selectedModel: DEFAULT_GEMINI_MODEL,
  projects: EMPTY_PROJECTS,
};

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function normalizeStoredProject(raw: unknown): VideoProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const rawScenes = Array.isArray(item.scenes) ? item.scenes : [];
  if (rawScenes.length === 0) return null;

  let cursor = 0;
  const scenes: VideoScene[] = rawScenes.map((s, idx) => {
    const sc = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
    const legacyDuration = Number(sc.durationSec);
    const startVal = Number(sc.startSec);
    const endVal = Number(sc.endSec);

    const startSec = Number.isFinite(startVal) ? startVal : cursor;
    const endSec =
      Number.isFinite(endVal) && endVal > startSec
        ? endVal
        : startSec +
          (Number.isFinite(legacyDuration) && legacyDuration > 0
            ? legacyDuration
            : 5);
    cursor = endSec;

    const bg =
      Array.isArray(sc.bgGradient) && sc.bgGradient.length >= 2
        ? ([String(sc.bgGradient[0]), String(sc.bgGradient[1])] as [string, string])
        : (['#0B0D12', '#1B1E3A'] as [string, string]);

    const motionStyle =
      sc.motionStyle === 'kinetic-pop' ||
      sc.motionStyle === 'slide-zoom' ||
      sc.motionStyle === 'typewriter-glow' ||
      sc.motionStyle === 'split-card'
        ? sc.motionStyle
        : 'kinetic-pop';

    return {
      id: typeof sc.id === 'string' && sc.id ? sc.id : `scene-${idx + 1}`,
      startSec,
      endSec,
      headline: typeof sc.headline === 'string' ? sc.headline : `Scene ${idx + 1}`,
      subtext:
        typeof sc.subtext === 'string'
          ? sc.subtext
          : typeof sc.visualCue === 'string'
            ? sc.visualCue
            : '',
      caption:
        typeof sc.caption === 'string'
          ? sc.caption
          : typeof sc.voiceover === 'string'
            ? sc.voiceover
            : '',
      motionStyle,
      bgGradient: bg,
      accentColor: typeof sc.accentColor === 'string' ? sc.accentColor : '#6366F1',
    };
  });

  const aspectRatio =
    item.aspectRatio === '16:9' || item.aspectRatio === '1:1'
      ? item.aspectRatio
      : '9:16';

  return {
    id: typeof item.id === 'string' ? item.id : `proj_${Date.now()}`,
    title: typeof item.title === 'string' ? item.title : 'Untitled Video',
    mode: item.mode === 'script' ? 'script' : 'describe',
    promptText: typeof item.promptText === 'string' ? item.promptText : '',
    aspectRatio,
    totalDurationSec:
      Number.isFinite(Number(item.totalDurationSec)) &&
      Number(item.totalDurationSec) > 0
        ? Number(item.totalDurationSec)
        : cursor,
    theme: typeof item.theme === 'string' ? item.theme : 'Dark Studio Kinetic',
    scenes,
    renderCode: typeof item.renderCode === 'string' ? item.renderCode : '',
    timestamp:
      typeof item.timestamp === 'string'
        ? item.timestamp
        : typeof item.createdAt === 'string'
          ? item.createdAt
          : new Date().toISOString(),
    templateId: typeof item.templateId === 'string' ? item.templateId : undefined,
    templateTitle:
      typeof item.templateTitle === 'string' ? item.templateTitle : undefined,
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === API_KEY_STORAGE ||
      event.key === KEY_VERIFIED_AT_STORAGE ||
      event.key === SELECTED_MODEL_STORAGE ||
      event.key === PROJECTS_STORAGE
    ) {
      listener();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): StudioSnapshot {
  try {
    const nextKey = window.localStorage.getItem(API_KEY_STORAGE) ?? '';
    const nextVerifiedAt = window.localStorage.getItem(KEY_VERIFIED_AT_STORAGE);
    const nextModel =
      window.localStorage.getItem(SELECTED_MODEL_STORAGE)?.trim() ||
      DEFAULT_GEMINI_MODEL;
    const nextRawProjects =
      window.localStorage.getItem(PROJECTS_STORAGE) ??
      window.localStorage.getItem(LEGACY_PROJECTS_STORAGE);

    if (
      nextKey === cachedKey &&
      nextVerifiedAt === cachedVerifiedAt &&
      nextModel === cachedModel &&
      nextRawProjects === cachedRawProjects
    ) {
      return cachedSnapshot;
    }

    if (nextRawProjects !== cachedRawProjects) {
      cachedRawProjects = nextRawProjects;
      if (nextRawProjects) {
        try {
          const parsed = JSON.parse(nextRawProjects) as unknown;
          if (Array.isArray(parsed)) {
            cachedProjects = parsed
              .map(normalizeStoredProject)
              .filter((p): p is VideoProject => p !== null);
          } else {
            cachedProjects = EMPTY_PROJECTS;
          }
        } catch {
          cachedProjects = EMPTY_PROJECTS;
        }
      } else {
        cachedProjects = EMPTY_PROJECTS;
      }
    }

    cachedKey = nextKey;
    cachedVerifiedAt = nextVerifiedAt;
    cachedModel = nextModel;
    cachedSnapshot = {
      hydrated: true,
      apiKey: cachedKey,
      verifiedAt: cachedVerifiedAt,
      selectedModel: cachedModel,
      projects: cachedProjects,
    };

    return cachedSnapshot;
  } catch {
    return cachedSnapshot;
  }
}

function getServerSnapshot(): StudioSnapshot {
  return SERVER_SNAPSHOT;
}

export function useStudioStorage() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveApiKey = useCallback(
    (nextKey: string, nextVerifiedAt: string | null = null) => {
      const trimmed = nextKey.trim();
      try {
        if (trimmed) {
          window.localStorage.setItem(API_KEY_STORAGE, trimmed);
        } else {
          window.localStorage.removeItem(API_KEY_STORAGE);
        }

        if (nextVerifiedAt) {
          window.localStorage.setItem(KEY_VERIFIED_AT_STORAGE, nextVerifiedAt);
        } else {
          window.localStorage.removeItem(KEY_VERIFIED_AT_STORAGE);
        }
      } catch {
        // Ignore storage quota issues
      }
      notifyListeners();
    },
    []
  );

  const markKeyVerified = useCallback((timestamp: string) => {
    try {
      window.localStorage.setItem(KEY_VERIFIED_AT_STORAGE, timestamp);
    } catch {
      // Ignore storage quota issues
    }
    notifyListeners();
  }, []);

  const removeApiKey = useCallback(() => {
    try {
      window.localStorage.removeItem(API_KEY_STORAGE);
      window.localStorage.removeItem(KEY_VERIFIED_AT_STORAGE);
    } catch {
      // Ignore storage errors
    }
    notifyListeners();
  }, []);

  const setSelectedModel = useCallback((modelId: string) => {
    const trimmed = modelId.trim() || DEFAULT_GEMINI_MODEL;
    try {
      window.localStorage.setItem(SELECTED_MODEL_STORAGE, trimmed);
    } catch {
      // Ignore storage quota issues
    }
    notifyListeners();
  }, []);

  const addProject = useCallback((project: VideoProject) => {
    try {
      const current = getSnapshot().projects;
      const updated = [project, ...current.filter((item) => item.id !== project.id)];
      window.localStorage.setItem(PROJECTS_STORAGE, JSON.stringify(updated));
    } catch {
      // Ignore storage quota issues
    }
    notifyListeners();
  }, []);

  const updateProject = useCallback((project: VideoProject) => {
    try {
      const current = getSnapshot().projects;
      const exists = current.some((item) => item.id === project.id);
      const updated = exists
        ? current.map((item) => (item.id === project.id ? project : item))
        : [project, ...current];
      window.localStorage.setItem(PROJECTS_STORAGE, JSON.stringify(updated));
    } catch {
      // Ignore storage quota issues
    }
    notifyListeners();
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    try {
      const current = getSnapshot().projects;
      const updated = current.filter((item) => item.id !== projectId);
      window.localStorage.setItem(PROJECTS_STORAGE, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    notifyListeners();
  }, []);

  return {
    hydrated: snapshot.hydrated,
    apiKey: snapshot.apiKey,
    hasApiKey: snapshot.apiKey.length > 0,
    verifiedAt: snapshot.verifiedAt,
    selectedModel: snapshot.selectedModel,
    projects: snapshot.projects,
    saveApiKey,
    markKeyVerified,
    removeApiKey,
    setSelectedModel,
    addProject,
    updateProject,
    deleteProject,
  };
}
