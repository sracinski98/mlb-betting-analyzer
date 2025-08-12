from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

def test_odds_provider():
    """Test the odds provider functionality"""
    api = MLBApi()
    
    # Get raw odds from provider
    print("\n=== RAW ODDS FROM PROVIDER ===")
    raw_odds = api.odds_provider.get_all_odds()
    print("Type of raw_odds:", type(raw_odds))
    if isinstance(raw_odds, pd.DataFrame):
        print("\nColumns:", raw_odds.columns.tolist())
        print("\nFirst few rows:")
        print(raw_odds.head())
    else:
        print("\nRaw data structure:")
        print(raw_odds)
    
    # Test odds processing
    print("\n=== PROCESSED ODDS ===")
    processed_odds = api.get_live_odds()
    print("\nColumns:", processed_odds.columns.tolist())
    print("\nFirst few rows:")
    print(processed_odds.head())

if __name__ == '__main__':
    test_odds_provider()
