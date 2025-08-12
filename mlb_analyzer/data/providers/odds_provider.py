"""
Abstract base class for odds providers.
"""

from abc import ABC, abstractmethod
from typing import Dict
import pandas as pd

class OddsProvider(ABC):
    """Abstract base class for odds providers."""
    
    @abstractmethod
    def get_game_odds(self, game_id: str) -> Dict:
        """Get odds for a specific game."""
        pass
        
    @abstractmethod
    def get_player_props(self, player_id: str, game_id: str) -> Dict:
        """Get player props for a specific game."""
        pass
        
    @abstractmethod
    def get_all_odds(self) -> pd.DataFrame:
        """Get all available odds."""
        pass
