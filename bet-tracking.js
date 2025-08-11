/**
 * Bet Tracking and Performance Analysis System
 * Tracks user bets, outcomes, and feeds data back to improve the model
 */

class BetTrackingSystem {
    constructor() {
        this.storageKey = 'mlb_bet_tracking';
        this.modelFeedbackKey = 'mlb_model_feedback';
        
        this.betDatabase = this.loadBetHistory();
        this.modelFeedback = this.loadModelFeedback();
        
        this.betTypes = {
            MONEYLINE: 'moneyline',
            RUNLINE: 'runline', 
            TOTAL: 'total',
            PLAYER_PROP: 'player_prop',
            PARLAY: 'parlay'
        };
        
        this.betStatus = {
            PENDING: 'pending',
            WON: 'won',
            LOST: 'lost',
            PUSHED: 'pushed',
            CANCELLED: 'cancelled'
        };
        
        this.analytics = {
            performance: {},
            trends: {},
            modelAccuracy: {}
        };
    }

    /**
     * Add a new bet to the tracking system
     */
    addBet(betData) {
        console.log('💰 Adding bet to tracking system...');
        
        const bet = {
            id: this.generateBetId(),
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            gameId: betData.gameId,
            teams: {
                home: betData.homeTeam,
                away: betData.awayTeam
            },
            type: betData.type,
            selection: betData.selection,
            odds: betData.odds,
            stake: betData.stake || 0,
            potentialPayout: this.calculatePayout(betData.odds, betData.stake || 0),
            confidence: betData.confidence || 0,
            modelScore: betData.modelScore || 0,
            expertTrends: betData.expertTrends || {},
            hardRockOdds: betData.hardRockOdds || {},
            status: this.betStatus.PENDING,
            result: null,
            actualPayout: 0,
            notes: betData.notes || '',
            source: 'mlb_analytics_v2'
        };
        
        // Add specific bet type data
        switch (bet.type) {
            case this.betTypes.PLAYER_PROP:
                bet.playerData = {
                    player: betData.player,
                    stat: betData.stat,
                    line: betData.line,
                    over_under: betData.over_under
                };
                break;
                
            case this.betTypes.PARLAY:
                bet.parlayData = {
                    legs: betData.legs || [],
                    parlayType: betData.parlayType || 'multi_game'
                };
                break;
                
            case this.betTypes.TOTAL:
                bet.totalData = {
                    line: betData.line,
                    over_under: betData.over_under
                };
                break;
                
            case this.betTypes.RUNLINE:
                bet.runlineData = {
                    spread: betData.spread,
                    team: betData.team
                };
                break;
        }
        
        this.betDatabase.bets.push(bet);
        this.saveBetHistory();
        
        console.log(`✅ Bet ${bet.id} added successfully`);
        return bet;
    }

    /**
     * Update bet status and result
     */
    updateBetResult(betId, result, actualPayout = 0) {
        console.log(`🔄 Updating bet result for ${betId}...`);
        
        const bet = this.betDatabase.bets.find(b => b.id === betId);
        if (!bet) {
            console.error(`❌ Bet ${betId} not found`);
            return false;
        }
        
        bet.status = result;
        bet.actualPayout = actualPayout;
        bet.resultTimestamp = Date.now();
        
        // Calculate profit/loss
        bet.profit = actualPayout - bet.stake;
        bet.roi = bet.stake > 0 ? (bet.profit / bet.stake) * 100 : 0;
        
        this.saveBetHistory();
        
        // Feed result back to model
        this.feedbackToModel(bet);
        
        // Update analytics
        this.updateAnalytics();
        
        console.log(`✅ Bet ${betId} updated: ${result}`);
        return true;
    }

