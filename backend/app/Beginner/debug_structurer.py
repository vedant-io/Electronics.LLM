
import asyncio
import logging
import sys
import os

# Ensure backend root is in path to mimic run_server.py environment
# Assumes this script is run from backend/ or we add it explicitly
# sys.path.append(os.path.join(os.getcwd(), "app")) 
# But better to run as module.

from app.Beginner.output_structurer import structure_beginner_output

# Configure logging
logging.basicConfig(level=logging.INFO)

async def main():
    dummy_text = """
    Thinking Process:
    1. Search for modules.
    2. Found relevant info.
    
    Final Output:
    ```json
    {
      "modules": [
        {
          "title": "Module 1",
          "content": "Content 1"
        }
      ]
    }
    ```
    """
    
    print("Running structurer...")
    try:
        result = await structure_beginner_output(dummy_text)
        print("Result:", result)
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
