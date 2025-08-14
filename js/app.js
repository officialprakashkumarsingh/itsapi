// Main Application Entry Point
import { APIManager } from './api-manager.js';
import { ThemeManager } from './theme-manager.js';
import { TabManager } from './tab-manager.js';
import { Analytics } from './analytics.js';
import { HistoryManager } from './history-manager.js';
import { ToastManager } from './toast-manager.js';
import { MobileManager } from './mobile-manager.js';
import { KeepAliveManager } from './keep-alive.js';

// Application State
export const appState = {
    models: [],
    selectedModel: 'gpt-4o-mini',
    theme: 'system',
    modelStatuses: new Map(),
    lastStatusCheck: null,
    currentTab: 'testing',
    requestHistory: [],
    analytics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        sessionStart: Date.now()
    }
};

// Application Configuration
export const APP_CONFIG = {
    baseUrl: 'https://ahamai-api.officialprakashkrsingh.workers.dev',
    apiKey: 'ahamaibyprakash25',
    endpoints: {
        models: '/v1/models',
        chatCompletions: '/v1/chat/completions'
    },
    keepAlive: {
        enabled: true,
        interval: 30000, // 30 seconds
        endpoint: '/v1/models', // Lightweight endpoint for keep-alive
        retryCount: 3,
        retryDelay: 5000
    },
    ui: {
        toastDuration: 4000,
        animationDuration: 300,
        maxHistoryItems: 100,
        autoSaveDelay: 500
    }
};

