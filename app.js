/**
 * MLB Betting Analytics - Main Application Controller
 * Handles UI interactions, data display, and user experience
 */

class MLBAnalyticsApp {
    constructor() {
        this.engine = new MLBAnalyticsEngine();
        this.currentData = null;
        this.charts = {};
        this.currentTab = 'overview';
        this.isAnalyzing = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showWelcomeState();
    }

    setupEventListeners() {
        // Main control buttons - with null checks
        const analyzeBtn = document.getElementById('analyzeBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const retryBtn = document.getElementById('retryBtn');
        
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.runAnalysis());
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshData());
        if (retryBtn) retryBtn.addEventListener('click', () => this.runAnalysis());
        
        // Filter controls - with null checks
        const confidenceFilter = document.getElementById('confidenceFilter');
        const betTypeFilter = document.getElementById('betTypeFilter');
        
        if (confidenceFilter) {
            confidenceFilter.addEventListener('change', (e) => {
                this.engine.currentFilters.confidence = e.target.value;
                this.updateDisplays();
            });
        }
        
        if (betTypeFilter) {
            betTypeFilter.addEventListener('change', (e) => {
                this.engine.currentFilters.betType = e.target.value;
                this.updateDisplays();
            });
        }
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Sub-filters
        this.setupSubFilters();
        
