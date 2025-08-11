class SettingsManager {
    constructor() {
        this.settings = {
            darkMode: false,
            autoRefresh: true,
            notifyHighConfidence: true,
            notifyParlays: true,
            defaultSort: 'confidence',
            itemsPerPage: '20'
        };
        
        this.loadSettings();
        this.initializeListeners();
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('mlbAnalyticsSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            this.updateUI();
        }
    }
    
    saveSettings() {
        localStorage.setItem('mlbAnalyticsSettings', JSON.stringify(this.settings));
    }
    
    updateUI() {
        // Update checkboxes
        document.getElementById('darkMode').checked = this.settings.darkMode;
        document.getElementById('autoRefresh').checked = this.settings.autoRefresh;
        document.getElementById('notifyHighConfidence').checked = this.settings.notifyHighConfidence;
        document.getElementById('notifyParlays').checked = this.settings.notifyParlays;
        
        // Update selects
        document.getElementById('defaultSort').value = this.settings.defaultSort;
        document.getElementById('itemsPerPage').value = this.settings.itemsPerPage;
    }
    
    initializeListeners() {
        // Checkbox listeners
        ['darkMode', 'autoRefresh', 'notifyHighConfidence', 'notifyParlays'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.checked;
                    this.saveSettings();
                });
            }
        });
        
        // Select listeners
        ['defaultSort', 'itemsPerPage'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[id] = e.target.value;
                    this.saveSettings();
                });
            }
        });
    }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
