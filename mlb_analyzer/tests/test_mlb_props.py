"""
Tests for MLB API player props and parlays functionality.
"""

import unittest
import pandas as pd
from mlb_analyzer.data.mlb_api import MLBApi

class TestMLBProps(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures."""
        self.api = MLBApi()
    
    def test_player_props(self):
        """Test retrieving player props."""
        # Get live games first to get a valid game_id
        games_df = self.api.get_live_games()
        if not games_df.empty:
            game_id = games_df.iloc[0]['game_id']
            
            # Test getting props for a game
            props_df = self.api.get_player_props(game_id=game_id)
            
            # Verify the DataFrame is not empty
            self.assertFalse(props_df.empty, "Props DataFrame should not be empty")
            
            # Check that required columns are present
            required_columns = [
                'player_id', 'player_name', 'game_id', 'prop_type',
                'line', 'over_odds', 'under_odds'
            ]
            for column in required_columns:
                self.assertIn(column, props_df.columns, f"Column {column} should be present in props data")
            
            print("\nSample of retrieved props data:")
            print(props_df.head())
            print("\nUnique prop types found:")
            print(props_df['prop_type'].unique())
    
    def test_parlay_odds(self):
        """Test parlay odds calculation."""
        # Test case 1: All positive odds
        odds_list = [120, 150, 180]
        parlay = self.api.calculate_parlay_odds(odds_list)
        self.assertIn('potential_payout', parlay)
        self.assertTrue(parlay['potential_payout'] > 100)  # Payout should be greater than stake
        
        # Test case 2: Mixed positive and negative odds
        odds_list = [-150, 130, -120]
        parlay = self.api.calculate_parlay_odds(odds_list)
        self.assertIn('decimal_odds', parlay)
        self.assertIn('american_odds', parlay)
        
        print("\nParlay calculation results:")
        print("Test case 1 (all positive):", parlay)
        
    def test_popular_parlays(self):
        """Test getting popular prop parlays."""
        # Get live games first to get a valid game_id
        games_df = self.api.get_live_games()
        if not games_df.empty:
            game_id = games_df.iloc[0]['game_id']
            
            # Test getting popular parlays
            parlays_df = self.api.get_popular_prop_parlays(game_id)
            
            if not parlays_df.empty:
                # Check that required columns are present
                required_columns = [
                    'game_id', 'parlay_type', 'player_name',
                    'decimal_odds', 'american_odds', 'potential_payout'
                ]
                for column in required_columns:
                    self.assertIn(column, parlays_df.columns)
                
                print("\nSample of popular parlays:")
                print(parlays_df.head())
                print("\nUnique parlay types:")
                print(parlays_df['parlay_type'].unique())

if __name__ == '__main__':
    unittest.main()
