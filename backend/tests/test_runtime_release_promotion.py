from pathlib import Path
import pytest
from scripts.skydata.promote_runtime_release import promote_release


def test_atomic_exchange_preserves_previous_generation(tmp_path: Path):
    staging, active = tmp_path / 'staging', tmp_path / 'active'
    staging.mkdir(); active.mkdir()
    (staging / 'manifest.json').write_text('new')
    (active / 'manifest.json').write_text('old')
    backup = promote_release(staging, active)
    assert (active / 'manifest.json').read_text() == 'new'
    assert (backup / 'manifest.json').read_text() == 'old'
    assert not staging.exists()


def test_failed_exchange_leaves_active_untouched(tmp_path: Path, monkeypatch):
    import scripts.skydata.promote_runtime_release as module
    staging, active = tmp_path / 'staging', tmp_path / 'active'
    staging.mkdir(); active.mkdir()
    (staging / 'manifest.json').write_text('new')
    (active / 'manifest.json').write_text('old')
    def fail(*args):
        raise OSError('exchange unsupported')
    monkeypatch.setattr(module, '_exchange', fail)
    with pytest.raises(OSError):
        promote_release(staging, active)
    assert (active / 'manifest.json').read_text() == 'old'
    assert (staging / 'manifest.json').read_text() == 'new'


def test_refuses_symlink_target(tmp_path: Path):
    staging = tmp_path / 'staging'; staging.mkdir()
    target = tmp_path / 'target'; target.symlink_to(staging, target_is_directory=True)
    with pytest.raises(ValueError, match='symlink'):
        promote_release(staging, target)
