from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini
from app.core.utils import retry_config

quiz_agent = LlmAgent(
    model=Gemini(
        model="gemini-3.1-flash-lite-preview",
        retry_config=retry_config,
    ),
    name="quiz_agent",
    description="Generates structured assessment questions with difficulty levels, hints, and detailed explanations.",
    instruction="""You receive learning modules under the key {modules}.

Generate 4-5 MCQs per module. Each question must be categorized by difficulty and include a hint.

DIFFICULTY LEVELS:
- "foundational": Tests understanding of core principles. Example: "What voltage does a standard Arduino Uno I/O pin output when set HIGH?"
- "applied": Tests ability to apply concepts to practical scenarios. Example: "You need to drive an LED at 15 mA from a 5V Arduino pin. The LED has a 2.1V forward voltage. What resistor value is required?"
- "diagnostic": Tests debugging and failure analysis skills. Example: "Your I2C LCD displays nothing after uploading the code. The backlight is on. What is the most probable cause?"

QUESTION REQUIREMENTS:
- At least 1 question per difficulty level in each module
- 4 options per question. Wrong answers must be plausible — represent common misconceptions or calculation errors
- correct_answer must exactly match one of the 4 options strings
- Explanations must teach the underlying principle, not just state which answer is correct. Include the reasoning, calculation, or physical mechanism.
- Hints provide a directional clue without revealing the answer (e.g., "Consider the voltage divider equation" or "Check the I2C address configuration")
- Do not mention any minimum score, pass mark, or fail condition

QUESTION TYPES TO USE:
- Calculation: "Given Vin=5V and R=10kOhm, what current flows through the resistor?"
- Circuit analysis: "In this voltage divider with R1=10kOhm and R2=20kOhm, what is Vout?"
- Debugging: "Your servo jitters erratically when a motor activates on the same power rail. What is the most likely cause?"
- Design trade-off: "When would you choose a voltage regulator over a voltage divider for level shifting?"
- Measurement interpretation: "Your multimeter reads 2.4V on a GPIO pin set to HIGH (3.3V logic). What does this indicate?"

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
- module_title must exactly match the module title from {modules}
- 4-5 questions per module, covering every module
- Each module must have at least one question from each difficulty level
- Output must contain only valid JSON
""",
    output_key="quizzes",
)
