'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HomeView } from '@/components/HomeView';
import { NewProjectView } from '@/components/NewProjectView';
import { ProfileView } from '@/components/ProfileView';
import { StudioNav } from '@/components/StudioNav';
import { useStudioStorage } from '@/hooks/use-studio-storage';
import type {
  AspectRatio,
  InputMode,
  TabId,
  VideoProject,
  VideoTemplate,
} from '@/types/studio';

export default function StudioAppPage() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Shared New Project workspace state
  const [mode, setMode] = useState<InputMode>('describe');
  const [promptText, setPromptText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);

  const {
    hydrated,
    apiKey,
    hasApiKey,
    verifiedAt,
    selectedModel,
    projects,
    saveApiKey,
    markKeyVerified,
    removeApiKey,
    setSelectedModel,
    addProject,
    updateProject,
    deleteProject,
  } = useStudioStorage();

  function handleUseTemplate(template: VideoTemplate) {
    setSelectedTemplate(template);
    setMode('describe');
    setAspectRatio(template.aspectRatio);
    setPromptText(template.starterPrompt);
    setActiveProject(null);
    setActiveTab('new-project');
  }

  function handleModeChange(nextMode: InputMode) {
    setMode(nextMode);
    if (selectedTemplate && !activeProject) {
      const matchesPreviousStarter =
        promptText.trim() === selectedTemplate.starterPrompt.trim() ||
        promptText.trim() === selectedTemplate.starterScript.trim() ||
        promptText.trim() === '';
      if (matchesPreviousStarter) {
        setPromptText(
          nextMode === 'script'
            ? selectedTemplate.starterScript
            : selectedTemplate.starterPrompt
        );
      }
    }
  }

  function handleClearTemplate() {
    setSelectedTemplate(null);
  }

  function handleProjectGenerated(project: VideoProject) {
    addProject(project);
    setActiveProject(project);
  }

  function handleUpdateActiveProject(project: VideoProject) {
    setActiveProject(project);
    updateProject(project);
  }

  function handleOpenProject(project: VideoProject) {
    setMode(project.mode);
    setPromptText(project.promptText);
    setAspectRatio(project.aspectRatio);
    setSelectedTemplate(null);
    setActiveProject(project);
    setActiveTab('new-project');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0D12] text-[#F8FAFC]">
      <StudioNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasApiKey={hydrated && hasApiKey}
      />

      <main className="flex-1 min-w-0 px-4 py-6 pb-24 sm:px-8 sm:py-8 md:pb-10">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'home' && (
                <HomeView
                  hasApiKey={hydrated && hasApiKey}
                  onUseTemplate={handleUseTemplate}
                  onGoToProfile={() => setActiveTab('profile')}
                />
              )}

              {activeTab === 'new-project' && (
                <NewProjectView
                  apiKey={apiKey}
                  hasApiKey={hydrated && hasApiKey}
                  selectedModel={selectedModel}
                  mode={mode}
                  promptText={promptText}
                  aspectRatio={aspectRatio}
                  selectedTemplate={selectedTemplate}
                  activeProject={activeProject}
                  onModeChange={handleModeChange}
                  onPromptTextChange={setPromptText}
                  onAspectRatioChange={setAspectRatio}
                  onSelectModel={setSelectedModel}
                  onClearTemplate={handleClearTemplate}
                  onProjectGenerated={handleProjectGenerated}
                  onUpdateActiveProject={handleUpdateActiveProject}
                  onGoToProfile={() => setActiveTab('profile')}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  key={apiKey || 'empty-key'}
                  apiKey={apiKey}
                  hasApiKey={hydrated && hasApiKey}
                  verifiedAt={verifiedAt}
                  selectedModel={selectedModel}
                  projects={projects}
                  onSaveApiKey={saveApiKey}
                  onMarkKeyVerified={markKeyVerified}
                  onRemoveApiKey={removeApiKey}
                  onSelectModel={setSelectedModel}
                  onStartNewProject={() => setActiveTab('new-project')}
                  onOpenProject={handleOpenProject}
                  onDeleteProject={deleteProject}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
