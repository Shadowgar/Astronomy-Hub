"""Local catalog fallback, using declared catalog-acquisition fixtures only."""
import importlib.util
import logging
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
MESSIER={'catalog':'M-fixture','name':'Fixture Messier','object_type':'galaxy','ra_hours':1,'dec_deg':2}
NGC={'catalog':'OpenNGC (fixture)','source_id':'NGC-fixture','model':'dso','object_type':'galaxy','ra':15,'dec':2}
def load_catalog():
    fixtures={
        'backend.app.services.openngc_dso_catalog_service':{'build_openngc_above_me_seed_records':lambda **kw:[], 'find_openngc_record_by_messier_id':lambda key:None, 'load_openngc_catalog':lambda:[]},
        'backend.app.services.sky_catalog_service':{'LOCAL_MESSIER_SEARCH_OBJECTS':[MESSIER]},
        'backend.app.services.sky_star_catalog':{'BRIGHT_STAR_SCENE_OBJECTS':[], '_load_tier2_mid_star_dataset':lambda:[]},
    }
    modules={}
    for name,values in fixtures.items():
        module=types.ModuleType(name);module.__dict__.update(values);modules[name]=module
    spec=importlib.util.spec_from_file_location('tonight_fallback_fixture',ROOT/'backend/app/services/tonight_catalog.py')
    module=importlib.util.module_from_spec(spec)
    with patch.dict(sys.modules,{**modules,spec.name:module}):spec.loader.exec_module(module)
    return module

class TonightFallbackTests(unittest.TestCase):
    def setUp(self):
        self.catalog=load_catalog()
        self.logging_patch=patch.object(self.catalog,'logger',logging.getLogger('tonight-fallback-fixture'))
        self.logging_patch.start();self.addCleanup(self.logging_patch.stop)

    def test_openngc_outage_preserves_local_messier_coordinates_and_source_status(self):
        def unavailable(*args,**kwargs):raise RuntimeError('Declared OpenNGC outage')
        self.catalog.find_openngc_record_by_messier_id=unavailable
        self.catalog.build_openngc_above_me_seed_records=unavailable
        with self.assertLogs('tonight-fallback-fixture',level='WARNING'):
            targets,sources=self.catalog.fixed_targets()
        self.assertEqual([(r['source_id'],r['ra'],r['dec']) for r in targets],[('M-fixture',15,2)])
        self.assertEqual(sources['messier'],{'status':'included','candidate_count':1})
        self.assertEqual(sources['openngc'],{'status':'unavailable','candidate_count':0})

    def test_one_failed_enrichment_does_not_discard_later_local_rows(self):
        self.catalog.LOCAL_MESSIER_SEARCH_OBJECTS=[MESSIER,{**MESSIER,'catalog':'M-second'}]
        def lookup(key):
            if key=='M-fixture':raise ValueError('Declared corrupt enrichment')
            return None
        self.catalog.find_openngc_record_by_messier_id=lookup
        with self.assertLogs('tonight-fallback-fixture',level='WARNING'):
            targets,sources=self.catalog.fixed_targets()
        self.assertEqual([r['source_id'] for r in targets],['M-fixture','M-second'])
        self.assertEqual(sources['messier']['candidate_count'],2)

    def test_successful_enrichment_still_deduplicates_openngc(self):
        self.catalog.find_openngc_record_by_messier_id=lambda key:NGC
        self.catalog.build_openngc_above_me_seed_records=lambda **kw:[NGC]
        targets,sources=self.catalog.fixed_targets()
        self.assertEqual(len(targets),1);self.assertEqual(targets[0]['source_id'],'M-fixture')
        self.assertNotIn('ngc_identity',targets[0]);self.assertEqual(sources['openngc']['status'],'included')

    def test_later_openngc_acquisition_recovers_failed_enrichment_identity(self):
        def unavailable(key):raise RuntimeError('Declared transient enrichment failure')
        self.catalog.find_openngc_record_by_messier_id=unavailable
        self.catalog.build_openngc_above_me_seed_records=lambda **kw:[{**NGC,'messier_id':'M-fixture'}]
        with self.assertLogs('tonight-fallback-fixture',level='WARNING'):
            targets,sources=self.catalog.fixed_targets()
        self.assertEqual([(r['catalog'],r['source_id'],r['ra'],r['dec']) for r in targets],
                         [('Messier (local)','M-fixture',15,2)])
        self.assertNotIn('ngc_identity',targets[0])
        self.assertEqual(sources['messier'],{'status':'included','candidate_count':1})
        self.assertEqual(sources['openngc'],{'status':'included','candidate_count':1})

    def test_mixed_enrichment_deduplicates_only_source_backed_counterparts(self):
        self.catalog.LOCAL_MESSIER_SEARCH_OBJECTS=[MESSIER,{**MESSIER,'catalog':'M-second'}]
        second={**NGC,'source_id':'NGC-second','messier_id':'M-second'}
        unrelated={**NGC,'source_id':'NGC-unrelated','messier_id':'M-unrelated'}
        def lookup(key):
            if key=='M-fixture':raise RuntimeError('Declared transient enrichment failure')
            return second
        self.catalog.find_openngc_record_by_messier_id=lookup
        self.catalog.build_openngc_above_me_seed_records=lambda **kw:[
            {**NGC,'messier_id':' m-fixture '},second,unrelated]
        with self.assertLogs('tonight-fallback-fixture',level='WARNING'):
            targets,sources=self.catalog.fixed_targets()
        self.assertEqual([r['source_id'] for r in targets],['M-fixture','M-second','NGC-unrelated'])
        self.assertEqual([(r['ra'],r['dec']) for r in targets],[(15,2)]*3)
        self.assertTrue(all('ngc_identity' not in r for r in targets))
        self.assertEqual(sources['messier'],{'status':'included','candidate_count':2})
        self.assertEqual(sources['openngc'],{'status':'included','candidate_count':3})

if __name__=='__main__':unittest.main()
