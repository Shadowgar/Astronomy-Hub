"""Normalize the two source-defined PDS mesh frames; no network or orbit fitting."""
import argparse
import hashlib
import json
from pathlib import Path
from skyfield.api import PlanetaryConstants

PCK_SHA256='8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4'
PCK_URL='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/a_old_versions/pck00006.tpc'
DEIMOS_URL='https://sbnarchive.psi.edu/pds4/non_mission/ast-sat.thomas.shape-models_V1_0/data/m2deimos.xml'
PHOBOS_URL='https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/document/bundle_description.txt'


def build(pck,deimos_label,phobos_description,output):
    pck=Path(pck);label=Path(deimos_label).read_bytes();description=Path(phobos_description).read_bytes()
    if hashlib.sha256(pck.read_bytes()).hexdigest()!=PCK_SHA256:
        raise ValueError('Unqualified legacy Phobos frame kernel')
    if b'The geometrical coordinate system of this model is defined by the planetary constants file pck00006.tpc' not in description:
        raise ValueError('Phobos mesh frame declaration missing')
    if b'Coordinates are planetocentric' not in label or b'316.65, Dec=53.53 J2000' not in label or b'W = 79.41 + 285.1618970d' not in label:
        raise ValueError('Unqualified Deimos source label')
    constants=PlanetaryConstants();constants.read_text(pck.open('rb'))
    variables={key:value for key,value in constants.variables.items() if key.startswith('BODY4_') or key.startswith('BODY401_') and any(part in key for part in ('POLE_','PM','NUT_PREC'))}
    frames={
        'phobos':dict(naif_id='401',frame='IAU_PHOBOS',model_id='pds-gaskell-phobos-pck00006',
            model='PDS Gaskell Phobos shape reference: legacy NAIF pck00006 IAU_PHOBOS',
            source=dict(id='NAIF pck00006 for PDS Gaskell Phobos mesh',url=PCK_URL,sha256=PCK_SHA256),
            registration=dict(url=PHOBOS_URL,sha256=hashlib.sha256(description).hexdigest()),variables=variables,
            accuracy='The mesh explicitly uses pck00006. This preserves its legacy coordinate registration; it is not a modern pck00011 orientation or physical accuracy claim.'),
        'deimos':dict(naif_id='402',frame='PDS_THOMAS_DEIMOS',model_id='pds-thomas-deimos-label-v1',
            model='PDS Thomas Deimos legacy source-label pole RA=316.65 deg, Dec=53.53 deg J2000; W=79.41+285.1618970*d deg',
            source=dict(id='PDS Thomas Deimos source-label pole and prime meridian',url=DEIMOS_URL,sha256=hashlib.sha256(label).hexdigest()),
            variables={'BODY402_POLE_RA':[316.65,0,0],'BODY402_POLE_DEC':[53.53,0,0],'BODY402_PM':[79.41,285.1618970,0]},
            longitude_convention=dict(url='https://pds.nasa.gov/data/pds4/documents/document_pds3_standards/psdd_rev_E_20020828.pdf',basis='PDS planetocentric longitude increases eastward in a right-handed frame; source label explicitly says planetocentric.'),
            accuracy='Legacy source-label frame, not modern pck00011. TDB days from J2000 follow IAU/SPICE convention; the label does not spell out the time scale. Preserves source morphology and registration; no modern spin-pole or surface accuracy claim.')}
    raw=(json.dumps(dict(schema='oras.pds-shape-frames.v1',frames=frames),sort_keys=True,indent=2)+'\n').encode()
    Path(output).write_bytes(raw)
    print(hashlib.sha256(raw).hexdigest())


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('pck','deimos-label','phobos-description','output'):parser.add_argument('--'+name,required=True,type=Path)
    args=parser.parse_args();build(args.pck,args.deimos_label,args.phobos_description,args.output)
