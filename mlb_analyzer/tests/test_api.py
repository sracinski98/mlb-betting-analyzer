"""
Test script for MLB data retrieval
"""

from datetime import datetime
from mlb_analyzer.data.mlb_api import MLBApi

def test_mlb_api():
    """Test basic MLB API functionality"""
    api = MLBApi()
    # Use a date from 2023 season for testing
    test_date = "2023-08-15"
    
    print("\nTesting MLB API Integration")
    print("==========================")
    
    # Test game retrieval
    print(f"\n1. Testing game retrieval for {test_date}...")
    games = api.get_games_by_date(test_date)
    print(f"Found {len(games)} games")
    if not games.empty:
        print("\nGames Schedule:")
        print(games[['Date', 'Home', 'Away', 'Result']])
    
    # Test team stats for Yankees
    print("\n2. Testing team stats retrieval for Yankees...")
    nyy_stats = api.get_team_stats("NYY")
    print("\nYankees recent stats:")
    if not nyy_stats.empty:
        print(nyy_stats.tail())
    else:
        print("No stats found")
    
    # Test Statcast data
    print("\n3. Testing Statcast data retrieval...")
    statcast_data = api.get_statcast_data(test_date, test_date)
    if not statcast_data.empty:
        print("\nStatcast data summary:")
        print(statcast_data.describe())
        print(f"\nTotal plays recorded: {len(statcast_data)}")
    else:
        print("No Statcast data found")

if __name__ == "__main__":
    test_mlb_api()
