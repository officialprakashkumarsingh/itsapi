// Enhanced ItsApi Application - Fully Functional Version
console.log('🚀 Loading ItsApi...');

// API Configuration
const API_CONFIG = {
    baseUrl: 'https://ahamai-api.officialprakashkrsingh.workers.dev',
    apiKey: 'ahamaibyprakash25',
    endpoints: {
        models: '/v1/models',
        chatCompletions: '/v1/chat/completions'
    }
};

// Application State
const appState = {
    models: [],
    selectedModel: 'gpt-4o-mini',
    theme: 'system',
    modelStatuses: new Map(),
    lastStatusCheck: null,
    currentTab: 'testing',
    requestHistory: [],
    keepAliveInterval: null,
    analytics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        sessionStart: Date.now()
    }
};

// DOM Elements
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    apiKeyInput: document.getElementById('api-key'),
    toggleApiKeyBtn: document.getElementById('toggle-api-key'),
    baseUrlInput: document.getElementById('base-url'),
    testConnectionBtn: document.getElementById('test-connection'),
    fetchModelsBtn: document.getElementById('fetch-models'),
    modelsGrid: document.getElementById('models-grid'),
    modelsCount: document.getElementById('models-count'),
    endpointSelect: document.getElementById('endpoint-select'),
    modelSelect: document.getElementById('model-select'),
    userMessage: document.getElementById('user-message'),
    maxTokens: document.getElementById('max-tokens'),
    maxTokensRange: document.getElementById('max-tokens-range'),
    temperature: document.getElementById('temperature'),
    temperatureRange: document.getElementById('temperature-range'),
    sendRequestBtn: document.getElementById('send-request'),
    clearResponseBtn: document.getElementById('clear-response'),
    responseContainer: document.getElementById('response-container'),
    responseStatus: document.getElementById('response-status'),
    chatParams: document.getElementById('chat-params'),
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    mobileOverlay: document.getElementById('mobile-overlay'),
    closeMobileNav: document.getElementById('close-mobile-nav'),
    charCount: document.getElementById('char-count'),
    clearMessage: document.getElementById('clear-message'),
    copyResponse: document.getElementById('copy-response'),
    formatResponse: document.getElementById('format-response'),
    modelSearch: document.getElementById('model-search'),
    refreshModels: document.getElementById('refresh-models'),
    historySearch: document.getElementById('history-search'),
    clearHistory: document.getElementById('clear-history'),
    historyList: document.getElementById('history-list'),
    keepAliveCheckbox: document.getElementById('keep-alive-enabled'),
    totalRequestsHeader: document.getElementById('total-requests'),
    avgResponseTimeHeader: document.getElementById('avg-response-time')
};

// Utility Functions
const utils = {
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${elements.apiKeyInput?.value || API_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const startTime = Date.now();
        
        try {
            const response = await fetch(url, config);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const data = await response.json();
            
            // Update analytics
            appState.analytics.totalRequests++;
            appState.analytics.totalResponseTime += responseTime;
            
            if (response.ok) {
                appState.analytics.successfulRequests++;
            } else {
                appState.analytics.failedRequests++;
            }
            
            analyticsManager.updateUI();
            
            return {
                success: response.ok,
                status: response.status,
                data,
                responseTime,
                response
            };
        } catch (error) {
            appState.analytics.totalRequests++;
            appState.analytics.failedRequests++;
            analyticsManager.updateUI();
            
            return {
                success: false,
                error: error.message,
                status: 0
            };
        }
    },

    syntaxHighlight(json) {
        if (typeof json != "string") {
            json = JSON.stringify(json, undefined, 2);
        }
        
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    },

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-slide-up`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
};

// Theme Management
const themeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'system';
        this.setTheme(savedTheme);
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (appState.theme === 'system') {
                this.applySystemTheme();
            }
        });
        
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    setTheme(theme) {
        appState.theme = theme;
        localStorage.setItem('theme', theme);
        
        if (theme === 'system') {
            this.applySystemTheme();
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    },

    applySystemTheme() {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
    },

    toggleTheme() {
        const themes = ['system', 'light', 'dark'];
        const currentIndex = themes.indexOf(appState.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.setTheme(nextTheme);
        utils.showToast(`Theme changed to ${nextTheme}`, 'success');
    }
};

// Tab Management
const tabManager = {
    init() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.showTab(targetTab);
            });
        });

        // Show default tab
        this.showTab('testing');
    },

    showTab(tabName) {
        // Update state
        appState.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`)?.classList.add('active');

        // Initialize tab-specific features
        if (tabName === 'models') {
            modelStatusChecker.checkAllModels();
        } else if (tabName === 'analytics') {
            analyticsManager.updateUI();
        } else if (tabName === 'history') {
            historyManager.renderHistory();
        }
    }
};

