from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class Skill(BaseModel):
    name: str
    level: Optional[SkillLevel] = None
    years_experience: Optional[float] = None  # Allow float for fractional years (e.g., 0.5, 1.5)
    category: Optional[str] = None  # e.g., "programming", "framework", "tool"

class Experience(BaseModel):
    job_title: str
    company: str
    duration: str
    years: Optional[float] = None
    responsibilities: List[str] = []
    technologies: List[str] = []
    achievements: List[str] = []

class Education(BaseModel):
    degree: str
    institution: str
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    relevant_coursework: List[str] = []

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = []
    url: Optional[str] = None
    achievements: List[str] = []

class ParsedResume(BaseModel):
    # Raw data
    raw_text: str
    
    # Personal info
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    # Structured data
    skills: List[Skill] = []
    experience: List[Experience] = []
    education: List[Education] = []
    projects: List[Project] = []
    
    # Summary
    professional_summary: Optional[str] = None
    total_years_experience: Optional[float] = None
    seniority_level: Optional[str] = None  # junior, mid, senior, lead
    
    # Metadata
    parsing_confidence: float = 0.0
    sections_found: List[str] = []

class ResumeParsingRequest(BaseModel):
    file_path: str  # Path to the resume file in Supabase storage

class ResumeParsingResponse(BaseModel):
    success: bool
    message: str
    data: Optional[ParsedResume] = None
    error: Optional[str] = None