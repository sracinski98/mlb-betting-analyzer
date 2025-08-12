from http.server import BaseHTTPRequestHandler
from mlb_analyzer.data.mlb_api import MLBApi
import json
import os

mlb_api = MLBApi(odds_api_key=os.environ.get('ODDS_API_KEY'))

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
    # Get today's games and odds
    games_df = mlb_api.get_live_games()
    odds_df = mlb_api.get_live_odds()
    
    recommendations = {
        'team_bets': [],
        'player_props': [],
        'parlays': []
    }
    
    if not games_df.empty and not odds_df.empty:
        # Process each game
        for _, game in games_df.iterrows():
            game_odds = odds_df[odds_df['game_id'] == game['game_id']]
            if not game_odds.empty:
                process_game(game, game_odds.iloc[0], mlb_api, recommendations)
    
    return recommendations

def process_game(game, odds, mlb_api, recommendations):
    """Process a single game for betting opportunities."""
    # Get team stats
    home_stats = mlb_api.get_team_stats(game['home_team'])
    away_stats = mlb_api.get_team_stats(game['away_team'])
    
    if not home_stats.empty and not away_stats.empty:
        analyze_moneyline(game, odds, home_stats.iloc[0], away_stats.iloc[0], recommendations)
        analyze_totals(odds, home_stats.iloc[0], away_stats.iloc[0], recommendations)
        
        if game['status'] == 'Scheduled':
            analyze_props(game, mlb_api, home_stats.iloc[0], away_stats.iloc[0], recommendations)

def analyze_moneyline(game, odds, home_stats, away_stats, recommendations):
    """Analyze moneyline betting opportunities."""
    home_prob = calculate_win_probability(home_stats, away_stats)
    away_prob = 1 - home_prob
    
    home_value = check_betting_value(home_prob, odds['home_moneyline'])
    away_value = check_betting_value(away_prob, odds['away_moneyline'])
    
    if home_value > 0.1:
        recommendations['team_bets'].append({
            'type': 'moneyline',
            'team': game['home_team'],
            'odds': odds['home_moneyline'],
            'probability': home_prob,
            'value': home_value,
            'confidence': 'high' if home_value > 0.15 else 'medium'
        })
    
    if away_value > 0.1:
        recommendations['team_bets'].append({
            'type': 'moneyline',
            'team': game['away_team'],
            'odds': odds['away_moneyline'],
            'probability': away_prob,
            'value': away_value,
            'confidence': 'high' if away_value > 0.15 else 'medium'
        })

def analyze_totals(odds, home_stats, away_stats, recommendations):
    """Analyze totals betting opportunities."""
    if 'total_runs' in odds and 'over_odds' in odds:
        total_prob = calculate_totals_probability(home_stats, away_stats, odds['total_runs'])
        if abs(total_prob - 0.5) > 0.1:
            recommendations['team_bets'].append({
                'type': 'total',
                'bet': 'over' if total_prob > 0.5 else 'under',
                'line': odds['total_runs'],
                'odds': odds['over_odds'] if total_prob > 0.5 else odds['under_odds'],
                'probability': total_prob if total_prob > 0.5 else 1 - total_prob,
                'confidence': 'high' if abs(total_prob - 0.5) > 0.15 else 'medium'
            })

def analyze_props(game, mlb_api, home_stats, away_stats, recommendations):
    """Analyze player props betting opportunities."""
    props_df = mlb_api.get_player_props(game_id=game['game_id'])
    if not props_df.empty:
        for _, prop in props_df.iterrows():
            prop_value = analyze_player_prop(prop, home_stats, away_stats)
            if abs(prop_value) > 0.1:
                recommendations['player_props'].append({
                    'player': prop['player_name'],
                    'prop_type': prop['prop_type'],
                    'line': prop['line'],
                    'bet': 'over' if prop_value > 0 else 'under',
                    'odds': prop['over_odds'] if prop_value > 0 else prop['under_odds'],
                    'value': abs(prop_value),
                    'confidence': 'high' if abs(prop_value) > 0.15 else 'medium'
                })

def calculate_win_probability(home_stats, away_stats):
    """Calculate win probability based on team stats."""
    home_factors = [
        home_stats['win_pct'] * 0.3,
        home_stats['recent_win_pct'] * 0.3,
        (home_stats['recent_runs_per_game'] / 
         (home_stats['recent_runs_per_game'] + away_stats['recent_runs_allowed_per_game'])) * 0.2,
        0.54  # Home field advantage
    ]
    return sum(home_factors) / len(home_factors)

def check_betting_value(probability, odds):
    """Calculate betting value based on probability and odds."""
    if odds > 0:
        implied_prob = 100 / (odds + 100)
    else:
        implied_prob = abs(odds) / (abs(odds) + 100)
    return probability - implied_prob

def calculate_totals_probability(home_stats, away_stats, total):
    """Calculate probability of over/under hitting."""
    expected_runs = (
        home_stats['recent_runs_per_game'] + 
        away_stats['recent_runs_per_game']
    ) / 2
    
    if expected_runs > total:
        return 0.5 + min(0.3, (expected_runs - total) / 10)
    else:
        return 0.5 - min(0.3, (total - expected_runs) / 10)

def analyze_player_prop(prop, home_stats, away_stats):
    """Analyze if a player prop has value."""
    # Simplified analysis - you would want to use more detailed player stats
    if prop['prop_type'] == 'STRIKEOUTS':
        return 0.1  # Placeholder
    elif prop['prop_type'] in ['HITS', 'BASES', 'RBI']:
        return 0.0  # Placeholder
    return 0.0
