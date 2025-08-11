/**
 * Phase 2: User Preferences and Settings System
 * Mobile-optimized settings panel with customization options
 */

class UserPreferencesManager {
    constructor() {
        this.preferences = this.loadPreferences();
        this.defaultPreferences = {
            // Display Preferences
            theme: 'auto', // 'light', 'dark', 'auto'
            compactView: false,
            showEnhancements: true,
            showFactorTags: true,
            
            // Filter Preferences
            defaultConfidenceFilter: 'high', // Default to high confidence
            defaultBetTypeFilter: 'all',
            autoApplyFilters: true,
            
            // Notification Preferences
            notifications: true,
            analyticsNotifications: true,
            newRecommendationNotifications: false,
            betTrackingReminders: true,
            
            // Bet Tracking Preferences
            defaultStakeAmount: 0,
            trackingMode: 'detailed', // 'simple', 'detailed'
            autoCalculateROI: true,
            showBetHistory: true,
            
            // Advanced Preferences
            expertWeighting: 1.0, // How much to weight expert opinions
            valueThreshold: 0.05, // Minimum edge for value bets
            confidenceAdjustment: 0, // Bias adjustment (-1 to +1)
            
            // Mobile Preferences
            enableSwipeNavigation: true,
            enablePullToRefresh: true,
            vibrateOnSuccess: true,
            
            // Data Preferences
            cacheResults: true,
            maxCacheAge: 30, // minutes
            autoRefreshInterval: 0, // 0 = manual only
            
            // Privacy Preferences
            shareAnalytics: false,
            storeLocally: true
        };
        
        this.init();
    }

    init() {
        this.setupSettingsPanel();
        this.applyTheme();
        this.setupEventListeners();
    }

