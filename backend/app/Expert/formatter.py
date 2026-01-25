import re

def extract_code_only(text: str) -> str:
    """Extracts code blocks from markdown text."""
    pattern = r"```(?:\w+)?\n(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)
    if matches:
        return "\n".join(matches).strip()
    return text.strip()

def extract_text_only(text: str) -> str:
    """Removes code blocks to return only text."""
    # Remove code blocks
    pattern = r"```(?:\w+)?\n.*?```"
    return re.sub(pattern, "", text, flags=re.DOTALL).strip()

def format_output(text: str) -> str:
    """General formatter to clean up whitespace."""
    return text.strip()
