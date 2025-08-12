"""
Multi-market betting strategy combining statistical modeling with trend analysis.
"""

from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ..data.mlb_api import MLBApi
from ..analysis.advanced_stats import AdvancedStats
from ..analysis.betting import BettingAnalyzer

class MultiMarketStrategy:
    def __init__(self, 
                mlb_api: MLBApi,
                bankroll: float = 10000,
                kelly_fraction: float = 0.25,
                min_edge: float = 0.05,
                confidence_threshold: float = 0.6):
        """
        Initialize the multi-market betting strategy.
        
        Args:
            mlb_api: MLBApi instance for data fetching
            bankroll: Starting bankroll amount
            kelly_fraction: Fraction of Kelly criterion to use (conservative: 0.25)
            min_edge: Minimum edge required for bet recommendation
            confidence_threshold: Minimum confidence level for predictions
        """
        self.mlb_api = mlb_api
        self.bankroll = bankroll
        self.advanced_stats = AdvancedStats()
        self.betting_analyzer = BettingAnalyzer(
            min_edge=min_edge,
            kelly_fraction=kelly_fraction
        )
        self.confidence_threshold = confidence_threshold
        self.historical_predictions = []

    def analyze_games(self) -> List[Dict]:
        """
        Analyze today's games across multiple markets.
        
        Returns:
            List of betting opportunities with recommendations
        """
        opportunities = []
        
        # Get today's games and odds
        games = self.mlb_api.get_live_games()
        odds_data = self.mlb_api.get_live_odds()
        
        for _, game in games.iterrows():
            game_analysis = self._analyze_single_game(game, odds_data)
            if game_analysis:
                opportunities.extend(game_analysis)
        
        # Sort opportunities by expected value
        return sorted(opportunities, key=lambda x: x['expected_value'], reverse=True)

    def _analyze_single_game(self, 
                           game: pd.Series, 
                           odds_data: pd.DataFrame) -> List[Dict]:
        """Analyze a single game across multiple markets."""
        opportunities = []
        
        # Get team statistics
        home_stats = self._get_team_analysis(game['home_team'])
        away_stats = self._get_team_analysis(game['away_team'])
        
        # Get pitcher matchup analysis
        pitcher_advantage = self._analyze_pitcher_matchup(
            game['pitchers']['home'],
            game['pitchers']['away']
        )
        
        # Analyze different markets
        ml_opportunity = self._analyze_moneyline(
            game, odds_data, home_stats, away_stats, pitcher_advantage
        )
        if ml_opportunity:
            opportunities.append(ml_opportunity)
            
        totals_opportunity = self._analyze_totals(
            game, odds_data, home_stats, away_stats, pitcher_advantage
        )
        if totals_opportunity:
            opportunities.append(totals_opportunity)
            
        runline_opportunity = self._analyze_runline(
            game, odds_data, home_stats, away_stats, pitcher_advantage
        )
        if runline_opportunity:
            opportunities.append(runline_opportunity)
        
        return opportunities

    def _get_team_analysis(self, team: str) -> Dict:
        """Get comprehensive team analysis including trends."""
        try:
            # Get recent team stats
            recent_stats = self.mlb_api.get_team_stats(team)
            
            if recent_stats.empty:
                return self._get_default_team_analysis()
            
            # Calculate recent form (last 10 games)
            recent_form = recent_stats.tail(10)
            
            # Map column names to expected stats
            stats_mapping = {
                'R': 'runs_scored',
                'RA': 'runs_allowed',
                'W': 'wins',
                'L': 'losses',
                'batting_avg': 'batting_avg',
                'rolling_era': 'era'
            }
            
            # Ensure all required columns exist
            for old_col, new_col in stats_mapping.items():
                if old_col not in recent_form.columns:
                    recent_form[old_col] = 0
            
            return {
                'overall_stats': recent_stats,
                'recent_form': {
                    'avg_runs_scored': recent_form['R'].mean(),
                    'avg_runs_allowed': recent_form['RA'].mean(),
                    'win_pct': len(recent_form[recent_form['W'] > 0]) / len(recent_form),
                    'batting_avg': recent_form['batting_avg'].mean(),
                    'era': recent_form['rolling_era'].mean()
                },
                'trends': self._analyze_team_trends(recent_stats)
            }
        except Exception as e:
            self.logger.error(f"Error analyzing team {team}: {str(e)}")
            return self._get_default_team_analysis()
            
    def _get_default_team_analysis(self) -> Dict:
        """Return default team analysis when stats are unavailable."""
        return {
            'overall_stats': pd.DataFrame(),
            'recent_form': {
                'avg_runs_scored': 4.5,  # MLB average
                'avg_runs_allowed': 4.5,  # MLB average
                'win_pct': 0.500,
                'batting_avg': 0.248,  # MLB average
                'era': 4.50  # MLB average
            },
            'trends': {
                'scoring_trend': 'stable',
                'pitching_trend': 'stable',
                'batting_trend': 'stable',
                'home_away_split': {'home': 0.540, 'away': 0.460}  # MLB averages
            }
        }

    def _analyze_team_trends(self, stats: pd.DataFrame) -> Dict:
        """Analyze team trends for pattern recognition."""
        return {
            'scoring_trend': self._calculate_trend(stats['runs_scored']),
            'pitching_trend': self._calculate_trend(stats['rolling_era']),
            'batting_trend': self._calculate_trend(stats['rolling_avg']),
            'home_away_split': self._calculate_home_away_split(stats)
        }

    def _calculate_trend(self, series: pd.Series) -> str:
        """Calculate trend direction and strength."""
        recent = series.tail(5).mean()
        previous = series.tail(10).head(5).mean()
        
        pct_change = (recent - previous) / previous
        
        if abs(pct_change) < 0.05:
            return 'stable'
        elif pct_change > 0:
            return 'improving' if pct_change > 0.1 else 'slightly_improving'
        else:
            return 'declining' if pct_change < -0.1 else 'slightly_declining'

    def _analyze_pitcher_matchup(self, 
                               home_pitcher: str, 
                               away_pitcher: str) -> Dict:
        """
        Analyze the pitching matchup using advanced metrics and Statcast data.
        Considers recent performance, matchup history, and advanced metrics.
        """
        try:
            # Get last 30 days of Statcast data
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            recent_data = self.mlb_api.get_statcast_data(start_date, end_date)
            
            # Analyze home pitcher
            home_metrics = self._get_pitcher_metrics(
                recent_data, home_pitcher
            ) if home_pitcher != 'TBD' else self._get_default_metrics()
            
            # Analyze away pitcher
            away_metrics = self._get_pitcher_metrics(
                recent_data, away_pitcher
            ) if away_pitcher != 'TBD' else self._get_default_metrics()
            
            # Calculate matchup advantages
            home_advantage = self._calculate_pitcher_advantage(home_metrics, away_metrics)
            away_advantage = self._calculate_pitcher_advantage(away_metrics, home_metrics)
            
            return {
                'home_advantage': home_advantage,
                'away_advantage': away_advantage,
                'home_metrics': home_metrics,
                'away_metrics': away_metrics,
                'expected_strikeouts': (home_metrics['k_rate'] + away_metrics['k_rate']) / 2,
                'expected_runs_allowed': {
                    'home': home_metrics['expected_era'],
                    'away': away_metrics['expected_era']
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing pitcher matchup: {str(e)}")
            return self._get_default_matchup()
            
    def _get_pitcher_metrics(self, statcast_data: pd.DataFrame, pitcher_name: str) -> Dict:
        """Calculate advanced metrics for a pitcher using Statcast data."""
        pitcher_data = statcast_data[statcast_data['player_name'] == pitcher_name]
        
        if pitcher_data.empty:
            return self._get_default_metrics()
            
        # Calculate key metrics
        k_rate = len(pitcher_data[pitcher_data['events'] == 'strikeout']) / len(pitcher_data)
        bb_rate = len(pitcher_data[pitcher_data['events'] == 'walk']) / len(pitcher_data)
        
        # Calculate expected statistics
        barrel_rate = len(pitcher_data[pitcher_data['barrel'] == True]) / len(pitcher_data)
        avg_exit_velo = pitcher_data['launch_speed'].mean()
        
        # xERA calculation (simplified)
        xera = 3.0 + (barrel_rate * 15) + (bb_rate * 3) - (k_rate * 2)
        
        return {
            'k_rate': k_rate,
            'bb_rate': bb_rate,
            'barrel_rate': barrel_rate,
            'avg_exit_velo': avg_exit_velo,
            'expected_era': xera,
            'whiff_rate': pitcher_data['whiff_rate'].mean() if 'whiff_rate' in pitcher_data else 0.2
        }
        
    def _get_default_metrics(self) -> Dict:
        """Return default metrics for unknown pitchers."""
        return {
            'k_rate': 0.215,  # MLB average
            'bb_rate': 0.085,  # MLB average
            'barrel_rate': 0.068,  # MLB average
            'avg_exit_velo': 88.2,  # MLB average
            'expected_era': 4.50,  # MLB average
            'whiff_rate': 0.2  # MLB average
        }
        
    def _get_default_matchup(self) -> Dict:
        """Return default matchup analysis."""
        return {
            'home_advantage': 0,
            'away_advantage': 0,
            'home_metrics': self._get_default_metrics(),
            'away_metrics': self._get_default_metrics(),
            'expected_strikeouts': 0.215,  # MLB average K-rate
            'expected_runs_allowed': {
                'home': 4.50,
                'away': 4.50
            }
        }
        
    def _calculate_pitcher_advantage(self, pitcher_metrics: Dict, opponent_metrics: Dict) -> float:
        """Calculate pitcher's advantage score (-1 to 1)."""
        # Weighted combination of key metrics
        advantage = (
            ((1 - opponent_metrics['barrel_rate']) - 0.068) * 0.3 +  # Barrel rate vs average
            ((pitcher_metrics['k_rate'] - 0.215) * 0.3) +  # K-rate vs average
            ((0.085 - pitcher_metrics['bb_rate']) * 0.2) +  # BB-rate vs average
            ((88.2 - pitcher_metrics['avg_exit_velo']) / 10 * 0.2)  # Exit velo vs average
        )
        
        return np.clip(advantage, -1, 1)

    def _analyze_moneyline(self,
                          game: pd.Series,
                          odds_data: pd.DataFrame,
                          home_stats: Dict,
                          away_stats: Dict,
                          pitcher_advantage: Dict) -> Optional[Dict]:
        """Analyze moneyline betting opportunity."""
        # Filter odds for this game and market
        game_odds = odds_data[
            (odds_data['game_id'] == game['game_id']) & 
            (odds_data['market'] == 'h2h')
        ]
        
        if game_odds.empty:
            return None
            
        # Calculate win probabilities
        home_prob = self._calculate_win_probability(
            home_stats, away_stats, pitcher_advantage, is_home=True
        )
        
        # Get best available odds
        best_home_odds = game_odds['home_odds'].max()
        best_away_odds = game_odds['away_odds'].max()
        
        # Check for value opportunities
        home_ev = self.betting_analyzer.calculate_kelly_bet(
            home_prob, best_home_odds, self.bankroll
        )
        away_ev = self.betting_analyzer.calculate_kelly_bet(
            1 - home_prob, best_away_odds, self.bankroll
        )
        
        if home_ev > 0 or away_ev > 0:
            return {
                'game_id': game['game_id'],
                'market': 'moneyline',
                'bet_type': 'home' if home_ev > away_ev else 'away',
                'odds': best_home_odds if home_ev > away_ev else best_away_odds,
                'confidence': home_prob if home_ev > away_ev else (1 - home_prob),
                'expected_value': max(home_ev, away_ev),
                'recommended_bet': self._calculate_bet_size(max(home_ev, away_ev)),
                'analysis': {
                    'home_prob': home_prob,
                    'away_prob': 1 - home_prob,
                    'trends': {
                        'home': home_stats['trends'],
                        'away': away_stats['trends']
                    }
                }
            }
        
        return None

    def _analyze_totals(self,
                       game: pd.Series,
                       odds_data: pd.DataFrame,
                       home_stats: Dict,
                       away_stats: Dict,
                       pitcher_advantage: Dict) -> Optional[Dict]:
        """
        Analyze totals (over/under) betting opportunity.
        Uses recent scoring trends, pitcher performance, and ballpark factors.
        """
        # Filter odds for this game and totals market
        game_odds = odds_data[
            (odds_data['game_id'] == game['game_id']) & 
            (odds_data['market'] == 'totals')
        ]
        
        if game_odds.empty:
            return None
            
        # Calculate expected scoring rates
        home_scoring = home_stats['recent_form']['avg_runs_scored']
        home_allowing = home_stats['recent_form']['avg_runs_allowed']
        away_scoring = away_stats['recent_form']['avg_runs_scored']
        away_allowing = away_stats['recent_form']['avg_runs_allowed']
        
        # Adjust for trends
        trend_multipliers = {
            'improving': 1.1,
            'slightly_improving': 1.05,
            'stable': 1.0,
            'slightly_declining': 0.95,
            'declining': 0.9
        }
        
        home_trend = trend_multipliers[home_stats['trends']['scoring_trend']]
        away_trend = trend_multipliers[away_stats['trends']['scoring_trend']]
        
        # Calculate expected total runs
        home_expected = ((home_scoring + away_allowing) / 2) * home_trend
        away_expected = ((away_scoring + home_allowing) / 2) * away_trend
        total_expected = home_expected + away_expected
        
        # Get the total line and odds
        total_line = float(game_odds['total'].iloc[0]) if 'total' in game_odds else None
        over_odds = float(game_odds['over_odds'].iloc[0]) if 'over_odds' in game_odds else None
        under_odds = float(game_odds['under_odds'].iloc[0]) if 'under_odds' in game_odds else None
        
        if not all([total_line, over_odds, under_odds]):
            return None
            
        # Calculate probabilities using Poisson distribution
        over_prob = 1 - self.betting_analyzer.calculate_poisson_expectations(
            total_expected / 2,  # Split expected total between teams
            total_expected / 2
        )[str(int(total_line))]
        
        under_prob = 1 - over_prob
        
        # Check for value opportunities
        over_ev = self.betting_analyzer.calculate_kelly_bet(
            over_prob, over_odds, self.bankroll
        )
        under_ev = self.betting_analyzer.calculate_kelly_bet(
            under_prob, under_odds, self.bankroll
        )
        
        if max(over_ev, under_ev) > 0:
            bet_type = 'over' if over_ev > under_ev else 'under'
            prob = over_prob if over_ev > under_ev else under_prob
            odds = over_odds if over_ev > under_ev else under_odds
            
            if prob > self.confidence_threshold:
                return {
                    'game_id': game['game_id'],
                    'market': 'totals',
                    'bet_type': bet_type,
                    'line': total_line,
                    'odds': odds,
                    'confidence': prob,
                    'expected_value': max(over_ev, under_ev),
                    'recommended_bet': self._calculate_bet_size(max(over_ev, under_ev)),
                    'analysis': {
                        'expected_total': total_expected,
                        'home_expected': home_expected,
                        'away_expected': away_expected,
                        'scoring_trends': {
                            'home': home_stats['trends']['scoring_trend'],
                            'away': away_stats['trends']['scoring_trend']
                        }
                    }
                }
        
        return None

    def _analyze_runline(self,
                        game: pd.Series,
                        odds_data: pd.DataFrame,
                        home_stats: Dict,
                        away_stats: Dict,
                        pitcher_advantage: Dict) -> Optional[Dict]:
        """
        Analyze run line betting opportunity.
        Focuses on 1.5 run spreads and team's ability to win/lose by margin.
        """
        # Filter odds for this game and spreads market
        game_odds = odds_data[
            (odds_data['game_id'] == game['game_id']) & 
            (odds_data['market'] == 'spreads')
        ]
        
        if game_odds.empty:
            return None
            
        # Get margin of victory stats
        home_mov = self._calculate_margin_of_victory_stats(home_stats['overall_stats'])
        away_mov = self._calculate_margin_of_victory_stats(away_stats['overall_stats'])
        
        # Get the spread line and odds
        spread = float(game_odds['spread'].iloc[0]) if 'spread' in game_odds else 1.5  # Default MLB run line
        home_spread_odds = float(game_odds['home_spread_odds'].iloc[0]) if 'home_spread_odds' in game_odds else None
        away_spread_odds = float(game_odds['away_spread_odds'].iloc[0]) if 'away_spread_odds' in game_odds else None
        
        if not all([home_spread_odds, away_spread_odds]):
            return None
            
        # Calculate probabilities
        home_cover_prob = self._calculate_spread_probability(
            home_mov,
            away_mov,
            spread,
            home_stats['recent_form'],
            away_stats['recent_form'],
            is_home=True
        )
        
        away_cover_prob = 1 - home_cover_prob
        
        # Calculate expected value
        home_ev = self.betting_analyzer.calculate_kelly_bet(
            home_cover_prob, home_spread_odds, self.bankroll
        )
        away_ev = self.betting_analyzer.calculate_kelly_bet(
            away_cover_prob, away_spread_odds, self.bankroll
        )
        
        if max(home_ev, away_ev) > 0:
            bet_type = 'home' if home_ev > away_ev else 'away'
            prob = home_cover_prob if home_ev > away_ev else away_cover_prob
            odds = home_spread_odds if home_ev > away_ev else away_spread_odds
            
            if prob > self.confidence_threshold:
                return {
                    'game_id': game['game_id'],
                    'market': 'spread',
                    'bet_type': bet_type,
                    'line': spread,
                    'odds': odds,
                    'confidence': prob,
                    'expected_value': max(home_ev, away_ev),
                    'recommended_bet': self._calculate_bet_size(max(home_ev, away_ev)),
                    'analysis': {
                        'home_margin_stats': home_mov,
                        'away_margin_stats': away_mov,
                        'recent_form': {
                            'home': home_stats['recent_form'],
                            'away': away_stats['recent_form']
                        }
                    }
                }
        
        return None
        
    def _calculate_margin_of_victory_stats(self, stats: pd.DataFrame) -> Dict:
        """Calculate margin of victory statistics from team game logs."""
        if stats.empty:
            return {
                'avg_margin': 0,
                'cover_rate': 0.5,
                'blowout_rate': 0
            }
            
        margins = stats['runs_scored'] - stats['runs_allowed']
        
        return {
            'avg_margin': margins.mean(),
            'cover_rate': len(margins[margins > 1.5]) / len(margins),  # Standard run line
            'blowout_rate': len(margins[margins > 3]) / len(margins)  # Games decided by 3+ runs
        }
        
    def _calculate_spread_probability(self,
                                   home_mov: Dict,
                                   away_mov: Dict,
                                   spread: float,
                                   home_form: Dict,
                                   away_form: Dict,
                                   is_home: bool = True) -> float:
        """
        Calculate probability of covering the spread.
        
        Uses margin of victory stats, recent form, and historical cover rates.
        """
        # Base probability from cover rates
        base_prob = home_mov['cover_rate'] if is_home else (1 - away_mov['cover_rate'])
        
        # Adjust for recent form
        home_scoring_diff = home_form['avg_runs_scored'] - away_form['avg_runs_allowed']
        away_scoring_diff = away_form['avg_runs_scored'] - home_form['avg_runs_allowed']
        
        recent_form_advantage = home_scoring_diff - away_scoring_diff
        
        # Adjust probability based on recent form
        prob_adjustment = recent_form_advantage * 0.05  # 5% adjustment per run differential
        
        # Add home field advantage for standard run line
        if is_home and abs(spread - 1.5) < 0.1:
            prob_adjustment += 0.03  # 3% home field advantage
            
        return np.clip(base_prob + prob_adjustment, 0.1, 0.9)

    def _calculate_win_probability(self,
                                 home_stats: Dict,
                                 away_stats: Dict,
                                 pitcher_advantage: Dict,
                                 is_home: bool = True) -> float:
        """
        Calculate win probability using statistical models and trends.
        
        This is a simplified version - we'll need to expand this with more
        sophisticated modeling.
        """
        # Base probability from recent form
        home_form = home_stats['recent_form']['win_pct']
        away_form = away_stats['recent_form']['win_pct']
        
        # Adjust for home field advantage
        home_advantage = 0.054  # MLB historical home field advantage
        
        # Adjust for trends
        trend_adjustments = {
            'improving': 0.02,
            'slightly_improving': 0.01,
            'stable': 0,
            'slightly_declining': -0.01,
            'declining': -0.02
        }
        
        home_trend_adj = trend_adjustments[home_stats['trends']['scoring_trend']]
        away_trend_adj = trend_adjustments[away_stats['trends']['scoring_trend']]
        
        # Calculate final probability
        raw_prob = (home_form + home_advantage + home_trend_adj) - \
                  (away_form + away_trend_adj)
                  
        # Convert to probability space
        return np.clip(0.5 + raw_prob, 0.1, 0.9)

    def _calculate_bet_size(self, expected_value: float) -> float:
        """Calculate recommended bet size based on Kelly criterion and bankroll."""
        return round(min(expected_value, self.bankroll * 0.05), 2)  # Max 5% of bankroll

    def update_historical_predictions(self, prediction: Dict, result: Dict):
        """Update historical predictions for model refinement."""
        self.historical_predictions.append({
            'prediction': prediction,
            'result': result,
            'timestamp': datetime.now()
        })
