"""
Tests for the MLB API parlay system functionality.
"""

import unittest
import pandas as pd
from datetime import datetime
from mlb_analyzer.data.mlb_api import MLBApi

class TestParlaySystem(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures."""
        self.api = MLBApi()
        
        # Mock props data for testing
        self.mock_props = pd.DataFrame([
            {
                'player_id': '1234',
                'player_name': 'Test Pitcher',
                'prop_type': 'STRIKEOUTS',
                'prop_name': 'pitcher_strikeouts',
                'line': 6.5,
                'over_odds': -110,
                'under_odds': -110,
                'timestamp': datetime.now().isoformat()
            },
            {
                'player_id': '5678',
                'player_name': 'Test Batter',
                'prop_type': 'HITS',
                'prop_name': 'batter_hits',
                'line': 1.5,
                'over_odds': +120,
                'under_odds': -140,
                'timestamp': datetime.now().isoformat()
            }
        ])
        
        # Mock patch get_player_props
        self.original_get_props = self.api.get_player_props
        self.api.get_player_props = lambda *args, **kwargs: self.mock_props

    def test_parlay_odds_calculation(self):
        """Test basic parlay odds calculations."""
        # Test case 1: All positive odds
        odds_list = [150, 120, 130]  # Three favorites
        result = self.api.calculate_parlay_odds(odds_list, stake=100)
        
        self.assertIn('decimal_odds', result)
        self.assertIn('american_odds', result)
        self.assertIn('potential_payout', result)
        self.assertTrue(result['potential_payout'] > 100)  # Payout should be greater than stake
        
        # Test case 2: Mixed positive and negative odds
        odds_list = [-150, 120, -110]
        result = self.api.calculate_parlay_odds(odds_list, stake=100)
        self.assertTrue(result['potential_payout'] > 100)
        
        print("\nParlay Odds Calculation Results:")
        print(f"All positive odds parlay: {result}")

    def test_optimal_parlay_generation(self):
        """Test generation of optimal parlays."""
        # Get optimal parlays with strict criteria
        parlays = self.api.get_optimal_parlays(min_probability=0.6, max_legs=3)
        
        if not parlays.empty:
            self.assertIn('parlay_type', parlays.columns)
            self.assertIn('probability', parlays.columns)
            self.assertIn('legs', parlays.columns)
            
            # Check probability thresholds
            self.assertTrue(all(parlays['probability'] >= 0.6))
            
            # Check leg count limits
            self.assertTrue(all(parlays['num_legs'] <= 3))
            
            print("\nSample Optimal Parlays:")
            print(parlays[['parlay_type', 'probability', 'legs']].head())
            print("\nUnique Parlay Types Found:")
            print(parlays['parlay_type'].unique())

    def test_pitcher_analysis(self):
        """Test pitcher dominance analysis for parlays."""
        games = self.api.get_live_games()
        if not games.empty:
            game = games.iloc[0]
            game_id = game['game_id']
            
            # Get props for the game
            props = self.api.get_player_props(game_id=game_id)
            if not props.empty:
                # Get team stats
                home_stats = self.api.get_team_stats(game['home_team'])
                away_stats = self.api.get_team_stats(game['away_team'])
                
                if not home_stats.empty and not away_stats.empty:
                    team_stats = {
                        'home': home_stats.iloc[0],
                        'away': away_stats.iloc[0]
                    }
                    
                    # Get odds
                    odds = self.api.get_live_odds()
                    if not odds.empty:
                        game_odds = odds[odds['game_id'] == game_id].iloc[0]
                        
                        # Test pitcher analysis
                        pitcher_stats = {
                            'home': self.api.get_player_stats(team=game['home_team']),
                            'away': self.api.get_player_stats(team=game['away_team'])
                        }
                        
                        analysis = self.api._analyze_pitcher_dominance(
                            props, team_stats, pitcher_stats, game_odds
                        )
                        
                        self.assertIn('probability', analysis)
                        self.assertIn('combinations', analysis)
                        
                        print("\nPitcher Analysis Results:")
                        print(f"Analysis probability: {analysis['probability']}")
                        if analysis['combinations']:
                            print("Sample combination:", analysis['combinations'][0])

    def test_cross_game_analysis(self):
        """Test cross-game parlay analysis."""
        # Get current games
        games_df = self.api.get_live_games()
        if not games_df.empty:
            # Get odds for all games
            odds = self.api.get_live_odds()
            if not odds.empty:
                # Analyze favorites across games
                all_props = {}
                team_stats = {}
                pitcher_stats = {}
                
                for _, game in games_df.head(3).iterrows():  # Test with first 3 games
                    game_id = game['game_id']
                    props = self.api.get_player_props(game_id=game_id)
                    if not props.empty:
                        all_props[game_id] = props
                    
                    home_stats = self.api.get_team_stats(game['home_team'])
                    away_stats = self.api.get_team_stats(game['away_team'])
                    if not home_stats.empty and not away_stats.empty:
                        team_stats[game_id] = {
                            'home': home_stats.iloc[0],
                            'away': away_stats.iloc[0]
                        }
                
                analysis = self.api._analyze_favorite_teams(
                    all_props, team_stats, pitcher_stats, odds.to_dict('records')
                )
                
                self.assertIn('probability', analysis)
                self.assertIn('combinations', analysis)
                
                print("\nCross-Game Analysis Results:")
                print(f"Analysis probability: {analysis['probability']}")
                if analysis['combinations']:
                    print("Number of combinations found:", len(analysis['combinations']))
                    print("Sample combination:", analysis['combinations'][0])

    def test_batter_performance_analysis(self):
        """Test batter performance analysis for parlays."""
        games = self.api.get_live_games()
        if not games.empty:
            game = games.iloc[0]
            game_id = game['game_id']
            
            # Get props and stats
            props = self.api.get_player_props(game_id=game_id)
            if not props.empty:
                home_stats = self.api.get_team_stats(game['home_team'])
                away_stats = self.api.get_team_stats(game['away_team'])
                
                if not home_stats.empty and not away_stats.empty:
                    team_stats = {
                        'home': home_stats.iloc[0],
                        'away': away_stats.iloc[0]
                    }
                    
                    odds = self.api.get_live_odds()
                    if not odds.empty:
                        game_odds = odds[odds['game_id'] == game_id].iloc[0]
                        
                        analysis = self.api._analyze_batter_performance(
                            props, team_stats, {}, game_odds
                        )
                        
                        self.assertIn('probability', analysis)
                        self.assertIn('combinations', analysis)
                        
                        print("\nBatter Performance Analysis Results:")
                        print(f"Analysis probability: {analysis['probability']}")
                        if analysis['combinations']:
                            print("Sample combination:", analysis['combinations'][0])

    def tearDown(self):
        """Clean up after tests."""
        # Restore original get_player_props method
        self.api.get_player_props = self.original_get_props

if __name__ == '__main__':
    unittest.main(verbose=True)
