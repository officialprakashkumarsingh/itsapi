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
    currentEndpointType: 'chat',
    lastGeneratedImage: null
};

// DOM Elements
const elements = {
    // Header elements
    themeToggle: document.getElementById('theme-toggle'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    connectApi: document.getElementById('connect-api'),
    
    // Configuration elements
    apiKey: document.getElementById('api-key'),
    toggleApiKey: document.getElementById('toggle-api-key'),
    chatEndpoint: document.getElementById('chat-endpoint'),
    imageEndpoint: document.getElementById('image-endpoint'),
    
    // Chat elements
    chatSection: document.getElementById('chat-section'),
    modelSelect: document.getElementById('model-select'),
    messageInput: document.getElementById('message-input'),
    charCount: document.getElementById('char-count'),
    maxTokensSlider: document.getElementById('max-tokens-slider'),
    maxTokens: document.getElementById('max-tokens'),
    temperatureSlider: document.getElementById('temperature-slider'),
    temperature: document.getElementById('temperature'),
    sendRequest: document.getElementById('send-request'),
    clearRequest: document.getElementById('clear-request'),
    
    // Image elements
    imageSection: document.getElementById('image-section'),
    imageModelSelect: document.getElementById('image-model-select'),
    imagePrompt: document.getElementById('image-prompt'),
    imageCharCount: document.getElementById('image-char-count'),
    generateImage: document.getElementById('generate-image'),
    clearImageRequest: document.getElementById('clear-image-request'),
    
    // Response elements
    loading: document.getElementById('loading'),
    responseContainer: document.getElementById('response-container'),
    responseOutput: document.getElementById('response-output'),
    imageResponse: document.getElementById('image-response'),
    generatedImage: document.getElementById('generated-image'),
    imageSizeDisplay: document.getElementById('image-size-display'),
    imageModelDisplay: document.getElementById('image-model-display'),
    copyResponse: document.getElementById('copy-response'),
    downloadImage: document.getElementById('download-image'),
    
    // Modal elements
    viewFullscreen: document.getElementById('view-fullscreen'),
    shareImage: document.getElementById('share-image'),
    fullscreenModal: document.getElementById('fullscreen-modal'),
    fullscreenImage: document.getElementById('fullscreen-image'),
    closeFullscreen: document.getElementById('close-fullscreen'),
    
    // Toast container
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

function updateConnectionStatus(status) {
    elements.statusDot.className = 'status-dot';
    
    switch (status) {
        case 'connected':
            elements.statusDot.classList.add('connected');
            elements.statusText.textContent = 'Connected';
            break;
        case 'error':
            elements.statusDot.classList.add('error');
            elements.statusText.textContent = 'Connection Error';
            break;
        default:
            elements.statusText.textContent = 'Disconnected';
    }
}

function updateCharCount(textArea, countElement) {
    const count = textArea.value.length;
    countElement.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

function getSelectedImageSize() {
    const sizeRadios = document.querySelectorAll('input[name="image-size"]');
    for (const radio of sizeRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return '1024x1024';
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
    
    showToast(`Theme switched to ${newTheme} mode`, 'success');
}

// Keep-Alive Management
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
                updateConnectionStatus('connected');
            } else {
                updateConnectionStatus('error');
            }
        } catch (error) {
            console.log('Keep-alive request failed:', error);
            updateConnectionStatus('error');
        }
    }
};

// API Functions
async function connectAndFetchModels() {
    if (!elements.apiKey.value) {
        elements.apiKey.value = API_CONFIG.defaultApiKey;
    }
    
    elements.loading.style.display = 'flex';
    elements.connectApi.disabled = true;
    
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
        
        updateConnectionStatus('connected');
        showToast('Connected successfully! Models loaded.', 'success');
        
        // Start keep-alive service
        keepAliveManager.start();
        
    } catch (error) {
        console.error('Connection failed:', error);
        updateConnectionStatus('error');
        showToast('Failed to connect to API', 'error');
    } finally {
        elements.loading.style.display = 'none';
        elements.connectApi.disabled = false;
    }
}

