# ItsApi - Multi-API Testing Platform

A minimalistic, shadcn-inspired frontend for testing multiple APIs with real-time model status monitoring. Built with vanilla HTML, CSS, and JavaScript.

## 🚀 Features

### Core Functionality
- **Multi-API Support**: Test different API endpoints with a unified interface
- **OpenAI Compatible**: Full support for OpenAI-compatible APIs including `/v1/models` and `/v1/chat/completions`
- **Real-time Model Status**: Live monitoring of model availability with automatic status checks every 30 seconds
- **System Theme Support**: Automatic light/dark theme switching based on system preferences
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### API Testing Features
- **Connection Testing**: Verify API connectivity before making requests
- **Model Management**: Fetch and display available models with real-time status indicators
- **Interactive Testing**: Send real requests to chat completion endpoints
- **JSON Response Viewer**: Syntax-highlighted JSON responses with proper formatting
- **Request History**: Auto-save form data for repeated testing

### Real-time Model Monitoring
- **Status Indicators**: Visual indicators showing model availability (🟢 Online, 🔴 Offline, 🟡 Error, ⚪ Unknown)
- **Automatic Checking**: Background monitoring with 30-second intervals
- **Last Check Timestamps**: Display when each model was last verified
- **Error Reporting**: Detailed error messages for failed model checks

### User Experience
- **Minimalistic Design**: Clean, distraction-free interface without gradients
- **Shadcn-inspired Components**: Modern component library aesthetics
- **Three Theme Modes**: System, Light, and Dark themes with manual toggle
- **Auto-save**: Form data persistence across browser sessions
- **Keyboard Shortcuts**: Efficient navigation and form interactions

## 🛠️ Setup & Usage

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for API requests

### Quick Start
1. **Clone or download** the project files
2. **Open** `index.html` in your web browser, or
3. **Serve locally** using a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Configuration
1. **API Key**: Enter your API key (default: `ahamaibyprakash25`)
2. **Base URL**: API endpoint URL (default: `https://ahamai-api.officialprakashkrsingh.workers.dev`)
3. **Test Connection**: Verify your credentials work
4. **Fetch Models**: Load available models and start status monitoring

## 📖 API Documentation

### Supported Endpoints

#### GET /v1/models
- **Purpose**: Fetch list of available models
- **Authentication**: Bearer token required
- **Response**: Array of model objects with `id` and `owned_by` fields

#### POST /v1/chat/completions
- **Purpose**: Generate chat completions using specified models
- **Authentication**: Bearer token required
- **Parameters**:
  - `model`: Model ID from the models list
  - `messages`: Array of message objects with `role` and `content`
  - `max_tokens`: Maximum tokens to generate (1-4000)
  - `temperature`: Randomness control (0.0-2.0)

### Model Status Monitoring

The application automatically checks model status by sending minimal test requests. Status indicators:

- **🟢 Online**: Model responds successfully to requests
- **🔴 Offline**: Model request fails or times out
- **🟡 Error**: Model returns an error response
- **⚪ Unknown**: Status not yet determined
- **🔄 Checking**: Currently verifying status

## 🎨 Design Philosophy

### Minimalistic Aesthetic
- No gradients or heavy visual effects
- Clean typography using Inter font family
- Consistent spacing and visual hierarchy
- Subtle animations and transitions

### Shadcn-inspired Components
- Modern component design patterns
- Consistent color system with CSS custom properties
- Accessible form controls and interactive elements
- Proper focus states and keyboard navigation

### System Theme Integration
- Automatic detection of system color scheme preference
- Manual theme switching with persistence
- Seamless transitions between themes
- Respect for user accessibility preferences

## 🔧 Technical Details

### Architecture
- **Frontend Only**: No backend dependencies
- **Vanilla JavaScript**: No frameworks or build tools required
- **CSS Custom Properties**: Dynamic theming support
- **LocalStorage**: Client-side data persistence

### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Used**: CSS Custom Properties, Fetch API, ES6+ JavaScript
- **Fallbacks**: Graceful degradation for older browsers

### Performance
- **Lightweight**: ~50KB total (HTML + CSS + JS)
- **Fast Loading**: Minimal external dependencies
- **Efficient Updates**: Targeted DOM manipulation
- **Background Monitoring**: Non-blocking status checks

## 🛡️ Security Considerations

- **API Keys**: Stored in browser memory only, not persisted by default
- **CORS**: Relies on API server CORS configuration
- **Input Validation**: Client-side validation for form inputs
- **Rate Limiting**: Respectful API usage with reasonable intervals

## 🔄 Real-time Features

### Model Status Updates
- **Automatic Checks**: Every 30 seconds for all models
- **Visual Feedback**: Immediate status indicator updates
- **Error Handling**: Graceful failure handling with retry logic
- **Performance**: Efficient batch checking with Promise.allSettled

### Live Data Synchronization
- **Form State**: Auto-save user inputs every 500ms
- **Theme Persistence**: Immediate theme changes with localStorage
- **Model Selection**: Real-time UI updates on model changes

## 📱 Mobile Support

- **Responsive Layout**: Adaptive grid system for different screen sizes
- **Touch Interactions**: Optimized button sizes and touch targets
- **Mobile-first**: Progressive enhancement from mobile base
- **Viewport Meta**: Proper mobile scaling and zoom behavior

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ for the API testing community