// Application Instance
class ItsApiApp {
    constructor() {
        this.managers = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize managers
            this.managers.toast = new ToastManager();
            this.managers.theme = new ThemeManager();
            this.managers.mobile = new MobileManager();
            this.managers.tabs = new TabManager();
            this.managers.api = new APIManager();
            this.managers.analytics = new Analytics();
            this.managers.history = new HistoryManager();
            this.managers.keepAlive = new KeepAliveManager();

            // Initialize in order
            await this.managers.theme.init();
            await this.managers.mobile.init();
            await this.managers.tabs.init();
            await this.managers.api.init();
            await this.managers.analytics.init();
            await this.managers.history.init();
            
            // Start keep-alive after other managers
            if (APP_CONFIG.keepAlive.enabled) {
                await this.managers.keepAlive.init();
            }

            // Setup global event listeners
            this.setupGlobalEvents();

            // Load saved data
            this.loadSavedData();

            // Auto-fetch models after initialization
            setTimeout(() => {
                this.managers.api.fetchModels();
            }, 1000);

            this.initialized = true;
            this.managers.toast.show('ItsApi initialized successfully!', 'success');
            
            console.log('✅ ItsApi Application initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize ItsApi:', error);
            this.managers.toast?.show('Failed to initialize application', 'error');
        }
    }

    setupGlobalEvents() {
        // Handle unhandled errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.managers.toast.show('An unexpected error occurred', 'error');
        });

        // Handle promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            this.managers.toast.show('Connection restored', 'success');
            this.updateConnectionStatus(true);
        });

        window.addEventListener('offline', () => {
            this.managers.toast.show('Connection lost', 'error');
            this.updateConnectionStatus(false);
        });

        // Handle visibility change for performance optimization
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden - reduce activity
                this.managers.keepAlive?.pause();
            } else {
                // Page is visible - resume activity
                this.managers.keepAlive?.resume();
            }
        });

        // Handle beforeunload for data saving
        window.addEventListener('beforeunload', () => {
            this.saveAppState();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K: Focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector('#model-search, #history-search');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Ctrl/Cmd + Enter: Send request
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (appState.currentTab === 'testing') {
                this.managers.api.sendRequest();
            }
        }

        // Ctrl/Cmd + Shift + T: Toggle theme
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
            event.preventDefault();
            this.managers.theme.toggleTheme();
        }

        // Escape: Close modals/overlays
        if (event.key === 'Escape') {
            this.managers.mobile.closeMobileNav();
        }
    }

    updateConnectionStatus(isOnline) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (isOnline) {
                statusDot.classList.add('connected');
                statusDot.classList.remove('error');
                statusText.textContent = 'Connected';
            } else {
                statusDot.classList.remove('connected');
                statusDot.classList.add('error');
                statusText.textContent = 'Offline';
            }
        }
    }

    loadSavedData() {
        try {
            // Load theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.managers.theme.setTheme(savedTheme);
            }

            // Load form data
            const formFields = [
                'user-message',
                'max-tokens',
                'temperature',
                'api-key',
                'base-url'
            ];

            formFields.forEach(fieldId => {
                const savedValue = localStorage.getItem(`form-${fieldId}`);
                const element = document.getElementById(fieldId);
                if (element && savedValue) {
                    element.value = savedValue;
                }
            });

            // Load analytics data
            const savedAnalytics = localStorage.getItem('analytics');
            if (savedAnalytics) {
                try {
                    const analyticsData = JSON.parse(savedAnalytics);
                    Object.assign(appState.analytics, analyticsData);
                } catch (e) {
                    console.warn('Failed to load saved analytics:', e);
                }
            }

            // Load history
            const savedHistory = localStorage.getItem('request-history');
            if (savedHistory) {
                try {
                    appState.requestHistory = JSON.parse(savedHistory);
                    this.managers.history.renderHistory();
                } catch (e) {
                    console.warn('Failed to load saved history:', e);
                }
            }

            // Load settings
            const savedSettings = localStorage.getItem('app-settings');
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    this.applySettings(settings);
                } catch (e) {
                    console.warn('Failed to load saved settings:', e);
                }
            }
        } catch (error) {
            console.warn('Error loading saved data:', error);
        }
    }

    applySettings(settings) {
        // Apply keep-alive settings
        if (settings.keepAliveEnabled !== undefined) {
            APP_CONFIG.keepAlive.enabled = settings.keepAliveEnabled;
            const checkbox = document.getElementById('keep-alive-enabled');
            if (checkbox) {
                checkbox.checked = settings.keepAliveEnabled;
            }
        }

        // Apply other settings
        if (settings.autoSaveRequests !== undefined) {
            const checkbox = document.getElementById('auto-save-requests');
            if (checkbox) {
                checkbox.checked = settings.autoSaveRequests;
            }
        }

        if (settings.saveResponseHistory !== undefined) {
            const checkbox = document.getElementById('save-response-history');
            if (checkbox) {
                checkbox.checked = settings.saveResponseHistory;
            }
        }

        if (settings.historyLimit !== undefined) {
            const select = document.getElementById('history-limit');
            if (select) {
                select.value = settings.historyLimit;
            }
        }

        if (settings.timeout !== undefined) {
            const input = document.getElementById('timeout-setting');
            if (input) {
                input.value = settings.timeout;
            }
        }
    }

    saveAppState() {
        try {
            // Save analytics
            localStorage.setItem('analytics', JSON.stringify(appState.analytics));

            // Save history (limit to prevent storage overflow)
            const historyToSave = appState.requestHistory.slice(-APP_CONFIG.ui.maxHistoryItems);
            localStorage.setItem('request-history', JSON.stringify(historyToSave));

            // Save current settings
            const settings = {
                keepAliveEnabled: APP_CONFIG.keepAlive.enabled,
                autoSaveRequests: document.getElementById('auto-save-requests')?.checked ?? true,
                saveResponseHistory: document.getElementById('save-response-history')?.checked ?? true,
                historyLimit: document.getElementById('history-limit')?.value ?? '100',
                timeout: document.getElementById('timeout-setting')?.value ?? '30'
            };
            localStorage.setItem('app-settings', JSON.stringify(settings));

        } catch (error) {
            console.warn('Error saving app state:', error);
        }
    }

    // Public API for managers to communicate
    getManager(name) {
        return this.managers[name];
    }

    updateAppState(updates) {
        Object.assign(appState, updates);
        this.managers.analytics?.updateUI();
    }

    // Utility methods
    showToast(message, type = 'info') {
        this.managers.toast.show(message, type);
    }

    // Method to manually trigger data save
    save() {
        this.saveAppState();
        this.showToast('Settings saved', 'success');
    }

    // Method to reset application data
    reset() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    }

    // Method to export configuration
    exportConfig() {
        const config = {
            settings: {
                apiKey: document.getElementById('api-key')?.value,
                baseUrl: document.getElementById('base-url')?.value,
                theme: appState.theme
            },
            analytics: appState.analytics,
            history: appState.requestHistory.slice(-50), // Last 50 requests
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `itsapi-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Configuration exported', 'success');
    }

    // Method to import configuration
    importConfig(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Validate config structure
                if (!config.settings && !config.analytics && !config.history) {
                    throw new Error('Invalid configuration file format');
                }

                // Apply settings
                if (config.settings) {
                    if (config.settings.apiKey) {
                        document.getElementById('api-key').value = config.settings.apiKey;
                    }
                    if (config.settings.baseUrl) {
                        document.getElementById('base-url').value = config.settings.baseUrl;
                    }
                    if (config.settings.theme) {
                        this.managers.theme.setTheme(config.settings.theme);
                    }
                }

                // Apply analytics (merge with existing)
                if (config.analytics) {
                    Object.assign(appState.analytics, config.analytics);
                }

                // Apply history (replace existing)
                if (config.history) {
                    appState.requestHistory = config.history;
                    this.managers.history.renderHistory();
                }

                this.saveAppState();
                this.showToast('Configuration imported successfully', 'success');
                
            } catch (error) {
                console.error('Error importing config:', error);
                this.showToast('Failed to import configuration', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Create and initialize the application
const app = new ItsApiApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Expose app instance globally for debugging
window.ItsApi = {
    app,
    appState,
    APP_CONFIG
};

export default app;