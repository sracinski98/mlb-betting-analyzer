import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mlb_analyzer.data.mlb_api import MLBApi

def test_analysis():
    print("Initializing MLBApi...")
    mlb_api = MLBApi()
    
    print("\nFetching live games...")
    games_df = mlb_api.get_live_games()
    print(f"Found {len(games_df) if not games_df.empty else 0} games")
    if not games_df.empty:
        print("Sample game data:")
        print(games_df.head())
    
    print("\nFetching odds...")
    odds_df = mlb_api.get_live_odds()
    print(f"Found {len(odds_df) if not odds_df.empty else 0} odds entries")
    if not odds_df.empty:
        print("Sample odds data:")
        print(odds_df.head())
    
    print("\nAnalyzing games...")
    analysis = mlb_api.analyze_games()
    print("\nAnalysis results:")
    print("Team bets:", len(analysis.get('team_bets', [])))
    print("Player props:", len(analysis.get('player_props', [])))
    print("Parlays:", len(analysis.get('parlays', [])))
    
    return analysis

if __name__ == "__main__":
    try:
        result = test_analysis()
        print("\nFull analysis result:")
        import json
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
