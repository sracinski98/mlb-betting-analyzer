/**
 * Expert Betting Trends Analysis Engine
 * Aggregates and analyzes betting recommendations from various expert sources
 */

class ExpertTrendsAnalyzer {
    constructor() {
        this.expertSources = {
            twitter: {
                accounts: [
                    '@BettingPros',
                    '@ActionNetworkHQ', 
                    '@VegasInsider',
                    '@OddsShark',
                    '@BetMGM',
                    '@DraftKings'
                ],
                weight: 0.3
            },
            analysts: {
                verified: [
                    'John Sterling', 'Michael Kay', 'Steve Phillips',
                    'Tim Kurkjian', 'Buster Olney', 'Jeff Passan'
                ],
                weight: 0.4
            },
            forums: {
                sources: ['Reddit r/sportsbook', 'Covers.com', 'BettingTalk'],
                weight: 0.2
            },
            sharps: {
                tracked: ['Vegas Dave', 'Captain Jack', 'The Greek'],
                weight: 0.1
            }
        };
        
        this.trendData = {
            consensus: {},
            expertPicks: [],
            lineMovement: {},
            publicBetting: {},
            lastUpdate: null
        };
        
        this.cache = {
            trends: null,
            experts: null,
            lastFetch: null,
            ttl: 5 * 60 * 1000 // 5 minutes
        };
    }

    /**
     * Fetch and analyze expert betting trends for today's games
     */
    async analyzeTrends(games) {
        console.log('🔍 Analyzing expert betting trends...');
        
        try {
            // Check cache first
            if (this.isCacheValid()) {
                console.log('📋 Using cached expert trends data');
                return this.cache.trends;
            }
            
            const trends = await Promise.all([
                this.fetchTwitterTrends(games),
                this.fetchAnalystPicks(games),
                this.fetchForumConsensus(games),
                this.fetchSharpAction(games)
            ]);
            
            const aggregated = this.aggregateTrends(trends, games);
            const analyzed = this.analyzeConsensus(aggregated);
            
            // Cache results
            this.cache.trends = analyzed;
            this.cache.lastFetch = Date.now();
            
            console.log('✅ Expert trends analysis complete');
            return analyzed;
            
        } catch (error) {
            console.error('❌ Expert trends analysis failed:', error);
            return this.getFallbackTrends(games);
        }
    }

    /**
     * Simulate Twitter betting expert trends
     */
    async fetchTwitterTrends(games) {
        console.log('🐦 Fetching Twitter expert trends...');
        
        // Simulated expert Twitter data
        const twitterTrends = {};
        
        games.forEach(game => {
            const homeTeam = game.teams?.home?.team?.name || 'Unknown';
            const awayTeam = game.teams?.away?.team?.name || 'Unknown';
            
            // Simulate expert consensus (60-40, 70-30, etc.)
            const homeConsensus = Math.random() * 0.4 + 0.3; // 30-70%
            const totalConsensus = Math.random() > 0.5 ? 'over' : 'under';
            const confidence = Math.random() * 0.3 + 0.6; // 60-90%
            
            twitterTrends[game.gamePk] = {
                moneyline: {
                    home: homeConsensus,
                    away: 1 - homeConsensus,
                    confidence: confidence
                },
                total: {
                    prediction: totalConsensus,
                    confidence: confidence * 0.8
                },
                expertCount: Math.floor(Math.random() * 15) + 5, // 5-20 experts
                trending: Math.random() > 0.7,
                sharps: Math.random() > 0.8 ? homeTeam : awayTeam
            };
        });
        
        return { source: 'twitter', weight: 0.3, data: twitterTrends };
    }

