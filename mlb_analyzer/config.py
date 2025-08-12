"""
Configuration settings for MLB Analyzer.
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    # API Keys
    MLB_STATS_API_KEY: Optional[str] = None
    ODDS_API_KEY: str = "fe3e1db58259d6d7d3599e2ae3d22ecc"
    
    # Data Storage
    DATA_DIR: str = "data"
    CACHE_ENABLED: bool = True
    CACHE_DURATION: int = 3600  # 1 hour in seconds
    
    # Analysis Settings
    MIN_CONFIDENCE_THRESHOLD: float = 0.6
    VALUE_BET_THRESHOLD: float = 0.1  # 10% difference between our prob and implied odds
    
    # Model Settings
    USE_MACHINE_LEARNING: bool = True
    MODEL_UPDATE_FREQUENCY: int = 24  # hours
    
    @classmethod
    def from_env(cls):
        """Create config from environment variables."""
        return cls(
            MLB_STATS_API_KEY=os.getenv("MLB_STATS_API_KEY"),
            ODDS_API_KEY=os.getenv("ODDS_API_KEY"),
            DATA_DIR=os.getenv("MLB_DATA_DIR", "data"),
            CACHE_ENABLED=os.getenv("CACHE_ENABLED", "true").lower() == "true",
            CACHE_DURATION=int(os.getenv("CACHE_DURATION", "3600")),
            MIN_CONFIDENCE_THRESHOLD=float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.6")),
            VALUE_BET_THRESHOLD=float(os.getenv("VALUE_BET_THRESHOLD", "0.1")),
            USE_MACHINE_LEARNING=os.getenv("USE_MACHINE_LEARNING", "true").lower() == "true",
            MODEL_UPDATE_FREQUENCY=int(os.getenv("MODEL_UPDATE_FREQUENCY", "24"))
        )
