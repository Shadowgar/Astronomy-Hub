"""
Static mock data for /api/alerts endpoint.

Follows the alert object contract in docs/DATA_CONTRACTS.md.
Do NOT add or rename fields.
"""

MOCK_ALERTS = [
    {
        "priority": "major",
        "category": "meteor_shower",
        "title": "Peak tonight",
        "summary": "Best after midnight",
        "relevance": "local_tonight"
    },
    {
        "priority": "notice",
        "category": "space_weather",
        "title": "Minor geomagnetic activity",
        "summary": "Expect slightly enhanced auroral activity at high latitudes",
        "relevance": "local_several_hours"
    }
]
