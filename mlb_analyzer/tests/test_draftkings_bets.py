from mlb_analyzer.data.mlb_api import MLBApi
from mlb_analyzer.data.odds_provider import DraftKingsProvider
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# Configure pandas display
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

def main():
    # Initialize the API with DraftKings provider
    odds_provider = DraftKingsProvider()
    mlb_api = MLBApi(odds_provider=odds_provider)
    
    print("\n1. Testing Team Betting Odds:")
    print("-" * 50)
    odds_df = mlb_api.get_live_odds()
    if not odds_df.empty:
        print("\nToday's MLB Game Odds:")
        print(odds_df[['home_team', 'away_team', 'home_moneyline', 'away_moneyline', 'total_runs', 'bookmaker']].to_string())
    else:
        print("No odds data available")
    
    print("\n2. Testing Player Props:")
    print("-" * 50)
    # Get live games to find a game ID
    games_df = mlb_api.get_live_games()
    if not games_df.empty:
        game = games_df.iloc[0]  # Get first game
        game_id = game['game_id']
        home_pitcher = game['pitchers']['home']
        
        print(f"\nLooking at props for {home_pitcher} in game {game_id}")
        props_df = mlb_api.get_player_props(game_id=game_id)
        if not props_df.empty:
            print("\nAvailable Player Props:")
            print(props_df[['player_name', 'prop_type', 'line', 'over_odds', 'under_odds']].to_string())
        else:
            print("No player props available")
    else:
        print("No live games found")
    
    print("\n3. Testing Parlay:")
    print("-" * 50)
    if not odds_df.empty:
        # Find three favorite teams (negative moneyline odds)
        favorites = odds_df[odds_df['home_moneyline'] < 0].sort_values('home_moneyline')
        if len(favorites) >= 3:
            # Take the top 3 favorites
            favorites = favorites.head(3)
            odds_list = favorites['home_moneyline'].tolist()
            
            print("\nBuilding parlay with these favorites:")
            for _, team in favorites.iterrows():
                print(f"{team['home_team']} ({team['home_moneyline']}) vs {team['away_team']}")
            
            # Calculate parlay odds with $100 stake
            parlay = mlb_api.calculate_parlay_odds(odds_list, stake=100.0)
            
            print("\nParlay Details:")
            print(f"Combined odds: {parlay['american_odds']:.2f}")
            print(f"Stake: ${parlay['stake']:.2f}")
            print(f"Potential payout: ${parlay['potential_payout']:.2f}")
            print(f"Profit if won: ${(parlay['potential_payout'] - parlay['stake']):.2f}")
        else:
            print("Not enough favorites found for parlay")
    else:
        print("No odds available for parlay calculation")

if __name__ == "__main__":
    main()
