'use client';

/**
 * FigmaApiSection Component
 *
 * Figma API token input and connection test.
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function FigmaApiSection() {
  const [figmaToken, setFigmaToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

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
      } else {
        setConnectionStatus('error');
      }
    } catch {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  }

  return (
    <div className="p-6 rounded-xl bg-bg-card border border-border-primary mb-6">
      {/* Header with colored icon */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Code className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Figma API</h2>
          <p className="text-sm text-text-muted">Test your Figma access token connection</p>
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
          <Button onClick={testConnection} disabled={testingConnection} className="bg-accent-primary hover:bg-accent-hover text-white">
            {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
          </Button>
        </div>
        {connectionStatus && (
          <div className={cn(
            'flex items-center gap-2 text-sm p-2 rounded-lg mt-2',
            connectionStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}>
            {connectionStatus === 'success' ? <Check size={16} /> : <X size={16} />}
            {connectionStatus === 'success' ? 'Connection successful!' : 'Connection failed. Check your token.'}
          </div>
        )}
      </div>
    </div>
  );
}
