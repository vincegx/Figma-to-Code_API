'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  FrameworkType,
  ReactTailwindTransformer,
  HTMLCSSTransformer,
  ReactInlineTransformer,
  SwiftUITransformer,
  AndroidXMLTransformer,
} from '@/lib/types/rules';

type AnyTransformer =
  | ReactTailwindTransformer
  | HTMLCSSTransformer
  | ReactInlineTransformer
  | SwiftUITransformer
  | AndroidXMLTransformer;

interface TransformerEditorProps {
  framework: FrameworkType;
  transformer: AnyTransformer | undefined;
  onChange: (transformer: AnyTransformer | undefined) => void;
}

export function TransformerEditor({
  framework,
  transformer,
  onChange,
}: TransformerEditorProps) {
  // Common fields
  const [htmlTag, setHtmlTag] = useState('');
  const [className, setClassName] = useState('');
  const [cssClass, setCssClass] = useState('');
  const [component, setComponent] = useState('');
  const [viewType, setViewType] = useState('');

  // Key-value pairs
  const [props, setProps] = useState<Record<string, string>>({});
  const [cssProperties, setCssProperties] = useState<Record<string, string>>({});
  const [style, setStyle] = useState<Record<string, string | number>>({});
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  // Temporary inputs for adding key-value pairs
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newModifier, setNewModifier] = useState('');

  // Load existing transformer data
  useEffect(() => {
    if (!transformer) {
      resetFields();
      return;
    }

    if (framework === 'react-tailwind') {
      const t = transformer as ReactTailwindTransformer;
      setHtmlTag(t.htmlTag || '');
      setClassName(t.className || '');
      setProps(t.props || {});
    } else if (framework === 'html-css') {
      const t = transformer as HTMLCSSTransformer;
      setHtmlTag(t.htmlTag || '');
      setCssClass(t.cssClass || '');
      setCssProperties(t.cssProperties || {});
    } else if (framework === 'react-inline') {
      const t = transformer as ReactInlineTransformer;
      setHtmlTag(t.htmlTag || '');
      setStyle(t.style || {});
      setProps(t.props || {});
    } else if (framework === 'swift-ui') {
      const t = transformer as SwiftUITransformer;
      setComponent(t.component || '');
      setModifiers(t.modifiers ? [...t.modifiers] : []);
      setProps((t.props as Record<string, string>) || {});
    } else if (framework === 'android-xml') {
      const t = transformer as AndroidXMLTransformer;
      setViewType(t.viewType || '');
      setAttributes(t.attributes || {});
    }
  }, [transformer, framework]);

  const resetFields = () => {
    setHtmlTag('');
    setClassName('');
    setCssClass('');
    setComponent('');
    setViewType('');
    setProps({});
    setCssProperties({});
    setStyle({});
    setModifiers([]);
    setAttributes({});
  };

  const buildTransformer = (): AnyTransformer | undefined => {
    if (framework === 'react-tailwind') {
      const hasData = htmlTag || className || Object.keys(props).length > 0;
      if (!hasData) return undefined;
      const t: any = {};
      if (htmlTag) t.htmlTag = htmlTag;
      if (className) t.className = className;
      if (Object.keys(props).length > 0) t.props = props;
      return t as ReactTailwindTransformer;
    } else if (framework === 'html-css') {
      const hasData = htmlTag || cssClass || Object.keys(cssProperties).length > 0;
      if (!hasData) return undefined;
      const t: any = {};
      if (htmlTag) t.htmlTag = htmlTag;
      if (cssClass) t.cssClass = cssClass;
      if (Object.keys(cssProperties).length > 0) t.cssProperties = cssProperties;
      return t as HTMLCSSTransformer;
    } else if (framework === 'react-inline') {
      const hasData = htmlTag || Object.keys(style).length > 0 || Object.keys(props).length > 0;
      if (!hasData) return undefined;
      const t: any = {};
      if (htmlTag) t.htmlTag = htmlTag;
      if (Object.keys(style).length > 0) t.style = style;
      if (Object.keys(props).length > 0) t.props = props;
      return t as ReactInlineTransformer;
    } else if (framework === 'swift-ui') {
      const hasData = component || modifiers.length > 0 || Object.keys(props).length > 0;
      if (!hasData) return undefined;
      const t: any = {};
      if (component) t.component = component;
      if (modifiers.length > 0) t.modifiers = modifiers;
      if (Object.keys(props).length > 0) t.props = props;
      return t as SwiftUITransformer;
    } else if (framework === 'android-xml') {
      const hasData = viewType || Object.keys(attributes).length > 0;
      if (!hasData) return undefined;
      const t: any = {};
      if (viewType) t.viewType = viewType;
      if (Object.keys(attributes).length > 0) t.attributes = attributes;
      return t as AndroidXMLTransformer;
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'htmlTag') setHtmlTag(value);
    else if (field === 'className') setClassName(value);
    else if (field === 'cssClass') setCssClass(value);
    else if (field === 'component') setComponent(value);
    else if (field === 'viewType') setViewType(value);

    // Rebuild and emit
    setTimeout(() => {
      const newTransformer = buildTransformer();
      onChange(newTransformer);
    }, 0);
  };

  const handleAddKeyValue = (type: 'props' | 'cssProperties' | 'style' | 'attributes') => {
    if (!newPropKey.trim()) return;

    let newData: Record<string, any>;
    if (type === 'props') {
      newData = { ...props, [newPropKey]: newPropValue };
      setProps(newData);
    } else if (type === 'cssProperties') {
      newData = { ...cssProperties, [newPropKey]: newPropValue };
      setCssProperties(newData);
    } else if (type === 'style') {
      newData = { ...style, [newPropKey]: newPropValue };
      setStyle(newData);
    } else if (type === 'attributes') {
      newData = { ...attributes, [newPropKey]: newPropValue };
      setAttributes(newData);
    }

    setNewPropKey('');
    setNewPropValue('');

    setTimeout(() => {
      const newTransformer = buildTransformer();
      onChange(newTransformer);
    }, 0);
  };

  const handleRemoveKeyValue = (type: 'props' | 'cssProperties' | 'style' | 'attributes', key: string) => {
    if (type === 'props') {
      const newData = { ...props };
      delete newData[key];
      setProps(newData);
    } else if (type === 'cssProperties') {
      const newData = { ...cssProperties };
      delete newData[key];
      setCssProperties(newData);
    } else if (type === 'style') {
      const newData = { ...style };
      delete newData[key];
      setStyle(newData);
    } else if (type === 'attributes') {
      const newData = { ...attributes };
      delete newData[key];
      setAttributes(newData);
    }

    setTimeout(() => {
      const newTransformer = buildTransformer();
      onChange(newTransformer);
    }, 0);
  };

  const handleAddModifier = () => {
    if (!newModifier.trim() || modifiers.includes(newModifier)) return;
    const newMods = [...modifiers, newModifier];
    setModifiers(newMods);
    setNewModifier('');

    setTimeout(() => {
      const newTransformer = buildTransformer();
      onChange(newTransformer);
    }, 0);
  };

  const handleRemoveModifier = (mod: string) => {
    const newMods = modifiers.filter(m => m !== mod);
    setModifiers(newMods);

    setTimeout(() => {
      const newTransformer = buildTransformer();
      onChange(newTransformer);
    }, 0);
  };

  // React + Tailwind
  if (framework === 'react-tailwind') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            HTML Tag
          </label>
          <input
            type="text"
            value={htmlTag}
            onChange={(e) => handleFieldChange('htmlTag', e.target.value)}
            placeholder="e.g., div, button, span"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Tailwind Classes
          </label>
          <input
            type="text"
            value={className}
            onChange={(e) => handleFieldChange('className', e.target.value)}
            placeholder="e.g., flex items-center gap-2 px-4 py-2"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Props (key-value pairs)
          </label>
          <div className="space-y-2">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('props', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="key"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('props')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HTML + CSS
  if (framework === 'html-css') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            HTML Tag
          </label>
          <input
            type="text"
            value={htmlTag}
            onChange={(e) => handleFieldChange('htmlTag', e.target.value)}
            placeholder="e.g., div, button, span"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            CSS Class
          </label>
          <input
            type="text"
            value={cssClass}
            onChange={(e) => handleFieldChange('cssClass', e.target.value)}
            placeholder="e.g., my-custom-class"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            CSS Properties
          </label>
          <div className="space-y-2">
            {Object.entries(cssProperties).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('cssProperties', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="property"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('cssProperties')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // React Inline
  if (framework === 'react-inline') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            HTML Tag
          </label>
          <input
            type="text"
            value={htmlTag}
            onChange={(e) => handleFieldChange('htmlTag', e.target.value)}
            placeholder="e.g., div, button, span"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Inline Style
          </label>
          <div className="space-y-2">
            {Object.entries(style).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('style', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="property"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('style')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Props
          </label>
          <div className="space-y-2">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('props', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="key"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('props')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SwiftUI
  if (framework === 'swift-ui') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Component
          </label>
          <input
            type="text"
            value={component}
            onChange={(e) => handleFieldChange('component', e.target.value)}
            placeholder="e.g., VStack, HStack, Text"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Modifiers
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {modifiers.map(mod => (
                <span
                  key={mod}
                  className="px-3 py-1 bg-bg-secondary text-text-secondary rounded-full text-sm flex items-center gap-2"
                >
                  {mod}
                  <button
                    onClick={() => handleRemoveModifier(mod)}
                    className="hover:text-status-error-text"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModifier}
                onChange={(e) => setNewModifier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddModifier();
                  }
                }}
                placeholder="e.g., .padding(), .background(Color.blue)"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={handleAddModifier}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Props
          </label>
          <div className="space-y-2">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('props', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="key"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('props')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android XML
  if (framework === 'android-xml') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            View Type
          </label>
          <input
            type="text"
            value={viewType}
            onChange={(e) => handleFieldChange('viewType', e.target.value)}
            placeholder="e.g., LinearLayout, TextView, Button"
            className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Attributes
          </label>
          <div className="space-y-2">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="px-3 py-2 bg-bg-secondary text-text-secondary rounded flex-1 flex items-center justify-between">
                  <span><strong>{key}:</strong> {value}</span>
                  <button
                    onClick={() => handleRemoveKeyValue('attributes', key)}
                    className="text-status-error-text hover:opacity-80"
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                placeholder="attribute"
                className="w-1/3 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <input
                type="text"
                value={newPropValue}
                onChange={(e) => setNewPropValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
              />
              <button
                onClick={() => handleAddKeyValue('attributes')}
                className="px-3 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
