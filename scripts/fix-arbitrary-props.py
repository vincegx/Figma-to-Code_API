#!/usr/bin/env python3
"""
Fix arbitrary properties in official rules to use native Tailwind classes
"""
import json
from pathlib import Path

# Map arbitrary properties to native Tailwind classes
ARBITRARY_TO_NATIVE = {
    '[align-self:auto]': 'self-auto',
    '[align-self:stretch]': 'self-stretch',
    '[align-self:flex-start]': 'self-start',
    '[align-self:flex-end]': 'self-end',
    '[align-self:center]': 'self-center',
    '[align-self:baseline]': 'self-baseline',

    '[flex-grow:0]': 'grow-0',
    '[flex-grow:1]': 'grow',

    '[display:flex]': 'flex',
    '[display:inline-flex]': 'inline-flex',
    '[display:block]': 'block',
    '[display:grid]': 'grid',
    '[display:none]': 'hidden',

    '[align-items:flex-start]': 'items-start',
    '[align-items:flex-end]': 'items-end',
    '[align-items:center]': 'items-center',
    '[align-items:stretch]': 'items-stretch',
    '[align-items:baseline]': 'items-baseline',

    '[justify-content:flex-start]': 'justify-start',
    '[justify-content:flex-end]': 'justify-end',
    '[justify-content:center]': 'justify-center',
    '[justify-content:space-between]': 'justify-between',
    '[justify-content:space-around]': 'justify-around',
    '[justify-content:space-evenly]': 'justify-evenly',

    '[overflow:hidden]': 'overflow-hidden',
    '[overflow:visible]': 'overflow-visible',
    '[overflow:scroll]': 'overflow-scroll',
    '[overflow:auto]': 'overflow-auto',

    '[flex-wrap:wrap]': 'flex-wrap',
    '[flex-wrap:nowrap]': 'flex-nowrap',
    '[flex-wrap:wrap-reverse]': 'flex-wrap-reverse',

    '[text-align:left]': 'text-left',
    '[text-align:center]': 'text-center',
    '[text-align:right]': 'text-right',
    '[text-align:justify]': 'text-justify',

    '[text-transform:uppercase]': 'uppercase',
    '[text-transform:lowercase]': 'lowercase',
    '[text-transform:capitalize]': 'capitalize',
    '[text-transform:none]': 'normal-case',
}

rules_file = Path('figma-data/rules/official-figma-rules.json')
with open(rules_file, 'r') as f:
    rules = json.load(f)

fixes_count = 0

for rule in rules:
    for framework in ['react-tailwind']:
        if framework in rule.get('transformers', {}):
            transformer = rule['transformers'][framework]
            if 'className' in transformer:
                original = transformer['className']

                # Replace arbitrary properties with native classes
                fixed = original
                for arbitrary, native in ARBITRARY_TO_NATIVE.items():
                    if arbitrary in fixed:
                        fixed = fixed.replace(arbitrary, native)
                        fixes_count += 1
                        print(f"{rule['id']}: {arbitrary} → {native}")

                transformer['className'] = fixed

print(f'\n✅ Fixed {fixes_count} arbitrary properties')

with open(rules_file, 'w') as f:
    json.dump(rules, f, indent=2)
