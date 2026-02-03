from pydantic import BaseModel
from typing import Optional

class ProjectDescriptionRequest(BaseModel):
    user_description: str

class ProjectRequest(BaseModel):
    project_topic: str

class MainAgentResponse(BaseModel):
    description_agent_output: str
    wiring_agent_output: str

class CodeAgentResponse(BaseModel):
    code: str

class QARequest(BaseModel):
    query: str
    project_topic: Optional[str] = None # Optional context

class QAResponse(BaseModel):
    response: str
    
class ProjectNameResponse(BaseModel):
    project_name: str

class BasicModulesResponse(BaseModel):
    modules: str

class AdaptiveModulesResponse(BaseModel):
    modules: str

class CompileRequest(BaseModel):
    fqbn: str

class FlashRequest(BaseModel):
    fqbn: str
    port: str
