# Jarvis - Your Personal AI Companion

Jarvis is a sophisticated, voice-enabled AI chat application built with the Google Gemini API and React. It's designed to be more than just a chatbot; it's a personalized AI companion with a unique, dynamic personality.

The application features a stunning, immersive voice mode with a `three.js` orb that visualizes the AI's state (listening, thinking, speaking). It integrates seamlessly with ElevenLabs for high-quality, natural-sounding voice responses and utilizes the Web Speech API for real-time voice commands, creating a truly hands-free experience.

## ✨ Key Features

-   **Dynamic AI Persona**: Powered by a detailed system instruction for the Gemini API, creating a consistent and engaging "Jarvis" personality loyal to its creator.
-   **Immersive Voice Mode**: A hands-free, voice-driven interface with a beautiful `three.js` orb visualizer that reacts to the AI's state.
-   **Advanced Text-to-Speech**: Integrates with **ElevenLabs** for high-quality voice responses, with a seamless fallback to the browser's native speech synthesis.
-   **Multi-Modal Conversations**: Supports both text and image inputs for rich, context-aware interactions.
-   **Rich Chat Experience**: Full Markdown rendering and code syntax highlighting for clear, readable AI responses.
-   **Conversation Management**: Create, rename, delete, and switch between multiple conversations, all saved securely in your browser's local storage.
-   **Customizable Theming**: A sleek, modern interface with both light and dark modes.
-   **Data Portability**: Easily export your conversations to JSON or Markdown formats.
-   **Real-time Camera Feed**: An optional feature to display your camera feed for a more personal touch during conversations.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript
-   **AI**: Google Gemini API (`gemini-2.5-flash`)
-   **Visualization**: Three.js
-   **Voice I/O**:
    -   Web Speech API (Speech-to-Text)
    -   ElevenLabs API (Text-to-Speech)
-   **Styling**: Tailwind CSS
-   **Code Highlighting**: Prism.js / `react-syntax-highlighter`

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Set up your API Key:**
    -   This project requires a Google Gemini API key.
    -   Create a `.env` file in the root of the project.
    -   Add your API key to the `.env` file:
        ```
        API_KEY=YOUR_GEMINI_API_KEY
        ```
3.  **Run the application:**
    -   (Add instructions here based on your development setup, e.g., `npm install && npm start`)

---

_This project was created by Sourabh Nirwane._
