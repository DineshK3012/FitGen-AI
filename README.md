# FitGen AI - Your Intelligent Fitness Coach

FitGen AI is a modern, AI-powered web application designed to be your personal fitness and nutrition assistant. It leverages the power of Google's Gemini API to generate highly personalized workout routines and diet plans tailored to your specific goals, preferences, and physical attributes.

![FitGen AI Screenshot](https://i.imgur.com/example.png) <!-- Replace with an actual screenshot URL -->

---

## ✨ Key Features

- **🤖 AI-Powered Plan Generation**: Get a complete 7-day fitness and nutrition plan in seconds by providing your personal stats, goals, and preferences.
- **🏋️‍♂️ Custom Workout Routines**: Detailed daily workouts including exercises, sets, reps, rest times, and step-by-step instructions.
- **🥗 Personalized Diet Plans**: Macro-calculated meal plans for the entire week, complete with ingredients and recipes. Supports various dietary needs and preferences.
- **🔄 Smart Substitution**: Don't like an exercise or a meal? The AI can generate suitable alternatives on the fly based on your constraints (e.g., "no equipment", "lactose intolerant").
- **🎨 AI Image Visualization**: Use Gemini's image generation capabilities to create photorealistic visuals of exercises and meals. You can even edit the images with text prompts (e.g., "add a side of avocado").
- **💾 Plan Management**: Save, view, regenerate, and delete your fitness plans. All data is securely stored in your browser's local storage.
- **📄 Professional PDF Export**: Export your complete weekly plan to a clean, professionally formatted PDF document to print or use offline.
- **🔊 Text-to-Speech**: Listen to exercise instructions and meal recipes with the integrated audio feature.
- **🌓 Dark & Light Mode**: A sleek, modern UI with full support for both dark and light themes.
- **📱 Fully Responsive**: A seamless experience across all devices, from mobile phones to desktop computers.
- **🔑 Fallback API Key**: The app can be configured with a fallback environment-level API key for new users.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI Model**: Google Gemini API (Gemini 2.5 Flash for text, Gemini 2.5 Flash Image for visuals)
- **Notifications**: Sonner (Toast notifications)
- **Routing**: React Router
- **State Management**: React Hooks (useState, useContext, useMemo, useCallback)
- **Local Storage**: All user data is stored client-side.

---

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/fitgen-ai.git
    cd fitgen-ai
    ```

2.  **Get a Gemini API Key**:
    - Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to get your free API key.

3.  **Set up the API Key**:
    - **Option 1 (Recommended)**: Launch the application and navigate to the **Settings** page. Paste your API key into the input field and save. The key will be stored in your browser's local storage.
    - **Option 2 (For Development)**: You can set up a fallback key. Create a `.env` file in the project root and add the following line:
      ```
      API_KEY=your_gemini_api_key_here
      ```
      The application is coded to use the key from Settings first, and fall back to this environment variable if no user-provided key is found.

4.  **Install dependencies and run the development server**:
    This project is set up to run in an environment that supports ES modules directly in the browser. You can use a simple static server.
    ```bash
    # If you have Node.js, you can use 'serve'
    npm install -g serve
    serve .

    # Or use Python's built-in server
    python -m http.server
    ```

5.  Open your browser and navigate to `http://localhost:3000` (or the port provided by your server).

---

## 🔧 How It Works

FitGen AI operates entirely on the client-side. When a user fills out the multi-step form, their preferences are compiled into a detailed prompt. This prompt is then sent to the Gemini API, which returns a structured JSON object containing the complete 7-day workout and diet plan.

The application parses this JSON and displays it in a user-friendly interface. All generated plans, as well as the user's API key, are stored exclusively in the browser's `localStorage`, ensuring user privacy as no data is sent to a backend server.
