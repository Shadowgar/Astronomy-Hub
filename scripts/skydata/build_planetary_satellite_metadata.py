#!/usr/bin/env python3
"""Normalize the official JPL physical-parameter HTML table; no orbit inference.

Acquire the small source page explicitly; the application never downloads data.
Usage: python3 scripts/skydata/build_planetary_satellite_metadata.py SOURCE.html OUTPUT.json
"""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import sys

SOURCE = 'https://ssd.jpl.nasa.gov/sats/phys_par/'


class Table(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.cell = None
        self.row = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == 'table' and dict(attrs).get('id') == 'sat_phys_par':
            self.inside = True
        if self.inside and tag == 'tr':
            self.row = []
        if self.inside and tag == 'td':
            # JPL omits some optional td closing tags.
            self.finish_cell()
            self.cell = ''

    def finish_cell(self):
        if self.cell is not None:
            self.row.append(' '.join(self.cell.split()))
            self.cell = None

    def handle_data(self, text):
        if self.cell is not None:
            self.cell += text

    def handle_endtag(self, tag):
        if self.inside and tag == 'td':
            self.finish_cell()
        if self.inside and tag == 'tr':
            self.finish_cell()
            if self.row:
                self.rows.append(self.row)
        if tag == 'table':
            self.inside = False


def normalize(raw):
    table = Table()
    table.feed(raw.decode())
    satellites = []
    for row in table.rows:
        if len(row) != 12:
            raise ValueError(f'Unexpected official table shape: {row}')
        parent, name, code = row[:3]
        if parent.lower() not in ('earth','mars','jupiter','saturn','uranus','neptune'):
            continue
        radius = float(row[6].replace(',', ''))
        if not code.isdigit() or radius <= 0:
            raise ValueError('Invalid official identity or mean radius')
        satellites.append(dict(parent=parent.lower(), id=name.lower(), name=name, naif_id=code,
                               radius_km=radius, radius_source=SOURCE, radius_reference=row[8]))
    if not satellites or len({x['naif_id'] for x in satellites}) != len(satellites):
        raise ValueError('Missing or duplicate identities')
    return dict(source=SOURCE, source_sha256=hashlib.sha256(raw).hexdigest(), satellites=satellites)


if __name__ == '__main__':
    source, output = map(Path, sys.argv[1:])
    output.write_text(json.dumps(normalize(source.read_bytes()), indent=2) + '\n')