// Keep-Alive Manager
const keepAliveManager = {
    init() {
        console.log('🔄 Initializing Keep-Alive Manager...');
        
        if (elements.keepAliveCheckbox) {
            const isEnabled = elements.keepAliveCheckbox.checked;
            if (isEnabled) {
                this.start();
            }
            
            elements.keepAliveCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.start();
                } else {
                    this.stop();
                }
                localStorage.setItem('keep-alive-enabled', e.target.checked);
            });
        } else {
            // Auto-start if no checkbox found
            this.start();
        }
    },

    start() {
        if (appState.keepAliveInterval) {
            this.stop();
        }

        console.log('🚀 Starting keep-alive requests every 30 seconds...');
        
        // Send immediate request
        this.sendKeepAliveRequest();
        
        // Set interval
        appState.keepAliveInterval = setInterval(() => {
            this.sendKeepAliveRequest();
        }, 30000);

        this.updateConnectionStatus('active');
    },

    stop() {
        if (appState.keepAliveInterval) {
            clearInterval(appState.keepAliveInterval);
            appState.keepAliveInterval = null;
            console.log('⏹️ Keep-alive requests stopped');
        }
        this.updateConnectionStatus('inactive');
    },

    async sendKeepAliveRequest() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${elements.apiKeyInput?.value || API_CONFIG.apiKey}`,
                    'X-Keep-Alive': 'true'
                }
            });

            if (response.ok) {
                console.log('💚 Keep-alive successful');
                this.updateConnectionStatus('connected');
            } else {
                console.warn('⚠️ Keep-alive failed:', response.status);
                this.updateConnectionStatus('error');
            }
        } catch (error) {
            console.warn('❌ Keep-alive error:', error.message);
            this.updateConnectionStatus('error');
        }
    },

    updateConnectionStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            statusDot.classList.remove('connected', 'error');
            
            switch (status) {
                case 'connected':
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Connected';
                    break;
                case 'error':
                    statusDot.classList.add('error');
                    statusText.textContent = 'Connection Issues';
                    break;
                case 'active':
                    statusText.textContent = 'Keep-Alive Active';
                    break;
                case 'inactive':
                    statusText.textContent = 'Keep-Alive Inactive';
                    break;
                default:
                    statusText.textContent = 'Disconnected';
            }
        }
    }
};

// Model Status Checker
const modelStatusChecker = {
    async checkModelStatus(modelId) {
        try {
            const result = await utils.makeRequest(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chatCompletions}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        model: modelId,
                        messages: [{ role: 'user', content: 'test' }],
                        max_tokens: 1
                    })
                }
            );

            const status = {
                id: modelId,
                status: result.success ? 'online' : 'offline',
                lastCheck: Date.now(),
                responseTime: result.responseTime || 0,
                error: result.error || null
            };

            appState.modelStatuses.set(modelId, status);
            return status;
        } catch (error) {
            const status = {
                id: modelId,
                status: 'error',
                lastCheck: Date.now(),
                error: error.message
            };
            appState.modelStatuses.set(modelId, status);
            return status;
        }
    },

    async checkAllModels() {
        if (appState.models.length === 0) return;

        console.log('🔄 Checking model status...');
        
        const statusPromises = appState.models.slice(0, 5).map(model => 
            this.checkModelStatus(model.id)
        );

        try {
            await Promise.allSettled(statusPromises);
            appState.lastStatusCheck = Date.now();
            apiManager.renderModels();
        } catch (error) {
            console.error('Error checking model statuses:', error);
        }
    },

    startRealTimeMonitoring() {
        setInterval(() => {
            if (appState.models.length > 0 && appState.currentTab === 'models') {
                this.checkAllModels();
            }
        }, 60000); // Check every minute when on models tab
    }
};

// API Manager
const apiManager = {
    async testConnection() {
        this.updateStatus('testing', 'Testing connection...');
        
        const result = await utils.makeRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`);
        
        if (result.success) {
            this.updateStatus('success', `Connected successfully (${result.status})`);
            utils.showToast('Connection successful!', 'success');
            return true;
        } else {
            this.updateStatus('error', `Connection failed: ${result.error || `HTTP ${result.status}`}`);
            utils.showToast('Connection failed', 'error');
            return false;
        }
    },

    async fetchModels() {
        this.updateStatus('loading', 'Fetching models...');
        
        const result = await utils.makeRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`);
        
        if (result.success && result.data.data) {
            appState.models = result.data.data;
            this.updateModelsUI();
            this.updateStatus('success', `Loaded ${appState.models.length} models`);
            utils.showToast(`Loaded ${appState.models.length} models`, 'success');
            
            // Start checking model statuses
            setTimeout(() => {
                modelStatusChecker.checkAllModels();
            }, 1000);
            
            return true;
        } else {
            this.updateStatus('error', `Failed to fetch models: ${result.error || `HTTP ${result.status}`}`);
            utils.showToast('Failed to fetch models', 'error');
            return false;
        }
    },

    updateModelsUI() {
        if (elements.modelsCount) {
            elements.modelsCount.textContent = `${appState.models.length} models`;
        }
        
        this.updateModelSelect();
        this.renderModels();
    },

    updateModelSelect() {
        if (!elements.modelSelect) return;
        
        elements.modelSelect.innerHTML = '';
        appState.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.id;
            if (model.id === appState.selectedModel) {
                option.selected = true;
            }
            elements.modelSelect.appendChild(option);
        });
    },

    renderModels() {
        if (!elements.modelsGrid) return;
        
        if (appState.models.length === 0) {
            elements.modelsGrid.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Click "Fetch Models" to load available models</p>
                </div>
            `;
            return;
        }

        const modelsHTML = appState.models.map(model => {
            const status = appState.modelStatuses.get(model.id);
            const statusClass = status ? `status-${status.status}` : 'status-unknown';
            const statusIcon = this.getStatusIcon(status?.status || 'unknown');
            const statusText = this.getStatusText(status);

            return `
                <div class="model-card ${model.id === appState.selectedModel ? 'selected' : ''}" 
                     data-model-id="${model.id}" 
                     onclick="apiManager.selectModel('${model.id}')">
                    <div class="model-header">
                        <div class="model-name">${model.id}</div>
                        <div class="model-status ${statusClass}" title="${statusText}">
                            ${statusIcon}
                        </div>
                    </div>
                    <div class="model-owner">${model.owned_by}</div>
                    ${status ? `
                        <div class="model-details">
                            <div class="status-text">${statusText}</div>
                            ${status.lastCheck ? `<div class="last-check">Checked: ${utils.formatTimestamp(status.lastCheck)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        elements.modelsGrid.innerHTML = modelsHTML;
    },

    getStatusIcon(status) {
        const icons = {
            online: '🟢',
            offline: '🔴',
            error: '🟡',
            unknown: '⚪',
            checking: '🔄'
        };
        return icons[status] || icons.unknown;
    },

    getStatusText(status) {
        if (!status) return 'Status unknown';
        
        const texts = {
            online: 'Online',
            offline: 'Offline',
            error: `Error: ${status.error}`,
            unknown: 'Status unknown'
        };
        
        return texts[status.status] || 'Status unknown';
    },

    selectModel(modelId) {
        appState.selectedModel = modelId;
        if (elements.modelSelect) {
            elements.modelSelect.value = modelId;
        }
        this.renderModels();
        utils.showToast(`Selected model: ${modelId}`, 'success');
    },

    async sendRequest() {
        const endpoint = elements.endpointSelect?.value || '/v1/chat/completions';
        
        if (endpoint === '/v1/models') {
            return this.sendModelsRequest();
        } else if (endpoint === '/v1/chat/completions') {
            return this.sendChatRequest();
        }
    },

    async sendModelsRequest() {
        this.updateResponseStatus('loading', 'Fetching models...');
        
        const result = await utils.makeRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`);
        
        this.displayResponse(result);
        
        // Add to history
        historyManager.addToHistory({
            method: 'GET',
            endpoint: '/v1/models',
            timestamp: Date.now(),
            status: result.status,
            responseTime: result.responseTime || 0
        });
    },

    async sendChatRequest() {
        const requestData = {
            model: elements.modelSelect?.value || appState.selectedModel,
            messages: [
                {
                    role: 'user',
                    content: elements.userMessage?.value || 'Hello, how are you?'
                }
            ],
            max_tokens: parseInt(elements.maxTokens?.value || 150),
            temperature: parseFloat(elements.temperature?.value || 0.7)
        };

        this.updateResponseStatus('loading', 'Sending request...');
        
        const result = await utils.makeRequest(
            `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chatCompletions}`,
            {
                method: 'POST',
                body: JSON.stringify(requestData)
            }
        );
        
        this.displayResponse(result);
        
        // Add to history
        historyManager.addToHistory({
            method: 'POST',
            endpoint: '/v1/chat/completions',
            model: requestData.model,
            message: requestData.messages[0].content,
            timestamp: Date.now(),
            status: result.status,
            responseTime: result.responseTime || 0,
            response: result.data
        });
    },

    displayResponse(result) {
        if (!elements.responseContainer) return;
        
        if (result.success) {
            this.updateResponseStatus('success', `${result.status} OK`);
            elements.responseContainer.innerHTML = `<pre class="response-json">${utils.syntaxHighlight(result.data)}</pre>`;
        } else {
            this.updateResponseStatus('error', `${result.status} Error`);
            elements.responseContainer.innerHTML = `<pre class="response-json">${utils.syntaxHighlight({
                error: result.error || 'Request failed',
                status: result.status,
                timestamp: new Date().toISOString()
            })}</pre>`;
        }
    },

    clearResponse() {
        if (!elements.responseContainer) return;
        
        elements.responseContainer.innerHTML = `
            <div class="empty-state">
                <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <p>No response yet</p>
                <p class="text-muted">Send a request to see the response</p>
            </div>
        `;
        if (elements.responseStatus) {
            elements.responseStatus.innerHTML = '';
        }
    },

    updateStatus(type, message) {
        if (!elements.responseStatus) return;
        
        const statusClasses = {
            loading: 'status-loading',
            success: 'status-success',
            error: 'status-error',
            testing: 'status-loading'
        };
        
        elements.responseStatus.className = `response-status ${statusClasses[type]}`;
        elements.responseStatus.textContent = message;
    },

    updateResponseStatus(type, message) {
        this.updateStatus(type, message);
    }
};

