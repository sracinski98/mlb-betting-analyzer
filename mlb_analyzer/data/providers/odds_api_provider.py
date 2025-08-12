"""
TheOddsAPI implementation of OddsProvider.
"""

from typing import Dict, Optional
import requests
import pandas as pd
from datetime import datetime
import logging
from mlb_analyzer.data.providers.odds_provider import OddsProvider

class TheOddsAPIProvider(OddsProvider):
    """TheOddsAPI implementation of OddsProvider."""
    
    def __init__(self, api_key: str):
        """Initialize TheOddsAPI provider."""
        self.logger = logging.getLogger(__name__)
        self.api_key = api_key
        self.base_url = "https://api.the-odds-api.com/v4"
        self.sport = "baseball_mlb"  # Sport key for MLB
        
    def get_game_odds(self, game_id: str) -> Dict:
        """Get odds for a specific game from TheOddsAPI."""
        try:
            # Make request for the specific game
            data = self._make_request(f"sports/{self.sport}/events/{game_id}/odds", 
                                    params={'regions': 'us', 'markets': 'h2h,spreads,totals'})
            
            if not data:
                return {}
                
            odds = {
                'game_id': game_id,
                'timestamp': datetime.now().isoformat(),
                'bookmakers': []
            }
            
            # Process each bookmaker's odds
            for bookmaker in data.get('bookmakers', []):
                bm_odds = {
                    'name': bookmaker['key'],
                    'home_ml': None,
                    'away_ml': None,
                    'spread': None,
                    'home_spread_odds': None,
                    'away_spread_odds': None,
                    'total': None,
                    'over_odds': None,
                    'under_odds': None
                }
                
                # Process markets
                for market in bookmaker.get('markets', []):
                    market_key = market['key']
                    outcomes = {o['name']: o for o in market['outcomes']}
                    
                    if market_key == 'h2h':  # Moneyline
                        for outcome in market['outcomes']:
                            if outcome['name'] == data['home_team']:
                                bm_odds['home_ml'] = outcome['price']
                            else:
                                bm_odds['away_ml'] = outcome['price']
                    
                    elif market_key == 'spreads':  # Run line
                        for outcome in market['outcomes']:
                            if outcome['name'] == data['home_team']:
                                bm_odds['spread'] = outcome['point']
                                bm_odds['home_spread_odds'] = outcome['price']
                            else:
                                bm_odds['away_spread_odds'] = outcome['price']
                    
                    elif market_key == 'totals':  # Over/Under
                        for outcome in market['outcomes']:
                            bm_odds['total'] = outcome['point']
                            if outcome['name'].lower() == 'over':
                                bm_odds['over_odds'] = outcome['price']
                            else:
                                bm_odds['under_odds'] = outcome['price']
                
                odds['bookmakers'].append(bm_odds)
            
            return odds
            
        except Exception as e:
            self.logger.error(f"Error getting game odds: {str(e)}")
            return {}
        
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make an authenticated request to TheOddsAPI."""
        if not params:
            params = {}
        params['apiKey'] = self.api_key
        
        try:
            response = requests.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            
            # Log remaining requests
            remaining = response.headers.get('x-requests-remaining', 'unknown')
            self.logger.info(f"Remaining API requests: {remaining}")
            
            return response.json()
        except Exception as e:
            self.logger.error(f"Error making request to TheOddsAPI: {str(e)}")
            return {}
            
    def get_all_odds(self) -> pd.DataFrame:
        """Get all available MLB odds."""
        try:
            # Get odds data from TheOddsAPI
            params = {
                'regions': 'us',  # US odds format
                'markets': 'h2h,spreads,totals',  # Get moneyline, spread, and totals
                'oddsFormat': 'american'  # American odds format
            }
            
            data = self._make_request(f"sports/{self.sport}/odds", params)
            if not data:
                return pd.DataFrame()
            
            odds_list = []
            for game in data:
                game_data = {
                    'game_id': game['id'],
                    'date': game['commence_time'],
                    'home_team': game['home_team'],
                    'away_team': game['away_team'],
                    'last_update': datetime.now().isoformat()
                }
                
                # Process bookmaker odds
                for bookmaker in game.get('bookmakers', []):
                    odds_data = game_data.copy()
                    odds_data['bookmaker'] = bookmaker['key']
                    
                    # Process markets
                    for market in bookmaker.get('markets', []):
                        market_type = market['key']
                        outcomes = {o['name']: o['price'] for o in market['outcomes']}
                        
                        if market_type == 'h2h':  # Moneyline
                            odds_data['home_moneyline'] = outcomes.get(game['home_team'])
                            odds_data['away_moneyline'] = outcomes.get(game['away_team'])
                            
                        elif market_type == 'spreads':  # Run line
                            for outcome in market['outcomes']:
                                if outcome['name'] == game['home_team']:
                                    odds_data['home_spread'] = outcome['point']
                                    odds_data['home_spread_odds'] = outcome['price']
                                else:
                                    odds_data['away_spread'] = outcome['point']
                                    odds_data['away_spread_odds'] = outcome['price']
                                    
                        elif market_type == 'totals':  # Over/Under
                            for outcome in market['outcomes']:
                                odds_data['total_runs'] = outcome['point']
                                if outcome['name'].lower() == 'over':
                                    odds_data['over_odds'] = outcome['price']
                                else:
                                    odds_data['under_odds'] = outcome['price']
                    
                    odds_list.append(odds_data)
            
            return pd.DataFrame(odds_list)
            
        except Exception as e:
            self.logger.error(f"Error getting odds data: {str(e)}")
            return pd.DataFrame()
    
    def get_player_props(self, player_id: str = None, game_id: str = None) -> Dict:
        """Get player proposition bets."""
        try:
            params = {
                'regions': 'us',
                'oddsFormat': 'american',
                'markets': 'player_strikeouts,player_hits,player_home_runs'
            }
            
            # The Odds API provides player props through a separate endpoint
            endpoint = f"sports/{self.sport}/odds"
            if game_id:
                endpoint = f"{endpoint}/{game_id}/odds"
            if player_id:
                params['player'] = player_id
            
            data = self._make_request(endpoint, params)
            if not data:
                return {}
            
            # Process player props data
            props = {
                'player_id': player_id,
                'game_id': game_id,
                'timestamp': datetime.now().isoformat(),
                'props': []
            }
            
            # If we got a list of games, find the specific game
            games_data = [data] if isinstance(data, dict) else data
            
            for game in games_data:
                if game_id and game['id'] != game_id:
                    continue
                    
                game_props = []
                for bookmaker in game.get('bookmakers', []):
                    for market in bookmaker.get('markets', []):
                        try:
                            # Normalize market key to prop type
                            prop_type = market['key'].replace('player_', '').upper()
                            
                            # Group outcomes by player
                            outcomes_by_player = {}
                            for outcome in market['outcomes']:
                                if 'player' not in outcome:
                                    continue
                                    
                                player = outcome['player']
                                if player not in outcomes_by_player:
                                    outcomes_by_player[player] = {
                                        'player_name': player,
                                        'prop_type': prop_type,
                                        'line': outcome.get('point'),
                                        'over_odds': None,
                                        'under_odds': None
                                    }
                                
                                # Set over/under odds
                                if outcome.get('name', '').lower() == 'over':
                                    outcomes_by_player[player]['over_odds'] = outcome['price']
                                elif outcome.get('name', '').lower() == 'under':
                                    outcomes_by_player[player]['under_odds'] = outcome['price']
                            
                            # Add complete props to the list
                            for player_props in outcomes_by_player.values():
                                if player_props['over_odds'] is not None and player_props['under_odds'] is not None:
                                    game_props.append(player_props)
                                    
                        except Exception as e:
                            self.logger.warning(f"Error processing market {market['key']}: {str(e)}")
                            continue
                
                # Only add props if we found some for this game
                if game_props:
                    props['props'] = game_props
                    break
            
            return props
            
        except Exception as e:
            self.logger.error(f"Error getting player props: {str(e)}")
            return {}
