"""The bounded source importer must never accept a whole-file response."""
import importlib
import io
from unittest.mock import patch

import pytest


def module():
    try:
        return importlib.import_module('scripts.skydata.acquire_system_spk')
    except ModuleNotFoundError:
        pytest.fail('Bounded SPK acquisition is not implemented')


class Response(io.BytesIO):
    def __init__(self, status, body, content_range):
        super().__init__(body)
        self.status = status
        self.headers = {'Content-Range': content_range, 'ETag': 'version-1', 'Last-Modified': 'source-time'}


def test_rejects_ignored_ranges_without_reading_full_response():
    m = module()
    response = Response(200, b'x' * 1000, 'bytes 0-999/1000')
    with patch.object(m, 'urlopen', return_value=response):
        with pytest.raises(ValueError, match='206'):
            m.RangeSource('https://example.test/kernel.bsp', m.ByteBudget(100)).read(8)


def test_limits_budget_before_network_and_checks_exact_range():
    m = module()
    budget = m.ByteBudget(8)
    source = m.RangeSource('https://example.test/kernel.bsp', budget)
    with patch.object(m, 'urlopen', return_value=Response(206,b'abcdefgh','bytes 0-7/100')):
        assert source.read(8) == b'abcdefgh'
    assert budget.consumed == 8
    with patch.object(m, 'urlopen') as opener:
        with pytest.raises(ValueError, match='budget'):
            source.read(1)
        opener.assert_not_called()
    with patch.object(m, 'urlopen', return_value=Response(206,b'abcdefgh','bytes 1-8/100')):
        with pytest.raises(ValueError, match='Content-Range'):
            m.RangeSource('https://example.test/kernel.bsp', m.ByteBudget(20)).read(8)


def test_rejects_changed_remote_version_during_excerpt():
    m = module()
    source=m.RangeSource('https://example.test/kernel.bsp',m.ByteBudget(100))
    with patch.object(m,'urlopen',return_value=Response(206,b'abcdefgh','bytes 0-7/100')):
        source.read(8)
    changed=Response(206,b'abcdefgh','bytes 8-15/100');changed.headers['ETag']='version-2'
    with patch.object(m,'urlopen',return_value=changed):
        with pytest.raises(ValueError,match='changed'):
            source.read(8)
