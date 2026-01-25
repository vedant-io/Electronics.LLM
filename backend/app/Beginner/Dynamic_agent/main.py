import asyncio
import json
import sys
import logging
from pathlib import Path
from google.adk.runners import InMemoryRunner
from adaptive_agent import adaptive_modules_agent
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Load .env from project root (ex/)
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Simple logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Dynamic_Agent")

# Example student profiles for testing
STUDENT_PROFILES = {
    "beginner_gas_sensor": {
        "level": "beginner",
        "weak_topics": ["analog signals", "ADC", "sensor calibration"],
        "project_goal": "Gas Leak Detector using MQ-2 sensor and Arduino Uno",
        "quiz_scores": {"digital_io": 85, "analog_signals": 45, "power_management": 70, "sensors": 50}
    },
    "intermediate_drone": {
        "level": "intermediate", 
        "weak_topics": ["PID control", "I2C latency", "battery safety"],
        "project_goal": "Quadcopter Flight Controller with STM32",
        "quiz_scores": {"microcontrollers": 90, "control_theory": 40, "communication_protocols": 65}
    }
}


async def main():
    runner = InMemoryRunner(agent=adaptive_modules_agent)
    
    # Select a student profile (for interactive use, this could be dynamic)
    selected_profile = "beginner_gas_sensor"
    student_data = STUDENT_PROFILES[selected_profile]
    
    logger.info(f"🎯 ADAPTIVE LEARNING MODULE GENERATOR")
    logger.info(f"📊 Student Profile: {selected_profile}")

    # Dynamic prompt construction
    prompt = f"""Generate 3-5 project-specific learning modules for this student.

STUDENT PROFILE:
{json.dumps(student_data, indent=2)}

OUTPUT FORMAT:
Return ONLY a valid JSON array of modules. No markdown, no explanations, no code blocks.

Begin generation now.
"""

    logger.info("🚀 Generating project-specific learning modules...")
    
    try:
        # Run the agent (quiet=True suppresses stdout)
        response = await runner.run_debug(prompt, quiet=True)
        
        # Extract text from events
        output_text = ""
        # response is a list of events
        for event in response:
            # We only want model responses, not tool calls or user inputs
            # Check both 'role' and 'author' attributes as ADK versions vary
            role = getattr(event, 'role', '') or getattr(event, 'author', '')
            
            # Skip user events explicitly
            if role == 'user':
                continue
            
            # Accept other events (model, or undefined role) if they have content
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        output_text += part.text
        
        # Just print the output
        print(output_text)
        
    except Exception as e:
        logger.error(f"❌ Error during generation: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(main())
