"""
Test script for MLB betting functionality using The Odds API.
"""

from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

def test_mlb_bets():
    # Initialize the API
    mlb_api = MLBApi()
    
    print("\n=== Testing Team Moneyline Bets ===")
    # Get live odds for all games
    odds_df = mlb_api.get_live_odds()
    if not odds_df.empty:
        # Show moneyline odds for each game
        print("\nMoneyline odds for today's games:")
        for _, game in odds_df.iterrows():
            print(f"\n{game['away_team']} @ {game['home_team']}")
            print(f"Away ML: {game['away_moneyline']}")
            print(f"Home ML: {game['home_moneyline']}")
            
            # Store game ID for props testing
            game_id = game['game_id']
    else:
        print("No odds data available")
        return

    print("\n=== Testing Player Props ===")
    # Get player props for the first available game
    games_df = mlb_api.get_live_games()
    if not games_df.empty:
        test_game = games_df.iloc[0]
        print(f"\nGetting props for {test_game['away_team']} @ {test_game['home_team']}")
        props_data = mlb_api.odds_provider.get_player_props(game_id=test_game['game_id'])
        if props_data and props_data.get('props'):
            print("\nAvailable player props:")
            for prop in props_data['props']:
                print(f"\n{prop['player_name']} - {prop['prop_type']}")
                print(f"Line: {prop['line']}")
                print(f"Over: {prop['over_odds']}")
                print(f"Under: {prop['under_odds']}")
        else:
            print("No props data available")
    else:
        print("No live games found for props testing")

    print("\n=== Testing Parlay Calculator ===")
    # Let's create a 2-leg parlay with:
    # 1. First favorite moneyline
    # 2. First over on strikeouts prop
    try:
        # Get the first favorite (most negative moneyline)
        favorite_odds = None
        for _, game in odds_df.iterrows():
            home_ml = game['home_moneyline']
            away_ml = game['away_moneyline']
            if home_ml and away_ml:  # Ensure we have odds
                if home_ml < 0 and (not favorite_odds or home_ml > favorite_odds):
                    favorite_odds = home_ml
                if away_ml < 0 and (not favorite_odds or away_ml > favorite_odds):
                    favorite_odds = away_ml

        # Get first strikeout over odds
        strikeouts_over = None
        if props_data and props_data.get('props'):
            for prop in props_data['props']:
                if prop['prop_type'] == 'STRIKEOUTS' and prop.get('over_odds'):
                    strikeouts_over = prop['over_odds']
                    break
                    
        if favorite_odds and strikeouts_over:
            print(f"\nCalculating parlay with:")
            print(f"Leg 1: ML {favorite_odds}")
            print(f"Leg 2: Strikeouts Over {strikeouts_over}")
            
            parlay_result = mlb_api.calculate_parlay_odds(
                odds_list=[favorite_odds, strikeouts_over],
                stake=100.0
            )
            
            print("\nParlay Details:")
            print(f"Combined odds (American): {parlay_result['american_odds']:.2f}")
            print(f"Potential payout: ${parlay_result['potential_payout']:.2f}")
        else:
            print("Couldn't find appropriate odds for parlay example")
            
    except Exception as e:
        print(f"Error calculating parlay: {str(e)}")

if __name__ == "__main__":
    test_mlb_bets()