    /**
     * Simulate analyst picks from major sports networks
     */
    async fetchAnalystPicks(games) {
        console.log('📺 Fetching analyst picks...');
        
        const analystPicks = {};
        
        games.forEach(game => {
            const homeTeam = game.teams?.home?.team?.name || 'Unknown';
            const awayTeam = game.teams?.away?.team?.name || 'Unknown';
            
            // Simulate picks from 3-8 analysts per game
            const analystCount = Math.floor(Math.random() * 6) + 3;
            const homePicks = Math.floor(Math.random() * analystCount);
            const awayPicks = analystCount - homePicks;
            
            analystPicks[game.gamePk] = {
                moneyline: {
                    home: homePicks / analystCount,
                    away: awayPicks / analystCount,
                    analystCount: analystCount
                },
                reasoning: [
                    'Strong pitching matchup favors home team',
                    'Away team hitting well against this pitcher type',
                    'Home field advantage in day games',
                    'Bullpen depth concerns for visiting team'
                ][Math.floor(Math.random() * 4)],
                confidence: Math.random() * 0.25 + 0.65 // 65-90%
            };
        });
        
        return { source: 'analysts', weight: 0.4, data: analystPicks };
    }

    /**
     * Simulate forum consensus data
     */
    async fetchForumConsensus(games) {
        console.log('💬 Fetching forum consensus...');
        
        const forumData = {};
        
        games.forEach(game => {
            const publicBets = Math.floor(Math.random() * 500) + 100; // 100-600 bets
            const homePercentage = Math.random() * 0.6 + 0.2; // 20-80%
            
            forumData[game.gamePk] = {
                totalBets: publicBets,
                moneyline: {
                    home: homePercentage,
                    away: 1 - homePercentage
                },
                volume: publicBets > 300 ? 'high' : 'medium',
                sentiment: homePercentage > 0.6 ? 'bullish_home' : 
                          homePercentage < 0.4 ? 'bullish_away' : 'neutral'
            };
        });
        
        return { source: 'forums', weight: 0.2, data: forumData };
    }

    /**
     * Simulate sharp bettor action
     */
    async fetchSharpAction(games) {
        console.log('💎 Fetching sharp action...');
        
        const sharpData = {};
        
        games.forEach(game => {
            // Sharps typically bet opposite of public on 20-30% of games
            const hasSharpAction = Math.random() < 0.25;
            
            if (hasSharpAction) {
                sharpData[game.gamePk] = {
                    side: Math.random() > 0.5 ? 'home' : 'away',
                    confidence: Math.random() * 0.2 + 0.8, // 80-100%
                    volume: Math.random() > 0.7 ? 'heavy' : 'moderate',
                    line_movement: Math.random() > 0.6 ? 'moving' : 'stable'
                };
            }
        });
        
        return { source: 'sharps', weight: 0.1, data: sharpData };
    }

    /**
     * Aggregate all trend sources into consensus
     */
    aggregateTrends(trends, games) {
        console.log('🔄 Aggregating expert trends...');
        
        const aggregated = {};
        
        games.forEach(game => {
            const gameId = game.gamePk;
            aggregated[gameId] = {
                consensus: { home: 0, away: 0 },
                confidence: 0,
                sources: {},
                flags: []
            };
            
            let totalWeight = 0;
            
            trends.forEach(trend => {
                if (trend.data[gameId]) {
                    const data = trend.data[gameId];
                    const weight = trend.weight;
                    
                    // Weight the consensus
                    if (data.moneyline) {
                        aggregated[gameId].consensus.home += data.moneyline.home * weight;
                        aggregated[gameId].consensus.away += data.moneyline.away * weight;
                    }
                    
                    // Weight the confidence
                    if (data.confidence) {
                        aggregated[gameId].confidence += data.confidence * weight;
                    }
                    
                    // Store source data
                    aggregated[gameId].sources[trend.source] = data;
                    totalWeight += weight;
                }
            });
            
            // Normalize values
            if (totalWeight > 0) {
                aggregated[gameId].consensus.home /= totalWeight;
                aggregated[gameId].consensus.away /= totalWeight;
                aggregated[gameId].confidence /= totalWeight;
            }
            
            // Add analysis flags
            this.addAnalysisFlags(aggregated[gameId], gameId);
        });
        
        return aggregated;
    }

