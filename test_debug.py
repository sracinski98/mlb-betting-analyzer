from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

# Initialize the API
api = MLBApi()

# Get today's games
print("\n=== TODAY'S GAMES ===")
games = api.get_live_games()
print(games[['game_id', 'home_team', 'away_team', 'status', 'pitchers']])

# Get current odds with debugging
print("\n=== RAW ODDS DATA ===")
odds_provider = api.odds_provider
raw_odds = odds_provider.get_all_odds()
print("Number of games with odds:", len(raw_odds))
print("\nSample of raw odds structure:")
if raw_odds:
    print(raw_odds[0])

# Get current odds
print("\n=== PROCESSED ODDS ===")
odds = api.get_live_odds()
if not odds.empty:
    print(odds.columns.tolist())
    print("\nFirst few odds entries:")
    print(odds.head())
