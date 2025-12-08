'use client';

/**
 * RuleEditorSection Component
 *
 * Rule editor settings (auto-save, default priority).
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { AppSettings } from './ExportPreferencesSection';

interface RuleEditorSectionProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function RuleEditorSection({ settings, onSettingsChange }: RuleEditorSectionProps) {
  return (
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
            onCheckedChange={(checked) => onSettingsChange({ ...settings, autoSave: checked })}
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
            onChange={(e) => onSettingsChange({ ...settings, defaultPriority: parseInt(e.target.value) || 100 })}
            className="bg-bg-secondary border-border-primary"
          />
        </div>
      </div>
    </div>
  );
}
