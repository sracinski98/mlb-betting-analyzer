"""
Test script for live MLB data retrieval
"""

import os
from datetime import datetime
from mlb_analyzer.data.mlb_api import MLBApi

def test_live_data():
    """Test live MLB data retrieval"""
    # Initialize API with optional odds API key
    odds_api_key = os.getenv('ODDS_API_KEY')
    api = MLBApi(odds_api_key=odds_api_key)
    
    print("\nTesting Live MLB Data Integration")
    print("================================")
    
    # Test live games retrieval
    print("\n1. Testing live games retrieval...")
    games = api.get_live_games()
    if not games.empty:
        print(f"\nFound {len(games)} games:")
        print("\nGames Summary:")
        for _, game in games.iterrows():
            print(f"\n{game['away_team']} @ {game['home_team']}")
            print(f"Status: {game['status']}")
            print(f"Score: {game['away_score']} - {game['home_score']}")
            print(f"Pitchers: {game['away_team']}: {game['pitchers']['away']} vs "
                  f"{game['home_team']}: {game['pitchers']['home']}")
    else:
        print("No live games found")
    
    # Test odds retrieval if API key is provided
    if odds_api_key:
        print("\n2. Testing live odds retrieval...")
        odds = api.get_live_odds()
        if not odds.empty:
            print(f"\nFound odds from {odds['bookmaker'].nunique()} bookmakers")
            print("\nSample odds:")
            for _, odds_row in odds.head().iterrows():
                print(f"\n{odds_row['away_team']} @ {odds_row['home_team']}")
                print(f"Bookmaker: {odds_row['bookmaker']}")
                print(f"Home odds: {odds_row.get('home_odds', 'N/A')}")
                print(f"Away odds: {odds_row.get('away_odds', 'N/A')}")
        else:
            print("No odds data found")
    else:
        print("\n2. Skipping odds retrieval (no API key provided)")

if __name__ == "__main__":
    test_live_data()
