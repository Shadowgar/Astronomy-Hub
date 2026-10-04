#!/usr/bin/env python3
"""Validate architecture checkpoints using Python standard library only.

Supported manifest subset (not general YAML): spaces-only indentation; blank
lines/full-line comments; unique top-level global/tasks/rules/failure_conditions;
global.always path list at two spaces; named tasks at two spaces with one load
path list at four spaces; unindented rule lists with literal true/false; and
unindented failure identifier lists. Names are lowercase snake_case; paths are
unquoted docs/ Markdown/YAML paths. Ordering is preserved. Tabs, other indentation,
quoted scalars, inline comments, flow collections, anchors, tags, multiline
scalars and all other syntax are rejected. Structural validation follows parsing.

Defaults to docs_change plus Phase A evidence; no Git history, owner settings,
scratch tooling, site-packages or running application is required. --manifest
accepts a temporary manifest for bounded negative qualification.
"""
import argparse
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[2]
ARCHITECTURE = 'docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md'
REQUIRED_RULES = frozenset((
    'do_not_load_unlisted_documents', 'must_declare_loaded_documents',
    'must_match_task_context', 'architecture_must_precede_feature_execution',
    'core_context_and_live_session_brief_are_mandatory',
))
REQUIRED_FAILURES = frozenset((
    'loading_docs_outside_manifest', 'missing_core_context', 'missing_session_brief',
    'undeclared_context', 'executing_without_architecture_context',
))
ADR_NAMES = (
    '0001-universal-application-state.md', '0002-swe-sky-renderer.md',
    '0003-gods-eye-earth-runtime.md', '0004-additive-earth-extensions.md',
    '0005-cesium-planetary-direction.md', '0006-controlled-renderer-handoffs.md',
    '0007-immutable-upstream-source.md', '0008-provider-licensing-boundaries.md',
)


def parse_manifest(text):
    """Parse only the manifest subset documented above; reject everything else."""
    manifest = {}
    section = None
    task = None
    rules_seen = set()
    identifier = r'[a-z][a-z0-9_]*'
    document = r'docs/[A-Za-z0-9_./-]+\.(?:md|yaml)'

    def fail(number, reason):
        raise ValueError(f'manifest line {number}: {reason}')

    for number, raw in enumerate(text.splitlines(), 1):
        if '\t' in raw:
            fail(number, 'tabs are unsupported')
        if not raw.strip() or raw.lstrip(' ').startswith('#'):
            continue
        if raw != raw.rstrip(' '):
            fail(number, 'trailing spaces are unsupported')
        indent = len(raw) - len(raw.lstrip(' '))
        line = raw[indent:]
        if indent == 0 and line in ('global:', 'tasks:', 'rules:', 'failure_conditions:'):
            section = line[:-1]
            if section in manifest:
                fail(number, f'duplicate top-level key {section}')
            manifest[section] = {} if section in ('global', 'tasks') else []
            task = None
        elif section == 'global' and indent == 2 and line == 'always:':
            if 'always' in manifest['global']:
                fail(number, 'duplicate global key always')
            manifest['global']['always'] = []
        elif section == 'global' and indent == 2 and re.fullmatch('- '+document, line):
            if 'always' not in manifest['global']:
                fail(number, 'document before always key')
            manifest['global']['always'].append(line[2:])
        elif section == 'tasks' and indent == 2 and re.fullmatch(identifier+':', line):
            task = line[:-1]
            if task in manifest['tasks']:
                fail(number, f'duplicate task {task}')
            manifest['tasks'][task] = {}
        elif section == 'tasks' and task is not None and indent == 4 and line == 'load:':
            if 'load' in manifest['tasks'][task]:
                fail(number, f'duplicate task key {task}.load')
            manifest['tasks'][task]['load'] = []
        elif section == 'tasks' and task is not None and indent == 4 and re.fullmatch('- '+document, line):
            if 'load' not in manifest['tasks'][task]:
                fail(number, f'document before {task}.load')
            manifest['tasks'][task]['load'].append(line[2:])
        elif section == 'rules' and indent == 0:
            match = re.fullmatch(r'- ('+identifier+r'): (true|false)', line)
            if match is None:
                fail(number, 'malformed rule/boolean or unsupported syntax')
            name, boolean = match.groups()
            if name in rules_seen:
                fail(number, f'duplicate rule {name}')
            rules_seen.add(name)
            manifest['rules'].append({name: boolean == 'true'})
        elif section == 'failure_conditions' and indent == 0 and re.fullmatch('- '+identifier, line):
            manifest['failure_conditions'].append(line[2:])
        else:
            fail(number, 'unexpected key, indentation, list item or unsupported syntax')
    return manifest


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
    manifest = parse_manifest(manifest_path.read_text())
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
    rule_names = [name for rule in manifest['rules'] for name in rule]
    require(len(rule_names) == len(REQUIRED_RULES) and set(rule_names) == REQUIRED_RULES,
            'manifest: missing/extra mandatory rule identifiers')
    require(all(value is True for rule in manifest['rules'] for value in rule.values()),
            'manifest: mandatory rules must remain true')
    failures = manifest['failure_conditions']
    require(len(failures) == len(REQUIRED_FAILURES) and set(failures) == REQUIRED_FAILURES,
            'manifest: failure identifiers must match the exact required set without duplicates')
    require(set(tasks) == {'docs_change', 'backend_change', 'frontend_change', 'validation',
                           'debug', 'review', 'reconciliation', 'planning'}, 'manifest: unexpected task packs')
    for task in ('docs_change', 'planning', 'frontend_change', 'backend_change', 'review', 'validation'):
        require(all(name in tasks[task]['load'] for name in (
            'docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md',
            'docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md')),
            f'{task}: missing Phase B study/evidence')
    for task in ('review', 'planning'):
        require('docs/architecture/STACK_OVERVIEW.md' in tasks[task]['load'],
                f'{task}: missing stack authority')
    for task in ('review', 'validation'):
        require('docs/architecture/TONIGHT_CONTRACT.md' in tasks[task]['load'],
                f'{task}: missing Tonight contract')
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
    except (ValueError, OSError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