// Analytics Manager
const analyticsManager = {
    updateUI() {
        const totalRequests = appState.analytics.totalRequests;
        const avgResponseTime = totalRequests > 0 
            ? Math.round(appState.analytics.totalResponseTime / totalRequests)
            : 0;

        // Update header stats
        if (elements.totalRequestsHeader) {
            elements.totalRequestsHeader.textContent = totalRequests;
        }
        if (elements.avgResponseTimeHeader) {
            elements.avgResponseTimeHeader.textContent = `${avgResponseTime}ms`;
        }

        // Update analytics tab
        const totalRequestsStat = document.getElementById('total-requests-stat');
        const avgResponseStat = document.getElementById('avg-response-stat');
        const successRateStat = document.getElementById('success-rate-stat');

        if (totalRequestsStat) {
            totalRequestsStat.textContent = totalRequests;
        }
        if (avgResponseStat) {
            avgResponseStat.textContent = `${avgResponseTime}ms`;
        }
        if (successRateStat) {
            const successRate = totalRequests > 0 
                ? Math.round((appState.analytics.successfulRequests / totalRequests) * 100)
                : 0;
            successRateStat.textContent = `${successRate}%`;
        }
    }
};

// History Manager
const historyManager = {
    addToHistory(request) {
        appState.requestHistory.unshift(request);
        
        // Limit history size
        if (appState.requestHistory.length > 100) {
            appState.requestHistory = appState.requestHistory.slice(0, 100);
        }
        
        // Save to localStorage
        localStorage.setItem('request-history', JSON.stringify(appState.requestHistory));
        
        // Update UI if on history tab
        if (appState.currentTab === 'history') {
            this.renderHistory();
        }
    },

    renderHistory() {
        if (!elements.historyList) return;
        
        if (appState.requestHistory.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-state">
                    <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <p>No history yet</p>
                    <p class="text-muted">Make some API requests to see them here</p>
                </div>
            `;
            return;
        }

        const historyHTML = appState.requestHistory.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-method ${item.method.toLowerCase()}">${item.method}</span>
                    <span class="history-timestamp">${utils.formatTimestamp(item.timestamp)}</span>
                </div>
                <div class="history-endpoint">${item.endpoint}</div>
                ${item.model ? `<div class="history-model">Model: ${item.model}</div>` : ''}
                ${item.message ? `<div class="history-message">${item.message.substring(0, 100)}${item.message.length > 100 ? '...' : ''}</div>` : ''}
                <div class="history-status">
                    <span class="history-status-code ${item.status >= 200 && item.status < 300 ? 'success' : 'error'}">
                        ${item.status}
                    </span>
                    <span class="history-response-time">${item.responseTime}ms</span>
                </div>
            </div>
        `).join('');

        elements.historyList.innerHTML = historyHTML;
    },

    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            appState.requestHistory = [];
            localStorage.removeItem('request-history');
            this.renderHistory();
            utils.showToast('History cleared', 'success');
        }
    }
};

