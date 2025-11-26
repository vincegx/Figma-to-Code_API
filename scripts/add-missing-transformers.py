#!/usr/bin/env python3
"""
Add missing react-tailwind and react-inline transformers to official rules.

This script:
1. Reads official-figma-rules.json
2. For each rule that has html-css but missing react-tailwind or react-inline
3. Adds the missing transformers based on CSS property mappings
"""

import json
import sys
from pathlib import Path

# CSS property to Tailwind class mapping
# Note: CSS values use "$value" which must be converted to "${value}px" for both CSS and Tailwind
CSS_TO_TAILWIND = {
    # Spacing
    'gap': 'gap-[{value}px]',
    'padding-left': 'pl-[{value}px]',
    'padding-right': 'pr-[{value}px]',
    'padding-top': 'pt-[{value}px]',
    'padding-bottom': 'pb-[{value}px]',
    'row-gap': 'gap-y-[{value}px]',
    'column-gap': 'gap-x-[{value}px]',

    # Border
    'border-radius': 'rounded-[{value}px]',
    'border-width': 'border-[{value}px]',

    # Visual
    'opacity': 'opacity-[{value}]',

    # Typography
    'font-weight': 'font-[{value}]',
    'font-size': 'text-[{value}px]',
    'letter-spacing': 'tracking-[{value}px]',

    # Layout
    'min-width': 'min-w-[{value}px]',
    'max-width': 'max-w-[{value}px]',
    'min-height': 'min-h-[{value}px]',
    'max-height': 'max-h-[{value}px]',
}

# CSS values that need px unit
CSS_NEEDS_PX = {
    'gap', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
    'row-gap', 'column-gap', 'border-radius', 'border-width',
    'font-size', 'letter-spacing',
    'min-width', 'max-width', 'min-height', 'max-height'
}

def convert_css_value_to_tailwind(css_value: str) -> str:
    """Convert CSS $value or ${value}px to Tailwind format."""
    if '$value' in css_value:
        return css_value.replace('$value', '${value}')
    return css_value

def add_tailwind_transformer(rule: dict, html_css: dict) -> dict:
    """Generate react-tailwind transformer from html-css."""
    css_props = html_css.get('cssProperties', {})

    if not css_props:
        return None

    # Find the first CSS property
    prop_name = list(css_props.keys())[0]
    prop_value = css_props[prop_name]

    # Map to Tailwind
    tailwind_pattern = CSS_TO_TAILWIND.get(prop_name)

    if not tailwind_pattern:
        # For unmapped properties, use arbitrary values
        value_part = convert_css_value_to_tailwind(prop_value)
        return {'className': f'[{prop_name}:{value_part}]'}

    # Replace {value} with actual value from CSS
    # Always use ${value} format for template strings
    className = tailwind_pattern.replace('{value}', '${value}')

    return {'className': className}

def add_inline_transformer(rule: dict, html_css: dict) -> dict:
    """Generate react-inline transformer from html-css."""
    css_props = html_css.get('cssProperties', {})

    if not css_props:
        return None

    # Convert CSS properties to camelCase for React inline styles
    style = {}
    for prop_name, prop_value in css_props.items():
        # Convert hyphenated to camelCase
        camel_name = ''.join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(prop_name.split('-'))
        )

        # Convert $value to ${value}px for properties that need px unit
        if '$value' in prop_value:
            if prop_name in CSS_NEEDS_PX:
                react_value = '${value}px'
            else:
                react_value = '${value}'
        else:
            react_value = prop_value

        style[camel_name] = react_value

    return {'style': style}

def process_rules(rules: list, force_regenerate: bool = False) -> tuple[list, int]:
    """Add missing transformers to rules."""
    modified_count = 0

    for rule in rules:
        transformers = rule.get('transformers', {})
        html_css = transformers.get('html-css')

        if not html_css:
            continue

        # Fix CSS values: convert "$value" to "${value}" or "${value}px"
        css_props = html_css.get('cssProperties', {})
        for prop_name, prop_value in css_props.items():
            if prop_value == '$value':
                if prop_name in CSS_NEEDS_PX:
                    css_props[prop_name] = '${value}px'
                else:
                    css_props[prop_name] = '${value}'

        has_tailwind = 'react-tailwind' in transformers
        has_inline = 'react-inline' in transformers

        # Regenerate if missing transformers OR force flag is set
        if not has_tailwind or not has_inline or force_regenerate:
            modified_count += 1

            # Always regenerate transformers to ensure they match updated CSS
            tailwind = add_tailwind_transformer(rule, html_css)
            if tailwind:
                transformers['react-tailwind'] = tailwind

            inline = add_inline_transformer(rule, html_css)
            if inline:
                transformers['react-inline'] = inline

    return rules, modified_count

def main():
    # Find the rules file
    script_dir = Path(__file__).parent
    rules_file = script_dir.parent / 'figma-data' / 'rules' / 'official-figma-rules.json'

    if not rules_file.exists():
        print(f"Error: {rules_file} not found", file=sys.stderr)
        return 1

    print(f"Reading {rules_file}...")
    with open(rules_file, 'r', encoding='utf-8') as f:
        rules = json.load(f)

    if not isinstance(rules, list):
        print("Error: rules file should contain an array", file=sys.stderr)
        return 1

    print(f"Found {len(rules)} rules")

    # Process rules with force_regenerate flag
    force = '--force' in sys.argv
    if force:
        print("Force regenerating all transformers...")

    rules, modified_count = process_rules(rules, force_regenerate=force)

    if modified_count == 0:
        print("No rules needed modification")
        return 0

    print(f"Modified {modified_count} rules")

    # Write back
    print(f"Writing {rules_file}...")
    with open(rules_file, 'w', encoding='utf-8') as f:
        json.dump(rules, f, indent=2, ensure_ascii=False)

    print("✅ Done!")
    return 0

if __name__ == '__main__':
    sys.exit(main())
