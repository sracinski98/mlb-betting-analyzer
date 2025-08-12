"""MLB API with working odds processing"""
import pandas as pd
import requests
from datetime import datetime, timedelta
import logging

class MLBApi:
    ESPN_MLB_ENDPOINT = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb"
    
    def __init__(self, odds_api_key: str = "fe3e1db58259d6d7d3599e2ae3d22ecc"):
        self.logger = logging.getLogger(__name__)
        from mlb_analyzer.data.providers.odds_api_provider import TheOddsAPIProvider
        from mlb_analyzer.data.providers.espn_api_provider import ESPNStatsProvider
        self.odds_provider = TheOddsAPIProvider(odds_api_key)
        self.stats_provider = ESPNStatsProvider()
        self.cache = {}
        self.cache_ttl = {
            'odds': timedelta(minutes=5),
            'games': timedelta(minutes=1)
        }
    
    def get_live_games(self) -> pd.DataFrame:
        """Fetch today's MLB games"""
        try:
            # Get today's date in YYYYMMDD format
            today = datetime.now().strftime('%Y%m%d')
            print(f"Fetching games for date: {today}")
            
            url = f"{self.ESPN_MLB_ENDPOINT}/scoreboard"
            print(f"Making request to: {url}")
            
            response = requests.get(
                url,
                params={
                    'limit': 100,  # Get all games
                    'dates': today  # Specify today's date
                }
            )
            data = response.json()
            
            games = []
            for event in data.get('events', []):
                game_data = {
                    'game_id': event['id'],
                    'status': event['status']['type']['name'],
                    'home_team': event['competitions'][0]['competitors'][0]['team']['abbreviation'],
                    'away_team': event['competitions'][0]['competitors'][1]['team']['abbreviation'],
                }
                games.append(game_data)
            
            return pd.DataFrame(games)
            
        except Exception as e:
            self.logger.error(f"Error fetching games: {str(e)}")
            return pd.DataFrame()
    
    def get_live_odds(self) -> pd.DataFrame:
        """Fetch and process current MLB betting odds"""
        cache_key = 'live_odds'
        
        if cache_key in self.cache:
            cache_entry = self.cache[cache_key]
            if datetime.now() - cache_entry['timestamp'] < self.cache_ttl['odds']:
                return cache_entry['data']
        
        try:
            if not self.odds_provider:
                return pd.DataFrame()

            # Get fresh odds from provider
            raw_odds = self.odds_provider.get_all_odds()
            
            if isinstance(raw_odds, pd.DataFrame) and not raw_odds.empty:
                # Clean team names to match ESPN abbreviations
                raw_odds['home_team'] = raw_odds['home_team'].apply(self._normalize_team_name)
                raw_odds['away_team'] = raw_odds['away_team'].apply(self._normalize_team_name)
                
                # Group by game and calculate averages
                agg_odds = raw_odds.groupby(['game_id', 'home_team', 'away_team']).agg({
                    'home_moneyline': 'mean',
                    'away_moneyline': 'mean',
                    'total_runs': 'mean',
                    'over_odds': 'mean',
                    'under_odds': 'mean',
                }).reset_index()
                
                # Add bookmaker count
                agg_odds['bookmaker'] = raw_odds.groupby('game_id')['bookmaker'].nunique().map(
                    lambda x: f'Average ({x} books)'
                )
                agg_odds['last_update'] = datetime.now().isoformat()
                
                # Round appropriately
                agg_odds['home_moneyline'] = agg_odds['home_moneyline'].round()
                agg_odds['away_moneyline'] = agg_odds['away_moneyline'].round()
                agg_odds['total_runs'] = agg_odds['total_runs'].round(1)
                agg_odds['over_odds'] = agg_odds['over_odds'].round()
                agg_odds['under_odds'] = agg_odds['under_odds'].round()
                
                # Cache results
                self.cache[cache_key] = {
                    'data': agg_odds,
                    'timestamp': datetime.now()
                }
                
                return agg_odds
            
            return pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"Error processing odds: {str(e)}")
            return pd.DataFrame()
    
    def get_team_stats(self, team_abbrev: str) -> pd.DataFrame:
        """Get recent team performance stats"""
        return self.stats_provider.get_team_stats(team_abbrev)
        
    def analyze_games(self) -> dict:
        """Analyze today's games for betting opportunities"""
        try:
            # Get games and odds
            games_df = self.get_live_games()
            odds_df = self.get_live_odds()
            
            if games_df.empty or odds_df.empty:
                return {}
            
            # Calculate implied probabilities and find value bets
            analyzed = {
                'team_bets': [],
                'player_props': [],
                'parlays': []
            }
            
            # Process each game
            for _, game in games_df.iterrows():
                game_odds = odds_df[
                    (odds_df['home_team'] == game['home_team']) & 
                    (odds_df['away_team'] == game['away_team'])
                ]
                
                if not game_odds.empty:
                    odds_row = game_odds.iloc[0]
                    
                    # Calculate implied probabilities
                    home_ml = odds_row['home_moneyline']
                    away_ml = odds_row['away_moneyline']
                    
                    # Convert moneyline to probability
                    if home_ml > 0:
                        home_implied = 100 / (home_ml + 100)
                    else:
                        home_implied = abs(home_ml) / (abs(home_ml) + 100)
                        
                    if away_ml > 0:
                        away_implied = 100 / (away_ml + 100)
                    else:
                        away_implied = abs(away_ml) / (abs(away_ml) + 100)
                    
                    # Get total runs
                    total = odds_row['total_runs']
                    
                    # Record potential value bets
                    game_analysis = {
                        'game_id': game['game_id'],
                        'matchup': f"{game['away_team']} @ {game['home_team']}",
                        'home_team': {
                            'team': game['home_team'],
                            'moneyline': home_ml,
                            'implied_prob': round(home_implied * 100, 1),
                            'is_value': home_implied < 0.4  # Value on big underdogs
                        },
                        'away_team': {
                            'team': game['away_team'],
                            'moneyline': away_ml,
                            'implied_prob': round(away_implied * 100, 1),
                            'is_value': away_implied < 0.4  # Value on big underdogs
                        },
                        'total': {
                            'line': total,
                            'over_odds': odds_row['over_odds'],
                            'under_odds': odds_row['under_odds']
                        }
                    }
                    
                    # Add to team bets if there's value
                    if game_analysis['home_team']['is_value']:
                        analyzed['team_bets'].append({
                            'bet_type': 'moneyline',
                            'team': game_analysis['home_team']['team'],
                            'odds': game_analysis['home_team']['moneyline'],
                            'implied_prob': game_analysis['home_team']['implied_prob'],
                            'matchup': game_analysis['matchup']
                        })
                    
                    if game_analysis['away_team']['is_value']:
                        analyzed['team_bets'].append({
                            'bet_type': 'moneyline',
                            'team': game_analysis['away_team']['team'],
                            'odds': game_analysis['away_team']['moneyline'],
                            'implied_prob': game_analysis['away_team']['implied_prob'],
                            'matchup': game_analysis['matchup']
                        })
                    
                    # Look for potential parlays with favorites
                    if home_ml < -150 or away_ml < -150:
                        analyzed['parlays'].append({
                            'leg': game_analysis['matchup'],
                            'team': game['home_team'] if home_ml < -150 else game['away_team'],
                            'odds': min(home_ml, away_ml),
                            'implied_prob': max(home_implied, away_implied) * 100
                        })
            
            # Sort parlays by probability
            analyzed['parlays'] = sorted(
                analyzed['parlays'],
                key=lambda x: x['implied_prob'],
                reverse=True
            )[:3]  # Top 3 most likely favorites
            
            return analyzed
            
        except Exception as e:
            self.logger.error(f"Error analyzing games: {str(e)}")
            return {}

    def _normalize_team_name(self, name: str) -> str:
        """Convert full team names to ESPN abbreviations"""
        team_mapping = {
            'Baltimore Orioles': 'BAL',
            'Boston Red Sox': 'BOS',
            'Chicago White Sox': 'CHW',
            'Cleveland Guardians': 'CLE',
            'Detroit Tigers': 'DET',
            'Houston Astros': 'HOU',
            'Kansas City Royals': 'KC',
            'Los Angeles Angels': 'LAA',
            'Minnesota Twins': 'MIN',
            'New York Yankees': 'NYY',
            'Oakland Athletics': 'OAK',
            'Seattle Mariners': 'SEA',
            'Tampa Bay Rays': 'TB',
            'Texas Rangers': 'TEX',
            'Toronto Blue Jays': 'TOR',
            'Arizona Diamondbacks': 'ARI',
            'Atlanta Braves': 'ATL',
            'Chicago Cubs': 'CHC',
            'Cincinnati Reds': 'CIN',
            'Colorado Rockies': 'COL',
            'Los Angeles Dodgers': 'LAD',
            'Miami Marlins': 'MIA',
            'Milwaukee Brewers': 'MIL',
            'New York Mets': 'NYM',
            'Philadelphia Phillies': 'PHI',
            'Pittsburgh Pirates': 'PIT',
            'San Diego Padres': 'SD',
            'San Francisco Giants': 'SF',
            'St. Louis Cardinals': 'STL',
            'Washington Nationals': 'WSH'
        }
        return team_mapping.get(name, name)
