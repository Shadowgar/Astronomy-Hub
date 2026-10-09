#!/usr/bin/env python3
"""Validate C5.6.75 planning discovery, authority, audit counts and source references.

Standard library only; read-only. No upstream checkout, Docker, packages or network
required. Audit line/source-hash forensics and preservation are separately recorded
in the checkpoint evidence, not inferred from this document check.
"""
import collections
import importlib.util
import json
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
PLAN = 'docs/execution/EARTH_CAPABILITY_PLAN.md'
C57 = 'docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md'
C6 = 'docs/execution/C6_GLOBAL_MAPPING_SPEC.md'
ADR = 'docs/architecture/decisions/0009-owned-earth-feature-reuse.md'
EVIDENCE = 'docs/validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md'
AUDIT = 'docs/audits/gods-eye-implementation-inventory-2026-10-05.json'
DISCOVERY = (PLAN, C57, C6, ADR, EVIDENCE)
REQUIRED_FIELDS = (
    'Owner-facing purpose', 'Current Hub / entrypoints', 'Pinned upstream',
    'Current relationship / risk', 'Runtime status / evidence',
    'Bug versus scope versus unverified', 'Provider/credential/license/distribution',
    'Remediation pattern / phase', 'Acceptance required', 'Unresolved owner decision',
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate_discovery(index, inventory):
    for name in DISCOVERY:
        require(name.removeprefix('docs/') in index, 'index: missing '+name)
        require(name in inventory, 'inventory: missing '+name)
    tier1 = index.split('### Tier 1', 1)[1].split('### Tier 2', 1)[0]
    require('docs/execution/MASTER_PLAN.md' not in tier1, 'index: product reference in execution tier')
    row = next((line for line in inventory.splitlines() if '`docs/execution/MASTER_PLAN.md`' in line), '')
    require('PRODUCT_DEFINITION' in row and 'CORE_CONTROL' not in row,
            'inventory: Master Plan must remain product reference')
    require('no activation' in inventory, 'inventory: capability plan must not activate work')


def validate_proposals(c57, c6):
    require('PROPOSED — AWAITING OWNER APPROVAL. NOT AUTHORIZED FOR IMPLEMENTATION.' in c57,
            'C5.7: missing owner-approval stop gate')
    require('NO PROVIDER-SPECIFIC IMPLEMENTATION AUTHORIZED.' in c6, 'C6: missing provider approval gate')
    headings = re.findall(r'^## C5\.7-([A-E]) —', c57, re.M)
    require(headings == list('ABCDE'), 'C5.7: expected ordered single A-E package set')
    require('Only one bounded implementation' in c57 and 'package may be active at a time' in c57,
            'C5.7: missing single-package gate')
    register = c57.split('## Owner Decision Register', 1)[1]
    require('UNRESOLVED' in register and 'Proposed default is not owner approval' in register,
            'C5.7: decisions must remain explicitly unresolved')
    require(re.findall(r'^\| (OD[1-6]) ', register, re.M) == ['OD'+str(i) for i in range(1, 7)],
            'C5.7: expected six unique owner decisions')
    require(re.findall(r'^\| (C6-[0-5]) ', c6, re.M) == ['C6-'+str(i) for i in range(6)],
            'C6: expected provider-first ordered stages')


def validate_plan(plan, inventory, read_source):
    caps = inventory['capabilities']
    expected = {cap['id'] for cap in caps}
    ids = re.findall(r'^## ([a-z0-9-]+) —', plan, re.M)
    require(len(ids) == len(expected) == 67 and set(ids) == expected,
            'plan: capability IDs missing, duplicate or invented')
    counts = inventory['counts']
    require(dict(collections.Counter(cap['classification'] for cap in caps)) == counts['classification'],
            'audit: classification counts do not match inventory')
    require(sum(cap['provider_blocked'] for cap in caps) == counts['provider_data_gated'] == 45,
            'audit: provider gate denominator drift')
    require(sum(cap['hook_blocked'] for cap in caps) == counts['hook_adapter_gated'] == 11,
            'audit: hook gate denominator drift')
    symbols = 0
    for cap in caps:
        record = plan.split('## '+cap['id']+' —', 1)[1].split('\n## ', 1)[0]
        for field in REQUIRED_FIELDS:
            require('**'+field+':**' in record, f'plan {cap["id"]}: missing {field}')
        require(cap['classification']+' / ' in record,
                f'plan {cap["id"]}: altered audit relationship')
        entry = record.split('**Current Hub / entrypoints:**', 1)[1].split('\n**Pinned upstream:', 1)[0]
        if cap['hub']:
            source = '\n'.join(read_source(name) for name in cap['hub'])
            for name in cap['hub']:
                require('](../../'+name+')' in entry, f'plan {cap["id"]}: missing exact source link {name}')
            names = re.search(r'`([^`]+)`', entry).group(1).split(' (', 1)[0]
            for symbol in names.split(' / '):
                require(re.search(r'\b'+re.escape(symbol)+r'\b', source) is not None,
                        f'plan {cap["id"]}: missing source entrypoint {symbol}')
                symbols += 1
        else:
            require('No Hub feature source/control' in entry, f'plan {cap["id"]}: invented Hub implementation')
    return symbols


def heading_anchors(text):
    """GitHub heading slug subset used by authored planning links, with duplicates."""
    counts = collections.Counter()
    anchors = set()
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.M):
        raw = heading.lower().replace(' ', '-')
        slug = ''.join(c for c in raw if c in '-_' or unicodedata.category(c)[0] in 'LN')
        anchors.add(slug if counts[slug] == 0 else slug+'-'+str(counts[slug]))
        counts[slug] += 1
    return anchors


