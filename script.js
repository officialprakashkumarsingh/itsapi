// Enhanced ItsApi Application
// Import the main application module
import('./js/app.js').then(({ default: app }) => {
    console.log('✅ ItsApi application loaded successfully');
}).catch(error => {
    console.error('❌ Failed to load ItsApi application:', error);
    
    // Fallback for browsers that don't support ES modules
    console.log('🔄 Loading fallback version...');
    loadFallbackVersion();
});

// Fallback for older browsers or when modules fail to load
function loadFallbackVersion() {
    // Simplified version of the original script for compatibility
    const API_CONFIG = {
        baseUrl: 'https://ahamai-api.officialprakashkrsingh.workers.dev',
        apiKey: 'ahamaibyprakash25',
        endpoints: {
            models: '/v1/models',
            chatCompletions: '/v1/chat/completions'
        }
    };

    const appState = {
        models: [],
        selectedModel: 'gpt-4o-mini',
        theme: 'system',
        modelStatuses: new Map(),
        lastStatusCheck: null,
        keepAliveInterval: null
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
    temperature: document.getElementById('temperature'),
    sendRequestBtn: document.getElementById('send-request'),
    clearResponseBtn: document.getElementById('clear-response'),
    responseContainer: document.getElementById('response-container'),
    responseStatus: document.getElementById('response-status'),
    chatParams: document.getElementById('chat-params')
};

// Utility Functions
const utils = {
    // HTTP Request Helper
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${elements.apiKeyInput.value || API_CONFIG.apiKey}`,
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

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return {
                success: response.ok,
                status: response.status,
                data,
                response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 0
            };
        }
    },

    // JSON Syntax Highlighting
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

    // Format timestamp
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    },

    // Debounce function
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
    }
};

// Theme Management
const themeManager = {
    init() {
        // Check for saved theme preference or default to system
        const savedTheme = localStorage.getItem('theme') || 'system';
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (appState.theme === 'system') {
                this.applySystemTheme();
            }
        });
        
        // Theme toggle button
        elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
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

        // Update status indicator
        this.updateStatusIndicator('checking');

        const statusPromises = appState.models.map(model => 
            this.checkModelStatus(model.id)
        );

        try {
            await Promise.allSettled(statusPromises);
            appState.lastStatusCheck = Date.now();
            this.updateModelsDisplay();
            this.updateStatusIndicator('completed');
        } catch (error) {
            this.updateStatusIndicator('error');
            console.error('Error checking model statuses:', error);
        }
    },

    updateStatusIndicator(status) {
        const indicator = document.getElementById('status-indicator');
        if (!indicator) return;

        const statusClasses = {
            checking: 'status-loading',
            completed: 'status-success',
            error: 'status-error'
        };

        const statusTexts = {
            checking: 'Checking model status...',
            completed: `Last checked: ${utils.formatTimestamp(Date.now())}`,
            error: 'Error checking model status'
        };

        indicator.className = `response-status ${statusClasses[status]}`;
        indicator.textContent = statusTexts[status];
    },

    startRealTimeMonitoring() {
        // Check model status every 30 seconds
        setInterval(() => {
            if (appState.models.length > 0) {
                this.checkAllModels();
            }
        }, 30000);
    },

    // Keep-alive functionality for Render.com
    startKeepAlive() {
        console.log('🚀 Starting keep-alive requests to prevent API sleep...');
        
        // Send keep-alive request immediately
        this.sendKeepAliveRequest();
        
        // Then send every 30 seconds
        appState.keepAliveInterval = setInterval(() => {
            this.sendKeepAliveRequest();
        }, 30000);
    },

    async sendKeepAliveRequest() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${elements.apiKeyInput.value || API_CONFIG.apiKey}`,
                    'X-Keep-Alive': 'true'
                }
            });

            if (response.ok) {
                console.log('💚 Keep-alive request successful');
                // Update connection status
                const statusDot = document.querySelector('.status-dot');
                const statusText = document.querySelector('.status-text');
                if (statusDot && statusText) {
                    statusDot.classList.add('connected');
                    statusDot.classList.remove('error');
                    statusText.textContent = 'Connected';
                }
            } else {
                console.warn('⚠️ Keep-alive request failed:', response.status);
            }
        } catch (error) {
            console.warn('❌ Keep-alive error:', error.message);
        }
    },

    stopKeepAlive() {
        if (appState.keepAliveInterval) {
            clearInterval(appState.keepAliveInterval);
            appState.keepAliveInterval = null;
            console.log('⏹️ Keep-alive stopped');
        }
    },

    updateModelsDisplay() {
        if (!elements.modelsGrid) return;
        apiManager.renderModels();
    }
};

