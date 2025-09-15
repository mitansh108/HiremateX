"""
Comprehensive Resume Parser - Parse once, store in Supabase, reuse everywhere
"""
import os
import json
import base64
from typing import Dict, Any, List
from groq import Groq
import asyncio
import PyPDF2
from io import BytesIO
import pdfplumber

class ComprehensiveResumeParser:
    """Single comprehensive parser that extracts all resume data at once"""
    
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    def extract_text_from_pdf_base64(self, base64_data: str) -> str:
        """Extract text from base64 encoded PDF with multiple fallback methods"""
        try:
            # Decode base64 to bytes
            pdf_bytes = base64.b64decode(base64_data)
            
            # Check if this is actually a PDF file or just text
            # PDF files start with %PDF
            if pdf_bytes.startswith(b'%PDF'):
                print("📄 Detected actual PDF file, extracting text...")
                
                # Method 1: Try pdfplumber first (better text extraction)
                try:
                    pdf_file = BytesIO(pdf_bytes)
                    with pdfplumber.open(pdf_file) as pdf:
                        text = ""
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                        
                        if text.strip():
                            print(f"✅ Extracted {len(text)} characters from PDF using pdfplumber")
                            return text.strip()
                except Exception as e:
                    print(f"⚠️ pdfplumber failed: {str(e)}, trying PyPDF2...")
                
                # Method 2: Fallback to PyPDF2
                try:
                    pdf_file = BytesIO(pdf_bytes)
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    text = ""
                    
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    
                    if text.strip():
                        print(f"✅ Extracted {len(text)} characters from PDF using PyPDF2")
                        return text.strip()
                except Exception as e:
                    print(f"⚠️ PyPDF2 also failed: {str(e)}")
                
                print("❌ All PDF extraction methods failed")
                return ""
            else:
                # This might be plain text encoded as base64 (for testing)
                try:
                    text = pdf_bytes.decode('utf-8')
                    print(f"✅ Detected plain text data: {len(text)} characters")
                    return text.strip()
                except:
                    print("❌ Not a valid PDF or text data")
                    return ""
            
        except Exception as e:
            print(f"❌ PDF text extraction failed: {str(e)}")
            return ""
    
    async def parse_complete_resume(self, raw_text: str) -> Dict[str, Any]:
        """Parse complete resume data in one comprehensive call"""
        try:
            print("🚀 Starting comprehensive resume parsing...")
            
            prompt = f"""
            You are an expert resume parser. Extract ALL information from this resume in one comprehensive analysis.
            
            Resume text:
            {raw_text}
            
            Return ONLY a JSON object with this EXACT structure:
            {{
                "personal": {{
                    "name": "Full Name",
                    "email": "email@example.com",
                    "phone": "phone number",
                    "location": "City, State"
                }},
                "skills": ["Python", "JavaScript", "AWS", "React"],
                "experience": [
                    {{
                        "job_title": "Job Title",
                        "company": "Company Name",
                        "duration": "Jan 2024 - Present",
                        "responsibilities": ["responsibility 1", "responsibility 2"],
                        "achievements": ["achievement 1", "achievement 2"],
                        "technologies": ["tech1", "tech2"]
                    }}
                ],
                "projects": [
                    {{
                        "name": "Project Name",
                        "description": "Project description",
                        "technologies": ["tech1", "tech2"],
                        "achievements": ["achievement 1"]
                    }}
                ],
                "education": [
                    {{
                        "degree": "Degree Name",
                        "institution": "Institution Name",
                        "graduation_year": 2024,
                        "relevant_coursework": ["course1", "course2"]
                    }}
                ],
                "parsing_confidence": 0.95
            }}
            
            CRITICAL REQUIREMENTS:
            1. Extract ALL technical skills mentioned anywhere in the resume
            2. Include ALL work experience with detailed responsibilities
            3. Include ALL projects with technologies used
            4. Include ALL education entries
            5. Skills array should be simple strings only (no objects)
            6. Return ONLY the JSON object, no additional text
            7. If any section is not found, use empty array []
            """
            
            # Use Groq for comprehensive parsing
            response = await asyncio.to_thread(
                self.groq_client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean up response - handle various markdown formats
            response_text = response_text.strip()
            
            # Remove markdown code blocks
            if '```json' in response_text:
                # Extract content between ```json and ```
                start = response_text.find('```json') + 7
                end = response_text.find('```', start)
                if end != -1:
                    response_text = response_text[start:end].strip()
            elif '```' in response_text:
                # Extract content between ``` and ```
                start = response_text.find('```') + 3
                end = response_text.find('```', start)
                if end != -1:
                    response_text = response_text[start:end].strip()
            
            # Remove any leading text before the JSON
            if response_text.startswith('Here is') or response_text.startswith('Here\'s'):
                # Find the first { character
                json_start = response_text.find('{')
                if json_start != -1:
                    response_text = response_text[json_start:]
            
            # Parse JSON
            parsed_data = json.loads(response_text)
            
            print(f"✅ Comprehensive parsing completed!")
            print(f"📊 Extracted: {len(parsed_data.get('skills', []))} skills, {len(parsed_data.get('experience', []))} experiences, {len(parsed_data.get('projects', []))} projects")
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Raw response: {response_text[:500]}...")
            
            # Try one more aggressive cleanup
            try:
                # Find the JSON object boundaries
                start_brace = response_text.find('{')
                end_brace = response_text.rfind('}')
                
                if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
                    json_content = response_text[start_brace:end_brace + 1]
                    parsed_data = json.loads(json_content)
                    print("✅ Successfully parsed JSON after aggressive cleanup!")
                    print(f"📊 Extracted: {len(parsed_data.get('skills', []))} skills, {len(parsed_data.get('experience', []))} experiences, {len(parsed_data.get('projects', []))} projects")
                    return parsed_data
                else:
                    print("❌ Could not find valid JSON boundaries")
            except Exception as cleanup_error:
                print(f"❌ Aggressive cleanup also failed: {cleanup_error}")
            
            return self._get_fallback_data(raw_text)
            
        except Exception as e:
            print(f"❌ Comprehensive parsing failed: {str(e)}")
            return self._get_fallback_data(raw_text)
    
    def _get_fallback_data(self, raw_text: str) -> Dict[str, Any]:
        """Fallback data structure if parsing fails"""
        return {
            "personal": {
                "name": "Unknown",
                "email": "",
                "phone": "",
                "location": ""
            },
            "skills": [],
            "experience": [],
            "projects": [],
            "education": [],
            "parsing_confidence": 0.1,
            "error": "Parsing failed, manual review needed"
        }
    
    async def update_resume_in_supabase(self, resume_id: str, parsed_data: Dict[str, Any]):
        """Update resume record in Supabase with parsed data"""
        try:
            print(f"💾 Storing parsed data in Supabase for resume {resume_id}...")
            
            # Import Supabase client
            import httpx
            
            supabase_url = os.getenv("SUPABASE_URL")
            service_key = os.getenv("SUPABASE_SERVICE_KEY")
            
            # Update resume record
            update_data = {
                "parsed_data": parsed_data
            }
            
            headers = {
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{supabase_url}/rest/v1/resumes?id=eq.{resume_id}",
                    json=update_data,
                    headers=headers
                )
                
                if response.status_code == 204:
                    print("✅ Resume data stored in Supabase successfully!")
                else:
                    print(f"❌ Failed to store in Supabase: {response.status_code} - {response.text}")
                    
        except Exception as e:
            print(f"❌ Supabase update failed: {str(e)}")
    
    async def get_parsed_resume_from_supabase(self, user_id: str) -> Dict[str, Any]:
        """Get parsed resume data from Supabase"""
        try:
            print(f"📖 Getting parsed resume data from Supabase for user {user_id}...")
            
            import httpx
            
            supabase_url = os.getenv("SUPABASE_URL")
            service_key = os.getenv("SUPABASE_SERVICE_KEY")
            
            headers = {
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{supabase_url}/rest/v1/resumes?user_id=eq.{user_id}&parsed_data=not.is.null&order=created_at.desc&limit=1",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        parsed_data = data[0].get("parsed_data")
                        if parsed_data:
                            print("✅ Found parsed resume data in Supabase")
                            return parsed_data
                
                print("❌ No parsed resume data found in Supabase")
                return None
                
        except Exception as e:
            print(f"❌ Failed to get parsed resume from Supabase: {str(e)}")
            return None
