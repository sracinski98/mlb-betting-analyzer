"""
DraftKings implementation of OddsProvider.
"""

from typing import Dict
import requests
import pandas as pd
from datetime import datetime
import logging
from .odds_provider import OddsProvider

class DraftKingsProvider(OddsProvider):
    """DraftKings implementation of OddsProvider."""
    
    # DraftKings API endpoints
    BASE_URL = "https://sportsbook.draftkings.com"
    CATALOG_URL = f"{BASE_URL}/sites/US-SB/api/v5/eventgroups/88670846"  # MLB eventgroup ID
    EVENT_URL = f"{BASE_URL}/sites/US-SB/api/v3/event"
    ODDS_URL = f"{BASE_URL}/sites/US-SB/api/v3/event/live-odds"
    
    # Sport and competition IDs
    SPORT_ID = 2  # Baseball
    LEAGUE_ID = 1  # MLB
    
    # DraftKings market types
    MARKET_TYPES = {
        'MONEYLINE': 'Moneyline',
        'SPREAD': 'Run Line',
        'TOTAL': 'Total Runs',
        'STRIKEOUTS': 'Pitcher Strikeouts',
        'HITS': 'Player Hits',
        'BASES': 'Total Bases',
        'HOME_RUNS': 'Home Runs',
        'RBI': 'Runs Batted In'
    }
    
    def __init__(self):
        """Initialize DraftKings provider."""
        self.logger = logging.getLogger(__name__)
        self.session = requests.Session()
        # Set headers to mimic browser request
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://sportsbook.draftkings.com/',
            'Origin': 'https://sportsbook.draftkings.com'
        })
    
    def _get_events(self) -> Dict:
        """Get all MLB events from DraftKings."""
        try:
            response = self.session.get(self.CATALOG_URL)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.logger.error(f"Error fetching DraftKings events: {str(e)}")
            return {}
    
    def _get_event_markets(self, event_id: str) -> Dict:
        """Get markets (odds) for a specific event."""
        try:
            url = f"{self.EVENT_URL}/{event_id}/odds"
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.logger.error(f"Error fetching event markets for {event_id}: {str(e)}")
            return {}
            
    def get_game_odds(self, game_id: str) -> Dict:
        """Get odds for a specific game from DraftKings."""
        try:
            markets = self._get_event_markets(game_id)
            if not markets:
                return {}
            
            odds = {
                'game_id': game_id,
                'timestamp': datetime.now().isoformat(),
                'bookmakers': []
            }
            
            bookmaker = {
                'name': 'DraftKings',
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
            for market in markets.get('markets', []):
                market_name = market.get('name')
                
                if market_name == self.MARKET_TYPES['MONEYLINE']:
                    for outcome in market.get('outcomes', []):
                        if outcome.get('type') == 'home':
                            bookmaker['home_ml'] = outcome.get('oddsAmerican')
                        else:
                            bookmaker['away_ml'] = outcome.get('oddsAmerican')
                
                elif market_name == self.MARKET_TYPES['SPREAD']:
                    bookmaker['spread'] = market.get('line')
                    for outcome in market.get('outcomes', []):
                        if outcome.get('type') == 'home':
                            bookmaker['home_spread_odds'] = outcome.get('oddsAmerican')
                        else:
                            bookmaker['away_spread_odds'] = outcome.get('oddsAmerican')
                
                elif market_name == self.MARKET_TYPES['TOTAL']:
                    bookmaker['total'] = market.get('line')
                    for outcome in market.get('outcomes', []):
                        if outcome.get('type') == 'over':
                            bookmaker['over_odds'] = outcome.get('oddsAmerican')
                        else:
                            bookmaker['under_odds'] = outcome.get('oddsAmerican')
            
            odds['bookmakers'].append(bookmaker)
            return odds
            
        except Exception as e:
            self.logger.error(f"Error getting game odds: {str(e)}")
            return {}
    
    def get_player_props(self, player_id: str, game_id: str) -> Dict:
        """Get player props from DraftKings."""
        try:
            markets = self._get_event_markets(game_id)
            if not markets:
                return {}
            
            props = {
                'player_id': player_id,  # We might need to map DK player IDs to ESPN IDs
                'player_name': None,  # Will be extracted from market name
                'game_id': game_id,
                'timestamp': datetime.now().isoformat(),
                'props': []
            }
            
            # Process player markets
            for market in markets.get('markets', []):
                market_name = market.get('name', '')
                
                # Check if it's a player prop market
                for prop_type, dk_name in self.MARKET_TYPES.items():
                    if dk_name in market_name and 'Player' in market_name:
                        # Extract player name from market name (format: "Player Name - Prop Type")
                        player_name = market_name.split(' - ')[0].strip()
                        if not props['player_name']:
                            props['player_name'] = player_name
                        
                        prop_data = {
                            'type': prop_type,
                            'name': prop_type.lower(),
                            'line': market.get('line'),
                            'over_odds': None,
                            'under_odds': None
                        }
                        
                        # Get odds for over/under
                        for outcome in market.get('outcomes', []):
                            if outcome.get('type') == 'over':
                                prop_data['over_odds'] = outcome.get('oddsAmerican')
                            else:
                                prop_data['under_odds'] = outcome.get('oddsAmerican')
                        
                        props['props'].append(prop_data)
            
            return props
            
        except Exception as e:
            self.logger.error(f"Error getting player props: {str(e)}")
            return {}
    
    def get_all_odds(self) -> pd.DataFrame:
        """Get all available MLB odds from DraftKings."""
        try:
            events_data = self._get_events()
            if not events_data or 'eventGroup' not in events_data:
                return pd.DataFrame()
            
            odds_list = []
            for event in events_data['eventGroup'].get('events', []):
                event_id = event.get('eventId')
                if not event_id:
                    continue
                
                # Get detailed odds for this event
                markets = self._get_event_markets(event_id)
                if not markets:
                    continue
                
                # Basic game info
                odds_data = {
                    'game_id': event_id,
                    'date': event.get('startDate'),
                    'home_team': event.get('homeTeam', {}).get('abbreviation'),
                    'away_team': event.get('awayTeam', {}).get('abbreviation'),
                    'bookmaker': 'DraftKings',
                    'last_update': datetime.now().isoformat(),
                    'home_moneyline': None,
                    'away_moneyline': None,
                    'home_spread': None,
                    'home_spread_odds': None,
                    'away_spread_odds': None,
                    'total_runs': None,
                    'over_odds': None,
                    'under_odds': None
                }
                
                # Process markets
                for market in markets.get('markets', []):
                    market_name = market.get('name')
                    
                    if market_name == self.MARKET_TYPES['MONEYLINE']:
                        for outcome in market.get('outcomes', []):
                            if outcome.get('type') == 'home':
                                odds_data['home_moneyline'] = outcome.get('oddsAmerican')
                            else:
                                odds_data['away_moneyline'] = outcome.get('oddsAmerican')
                    
                    elif market_name == self.MARKET_TYPES['SPREAD']:
                        odds_data['home_spread'] = market.get('line')
                        for outcome in market.get('outcomes', []):
                            if outcome.get('type') == 'home':
                                odds_data['home_spread_odds'] = outcome.get('oddsAmerican')
                            else:
                                odds_data['away_spread_odds'] = outcome.get('oddsAmerican')
                    
                    elif market_name == self.MARKET_TYPES['TOTAL']:
                        odds_data['total_runs'] = market.get('line')
                        for outcome in market.get('outcomes', []):
                            if outcome.get('type') == 'over':
                                odds_data['over_odds'] = outcome.get('oddsAmerican')
                            else:
                                odds_data['under_odds'] = outcome.get('oddsAmerican')
                
                odds_list.append(odds_data)
            
            return pd.DataFrame(odds_list)
            
        except Exception as e:
            self.logger.error(f"Error getting all odds: {str(e)}")
            return pd.DataFrame()
