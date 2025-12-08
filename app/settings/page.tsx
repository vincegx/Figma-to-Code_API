'use client';

/**
 * Settings Page (WP42 Redesign V2)
 *
 * Layout:
 *   [Figma API - Full width]
 *   [Export Preferences | Rule Editor]
 *   [Figma Export Data | Appearance]
 *
 * Phase 3 refactoring: extracted section components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { Settings, CheckCircle2 } from 'lucide-react';

// Phase 3: Extracted components
import {
  FigmaApiSection,
  ExportPreferencesSection,
  RuleEditorSection,
  FigmaDataSection,
  AppearanceSection,
  DeleteConfirmModal,
  type AppSettings,
} from './_components';

const defaultSettings: AppSettings = {
  defaultFramework: 'react-tailwind',
  defaultLanguage: 'typescript',
  formatOnExport: true,
  autoSave: true,
  defaultPriority: 100,
};

export default function SettingsPage() {
  // App Settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Figma Export Data Management
  const [cacheStats, setCacheStats] = useState<{ size: string; nodeCount: number } | null>(null);
  const [loadingCache, setLoadingCache] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Theme
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Toast notification
  const [showSavedToast, setShowSavedToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const showSaveNotification = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowSavedToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowSavedToast(false), 2000);
  }, []);

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const loadCacheStats = useCallback(async () => {
    setLoadingCache(true);
    try {
      const response = await fetch('/api/library/stats');
      if (response.ok) {
        const stats = await response.json();
        setCacheStats({
          size: formatBytes(stats.overview?.storageUsed || stats.cacheSize || 0),
          nodeCount: stats.overview?.totalNodes || stats.totalNodes || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoadingCache(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch { /* ignore */ }
    }
    loadCacheStats();
  }, [loadCacheStats]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('app-settings', JSON.stringify(settings));
    showSaveNotification();
  }, [settings, showSaveNotification]);

  async function deleteAllFigmaData() {
    if (deleteConfirmText !== 'DELETE') return;
    setClearingCache(true);
    try {
      const response = await fetch('/api/figma/library', { method: 'DELETE' });
      if (response.ok) {
        setCacheStats({ size: '0 B', nodeCount: 0 });
        setShowDeleteModal(false);
        setDeleteConfirmText('');
      }
    } catch (error) {
      console.error('Failed to delete Figma data:', error);
    } finally {
      setClearingCache(false);
    }
  }

  function openDeleteModal() {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  }

  return (
    <>
      {/* Toast */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={18} />
          <span className="font-medium">Settings saved</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        cacheStats={cacheStats}
        deleteConfirmText={deleteConfirmText}
        clearingCache={clearingCache}
        onConfirmTextChange={setDeleteConfirmText}
        onConfirm={deleteAllFigmaData}
        onClose={closeDeleteModal}
      />

      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
              <p className="text-text-muted text-sm">Configure your Figma Rules Builder preferences</p>
            </div>
          </div>

          {/* SECTION 1: Figma API (Full Width) */}
          <FigmaApiSection />

          {/* ROW 2: Export Preferences | Rule Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ExportPreferencesSection
              settings={settings}
              onSettingsChange={setSettings}
            />
            <RuleEditorSection
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>

          {/* ROW 3: Figma Export Data | Appearance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FigmaDataSection
              cacheStats={cacheStats}
              loadingCache={loadingCache}
              clearingCache={clearingCache}
              onRefresh={loadCacheStats}
              onDeleteClick={openDeleteModal}
            />
            <AppearanceSection
              theme={theme}
              onThemeChange={setTheme}
            />
          </div>
        </div>
      </div>
    </>
  );
}
