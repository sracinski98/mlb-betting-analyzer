from mlb_analyzer.data.mlb_api import MLBApi
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure pandas display
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_rows', None)

def analyze_games():
    """Analyze today's MLB games for betting opportunities"""
    try:
        # Initialize the API
        mlb_api = MLBApi()
        
        # Get today's games
        logger.info("Fetching today's games...")
        games = mlb_api.get_live_games()
        
        if games.empty:
            logger.info("No games scheduled for today")
            return
            
        # Display basic game info
        print("\n=== Today's MLB Games ===")
        print(games[['home_team', 'away_team', 'status', 'pitchers']].to_string())
        
        # Get and display odds
        logger.info("Fetching current odds...")
        odds = mlb_api.get_live_odds()
        if not odds.empty:
            print("\n=== Current Betting Lines ===")
            odds_display = odds[[
                'home_team', 'away_team', 'home_moneyline', 
                'away_moneyline', 'total_runs'
            ]].copy()
            print(odds_display.to_string())
        
        # Analyze each game
        print("\n=== Game Analysis ===")
        for _, game in games.iterrows():
            try:
                print(f"\nAnalyzing {game['away_team']} @ {game['home_team']}")
                
                # Get team stats
                home_stats = mlb_api.get_team_stats(game['home_team'])
                away_stats = mlb_api.get_team_stats(game['away_team'])
                
                if not home_stats.empty and not away_stats.empty:
                    print(f"\n{game['home_team']} Stats:")
                    print(f"Recent Win %: {home_stats['recent_win_pct'].iloc[0]:.3f}")
                    print(f"Recent Runs/Game: {home_stats['recent_runs_per_game'].iloc[0]:.2f}")
                    
                    print(f"\n{game['away_team']} Stats:")
                    print(f"Recent Win %: {away_stats['recent_win_pct'].iloc[0]:.3f}")
                    print(f"Recent Runs/Game: {away_stats['recent_runs_per_game'].iloc[0]:.2f}")
                
                # Get player props
                props = mlb_api.get_player_props(game_id=game['game_id'])
                if not props.empty:
                    print("\nNotable Player Props:")
                    notable_props = props[
                        (abs(props['over_odds']) <= 150) & 
                        (abs(props['under_odds']) <= 150)
                    ]
                    if not notable_props.empty:
                        print(notable_props[[
                            'player_name', 'prop_type', 'line', 
                            'over_odds', 'under_odds'
                        ]].to_string())
                
                # Game-specific betting analysis
                if not odds.empty:
                    game_odds = odds[odds['game_id'] == game['game_id']]
                    if not game_odds.empty:
                        home_ml = game_odds.iloc[0]['home_moneyline']
                        away_ml = game_odds.iloc[0]['away_moneyline']
                        total = game_odds.iloc[0]['total_runs']
                        
                        # Basic probability analysis
                        home_implied_prob = (abs(home_ml) / (abs(home_ml) + 100)) if home_ml < 0 else (100 / (home_ml + 100))
                        away_implied_prob = (abs(away_ml) / (abs(away_ml) + 100)) if away_ml < 0 else (100 / (away_ml + 100))
                        
                        print("\nBetting Analysis:")
                        print(f"Home team implied probability: {home_implied_prob:.1%}")
                        print(f"Away team implied probability: {away_implied_prob:.1%}")
                        
                        # Value analysis
                        if not home_stats.empty:
                            home_actual_prob = home_stats['recent_win_pct'].iloc[0]
                            home_value = home_actual_prob - home_implied_prob
                            print(f"Home team betting value: {home_value:.1%}")
                        
                        if not away_stats.empty:
                            away_actual_prob = away_stats['recent_win_pct'].iloc[0]
                            away_value = away_actual_prob - away_implied_prob
                            print(f"Away team betting value: {away_value:.1%}")
                
                print("-" * 80)  # Separator between games
            except Exception as e:
                logger.error(f"Error analyzing game {game['away_team']} @ {game['home_team']}: {str(e)}")
                continue
    except Exception as e:
        logger.error(f"Error during game analysis: {str(e)}")

if __name__ == "__main__":
    analyze_games()
