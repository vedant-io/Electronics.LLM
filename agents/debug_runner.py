import sys
import os
import asyncio

# Add 'app' directory to sys.path just like run_server.py
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

# Now import the debug main function
from app.Beginner.debug_structurer import main

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Wrapper failed: {e}")
        import traceback
        traceback.print_exc()
