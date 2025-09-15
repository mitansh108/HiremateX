"""
Advanced Skill Matching Agent with Technology Ecosystem Understanding
"""

import json
import re
from typing import List, Dict, Any, Tuple
from groq import Groq
import os
from dataclasses import dataclass

@dataclass
class SkillMatch:
    job_skill: str
    resume_skill: str
    match_type: str
    confidence: float
    reasoning: str

@dataclass
class SkillAnalysisResult:
    match_percentage: float
    match_level: str
    analysis_method: str
    confidence_score: float
    matched_skills: List[SkillMatch]
    missing_skills: List[str]
    bonus_skills: List[str]
    analysis_summary: str

class AdvancedSkillMatcher:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Technology ecosystem mappings
        self.skill_ecosystems = {
            # JavaScript Ecosystem
            "javascript": ["js", "typescript", "node.js", "nodejs", "react", "angular", "vue", "next.js", "express", "npm", "yarn"],
            "node.js": ["javascript", "express", "rest api", "backend", "npm", "server-side"],
            "react": ["javascript", "jsx", "frontend", "ui", "component", "next.js", "gatsby"],
            "next.js": ["react", "javascript", "typescript", "frontend", "ssr", "fullstack"],
            "typescript": ["javascript", "type safety", "frontend", "backend"],
            
            # Python Ecosystem
            "python": ["django", "flask", "fastapi", "pandas", "numpy", "tensorflow", "pytorch", "rest api"],
            "django": ["python", "web framework", "orm", "rest api", "backend", "mvc"],
            "flask": ["python", "web framework", "rest api", "backend", "microservices"],
            "fastapi": ["python", "rest api", "async", "backend", "microservices"],
            
            # Java Ecosystem
            "java": ["spring", "spring boot", "hibernate", "maven", "gradle", "enterprise", "rest api"],
            "spring boot": ["java", "spring", "rest api", "microservices", "enterprise", "backend"],
            "spring": ["java", "dependency injection", "enterprise", "backend"],
            
            # Database Ecosystem
            "sql": ["postgresql", "mysql", "sql server", "oracle", "database design", "query optimization"],
            "postgresql": ["sql", "relational database", "acid", "database design"],
            "mysql": ["sql", "relational database", "database design"],
            "mongodb": ["nosql", "document database", "json", "database"],
            "redis": ["nosql", "cache", "in-memory", "database"],
            
            # Cloud & DevOps
            "aws": ["cloud", "cloud platforms", "lambda", "ec2", "s3", "rds", "dynamodb", "devops"],
            "azure": ["cloud", "cloud platforms", "microsoft cloud", "devops"],
            "gcp": ["cloud", "cloud platforms", "google cloud", "devops"],
            "cloud platforms": ["aws", "azure", "gcp", "cloud", "devops"],
            "docker": ["containerization", "devops", "microservices", "deployment"],
            "kubernetes": ["container orchestration", "devops", "microservices", "docker"],
            "jenkins": ["ci/cd", "devops", "automation", "deployment"],
            "git": ["version control", "collaboration", "github", "gitlab"],
            
            # Web Technologies
            "html": ["web development", "frontend", "frontend development", "markup", "css", "javascript"],
            "css": ["web development", "frontend", "frontend development", "styling", "responsive design"],
            "react": ["frontend", "frontend development", "javascript", "jsx", "ui", "component"],
            "next.js": ["frontend", "frontend development", "react", "javascript", "typescript"],
            "rest api": ["http", "json", "backend", "web services", "api design", "api integration"],
            "api integration": ["rest api", "http", "json", "backend", "web services"],
            
            # Frontend Development
            "frontend development": ["html", "css", "javascript", "react", "angular", "vue", "next.js"],
            "backend development": ["node.js", "express", "django", "flask", "spring boot", "rest api"],
            
            # Development Practices
            "agile": ["scrum", "sprint", "collaboration", "iterative development"],
            "full-stack": ["frontend", "backend", "database", "web development"],
            "microservices": ["distributed systems", "api", "scalability", "architecture"]
        }
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill name for better matching"""
        return skill.lower().strip().replace("-", " ").replace("_", " ")
    
    def find_ecosystem_matches(self, job_skill: str, resume_skills: List[str]) -> List[SkillMatch]:
        """Find matches based on technology ecosystems"""
        matches = []
        normalized_job_skill = self.normalize_skill(job_skill)
        
        for resume_skill in resume_skills:
            normalized_resume_skill = self.normalize_skill(resume_skill)
            
            # Direct match
            if normalized_job_skill == normalized_resume_skill:
                matches.append(SkillMatch(
                    job_skill=job_skill,
                    resume_skill=resume_skill,
                    match_type="exact",
                    confidence=1.0,
                    reasoning="Exact skill match"
                ))
                continue
            
            # Ecosystem match
            if normalized_resume_skill in self.skill_ecosystems:
                ecosystem = self.skill_ecosystems[normalized_resume_skill]
                if normalized_job_skill in ecosystem:
                    matches.append(SkillMatch(
                        job_skill=job_skill,
                        resume_skill=resume_skill,
                        match_type="ecosystem",
                        confidence=0.9,
                        reasoning=f"{resume_skill} ecosystem includes {job_skill}"
                    ))
                    continue
            
            # Reverse ecosystem match
            if normalized_job_skill in self.skill_ecosystems:
                ecosystem = self.skill_ecosystems[normalized_job_skill]
                if normalized_resume_skill in ecosystem:
                    matches.append(SkillMatch(
                        job_skill=job_skill,
                        resume_skill=resume_skill,
                        match_type="ecosystem",
                        confidence=0.85,
                        reasoning=f"{job_skill} is part of {resume_skill} ecosystem"
                    ))
                    continue
            
            # Partial string match for related technologies (but avoid bad matches)
            if (normalized_job_skill in normalized_resume_skill or 
                normalized_resume_skill in normalized_job_skill):
                # Avoid bad partial matches like "Cloud platforms" with "C"
                if len(normalized_job_skill) > 3 and len(normalized_resume_skill) > 2:
                    confidence = 0.7 if len(normalized_job_skill) > 5 else 0.6
                    matches.append(SkillMatch(
                        job_skill=job_skill,
                        resume_skill=resume_skill,
                        match_type="partial",
                        confidence=confidence,
                        reasoning=f"Partial match between {job_skill} and {resume_skill}"
                    ))
        
        return matches
    
    async def ai_enhanced_matching(self, job_skills: List[str], resume_skills: List[str]) -> Dict[str, Any]:
        """Use AI to enhance skill matching with deep technology understanding"""
        
        prompt = f"""
        You are a SENIOR TECHNICAL RECRUITER with deep technology expertise. Analyze skill compatibility.
        
        🎯 TECHNOLOGY ECOSYSTEM UNDERSTANDING:
        
        CORE PRINCIPLES:
        1. Full-stack developers with Node.js + React + PostgreSQL have most web development skills
        2. Spring Boot developers know Java, REST APIs, Enterprise patterns
        3. Cloud experience (AWS/Azure) implies DevOps understanding
        4. Modern frameworks imply their underlying languages (Next.js → React → JavaScript)
        
        SMART MATCHING RULES:
        - Node.js experience → JavaScript, REST API, Backend, Express, NPM
        - React/Next.js → JavaScript, Frontend, Component-based, Modern web
        - Spring Boot → Java, REST API, Microservices, Enterprise development
        - PostgreSQL/MySQL → SQL, Database design, Query optimization
        - Docker/Kubernetes → DevOps, Containerization, Microservices
        - Git → Version control, Collaboration, Code management
        - Agile → Modern development practices, Team collaboration
        
        Job Requirements: {job_skills}
        Resume Skills: {resume_skills}
        
        🧠 ANALYSIS APPROACH:
        1. Find EXACT matches first
        2. Identify ECOSYSTEM matches (Node.js covers many JS skills)
        3. Recognize FRAMEWORK families (React ecosystem)
        4. Understand TECHNOLOGY stacks (MEAN, LAMP, etc.)
        5. Consider DEVELOPMENT practices (Agile, DevOps)
        
        Return ONLY valid JSON:
        {{
            "matched_skills": [
                {{
                    "job_skill": "JavaScript",
                    "resume_skill": "Node.js",
                    "match_type": "ecosystem",
                    "confidence": 0.95,
                    "reasoning": "Node.js is JavaScript runtime environment"
                }}
            ],
            "missing_skills": ["Only truly missing specialized skills"],
            "match_percentage": 85,
            "match_level": "Excellent Match",
            "analysis_summary": "Brief explanation of overall compatibility"
        }}
        
        ⚠️ IMPORTANT:
        - Be generous with ecosystem matches
        - Don't mark basic skills as missing if person has the stack
        - Focus on truly specialized missing skills only
        - A full-stack developer likely has most common web skills
        """
        
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",  # Use larger model for better reasoning
                temperature=0.1,
                max_tokens=1500
            )
            
            response_text = chat_completion.choices[0].message.content
            
            if not response_text:
                print("❌ Groq returned empty response")
                return None
                
            response_text = response_text.strip()
            print(f"🤖 Raw Groq response: {response_text[:200]}...")
            
            # Clean and parse JSON
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            # Try to extract JSON if it's embedded in text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
            
            parsed_result = json.loads(response_text)
            print(f"✅ Successfully parsed AI response")
            return parsed_result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Raw response: {response_text[:500] if 'response_text' in locals() else 'No response'}")
            return None
        except Exception as e:
            print(f"❌ AI matching failed: {e}")
            print(f"Response type: {type(chat_completion.choices[0].message.content) if 'chat_completion' in locals() else 'No completion'}")
            return None
    
    async def analyze_skills_comprehensive(self, job_skills: List[str], resume_skills: List[str]) -> 'SkillAnalysisResult':
        """Perform comprehensive skill matching using both rule-based and AI approaches"""
        
        print(f"🎯 Starting comprehensive skill analysis...")
        print(f"📋 Job skills: {job_skills}")
        print(f"👤 Resume skills: {resume_skills}")
        
        # Step 1: Rule-based ecosystem matching
        rule_based_matches = []
        matched_job_skills = set()
        
        for job_skill in job_skills:
            ecosystem_matches = self.find_ecosystem_matches(job_skill, resume_skills)
            if ecosystem_matches:
                # Take the best match for this job skill
                best_match = max(ecosystem_matches, key=lambda x: x.confidence)
                rule_based_matches.append(best_match)
                matched_job_skills.add(job_skill)
        
        # Step 2: AI-enhanced matching for remaining skills
        remaining_job_skills = [skill for skill in job_skills if skill not in matched_job_skills]
        ai_result = await self.ai_enhanced_matching(remaining_job_skills, resume_skills)
        
        # Step 3: Combine results
        final_matches = rule_based_matches.copy()
        missing_skills = []
        
        if ai_result:
            # Add AI matches for remaining skills
            for ai_match in ai_result.get("matched_skills", []):
                if ai_match["job_skill"] not in matched_job_skills:
                    final_matches.append(SkillMatch(
                        job_skill=ai_match["job_skill"],
                        resume_skill=ai_match["resume_skill"],
                        match_type=ai_match["match_type"],
                        confidence=ai_match["confidence"],
                        reasoning=ai_match["reasoning"]
                    ))
                    matched_job_skills.add(ai_match["job_skill"])
            
            missing_skills = ai_result.get("missing_skills", [])
        else:
            # Fallback: mark remaining as missing
            missing_skills = remaining_job_skills
        
        # Calculate final metrics
        match_percentage = (len(final_matches) / len(job_skills) * 100) if job_skills else 0
        
        if match_percentage >= 80:
            match_level = "Excellent Match"
        elif match_percentage >= 60:
            match_level = "Good Match"
        elif match_percentage >= 40:
            match_level = "Fair Match"
        else:
            match_level = "Poor Match"
        
        # Format response
        matched_skills_formatted = [
            {
                "job_skill": match.job_skill,
                "resume_skill": match.resume_skill,
                "match_type": match.match_type,
                "confidence": match.confidence,
                "reasoning": match.reasoning
            }
            for match in final_matches
        ]
        
        bonus_skills = [skill for skill in resume_skills 
                      if skill not in [match.resume_skill for match in final_matches]]
        
        # Calculate confidence score based on match quality
        confidence_score = sum(match.confidence for match in final_matches) / len(final_matches) if final_matches else 0.0
        
        # Determine analysis method
        analysis_method = "hybrid" if ai_result and rule_based_matches else ("ai_only" if ai_result else "rule_based")
        
        analysis_summary = ai_result.get("analysis_summary", f"Matched {len(final_matches)}/{len(job_skills)} required skills") if ai_result else f"Matched {len(final_matches)}/{len(job_skills)} required skills"
        
        result = SkillAnalysisResult(
            match_percentage=round(match_percentage, 1),
            match_level=match_level,
            analysis_method=analysis_method,
            confidence_score=round(confidence_score, 2),
            matched_skills=final_matches,
            missing_skills=missing_skills,
            bonus_skills=bonus_skills[:10],  # Limit to top 10
            analysis_summary=analysis_summary
        )
        
        print(f"✅ Comprehensive analysis completed!")
        print(f"🎯 Match: {match_percentage:.1f}% ({match_level})")
        print(f"🔧 Method: {analysis_method}")
        print(f"✅ Matched: {len(final_matches)} skills")
        print(f"❌ Missing: {len(missing_skills)} skills")
        
        return result

# Global instance
skill_matcher = AdvancedSkillMatcher()
