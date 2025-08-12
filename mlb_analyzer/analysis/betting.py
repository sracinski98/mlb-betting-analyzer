"""
Advanced betting strategies and analytics module.
Integrates concepts from AlphaPy and sports-betting frameworks.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import poisson
from datetime import datetime

class BettingAnalyzer:
    def __init__(self, min_edge: float = 0.05, kelly_fraction: float = 0.25):
        """
        Initialize the betting analyzer.
        
        Args:
            min_edge (float): Minimum edge required for bet recommendation (default: 5%)
            kelly_fraction (float): Fraction of Kelly criterion to use (default: 0.25)
        """
        self.min_edge = min_edge
        self.kelly_fraction = kelly_fraction

    def calculate_implied_probability(self, odds: float) -> float:
        """Convert decimal odds to implied probability."""
        return 1 / odds if odds > 0 else 0

    def detect_arbitrage(self, home_odds: List[float], away_odds: List[float]) -> Optional[Tuple[float, Dict]]:
        """
        Detect arbitrage opportunities across different bookmakers.
        
        Args:
            home_odds: List of home team odds from different bookmakers
            away_odds: List of away team odds from different bookmakers
            
        Returns:
            Tuple of (profit_percentage, bet_allocation) if arbitrage exists, None otherwise
        """
        best_home = max(home_odds) if home_odds else 0
        best_away = max(away_odds) if away_odds else 0
        
        if not best_home or not best_away:
            return None
            
        prob_home = self.calculate_implied_probability(best_home)
        prob_away = self.calculate_implied_probability(best_away)
        
        # Check if arbitrage exists
        if prob_home + prob_away < 1:
            total_stake = 1000  # Example stake
            home_stake = total_stake * prob_home
            away_stake = total_stake * prob_away
            
            profit = (home_stake * best_home / total_stake) - 1
            
            return (profit, {
                'home_stake': home_stake,
                'away_stake': away_stake,
                'expected_profit': profit * total_stake
            })
            
        return None

    def calculate_kelly_bet(self, true_prob: float, offered_odds: float, bankroll: float) -> float:
        """
        Calculate optimal bet size using the Kelly Criterion.
        
        Args:
            true_prob: Estimated true probability of winning
            offered_odds: Decimal odds offered by bookmaker
            bankroll: Current bankroll
            
        Returns:
            Recommended bet size
        """
        # Convert odds to probability
        implied_prob = self.calculate_implied_probability(offered_odds)
        
        # Calculate edge
        edge = (true_prob * offered_odds) - 1
        
        if edge <= 0:
            return 0
            
        # Kelly formula: f = (bp - q)/b where:
        # b = odds - 1
        # p = probability of winning
        # q = probability of losing
        b = offered_odds - 1
        f = (b * true_prob - (1 - true_prob)) / b
        
        # Apply fractional Kelly
        bet_size = f * self.kelly_fraction * bankroll
        
        return max(0, bet_size)

    def calculate_poisson_expectations(self, 
                                    team_scoring_rate: float, 
                                    opponent_defense_rate: float) -> Dict[str, float]:
        """
        Calculate expected scoring probabilities using Poisson distribution.
        
        Args:
            team_scoring_rate: Average goals/runs scored per game
            opponent_defense_rate: Average goals/runs conceded per game
            
        Returns:
            Dictionary with probabilities for different scoring outcomes
        """
        # Adjust rates based on both offense and defense
        expected_rate = (team_scoring_rate * opponent_defense_rate) ** 0.5
        
        # Calculate probabilities for 0-7 runs
        probs = {
            str(i): float(poisson.pmf(i, expected_rate))
            for i in range(8)
        }
        
        # Add 8+ runs as cumulative probability
        probs['8+'] = float(1 - sum(probs.values()))
        
        return probs

    def find_value_bets(self, 
                       true_probs: Dict[str, float], 
                       offered_odds: Dict[str, float]) -> List[Dict]:
        """
        Identify value betting opportunities.
        
        Args:
            true_probs: Dictionary of estimated true probabilities
            offered_odds: Dictionary of offered odds
            
        Returns:
            List of value betting opportunities
        """
        value_bets = []
        
        for outcome, prob in true_probs.items():
            if outcome in offered_odds:
                implied_prob = self.calculate_implied_probability(offered_odds[outcome])
                edge = (prob * offered_odds[outcome]) - 1
                
                if edge > self.min_edge:
                    value_bets.append({
                        'outcome': outcome,
                        'true_probability': prob,
                        'offered_odds': offered_odds[outcome],
                        'edge': edge,
                        'implied_probability': implied_prob
                    })
        
        return sorted(value_bets, key=lambda x: x['edge'], reverse=True)
