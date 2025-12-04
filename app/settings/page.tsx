'use client';

/**
 * Settings Page (WP42 Redesign V2)
 *
 * Layout:
 *   [Figma API - Full width]
 *   [Export Preferences | Rule Editor]
 *   [Cache Management | Appearance]
 *
 * Features:
 * - Colored icons (orange, blue, violet, rose)
 * - Toggle switches iOS style
 * - Settings icon in header
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Settings,
  Code,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSettings {
  defaultFramework: 'react-jsx' | 'react-tailwind' | 'react-tailwind-v4' | 'html-css';
  defaultLanguage: 'typescript' | 'javascript';
  formatOnExport: boolean;
  autoSave: boolean;
  defaultPriority: number;
}

const defaultSettings: AppSettings = {
  defaultFramework: 'react-tailwind',
  defaultLanguage: 'typescript',
  formatOnExport: true,
  autoSave: true,
  defaultPriority: 100,
};

export default function SettingsPage() {
  // Figma API
  const [figmaToken, setFigmaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Cache Management
  const [cacheStats, setCacheStats] = useState<{ size: string; nodeCount: number } | null>(null);
  const [loadingCache, setLoadingCache] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

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

  const loadCacheStats = useCallback(async () => {
    setLoadingCache(true);
    try {
      const response = await fetch('/api/library/stats');
      if (response.ok) {
        const stats = await response.json();
        setCacheStats({
          size: formatBytes(stats.cacheSize || 0),
          nodeCount: stats.totalNodes || 0,
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
    const token = localStorage.getItem('figma-token');
    if (token) setFigmaToken(token);
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

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  async function testConnection() {
    if (!figmaToken.trim()) {
      setConnectionStatus('error');
      return;
    }
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const response = await fetch('/api/figma/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: figmaToken }),
      });
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('success');
        localStorage.setItem('figma-token', figmaToken);
      } else {
        setConnectionStatus('error');
      }
    } catch {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  }

  function saveToken() {
    localStorage.setItem('figma-token', figmaToken);
    showSaveNotification();
  }

  async function clearCache() {
    if (!confirm('Are you sure you want to clear all cached data?')) return;
    setClearingCache(true);
    try {
      const response = await fetch('/api/figma/library', { method: 'DELETE' });
      if (response.ok) {
        setCacheStats({ size: '0 B', nodeCount: 0 });
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearingCache(false);
    }
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
          <div className="p-6 rounded-xl bg-bg-card border border-border-primary mb-6">
            {/* Header with colored icon */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Code className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Figma API</h2>
                <p className="text-sm text-text-muted">Configure your Figma access token for importing designs</p>
              </div>
            </div>

            {/* Token input */}
            <div className="space-y-2">
              <label className="text-sm text-text-muted">Access Token</label>
              <p className="text-xs text-text-muted mb-2">
                Get your token from Figma Settings → Account → Personal Access Tokens
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={figmaToken}
                    onChange={(e) => {
                      setFigmaToken(e.target.value);
                      setConnectionStatus(null);
                    }}
                    placeholder="figd_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789"
                    className="pr-10 bg-bg-secondary border-border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button onClick={saveToken} variant="outline">
                  Save
                </Button>
                <Button onClick={testConnection} disabled={testingConnection} className="bg-accent-primary hover:bg-accent-hover">
                  {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                </Button>
              </div>
              {connectionStatus && (
                <div className={cn(
                  'flex items-center gap-2 text-sm p-2 rounded-lg mt-2',
                  connectionStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                )}>
                  {connectionStatus === 'success' ? <Check size={16} /> : <X size={16} />}
                  {connectionStatus === 'success' ? 'Connection successful! Token saved.' : 'Connection failed. Check your token.'}
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Export Preferences | Rule Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Export Preferences */}
            <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Export Preferences</h2>
                  <p className="text-sm text-text-muted">Default settings for code generation</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-muted mb-1.5 block">Default Framework</label>
                  <select
                    value={settings.defaultFramework}
                    onChange={(e) => setSettings({ ...settings, defaultFramework: e.target.value as AppSettings['defaultFramework'] })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border-primary bg-bg-secondary text-text-primary"
                  >
                    <option value="react-jsx">React JSX</option>
                    <option value="react-tailwind">React + Tailwind v3</option>
                    <option value="react-tailwind-v4">React + Tailwind v4</option>
                    <option value="html-css">HTML/CSS</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1.5 block">Default Language</label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as AppSettings['defaultLanguage'] })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border-primary bg-bg-secondary text-text-primary"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Format on Export</p>
                    <p className="text-xs text-text-muted">Automatically format generated code</p>
                  </div>
                  <Switch
                    checked={settings.formatOnExport}
                    onCheckedChange={(checked) => setSettings({ ...settings, formatOnExport: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Rule Editor */}
            <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Rule Editor</h2>
                  <p className="text-sm text-text-muted">Configure rule creation and editing behavior</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Auto-save</p>
                    <p className="text-xs text-text-muted">Automatically save rules while editing</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                  />
                </div>
                <div className="pt-2">
                  <label className="text-sm text-text-muted mb-1 block">Default Priority</label>
                  <p className="text-xs text-text-muted mb-2">Priority assigned to newly created rules (1-1000)</p>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={settings.defaultPriority}
                    onChange={(e) => setSettings({ ...settings, defaultPriority: parseInt(e.target.value) || 100 })}
                    className="bg-bg-secondary border-border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Cache Management | Appearance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Management */}
            <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Cache Management</h2>
                  <p className="text-sm text-text-muted">Manage locally cached Figma data</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Cache Statistics</p>
                    {loadingCache ? (
                      <p className="text-xs text-text-muted">Loading...</p>
                    ) : cacheStats ? (
                      <p className="text-xs text-text-muted">{cacheStats.nodeCount} nodes • {cacheStats.size}</p>
                    ) : (
                      <p className="text-xs text-text-muted">No data</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={loadCacheStats} disabled={loadingCache}>
                    <RefreshCw className={cn('h-4 w-4 mr-1', loadingCache && 'animate-spin')} />
                    Refresh
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={clearCache}
                  disabled={clearingCache}
                  className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  {clearingCache ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Clear All Cache
                </Button>
              </div>
            </div>

            {/* Appearance */}
            <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 0 0-14z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
                  <p className="text-sm text-text-muted">Customize the look and feel of the application</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-muted mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                        theme === value
                          ? 'bg-accent-primary border-accent-primary text-white'
                          : 'bg-bg-secondary border-border-primary text-text-secondary hover:border-border-secondary'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
