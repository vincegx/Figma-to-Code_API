'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Database,
  Palette,
  Code,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Settings stored in localStorage
interface AppSettings {
  // Export Preferences (T117)
  defaultFramework: 'react-jsx' | 'react-tailwind' | 'react-tailwind-v4' | 'html-css';
  defaultLanguage: 'typescript' | 'javascript';
  formatOnExport: boolean;

  // Rule Editor (T118)
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

// Section component for consistent styling
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-secondary rounded-lg">
            <Icon className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// Label + Form field wrapper
function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  // Figma API (T115-T116)
  const [figmaToken, setFigmaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  // App Settings (T117-T118)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Cache Management (T119-T120)
  const [cacheStats, setCacheStats] = useState<{ size: string; nodeCount: number } | null>(null);
  const [loadingCache, setLoadingCache] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Theme (T121-T122)
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Auto-save toast notification (Review Feedback)
  const [showSavedToast, setShowSavedToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Show "Settings saved" toast with auto-dismiss
  const showSaveNotification = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setShowSavedToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  }, []);

  // Load cache stats from API
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        // Ignore parse errors
      }
    }

    // Load Figma token from localStorage (client-side only)
    const token = localStorage.getItem('figma-token');
    if (token) {
      setFigmaToken(token);
    }

    // Load cache stats
    loadCacheStats();
  }, [loadCacheStats]);

  // Save settings to localStorage whenever they change + show toast
  useEffect(() => {
    // Skip toast on initial mount (loading from localStorage)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('app-settings', JSON.stringify(settings));
    showSaveNotification();
  }, [settings, showSaveNotification]);

  // Format bytes to human-readable
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // Test Figma connection (T116) - Uses proxy to avoid CORS
  async function testConnection() {
    if (!figmaToken.trim()) {
      setConnectionStatus('error');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Use proxy API route to avoid CORS issues
      const response = await fetch('/api/figma/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: figmaToken }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus('success');
        // Save valid token
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

  // Save token (without testing)
  function saveToken() {
    localStorage.setItem('figma-token', figmaToken);
    showSaveNotification();
  }

  // Clear all cache (T120)
  async function clearCache() {
    if (!confirm('Are you sure you want to clear all cached data? This will remove all imported nodes.')) {
      return;
    }

    setClearingCache(true);
    try {
      const response = await fetch('/api/figma/library', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCacheStats({ size: '0 B', nodeCount: 0 });
        alert('Cache cleared successfully');
      } else {
        alert('Failed to clear cache');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  }

  return (
    <>
      {/* Auto-save toast notification */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={18} />
          <span className="font-medium">Settings saved</span>
        </div>
      )}
      <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-text-secondary mt-2">
          Configure your Figma Rules Builder preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Figma API (T115-T116) */}
        <SettingsSection
          icon={Key}
          title="Figma API"
          description="Configure your Figma access token for importing designs"
        >
          <FormField
            label="Access Token"
            description="Get your token from Figma Settings → Account → Personal Access Tokens"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={figmaToken}
                  onChange={(e) => {
                    setFigmaToken(e.target.value);
                    setConnectionStatus(null);
                  }}
                  placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="pr-10"
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
              <Button onClick={testConnection} disabled={testingConnection}>
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
          </FormField>

          {connectionStatus && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm p-3 rounded-lg',
                connectionStatus === 'success'
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-status-error-bg text-status-error-text'
              )}
            >
              {connectionStatus === 'success' ? (
                <>
                  <Check size={16} />
                  Connection successful! Token saved.
                </>
              ) : (
                <>
                  <X size={16} />
                  Connection failed. Check your token and try again.
                </>
              )}
            </div>
          )}
        </SettingsSection>

        {/* Section 2: Export Preferences (T117) */}
        <SettingsSection
          icon={Code}
          title="Export Preferences"
          description="Default settings for code generation"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Default Framework">
              <select
                value={settings.defaultFramework}
                onChange={(e) =>
                  setSettings({ ...settings, defaultFramework: e.target.value as AppSettings['defaultFramework'] })
                }
                className="w-full px-3 py-2 rounded-md border border-border-primary bg-bg-card text-text-primary"
              >
                <option value="react-jsx">React JSX</option>
                <option value="react-tailwind">React + Tailwind v3</option>
                <option value="react-tailwind-v4">React + Tailwind v4</option>
                <option value="html-css">HTML/CSS</option>
              </select>
            </FormField>

            <FormField label="Default Language">
              <select
                value={settings.defaultLanguage}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLanguage: e.target.value as AppSettings['defaultLanguage'] })
                }
                className="w-full px-3 py-2 rounded-md border border-border-primary bg-bg-card text-text-primary"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>
            </FormField>
          </div>

          <FormField label="Format on Export">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.formatOnExport}
                onChange={(e) => setSettings({ ...settings, formatOnExport: e.target.checked })}
                className="w-4 h-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-secondary">
                Automatically format generated code
              </span>
            </label>
          </FormField>
        </SettingsSection>

        {/* Section 3: Rule Editor (T118) */}
        <SettingsSection
          icon={Settings}
          title="Rule Editor"
          description="Configure rule creation and editing behavior"
        >
          <FormField label="Auto-save">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                className="w-4 h-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-secondary">
                Automatically save rules while editing
              </span>
            </label>
          </FormField>

          <FormField
            label="Default Priority"
            description="Priority assigned to newly created rules (1-1000)"
          >
            <Input
              type="number"
              min={1}
              max={1000}
              value={settings.defaultPriority}
              onChange={(e) =>
                setSettings({ ...settings, defaultPriority: parseInt(e.target.value) || 100 })
              }
              className="w-32"
            />
          </FormField>
        </SettingsSection>

        {/* Section 4: Cache Management (T119-T120) */}
        <SettingsSection
          icon={Database}
          title="Cache Management"
          description="Manage locally cached Figma data"
        >
          <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Cache Statistics
              </p>
              {loadingCache ? (
                <p className="text-sm text-text-muted">Loading...</p>
              ) : cacheStats ? (
                <p className="text-sm text-text-muted">
                  {cacheStats.nodeCount} nodes • {cacheStats.size}
                </p>
              ) : (
                <p className="text-sm text-text-muted">No data cached</p>
              )}
            </div>
            <Button variant="outline" onClick={loadCacheStats} disabled={loadingCache}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loadingCache && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearCache}
              disabled={clearingCache}
              className="text-status-error-text hover:bg-status-error-bg"
            >
              {clearingCache ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear All Cache
            </Button>
          </div>
        </SettingsSection>

        {/* Section 5: Appearance (T121-T122) */}
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel of the application"
        >
          <FormField label="Theme">
            <div className="flex gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    theme === value
                      ? 'bg-accent-secondary border-accent-primary text-accent-primary'
                      : 'border-border-primary hover:bg-bg-hover'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </FormField>
        </SettingsSection>
      </div>
    </div>
    </>
  );
}
