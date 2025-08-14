// API Configuration
const API_CONFIG = {
    baseUrl: 'https://ahamai-api.officialprakashkrsingh.workers.dev',
    defaultApiKey: 'ahamaibyprakash25'
};

// Application State
let appState = {
    models: [],
    imageModels: [],
    keepAliveInterval: null,
    currentEndpointType: 'chat'
};

// DOM Elements
const elements = {
    apiKey: document.getElementById('api-key'),
    toggleApiKey: document.getElementById('toggle-api-key'),
    endpointType: document.getElementById('endpoint-type'),
    connectApi: document.getElementById('connect-api'),
    
    // Chat elements
    chatSection: document.getElementById('chat-section'),
    modelSelect: document.getElementById('model-select'),
    messageInput: document.getElementById('message-input'),
    maxTokens: document.getElementById('max-tokens'),
    temperature: document.getElementById('temperature'),
    sendRequest: document.getElementById('send-request'),
    clearRequest: document.getElementById('clear-request'),
    
    // Image elements
    imageSection: document.getElementById('image-section'),
    imageModelSelect: document.getElementById('image-model-select'),
    imagePrompt: document.getElementById('image-prompt'),
    imageSize: document.getElementById('image-size'),
    generateImage: document.getElementById('generate-image'),
    clearImageRequest: document.getElementById('clear-image-request'),
    
    // Response elements
    loading: document.getElementById('loading'),
    responseOutput: document.getElementById('response-output'),
    imageOutput: document.getElementById('image-output'),
    generatedImage: document.getElementById('generated-image'),
    copyResponse: document.getElementById('copy-response'),
    
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    toastContainer: document.getElementById('toast-container')
};

// Utility Functions
function makeRequest(url, options = {}) {
    const apiKey = elements.apiKey.value || API_CONFIG.defaultApiKey;
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

function highlightJSON(json) {
    return json
        .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
        .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
        .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
    
    showToast(`Theme switched to ${newTheme} mode`, 'success');
}

// Keep-Alive Management (Background service to prevent API from sleeping)
const keepAliveManager = {
    start() {
        if (appState.keepAliveInterval) return;
        
        appState.keepAliveInterval = setInterval(() => {
            this.sendKeepAliveRequest();
        }, 30000); // Every 30 seconds
        
        console.log('Keep-alive service started');
    },
    
    stop() {
        if (appState.keepAliveInterval) {
            clearInterval(appState.keepAliveInterval);
            appState.keepAliveInterval = null;
            console.log('Keep-alive service stopped');
        }
    },
    
    async sendKeepAliveRequest() {
        try {
            const response = await makeRequest(`${API_CONFIG.baseUrl}/v1/models`);
            if (response.ok) {
                console.log('Keep-alive request successful');
            }
        } catch (error) {
            console.log('Keep-alive request failed:', error);
        }
    }
};

// API Functions
async function connectAndFetchModels() {
    if (!elements.apiKey.value) {
        elements.apiKey.value = API_CONFIG.defaultApiKey;
    }
    
    elements.loading.style.display = 'flex';
    
    try {
        // Fetch chat models
        const modelsResponse = await makeRequest(`${API_CONFIG.baseUrl}/v1/models`);
        const modelsData = await modelsResponse.json();
        
        if (modelsData.data) {
            appState.models = modelsData.data;
            populateModelSelect(elements.modelSelect, appState.models);
        }
        
        // Fetch image models
        const imageModelsResponse = await makeRequest(`${API_CONFIG.baseUrl}/v1/images/models`);
        const imageModelsData = await imageModelsResponse.json();
        
        if (imageModelsData.data) {
            appState.imageModels = imageModelsData.data;
            populateModelSelect(elements.imageModelSelect, appState.imageModels);
        }
        
        showToast('Connected successfully! Models loaded.', 'success');
        
        // Start keep-alive service
        keepAliveManager.start();
        
    } catch (error) {
        console.error('Connection failed:', error);
        showToast('Failed to connect to API', 'error');
    } finally {
        elements.loading.style.display = 'none';
    }
}

function populateModelSelect(selectElement, models) {
    selectElement.innerHTML = '<option value="">Select a model</option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name || model.id} (${model.provider || 'Unknown'})`;
        selectElement.appendChild(option);
    });
}

