'use client';

import { useState } from 'react';
import type { Selector } from '@/lib/types/rules';

interface SelectorEditorProps {
  selector: Selector;
  onChange: (selector: Selector) => void;
}

const NODE_TYPES = [
  'FRAME',
  'TEXT',
  'RECTANGLE',
  'ELLIPSE',
  'LINE',
  'VECTOR',
  'GROUP',
  'COMPONENT',
  'INSTANCE',
  'BOOLEAN_OPERATION',
] as const;

export function SelectorEditor({ selector, onChange }: SelectorEditorProps) {
  const [type, setType] = useState(selector.type || '');
  const [name, setName] = useState(selector.name?.toString() || '');
  const [widthMin, setWidthMin] = useState(selector.width?.min?.toString() || '');
  const [widthMax, setWidthMax] = useState(selector.width?.max?.toString() || '');
  const [heightMin, setHeightMin] = useState(selector.height?.min?.toString() || '');
  const [heightMax, setHeightMax] = useState(selector.height?.max?.toString() || '');
  const [hasChildren, setHasChildren] = useState(selector.hasChildren ?? null);
  const [parentType, setParentType] = useState(selector.parentType || '');

  const updateSelector = () => {
    const newSelector: any = {};

    if (type) newSelector.type = type;
    if (name) newSelector.name = name;
    if (widthMin || widthMax) {
      newSelector.width = {};
      if (widthMin) newSelector.width.min = Number(widthMin);
      if (widthMax) newSelector.width.max = Number(widthMax);
    }
    if (heightMin || heightMax) {
      newSelector.height = {};
      if (heightMin) newSelector.height.min = Number(heightMin);
      if (heightMax) newSelector.height.max = Number(heightMax);
    }
    if (hasChildren !== null) newSelector.hasChildren = hasChildren;
    if (parentType) newSelector.parentType = parentType;

    onChange(newSelector as Selector);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    const newSelector: any = { ...selector };
    if (value) {
      newSelector.type = value;
    } else {
      delete newSelector.type;
    }
    onChange(newSelector as Selector);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const newSelector: any = { ...selector };
    if (value) {
      newSelector.name = value;
    } else {
      delete newSelector.name;
    }
    onChange(newSelector as Selector);
  };

  const handleWidthMinChange = (value: string) => {
    setWidthMin(value);
    const newSelector: any = { ...selector };
    if (value || widthMax) {
      newSelector.width = { ...(newSelector.width || {}) };
      if (value) {
        newSelector.width.min = Number(value);
      } else {
        delete newSelector.width.min;
      }
    } else {
      delete newSelector.width;
    }
    onChange(newSelector as Selector);
  };

  const handleWidthMaxChange = (value: string) => {
    setWidthMax(value);
    const newSelector: any = { ...selector };
    if (value || widthMin) {
      newSelector.width = { ...(newSelector.width || {}) };
      if (value) {
        newSelector.width.max = Number(value);
      } else {
        delete newSelector.width.max;
      }
    } else {
      delete newSelector.width;
    }
    onChange(newSelector as Selector);
  };

  const handleHeightMinChange = (value: string) => {
    setHeightMin(value);
    const newSelector: any = { ...selector };
    if (value || heightMax) {
      newSelector.height = { ...(newSelector.height || {}) };
      if (value) {
        newSelector.height.min = Number(value);
      } else {
        delete newSelector.height.min;
      }
    } else {
      delete newSelector.height;
    }
    onChange(newSelector as Selector);
  };

  const handleHeightMaxChange = (value: string) => {
    setHeightMax(value);
    const newSelector: any = { ...selector };
    if (value || heightMin) {
      newSelector.height = { ...(newSelector.height || {}) };
      if (value) {
        newSelector.height.max = Number(value);
      } else {
        delete newSelector.height.max;
      }
    } else {
      delete newSelector.height;
    }
    onChange(newSelector as Selector);
  };

  const handleHasChildrenChange = (value: string) => {
    const newSelector: any = { ...selector };
    if (value === 'true') {
      newSelector.hasChildren = true;
      setHasChildren(true);
    } else if (value === 'false') {
      newSelector.hasChildren = false;
      setHasChildren(false);
    } else {
      delete newSelector.hasChildren;
      setHasChildren(null);
    }
    onChange(newSelector as Selector);
  };

  const handleParentTypeChange = (value: string) => {
    setParentType(value);
    const newSelector: any = { ...selector };
    if (value) {
      newSelector.parentType = value;
    } else {
      delete newSelector.parentType;
    }
    onChange(newSelector as Selector);
  };

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Node Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Node Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          >
            <option value="">Any</option>
            {NODE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Node Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Name (text or regex pattern)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Button or ^btn-.*"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          />
        </div>

        {/* Width Min/Max */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Width Min (px)
          </label>
          <input
            type="number"
            value={widthMin}
            onChange={(e) => handleWidthMinChange(e.target.value)}
            placeholder="e.g., 100"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Width Max (px)
          </label>
          <input
            type="number"
            value={widthMax}
            onChange={(e) => handleWidthMaxChange(e.target.value)}
            placeholder="e.g., 500"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          />
        </div>

        {/* Height Min/Max */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Height Min (px)
          </label>
          <input
            type="number"
            value={heightMin}
            onChange={(e) => handleHeightMinChange(e.target.value)}
            placeholder="e.g., 40"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Height Max (px)
          </label>
          <input
            type="number"
            value={heightMax}
            onChange={(e) => handleHeightMaxChange(e.target.value)}
            placeholder="e.g., 200"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          />
        </div>

        {/* Has Children */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Has Children
          </label>
          <select
            value={hasChildren === null ? '' : hasChildren.toString()}
            onChange={(e) => handleHasChildrenChange(e.target.value)}
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Parent Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Parent Type
          </label>
          <select
            value={parentType}
            onChange={(e) => handleParentTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary"
          >
            <option value="">Any</option>
            {NODE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
