import hashlib,importlib.util,io,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

ROOT=Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/scripts/source-distribution')
spec=importlib.util.spec_from_file_location('acquire_toolchain',ROOT/'acquire_toolchain.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class Reply(io.BytesIO):
 def __enter__(self):return self
 def __exit__(self,*args):self.close()
class Acquisition(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.out=self.root/'out';self.raw=b'pinned package bytes';self.meta=self.root/'toolchain.json'
  self.row={'filename':'scons.deb','url':'https://archive.debian.org/debian/pool/main/s/scons/scons_3.0.1-2_all.deb','sha256':hashlib.sha256(self.raw).hexdigest(),'bytes':len(self.raw)};self.write()
 def write(self):self.meta.write_text(json.dumps({'schema':1,'downloads':[self.row]}))
 def acquire(self,raw=None):
  with patch.object(a.urllib.request,'build_opener')as build:
   build.return_value.open.return_value=Reply(self.raw if raw is None else raw)
   a.acquire(self.out,self.meta)
 def test_download_hash_and_atomic_output(self):
  self.acquire();self.assertEqual((self.out/'scons.deb').read_bytes(),self.raw);self.assertEqual([p.name for p in self.out.iterdir()],['scons.deb'])
 def test_wrong_hash_leaves_no_published_or_partial_file(self):
  self.row['sha256']='0'*64;self.write()
  with self.assertRaises(ValueError):self.acquire()
  self.assertEqual(list(self.out.iterdir()),[])
 def test_oversized_input_is_rejected(self):
  with self.assertRaises(ValueError):self.acquire(self.raw+b'x')
  self.assertEqual(list(self.out.iterdir()),[])
 def test_invalid_existing_target_is_preserved(self):
  self.out.mkdir();target=self.out/'scons.deb';target.write_bytes(b'owner bytes')
  with self.assertRaises(ValueError):self.acquire()
  self.assertEqual(target.read_bytes(),b'owner bytes')
 def test_valid_explicit_target_needs_no_network(self):
  self.acquire()
  with patch.object(a.urllib.request,'build_opener')as build:
   a.acquire(self.out,self.meta);build.return_value.open.assert_not_called()
 def test_external_or_http_source_rejected_before_output_creation(self):
  for url in ['http://archive.debian.org/x','https://example.com/x','https://archive.debian.org:444/x']:
   self.row['url']=url;self.write()
   with self.assertRaises(ValueError):self.acquire()
   self.assertFalse(self.out.exists())
 def test_path_traversal_is_rejected(self):
  self.row['filename']='../scons.deb';self.write()
  with self.assertRaises(ValueError):self.acquire()
  self.assertFalse(self.out.exists())
 def test_symlink_target_is_not_overwritten(self):
  self.out.mkdir();other=self.root/'owner';other.write_bytes(self.raw);(self.out/'scons.deb').symlink_to(other)
  with self.assertRaises(ValueError):self.acquire()
  self.assertTrue((self.out/'scons.deb').is_symlink())
 def test_redirect_cannot_leave_official_https_origin(self):
  from urllib.request import Request
  for url in ['https://example.com/pkg','http://archive.debian.org/pkg']:
   with self.assertRaises(ValueError):a.OfficialRedirect().redirect_request(Request(self.row['url']),None,302,'Found',{},url)
 def test_truncated_input_is_rejected(self):
  with self.assertRaises(ValueError):self.acquire(self.raw[:-1])
  self.assertEqual(list(self.out.iterdir()),[])
 def test_publisher_does_not_overwrite_a_concurrent_target(self):
  import os
  original=os.link
  def publish(source,target):
   Path(target).write_bytes(b'concurrent owner bytes')
   original(source,target)
  with patch.object(a.os,'link',publish):
   with self.assertRaises(FileExistsError):self.acquire()
  self.assertEqual((self.out/'scons.deb').read_bytes(),b'concurrent owner bytes')
  self.assertEqual([p.name for p in self.out.iterdir()],['scons.deb'])
 def test_controlled_pins_match_dockerfile(self):
  meta=json.loads((ROOT/'toolchain.json').read_text());docker=(ROOT/'Native.Dockerfile').read_text()
  self.assertIn(meta['native']['base_image'],docker);self.assertIn(meta['downloads'][0]['sha256'],docker)
  self.assertNotIn('apt-get',docker);self.assertIn('dpkg -i',docker)
if __name__=='__main__':unittest.main()