// Mobile Manager
const mobileManager = {
    init() {
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', () => {
                this.openMobileNav();
            });
        }

        if (elements.closeMobileNav) {
            elements.closeMobileNav.addEventListener('click', () => {
                this.closeMobileNav();
            });
        }

        if (elements.mobileOverlay) {
            elements.mobileOverlay.addEventListener('click', (e) => {
                if (e.target === elements.mobileOverlay) {
                    this.closeMobileNav();
                }
            });
        }

        // Populate mobile nav with tab buttons
        this.populateMobileNav();
    },

    openMobileNav() {
        if (elements.mobileOverlay) {
            elements.mobileOverlay.classList.add('active');
        }
    },

    closeMobileNav() {
        if (elements.mobileOverlay) {
            elements.mobileOverlay.classList.remove('active');
        }
    },

    populateMobileNav() {
        const mobileNavContent = document.querySelector('.mobile-nav-content');
        if (!mobileNavContent) return;

        const tabs = [
            { id: 'testing', name: 'API Testing', icon: '⚡' },
            { id: 'models', name: 'Models', icon: '🤖' },
            { id: 'analytics', name: 'Analytics', icon: '📊' },
            { id: 'history', name: 'History', icon: '📝' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
        ];

        const navHTML = tabs.map(tab => `
            <button class="mobile-nav-item ${appState.currentTab === tab.id ? 'active' : ''}" 
                    onclick="tabManager.showTab('${tab.id}'); mobileManager.closeMobileNav();">
                ${tab.icon} ${tab.name}
            </button>
        `).join('');

        mobileNavContent.innerHTML = navHTML;
    }
};