        // Export functionality - with null check
        const exportFab = document.getElementById('exportFab');
        if (exportFab) {
            exportFab.addEventListener('click', () => {
                if (this.currentData) {
                    this.engine.exportResults();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.runAnalysis();
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.currentData) this.engine.exportResults();
                        break;
                }
            }
        });
    }

    setupSubFilters() {
        // Team bet filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.currentTarget.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateTeamBetsDisplay(e.currentTarget.dataset.filter);
            });
        });
        
        // Player prop category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.currentTarget.parentElement.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updatePlayerPropsDisplay(e.currentTarget.dataset.category);
            });
        });
        
        // Parlay type filters
        document.querySelectorAll('.parlay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.currentTarget.parentElement.querySelectorAll('.parlay-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateParlaysDisplay(e.currentTarget.dataset.type);
            });
        });
    }

    async runAnalysis() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.showLoadingState();
        
        try {
            this.currentData = await this.engine.runComprehensiveAnalysis();
            this.showMainContent();
            this.updateAllDisplays();
            this.updateHeaderStats();
            this.showSuccessMessage('Analysis completed successfully!');
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showErrorState(error.message);
        } finally {
            this.isAnalyzing = false;
        }
    }

    async refreshData() {
        // Clear cache and re-run analysis
        this.engine.cache = { games: null, odds: null, weather: null, lastUpdate: null };
        await this.runAnalysis();
    }

    showWelcomeState() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Show welcome message
        document.getElementById('topPicks').innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3>Welcome to MLB Betting Analytics</h3>
                    <p>Advanced AI-powered analysis for today's MLB games</p>
                    <div class="welcome-features">
                        <div class="feature">
                            <i class="fas fa-brain"></i>
                            <span>8+ Advanced Models</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-cloud-rain"></i>
                            <span>Weather Analysis</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-baseball-ball"></i>
                            <span>Pitcher Modeling</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-fire"></i>
                            <span>Real-time Data</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.runAnalysis()">
                        <i class="fas fa-play"></i>
                        Start Analysis
                    </button>
                </div>
            </div>
        `;
    }

    showLoadingState() {
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('loadingState').style.display = 'flex';
    }

    showMainContent() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }

    showErrorState(message) {
        const mainContent = document.getElementById('mainContent');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        
        if (mainContent) mainContent.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'flex';
        if (errorMessage) errorMessage.textContent = message;
    }

    updateHeaderStats() {
        if (!this.currentData) return;
        
        // Safely update header stats with null checks
        const totalOpportunities = document.getElementById('totalOpportunities');
        const highConfidence = document.getElementById('highConfidence');
        const gamesAnalyzed = document.getElementById('gamesAnalyzed');
        
        if (totalOpportunities) totalOpportunities.textContent = this.currentData.totalOpportunities || 0;
        if (highConfidence) highConfidence.textContent = this.currentData.highConfidence || 0;
        if (gamesAnalyzed) gamesAnalyzed.textContent = this.currentData.games?.length || 0;
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        this.currentTab = tabId;
        
        // Update specific tab content
        if (this.currentData) {
            switch (tabId) {
                case 'overview':
                    this.updateOverviewTab();
                    break;
                case 'teams':
                    this.updateTeamBetsDisplay('all');
                    break;
                case 'props':
                    this.updatePlayerPropsDisplay('all');
                    break;
                case 'parlays':
                    this.updateParlaysDisplay('all');
                    break;
                case 'advanced':
                    this.updateAdvancedTab();
                    break;
            }
        }
    }

    updateAllDisplays() {
        if (!this.currentData) return;
        
        this.updateOverviewTab();
        this.updateTeamBetsDisplay('all');
        this.updatePlayerPropsDisplay('all');
        this.updateParlaysDisplay('all');
        this.updateAdvancedTab();
    }

    updateDisplays() {
        // Update current tab with filtered data
        if (this.currentData) {
            switch (this.currentTab) {
                case 'overview':
                    this.updateOverviewTab();
                    break;
                case 'teams':
                    this.updateTeamBetsDisplay('all');
                    break;
                case 'props':
                    this.updatePlayerPropsDisplay('all');
                    break;
            }
        }
    }

    updateOverviewTab() {
        const filteredRecs = this.engine.applyFilters();
        
        // Update top picks
        this.updateTopPicks(filteredRecs.slice(0, 6));
        
        // Update line alerts (mock for now)
        this.updateLineAlerts();
        
        // Update charts
        this.updateCharts(filteredRecs);
    }

    updateTopPicks(topPicks) {
        const container = document.getElementById('topPicks');
        
        if (topPicks.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No picks match current filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = topPicks.map(pick => {
            const game = this.currentData.games.find(g => g.gameId === pick.gameId);
            const confidenceClass = `confidence-${pick.confidence}`;
            
            // Enhanced confidence emoji mapping for 10-point scale
            const getConfidenceEmoji = (confidence) => {
                switch(confidence) {
                    case 'elite': return '👑';
                    case 'very-high': return '🔥';
                    case 'high': return '⚡';
                    case 'medium-high': return '💪';
                    case 'medium': return '💡';
                    case 'medium-low': return '⚠️';
                    case 'low': return '📊';
                    case 'very-low': return '❓';
                    default: return '💡';
                }
            };
            const confidenceEmoji = getConfidenceEmoji(pick.confidence);
            
            return `
                <div class="pick-card fade-in">
                    <div class="pick-header">
                        <div>
                            <span class="confidence-badge ${confidenceClass}">
                                ${confidenceEmoji} ${pick.confidenceLabel || pick.confidence.toUpperCase()}
                            </span>
                            <div class="pick-score" title="Analysis Score">
                                Score: ${pick.score}/10.0
                            </div>
                        </div>
                    </div>
                    <div class="pick-content">
                        <h4>${this.formatBetType(pick.betType)}</h4>
                        ${pick.player ? `<div class="player-name">${pick.player}</div>` : ''}
                        ${pick.propLine ? `<div class="prop-line">${pick.propLine}</div>` : ''}
                        <div class="game-info">
                            <i class="fas fa-map-marker-alt"></i>
                            ${game ? `${game.awayTeam} @ ${game.homeTeam}` : 'Game TBD'}
                        </div>
                        <div class="venue-info">
                            <i class="fas fa-building"></i>
                            ${game ? game.venue : 'Venue TBD'}
                        </div>
                        <div class="pick-reason">
                            ${Array.isArray(pick.reasons) ? pick.reasons[0] : pick.reason}
                        </div>
                        ${pick.numFactors > 1 ? `
                            <div class="factors-count">
                                <i class="fas fa-layer-group"></i>
                                ${pick.numFactors} supporting factors
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateLineAlerts() {
        const container = document.getElementById('lineAlerts');
        
        // Mock line alerts for demonstration
        const mockAlerts = [
            {
                game: 'Yankees @ Red Sox',
                message: 'ML moved from -150 to -135 (Yankees)'
            },
            {
                game: 'Dodgers @ Giants',
                message: 'Total moved from 8.5 to 9.0'
            }
        ];
        
        if (mockAlerts.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">No line movement alerts</p>';
            return;
        }
        
        container.innerHTML = mockAlerts.map(alert => `
            <div class="alert fade-in">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>${alert.game}</strong>
                    <div>${alert.message}</div>
                </div>
            </div>
        `).join('');
    }

    updateCharts(recommendations) {
        this.updateConfidenceChart(recommendations);
        this.updateBetTypeChart(recommendations);
    }

    updateConfidenceChart(recommendations) {
        const ctx = document.getElementById('confidenceChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.confidence) {
            this.charts.confidence.destroy();
        }
        
        const confidenceCounts = {
            high: recommendations.filter(r => r.confidence === 'high').length,
            medium: recommendations.filter(r => r.confidence === 'medium').length,
            low: recommendations.filter(r => r.confidence === 'low').length
        };
        
        this.charts.confidence = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Confidence', 'Medium Confidence', 'Low Confidence'],
                datasets: [{
                    data: [confidenceCounts.high, confidenceCounts.medium, confidenceCounts.low],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Confidence Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateBetTypeChart(recommendations) {
        const ctx = document.getElementById('betTypeChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.betType) {
            this.charts.betType.destroy();
        }
        
        const betTypes = {};
        recommendations.forEach(rec => {
            const type = this.categorizeBetType(rec.betType);
            betTypes[type] = (betTypes[type] || 0) + 1;
        });
        
        this.charts.betType = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(betTypes),
                datasets: [{
                    label: 'Number of Opportunities',
                    data: Object.values(betTypes),
                    backgroundColor: '#2563eb',
                    borderColor: '#1d4ed8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Bet Type Distribution'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTeamBetsDisplay(filter) {
        const container = document.getElementById('teamBets');
        const teamBets = this.engine.applyFilters().filter(rec => !rec.betType.includes('player_'));
        
        let filteredBets = teamBets;
        if (filter !== 'all') {
            filteredBets = teamBets.filter(bet => {
                switch (filter) {
                    case 'ml': return bet.betType.includes('_ml');
                    case 'total': return bet.betType.includes('total') || bet.betType.includes('over') || bet.betType.includes('under');
                    case 'runline': return bet.betType.includes('runline');
                    case 'f5': return bet.betType.includes('f5') || bet.betType.includes('first_five');
                    default: return true;
                }
            });
        }
        
        if (filteredBets.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No team bets found for current filter</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredBets.map(bet => {
            const game = this.currentData.games.find(g => g.gameId === bet.gameId);
            
            // Enhanced confidence emoji mapping for 10-point scale
            const getConfidenceEmoji = (confidence) => {
                switch(confidence) {
                    case 'elite': return '👑';
                    case 'very-high': return '🔥';
                    case 'high': return '⚡';
                    case 'medium-high': return '💪';
                    case 'medium': return '💡';
                    case 'medium-low': return '⚠️';
                    case 'low': return '📊';
                    case 'very-low': return '❓';
                    default: return '💡';
                }
            };
            const confidenceEmoji = getConfidenceEmoji(bet.confidence);
            
            return `
                <div class="bet-item fade-in">
                    <div class="bet-header">
                        <div class="bet-info">
                            <span class="confidence-badge confidence-${bet.confidence}">
                                ${confidenceEmoji} ${bet.confidence.toUpperCase()}
                            </span>
                            <h4>${this.formatBetType(bet.betType)}</h4>
                        </div>
                        <div class="bet-score">
                            ${bet.score}/10.0
                        </div>
                    </div>
                    <div class="game-matchup">
                        <strong>${game ? `${game.awayTeam} @ ${game.homeTeam}` : 'Game TBD'}</strong>
                        <div class="venue">${game ? game.venue : 'Venue TBD'}</div>
                    </div>
                    <div class="bet-analysis">
                        <div class="primary-reason">
                            ${Array.isArray(bet.reasons) ? bet.reasons[0] : bet.reason}
                        </div>
                        ${bet.numFactors > 1 ? `
                            <div class="additional-factors">
                                <strong>Additional Supporting Factors:</strong>
                                <ul>
                                    ${bet.reasons.slice(1).map(reason => `<li>${reason}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                    ${this.renderMetrics(bet)}
                </div>
            `;
        }).join('');
    }

    updatePlayerPropsDisplay(category) {
        const container = document.getElementById('playerProps');
        const playerProps = this.engine.applyFilters().filter(rec => rec.betType.includes('player_'));
        
        let filteredProps = playerProps;
        if (category !== 'all') {
            filteredProps = playerProps.filter(prop => {
                switch (category) {
                    case 'hitting': return ['hits', 'hr', 'rbi', 'runs', 'total_bases'].some(type => prop.betType.includes(type));
                    case 'pitching': return prop.betType.includes('pitcher_');
                    case 'streaks': return prop.propFactor === 'hot_streak' || prop.model === 'streak_analysis';
                    case 'situational': return ['venue_boost', 'weather_boost', 'matchup_advantage'].includes(prop.propFactor);
                    default: return true;
                }
            });
        }
        
        if (filteredProps.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-user"></i>
                    <p>No player props found for current category</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredProps.map(prop => {
            const game = this.currentData.games.find(g => g.gameId === prop.gameId);
            
            // Enhanced confidence emoji mapping for 10-point scale
            const getConfidenceEmoji = (confidence) => {
                switch(confidence) {
                    case 'elite': return '👑';
                    case 'very-high': return '🔥';
                    case 'high': return '⚡';
                    case 'medium-high': return '💪';
                    case 'medium': return '💡';
                    case 'medium-low': return '⚠️';
                    case 'low': return '📊';
                    case 'very-low': return '❓';
                    default: return '💡';
                }
            };
            const confidenceEmoji = getConfidenceEmoji(prop.confidence);
            
            return `
                <div class="prop-item fade-in">
                    <div class="prop-header">
                        <div class="prop-info">
                            <span class="confidence-badge confidence-${prop.confidence}">
                                ${confidenceEmoji} ${prop.confidence.toUpperCase()}
                            </span>
                            <h4>${prop.player || 'Player'}</h4>
                            <div class="prop-type">${this.formatBetType(prop.betType)}</div>
                        </div>
                        <div class="prop-score">
                            ${prop.score}/10.0
                        </div>
                    </div>
                    ${prop.propLine ? `<div class="prop-line"><strong>Line:</strong> ${prop.propLine}</div>` : ''}
                    <div class="game-info">
                        <strong>${game ? `${game.awayTeam} @ ${game.homeTeam}` : 'Game TBD'}</strong>
                        <div class="venue">${game ? game.venue : 'Venue TBD'}</div>
                    </div>
                    <div class="prop-analysis">
                        ${Array.isArray(prop.reasons) ? prop.reasons[0] : prop.reason}
                    </div>
                    ${this.renderMetrics(prop)}
                </div>
            `;
        }).join('');
    }

    updateParlaysDisplay(type) {
        const container = document.getElementById('parlaysList');
        let parlays = this.currentData.parlays || [];
        
        if (type !== 'all') {
            parlays = parlays.filter(parlay => {
                switch (type) {
                    case 'sgp': return parlay.parlayCategory === 'same_game';
                    case 'multi': return parlay.parlayCategory === 'multi_game';
                    case 'specialty': return parlay.parlayCategory === 'specialty';
                    default: return true;
                }
            });
        }
        
        if (parlays.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-layer-group"></i>
                    <p>No parlays found for current type</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = parlays.map(parlay => {
            const riskEmoji = parlay.riskLevel === 'low' ? '🟢' : parlay.riskLevel === 'medium' ? '🟡' : '🔴';
            
            return `
                <div class="parlay-item fade-in">
                    <div class="parlay-header">
                        <div class="parlay-info">
                            <span class="risk-badge risk-${parlay.riskLevel}">
                                ${riskEmoji} ${parlay.riskLevel.toUpperCase()} RISK
                            </span>
                            <h4>${parlay.type}</h4>
                        </div>
                        <div class="expected-odds">
                            ${parlay.expectedOdds}
                        </div>
                    </div>
                    <div class="parlay-strategy">
                        <strong>Strategy:</strong> ${parlay.reasoning}
                    </div>
                    <div class="parlay-legs">
                        <strong>Legs (${parlay.legs.length}):</strong>
                        <ol>
                            ${parlay.legs.map(leg => {
                                const game = this.currentData.games.find(g => g.gameId === leg.gameId);
                                return `
                                    <li>
                                        <strong>${this.formatBetType(leg.betType)}</strong>
                                        ${leg.player ? ` - ${leg.player}` : ''}
                                        ${leg.propLine ? ` (${leg.propLine})` : ''}
                                        <div class="leg-game">${game ? `${game.awayTeam} @ ${game.homeTeam}` : 'Game TBD'}</div>
                                    </li>
                                `;
                            }).join('')}
                        </ol>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAdvancedTab() {
        this.updatePitcherModels();
        this.updateWeatherAnalysis();
        this.updateVenueAnalysis();
        this.updateTrendAnalysis();
    }

    updatePitcherModels() {
        const container = document.getElementById('pitcherModels');
        const pitcherRecs = this.engine.applyFilters().filter(rec => rec.model && rec.model.includes('strikeout') || rec.model?.includes('whip') || rec.model?.includes('innings'));
        
        container.innerHTML = pitcherRecs.slice(0, 5).map(rec => `
            <div class="model-result">
                <div class="model-header">
                    <span class="confidence-badge confidence-${rec.confidence}">
                        ${rec.confidence.toUpperCase()}
                    </span>
                    <strong>${rec.player}</strong>
                </div>
                <div class="model-type">${rec.model?.replace('_', ' ').toUpperCase()}</div>
                <div class="model-analysis">${Array.isArray(rec.reasons) ? rec.reasons[0] : rec.reason}</div>
                ${this.renderMetrics(rec)}
            </div>
        `).join('') || '<p class="text-secondary">No advanced pitcher models available</p>';
    }

    updateWeatherAnalysis() {
        const container = document.getElementById('weatherAnalysis');
        const weatherRecs = this.engine.applyFilters().filter(rec => rec.weatherFactor);
        
        container.innerHTML = weatherRecs.slice(0, 5).map(rec => {
            const game = this.currentData.games.find(g => g.gameId === rec.gameId);
            return `
                <div class="model-result">
                    <div class="weather-factor">${rec.weatherFactor.replace('_', ' ').toUpperCase()}</div>
                    <div class="game-info">${game ? `${game.awayTeam} @ ${game.homeTeam}` : 'Game TBD'}</div>
                    <div class="weather-analysis">${Array.isArray(rec.reasons) ? rec.reasons[0] : rec.reason}</div>
                </div>
            `;
        }).join('') || '<p class="text-secondary">No weather factors identified</p>';
    }

    updateVenueAnalysis() {
        const container = document.getElementById('venueAnalysis');
        const venueRecs = this.engine.applyFilters().filter(rec => rec.venueFactor);
        
        container.innerHTML = venueRecs.slice(0, 5).map(rec => {
            const game = this.currentData.games.find(g => g.gameId === rec.gameId);
            return `
                <div class="model-result">
                    <div class="venue-factor">${rec.venueFactor.replace('_', ' ').toUpperCase()}</div>
                    <div class="venue-name">${game ? game.venue : 'Venue TBD'}</div>
                    <div class="venue-analysis">${Array.isArray(rec.reasons) ? rec.reasons[0] : rec.reason}</div>
                </div>
            `;
        }).join('') || '<p class="text-secondary">No significant venue factors</p>';
    }

    updateTrendAnalysis() {
        const container = document.getElementById('trendAnalysis');
        const trendRecs = this.engine.applyFilters().filter(rec => rec.trendFactor || rec.propFactor === 'hot_streak');
        
        container.innerHTML = trendRecs.slice(0, 5).map(rec => {
            const game = this.currentData.games.find(g => g.gameId === rec.gameId);
            return `
                <div class="model-result">
                    <div class="trend-factor">${(rec.trendFactor || rec.propFactor).replace('_', ' ').toUpperCase()}</div>
                    <div class="trend-target">${rec.player || `${game ? `${game.awayTeam} vs ${game.homeTeam}` : 'Teams TBD'}`}</div>
                    <div class="trend-analysis">${Array.isArray(rec.reasons) ? rec.reasons[0] : rec.reason}</div>
                </div>
            `;
        }).join('') || '<p class="text-secondary">No significant trends identified</p>';
    }

    renderMetrics(bet) {
        const metrics = [];
        
        if (bet.kPer9) metrics.push(`K/9: ${bet.kPer9.toFixed(1)}`);
        if (bet.whip) metrics.push(`WHIP: ${bet.whip.toFixed(2)}`);
        if (bet.bbPer9) metrics.push(`BB/9: ${bet.bbPer9.toFixed(1)}`);
        if (bet.hrPer9) metrics.push(`HR/9: ${bet.hrPer9.toFixed(1)}`);
        if (bet.avgInnings) metrics.push(`Avg IP: ${bet.avgInnings.toFixed(1)}`);
        if (bet.era) metrics.push(`ERA: ${bet.era.toFixed(2)}`);
        
        if (metrics.length === 0) return '';
        
        return `
            <div class="metrics">
                <i class="fas fa-chart-bar"></i>
                ${metrics.join(' • ')}
            </div>
        `;
    }

    formatBetType(betType) {
        return betType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('Ml', 'ML')
            .replace('Hr', 'HR')
            .replace('Rbi', 'RBI')
            .replace('F5', 'First 5 Innings');
    }

    categorizeBetType(betType) {
        if (betType.includes('ml')) return 'Moneyline';
        if (betType.includes('total') || betType.includes('over') || betType.includes('under')) return 'Totals';
        if (betType.includes('runline')) return 'Run Lines';
        if (betType.includes('f5') || betType.includes('first_five')) return 'First 5';
        if (betType.includes('player_')) return 'Player Props';
        if (betType.includes('pitcher_')) return 'Pitcher Props';
        return 'Other';
    }

    showSuccessMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MLBAnalyticsApp();
});

// Add toast styles to head
const toastStyles = `
    <style>
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast.success {
            background: var(--success-color);
        }
        
        .welcome-message {
            text-align: center;
            padding: 3rem;
            grid-column: 1 / -1;
        }
        
        .welcome-content h3 {
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        .welcome-content p {
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
        
        .welcome-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .feature {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
        }
        
        .feature i {
            color: var(--primary-color);
        }
        
        .no-results {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
            grid-column: 1 / -1;
        }
        
        .no-results i {
            font-size: 2rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        
        .model-result {
            background: var(--surface);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .metrics {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 1rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .metrics i {
            color: var(--primary-color);
        }
        
        .risk-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .risk-low {
            background: #dcfce7;
            color: #166534;
        }
        
        .risk-medium {
            background: #fef3c7;
            color: #92400e;
        }
        
        .risk-high {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', toastStyles);