    /**
     * Feed bet results back to improve the model
     */
    feedbackToModel(bet) {
        console.log('🤖 Feeding bet result back to model...');
        
        const feedback = {
            betId: bet.id,
            gameId: bet.gameId,
            timestamp: bet.resultTimestamp,
            prediction: {
                type: bet.type,
                selection: bet.selection,
                confidence: bet.confidence,
                modelScore: bet.modelScore
            },
            actual: {
                result: bet.status,
                profit: bet.profit,
                roi: bet.roi
            },
            factors: {
                expertTrends: bet.expertTrends,
                hardRockOdds: bet.hardRockOdds,
                odds: bet.odds
            }
        };
        
        // Store feedback for model improvement
        if (!this.modelFeedback[bet.type]) {
            this.modelFeedback[bet.type] = [];
        }
        
        this.modelFeedback[bet.type].push(feedback);
        
        // Keep only last 1000 feedbacks per type
        if (this.modelFeedback[bet.type].length > 1000) {
            this.modelFeedback[bet.type] = this.modelFeedback[bet.type].slice(-1000);
        }
        
        this.saveModelFeedback();
    }

    /**
     * Get betting performance analytics
     */
    getPerformanceAnalytics() {
        const analytics = {
            overall: this.calculateOverallPerformance(),
            byBetType: this.calculatePerformanceByType(),
            byConfidence: this.calculatePerformanceByConfidence(),
            trends: this.calculateTrends(),
            modelAccuracy: this.calculateModelAccuracy(),
            recommendations: this.generateRecommendations()
        };
        
        return analytics;
    }

    /**
     * Calculate overall betting performance
     */
    calculateOverallPerformance() {
        const completedBets = this.betDatabase.bets.filter(bet => 
            bet.status !== this.betStatus.PENDING
        );
        
        if (completedBets.length === 0) {
            return {
                totalBets: 0,
                winRate: 0,
                totalStaked: 0,
                totalPayout: 0,
                netProfit: 0,
                roi: 0
            };
        }
        
        const wins = completedBets.filter(bet => bet.status === this.betStatus.WON);
        const totalStaked = completedBets.reduce((sum, bet) => sum + bet.stake, 0);
        const totalPayout = completedBets.reduce((sum, bet) => sum + bet.actualPayout, 0);
        const netProfit = totalPayout - totalStaked;
        
        return {
            totalBets: completedBets.length,
            wins: wins.length,
            losses: completedBets.filter(bet => bet.status === this.betStatus.LOST).length,
            pushes: completedBets.filter(bet => bet.status === this.betStatus.PUSHED).length,
            winRate: (wins.length / completedBets.length) * 100,
            totalStaked: totalStaked,
            totalPayout: totalPayout,
            netProfit: netProfit,
            roi: totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0,
            averageOdds: this.calculateAverageOdds(completedBets),
            longestWinStreak: this.calculateLongestStreak(completedBets, this.betStatus.WON),
            longestLoseStreak: this.calculateLongestStreak(completedBets, this.betStatus.LOST)
        };
    }

    /**
     * Calculate performance by bet type
     */
    calculatePerformanceByType() {
        const byType = {};
        
        Object.values(this.betTypes).forEach(type => {
            const typeBets = this.betDatabase.bets.filter(bet => 
                bet.type === type && bet.status !== this.betStatus.PENDING
            );
            
            if (typeBets.length > 0) {
                const wins = typeBets.filter(bet => bet.status === this.betStatus.WON);
                const totalStaked = typeBets.reduce((sum, bet) => sum + bet.stake, 0);
                const totalPayout = typeBets.reduce((sum, bet) => sum + bet.actualPayout, 0);
                
                byType[type] = {
                    totalBets: typeBets.length,
                    wins: wins.length,
                    winRate: (wins.length / typeBets.length) * 100,
                    totalStaked: totalStaked,
                    netProfit: totalPayout - totalStaked,
                    roi: totalStaked > 0 ? ((totalPayout - totalStaked) / totalStaked) * 100 : 0,
                    averageConfidence: this.calculateAverageConfidence(typeBets)
                };
            }
        });
        
        return byType;
    }

