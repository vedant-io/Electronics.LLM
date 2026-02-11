import sys
import os
import asyncio
from dotenv import load_dotenv

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.server import basic_runner
from app.Beginner.utils import run_agent
from app.Beginner.output_structurer import structure_beginner_output

load_dotenv()

async def debug_server_flow():
    print("🚀 Debugging server flow...")
    
    prompt = "Create me 4 modules that will have detailes information on any basic topic that will brush up the basics of electronics and embedded systems for an engineering student. And keep the info very detailed and comprehensive."
    
    print("\n--- Step 1: Running Agent with Filter ---")
    try:
        # Mimic server.py exact call
        response = await run_agent(basic_runner, prompt, timeout=300, target_agent="initial_modules_agent")
        print("\n--- RAW AGENT RESPONSE START ---")
        print(response)
        print("--- RAW AGENT RESPONSE END ---\n")
        
        print("\n--- Step 2: Running Structure Agent ---")
        clean_response = await structure_beginner_output(str(response))
        print("\n--- CLEANED RESPONSE START ---")
        print(clean_response)
        print("--- CLEANED RESPONSE END ---\n")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_server_flow())
