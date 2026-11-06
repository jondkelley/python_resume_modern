#!/usr/bin/env python3
"""usage: json_to_rendercv.py [resume.json] > resume.yaml"""
import json
import sys

import yaml

from myresume.sharedlib.rendercv import to_rendercv

with open(sys.argv[1] if len(sys.argv) > 1 else 'resume.json') as f:
    yaml.safe_dump(to_rendercv(json.load(f)), sys.stdout,
                   sort_keys=False, allow_unicode=True, width=100)
