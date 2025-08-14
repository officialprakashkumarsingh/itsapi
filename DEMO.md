# ItsApi Demo Guide 🚀

## Quick Start Demo

Visit the application at: `http://localhost:8000` (or open `index.html` directly)

### 1. Initial Setup (30 seconds)
1. **API Key**: The key `ahamaibyprakash25` is pre-filled
2. **Base URL**: The API endpoint is already configured
3. **Click "Test Connection"**: Verify your API is reachable
4. **Click "Fetch Models"**: Load all available models

### 2. Watch Real-time Model Status (2 minutes)
After fetching models, you'll see:
- **Model cards** with real-time status indicators
- **🟢 Online** - Model is working
- **🔴 Offline** - Model is not responding
- **🟡 Error** - Model has issues
- **⚪ Unknown** - Status not checked yet

The app automatically checks model status every 30 seconds!

### 3. Test Chat Completions (1 minute)
1. **Select a model** from the dropdown (or click a model card)
2. **Enter a message** in the text area
3. **Adjust parameters** (max tokens, temperature)
4. **Click "Send Request"** to test the API
5. **View the response** with syntax highlighting

### 4. Test Different Endpoints (30 seconds)
1. **Switch endpoint** to "GET /v1/models"
2. **Send request** to see the raw models API response
3. **Compare** with the formatted model cards

### 5. Theme Switching (10 seconds)
- **Click the theme button** (sun/moon icon) in the top-right
- **Cycles through**: System → Light → Dark themes
- **Automatic**: Respects your system preference by default

## Demo Features to Show

### Real-time Monitoring
- Models automatically update their status
- Timestamps show last check time
- Status changes are instant

### User Experience
- **Auto-save**: Form data persists across page reloads
- **Responsive**: Works on mobile and desktop
- **Accessible**: Keyboard navigation and screen reader friendly
- **Fast**: Minimal loading times

### API Testing
- **Real requests**: Actual API calls to your endpoint
- **Error handling**: Clear error messages
- **JSON highlighting**: Beautiful response formatting
- **Multiple endpoints**: Easy switching between API endpoints

## Common Demo Scenarios

### Scenario 1: API Monitoring Dashboard
"Use this as a live dashboard to monitor which models are working"

### Scenario 2: API Development
"Test new API endpoints and see formatted responses"

### Scenario 3: Model Comparison
"Compare different models' responses to the same prompt"

### Scenario 4: API Documentation
"Interactive documentation for your API endpoints"

## Tips for Demo

1. **Start with connection test** - Shows the app works
2. **Show the real-time status** - Highlight the monitoring feature
3. **Test different models** - Demonstrate model selection
4. **Switch themes** - Show the polished UI
5. **Explain minimalism** - No gradients, clean design

## API Status Meanings

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Online | Model responds successfully |
| 🔴 | Offline | Model not responding/timeout |
| 🟡 | Error | Model returns error response |
| ⚪ | Unknown | Status not yet determined |
| 🔄 | Checking | Currently verifying status |

Enjoy exploring ItsApi! 🎉