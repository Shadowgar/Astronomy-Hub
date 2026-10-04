"""Exercise the real validator CLI with temporary manifest mutations."""
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
VALIDATOR=ROOT/'scripts/validation/validate_architecture_docs.py'
MANIFEST=ROOT/'docs/context/CONTEXT_MANIFEST.yaml'
RULES=('do_not_load_unlisted_documents','must_declare_loaded_documents','must_match_task_context','architecture_must_precede_feature_execution','core_context_and_live_session_brief_are_mandatory')
FAILURES=('loading_docs_outside_manifest','missing_core_context','missing_session_brief','undeclared_context','executing_without_architecture_context')

class ManifestTests(unittest.TestCase):
    def validate(self,text):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'manifest.yaml';path.write_text(text)
            return subprocess.run([sys.executable,'-S',str(VALIDATOR),'--manifest',str(path)],text=True,capture_output=True)

    def test_current_manifest_passes_without_site_packages(self):
        result=self.validate(MANIFEST.read_text());self.assertEqual(result.returncode,0,result.stderr)

    def test_every_mandatory_rule_rejects_false(self):
        original=MANIFEST.read_text()
        for rule in RULES:
            with self.subTest(rule=rule):
                result=self.validate(original.replace(rule+': true',rule+': false'))
                self.assertNotEqual(result.returncode,0,result.stdout)
                self.assertIn('mandatory rules must remain true',result.stderr)

    def test_replaced_missing_or_extra_rules_rejected(self):
        original=MANIFEST.read_text()
        for label,text in (('replaced',original.replace(RULES[0]+': true','fixture_replaced_rule: true')),('missing',original.replace('- '+RULES[0]+': true\n','')),('extra',original.replace('failure_conditions:','- fixture_extra_rule: true\n\nfailure_conditions:'))):
            with self.subTest(case=label):self.assertNotEqual(self.validate(text).returncode,0)

    def test_failure_identifiers_are_exact_and_unique(self):
        original=MANIFEST.read_text()
        for label,text in (('replaced',original.replace(FAILURES[0],'fixture_replaced_failure')),('missing',original.replace('- '+FAILURES[0]+'\n','')),('extra',original+'\n- fixture_extra_failure\n'),('duplicate',original+'\n- '+FAILURES[0]+'\n')):
            with self.subTest(case=label):self.assertNotEqual(self.validate(text).returncode,0)

    def test_planning_requires_stack_authority(self):
        original=MANIFEST.read_text();before,pack=original.split('  planning:',1)
        result=self.validate(before+'  planning:'+pack.replace('    - docs/architecture/STACK_OVERVIEW.md\n',''))
        self.assertNotEqual(result.returncode,0)
        self.assertIn('planning: missing stack authority',result.stderr)

    def test_review_and_validation_require_tonight_contract(self):
        original=MANIFEST.read_text()
        for task in ('review','validation'):
            before,rest=original.split('  '+task+':',1)
            end=re.search(r'\n(?:  [a-z][a-z0-9_]*:|[a-z][a-z0-9_]*:)',rest).start()
            pack,after=rest[:end],rest[end:]
            changed=before+'  '+task+':'+pack.replace('    - docs/architecture/TONIGHT_CONTRACT.md\n','')+after
            with self.subTest(task=task):
                result=self.validate(changed);self.assertNotEqual(result.returncode,0)
                self.assertIn(task+': missing Tonight contract',result.stderr)

if __name__=='__main__':unittest.main()
