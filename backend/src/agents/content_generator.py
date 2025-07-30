"""
LangGraph-powered content generation agents for job applications
"""
import os
from typing import Dict, Any, List
from groq import Groq
import json
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

class ContentGenerationState(TypedDict):
    """State for content generation workflow"""
    job_data: Dict[str, Any]
    resume_data: Dict[str, Any] 
    skill_match_data: Dict[str, Any]
    content_type: str  # "cold_email", "cover_letter", "linkedin_dm"
    generated_content: str
    personalization_notes: List[str]
    error: str

class ContentGeneratorAgent:
    """LangGraph agent for generating personalized job application content"""
    
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for content generation"""
        workflow = StateGraph(ContentGenerationState)
        
        # Add nodes
        workflow.add_node("analyze_context", self._analyze_context)
        workflow.add_node("generate_content", self._generate_content)
        workflow.add_node("personalize_content", self._personalize_content)
        workflow.add_node("finalize_content", self._finalize_content)
        
        # Add edges
        workflow.set_entry_point("analyze_context")
        workflow.add_edge("analyze_context", "generate_content")
        workflow.add_edge("generate_content", "personalize_content")
        workflow.add_edge("personalize_content", "finalize_content")
        workflow.add_edge("finalize_content", END)
        
        return workflow.compile()
    
    async def _analyze_context(self, state: ContentGenerationState) -> ContentGenerationState:
        """Analyze job and resume context for personalization"""
        try:
            print(f"🔍 Analyzing context for {state['content_type']}...")
            
            # Handle resume data safely
            resume_data = state["resume_data"]
            if isinstance(resume_data, str):
                print(f"⚠️ Resume data is string, converting to dict")
                resume_data = {}
            elif not isinstance(resume_data, dict):
                print(f"⚠️ Resume data is not dict, using empty dict")
                resume_data = {}
            
            # Extract key information safely
            job_title = state["job_data"].get("role", "")
            company = state["job_data"].get("company", "")
            job_skills = state["job_data"].get("skills", [])
            
            resume_name = resume_data.get("name", "Your Name")
            
            # Handle skills safely
            skills_list = resume_data.get("skills", [])
            resume_skills = []
            if isinstance(skills_list, list):
                for skill in skills_list:
                    if isinstance(skill, dict):
                        resume_skills.append(skill.get("name", str(skill)))
                    else:
                        resume_skills.append(str(skill))
            
            matched_skills = state["skill_match_data"].get("matched_skills", [])
            match_percentage = state["skill_match_data"].get("match_percentage", 0)
            
            # Generate personalization notes
            personalization_notes = [
                f"Candidate: {resume_name}",
                f"Target Role: {job_title} at {company}",
                f"Skill Match: {match_percentage}% compatibility",
                f"Key Matched Skills: {', '.join([m.get('job_skill', '') for m in matched_skills[:5]])}",
                f"Total Job Skills: {len(job_skills)}",
                f"Total Resume Skills: {len(resume_skills)}"
            ]
            
            state["personalization_notes"] = personalization_notes
            print(f"✅ Context analysis complete: {len(personalization_notes)} insights")
            
        except Exception as e:
            print(f"❌ Context analysis failed: {e}")
            import traceback
            traceback.print_exc()
            state["error"] = f"Context analysis failed: {e}"
        
        return state
    
    async def _generate_content(self, state: ContentGenerationState) -> ContentGenerationState:
        """Generate base content using AI"""
        try:
            print(f"🤖 Generating {state['content_type']} content...")
            
            # DEBUG: Print actual resume data being passed
            print("🔍 DEBUG - Resume data structure:")
            resume_data = state['resume_data']
            if isinstance(resume_data, dict):
                print(f"Resume keys: {list(resume_data.keys())}")
                print(f"Name: {resume_data.get('name')}")
                print(f"Skills: {resume_data.get('skills', [])[:3]}")  # First 3 skills
                print(f"Experience: {resume_data.get('experience', [])[:1]}")  # First experience
                print(f"Projects: {resume_data.get('projects', [])[:1]}")  # First project
            else:
                print(f"Resume data type: {type(resume_data)}")
                print(f"Resume data preview: {str(resume_data)[:100]}...")
            
            # Get the appropriate prompt based on content type
            if state["content_type"] == "cold_email":
                prompt = self._get_cold_email_prompt(state)
            elif state["content_type"] == "cover_letter":
                prompt = self._get_cover_letter_prompt(state)
            elif state["content_type"] == "linkedin_dm":
                prompt = self._get_linkedin_dm_prompt(state)
            elif state["content_type"] == "linkedin_connection_note":
                prompt = self._get_linkedin_connection_prompt(state)
            else:
                raise ValueError(f"Unknown content type: {state['content_type']}")
            
            # Generate content using Groq
            response = self.groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            
            state["generated_content"] = response.choices[0].message.content.strip()
            print(f"✅ Generated {len(state['generated_content'])} characters of content")
            
        except Exception as e:
            print(f"❌ Content generation failed: {e}")
            state["error"] = f"Content generation failed: {e}"
        
        return state
    
    async def _personalize_content(self, state: ContentGenerationState) -> ContentGenerationState:
        """Add personalization and skill-specific details"""
        try:
            print("🎯 Personalizing content with skill matches...")
            
            # Get top matched skills for personalization
            matched_skills = state["skill_match_data"].get("matched_skills", [])[:3]
            skill_examples = []
            
            for match in matched_skills:
                job_skill = match.get("job_skill", "")
                resume_skill = match.get("resume_skill", "")
                skill_examples.append(f"- {job_skill} (demonstrated through {resume_skill})")
            
            # Personalization prompt
            personalization_prompt = f"""
            Enhance this {state["content_type"]} with specific skill matches and personalization:
            
            Original Content:
            {state["generated_content"]}
            
            Skill Matches to Highlight:
            {chr(10).join(skill_examples)}
            
            Match Percentage: {state["skill_match_data"].get('match_percentage', 0)}%
            
            Instructions:
            1. Keep the same tone and structure
            2. Add 1-2 specific skill examples naturally
            3. Make it feel personal and relevant
            4. Don't make it longer than necessary
            5. Return ONLY the enhanced content
            """
            
            response = self.groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": personalization_prompt}],
                temperature=0.5,
                max_tokens=1500
            )
            
            state["generated_content"] = response.choices[0].message.content.strip()
            print("✅ Content personalization complete")
            
        except Exception as e:
            print(f"❌ Personalization failed: {e}")
            state["error"] = f"Personalization failed: {e}"
        
        return state
    
    async def _finalize_content(self, state: ContentGenerationState) -> ContentGenerationState:
        """Final content cleanup and formatting"""
        try:
            print("✨ Finalizing content...")
            
            # Basic cleanup
            content = state["generated_content"]
            content = content.replace("**", "").replace("*", "")  # Remove markdown
            content = content.strip()
            
            # Ensure proper formatting based on content type
            if state["content_type"] == "cold_email":
                if not content.startswith("Subject:"):
                    # Add subject line if missing
                    job_title = state["job_data"].get("role", "Position")
                    company = state["job_data"].get("company", "Company")
                    subject = f"Subject: Interest in {job_title} Role at {company}\n\n"
                    content = subject + content
            
            state["generated_content"] = content
            print("✅ Content finalization complete")
            
        except Exception as e:
            print(f"❌ Finalization failed: {e}")
            state["error"] = f"Finalization failed: {e}"
        
        return state
    
    def _get_cold_email_prompt(self, state: ContentGenerationState) -> str:
        """Generate prompt for cold email"""
        job_data = state["job_data"]
        resume_data = state["resume_data"]
        
        # Handle case where resume_data might be a string or None
        if isinstance(resume_data, str):
            print(f"⚠️ Resume data is string, converting: {resume_data[:100]}...")
            resume_data = {}
        elif not isinstance(resume_data, dict):
            print(f"⚠️ Resume data is not dict, using empty: {type(resume_data)}")
            resume_data = {}
        
        # Extract template style and custom instructions if provided
        template_style = job_data.get('template_style', 'professional')
        custom_instructions = job_data.get('custom_instructions', '')
        
        # Get skills safely
        skills_list = resume_data.get('skills', [])
        if skills_list and isinstance(skills_list, list):
            if len(skills_list) > 0 and isinstance(skills_list[0], dict):
                # Skills are objects with 'name' field
                skill_names = [s.get('name', str(s)) for s in skills_list[:5]]
            else:
                # Skills are strings
                skill_names = [str(s) for s in skills_list[:5]]
        else:
            skill_names = []
        
        # Get experience safely
        experience_list = resume_data.get('experience', [])
        current_role = ''
        if experience_list and isinstance(experience_list, list) and len(experience_list) > 0:
            if isinstance(experience_list[0], dict):
                current_role = experience_list[0].get('job_title', experience_list[0].get('title', ''))
            else:
                current_role = str(experience_list[0])
        
        return f"""
        You are an expert at writing compelling cold emails for job applications. 
        Write a professional, personalized cold email to a recruiter.
        
        TEMPLATE STYLE: {template_style}
        CUSTOM INSTRUCTIONS: {custom_instructions}
        
        Job Details:
        - Role: {job_data.get('role', '')}
        - Company: {job_data.get('company', '')}
        - Key Skills Required: {', '.join(job_data.get('skills', [])[:5])}
        - Experience Required: {job_data.get('experience', '')}
        - Template Style: {template_style}
        
        Candidate Details:
        - Name: {resume_data.get('name', 'Your Name')}
        - Current Role: {current_role}
        - Key Skills: {', '.join(skill_names)}
        - Experience Count: {len(experience_list)} positions
        - Projects Count: {len(resume_data.get('projects', []))} projects
        
        STYLE REQUIREMENTS based on template:
        {custom_instructions}
        
        Requirements:
        1. Include a compelling subject line
        2. Keep it concise (under 200 words)
        3. Highlight 2-3 most relevant skills/experiences
        4. Show genuine interest in the company
        5. Include a clear call-to-action
        6. Match the {template_style} tone perfectly
        7. No generic templates - make it specific to this role and company
        8. Use actual skills and experience from the resume data
        
        Format:
        Subject: [Subject Line]
        
        [Email Body]
        
        Best regards,
        {resume_data.get('name', 'Your Name')}
        """
    
    def _get_cover_letter_prompt(self, state: ContentGenerationState) -> str:
        """Generate prompt for cover letter"""
        job_data = state["job_data"]
        resume_data = state["resume_data"]
        
        # Extract projects and work experience for highlighting (using correct field names)
        projects = resume_data.get('projects', [])
        work_experience = resume_data.get('experience', [])  # Correct field name
        education = resume_data.get('education', [])
        skills = resume_data.get('skills', [])
        
        return f"""
        You are an expert cover letter writer. Write a compelling, personalized cover letter using this EXACT structure:

        MANDATORY STRUCTURE TO FOLLOW:
        (i) Who you are, what you want, and what you believe in
        (ii) Transition
        (iii) Skill & Qualification Match  
        (iv) Why do you want to work there?
        (v) Conclusion

        Job Details:
        - Role: {job_data.get('role', '')}
        - Company: {job_data.get('company', '')}
        - Requirements: {job_data.get('qualifications', '')}
        - Key Skills Required: {', '.join(job_data.get('skills', [])[:10])}
        - Company Benefits/Culture: {job_data.get('benefits', '')}
        
        REAL CANDIDATE DATA FROM RESUME (USE ONLY THIS DATA):
        
        PERSONAL INFO:
        - Name: {resume_data.get('name', 'Not found')}
        - Email: {resume_data.get('email', 'Not found')}
        - Location: {resume_data.get('location', 'Not found')}
        
        WORK EXPERIENCE (MUST MENTION THESE SPECIFIC JOBS):
        {self._format_work_experience(work_experience)}
        
        PROJECTS (MUST MENTION THESE SPECIFIC PROJECTS):
        {self._format_projects(projects)}
        
        EDUCATION (MUST MENTION THIS EDUCATION):
        {self._format_education(education)}
        
        TECHNICAL SKILLS (USE THESE EXACT SKILLS):
        {self._format_skills(skills)}
        
        RAW RESUME TEXT FOR ADDITIONAL CONTEXT:
        {resume_data.get('raw_text', '')[:1000]}...

        DETAILED WRITING INSTRUCTIONS:

        (i) WHO YOU ARE, WHAT YOU WANT, AND WHAT YOU BELIEVE IN:
        - First sentence: Summarize what you will bring to the company with SPECIFIC numbers/achievements
        - Second sentence: Express excitement about the role and company
        - Third sentence: "There are three things that make me the perfect fit for this position:"
        - Avoid jargon, be specific, use numbers when possible
        - Example format: "Over the last [time period], I've [specific achievement with numbers] and [another achievement]. I'm excited to continue my journey by contributing at {job_data.get('company', '')}."

        (ii) TRANSITION:
        - Smoothly connect to your qualifications
        - Set up the three main points you'll cover

        (iii) SKILL & QUALIFICATION MATCH:
        - WITHOUT FAIL: Highlight specific PROJECTS from resume that match job requirements
        - WITHOUT FAIL: Highlight relevant WORK EXPERIENCE that aligns with the role
        - Pick the 2-3 most important qualifications that match job requirements
        - Transform boring bullet points into exciting sentences with themes like:
          * Leading People
          * Taking Initiative  
          * Affinity for challenging work
          * Dealing with failure
          * Managing conflict
          * Driven by curiosity
        - Use specific examples with numbers and results
        - Connect each qualification to a concrete project or work experience

        (iv) WHY DO YOU WANT TO WORK THERE:
        - Research-based reasons (use company values, recent news, products)
        - Format: "I've been following {job_data.get('company', '')} and I resonate with both the company's values and direction. [Specific value/aspect] stands out because [reason]. I also [mention something current about company] which appeals to me because [why]."
        - Make it personal and genuine

        (v) CONCLUSION:
        - State what you want clearly
        - Express confidence in fit
        - Professional closing
        - Format: "I think you'll find that my experience is a really good fit for {job_data.get('company', '')} and specifically this position. I'm ready to take my skills to the next level with your team and look forward to hearing back."

        CRITICAL REQUIREMENTS:
        1. ONLY use information provided in the REAL CANDIDATE DATA above - DO NOT make up any information
        2. If a field shows "Not found", do not mention that aspect or make up fake data
        3. MUST highlight specific projects from resume that relate to job requirements
        4. MUST highlight relevant work experience with concrete examples
        5. Use numbers and specific achievements wherever possible
        6. Keep it to 300-400 words total
        7. Professional but engaging tone
        8. No generic statements - everything must be specific to this role/company
        9. Include actual project names and work experience details from the resume
        10. DO NOT HALLUCINATE - only use the exact data provided above

        Format as a proper business letter with:
        [Today's Date]

        Dear Hiring Manager,

        [Cover letter content following the 5-part structure]

        Sincerely,
        {resume_data.get('name', '[Your Name]')}
        """
    
    def _get_linkedin_dm_prompt(self, state: ContentGenerationState) -> str:
        """Generate prompt for LinkedIn DM"""
        job_data = state["job_data"]
        resume_data = state["resume_data"]
        
        return f"""
        Write a professional LinkedIn direct message to a recruiter or hiring manager.
        
        Job Details:
        - Role: {job_data.get('role', '')}
        - Company: {job_data.get('company', '')}
        - Key Skills: {', '.join(job_data.get('skills', [])[:5])}
        
        Candidate Details:
        - Name: {resume_data.get('name', '')}
        - Background: {resume_data.get('summary', '')}
        - Top Skills: {', '.join([s.get('name', '') for s in resume_data.get('skills', [])[:5]])}
        
        Requirements:
        1. Keep it very concise (under 100 words)
        2. Friendly but professional tone
        3. Mention specific role/company
        4. Highlight 1-2 key qualifications
        5. Clear ask (connection, conversation, application)
        6. No attachments mentioned (LinkedIn limitation)
        7. Personable and authentic
        
        Format: Just the message content, no "Subject:" or signatures needed.
        """
    
    def _get_linkedin_connection_prompt(self, state: ContentGenerationState) -> str:
    
        job_data = state["job_data"]
        resume_data = state["resume_data"]
        
        return f"""
        Write a personalized LinkedIn connection request note (MAXIMUM 200 characters).
        
        Job Details:
        - Role: {job_data.get('role', '')}
        - Company: {job_data.get('company', '')}
        - Key Skills Required: {', '.join(job_data.get('skills', [])[:3])}
        
        Candidate Details:
        - Name: {resume_data.get('name', '')}
        - Top Skills: {', '.join([s.get('name', '') for s in resume_data.get('skills', [])[:3]])}
        - Current Background: {resume_data.get('experience', [{}])[0].get('job_title', '') if resume_data.get('experience') else ''}
        
        CRITICAL REQUIREMENTS:
        1. MAXIMUM 200 characters (LinkedIn's strict limit)
        2. Mention specific role OR company (not both due to character limit)
        3. Professional but friendly tone
        4. Clear reason for connecting
        5. No generic phrases like "I'd like to add you to my network"
        6. Make it personal and relevant
        7. Count characters carefully - LinkedIn will truncate at 200
        
        Examples of good connection notes:
        - "Hi [Name], I'm interested in the {job_data.get('role', 'Software Engineer')} role at {job_data.get('company', 'your company')}. I have experience in {resume_data.get('skills', [{}])[0].get('name', 'relevant technologies') if resume_data.get('skills') else 'software development'}. Would love to connect!"
        - "Hello! Saw the {job_data.get('role', 'position')} opening. My background in {resume_data.get('skills', [{}])[0].get('name', 'tech') if resume_data.get('skills') else 'development'} aligns well. Happy to connect and learn more!"
        
        Format: Just the connection note text, no greetings or signatures.
        REMEMBER: Maximum 200 characters including spaces and punctuation.
        """
    
    def _format_work_experience(self, work_experience: List) -> str:
        """Format work experience for the prompt"""
        if not work_experience:
            return "No work experience found in resume"
        
        formatted = []
        for exp in work_experience:
            if isinstance(exp, dict):
                job_title = exp.get('job_title', 'Unknown Role')
                company = exp.get('company', 'Unknown Company')
                duration = exp.get('duration', 'Unknown Duration')
                responsibilities = exp.get('responsibilities', [])
                achievements = exp.get('achievements', [])
                
                exp_text = f"- {job_title} at {company} ({duration})"
                if responsibilities:
                    exp_text += f"\n  Responsibilities: {'; '.join(responsibilities[:3])}"
                if achievements:
                    exp_text += f"\n  Achievements: {'; '.join(achievements[:3])}"
                formatted.append(exp_text)
        
        return '\n'.join(formatted) if formatted else "No detailed work experience found"
    
    def _format_projects(self, projects: List) -> str:
        """Format projects for the prompt"""
        if not projects:
            return "No projects found in resume"
        
        formatted = []
        for proj in projects:
            if isinstance(proj, dict):
                name = proj.get('name', 'Unknown Project')
                description = proj.get('description', 'No description')
                technologies = proj.get('technologies', [])
                achievements = proj.get('achievements', [])
                
                proj_text = f"- {name}: {description}"
                if technologies:
                    proj_text += f"\n  Technologies: {', '.join(technologies[:5])}"
                if achievements:
                    proj_text += f"\n  Achievements: {'; '.join(achievements[:3])}"
                formatted.append(proj_text)
        
        return '\n'.join(formatted) if formatted else "No detailed projects found"
    
    def _format_education(self, education: List) -> str:
        """Format education for the prompt"""
        if not education:
            return "No education found in resume"
        
        formatted = []
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get('degree', 'Unknown Degree')
                institution = edu.get('institution', 'Unknown Institution')
                graduation_year = edu.get('graduation_year', '')
                gpa = edu.get('gpa', '')
                
                edu_text = f"- {degree} from {institution}"
                if graduation_year:
                    edu_text += f" ({graduation_year})"
                if gpa:
                    edu_text += f", GPA: {gpa}"
                formatted.append(edu_text)
        
        return '\n'.join(formatted) if formatted else "No detailed education found"
    
    def _format_skills(self, skills: List) -> str:
        """Format skills for the prompt"""
        if not skills:
            return "No skills found in resume"
        
        skill_names = []
        for skill in skills:
            if isinstance(skill, dict):
                name = skill.get('name', '')
                level = skill.get('level', '')
                years = skill.get('years_experience', '')
                
                skill_text = name
                if level:
                    skill_text += f" ({level})"
                if years:
                    skill_text += f" - {years} years"
                skill_names.append(skill_text)
            elif isinstance(skill, str):
                skill_names.append(skill)
        
        return ', '.join(skill_names[:15]) if skill_names else "No skills found"

    async def generate_content(self, job_data: Dict, resume_data: Dict, 
                             skill_match_data: Dict, content_type: str) -> Dict[str, Any]:
        """Main method to generate content"""
        try:
            print(f"🚀 Starting {content_type} generation workflow...")
            
            # Create initial state
            initial_state = {
                "job_data": job_data,
                "resume_data": resume_data,
                "skill_match_data": skill_match_data,
                "content_type": content_type,
                "generated_content": "",
                "personalization_notes": [],
                "error": ""
            }
            
            # Run the workflow
            final_state = await self.workflow.ainvoke(initial_state)
            
            if final_state["error"]:
                return {
                    "success": False,
                    "error": final_state["error"],
                    "content": ""
                }
            
            return {
                "success": True,
                "content": final_state["generated_content"],
                "personalization_notes": final_state["personalization_notes"],
                "content_type": content_type
            }
            
        except Exception as e:
            print(f"❌ Content generation workflow failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": ""
            }