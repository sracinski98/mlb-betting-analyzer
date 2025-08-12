from mlb_analyzer.data.mlb_api import MLBApi
from datetime import datetime

def main():
    # Initialize the API
    mlb_api = MLBApi()
    
    print("1. Testing Team Betting Odds:")
    print("-" * 50)
    odds_df = mlb_api.get_live_odds()
    if not odds_df.empty:
        print("Today's MLB Game Odds:")
        print(odds_df[['home_team', 'away_team', 'home_moneyline', 'away_moneyline', 'total_runs']].head())
    else:
        print("No odds data available")
    
    print("\n2. Testing Player Props:")
    print("-" * 50)
    # Get live games to find a game ID
    games_df = mlb_api.get_live_games()
    if not games_df.empty:
        game_id = games_df.iloc[0]['game_id']
        props_df = mlb_api.get_player_props(game_id=game_id)
        if not props_df.empty:
            print(f"Player Props for game {game_id}:")
            print(props_df[['player_name', 'prop_type', 'line', 'over_odds', 'under_odds']].head())
        else:
            print("No player props available")
    else:
        print("No live games found")
    
    print("\n3. Testing Parlay Calculation:")
    print("-" * 50)
    # Example parlay with -110 odds for each leg
    parlay_odds = mlb_api.calculate_parlay_odds(
        odds_list=[-110, -110, -110],  # Three legs at typical -110 odds
        stake=100.0
    )
    print("Sample 3-leg parlay calculation:")
    print(f"Combined odds (American): {parlay_odds.get('american_odds', 0):.2f}")
    print(f"Potential payout: ${parlay_odds.get('potential_payout', 0):.2f}")

if __name__ == "__main__":
    main()
