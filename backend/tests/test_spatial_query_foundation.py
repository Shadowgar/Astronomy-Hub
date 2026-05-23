from sqlalchemy.dialects import postgresql

from backend.app.db.session import build_nearby_spatial_features_query


def test_spatial_nearby_query_compiles_with_postgis_shape():
    stmt = build_nearby_spatial_features_query(
        longitude=-74.0060, latitude=40.7128, radius_meters=1000.0
    )
    sql = str(
        stmt.compile(
            dialect=postgresql.dialect(),
            compile_kwargs={"literal_binds": True},
        )
    )

    assert "spatial_features" in sql
    assert "ST_DWithin" in sql
    assert "ST_SetSRID" in sql
    assert "ST_MakePoint" in sql

