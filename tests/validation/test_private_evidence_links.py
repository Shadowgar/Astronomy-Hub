"""Protect clean-checkout links without suppressing real missing evidence/source errors."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('architecture_links', ROOT/'scripts/validation/validate_architecture_docs.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


class PrivateEvidenceTests(unittest.TestCase):
    def test_missing_registered_artifact_is_historical_only(self):
        """Allow one exact historical reference; reject unregistered paths or documents."""
        records = v.private_evidence_registry()
        with tempfile.TemporaryDirectory() as folder, patch.object(v, 'ROOT', Path(folder)):
            target = Path(folder)/records[0]['path']
            self.assertFalse(target.exists())
            self.assertTrue(v.private_evidence_reference(records[0]['document'], target, records))
            self.assertFalse(v.private_evidence_reference('docs/README.md', target, records))
            self.assertFalse(v.private_evidence_reference(records[0]['document'], target.with_name('typo.png'), records))

    def test_present_artifact_must_match_retained_hash(self):
        """Reject altered local bytes instead of treating existence as provenance."""
        records = copy.deepcopy(v.private_evidence_registry())
        records[0]['sha256'] = hashlib.sha256(b'private historical fixture').hexdigest()
        with tempfile.TemporaryDirectory() as folder, patch.object(v, 'ROOT', Path(folder)):
            target = Path(folder)/records[0]['path']
            target.parent.mkdir(parents=True)
            target.write_bytes(b'private historical fixture')
            self.assertTrue(v.private_evidence_reference(records[0]['document'], target, records))
            target.write_bytes(b'changed fixture')
            with self.assertRaisesRegex(ValueError, 'historical evidence hash mismatch'):
                v.private_evidence_reference(records[0]['document'], target, records)

    def test_missing_unregistered_link_still_fails(self):
        """Keep a misspelled screenshot and ordinary repository link mandatory."""
        registry = json.loads((ROOT/'scripts/validation/private_evidence_links.json').read_text())
        with tempfile.TemporaryDirectory() as folder, patch.object(v, 'ROOT', Path(folder)):
            base = Path(folder)
            metadata = base/'scripts/validation/private_evidence_links.json'
            metadata.parent.mkdir(parents=True)
            metadata.write_text(json.dumps(registry))
            doc = base/'docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md'
            doc.parent.mkdir(parents=True)
            registered = registry['records'][0]['path']
            doc.write_text('[Retained](../../'+registered+')')
            stats = {}
            self.assertEqual(v.markdown_links(str(doc.relative_to(base)), stats=stats), 1)
            self.assertEqual(stats['private'], 1)
            for target in ('output/playwright/earth-expansion/typo.png', 'backend/missing.py'):
                doc.write_text('[Missing](../../'+target+')')
                with self.subTest(target=target), self.assertRaisesRegex(ValueError, 'broken relative link'):
                    v.markdown_links(str(doc.relative_to(base)))

    def test_registry_cannot_expand_to_arbitrary_or_duplicate_links(self):
        """Reject corrupt, out-of-scope or duplicate historical exemptions."""
        original = json.loads((ROOT/'scripts/validation/private_evidence_links.json').read_text())
        with tempfile.TemporaryDirectory() as folder, patch.object(v, 'ROOT', Path(folder)):
            metadata = Path(folder)/'scripts/validation/private_evidence_links.json'
            metadata.parent.mkdir(parents=True)
            for field, value in (('path', 'backend/missing.py'), ('document', 'docs/README.md'),
                                 ('sha256', 'not-a-hash'), ('evidence_class', 'CURRENT_PROOF')):
                changed = copy.deepcopy(original)
                changed['records'][0][field] = value
                metadata.write_text(json.dumps(changed))
                with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'invalid source/path/class/hash'):
                    v.private_evidence_registry()
            changed = copy.deepcopy(original)
            changed['records'][1] = changed['records'][0]
            metadata.write_text(json.dumps(changed))
            with self.assertRaisesRegex(ValueError, 'duplicate reference'):
                v.private_evidence_registry()


if __name__ == '__main__':
    unittest.main()
