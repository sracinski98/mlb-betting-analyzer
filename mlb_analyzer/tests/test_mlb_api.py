"""
Tests for the MLB API integration.
"""

import unittest
import pandas as pd
from mlb_analyzer.data.mlb_api import MLBApi

class TestMLBApi(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures."""
        self.api = MLBApi()

    def test_get_live_odds(self):
        """Test retrieving live odds from ESPN."""
        odds_df = self.api.get_live_odds()
        
        # Verify the DataFrame is not empty
        self.assertFalse(odds_df.empty, "Odds DataFrame should not be empty")
        
        # Check that required columns are present
        required_columns = [
            'game_id', 'date', 'home_team', 'away_team', 'bookmaker',
            'home_moneyline', 'away_moneyline', 'last_update'
        ]
        for column in required_columns:
            self.assertIn(column, odds_df.columns, f"Column {column} should be present in odds data")
        
        # Verify bookmaker is ESPN
        self.assertTrue(all(odds_df['bookmaker'] == 'ESPN'), "Bookmaker should be ESPN")
        
        # Verify team abbreviations are not empty
        self.assertTrue(all(odds_df['home_team'].notna()), "Home team should not be empty")
        self.assertTrue(all(odds_df['away_team'].notna()), "Away team should not be empty")
        
        print("\nSample of retrieved odds data:")
        print(odds_df.head())
        print("\nColumns in the odds data:")
        print(odds_df.columns.tolist())

    def test_get_live_games(self):
        """Test retrieving live games data."""
        games_df = self.api.get_live_games()
        
        # Verify the DataFrame is not empty
        self.assertFalse(games_df.empty, "Games DataFrame should not be empty")
        
        # Check that required columns are present
        required_columns = [
            'game_id', 'status', 'date', 'home_team', 'away_team',
            'home_score', 'away_score'
        ]
        for column in required_columns:
            self.assertIn(column, games_df.columns, f"Column {column} should be present in games data")
        
        print("\nSample of retrieved games data:")
        print(games_df.head())
        print("\nColumns in the games data:")
        print(games_df.columns.tolist())

if __name__ == '__main__':
    unittest.main()
