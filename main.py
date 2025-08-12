from fastapi import FastAPI, Requestfrom fastapi.templating import Jinja2Templatesfrom fastapi.staticfiles import StaticFilesfrom fastapi.responses import JSONResponsefrom mlb_analyzer.data.mlb_api import MLBApiimport osfrom dotenv import load_dotenvimport pandas as pdfrom typing import Dict, Listimport json# Load environment variablesload_dotenv()app = FastAPI()templates = Jinja2Templates(directory="templates")app.mount("/static", StaticFiles(directory="static"), name="static")# Initialize MLB API with your API keymlb_api = MLBApi(odds_api_key=os.getenv("ODDS_API_KEY"))@app.get("/")async def home(request: Request):    """Render the home page."""    return templates.TemplateResponse("index.html", {"request": request})@app.get("/analyze")async def analyze_games():    """Analyze all MLB games for today and return betting recommendations."""    try:        # Get today's games and odds        games_df = mlb_api.get_live_games()        odds_df = mlb_api.get_live_odds()                recommendations = {            'team_bets': [],            'player_props': [],            'parlays': []        }                if not games_df.empty and not odds_df.empty:            # Analyze team bets            for _, game in games_df.iterrows():                game_odds = odds_df[odds_df['game_id'] == game['game_id']]                if not game_odds.empty:                    # Get team stats                    home_stats = mlb_api.get_team_stats(game['home_team'])                    away_stats = mlb_api.get_team_stats(game['away_team'])                                        if not home_stats.empty and not away_stats.empty:                        # Calculate win probabilities and value bets                        home_prob = _calculate_win_probability(home_stats.iloc[0], away_stats.iloc[0])                        away_prob = 1 - home_prob                                                odds_row = game_odds.iloc[0]                                                # Check for value bets                        home_value = _check_betting_value(home_prob, odds_row['home_moneyline'])                        away_value = _check_betting_value(away_prob, odds_row['away_moneyline'])                                                if home_value > 0.1:  # 10% edge threshold                            recommendations['team_bets'].append({                                'type': 'moneyline',                                'team': game['home_team'],                                'odds': odds_row['home_moneyline'],                                'probability': home_prob,                                'value': home_value,                                'confidence': 'high' if home_value > 0.15 else 'medium'                            })                                                if away_value > 0.1:                            recommendations['team_bets'].append({                                'type': 'moneyline',                                'team': game['away_team'],                                'odds': odds_row['away_moneyline'],                                'probability': away_prob,                                'value': away_value,                                'confidence': 'high' if away_value > 0.15 else 'medium'                            })                                                    # Check totals                        if 'total_runs' in odds_row and 'over_odds' in odds_row:                            total_prob = _calculate_totals_probability(home_stats.iloc[0], away_stats.iloc[0], odds_row['total_runs'])                            if total_prob > 0.6:                                recommendations['team_bets'].append({                                    'type': 'total',                                    'bet': 'over' if total_prob > 0.6 else 'under',                                    'line': odds_row['total_runs'],                                    'odds': odds_row['over_odds'] if total_prob > 0.6 else odds_row['under_odds'],                                    'probability': total_prob if total_prob > 0.6 else 1 - total_prob,                                    'confidence': 'high' if abs(total_prob - 0.5) > 0.15 else 'medium'
                                })
                
                # Get player props for games that haven't started
                if game['status'] == 'STATUS_SCHEDULED':
                    props_df = mlb_api.get_player_props(game_id=game['game_id'])
                    if not props_df.empty:
                        for _, prop in props_df.iterrows():
                            prop_value = _analyze_player_prop(prop, home_stats.iloc[0], away_stats.iloc[0])
                            if prop_value > 0.1:
                                recommendations['player_props'].append({
                                    'player': prop['player_name'],
                                    'prop_type': prop['prop_type'],
                                    'line': prop['line'],
                                    'bet': 'over' if prop_value > 0 else 'under',
                                    'odds': prop['over_odds'] if prop_value > 0 else prop['under_odds'],
                                    'value': abs(prop_value),
                                    'confidence': 'high' if abs(prop_value) > 0.15 else 'medium'
                                })
            
            # Generate parlay recommendations
            parlays_df = mlb_api.get_optimal_parlays(min_probability=0.6, max_legs=3)
            if not parlays_df.empty:
                for _, parlay in parlays_df.iterrows():
                    recommendations['parlays'].append({
                        'legs': parlay['legs'],
                        'probability': parlay['probability'],
                        'odds': parlay['combined_odds'],
                        'confidence': parlay['confidence']
                    })
        
        return JSONResponse(content=recommendations)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

def _calculate_win_probability(home_stats: pd.Series, away_stats: pd.Series) -> float:
    """Calculate win probability based on team stats."""
    # Basic probability calculation using recent performance and stats
    home_factors = [
        home_stats['win_pct'] * 0.3,
        home_stats['recent_win_pct'] * 0.3,
        (home_stats['recent_runs_per_game'] / 
         (home_stats['recent_runs_per_game'] + away_stats['recent_runs_allowed_per_game'])) * 0.2,
        0.54  # Home field advantage
    ]
    return sum(home_factors) / len(home_factors)

def _check_betting_value(probability: float, odds: float) -> float:
    """Calculate betting value based on probability and odds."""
    if odds > 0:
        implied_prob = 100 / (odds + 100)
    else:
        implied_prob = abs(odds) / (abs(odds) + 100)
    return probability - implied_prob

def _calculate_totals_probability(home_stats: pd.Series, away_stats: pd.Series, total: float) -> float:
    """Calculate probability of over/under hitting."""
    expected_runs = (
        home_stats['recent_runs_per_game'] + 
        away_stats['recent_runs_per_game']
    ) / 2
    
    # Basic over probability
    if expected_runs > total:
        return 0.5 + min(0.3, (expected_runs - total) / 10)
    else:
        return 0.5 - min(0.3, (total - expected_runs) / 10)

def _analyze_player_prop(prop: pd.Series, home_stats: pd.Series, away_stats: pd.Series) -> float:
    """Analyze if a player prop has value."""
    # This is a simplified analysis - you would want to use more detailed player stats
    # and matchup data for a more accurate prediction
    if prop['prop_type'] == 'STRIKEOUTS':
        # For pitcher strikeouts, we'd want to look at K/9, opposing team K%, etc.
        return 0.1  # Placeholder
    elif prop['prop_type'] in ['HITS', 'BASES', 'RBI']:
        # For batter props, we'd want to look at batting averages, matchups, etc.
        return 0.0  # Placeholder
    return 0.0
