#!/usr/bin/env python3
"""
Quick test script for the new Advanced Skill Matcher
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.skill_matcher import skill_matcher

async def test_skill_matching():
    """Test the skill matching with your actual resume skills"""
    
    # Your actual resume skills (based on what you mentioned)
    resume_skills = [
        "TypeScript", "JavaScript", "Python", "Java", "C", "Shell Scripting", 
        "HTML", "Tailwind CSS", "Next.js", "Spring Boot", "ReactJS", "NodeJS", 
        "Express", "Angular", "Django", "Redux", "Flask", "PostgreSQL", "MySQL", 
        "MongoDB", "AWS RDS", "NeonDB", "Git", "AWS", "Azure", "GCP", "Terraform", 
        "Jenkins", "Docker", "Kubernetes", "CI/CD", "REST API", "JWT", "Material UI",
        "Sequelize ORM", "Agile", "SCRUM", "Full-stack", "Microservices"
    ]
    
    # Example job requirements that were incorrectly marked as missing
    job_skills = [
        "Node.js", "REST API development", "JavaScript", "Agile development", 
        "SQL", "Database design", "Cloud platforms", "Git", "Frontend development",
        "Backend development", "API integration", "Web development"
    ]
    
    print("🧪 Testing Advanced Skill Matcher")
    print("=" * 50)
    print(f"📋 Job Skills ({len(job_skills)}): {job_skills}")
    print(f"👤 Resume Skills ({len(resume_skills)}): {resume_skills[:10]}... (showing first 10)")
    print()
    
    try:
        # Test the comprehensive analysis
        result = await skill_matcher.analyze_skills_comprehensive(job_skills, resume_skills)
        
        print("✅ ANALYSIS RESULTS:")
        print(f"🎯 Match Percentage: {result.match_percentage}%")
        print(f"📊 Match Level: {result.match_level}")
        print(f"🔧 Analysis Method: {result.analysis_method}")
        print(f"🎪 Confidence Score: {result.confidence_score}")
        print()
        
        print("✅ MATCHED SKILLS:")
        for match in result.matched_skills:
            print(f"  • {match.job_skill} ← {match.resume_skill} ({match.match_type}, {match.confidence:.2f})")
            print(f"    Reasoning: {match.reasoning}")
        print()
        
        print("❌ MISSING SKILLS:")
        for skill in result.missing_skills:
            print(f"  • {skill}")
        print()
        
        print("🎁 BONUS SKILLS (first 10):")
        for skill in result.bonus_skills[:10]:
            print(f"  • {skill}")
        print()
        
        print(f"📝 Summary: {result.analysis_summary}")
        
        # Test specific ecosystem matches
        print("\n🔍 TESTING SPECIFIC ECOSYSTEM MATCHES:")
        test_cases = [
            ("JavaScript", ["Node.js", "TypeScript"]),
            ("REST API", ["Spring Boot", "Express", "Django"]),
            ("SQL", ["PostgreSQL", "MySQL"]),
            ("Agile development", ["Agile", "SCRUM"])
        ]
        
        for job_skill, resume_subset in test_cases:
            matches = skill_matcher.find_ecosystem_matches(job_skill, resume_subset)
            if matches:
                best_match = max(matches, key=lambda x: x.confidence)
                print(f"  ✅ {job_skill} → {best_match.resume_skill} ({best_match.confidence:.2f})")
            else:
                print(f"  ❌ {job_skill} → No match found")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_skill_matching())