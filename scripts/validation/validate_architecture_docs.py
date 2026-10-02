#!/usr/bin/env python3
"""Validate checkpoint documentation with the existing Python/PyYAML tooling.

Defaults to the docs_change manifest pack plus the Phase A evidence. No Git
history, owner editor settings, scratch files, or running application is required.
--manifest accepts a temporary manifest for bounded negative qualification.
"""
import argparse
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

import yaml

ROOT = Path(__file__).resolve().parents[2]
ARCHITECTURE = 'docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md'
ADR_NAMES = (
    '0001-universal-application-state.md', '0002-swe-sky-renderer.md',
    '0003-gods-eye-earth-runtime.md', '0004-additive-earth-extensions.md',
    '0005-cesium-planetary-direction.md', '0006-controlled-renderer-handoffs.md',
    '0007-immutable-upstream-source.md', '0008-provider-licensing-boundaries.md',
)


class UniqueKeyLoader(yaml.SafeLoader):
    pass


def mapping(loader, node, deep=False):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise ValueError(f'duplicate YAML key: {key}')
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def paths(value, label):
    require(isinstance(value, list) and bool(value), f'{label}: expected nonempty path list')
    require(all(isinstance(p, str) and p.startswith('docs/') for p in value),
            f'{label}: expected docs/ paths')
    require(len(value) == len(set(value)), f'{label}: duplicate document entry')
    for name in value:
        target = (ROOT / name).resolve()
        require(target.is_relative_to(ROOT) and target.is_file(), f'{label}: missing/invalid path {name}')
    return value


def markdown_links(name):
    text = (ROOT / name).read_text()
    # Ignore examples inside code fences; validate links rendered as Markdown.
    visible = []
    fence = None
    for line in text.splitlines():
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
        elif fence is None:
            visible.append(line)
    require(fence is None, f'{name}: unbalanced code fence')
    rendered = '\n'.join(visible)
    targets = re.findall(r'!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+[^)]*)?\)', rendered)
    targets += re.findall(r'^\s*\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)', rendered, re.M)
    count = 0
    for target in targets:
        target = target.strip('<>')
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        path = unquote(parsed.path)
        resolved = (ROOT / path.lstrip('/') if path.startswith('/') else (ROOT / name).parent / path).resolve()
        require(resolved.is_relative_to(ROOT) and resolved.exists(), f'{name}: broken relative link {target}')
        count += 1
    return count


def validate(manifest_path):
    manifest = yaml.load(manifest_path.read_text(), Loader=UniqueKeyLoader)
    require(isinstance(manifest, dict), 'manifest: expected mapping')
    require(set(manifest) == {'global', 'tasks', 'rules', 'failure_conditions'}, 'manifest: invalid top-level structure')
    require(isinstance(manifest['global'], dict) and set(manifest['global']) == {'always'}, 'manifest: invalid global structure')
    always = paths(manifest['global']['always'], 'global.always')
    require(always == ['docs/context/CORE_CONTEXT.md', 'docs/context/LIVE_SESSION_BRIEF.md'], 'manifest: missing/incorrect mandatory context')
    tasks = manifest['tasks']
    require(isinstance(tasks, dict) and tasks, 'manifest: expected task mappings')
    total = len(always)
    for task, pack in tasks.items():
        require(isinstance(task, str) and isinstance(pack, dict) and set(pack) == {'load'}, f'{task}: invalid pack structure')
        loaded = paths(pack['load'], task)
        require(loaded[:2] == always and ARCHITECTURE in loaded, f'{task}: missing mandatory context/architecture')
        total += len(loaded)
    for field in ('rules', 'failure_conditions'):
        require(isinstance(manifest[field], list) and bool(manifest[field]), f'manifest: invalid {field}')
    for rule in manifest['rules']:
        require(isinstance(rule, dict) and len(rule) == 1 and all(isinstance(v, bool) for v in rule.values()), 'manifest: invalid rule')
    require(all(isinstance(v, str) for v in manifest['failure_conditions']), 'manifest: invalid failure condition')
    require(set(tasks) == {'docs_change', 'backend_change', 'frontend_change', 'validation',
                           'debug', 'review', 'reconciliation', 'planning'}, 'manifest: unexpected task packs')
    for task in ('docs_change', 'planning', 'frontend_change', 'backend_change', 'review', 'validation'):
        require(all(name in tasks[task]['load'] for name in (
            'docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md',
            'docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md')),
            f'{task}: missing Phase B study/evidence')
    docs = sorted(set(p for p in tasks['docs_change']['load'] if p.endswith('.md')) |
                  {'docs/validation/UNIFIED_UNIVERSE_ARCHITECTURE_EVIDENCE.md'})
    links = sum(markdown_links(name) for name in docs)
    adr_dir = ROOT / 'docs/architecture/decisions'
    require({p.name for p in adr_dir.glob('*.md')} == set(ADR_NAMES), 'checkpoint: expected exactly the eight named ADRs')
    print(f'PASS: manifest structure/paths/duplicates; {total} document-path entries ({total-len(always)} task entries + {len(always)} global entries); {len(tasks)} task packs.')
    print(f'PASS: {len(docs)} checkpoint Markdown documents; {links} relative links; code fences balanced; {len(ADR_NAMES)} expected ADRs.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, default=ROOT / 'docs/context/CONTEXT_MANIFEST.yaml')
    args = parser.parse_args()
    try:
        validate(args.manifest)
    except (ValueError, OSError, yaml.YAMLError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
