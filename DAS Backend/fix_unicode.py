#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Quick script to replace Unicode characters"""

with open('test_schedule_generation.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Unicode checkmarks and symbols
content = content.replace('✓', '[OK]')
content = content.replace('⚠️', '[WARN]')
content = content.replace('❌', '[ERROR]')
content = content.replace('✅', '[SUCCESS]')

# Remove any remaining Unicode symbols
#content = content.encode('ascii', 'ignore').decode('ascii')

with open('test_schedule_generation.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Unicode characters replaced")

