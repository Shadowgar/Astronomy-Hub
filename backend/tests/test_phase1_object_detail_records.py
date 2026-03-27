import os
import sys

root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import server


def test_phase1_object_detail_records_cover_all_types():
    scene = server._build_phase1_scene_state().get("scene", {})
    objects = scene.get("objects") or []

    by_type = {}
    for obj in objects:
        by_type.setdefault(obj.get("type"), obj)

    assert "satellite" in by_type
    assert "planet" in by_type
    assert "deep_sky" in by_type

    for obj_type in ("satellite", "planet", "deep_sky"):
        detail = server._build_phase1_object_detail(by_type[obj_type], scene_objects=objects)

        assert detail.get("id")
        assert detail.get("name")
        assert detail.get("type") == obj_type
        assert detail.get("engine")
        assert detail.get("summary")
        assert detail.get("description")
        assert isinstance(detail.get("visibility"), dict)
        assert detail.get("visibility", {}).get("is_visible") is True
        assert isinstance(detail.get("media"), list)
        assert len(detail.get("media")) >= 1
        assert isinstance(detail.get("related_objects"), list)
