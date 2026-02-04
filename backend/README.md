# Electronics LLM - Express Backend Shield

This is the new Node.js/Express backend that acts as a "Shield" and Middleware between the Frontend and the Python Agents.

## Features
- **Authentication**: JWT-based Auth (Register/Login).
- **Shield Caching**: Proxies requests to the Python Agents (Port 8000) and caches responses in MongoDB.
- **Production Ready**: Uses `express`, `mongoose`, `dotenv`.

## Setup
1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
2.  **Environment Variables**:
    - Check `backend/.env`.
    - Default `PORT=5000`.
    - Default `MONGO_URI=mongodb://localhost:27017/electronics_llm`.
3.  **Run Server**:
    ```bash
    npm run dev  # For development
    # OR
    npm start    # For production
    ```

## API Endpoints
Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register` - `{ username, password, role }`
- `POST /auth/login` - `{ username, password }`

### Agents (Shielded)
All agent endpoints require headers: `x-auth-token: <jwt_token>`

- `POST /agents/project-name`
- `POST /agents/main-agent`
- `POST /agents/code-agent`
- `POST /agents/beginner/basics`
- `POST /agents/beginner/adaptive`
- `POST /agents/troubleshoot`

## How it Works
1.  Frontend sends request to `localhost:5000/api/agents/...`
2.  Express checks MongoDB for a cached response (matching hash).
3.  **Cache Hit**: Returns cached JSON immediately.
4.  **Cache Miss**: Proxies request to Python Backend (`localhost:8000`), caches the result, and returns it.
