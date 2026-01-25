"""
Hyperparameter configurations for learning agents.

This module provides optimized generation configurations for different
use cases: balanced, creative, and factual content generation.
"""

# Balanced configuration for educational content
# Balances creativity (engaging examples) with reliability (technical accuracy)
GENERATION_CONFIG = {
    "temperature": 0.6,           # Sweet spot for educational content
    "top_p": 0.9,                 # Nucleus sampling for diverse outputs
    "top_k": 40,                  # Limit token choices for quality
    "max_output_tokens": 8192,    # Sufficient for detailed modules
    "candidate_count": 1,         # Single best response
}

# Configuration for strict JSON output
# Ensures responses are valid JSON, useful for API-like agents
JSON_GENERATION_CONFIG = GENERATION_CONFIG.copy()
JSON_GENERATION_CONFIG["response_mime_type"] = "application/json"


# Creative configuration for engaging, curiosity-driven content
# Use for: curiosity hooks, discovery activities, thought experiments
CREATIVE_CONFIG = {
    "temperature": 0.85,          # Higher creativity for engaging content
    "top_p": 0.95,                # More diverse vocabulary
    "top_k": 50,                  # Broader token selection
    "max_output_tokens": 8192,
    "candidate_count": 1,
}

# Factual configuration for grounded, technical content
# Use for: component specifications, wiring details, safety information
FACTUAL_CONFIG = {
    "temperature": 0.4,           # Lower for consistency and accuracy
    "top_p": 0.8,                 # More focused outputs
    "top_k": 30,                  # Conservative token selection
    "max_output_tokens": 8192,
    "candidate_count": 1,
}

# Safety settings for educational content
SAFETY_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
]
