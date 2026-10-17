"""Select the immutable SWE Git archive source used by build and attestation."""
import os,subprocess,sys
from pathlib import Path
PIN='023e3b26babf7ffddf45f39293230b14cfe96993'
DEFAULT=Path('/var/tmp/oras-phase-c/sky-reconstruction/upstream')
def selected_source(anchor,explicit=None):
 if anchor!=PIN:raise ValueError('Unapproved Stellarium source revision: '+anchor)
 try:
  source=Path(explicit or os.environ.get('ORAS_SKY_SOURCE_REPO') or DEFAULT).resolve(strict=True)
  top=subprocess.check_output(['git','-C',str(source),'rev-parse','--show-toplevel'],stderr=subprocess.DEVNULL,text=True).strip()
  if Path(top).resolve()!=source:raise ValueError('Source must be a Git checkout root')
  revision=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],stderr=subprocess.DEVNULL,text=True).strip()
 except (OSError,subprocess.CalledProcessError,ValueError) as error:
  raise ValueError('Invalid Stellarium source repository') from error
 if revision!=anchor:raise ValueError('Unapproved Stellarium source revision: '+revision)
 return source
if __name__=='__main__':
 try:print(selected_source(sys.argv[1]))
 except ValueError as error:sys.exit(str(error))
