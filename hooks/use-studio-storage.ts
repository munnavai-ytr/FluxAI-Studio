'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { VideoProject } from '@/types/studio';

const API_KEY_STORAGE = 'framescript_gemini_api_key';
const KEY_VERIFIED_AT_STORAGE = 'framescript_gemini_verified_at';
const PROJECTS_STORAGE = 'framescript_projects_v1';

interface StudioSnapshot {
  hydrated: boolean;
  apiKey: string;
  verifiedAt: string | null;
  projects: VideoProject[];
}

const EMPTY_PROJECTS: VideoProject[] = [];

const SERVER_SNAPSHOT: StudioSnapshot = {
  hydrated: false,
  apiKey: '',
  verifiedAt: null,
  projects: EMPTY_PROJECTS,
};

let cachedKey = '';
let cachedVerifiedAt: string | null = null;
let cachedRawProjects: string | null = null;
let cachedProjects: VideoProject[] = EMPTY_PROJECTS;
let cachedSnapshot: StudioSnapshot = {
  hydrated: true,
  apiKey: '',
  verifiedAt: null,
  projects: EMPTY_PROJECTS,
};

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === API_KEY_STORAGE ||
      event.key === KEY_VERIFIED_AT_STORAGE ||
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
    const nextRawProjects = window.localStorage.getItem(PROJECTS_STORAGE);

    if (
      nextKey === cachedKey &&
      nextVerifiedAt === cachedVerifiedAt &&
      nextRawProjects === cachedRawProjects
    ) {
      return cachedSnapshot;
    }

    if (nextRawProjects !== cachedRawProjects) {
      cachedRawProjects = nextRawProjects;
      if (nextRawProjects) {
        try {
          const parsed = JSON.parse(nextRawProjects) as unknown;
          cachedProjects = Array.isArray(parsed)
            ? (parsed as VideoProject[])
            : EMPTY_PROJECTS;
        } catch {
          cachedProjects = EMPTY_PROJECTS;
        }
      } else {
        cachedProjects = EMPTY_PROJECTS;
      }
    }

    cachedKey = nextKey;
    cachedVerifiedAt = nextVerifiedAt;
    cachedSnapshot = {
      hydrated: true,
      apiKey: cachedKey,
      verifiedAt: cachedVerifiedAt,
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
    projects: snapshot.projects,
    saveApiKey,
    markKeyVerified,
    removeApiKey,
    addProject,
    deleteProject,
  };
}