    /**
     * Calculate performance by confidence level
     */
    calculatePerformanceByConfidence() {
        const confidenceBands = {
            'very_high': { min: 8.5, max: 10.0, bets: [] },
            'high': { min: 7.0, max: 8.4, bets: [] },
            'medium': { min: 5.5, max: 6.9, bets: [] },
            'low': { min: 0, max: 5.4, bets: [] }
        };
        
        const completedBets = this.betDatabase.bets.filter(bet => 
            bet.status !== this.betStatus.PENDING
        );
        
        // Group bets by confidence band
        completedBets.forEach(bet => {
            const confidence = bet.confidence || bet.modelScore || 0;
            
            for (const [band, range] of Object.entries(confidenceBands)) {
                if (confidence >= range.min && confidence <= range.max) {
                    range.bets.push(bet);
                    break;
                }
            }
        });
        
        // Calculate performance for each band
        const performance = {};
        Object.entries(confidenceBands).forEach(([band, data]) => {
            if (data.bets.length > 0) {
                const wins = data.bets.filter(bet => bet.status === this.betStatus.WON);
                const totalStaked = data.bets.reduce((sum, bet) => sum + bet.stake, 0);
                const totalPayout = data.bets.reduce((sum, bet) => sum + bet.actualPayout, 0);
                
                performance[band] = {
                    totalBets: data.bets.length,
                    wins: wins.length,
                    winRate: (wins.length / data.bets.length) * 100,
                    roi: totalStaked > 0 ? ((totalPayout - totalStaked) / totalStaked) * 100 : 0,
                    confidenceRange: `${data.min}-${data.max}`
                };
            }
        });
        
        return performance;
    }

    /**
     * Calculate model accuracy for improvement
     */
    calculateModelAccuracy() {
        const accuracy = {
            overall: 0,
            byConfidence: {},
            calibration: {},
            suggestions: []
        };
        
        const completedBets = this.betDatabase.bets.filter(bet => 
            bet.status !== this.betStatus.PENDING && bet.confidence > 0
        );
        
        if (completedBets.length === 0) return accuracy;
        
        // Overall accuracy
        const correctPredictions = completedBets.filter(bet => {
            // Consider a prediction correct if the bet won or pushed
            return bet.status === this.betStatus.WON || bet.status === this.betStatus.PUSHED;
        });
        
        accuracy.overall = (correctPredictions.length / completedBets.length) * 100;
        
        // Calibration analysis
        const confidenceBuckets = {};
        completedBets.forEach(bet => {
            const bucket = Math.floor(bet.confidence);
            if (!confidenceBuckets[bucket]) {
                confidenceBuckets[bucket] = { total: 0, correct: 0 };
            }
            confidenceBuckets[bucket].total++;
            if (bet.status === this.betStatus.WON) {
                confidenceBuckets[bucket].correct++;
            }
        });
        
        // Calculate calibration scores
        Object.entries(confidenceBuckets).forEach(([bucket, data]) => {
            const expectedWinRate = parseInt(bucket) * 10; // Convert 8 -> 80%
            const actualWinRate = (data.correct / data.total) * 100;
            
            accuracy.calibration[bucket] = {
                expected: expectedWinRate,
                actual: actualWinRate,
                difference: Math.abs(expectedWinRate - actualWinRate),
                sampleSize: data.total
            };
        });
        
        return accuracy;
    }

    /**
     * Generate recommendations based on performance
     */
    generateRecommendations() {
        const recommendations = [];
        const performance = this.calculateOverallPerformance();
        const byType = this.calculatePerformanceByType();
        const byConfidence = this.calculatePerformanceByConfidence();
        
        // Overall performance recommendations
        if (performance.winRate < 50) {
            recommendations.push({
                type: 'STRATEGY',
                priority: 'high',
                message: 'Consider being more selective with bets - current win rate is below 50%',
                suggestion: 'Focus on higher confidence picks (8.0+ rating)'
            });
        }
        
        if (performance.roi < 0) {
            recommendations.push({
                type: 'BANKROLL',
                priority: 'high',
                message: 'Negative ROI detected - review stake sizing and bet selection',
                suggestion: 'Consider reducing stake size or increasing minimum confidence threshold'
            });
        }
        
        // Bet type recommendations
        Object.entries(byType).forEach(([type, data]) => {
            if (data.roi > 15) {
                recommendations.push({
                    type: 'OPPORTUNITY',
                    priority: 'medium',
                    message: `${type} bets showing strong ROI (${data.roi.toFixed(1)}%)`,
                    suggestion: `Consider increasing focus on ${type} bets`
                });
            } else if (data.roi < -20) {
                recommendations.push({
                    type: 'WARNING',
                    priority: 'high',
                    message: `${type} bets showing poor ROI (${data.roi.toFixed(1)}%)`,
                    suggestion: `Consider avoiding or reducing ${type} bets`
                });
            }
        });
        
        return recommendations;
    }

