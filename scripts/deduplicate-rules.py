#!/usr/bin/env python3
"""
Remove duplicate rules from official-figma-rules.json
Keeps the LAST occurrence of each duplicate ID
"""

import json
import sys
from pathlib import Path

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

    # Deduplicate by keeping LAST occurrence (most recent)
    seen = {}
    for rule in rules:
        rule_id = rule['id']
        seen[rule_id] = rule  # Overwrites previous if duplicate

    unique_rules = list(seen.values())

    print(f"After deduplication: {len(unique_rules)} unique rules")
    print(f"Removed {len(rules) - len(unique_rules)} duplicates")

    # Write back
    print(f"Writing {rules_file}...")
    with open(rules_file, 'w', encoding='utf-8') as f:
        json.dump(unique_rules, f, indent=2, ensure_ascii=False)

    print("✅ Done!")
    return 0

if __name__ == '__main__':
    sys.exit(main())
