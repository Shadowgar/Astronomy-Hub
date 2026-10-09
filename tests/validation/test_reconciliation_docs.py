"""Negative authority/proposal/source cases; no runtime or network dependencies."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('reconciliation', ROOT/'scripts/validation/validate_reconciliation_docs.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


class ReconciliationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.read = staticmethod(lambda name: (ROOT/name).read_text())
        cls.index = cls.read('docs/DOCUMENT_INDEX.md')
        cls.inventory = cls.read('docs/DOC_INVENTORY.md')
        cls.plan = cls.read(v.PLAN)
        cls.c57 = cls.read(v.C57)
        cls.c6 = cls.read(v.C6)
        cls.audit = json.loads(cls.read(v.AUDIT))

    def test_current_authority_and_proposals(self):
        v.validate_discovery(self.index, self.inventory)
        v.validate_proposals(self.c57, self.c6)
        self.assertGreater(v.validate_plan(self.plan, self.audit, self.read), 0)

    def test_product_reference_cannot_control_execution(self):
        with self.assertRaisesRegex(ValueError, 'product reference in execution tier'):
            v.validate_discovery(self.index.replace('### Tier 2', '- `docs/execution/MASTER_PLAN.md`\n\n### Tier 2'), self.inventory)
        with self.assertRaisesRegex(ValueError, 'Master Plan must remain product reference'):
            v.validate_discovery(self.index, self.inventory.replace('PRODUCT_DEFINITION — non-executing product reference', 'CORE_CONTROL'))

    def test_missing_discovery_rejected(self):
        for name in v.DISCOVERY:
            with self.subTest(document=name), self.assertRaisesRegex(ValueError, 'index: missing'):
                v.validate_discovery(self.index.replace(name.removeprefix('docs/'), 'missing-fixture'), self.inventory)

    def test_approval_and_provider_gates_cannot_disappear(self):
        with self.assertRaisesRegex(ValueError, 'owner-approval stop gate'):
            v.validate_proposals(self.c57.replace('NOT AUTHORIZED FOR IMPLEMENTATION.', ''), self.c6)
        with self.assertRaisesRegex(ValueError, 'provider approval gate'):
            v.validate_proposals(self.c57, self.c6.replace('NO PROVIDER-SPECIFIC IMPLEMENTATION AUTHORIZED.', ''))
        with self.assertRaisesRegex(ValueError, 'six unique owner decisions'):
            v.validate_proposals(self.c57.replace('| OD6 ', '| OD5 '), self.c6)

    def test_capability_duplicates_and_classification_drift_rejected(self):
        with self.assertRaisesRegex(ValueError, 'capability IDs'):
            v.validate_plan(self.plan.replace('## flights —', '## satellites —'), self.audit, self.read)
        changed = copy.deepcopy(self.audit)
        changed['counts']['classification']['UNKNOWN'] += 1
        with self.assertRaisesRegex(ValueError, 'classification counts'):
            v.validate_plan(self.plan, changed, self.read)

    def test_fabricated_entrypoint_rejected(self):
        with self.assertRaisesRegex(ValueError, 'missing source entrypoint fabricatedFlightEntry'):
            v.validate_plan(self.plan.replace('`createFlightsAdapter / admitAircraft', '`fabricatedFlightEntry / admitAircraft'), self.audit, self.read)

    def test_required_fields_and_sources_cannot_be_omitted(self):
        with self.assertRaisesRegex(ValueError, 'missing Runtime status'):
            v.validate_plan(self.plan.replace('**Runtime status / evidence:**', '**Fixture evidence:**', 1), self.audit, self.read)
        with self.assertRaisesRegex(ValueError, 'missing exact source link'):
            v.validate_plan(self.plan.replace('](../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs)', '](missing-fixture.mjs)'), self.audit, self.read)


if __name__ == '__main__':
    unittest.main()