// API Manager
const apiManager = {
    async testConnection() {
        this.updateStatus('testing', 'Testing connection...');
        
        const result = await utils.makeRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.models}`);
        
        if (result.success) {
            this.updateStatus('success', `Connected successfully (${result.status})`);
            return true;
        } else {
            this.updateStatus('error', `Connection failed: ${result.error || `HTTP ${result.status}`}`);
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
            
            // Start checking model statuses
            setTimeout(() => {
                modelStatusChecker.checkAllModels();
            }, 1000);
            
            return true;
        } else {
            this.updateStatus('error', `Failed to fetch models: ${result.error || `HTTP ${result.status}`}`);
            return false;
        }
    },

    updateModelsUI() {
        // Update models count
        elements.modelsCount.textContent = `${appState.models.length} models`;
        
        // Update model select dropdown
        this.updateModelSelect();
        
        // Render models grid with status
        this.renderModels();
    },

    updateModelSelect() {
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

        // Add status indicator if it doesn't exist
        if (!document.getElementById('status-indicator')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'status-indicator';
            statusIndicator.className = 'response-status';
            elements.modelsGrid.parentElement.insertBefore(statusIndicator, elements.modelsGrid);
        }
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
        elements.modelSelect.value = modelId;
        this.renderModels();
    },

    async sendRequest() {
        const endpoint = elements.endpointSelect.value;
        
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
    },

    async sendChatRequest() {
        const requestData = {
            model: elements.modelSelect.value,
            messages: [
                {
                    role: 'user',
                    content: elements.userMessage.value
                }
            ],
            max_tokens: parseInt(elements.maxTokens.value),
            temperature: parseFloat(elements.temperature.value)
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
    },

    displayResponse(result) {
        const container = elements.responseContainer;
        
        if (result.success) {
            this.updateResponseStatus('success', `${result.status} OK`);
            container.innerHTML = `<pre class="response-json">${utils.syntaxHighlight(result.data)}</pre>`;
        } else {
            this.updateResponseStatus('error', `${result.status} Error`);
            container.innerHTML = `<pre class="response-json">${utils.syntaxHighlight({
                error: result.error || 'Request failed',
                status: result.status,
                timestamp: new Date().toISOString()
            })}</pre>`;
        }
    },

    clearResponse() {
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
        elements.responseStatus.innerHTML = '';
    },

    updateStatus(type, message) {
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

// Event Handlers
const eventHandlers = {
    init() {
        // API Key toggle
        elements.toggleApiKeyBtn.addEventListener('click', () => {
            const input = elements.apiKeyInput;
            if (input.type === 'password') {
                input.type = 'text';
                elements.toggleApiKeyBtn.textContent = 'Hide';
            } else {
                input.type = 'password';
                elements.toggleApiKeyBtn.textContent = 'Show';
            }
        });

        // Connection and model management
        elements.testConnectionBtn.addEventListener('click', () => {
            apiManager.testConnection();
        });

        elements.fetchModelsBtn.addEventListener('click', () => {
            apiManager.fetchModels();
        });

        // Endpoint selection
        elements.endpointSelect.addEventListener('change', () => {
            const endpoint = elements.endpointSelect.value;
            elements.chatParams.style.display = endpoint === '/v1/chat/completions' ? 'block' : 'none';
        });

        // Model selection
        elements.modelSelect.addEventListener('change', () => {
            appState.selectedModel = elements.modelSelect.value;
            apiManager.renderModels();
        });

        // Request handling
        elements.sendRequestBtn.addEventListener('click', () => {
            apiManager.sendRequest();
        });

        elements.clearResponseBtn.addEventListener('click', () => {
            apiManager.clearResponse();
        });

        // Auto-save form data
        const autoSaveElements = [
            elements.userMessage,
            elements.maxTokens,
            elements.temperature
        ];

        autoSaveElements.forEach(element => {
            if (element) {
                element.addEventListener('input', utils.debounce(() => {
                    localStorage.setItem(element.id, element.value);
                }, 500));
            }
        });

        // Load saved form data
        this.loadSavedData();
    },

    loadSavedData() {
        const savedData = {
            'user-message': localStorage.getItem('user-message'),
            'max-tokens': localStorage.getItem('max-tokens'),
            'temperature': localStorage.getItem('temperature')
        };

        Object.entries(savedData).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    themeManager.init();
    eventHandlers.init();
    
    // Set initial UI state
    elements.chatParams.style.display = 'block'; // Default to chat completions
    apiManager.clearResponse();
    
    // Start real-time monitoring
    modelStatusChecker.startRealTimeMonitoring();
    
    // Start keep-alive for Render.com hosting
    modelStatusChecker.startKeepAlive();
    
    // Auto-fetch models on load
    setTimeout(() => {
        apiManager.fetchModels();
    }, 1000);
    
    console.log('ItsApi initialized successfully with keep-alive enabled');
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

    // Expose API for debugging
    window.ItsApi = {
        appState,
        apiManager,
        themeManager,
        modelStatusChecker,
        utils
    };

    console.log('✅ Fallback ItsApi initialized successfully');
}