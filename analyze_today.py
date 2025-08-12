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
    # Constants for betting analysis
    VALUE_THRESHOLD = 0.03  # 3% edge required for value bets
    PARLAY_PROB_THRESHOLD = 0.70  # 70% minimum probability for parlay legs
    MIN_ODDS = -250  # Don't consider heavy favorites beyond -250
    MIN_RUNS = 4.5  # Minimum recent runs per game for value bets
    MIN_WIN_PCT = 0.65  # Minimum win percentage for value bets
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
        display_cols = ['home_team', 'away_team', 'status']
        if 'pitchers' in games.columns:
            display_cols.append('pitchers')
        print(games[display_cols].to_string())
        
        # Get current odds
        logger.info("Fetching current odds...")
        odds = mlb_api.get_live_odds()
        if not odds.empty:
            print("\n=== Current Betting Lines ===")
            odds_display = odds[[
                'home_team', 'away_team', 'home_moneyline', 
                'away_moneyline', 'total_runs'
            ]].copy()
            print(odds_display.to_string())
            
        # Track value bets and parlay opportunities
        value_bets = []
        parlay_opportunities = []
            
        # Analyze each game
        print("\n=== Game Analysis ===")
        for _, game in games.iterrows():
            try:
                # Get team stats
                home_stats = mlb_api.get_team_stats(game['home_team'])
                away_stats = mlb_api.get_team_stats(game['away_team'])
                
                if not home_stats.empty and not away_stats.empty:
                    print(f"\nAnalyzing {game['away_team']} ({away_stats['recent_win_pct'].iloc[0]:.3f}, {away_stats['recent_runs_per_game'].iloc[0]:.1f} R/G) @ {game['home_team']} ({home_stats['recent_win_pct'].iloc[0]:.3f}, {home_stats['recent_runs_per_game'].iloc[0]:.1f} R/G)")
                
                # Game-specific analysis
                if not odds.empty:
                    game_odds = odds[
                        (odds['home_team'] == game['home_team']) & 
                        (odds['away_team'] == game['away_team'])
                    ]
                    if not game_odds.empty:
                        home_ml = game_odds.iloc[0]['home_moneyline']
                        away_ml = game_odds.iloc[0]['away_moneyline']
                        total = game_odds.iloc[0]['total_runs']
                        
                        # Convert moneyline to probability
                        def ml_to_prob(ml):
                            if ml < 0:
                                return abs(ml) / (abs(ml) + 100)
                            else:
                                return 100 / (ml + 100)
                                
                        # Calculate implied probabilities
                        home_implied_prob = ml_to_prob(home_ml)
                        away_implied_prob = ml_to_prob(away_ml)
                        
                        print(f"\nOdds: {game['home_team']} ({home_ml:+.0f}) vs {game['away_team']} ({away_ml:+.0f})")
                        print(f"Total: {total}")
                        
                        # Value analysis
                        if not home_stats.empty:
                            home_actual_prob = home_stats['recent_win_pct'].iloc[0]
                            home_runs = home_stats['recent_runs_per_game'].iloc[0]
                            
                            # Calculate value based on recent form, run production, and odds
                            home_edge = home_actual_prob - home_implied_prob
                            home_value = home_edge
                            
                            # Bonus for teams in good form with good run production
                            if home_actual_prob >= MIN_WIN_PCT:
                                home_value += min(0.03, (home_actual_prob - MIN_WIN_PCT) * 2)
                            if home_runs >= MIN_RUNS:
                                home_value += min(0.02, (home_runs - MIN_RUNS) / 10)
                                
                            print(f"\n{game['home_team']} Analysis:")
                            print(f"Recent Form: {home_actual_prob:.1%} win rate, {home_runs:.1f} runs/game")
                            print(f"Market Odds Probability: {home_implied_prob:.1%}")
                            print(f"Edge: {home_edge:.1%}")
                            print(f"Total Value: {home_value:.1%}")
                            
                            # Check for value bet
                            if (home_value > VALUE_THRESHOLD and 
                                (home_ml > MIN_ODDS or home_actual_prob > 0.7) and
                                home_runs > MIN_RUNS):
                                value_bets.append({
                                    'team': game['home_team'],
                                    'odds': home_ml,
                                    'value': home_value,
                                    'form': f"{home_actual_prob:.1%} win rate, {home_stats['recent_runs_per_game'].iloc[0]:.1f} runs/game",
                                    'implied_prob': home_implied_prob * 100,
                                    'actual_prob': home_actual_prob * 100,
                                    'matchup': f"{game['away_team']} @ {game['home_team']}"
                                })
                            
                            # Check for parlay potential
                            # Check for strong favorites with consistent run production and recent success
                            if (home_actual_prob > PARLAY_PROB_THRESHOLD and 
                                home_ml > MIN_ODDS and
                                home_stats['recent_runs_per_game'].iloc[0] > 4.0 and
                                home_stats['games_analyzed'].iloc[0] >= 5):
                                parlay_opportunities.append({
                                    'team': game['home_team'],
                                    'odds': home_ml,
                                    'implied_prob': home_implied_prob * 100,
                                    'actual_prob': home_actual_prob * 100,
                                    'form': f"{home_actual_prob:.1%} win rate, {home_stats['recent_runs_per_game'].iloc[0]:.1f} runs/game",
                                    'leg': f"{game['away_team']} @ {game['home_team']}"
                                })
                        
                        if not away_stats.empty:
                            away_actual_prob = away_stats['recent_win_pct'].iloc[0]
                            away_runs = away_stats['recent_runs_per_game'].iloc[0]
                            
                            # Calculate value based on recent form, run production, and odds
                            away_edge = away_actual_prob - away_implied_prob
                            away_value = away_edge
                            
                            # Bonus for teams in good form with good run production
                            if away_actual_prob >= MIN_WIN_PCT:
                                away_value += min(0.03, (away_actual_prob - MIN_WIN_PCT) * 2)
                            if away_runs >= MIN_RUNS:
                                away_value += min(0.02, (away_runs - MIN_RUNS) / 10)
                                
                            print(f"\n{game['away_team']} Analysis:")
                            print(f"Recent Form: {away_actual_prob:.1%} win rate, {away_runs:.1f} runs/game")
                            print(f"Market Odds Probability: {away_implied_prob:.1%}")
                            print(f"Edge: {away_edge:.1%}")
                            print(f"Total Value: {away_value:.1%}")
                            
                            # Check for value bet - focus on teams with strong performance
                            min_value = VALUE_THRESHOLD
                            if (away_value > min_value and 
                                (away_ml > MIN_ODDS or away_actual_prob > MIN_WIN_PCT) and
                                away_stats['recent_runs_per_game'].iloc[0] > MIN_RUNS):
                                value_bets.append({
                                    'team': game['away_team'],
                                    'odds': away_ml,
                                    'value': away_value,
                                    'form': f"{away_actual_prob:.1%} win rate, {away_stats['recent_runs_per_game'].iloc[0]:.1f} runs/game",
                                    'implied_prob': away_implied_prob * 100,
                                    'actual_prob': away_actual_prob * 100,
                                    'matchup': f"{game['away_team']} @ {game['home_team']}"
                                })
                            
                            # Check for parlay potential
                            # Check for strong favorites with consistent run production and recent success
                            if (away_actual_prob > PARLAY_PROB_THRESHOLD and 
                                away_ml > MIN_ODDS and
                                away_stats['recent_runs_per_game'].iloc[0] > 4.0 and
                                away_stats['games_analyzed'].iloc[0] >= 5):
                                parlay_opportunities.append({
                                    'team': game['away_team'],
                                    'odds': away_ml,
                                    'implied_prob': away_implied_prob * 100,
                                    'actual_prob': away_actual_prob * 100,
                                    'form': f"{away_actual_prob:.1%} win rate, {away_stats['recent_runs_per_game'].iloc[0]:.1f} runs/game",
                                    'leg': f"{game['away_team']} @ {game['home_team']}"
                                })
                
                print("-" * 80)  # Separator between games
            except Exception as e:
                logger.error(f"Error analyzing game {game['away_team']} @ {game['home_team']}: {str(e)}")
                continue
        
        # Print betting recommendations
        print("\n=== BETTING RECOMMENDATIONS ===")
        if value_bets:
            print("\nValue Bets:")
            for bet in sorted(value_bets, key=lambda x: x['value'], reverse=True):
                print(f"{bet['team']} ({bet['odds']:+.0f}) - {bet['matchup']}")
                print(f"Recent Form: {bet['form']}")
                print(f"Market Probability: {bet['implied_prob']:.1f}%")
                print(f"Model Probability: {bet['actual_prob']:.1f}%")
                print(f"Edge: {bet['value']*100:.1f}%")
                print("---")
        else:
            print("\nNo value bets found")
            
        if parlay_opportunities:
            print("\nTop Parlay Opportunities:")
            for leg in sorted(parlay_opportunities, key=lambda x: x['actual_prob'], reverse=True)[:3]:
                print(f"{leg['team']} ({leg['odds']:+.0f}) - {leg['leg']}")
                print(f"Recent Form: {leg['form']}")
                print(f"Model Probability: {leg['actual_prob']:.1f}%")
                print("---")
        else:
            print("\nNo strong parlay opportunities found")
            
        return {
            'team_bets': value_bets,
            'parlays': parlay_opportunities[:3] if parlay_opportunities else []
        }
    except Exception as e:
        logger.error(f"Error during game analysis: {str(e)}")

if __name__ == "__main__":
    analyze_games()
