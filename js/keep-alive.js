// Keep-Alive Manager - Prevents API from sleeping on Render.com
import { APP_CONFIG, appState } from './app.js';

export class KeepAliveManager {
    constructor() {
        this.intervalId = null;
        this.isPaused = false;
        this.isEnabled = true;
        this.retryCount = 0;
        this.lastKeepAliveTime = null;
        this.failureCount = 0;
        this.maxConsecutiveFailures = 5;
    }

    async init() {
        console.log('🔄 Initializing Keep-Alive Manager...');
        
        // Check if keep-alive is enabled in settings
        const keepAliveCheckbox = document.getElementById('keep-alive-enabled');
        if (keepAliveCheckbox) {
            this.isEnabled = keepAliveCheckbox.checked;
            keepAliveCheckbox.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                APP_CONFIG.keepAlive.enabled = e.target.checked;
                
                if (this.isEnabled) {
                    this.start();
                } else {
                    this.stop();
                }
                
                // Save setting
                localStorage.setItem('keep-alive-enabled', e.target.checked);
            });
        }

        if (this.isEnabled && APP_CONFIG.keepAlive.enabled) {
            this.start();
        }

        console.log(`✅ Keep-Alive Manager initialized (${this.isEnabled ? 'enabled' : 'disabled'})`);
    }

    start() {
        if (this.intervalId) {
            this.stop(); // Clear existing interval
        }

        if (!this.isEnabled) {
            console.log('⏸️ Keep-alive is disabled');
            return;
        }

        console.log(`🚀 Starting keep-alive requests every ${APP_CONFIG.keepAlive.interval / 1000} seconds`);
        
        // Start immediate keep-alive request
        this.sendKeepAliveRequest();
        
        // Set up interval for subsequent requests
        this.intervalId = setInterval(() => {
            if (!this.isPaused && this.isEnabled) {
                this.sendKeepAliveRequest();
            }
        }, APP_CONFIG.keepAlive.interval);

        this.updateStatus('active');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Keep-alive requests stopped');
        }
        this.updateStatus('inactive');
    }

    pause() {
        this.isPaused = true;
        console.log('⏸️ Keep-alive requests paused');
        this.updateStatus('paused');
    }

    resume() {
        this.isPaused = false;
        console.log('▶️ Keep-alive requests resumed');
        this.updateStatus('active');
    }

    async sendKeepAliveRequest() {
        try {
            const startTime = Date.now();
            
            // Use the models endpoint as it's lightweight
            const response = await fetch(`${APP_CONFIG.baseUrl}${APP_CONFIG.keepAlive.endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`,
                    'Content-Type': 'application/json',
                    'X-Keep-Alive': 'true' // Custom header to identify keep-alive requests
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (response.ok) {
                this.lastKeepAliveTime = Date.now();
                this.retryCount = 0;
                this.failureCount = 0;
                
                console.log(`💚 Keep-alive successful (${responseTime}ms)`);
                this.updateStatus('success', responseTime);
                
                // Update connection status
                this.updateConnectionIndicator(true);
                
                // Optionally update analytics
                this.updateAnalytics(true, responseTime);
                
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            this.handleKeepAliveError(error);
        }
    }

    handleKeepAliveError(error) {
        this.failureCount++;
        this.retryCount++;
        
        console.warn(`❌ Keep-alive failed (attempt ${this.failureCount}):`, error.message);
        
        this.updateStatus('error', null, error.message);
        this.updateConnectionIndicator(false);
        this.updateAnalytics(false);

        // If we have too many consecutive failures, reduce frequency
        if (this.failureCount >= this.maxConsecutiveFailures) {
            console.warn('🔄 Too many keep-alive failures, reducing frequency');
            this.adjustFrequency(true);
        }

        // Retry logic for temporary failures
        if (this.retryCount < APP_CONFIG.keepAlive.retryCount) {
            console.log(`🔄 Retrying keep-alive in ${APP_CONFIG.keepAlive.retryDelay / 1000} seconds...`);
            
            setTimeout(() => {
                if (this.isEnabled && !this.isPaused) {
                    this.sendKeepAliveRequest();
                }
            }, APP_CONFIG.keepAlive.retryDelay);
        }
    }

    adjustFrequency(increase = false) {
        if (increase) {
            // Increase interval during failures
            APP_CONFIG.keepAlive.interval = Math.min(
                APP_CONFIG.keepAlive.interval * 1.5,
                120000 // Max 2 minutes
            );
        } else {
            // Reset to normal interval on success
            APP_CONFIG.keepAlive.interval = 30000; // 30 seconds
        }
        
        console.log(`🔄 Keep-alive frequency adjusted to ${APP_CONFIG.keepAlive.interval / 1000} seconds`);
        
        // Restart with new interval
        if (this.isEnabled) {
            this.start();
        }
    }

    getApiKey() {
        const apiKeyInput = document.getElementById('api-key');
        return apiKeyInput?.value || APP_CONFIG.apiKey;
    }

    updateStatus(status, responseTime = null, error = null) {
        const statusElement = document.getElementById('keep-alive-status');
        if (!statusElement) return;

        const now = new Date().toLocaleTimeString();
        let statusHTML = '';

        switch (status) {
            case 'active':
                statusHTML = `<span class="status-success">🟢 Active</span>`;
                break;
            case 'paused':
                statusHTML = `<span class="status-loading">⏸️ Paused</span>`;
                break;
            case 'inactive':
                statusHTML = `<span class="status-error">⏹️ Inactive</span>`;
                break;
            case 'success':
                statusHTML = `<span class="status-success">✅ Success</span> (${responseTime}ms at ${now})`;
                // Reset frequency on success
                if (this.failureCount >= this.maxConsecutiveFailures) {
                    this.adjustFrequency(false);
                }
                break;
            case 'error':
                statusHTML = `<span class="status-error">❌ Error</span> (${error} at ${now})`;
                break;
        }

        statusElement.innerHTML = statusHTML;
    }

    updateConnectionIndicator(isConnected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (isConnected) {
                statusDot.classList.add('connected');
                statusDot.classList.remove('error');
                statusText.textContent = 'Connected';
            } else {
                statusDot.classList.remove('connected');
                statusDot.classList.add('error');
                statusText.textContent = 'Connection Issues';
            }
        }
    }

    updateAnalytics(success, responseTime = null) {
        // Update keep-alive specific analytics
        if (!appState.keepAliveStats) {
            appState.keepAliveStats = {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0
            };
        }

        appState.keepAliveStats.totalRequests++;

        if (success) {
            appState.keepAliveStats.successfulRequests++;
            if (responseTime) {
                appState.keepAliveStats.totalResponseTime += responseTime;
                appState.keepAliveStats.averageResponseTime = 
                    appState.keepAliveStats.totalResponseTime / appState.keepAliveStats.successfulRequests;
            }
        } else {
            appState.keepAliveStats.failedRequests++;
        }

        // Update uptime indicator
        this.updateUptimeDisplay();
    }

    updateUptimeDisplay() {
        const uptimeElement = document.getElementById('api-uptime');
        if (!uptimeElement || !appState.keepAliveStats) return;

        const successRate = appState.keepAliveStats.totalRequests > 0 
            ? (appState.keepAliveStats.successfulRequests / appState.keepAliveStats.totalRequests * 100).toFixed(1)
            : 0;

        uptimeElement.textContent = `${successRate}%`;
        
        // Color code based on uptime
        if (successRate >= 95) {
            uptimeElement.className = 'status-success';
        } else if (successRate >= 80) {
            uptimeElement.className = 'status-warning';
        } else {
            uptimeElement.className = 'status-error';
        }
    }

    // Get current status for display
    getStatus() {
        return {
            enabled: this.isEnabled,
            active: !!this.intervalId,
            paused: this.isPaused,
            lastKeepAlive: this.lastKeepAliveTime,
            failureCount: this.failureCount,
            retryCount: this.retryCount,
            interval: APP_CONFIG.keepAlive.interval,
            stats: appState.keepAliveStats
        };
    }

    // Manual keep-alive trigger for testing
    async triggerManualKeepAlive() {
        console.log('🔄 Manual keep-alive triggered');
        await this.sendKeepAliveRequest();
    }

    // Enable/disable keep-alive programmatically
    setEnabled(enabled) {
        this.isEnabled = enabled;
        APP_CONFIG.keepAlive.enabled = enabled;
        
        const checkbox = document.getElementById('keep-alive-enabled');
        if (checkbox) {
            checkbox.checked = enabled;
        }
        
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
        
        localStorage.setItem('keep-alive-enabled', enabled);
    }

    // Destroy the manager
    destroy() {
        this.stop();
        this.isEnabled = false;
        this.isPaused = false;
        this.retryCount = 0;
        this.failureCount = 0;
        console.log('🗑️ Keep-Alive Manager destroyed');
    }
}