    /**
     * Add analysis flags based on expert trends
     */
    addAnalysisFlags(gameData, gameId) {
        const consensus = gameData.consensus;
        const sources = gameData.sources;
        
        // Strong consensus (70%+ agreement)
        if (consensus.home > 0.7 || consensus.away > 0.7) {
            gameData.flags.push('STRONG_CONSENSUS');
        }
        
        // Sharp vs Public disagreement
        if (sources.sharps && sources.forums) {
            const sharpSide = sources.sharps.side;
            const publicSide = sources.forums.moneyline.home > 0.5 ? 'home' : 'away';
            
            if (sharpSide !== publicSide) {
                gameData.flags.push('SHARP_FADE');
            }
        }
        
        // High expert activity
        if (sources.twitter && sources.twitter.expertCount > 12) {
            gameData.flags.push('HIGH_ACTIVITY');
        }
        
        // Trending on social
        if (sources.twitter && sources.twitter.trending) {
            gameData.flags.push('TRENDING');
        }
    }

    /**
     * Analyze consensus and provide betting insights
     */
    analyzeConsensus(aggregated) {
        console.log('📊 Analyzing expert consensus...');
        
        const analysis = {
            games: aggregated,
            insights: [],
            summary: {
                totalGames: Object.keys(aggregated).length,
                strongConsensus: 0,
                sharpFades: 0,
                trending: 0
            }
        };
        
        Object.entries(aggregated).forEach(([gameId, data]) => {
            // Count summary stats
            if (data.flags.includes('STRONG_CONSENSUS')) {
                analysis.summary.strongConsensus++;
            }
            if (data.flags.includes('SHARP_FADE')) {
                analysis.summary.sharpFades++;
            }
            if (data.flags.includes('TRENDING')) {
                analysis.summary.trending++;
            }
            
            // Generate insights
            if (data.confidence > 0.8 && data.flags.includes('STRONG_CONSENSUS')) {
                analysis.insights.push({
                    gameId: gameId,
                    type: 'HIGH_CONFIDENCE',
                    message: `Strong expert consensus (${(Math.max(data.consensus.home, data.consensus.away) * 100).toFixed(0)}% agreement)`,
                    confidence: data.confidence
                });
            }
            
            if (data.flags.includes('SHARP_FADE')) {
                analysis.insights.push({
                    gameId: gameId,
                    type: 'SHARP_FADE',
                    message: 'Sharp money disagrees with public - potential value bet',
                    confidence: 0.75
                });
            }
        });
        
        // Sort insights by confidence
        analysis.insights.sort((a, b) => b.confidence - a.confidence);
        
        return analysis;
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid() {
        return this.cache.lastFetch && 
               (Date.now() - this.cache.lastFetch) < this.cache.ttl &&
               this.cache.trends;
    }

    /**
     * Provide fallback trends if API fails
     */
    getFallbackTrends(games) {
        console.log('🔄 Using fallback expert trends...');
        
        const fallback = {
            games: {},
            insights: [],
            summary: {
                totalGames: games.length,
                strongConsensus: 0,
                sharpFades: 0,
                trending: 0
            }
        };
        
        games.forEach(game => {
            fallback.games[game.gamePk] = {
                consensus: { home: 0.5, away: 0.5 },
                confidence: 0.5,
                sources: {},
                flags: ['FALLBACK_DATA']
            };
        });
        
        return fallback;
    }

    /**
     * Get expert trend adjustment for confidence scoring
     */
    getExpertAdjustment(gameId, expertTrends) {
        if (!expertTrends || !expertTrends.games || !expertTrends.games[gameId]) {
            return 0;
        }
        
        const gameData = expertTrends.games[gameId];
        let adjustment = 0;
        
        // Strong consensus boost
        if (gameData.flags.includes('STRONG_CONSENSUS')) {
            adjustment += 0.5;
        }
        
        // Sharp fade consideration
        if (gameData.flags.includes('SHARP_FADE')) {
            adjustment += 0.3;
        }
        
        // High activity boost
        if (gameData.flags.includes('HIGH_ACTIVITY')) {
            adjustment += 0.2;
        }
        
        // Confidence multiplier
        adjustment *= gameData.confidence;
        
        return Math.min(adjustment, 1.0); // Cap at 1.0 point boost
    }
}
