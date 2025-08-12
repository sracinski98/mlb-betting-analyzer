from mlb_analyzer.data.mlb_api import MLBApi
from mlb_analyzer.data.odds_provider import ActionNetworkProvider  # You would need to implement this
from datetime import datetime

def main():
    # Initialize the odds provider (you would need your API key)
    odds_provider = ActionNetworkProvider(api_key="your_api_key")
    
    # Initialize the API with the odds provider
    mlb_api = MLBApi(odds_provider=odds_provider)
    
    print("1. Testing Team Betting Odds:")
    print("-" * 50)
    odds_df = mlb_api.get_live_odds()
    if not odds_df.empty:
        print("Today's MLB Game Odds:")
        print(odds_df[['home_team', 'away_team', 'home_moneyline', 'away_moneyline', 'total_runs', 'bookmaker']].head())
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
    # Use actual odds from the odds provider for a more realistic example
    if not odds_df.empty:
        # Get three favorite teams' odds
        favorites = odds_df[odds_df['home_moneyline'] < 0].head(3)
        if len(favorites) == 3:
            odds_list = favorites['home_moneyline'].tolist()
            parlay_odds = mlb_api.calculate_parlay_odds(
                odds_list=odds_list,
                stake=100.0
            )
            print(f"Parlay of three favorites ({', '.join(favorites['home_team'])})")
            print(f"Individual odds: {odds_list}")
            print(f"Combined odds (American): {parlay_odds.get('american_odds', 0):.2f}")
            print(f"Potential payout: ${parlay_odds.get('potential_payout', 0):.2f}")
        else:
            print("Not enough favorites found for parlay example")
    else:
        # Fallback to sample odds
        parlay_odds = mlb_api.calculate_parlay_odds(
            odds_list=[-110, -110, -110],
            stake=100.0
        )
        print("Sample 3-leg parlay calculation:")
        print(f"Combined odds (American): {parlay_odds.get('american_odds', 0):.2f}")
        print(f"Potential payout: ${parlay_odds.get('potential_payout', 0):.2f}")

if __name__ == "__main__":
    main()
