import uvicorn
import sys
import os

if __name__ == "__main__":
    # Add 'app' directory to sys.path so imports like 'from Expert...' work
    sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
    
    # Reload assumes we are running from root and the app is in proper package structure
    # However since server.py was moved to app/, we reference app.server:app
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)