async function sendChatRequest() {
    const model = elements.modelSelect.value;
    const message = elements.messageInput.value.trim();
    
    if (!model || !message) {
        showToast('Please select a model and enter a message', 'warning');
        return;
    }
    
    elements.loading.style.display = 'flex';
    elements.responseOutput.style.display = 'block';
    elements.imageOutput.style.display = 'none';
    
    const requestBody = {
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: parseInt(elements.maxTokens.value),
        temperature: parseFloat(elements.temperature.value)
    };
    
    try {
        const response = await makeRequest(`${API_CONFIG.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        const formattedJson = formatJSON(data);
        elements.responseOutput.innerHTML = highlightJSON(formattedJson);
        elements.copyResponse.style.display = 'inline-block';
        
        showToast('Request completed successfully', 'success');
        
    } catch (error) {
        elements.responseOutput.textContent = `Error: ${error.message}`;
        showToast('Request failed', 'error');
    } finally {
        elements.loading.style.display = 'none';
    }
}

async function generateImage() {
    const model = elements.imageModelSelect.value;
    const prompt = elements.imagePrompt.value.trim();
    
    if (!model || !prompt) {
        showToast('Please select a model and enter a prompt', 'warning');
        return;
    }
    
    elements.loading.style.display = 'flex';
    elements.responseOutput.style.display = 'none';
    elements.imageOutput.style.display = 'block';
    
    const requestBody = {
        model: model,
        prompt: prompt,
        n: 1,
        size: elements.imageSize.value
    };
    
    try {
        const response = await makeRequest(`${API_CONFIG.baseUrl}/v1/images/generations`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            // The API returns image data directly
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            elements.generatedImage.src = imageUrl;
            elements.copyResponse.style.display = 'inline-block';
            
            // Also show response in text format for debugging
            elements.responseOutput.textContent = 'Image generated successfully';
            elements.responseOutput.style.display = 'block';
            
            showToast('Image generated successfully', 'success');
        } else {
            const errorData = await response.json();
            elements.responseOutput.textContent = `Error: ${JSON.stringify(errorData, null, 2)}`;
            elements.responseOutput.style.display = 'block';
            elements.imageOutput.style.display = 'none';
            showToast('Image generation failed', 'error');
        }
        
    } catch (error) {
        elements.responseOutput.textContent = `Error: ${error.message}`;
        elements.responseOutput.style.display = 'block';
        elements.imageOutput.style.display = 'none';
        showToast('Request failed', 'error');
    } finally {
        elements.loading.style.display = 'none';
    }
}

function switchEndpointType() {
    const type = elements.endpointType.value;
    appState.currentEndpointType = type;
    
    if (type === 'chat') {
        elements.chatSection.style.display = 'block';
        elements.imageSection.style.display = 'none';
    } else {
        elements.chatSection.style.display = 'none';
        elements.imageSection.style.display = 'block';
    }
}

function clearChatForm() {
    elements.messageInput.value = '';
    elements.modelSelect.value = '';
    elements.maxTokens.value = '150';
    elements.temperature.value = '0.7';
}

function clearImageForm() {
    elements.imagePrompt.value = '';
    elements.imageModelSelect.value = '';
    elements.imageSize.value = '1024x1024';
}

function clearResponse() {
    elements.responseOutput.textContent = 'Response will appear here...';
    elements.imageOutput.style.display = 'none';
    elements.copyResponse.style.display = 'none';
}

function copyResponse() {
    const text = elements.responseOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy response', 'error');
    });
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // API key toggle
    elements.toggleApiKey.addEventListener('click', () => {
        const type = elements.apiKey.type === 'password' ? 'text' : 'password';
        elements.apiKey.type = type;
        elements.toggleApiKey.textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    // Connect API
    elements.connectApi.addEventListener('click', connectAndFetchModels);
    
    // Endpoint type switching
    elements.endpointType.addEventListener('change', switchEndpointType);
    
    // Chat completions
    elements.sendRequest.addEventListener('click', sendChatRequest);
    elements.clearRequest.addEventListener('click', () => {
        clearChatForm();
        clearResponse();
    });
    
    // Image generation
    elements.generateImage.addEventListener('click', generateImage);
    elements.clearImageRequest.addEventListener('click', () => {
        clearImageForm();
        clearResponse();
    });
    
    // Response actions
    elements.copyResponse.addEventListener('click', copyResponse);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (appState.currentEndpointType === 'chat') {
                sendChatRequest();
            } else {
                generateImage();
            }
        }
    });
}

// Load saved data
function loadSavedData() {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        elements.apiKey.value = savedApiKey;
    } else {
        elements.apiKey.value = API_CONFIG.defaultApiKey;
    }
    
    const savedEndpointType = localStorage.getItem('endpointType');
    if (savedEndpointType) {
        elements.endpointType.value = savedEndpointType;
        switchEndpointType();
    }
}

// Save data
function saveData() {
    localStorage.setItem('apiKey', elements.apiKey.value);
    localStorage.setItem('endpointType', elements.endpointType.value);
}

// Auto-save on input changes
function setupAutoSave() {
    elements.apiKey.addEventListener('input', saveData);
    elements.endpointType.addEventListener('change', saveData);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSavedData();
    setupEventListeners();
    setupAutoSave();
    
    // Auto-connect on page load
    setTimeout(() => {
        connectAndFetchModels();
    }, 500);
    
    console.log('ItsApi initialized successfully');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    keepAliveManager.stop();
});