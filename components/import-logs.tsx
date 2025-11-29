'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: LogLevel;
}

interface ImportLogsProps {
  logs: LogEntry[];
  className?: string;
  maxHeight?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const levelStyles: Record<LogLevel, string> = {
  info: 'text-text-muted',
  success: 'text-status-success-text',
  warning: 'text-status-warning-text',
  error: 'text-status-error-text',
};

const levelPrefix: Record<LogLevel, string> = {
  info: '→',
  success: '✓',
  warning: '⚠',
  error: '✗',
};

export function ImportLogs({ logs, className, maxHeight = '200px' }: ImportLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'font-mono text-xs bg-bg-secondary rounded-lg border border-border-primary p-3 overflow-auto',
        className
      )}
      style={{ maxHeight }}
      role="log"
      aria-live="polite"
      aria-label="Import logs"
    >
      {logs.map((log) => (
        <div
          key={log.id}
          className={cn('flex gap-2 py-0.5', levelStyles[log.level])}
        >
          <span className="text-text-muted shrink-0">
            [{formatTime(log.timestamp)}]
          </span>
          <span className="shrink-0">{levelPrefix[log.level]}</span>
          <span className="break-words">{log.message}</span>
        </div>
      ))}
    </div>
  );
}

export default ImportLogs;
