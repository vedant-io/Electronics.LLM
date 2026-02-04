
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Import from the organized Expert structure
from Expert.models import (
    ProjectDescriptionRequest, ProjectRequest, MainAgentResponse, 
    CodeAgentResponse, QARequest, QAResponse, ProjectNameResponse,
    BasicModulesResponse, AdaptiveModulesResponse, CompileRequest, FlashRequest
)
from Expert.agents import (
    desc_runner, wiring_runner, code_runner, qa_runner, name_runner
)
from app.Beginner.utils import run_agent
# Import Beginner Agents
from Beginner.Basics_agent.initial_modules_agent import root_agent as basic_runner
from Beginner.Dynamic_agent.adaptive_agent import root_agent as adaptive_runner

from Expert.utils import run_agent_with_retry
from Expert.formatter import format_output, extract_text_only
from Beginner.output_structurer import structure_beginner_output 

LAST_PROJECT_FILE = None
import os
import subprocess
import json

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://192.168.130.1:3001", "http://localhost:5000"],  # Allow frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.post("/project-name", response_model=ProjectNameResponse)
async def get_project_name(request: ProjectDescriptionRequest):
    """
    Identifies the project name from a user's description by searching the vector database.
    """
    description = request.user_description
    print(f"🔍 Identifying project for: {description[:50]}...")
    
    try:
        response = await run_agent_with_retry(name_runner, f"Find the project name for this description: {description}")
        
        # Clean output: we expect just the name
        clean_name = await structure_beginner_output(response)
        if not clean_name:
             clean_name = str(response)
        
        return ProjectNameResponse(project_name=clean_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/main-agent", response_model=MainAgentResponse)
async def run_main_agent(request: ProjectRequest):
    topic = request.project_topic
    print(f"📋 Running Main Agent (Description + Wiring) for: {topic}")
    
    try:
        # Run sub-agents sequentially to avoid 429 Resource Exhausted (Rate Limit)
        
        # 1. Description Agent
        print("   > starting description agent...")
        desc_result = await run_agent_with_retry(desc_runner, f"Provide a description and briefing for the project: {topic}")
        desc_output = await structure_beginner_output(desc_result)
        if not desc_output.strip():
             desc_output = str(desc_result)
        
        # Short delay between sequential calls + the retry logic safety inside the helper
        await asyncio.sleep(2) 
        
        # 2. Wiring Agent
        print("   > starting wiring agent...")
        wiring_result = await run_agent_with_retry(wiring_runner, f"Provide components, wiring, and step-by-step building process for the project: {topic}")
        wiring_output = format_output(str(wiring_result))
        if not wiring_output.strip():
             wiring_output = str(wiring_result)
        
        return MainAgentResponse(
            description_agent_output=desc_output,
            wiring_agent_output=wiring_output
        )
    except Exception as e:
        print(f"❌ Main Agent Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code-agent", response_model=CodeAgentResponse)
async def run_code_agent(request: ProjectRequest):
    topic = request.project_topic
    try:
        response = await run_agent_with_retry(code_runner, f"Extract and provide the code for the project: {topic}")
        clean_response = await structure_beginner_output(response)
        if not clean_response.strip():
            clean_response = str(response)

        # Save code to file for arduino-cli
        # Create a valid sketch directory and file name
        import time
        timestamp = int(time.time())
        project_name = f"Project_{timestamp}"
        sketch_dir = os.path.join(os.getcwd(), "sketches", project_name)
        os.makedirs(sketch_dir, exist_ok=True)
        
        sketch_path = os.path.join(sketch_dir, f"{project_name}.ino")
        with open(sketch_path, "w") as f:
            f.write(clean_response)
            
        LAST_PROJECT_FILE = sketch_path
        print(f"💾 Saved sketch to: {LAST_PROJECT_FILE}")
        return CodeAgentResponse(code=clean_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/beginner/basics", response_model=BasicModulesResponse)
async def run_basic_modules(request: ProjectRequest):
    # If a topic is provided, we can tailor the basics, otherwise use a default
    topic = request.project_topic
    if topic:
        prompt = f"Create me 4 modules that will have detailes information on basic topics related to {topic} that will brush up the basics of electronics and embedded systems for an engineering student. And keep the info very detailed and comprehensive."
    else:
        prompt = "Create me 4 modules that will have detailes information on any basic topic that will brush up the basics of electronics and embedded systems for an engineering student. And keep the info very detailed and comprehensive."
    
    print(f"📚 Running Basic Modules Agent for: {topic if topic else 'General'}")
    try:
        response = await run_agent(basic_runner, prompt, timeout=300)
        clean_response = await structure_beginner_output(str(response))
        return BasicModulesResponse(modules=clean_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/beginner/adaptive", response_model=AdaptiveModulesResponse)
async def run_adaptive_modules(request: ProjectRequest):
    topic = request.project_topic
    print(f"🔄 Running Adaptive Modules Agent for: {topic}")
    try:
        # Prompt construction similar to the example in adaptive_agent.py
        prompt = f"How to make {topic}"
        response = await run_agent(adaptive_runner, prompt, timeout=300)
        clean_response = await structure_beginner_output(str(response))
        return AdaptiveModulesResponse(modules=clean_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/troubleshoot", response_model=QAResponse)
async def run_troubleshoot(request: QARequest):
    user_query = request.query
    context = ""
    if request.project_topic:
        context = f"Context Project: {request.project_topic}. "
    
    full_prompt = f"{context}User Query: {user_query}"
    
    try:
        response = await run_agent_with_retry(qa_runner, full_prompt)
        clean_response = format_output(str(response))
        if not clean_response.strip():
            clean_response = str(response)
        return QAResponse(response=clean_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ---------- Arduino Compile ----------
@app.post("/arduino/compile")
def compile_arduino(req: CompileRequest):
    global LAST_PROJECT_FILE
    # TODO: Current implementation lacks a mechanism to set LAST_PROJECT_FILE. 
    # This endpoint will fail until that logic is connected to code generation.
    if not LAST_PROJECT_FILE or not os.path.exists(LAST_PROJECT_FILE):
        raise HTTPException(status_code=400, detail="No project file available. Run /ask first (or ensure code generation sets this).")

    sketch_dir = os.path.dirname(LAST_PROJECT_FILE)
    build_dir = os.path.join(sketch_dir, "build")
    os.makedirs(build_dir, exist_ok=True)

    try:
        result = subprocess.run(
            [
                "arduino-cli", "compile",
                "--fqbn", req.fqbn,
                "--output-dir", build_dir,
                sketch_dir
            ],
            capture_output=True, text=True, check=True
        )
        return {"success": True, "message": result.stdout}

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=e.stderr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Arduino Flash ----------
@app.post("/arduino/flash")
def flash_code(req: FlashRequest):
    global LAST_PROJECT_FILE
    if not LAST_PROJECT_FILE or not os.path.exists(LAST_PROJECT_FILE):
        raise HTTPException(status_code=400, detail="No project file available. Run /ask first.")

    sketch_dir = os.path.dirname(LAST_PROJECT_FILE)
    build_dir = os.path.join(sketch_dir, "build")

    try:
        # Re-compile to ensure it's fresh
        subprocess.run(
            ["arduino-cli", "compile", "--fqbn", req.fqbn, "--output-dir", build_dir, sketch_dir],
            check=True, capture_output=True, text=True
        )

        # Upload using the compiled output
        result = subprocess.run(
            ["arduino-cli", "upload", "-p", req.port, "--fqbn", req.fqbn, "--input-dir", build_dir, sketch_dir],
            check=True, capture_output=True, text=True
        )
        return {"success": True, "message": result.stdout}

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=e.stderr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Arduino Boards ----------
@app.get("/arduino/boards")
def list_boards():
    """List connected Arduino boards with robust error handling."""
    try:
        command = ["arduino-cli", "board", "list", "--format", "json"]
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            check=True
        )

        if not result.stdout.strip():
            return {"boards": [], "message": "No connected boards found."}

        return json.loads(result.stdout)

    except FileNotFoundError:
        raise HTTPException(
            status_code=500, 
            detail="'arduino-cli' not found. Please ensure it is installed and in your system's PATH."
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred with arduino-cli. Return code: {e.returncode}. Stderr: {e.stderr}. Stdout: {e.stdout}"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse JSON from arduino-cli. Raw output: {result.stdout}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
