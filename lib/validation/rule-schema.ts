/**
 * Zod validation schema for Custom Rules (WP23)
 *
 * Validates MultiFrameworkRule structure for safe API input
 */

import { z } from 'zod';

// Selector schema
const SelectorSchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(), // Accept string (can be regex pattern as string)
  width: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  height: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  hasChildren: z.boolean().optional(),
  parentType: z.string().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Selector must have at least one property' }
);

// Transformer schemas per framework
const ReactTailwindTransformerSchema = z.object({
  htmlTag: z.string().optional(),
  className: z.string().optional(),
  props: z.record(z.string()).optional(),
});

const HTMLCSSTransformerSchema = z.object({
  htmlTag: z.string().optional(),
  cssClass: z.string().optional(),
  cssProperties: z.record(z.string()).optional(),
});

const ReactInlineTransformerSchema = z.object({
  htmlTag: z.string().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
  props: z.record(z.string()).optional(),
});

const SwiftUITransformerSchema = z.object({
  component: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
  props: z.record(z.union([z.string(), z.number()])).optional(),
});

const AndroidXMLTransformerSchema = z.object({
  viewType: z.string().optional(),
  attributes: z.record(z.string()).optional(),
});

// Transformers object (at least one framework required)
const TransformersSchema = z.object({
  'react-tailwind': ReactTailwindTransformerSchema.optional(),
  'html-css': HTMLCSSTransformerSchema.optional(),
  'react-inline': ReactInlineTransformerSchema.optional(),
  'swift-ui': SwiftUITransformerSchema.optional(),
  'android-xml': AndroidXMLTransformerSchema.optional(),
}).refine(
  (data) => Object.values(data).some(transformer => transformer !== undefined),
  { message: 'At least one framework transformer is required' }
);

// Source metadata (optional, for community rules)
const SourceSchema = z.object({
  repo: z.string().optional(),
  file: z.string().optional(),
  url: z.string().url().optional(),
}).optional();

// Full MultiFrameworkRule schema for custom rules
export const CustomRuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  type: z.literal('custom'), // Must be custom for this API
  category: z.enum([
    'layout',
    'colors',
    'typography',
    'spacing',
    'borders',
    'effects',
    'components',
    'constraints',
    'other',
    'custom'
  ]),
  tags: z.array(z.string()),
  enabled: z.boolean(),
  priority: z.number().min(100, 'Custom rules must have priority >= 100'),
  selector: SelectorSchema,
  transformers: TransformersSchema,
  source: SourceSchema,
});

// Type inference
export type CustomRuleInput = z.infer<typeof CustomRuleSchema>;

// Validation functions
export function validateCustomRule(data: unknown): { success: true; data: CustomRuleInput } | { success: false; error: string } {
  try {
    const validated = CustomRuleSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    console.error('Validation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
  }
}

// Partial schema for PATCH updates (all fields optional except id)
export const CustomRuleUpdateSchema = CustomRuleSchema.partial().required({ id: true });

export type CustomRuleUpdate = z.infer<typeof CustomRuleUpdateSchema>;
