from http.server import BaseHTTPRequestHandler
from mlb_analyzer.data.mlb_api import MLBApi
import json
import os

mlb_api = MLBApi(odds_api_key=os.environ.get('ODDS_API_KEY', 'fe3e1db58259d6d7d3599e2ae3d22ecc'))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Get today's games and analysis
            recommendations = analyze_games(mlb_api)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(recommendations).encode())
            return
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

def analyze_games(mlb_api):
    """Analyze all MLB games and return betting recommendations."""
    try:
        # Constants for betting analysis
        VALUE_THRESHOLD = 0.03  # 3% edge required for value bets
        PARLAY_PROB_THRESHOLD = 0.70  # 70% minimum probability for parlay legs
        MIN_ODDS = -250  # Don't consider heavy favorites beyond -250
        MIN_RUNS = 4.5  # Minimum recent runs per game for value bets
        MIN_WIN_PCT = 0.65  # Minimum win percentage for value bets
        
        # Get today's games and odds
        games_df = mlb_api.get_live_games()
        odds_df = mlb_api.get_live_odds()
        
        recommendations = {
            'team_bets': [],
            'player_props': [],
            'parlays': []
        }
        
        if games_df.empty or odds_df.empty:
            return recommendations
            
        # Process each game
        for _, game in games_df.iterrows():
            game_odds = odds_df[
                (odds_df['home_team'] == game['home_team']) & 
                (odds_df['away_team'] == game['away_team'])
            ]
            
            if not game_odds.empty:
                odds_row = game_odds.iloc[0]
                home_stats = mlb_api.get_team_stats(game['home_team'])
                away_stats = mlb_api.get_team_stats(game['away_team'])
                
                if not home_stats.empty and not away_stats.empty:
                    # Process moneyline analysis
                    home_ml = odds_row['home_moneyline']
                    away_ml = odds_row['away_moneyline']
                    
                    # Get win rates and run production
                    home_actual_prob = home_stats['recent_win_pct'].iloc[0]
                    away_actual_prob = away_stats['recent_win_pct'].iloc[0]
                    home_runs = home_stats['recent_runs_per_game'].iloc[0]
                    away_runs = away_stats['recent_runs_per_game'].iloc[0]
                    
                    # Convert moneyline to probability
                    def ml_to_prob(ml):
                        if ml < 0:
                            return abs(ml) / (abs(ml) + 100)
                        else:
                            return 100 / (ml + 100)
                    
                    home_implied_prob = ml_to_prob(home_ml)
                    away_implied_prob = ml_to_prob(away_ml)
                    
                    # Calculate value
                    def calculate_value(actual_prob, implied_prob, runs):
                        edge = actual_prob - implied_prob
                        value = edge
                        
                        if actual_prob >= MIN_WIN_PCT:
                            value += min(0.03, (actual_prob - MIN_WIN_PCT) * 2)
                        if runs >= MIN_RUNS:
                            value += min(0.02, (runs - MIN_RUNS) / 10)
                            
                        return value
                    
                    # Check home team value
                    home_value = calculate_value(home_actual_prob, home_implied_prob, home_runs)
                    if (home_value > VALUE_THRESHOLD and 
                        (home_ml > MIN_ODDS or home_actual_prob > MIN_WIN_PCT) and
                        home_runs > MIN_RUNS):
                        recommendations['team_bets'].append({
                            'team': game['home_team'],
                            'type': 'moneyline',
                            'odds': home_ml,
                            'value': home_value,
                            'probability': home_actual_prob * 100,
                            'confidence': 'high' if home_value > 0.15 else 'medium'
                        })
                    
                    # Check away team value
                    away_value = calculate_value(away_actual_prob, away_implied_prob, away_runs)
                    if (away_value > VALUE_THRESHOLD and 
                        (away_ml > MIN_ODDS or away_actual_prob > MIN_WIN_PCT) and
                        away_runs > MIN_RUNS):
                        recommendations['team_bets'].append({
                            'team': game['away_team'],
                            'type': 'moneyline',
                            'odds': away_ml,
                            'value': away_value,
                            'probability': away_actual_prob * 100,
                            'confidence': 'high' if away_value > 0.15 else 'medium'
                        })
                        
                    # Check for parlay potential
                    if (home_actual_prob > PARLAY_PROB_THRESHOLD and 
                        home_ml > MIN_ODDS and
                        home_runs > MIN_RUNS):
                        recommendations['parlays'].append({
                            'legs': [{
                                'description': f"{game['home_team']} ML ({home_ml:+.0f})",
                                'team': game['home_team'],
                                'odds': home_ml,
                                'probability': home_actual_prob * 100
                            }],
                            'odds': home_ml,
                            'unit_size': 1
                        })
                        
                    if (away_actual_prob > PARLAY_PROB_THRESHOLD and 
                        away_ml > MIN_ODDS and
                        away_runs > MIN_RUNS):
                        recommendations['parlays'].append({
                            'legs': [{
                                'description': f"{game['away_team']} ML ({away_ml:+.0f})",
                                'team': game['away_team'],
                                'odds': away_ml,
                                'probability': away_actual_prob * 100
                            }],
                            'odds': away_ml,
                            'unit_size': 1
                        })
        
        # Sort team bets by value
        recommendations['team_bets'] = sorted(
            recommendations['team_bets'],
            key=lambda x: x['value'],
            reverse=True
        )
        
        # Sort parlays by probability and take top 3
        recommendations['parlays'] = sorted(
            recommendations['parlays'],
            key=lambda x: x['legs'][0]['probability'],
            reverse=True
        )[:3]
        
        return recommendations
        
    except Exception as e:
        print(f"Error analyzing games: {str(e)}")
        return {
            'team_bets': [],
            'player_props': [],
            'parlays': []
        }


