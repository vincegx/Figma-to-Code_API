#!/usr/bin/env python3
import json
from pathlib import Path

rules_file = Path('figma-data/rules/official-figma-rules.json')
with open(rules_file, 'r') as f:
    rules = json.load(f)

# Remove blendMode rule (generates invalid CSS)
rules = [r for r in rules if r['id'] != 'official-blendmode']
print(f'Removed blendMode, {len(rules)} rules remaining')

with open(rules_file, 'w') as f:
    json.dump(rules, f, indent=2)