    /**
     * Get bets for a specific date
     */
    getBetsForDate(date) {
        return this.betDatabase.bets.filter(bet => bet.date === date);
    }

    /**
     * Get recent bets (last N days)
     */
    getRecentBets(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return this.betDatabase.bets.filter(bet => bet.timestamp >= cutoff);
    }

    /**
     * Utility functions
     */
    generateBetId() {
        return `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculatePayout(odds, stake) {
        if (odds > 0) {
            return stake + (stake * (odds / 100));
        } else {
            return stake + (stake * (100 / Math.abs(odds)));
        }
    }

    calculateAverageOdds(bets) {
        if (bets.length === 0) return 0;
        const totalOdds = bets.reduce((sum, bet) => sum + Math.abs(bet.odds), 0);
        return totalOdds / bets.length;
    }

    calculateAverageConfidence(bets) {
        if (bets.length === 0) return 0;
        const totalConfidence = bets.reduce((sum, bet) => sum + (bet.confidence || 0), 0);
        return totalConfidence / bets.length;
    }

    calculateLongestStreak(bets, status) {
        let longestStreak = 0;
        let currentStreak = 0;
        
        bets.forEach(bet => {
            if (bet.status === status) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        
        return longestStreak;
    }

    calculateTrends() {
        const recent = this.getRecentBets(30); // Last 30 days
        const older = this.betDatabase.bets.filter(bet => 
            bet.timestamp < (Date.now() - (30 * 24 * 60 * 60 * 1000)) &&
            bet.status !== this.betStatus.PENDING
        );
        
        if (recent.length === 0 || older.length === 0) {
            return { trend: 'insufficient_data' };
        }
        
        const recentWinRate = (recent.filter(bet => bet.status === this.betStatus.WON).length / recent.length) * 100;
        const olderWinRate = (older.filter(bet => bet.status === this.betStatus.WON).length / older.length) * 100;
        
        return {
            recentWinRate: recentWinRate,
            olderWinRate: olderWinRate,
            trend: recentWinRate > olderWinRate ? 'improving' : 'declining',
            difference: recentWinRate - olderWinRate
        };
    }

    /**
     * Storage functions
     */
    loadBetHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { bets: [] };
        } catch (error) {
            console.error('Error loading bet history:', error);
            return { bets: [] };
        }
    }

    saveBetHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.betDatabase));
        } catch (error) {
            console.error('Error saving bet history:', error);
        }
    }

    loadModelFeedback() {
        try {
            const stored = localStorage.getItem(this.modelFeedbackKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading model feedback:', error);
            return {};
        }
    }

    saveModelFeedback() {
        try {
            localStorage.setItem(this.modelFeedbackKey, JSON.stringify(this.modelFeedback));
        } catch (error) {
            console.error('Error saving model feedback:', error);
        }
    }

    /**
     * Export data for analysis
     */
    exportBetHistory() {
        return {
            bets: this.betDatabase.bets,
            analytics: this.getPerformanceAnalytics(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Clear all bet history (use with caution)
     */
    clearHistory() {
        this.betDatabase = { bets: [] };
        this.modelFeedback = {};
        this.saveBetHistory();
        this.saveModelFeedback();
        console.log('🗑️ Bet history cleared');
    }
}
