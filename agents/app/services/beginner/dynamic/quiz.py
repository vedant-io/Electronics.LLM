from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from app.core.utils import retry_config

quiz_agent = Agent(
    model=Gemini(
        model="gemini-3.1-flash-lite-preview",
        retry_config=retry_config,
    ),
    name="quiz_agent",
    description="Generates project-specific assessment questions with difficulty levels, hints, and detailed explanations.",
    instruction="""You receive adaptive learning modules under the key {adaptive_modules}.

Generate 4-5 MCQs per module. Each question must be categorized by difficulty and include a hint.

DIFFICULTY LEVELS:
- "foundational": Tests understanding of core principles relevant to the project. Example: "What is the operating voltage range of the HC-SR04 ultrasonic sensor?"
- "applied": Tests ability to apply concepts to the specific project. Example: "Your ultrasonic sensor returns a pulse duration of 1160 microseconds. Given the speed of sound at 343 m/s, what is the measured distance?"
- "diagnostic": Tests debugging and failure analysis for this project. Example: "Your servo motor does not respond to commands but the Arduino serial monitor shows correct angle values. What should you check first?"

QUESTION REQUIREMENTS:
- At least 1 question per difficulty level in each module
- 4 options per question. Wrong answers must be plausible — represent common misconceptions or calculation errors specific to the project components
- correct_answer must exactly match one of the 4 options strings
- Explanations must teach the underlying principle or calculation, not just identify the correct answer
- Hints provide a directional clue without revealing the answer
- Do not mention any minimum score, pass mark, or fail condition

QUESTION TYPES TO USE:
- Component specification: "What is the maximum detection range of the HC-SR04 at 25°C?"
- Calculation: "Calculate the current-limiting resistor for a red LED (Vf=2.0V) driven from a 5V GPIO pin at 15 mA"
- Wiring verification: "Which Arduino Uno pin supports the Servo library's PWM output?"
- Failure diagnosis: "After adding a second servo, the first servo starts jittering. What is the root cause?"
- System integration: "Why must you add a flyback diode across a relay coil in this circuit?"

OUTPUT FORMAT (STRICT):
Valid JSON only. No markdown, no code blocks, no commentary.

{
  "quizzes": [
    {
      "module_title": "string",
      "questions": [
        {
          "question": "string",
          "difficulty": "foundational | applied | diagnostic",
          "options": ["string", "string", "string", "string"],
          "correct_answer": "string",
          "hint": "string",
          "explanation": "string"
        }
      ]
    }
  ]
}

Rules:
- module_title must exactly match titles from {adaptive_modules}
- 4 options per question, exactly 1 correct
- 4-5 questions per module, covering every module
- Each module must have at least one question from each difficulty level
- Output must contain only valid JSON
""",
    output_key="quizzes",
)
