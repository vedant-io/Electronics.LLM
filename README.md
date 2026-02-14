# EmbedAI Learn - Smart Embedded Systems Platform 🤖🔌

**EmbedAI Learn** is an advanced, AI-powered educational platform designed to guide students and hobbyists through the creation of embedded systems projects (Arduino, ESP32, etc.). From idea generation to wiring to code compilation, the platform serves as an end-to-end intelligent tutor.

---

## 🏗️ Architecture Overview

The project follows a modern microservices-like architecture comprising three main components:

### 1. **Frontend (`/frontend`)** 🎨
A premium, responsive web application built with **Next.js 14** and **TypeScript**.
- **Tech Stack**: React, Tailwind CSS, Framer Motion, Lucide Icons, Shadcn UI.
- **Key Features**:
    - **Dynamic Dashboard**: Animated project overviews tailored to user input.
    - **Interactive Modules**: Step-by-step learning modules with rich markdown rendering.
    - **Intelligent Agents**: Chat interfaces for troubleshooting and code generation.
    - **Visual Wiring Guides**: Clear instructions for hardware connections.
    - **Premium UI**: Glassmorphism design, dark mode, and fluid animations.

### 2. **Backend (`/backend`)** ⚙️
A robust **Node.js/Express** server that acts as the orchestration layer.
- **Tech Stack**: Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT).
- **Key Responsibilities**:
    - User Authentication & Management.
    - Project State Management.
    - Proxying complex AI requests to the Agents service.
    - Caching AI responses to reduce latency and costs.

### 3. **AI Agents (`/agents`)** 🧠
The intelligence core of the platform, powered by Python.
- **Tech Stack**: Python, FastAPI, Google GenAI (Gemini), OpenAI, LangChain, FAISS (Vector DB).
- **Key Capabilities**:
    - **RAG System**: Retrieval-Augmented Generation for accurate technical answers.
    - **Code Generation**: Creates C++/Arduino code based on project requirements.
    - **Troubleshooting**: Diagnoses hardware/software issues via chat.
    - **Wiring Planner**: Generates circuit connection logic.

---

## 🚀 Getting Started

Follow these steps to set up the entire system locally.

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** (Local or Atlas URI)
- **API Keys**: E.g., Gemini API Key, OpenAI API Key.

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5000, MONGO_URI=..., JWT_SECRET=...
npm start
```
*Server runs on port `5000`.*

### 2. AI Agents Setup
```bash
cd agents
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Check config/env files for API keys
python run_server.py
```
*Agents service runs on port `8000`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create a .env.local file with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/agents
npm run dev
```
*Web app runs on port `3000`.*

---

## 🌟 Key Features

- **Project Validation**: smart analysis of user ideas to ensure viability before starting.
- **Interactive Roadmap**: A visual learning path that adapts to your progress.
- **Code & Compile**: Generate Arduino code and get help compiling it directly from the browser context.
- **Troubleshoot Companion**: A context-aware chat agent that knows your specific project details.

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

*Verified & Updated: 2026*
