/**
 * Bet Tracker - Professional Bet Tracking System
 * Inspired by dimers.com design patterns
 */

class BetTracker {
    constructor() {
        this.trackedBets = this.loadTrackedBets();
        this.initializeTracker();
    }

    initializeTracker() {
        // Add bet tracking UI to the page
        this.createTrackerUI();
        this.bindEvents();
    }

    createTrackerUI() {
        // Create bet tracker section
        const trackerHTML = `
            <div id="bet-tracker-section" class="bet-tracker-container">
                <div class="tracker-header">
                    <h3>🎯 Bet Tracker</h3>
                    <div class="tracker-stats">
                        <div class="stat">
                            <span class="stat-value">${this.trackedBets.length}</span>
                            <span class="stat-label">Tracked</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.getWinRate()}%</span>
                            <span class="stat-label">Win Rate</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.getROI()}%</span>
                            <span class="stat-label">ROI</span>
                        </div>
                    </div>
                </div>
                
                <div id="tracked-bets-list" class="tracked-bets-list">
                    ${this.renderTrackedBets()}
                </div>
                
                <div class="tracker-actions">
                    <button id="clear-all-bets" class="btn-secondary">Clear All</button>
                    <button id="export-bets" class="btn-secondary">Export CSV</button>
                </div>
            </div>
        `;

        // Insert after recommendations section
        const recommendationsSection = document.querySelector('.recommendations-section');
        if (recommendationsSection) {
            recommendationsSection.insertAdjacentHTML('afterend', trackerHTML);
        }
    }

    bindEvents() {
        // Clear all bets
        document.getElementById('clear-all-bets')?.addEventListener('click', () => {
            if (confirm('Clear all tracked bets?')) {
                this.trackedBets = [];
                this.saveTrackedBets();
                this.updateTrackerUI();
            }
        });

        // Export bets
        document.getElementById('export-bets')?.addEventListener('click', () => {
            this.exportToCSV();
        });

        // Add track buttons to each recommendation
        this.addTrackButtons();
    }