function populateModelSelect(selectElement, models) {
    selectElement.innerHTML = '<option value="">Select a model</option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name || model.id}${model.provider ? ` (${model.provider})` : ''}`;
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
    elements.responseContainer.style.display = 'block';
    elements.imageResponse.style.display = 'none';
    elements.sendRequest.disabled = true;
    
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
        elements.copyResponse.style.display = 'inline-flex';
        elements.downloadImage.style.display = 'none';
        
        showToast('Request completed successfully', 'success');
        
    } catch (error) {
        elements.responseOutput.textContent = `Error: ${error.message}`;
        showToast('Request failed', 'error');
    } finally {
        elements.loading.style.display = 'none';
        elements.sendRequest.disabled = false;
    }
}

async function generateImage() {
    const model = elements.imageModelSelect.value;
    const prompt = elements.imagePrompt.value.trim();
    const size = getSelectedImageSize();
    
    if (!model || !prompt) {
        showToast('Please select a model and enter a prompt', 'warning');
        return;
    }
    
    elements.loading.style.display = 'flex';
    elements.responseContainer.style.display = 'none';
    elements.imageResponse.style.display = 'block';
    elements.generateImage.disabled = true;
    
    const requestBody = {
        model: model,
        prompt: prompt,
        n: 1,
        size: size
    };
    
    try {
        const response = await makeRequest(`${API_CONFIG.baseUrl}/v1/images/generations`, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            // The API returns image data directly as binary
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Display the image
            elements.generatedImage.src = imageUrl;
            elements.generatedImage.onload = () => {
                const img = elements.generatedImage;
                elements.imageSizeDisplay.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                elements.imageModelDisplay.textContent = model;
            };
            
            // Store for download functionality
            appState.lastGeneratedImage = {
                blob: blob,
                url: imageUrl,
                model: model,
                prompt: prompt,
                size: size
            };
            
            // Show action buttons
            elements.copyResponse.style.display = 'none';
            elements.downloadImage.style.display = 'inline-flex';
            
            // Show response text
            elements.responseContainer.style.display = 'block';
            elements.responseOutput.textContent = `Image generated successfully!\n\nModel: ${model}\nPrompt: ${prompt}\nSize: ${size}`;
            
            showToast('Image generated successfully', 'success');
        } else {
            const errorData = await response.json();
            elements.responseOutput.textContent = `Error: ${JSON.stringify(errorData, null, 2)}`;
            elements.responseContainer.style.display = 'block';
            elements.imageResponse.style.display = 'none';
            showToast('Image generation failed', 'error');
        }
        
    } catch (error) {
        elements.responseOutput.textContent = `Error: ${error.message}`;
        elements.responseContainer.style.display = 'block';
        elements.imageResponse.style.display = 'none';
        showToast('Request failed', 'error');
    } finally {
        elements.loading.style.display = 'none';
        elements.generateImage.disabled = false;
    }
}

function switchEndpointType() {
    if (elements.chatEndpoint.checked) {
        appState.currentEndpointType = 'chat';
        elements.chatSection.style.display = 'block';
        elements.imageSection.style.display = 'none';
    } else {
        appState.currentEndpointType = 'images';
        elements.chatSection.style.display = 'none';
        elements.imageSection.style.display = 'block';
    }
    saveData();
}

function clearChatForm() {
    elements.messageInput.value = '';
    elements.modelSelect.value = '';
    elements.maxTokens.value = '150';
    elements.maxTokensSlider.value = '150';
    elements.temperature.value = '0.7';
    elements.temperatureSlider.value = '0.7';
    updateCharCount(elements.messageInput, elements.charCount);
}

function clearImageForm() {
    elements.imagePrompt.value = '';
    elements.imageModelSelect.value = '';
    document.getElementById('size-1024').checked = true;
    updateCharCount(elements.imagePrompt, elements.imageCharCount);
}

function clearResponse() {
    elements.responseOutput.textContent = 'Response will appear here...';
    elements.imageResponse.style.display = 'none';
    elements.copyResponse.style.display = 'none';
    elements.downloadImage.style.display = 'none';
    
    if (appState.lastGeneratedImage) {
        URL.revokeObjectURL(appState.lastGeneratedImage.url);
        appState.lastGeneratedImage = null;
    }
}

