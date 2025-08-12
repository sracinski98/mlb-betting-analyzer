from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

def test_odds_provider():
    """Test the odds provider functionality"""
    api = MLBApi()
    
    print("\n=== TODAY'S GAMES ===")
    games = api.get_live_games()
    print(games[['game_id', 'home_team', 'away_team', 'status']].to_string())
    
    print("\n=== ODDS PROVIDER TEST ===")
    odds_provider = api.odds_provider
    raw_odds = odds_provider.get_all_odds()
    
    print("\nRaw odds type:", type(raw_odds))
    if isinstance(raw_odds, pd.DataFrame):
        print("\nRaw odds columns:", raw_odds.columns.tolist())
        print("\nRaw odds shape:", raw_odds.shape)
        print("\nSample of raw odds:")
        print(raw_odds.head().to_string())
    else:
        print("\nRaw odds structure:")
        print(raw_odds)

if __name__ == '__main__':
    test_odds_provider()