// Event Handlers
const eventHandlers = {
    init() {
        // API Key toggle
        if (elements.toggleApiKeyBtn) {
            elements.toggleApiKeyBtn.addEventListener('click', () => {
                const input = elements.apiKeyInput;
                if (input) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        elements.toggleApiKeyBtn.textContent = 'Hide';
                    } else {
                        input.type = 'password';
                        elements.toggleApiKeyBtn.textContent = 'Show';
                    }
                }
            });
        }

        // Connection and model management
        if (elements.testConnectionBtn) {
            elements.testConnectionBtn.addEventListener('click', () => {
                apiManager.testConnection();
            });
        }

        if (elements.fetchModelsBtn) {
            elements.fetchModelsBtn.addEventListener('click', () => {
                apiManager.fetchModels();
            });
        }

        // Endpoint selection
        if (elements.endpointSelect) {
            elements.endpointSelect.addEventListener('change', () => {
                const endpoint = elements.endpointSelect.value;
                if (elements.chatParams) {
                    elements.chatParams.style.display = endpoint === '/v1/chat/completions' ? 'block' : 'none';
                }
            });
        }

        // Model selection
        if (elements.modelSelect) {
            elements.modelSelect.addEventListener('change', () => {
                appState.selectedModel = elements.modelSelect.value;
                apiManager.renderModels();
            });
        }

        // Request handling
        if (elements.sendRequestBtn) {
            elements.sendRequestBtn.addEventListener('click', () => {
                apiManager.sendRequest();
            });
        }

        if (elements.clearResponseBtn) {
            elements.clearResponseBtn.addEventListener('click', () => {
                apiManager.clearResponse();
            });
        }

        // Range sliders
        if (elements.maxTokensRange && elements.maxTokens) {
            elements.maxTokensRange.addEventListener('input', () => {
                elements.maxTokens.value = elements.maxTokensRange.value;
            });
            elements.maxTokens.addEventListener('input', () => {
                elements.maxTokensRange.value = elements.maxTokens.value;
            });
        }

        if (elements.temperatureRange && elements.temperature) {
            elements.temperatureRange.addEventListener('input', () => {
                elements.temperature.value = elements.temperatureRange.value;
            });
            elements.temperature.addEventListener('input', () => {
                elements.temperatureRange.value = elements.temperature.value;
            });
        }

        // Character count
        if (elements.userMessage && elements.charCount) {
            elements.userMessage.addEventListener('input', () => {
                elements.charCount.textContent = `${elements.userMessage.value.length} chars`;
            });
        }

        // Clear message
        if (elements.clearMessage && elements.userMessage) {
            elements.clearMessage.addEventListener('click', () => {
                elements.userMessage.value = '';
                if (elements.charCount) {
                    elements.charCount.textContent = '0 chars';
                }
            });
        }

        // Copy response
        if (elements.copyResponse) {
            elements.copyResponse.addEventListener('click', () => {
                const responseText = elements.responseContainer?.textContent || '';
                if (responseText) {
                    navigator.clipboard.writeText(responseText).then(() => {
                        utils.showToast('Response copied to clipboard', 'success');
                    }).catch(() => {
                        utils.showToast('Failed to copy response', 'error');
                    });
                }
            });
        }

        // Model search
        if (elements.modelSearch) {
            elements.modelSearch.addEventListener('input', utils.debounce(() => {
                this.filterModels(elements.modelSearch.value);
            }, 300));
        }

        // Refresh models
        if (elements.refreshModels) {
            elements.refreshModels.addEventListener('click', () => {
                modelStatusChecker.checkAllModels();
            });
        }

        // History search
        if (elements.historySearch) {
            elements.historySearch.addEventListener('input', utils.debounce(() => {
                this.filterHistory(elements.historySearch.value);
            }, 300));
        }

        // Clear history
        if (elements.clearHistory) {
            elements.clearHistory.addEventListener('click', () => {
                historyManager.clearHistory();
            });
        }

        // Auto-save form data
        const autoSaveElements = [
            'user-message',
            'max-tokens',
            'temperature',
            'api-key',
            'base-url'
        ];

        autoSaveElements.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', utils.debounce(() => {
                    localStorage.setItem(`form-${fieldId}`, element.value);
                }, 500));
            }
        });

        // Load saved form data
        this.loadSavedData();

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+Enter: Send request
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                if (appState.currentTab === 'testing') {
                    apiManager.sendRequest();
                }
            }
        });
    },

    filterModels(searchTerm) {
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            const modelName = card.querySelector('.model-name')?.textContent.toLowerCase() || '';
            const isVisible = modelName.includes(searchTerm.toLowerCase());
            card.style.display = isVisible ? 'block' : 'none';
        });
    },

    filterHistory(searchTerm) {
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm.toLowerCase());
            item.style.display = isVisible ? 'block' : 'none';
        });
    },

    loadSavedData() {
        try {
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

            // Update range sliders
            if (elements.maxTokens && elements.maxTokensRange) {
                elements.maxTokensRange.value = elements.maxTokens.value;
            }
            if (elements.temperature && elements.temperatureRange) {
                elements.temperatureRange.value = elements.temperature.value;
            }

            // Update character count
            if (elements.userMessage && elements.charCount) {
                elements.charCount.textContent = `${elements.userMessage.value.length} chars`;
            }

            // Load analytics
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
                } catch (e) {
                    console.warn('Failed to load saved history:', e);
                }
            }

            // Load keep-alive setting
            const keepAliveSetting = localStorage.getItem('keep-alive-enabled');
            if (keepAliveSetting !== null && elements.keepAliveCheckbox) {
                elements.keepAliveCheckbox.checked = JSON.parse(keepAliveSetting);
            }

        } catch (error) {
            console.warn('Error loading saved data:', error);
        }
    }
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing ItsApi...');
    
    try {
        // Initialize all managers
        themeManager.init();
        tabManager.init();
        mobileManager.init();
        eventHandlers.init();
        keepAliveManager.init();
        analyticsManager.updateUI();
        
        // Start real-time monitoring
        modelStatusChecker.startRealTimeMonitoring();
        
        // Set initial UI state
        if (elements.chatParams) {
            elements.chatParams.style.display = 'block';
        }
        apiManager.clearResponse();
        
        // Auto-fetch models after initialization
        setTimeout(() => {
            apiManager.fetchModels();
        }, 1000);
        
        console.log('✅ ItsApi initialized successfully!');
        utils.showToast('ItsApi initialized successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Failed to initialize ItsApi:', error);
        utils.showToast('Failed to initialize application', 'error');
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    utils.showToast('An unexpected error occurred', 'error');
});

// Expose API for debugging
window.ItsApi = {
    appState,
    apiManager,
    themeManager,
    modelStatusChecker,
    utils,
    tabManager,
    keepAliveManager,
    analyticsManager,
    historyManager
};

console.log('✅ ItsApi script loaded successfully');