    setupSettingsPanel() {
        // Add settings button to header if not exists
        const header = document.querySelector('.mobile-header .header-actions');
        if (header && !document.getElementById('settingsBtn')) {
            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'settingsBtn';
            settingsBtn.className = 'btn btn-icon';
            settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
            settingsBtn.setAttribute('aria-label', 'Settings');
            header.appendChild(settingsBtn);
        }
        
        // Create settings modal if not exists
        if (!document.getElementById('settingsModal')) {
            this.createSettingsModal();
        }
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content settings-modal">
                <div class="modal-header">
                    <h3>Settings & Preferences</h3>
                    <button class="modal-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="settings-tabs">
                        <button class="settings-tab-btn active" data-tab="display">
                            <i class="fas fa-eye"></i> Display
                        </button>
                        <button class="settings-tab-btn" data-tab="filters">
                            <i class="fas fa-filter"></i> Filters
                        </button>
                        <button class="settings-tab-btn" data-tab="notifications">
                            <i class="fas fa-bell"></i> Notifications
                        </button>
                        <button class="settings-tab-btn" data-tab="betting">
                            <i class="fas fa-chart-line"></i> Betting
                        </button>
                        <button class="settings-tab-btn" data-tab="advanced">
                            <i class="fas fa-cogs"></i> Advanced
                        </button>
                    </div>
                    
                    <div class="settings-content">
                        ${this.createDisplaySettings()}
                        ${this.createFilterSettings()}
                        ${this.createNotificationSettings()}
                        ${this.createBettingSettings()}
                        ${this.createAdvancedSettings()}
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="resetSettings" class="btn btn-secondary">Reset to Defaults</button>
                    <button id="saveSettings" class="btn btn-primary">Save Settings</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    createDisplaySettings() {
        return `
            <div class="settings-panel active" data-panel="display">
                <div class="settings-section">
                    <h4>Appearance</h4>
                    
                    <div class="setting-item">
                        <label for="themeSelect">Theme</label>
                        <select id="themeSelect" name="theme">
                            <option value="auto">Auto (System)</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="compactView" name="compactView">
                            <span class="checkmark"></span>
                            Compact View
                        </label>
                        <p class="setting-description">Show more content in less space</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="showEnhancements" name="showEnhancements">
                            <span class="checkmark"></span>
                            Show Enhancement Icons
                        </label>
                        <p class="setting-description">Display expert, value, and historical indicators</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="showFactorTags" name="showFactorTags">
                            <span class="checkmark"></span>
                            Show Factor Tags
                        </label>
                        <p class="setting-description">Display tags like "Expert Consensus", "Value Bet"</p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Mobile Experience</h4>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enableSwipeNavigation" name="enableSwipeNavigation">
                            <span class="checkmark"></span>
                            Swipe Navigation
                        </label>
                        <p class="setting-description">Swipe left/right to switch between tabs</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enablePullToRefresh" name="enablePullToRefresh">
                            <span class="checkmark"></span>
                            Pull to Refresh
                        </label>
                        <p class="setting-description">Pull down to refresh analysis data</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="vibrateOnSuccess" name="vibrateOnSuccess">
                            <span class="checkmark"></span>
                            Vibrate on Success
                        </label>
                        <p class="setting-description">Haptic feedback for successful actions</p>
                    </div>
                </div>
            </div>
        `;
    }

    createFilterSettings() {
        return `
            <div class="settings-panel" data-panel="filters">
                <div class="settings-section">
                    <h4>Default Filters</h4>
                    
                    <div class="setting-item">
                        <label for="defaultConfidenceFilter">Default Confidence Level</label>
                        <select id="defaultConfidenceFilter" name="defaultConfidenceFilter">
                            <option value="all">All Levels</option>
                            <option value="elite">Elite (9.0+)</option>
                            <option value="very-high">Very High (8.0+)</option>
                            <option value="high">High (7.0+)</option>
                            <option value="medium-high">Medium-High (6.0+)</option>
                            <option value="medium">Medium (5.0+)</option>
                        </select>
                        <p class="setting-description">Default confidence filter when opening the app</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="defaultBetTypeFilter">Default Bet Type</label>
                        <select id="defaultBetTypeFilter" name="defaultBetTypeFilter">
                            <option value="all">All Types</option>
                            <option value="moneyline">Moneyline</option>
                            <option value="runline">Run Line</option>
                            <option value="total">Over/Under</option>
                            <option value="player_prop">Player Props</option>
                            <option value="parlay">Parlays</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoApplyFilters" name="autoApplyFilters">
                            <span class="checkmark"></span>
                            Auto-Apply Default Filters
                        </label>
                        <p class="setting-description">Automatically apply default filters on new analysis</p>
                    </div>
                </div>
            </div>
        `;
    }

    createNotificationSettings() {
        return `
            <div class="settings-panel" data-panel="notifications">
                <div class="settings-section">
                    <h4>Notification Preferences</h4>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="notifications" name="notifications">
                            <span class="checkmark"></span>
                            Enable Notifications
                        </label>
                        <p class="setting-description">Master setting for all notifications</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="analyticsNotifications" name="analyticsNotifications">
                            <span class="checkmark"></span>
                            Analysis Completion
                        </label>
                        <p class="setting-description">Notify when analysis is complete</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="newRecommendationNotifications" name="newRecommendationNotifications">
                            <span class="checkmark"></span>
                            New High-Confidence Picks
                        </label>
                        <p class="setting-description">Alert when elite recommendations are found</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="betTrackingReminders" name="betTrackingReminders">
                            <span class="checkmark"></span>
                            Bet Result Reminders
                        </label>
                        <p class="setting-description">Remind you to update bet results</p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Permission Status</h4>
                    <div class="permission-status">
                        <span id="notificationPermissionStatus">Checking permissions...</span>
                        <button id="requestNotificationPermission" class="btn btn-sm btn-secondary" style="display: none;">
                            Enable Notifications
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createBettingSettings() {
        return `
            <div class="settings-panel" data-panel="betting">
                <div class="settings-section">
                    <h4>Bet Tracking</h4>
                    
                    <div class="setting-item">
                        <label for="defaultStakeAmount">Default Stake Amount ($)</label>
                        <input type="number" id="defaultStakeAmount" name="defaultStakeAmount" 
                               min="0" step="0.01" placeholder="0.00">
                        <p class="setting-description">Pre-fill this amount when tracking bets</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="trackingMode">Tracking Detail Level</label>
                        <select id="trackingMode" name="trackingMode">
                            <option value="simple">Simple (Win/Loss only)</option>
                            <option value="detailed">Detailed (Full analytics)</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoCalculateROI" name="autoCalculateROI">
                            <span class="checkmark"></span>
                            Auto-Calculate ROI
                        </label>
                        <p class="setting-description">Automatically calculate return on investment</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="showBetHistory" name="showBetHistory">
                            <span class="checkmark"></span>
                            Show Bet History
                        </label>
                        <p class="setting-description">Display recent bets in analytics tab</p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Performance Tracking</h4>
                    <div class="setting-item">
                        <button id="exportBetHistory" class="btn btn-secondary">
                            <i class="fas fa-download"></i> Export Bet History
                        </button>
                        <p class="setting-description">Download your betting data as CSV</p>
                    </div>
                    
                    <div class="setting-item">
                        <button id="clearBetHistory" class="btn btn-danger">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                        <p class="setting-description">⚠️ This cannot be undone</p>
                    </div>
                </div>
            </div>
        `;
    }

    createAdvancedSettings() {
        return `
            <div class="settings-panel" data-panel="advanced">
                <div class="settings-section">
                    <h4>Analysis Tuning</h4>
                    
                    <div class="setting-item">
                        <label for="expertWeighting">Expert Opinion Weight</label>
                        <input type="range" id="expertWeighting" name="expertWeighting" 
                               min="0" max="2" step="0.1" value="1.0">
                        <div class="range-labels">
                            <span>Ignore (0)</span>
                            <span id="expertWeightValue">1.0</span>
                            <span>Double (2.0)</span>
                        </div>
                        <p class="setting-description">How much to weight expert consensus in scoring</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="valueThreshold">Value Bet Threshold</label>
                        <input type="range" id="valueThreshold" name="valueThreshold" 
                               min="0" max="0.2" step="0.01" value="0.05">
                        <div class="range-labels">
                            <span>0%</span>
                            <span id="valueThresholdValue">5%</span>
                            <span>20%</span>
                        </div>
                        <p class="setting-description">Minimum edge required to flag as value bet</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="confidenceAdjustment">Confidence Bias</label>
                        <input type="range" id="confidenceAdjustment" name="confidenceAdjustment" 
                               min="-1" max="1" step="0.1" value="0">
                        <div class="range-labels">
                            <span>Conservative (-1)</span>
                            <span id="confidenceAdjustmentValue">0</span>
                            <span>Aggressive (+1)</span>
                        </div>
                        <p class="setting-description">Adjust overall confidence scoring</p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Data & Performance</h4>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="cacheResults" name="cacheResults">
                            <span class="checkmark"></span>
                            Cache Analysis Results
                        </label>
                        <p class="setting-description">Store results locally for faster loading</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="maxCacheAge">Cache Duration (minutes)</label>
                        <select id="maxCacheAge" name="maxCacheAge">
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label for="autoRefreshInterval">Auto-Refresh Interval</label>
                        <select id="autoRefreshInterval" name="autoRefreshInterval">
                            <option value="0">Manual only</option>
                            <option value="15">Every 15 minutes</option>
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every hour</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Privacy & Data</h4>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="shareAnalytics" name="shareAnalytics">
                            <span class="checkmark"></span>
                            Share Anonymous Analytics
                        </label>
                        <p class="setting-description">Help improve the app with usage data</p>
                    </div>
                    
                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" id="storeLocally" name="storeLocally">
                            <span class="checkmark"></span>
                            Store Data Locally
                        </label>
                        <p class="setting-description">Keep preferences and bet history on device</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Settings button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#settingsBtn')) {
                this.showSettings();
            }
        });
        
        // Settings modal
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('settingsModal');
            if (!modal) return;
            
            // Close modal
            if (e.target.closest('.modal-close') || 
                (e.target === modal.querySelector('.modal-backdrop'))) {
                this.hideSettings();
            }
            
            // Save settings
            if (e.target.closest('#saveSettings')) {
                this.saveSettings();
            }
            
            // Reset settings
            if (e.target.closest('#resetSettings')) {
                this.resetSettings();
            }
            
            // Tab switching
            if (e.target.closest('.settings-tab-btn')) {
                const tabBtn = e.target.closest('.settings-tab-btn');
                const tab = tabBtn.dataset.tab;
                this.switchSettingsTab(tab);
            }
            
            // Export bet history
            if (e.target.closest('#exportBetHistory')) {
                this.exportBetHistory();
            }
            
            // Clear bet history
            if (e.target.closest('#clearBetHistory')) {
                this.clearBetHistory();
            }
            
            // Request notification permission
            if (e.target.closest('#requestNotificationPermission')) {
                this.requestNotificationPermission();
            }
        });
        
        // Range input updates
        document.addEventListener('input', (e) => {
            if (e.target.id === 'expertWeighting') {
                document.getElementById('expertWeightValue').textContent = e.target.value;
            }
            if (e.target.id === 'valueThreshold') {
                document.getElementById('valueThresholdValue').textContent = 
                    (parseFloat(e.target.value) * 100).toFixed(0) + '%';
            }
            if (e.target.id === 'confidenceAdjustment') {
                document.getElementById('confidenceAdjustmentValue').textContent = e.target.value;
            }
        });
        
        // Theme change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'themeSelect') {
                this.applyTheme(e.target.value);
            }
        });
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;
        
        this.populateSettings();
        this.checkNotificationPermission();
        
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
    }

    hideSettings() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.classList.remove('fade-in');
    }

    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
    }

    populateSettings() {
        // Populate all form fields with current preferences
        Object.keys(this.preferences).forEach(key => {
            const element = document.getElementById(key);
            if (!element) return;
            
            if (element.type === 'checkbox') {
                element.checked = this.preferences[key];
            } else if (element.type === 'range' || element.tagName === 'SELECT') {
                element.value = this.preferences[key];
            } else if (element.type === 'number') {
                element.value = this.preferences[key];
            }
        });
        
        // Update range value displays
        document.getElementById('expertWeightValue').textContent = this.preferences.expertWeighting;
        document.getElementById('valueThresholdValue').textContent = 
            (this.preferences.valueThreshold * 100).toFixed(0) + '%';
        document.getElementById('confidenceAdjustmentValue').textContent = this.preferences.confidenceAdjustment;
    }

    saveSettings() {
        // Collect all form values
        const newPreferences = { ...this.preferences };
        
        Object.keys(this.defaultPreferences).forEach(key => {
            const element = document.getElementById(key);
            if (!element) return;
            
            if (element.type === 'checkbox') {
                newPreferences[key] = element.checked;
            } else if (element.type === 'range') {
                newPreferences[key] = parseFloat(element.value);
            } else if (element.type === 'number') {
                newPreferences[key] = parseFloat(element.value) || 0;
            } else if (element.tagName === 'SELECT') {
                newPreferences[key] = element.value;
            }
        });
        
        this.preferences = newPreferences;
        this.persistPreferences();
        this.applySettings();
        this.hideSettings();
        
        this.showToast('Settings saved successfully!', 'success');
    }

    resetSettings() {
        if (confirm('Reset all settings to default values? This cannot be undone.')) {
            this.preferences = { ...this.defaultPreferences };
            this.persistPreferences();
            this.populateSettings();
            this.applySettings();
            this.showToast('Settings reset to defaults', 'info');
        }
    }

    applySettings() {
        // Apply theme
        this.applyTheme();
        
        // Apply mobile preferences
        if (window.mlbApp) {
            window.mlbApp.userPreferences = this.preferences;
            window.mlbApp.applyUserPreferences();
        }
        
        // Update any affected UI elements
        this.updateUIBasedOnSettings();
    }

    applyTheme(theme = this.preferences.theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.setAttribute('data-theme', 'dark');
            } else {
                root.setAttribute('data-theme', 'light');
            }
        } else {
            root.setAttribute('data-theme', theme);
        }
    }

    updateUIBasedOnSettings() {
        // Update compact view
        document.body.classList.toggle('compact-view', this.preferences.compactView);
        
        // Update enhancement visibility
        document.body.classList.toggle('hide-enhancements', !this.preferences.showEnhancements);
        document.body.classList.toggle('hide-factor-tags', !this.preferences.showFactorTags);
    }

    checkNotificationPermission() {
        if (!('Notification' in window)) {
            document.getElementById('notificationPermissionStatus').textContent = 
                'Notifications not supported in this browser';
            return;
        }
        
        const permission = Notification.permission;
        const statusElement = document.getElementById('notificationPermissionStatus');
        const requestBtn = document.getElementById('requestNotificationPermission');
        
        switch (permission) {
            case 'granted':
                statusElement.textContent = '✅ Notifications enabled';
                requestBtn.style.display = 'none';
                break;
            case 'denied':
                statusElement.textContent = '❌ Notifications blocked';
                requestBtn.style.display = 'none';
                break;
            case 'default':
                statusElement.textContent = '⚠️ Notifications not configured';
                requestBtn.style.display = 'inline-block';
                break;
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.showToast('Notifications not supported', 'error');
            return;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.checkNotificationPermission();
            
            if (permission === 'granted') {
                this.showToast('Notifications enabled!', 'success');
                // Send a test notification
                new Notification('MLB Betting Analytics', {
                    body: 'Notifications are now enabled!',
                    icon: '/favicon.ico'
                });
            } else {
                this.showToast('Notification permission denied', 'error');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.showToast('Error enabling notifications', 'error');
        }
    }

    exportBetHistory() {
        if (!window.mlbApp || !window.mlbApp.engine || !window.mlbApp.engine.betTracker) {
            this.showToast('No bet history available', 'error');
            return;
        }
        
        try {
            const history = window.mlbApp.engine.betTracker.getAllBets();
            
            if (history.length === 0) {
                this.showToast('No bets to export', 'info');
                return;
            }
            
            // Convert to CSV
            const headers = ['Date', 'Type', 'Game', 'Description', 'Stake', 'Odds', 'Result', 'Profit/Loss'];
            const csvContent = [
                headers.join(','),
                ...history.map(bet => [
                    bet.timestamp ? new Date(bet.timestamp).toLocaleDateString() : 'Unknown',
                    bet.type || 'Unknown',
                    `"${bet.homeTeam || ''} vs ${bet.awayTeam || ''}"`,
                    `"${(bet.description || '').replace(/"/g, '""')}"`,
                    bet.stake || 0,
                    bet.odds || 'N/A',
                    bet.result || 'Pending',
                    bet.profitLoss || 0
                ].join(','))
            ].join('\n');
            
            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mlb-bet-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showToast('Bet history exported!', 'success');
        } catch (error) {
            console.error('Error exporting bet history:', error);
            this.showToast('Error exporting data', 'error');
        }
    }

    clearBetHistory() {
        if (!confirm('Are you sure you want to clear ALL bet history? This cannot be undone.')) {
            return;
        }
        
        if (window.mlbApp && window.mlbApp.engine && window.mlbApp.engine.betTracker) {
            window.mlbApp.engine.betTracker.clearAllBets();
            this.showToast('Bet history cleared', 'info');
        } else {
            this.showToast('No bet history to clear', 'info');
        }
    }

    loadPreferences() {
        try {
            const stored = localStorage.getItem('mlb_user_detailed_preferences');
            return stored ? { ...this.defaultPreferences, ...JSON.parse(stored) } : { ...this.defaultPreferences };
        } catch (error) {
            console.warn('Failed to load preferences:', error);
            return { ...this.defaultPreferences };
        }
    }

    persistPreferences() {
        try {
            localStorage.setItem('mlb_user_detailed_preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    }

    showToast(message, type = 'info') {
        // Use existing toast system from main app
        if (window.mlbApp && window.mlbApp.showToast) {
            window.mlbApp.showToast(message, type);
        } else {
            // Fallback toast implementation
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Public API for other modules
    getPreference(key) {
        return this.preferences[key];
    }

    setPreference(key, value) {
        this.preferences[key] = value;
        this.persistPreferences();
    }

    getAllPreferences() {
        return { ...this.preferences };
    }
}

// Initialize preferences manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.preferencesManager = new UserPreferencesManager();
    
    // Apply theme immediately
    window.preferencesManager.applyTheme();
});