function copyResponse() {
    const text = elements.responseOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy response', 'error');
    });
}

function downloadImage() {
    if (!appState.lastGeneratedImage) {
        showToast('No image to download', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = appState.lastGeneratedImage.url;
    link.download = `itsapi-generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Image downloaded', 'success');
}

function viewFullscreen() {
    if (!appState.lastGeneratedImage) return;
    
    elements.fullscreenImage.src = appState.lastGeneratedImage.url;
    elements.fullscreenModal.style.display = 'flex';
}

function closeFullscreen() {
    elements.fullscreenModal.style.display = 'none';
}

async function shareImage() {
    if (!appState.lastGeneratedImage || !navigator.share) {
        showToast('Sharing not supported', 'warning');
        return;
    }
    
    try {
        const file = new File([appState.lastGeneratedImage.blob], 'generated-image.jpg', { type: 'image/jpeg' });
        await navigator.share({
            title: 'Generated Image',
            text: `Generated with ${appState.lastGeneratedImage.model}: ${appState.lastGeneratedImage.prompt}`,
            files: [file]
        });
    } catch (error) {
        console.log('Error sharing:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // API key toggle
    elements.toggleApiKey.addEventListener('click', () => {
        const type = elements.apiKey.type === 'password' ? 'text' : 'password';
        elements.apiKey.type = type;
        elements.toggleApiKey.querySelector('.btn-icon').textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    // Connect API
    elements.connectApi.addEventListener('click', connectAndFetchModels);
    
    // Endpoint type switching
    elements.chatEndpoint.addEventListener('change', switchEndpointType);
    elements.imageEndpoint.addEventListener('change', switchEndpointType);
    
    // Slider synchronization
    elements.maxTokensSlider.addEventListener('input', () => {
        elements.maxTokens.value = elements.maxTokensSlider.value;
    });
    elements.maxTokens.addEventListener('input', () => {
        elements.maxTokensSlider.value = elements.maxTokens.value;
    });
    
    elements.temperatureSlider.addEventListener('input', () => {
        elements.temperature.value = elements.temperatureSlider.value;
    });
    elements.temperature.addEventListener('input', () => {
        elements.temperatureSlider.value = elements.temperature.value;
    });
    
    // Character counting
    elements.messageInput.addEventListener('input', () => {
        updateCharCount(elements.messageInput, elements.charCount);
    });
    elements.imagePrompt.addEventListener('input', () => {
        updateCharCount(elements.imagePrompt, elements.imageCharCount);
    });
    
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
    elements.downloadImage.addEventListener('click', downloadImage);
    
    // Image actions
    elements.viewFullscreen.addEventListener('click', viewFullscreen);
    elements.shareImage.addEventListener('click', shareImage);
    elements.closeFullscreen.addEventListener('click', closeFullscreen);
    
    // Close modal on backdrop click
    elements.fullscreenModal.addEventListener('click', (e) => {
        if (e.target === elements.fullscreenModal) {
            closeFullscreen();
        }
    });
    
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
        
        if (e.key === 'Escape') {
            closeFullscreen();
        }
    });
}

// Load and Save Data
function loadSavedData() {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        elements.apiKey.value = savedApiKey;
    } else {
        elements.apiKey.value = API_CONFIG.defaultApiKey;
    }
    
    const savedEndpointType = localStorage.getItem('endpointType');
    if (savedEndpointType === 'images') {
        elements.imageEndpoint.checked = true;
        switchEndpointType();
    } else {
        elements.chatEndpoint.checked = true;
        switchEndpointType();
    }
    
    // Initialize character counts
    updateCharCount(elements.messageInput, elements.charCount);
    updateCharCount(elements.imagePrompt, elements.imageCharCount);
}

function saveData() {
    localStorage.setItem('apiKey', elements.apiKey.value);
    localStorage.setItem('endpointType', appState.currentEndpointType);
}

function setupAutoSave() {
    elements.apiKey.addEventListener('input', saveData);
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
    
    // Clean up image URLs
    if (appState.lastGeneratedImage) {
        URL.revokeObjectURL(appState.lastGeneratedImage.url);
    }
});