    addTrackButtons() {
        // Wait for recommendations to load, then add track buttons
        setTimeout(() => {
            const recommendations = document.querySelectorAll('.recommendation-card');
            recommendations.forEach((card, index) => {
                if (!card.querySelector('.track-bet-btn')) {
                    const trackBtn = document.createElement('button');
                    trackBtn.className = 'track-bet-btn';
                    trackBtn.textContent = '📊 Track';
                    trackBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.trackBet(card, index);
                    });
                    
                    const actions = card.querySelector('.recommendation-actions') || card;
                    actions.appendChild(trackBtn);
                }
            });
        }, 1000);
    }

    trackBet(card, index) {
        // Extract bet information from the card
        const betInfo = this.extractBetInfo(card, index);
        
        // Show bet tracking modal
        this.showTrackingModal(betInfo);
    }

    extractBetInfo(card, index) {
        const teamText = card.querySelector('.team-info')?.textContent || '';
        const gameText = card.querySelector('.game-matchup')?.textContent || '';
        const betTypeText = card.querySelector('.bet-type')?.textContent || '';
        const oddsText = card.querySelector('.odds')?.textContent || '';
        const confidenceText = card.querySelector('.confidence-badge')?.textContent || '';
        
        return {
            id: Date.now() + Math.random(),
            game: gameText || `Game ${index + 1}`,
            team: teamText,
            betType: betTypeText,
            odds: oddsText,
            confidence: confidenceText,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
    }

    showTrackingModal(betInfo) {
        const modalHTML = `
            <div id="bet-tracking-modal" class="modal-overlay">
                <div class="modal-content">
                    <h3>Track This Bet</h3>
                    
                    <div class="bet-details">
                        <div class="detail-row">
                            <label>Game:</label>
                            <span>${betInfo.game}</span>
                        </div>
                        <div class="detail-row">
                            <label>Bet Type:</label>
                            <span>${betInfo.betType}</span>
                        </div>
                        <div class="detail-row">
                            <label>Odds:</label>
                            <span>${betInfo.odds}</span>
                        </div>
                    </div>
                    
                    <div class="bet-inputs">
                        <div class="input-group">
                            <label for="bet-amount">Bet Amount ($):</label>
                            <input type="number" id="bet-amount" value="25" min="1" step="0.01">
                        </div>
                        
                        <div class="input-group">
                            <label for="sportsbook">Sportsbook:</label>
                            <select id="sportsbook">
                                <option value="DraftKings">DraftKings</option>
                                <option value="FanDuel">FanDuel</option>
                                <option value="BetMGM">BetMGM</option>
                                <option value="Caesars">Caesars</option>
                                <option value="BetRivers">BetRivers</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label for="bet-notes">Notes (optional):</label>
                            <textarea id="bet-notes" placeholder="Why did you place this bet?"></textarea>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button id="confirm-track" class="btn-primary">Track Bet</button>
                        <button id="cancel-track" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Bind modal events
        document.getElementById('confirm-track').addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('bet-amount').value);
            const sportsbook = document.getElementById('sportsbook').value;
            const notes = document.getElementById('bet-notes').value;

            const trackedBet = {
                ...betInfo,
                amount: amount,
                sportsbook: sportsbook,
                notes: notes,
                potentialWin: this.calculatePotentialWin(amount, betInfo.odds)
            };

            this.addTrackedBet(trackedBet);
            this.closeModal();
        });

        document.getElementById('cancel-track').addEventListener('click', () => {
            this.closeModal();
        });
    }

    calculatePotentialWin(amount, odds) {
        // Parse odds and calculate potential win
        const oddsNum = parseFloat(odds.replace(/[+\-$]/g, ''));
        if (odds.includes('+')) {
            return (amount * oddsNum) / 100;
        } else if (odds.includes('-')) {
            return (amount * 100) / oddsNum;
        }
        return amount; // Fallback
    }

    addTrackedBet(bet) {
        this.trackedBets.unshift(bet); // Add to beginning
        this.saveTrackedBets();
        this.updateTrackerUI();
        
        // Show success message
        this.showToast('✅ Bet tracked successfully!');
    }

    renderTrackedBets() {
        if (this.trackedBets.length === 0) {
            return '<div class="no-bets">No tracked bets yet. Start tracking your bets to monitor performance!</div>';
        }

        return this.trackedBets.slice(0, 10).map(bet => `
            <div class="tracked-bet-card ${bet.status}" data-bet-id="${bet.id}">
                <div class="bet-header">
                    <div class="bet-game">${bet.game}</div>
                    <div class="bet-status-badge ${bet.status}">${bet.status.toUpperCase()}</div>
                </div>
                
                <div class="bet-details">
                    <div class="bet-info">
                        <span class="bet-type">${bet.betType}</span>
                        <span class="bet-odds">${bet.odds}</span>
                    </div>
                    <div class="bet-amount">$${bet.amount}</div>
                </div>
                
                <div class="bet-footer">
                    <div class="bet-meta">
                        <span class="sportsbook">${bet.sportsbook}</span>
                        <span class="bet-date">${new Date(bet.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="bet-actions">
                        ${bet.status === 'pending' ? `
                            <button class="btn-win" onclick="betTracker.updateBetStatus('${bet.id}', 'won')">Won</button>
                            <button class="btn-loss" onclick="betTracker.updateBetStatus('${bet.id}', 'lost')">Lost</button>
                        ` : ''}
                        <button class="btn-remove" onclick="betTracker.removeBet('${bet.id}')">×</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateBetStatus(betId, status) {
        const bet = this.trackedBets.find(b => b.id == betId);
        if (bet) {
            bet.status = status;
            if (status === 'won') {
                bet.profit = bet.potentialWin;
            } else if (status === 'lost') {
                bet.profit = -bet.amount;
            }
            this.saveTrackedBets();
            this.updateTrackerUI();
            this.showToast(status === 'won' ? '🎉 Bet marked as won!' : '😔 Bet marked as lost');
        }
    }

    removeBet(betId) {
        this.trackedBets = this.trackedBets.filter(b => b.id != betId);
        this.saveTrackedBets();
        this.updateTrackerUI();
        this.showToast('🗑️ Bet removed');
    }

    getWinRate() {
        const completed = this.trackedBets.filter(b => b.status === 'won' || b.status === 'lost');
        if (completed.length === 0) return 0;
        const wins = completed.filter(b => b.status === 'won').length;
        return Math.round((wins / completed.length) * 100);
    }

    getROI() {
        const completed = this.trackedBets.filter(b => b.status === 'won' || b.status === 'lost');
        if (completed.length === 0) return 0;
        
        const totalBet = completed.reduce((sum, bet) => sum + bet.amount, 0);
        const totalProfit = completed.reduce((sum, bet) => sum + (bet.profit || 0), 0);
        
        return totalBet > 0 ? Math.round((totalProfit / totalBet) * 100) : 0;
    }

    updateTrackerUI() {
        const trackerList = document.getElementById('tracked-bets-list');
        if (trackerList) {
            trackerList.innerHTML = this.renderTrackedBets();
        }

        // Update stats
        document.querySelector('.tracker-stats .stat:nth-child(1) .stat-value').textContent = this.trackedBets.length;
        document.querySelector('.tracker-stats .stat:nth-child(2) .stat-value').textContent = this.getWinRate() + '%';
        document.querySelector('.tracker-stats .stat:nth-child(3) .stat-value').textContent = this.getROI() + '%';
    }

    exportToCSV() {
        const headers = ['Date', 'Game', 'Bet Type', 'Odds', 'Amount', 'Sportsbook', 'Status', 'Profit', 'Notes'];
        const rows = this.trackedBets.map(bet => [
            new Date(bet.timestamp).toLocaleDateString(),
            bet.game,
            bet.betType,
            bet.odds,
            bet.amount,
            bet.sportsbook,
            bet.status,
            bet.profit || '',
            bet.notes || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bet-tracker-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    closeModal() {
        const modal = document.getElementById('bet-tracking-modal');
        if (modal) {
            modal.remove();
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadTrackedBets() {
        try {
            const saved = localStorage.getItem('mlb-tracked-bets');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tracked bets:', error);
            return [];
        }
    }

    saveTrackedBets() {
        try {
            localStorage.setItem('mlb-tracked-bets', JSON.stringify(this.trackedBets));
        } catch (error) {
            console.error('Error saving tracked bets:', error);
        }
    }
}

// Initialize bet tracker when DOM is ready
let betTracker;
document.addEventListener('DOMContentLoaded', () => {
    betTracker = new BetTracker();
});

// Export for global access
window.betTracker = betTracker;
