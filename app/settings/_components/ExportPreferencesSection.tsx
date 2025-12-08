'use client';

/**
 * ExportPreferencesSection Component
 *
 * Default framework and language settings.
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { Code } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export interface AppSettings {
  defaultFramework: 'react-jsx' | 'react-tailwind' | 'react-tailwind-v4' | 'html-css';
  defaultLanguage: 'typescript' | 'javascript';
  formatOnExport: boolean;
  autoSave: boolean;
  defaultPriority: number;
}

interface ExportPreferencesSectionProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function ExportPreferencesSection({ settings, onSettingsChange }: ExportPreferencesSectionProps) {
  return (
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
            onChange={(e) => onSettingsChange({ ...settings, defaultFramework: e.target.value as AppSettings['defaultFramework'] })}
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
            onChange={(e) => onSettingsChange({ ...settings, defaultLanguage: e.target.value as AppSettings['defaultLanguage'] })}
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
            onCheckedChange={(checked) => onSettingsChange({ ...settings, formatOnExport: checked })}
          />
        </div>
      </div>
    </div>
  );
}