def validate_fragments(name):
    count = 0
    for target in re.findall(r'\[[^\]\n]*\]\(([^\s)]+)\)', (ROOT/name).read_text()):
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.fragment:
            continue
        path = (ROOT/name).parent/parsed.path if parsed.path else ROOT/name
        require(path.is_file(), name+': missing fragment file '+target)
        require(unquote(parsed.fragment) in heading_anchors(path.read_text()),
                name+': invalid heading fragment '+target)
        count += 1
    return count


def main():
    try:
        read = lambda name: (ROOT/name).read_text()
        validate_discovery(read('docs/DOCUMENT_INDEX.md'), read('docs/DOC_INVENTORY.md'))
        validate_proposals(read(C57), read(C6))
        inventory = json.loads(read(AUDIT))
        symbols = validate_plan(read(PLAN), inventory, read)
        spec = importlib.util.spec_from_file_location('architecture_docs', ROOT/'scripts/validation/validate_architecture_docs.py')
        architecture = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(architecture)
        manifest = architecture.parse_manifest(read('docs/context/CONTEXT_MANIFEST.yaml'))
        required = set(DISCOVERY[:-1]) | {
            'docs/audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md',
            'docs/audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md',
        }
        for task, pack in manifest['tasks'].items():
            require(required <= set(pack['load']), task+': missing canonical planning/audit context')
        names = set(DISCOVERY) | {'docs/DOCUMENT_INDEX.md', 'docs/README.md', 'docs/ASTRONOMY_HUB_DIAGRAM.md'}
        links = sum(architecture.markdown_links(name) for name in names)
        fragments = sum(validate_fragments(name) for name in names)
        print(f'PASS: index/inventory authority and discovery; eight context packs; C5.7 A-E and six unresolved decisions; C6-0 through C6-5 gates.')
        print(f'PASS: 67 capability records, ten required fields each; audit relationship/gate counts; {symbols} source entrypoint references; {links} relative links and {fragments} heading fragments.')
    except (ValueError, OSError, KeyError, IndexError, AttributeError) as exc:
        print('FAIL: '+str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
