"""
Static mock data for /api/targets endpoint.

Follows the target object contract in docs/DATA_CONTRACTS.md.
Do NOT add or rename fields.
"""

MOCK_TARGETS = [
    {
        "name": "Jupiter",
        "category": "planet",
        "direction": "SE",
        "elevation_band": "mid",
        "best_time": "10:30 PM",
        "difficulty": "beginner",
        "reason": "Bright and clearly visible tonight"
    },
    {
        "name": "M13",
        "category": "deep_sky",
        "direction": "S",
        "elevation_band": "high",
        "best_time": "11:15 PM",
        "difficulty": "intermediate",
        "reason": "High in the sky and well-placed for long exposures"
    }
]
