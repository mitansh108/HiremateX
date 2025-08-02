from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
import stripe
from datetime import datetime
from agents.comprehensive_resume_parser import ComprehensiveResumeParser
from agents.content_generator import ContentGeneratorAgent
from agents.simple_credit_manager import credit_manager
from agents.skill_matcher import skill_matcher
from models.schemas import ResumeParsingRequest, ResumeParsingResponse, ParsedResume
from utils.credit_decorator import require_credits, check_credits_only

# Load environment variables
import os
from pathlib import Path

# Get the directory where this script is located
current_dir = Path(__file__).parent
env_path = current_dir / ".env"

# Load environment variables from the correct path

load_dotenv(dotenv_path=env_path)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
print("✅ Stripe API key configured successfully")

app = FastAPI(
    title="AI Resume Analysis Service",
    description="LangGraph-powered resume parsing and job matching service",
    version="1.0.0"
)

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"🔍 {request.method} {request.url}")
    print(f"🔍 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    print(f"🔍 Response status: {response.status_code}")
    return response

# Initialize the agents
comprehensive_parser = ComprehensiveResumeParser()  # New comprehensive parser
content_generator = ContentGeneratorAgent()

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle all OPTIONS requests"""
    return {"message": "OK"}

@app.get("/")
async def root():
    return {
        "message": "AI Resume Analysis Service is running!",
        "version": "1.0.0",
        "endpoints": {
            "parse_resume_comprehensive": "/parse-resume-comprehensive",
            "get_parsed_resume": "/get-parsed-resume",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    # Test Supabase connectivity
    supabase_status = "unknown"
    try:
        # Quick test of Supabase connection
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{os.getenv('SUPABASE_URL')}/rest/v1/",
                headers={"apikey": os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_SERVICE_KEY')}
            )
            supabase_status = "connected" if response.status_code < 500 else "error"
    except Exception as e:
        supabase_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "ai-resume-analysis",
        "langgraph": "operational",
        "supabase": supabase_status,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/parse-resume-comprehensive")
async def parse_resume_comprehensive(request: dict):
    """
    Comprehensive resume parsing - parse once, store in Supabase
    """
    try:
        resume_id = request.get("resume_id")
        raw_text = request.get("raw_text")
        is_pdf_buffer = request.get("is_pdf_buffer", False)
        
        if not resume_id or not raw_text:
            raise HTTPException(status_code=400, detail="resume_id and raw_text are required")
        
        print(f"🚀 Starting comprehensive resume parsing for resume {resume_id}")
        
        # Handle different input types
        if is_pdf_buffer:
            print("📄 Received PDF buffer, extracting text...")
            # Extract text from PDF buffer
            extracted_text = comprehensive_parser.extract_text_from_pdf_base64(raw_text)
            if not extracted_text:
                raise HTTPException(status_code=400, detail="Failed to extract text from PDF buffer")
            print(f"✅ Extracted {len(extracted_text)} characters from PDF")
            final_text = extracted_text
        else:
            print(f"📄 Received {len(raw_text)} characters of pre-extracted text")
            final_text = raw_text
        
        # Parse complete resume data
        parsed_data = await comprehensive_parser.parse_complete_resume(final_text)
        
        # Store in Supabase
        await comprehensive_parser.update_resume_in_supabase(resume_id, parsed_data)
        
        return {
            "success": True,
            "message": "Resume parsed and stored successfully",
            "data": parsed_data
        }
        
    except Exception as e:
        print(f"❌ Comprehensive resume parsing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Comprehensive resume parsing failed: {str(e)}"
        )

@app.post("/get-parsed-resume")
async def get_parsed_resume(request: dict):
    """
    Get parsed resume data from Supabase
    """
    try:
        user_id = request.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"📖 Getting parsed resume for user {user_id}")
        
        # Get parsed data from Supabase
        parsed_data = await comprehensive_parser.get_parsed_resume_from_supabase(user_id)
        
        if parsed_data:
            return {
                "success": True,
                "data": parsed_data
            }
        else:
            return {
                "success": False,
                "message": "No parsed resume found"
            }
        
    except Exception as e:
        print(f"❌ Failed to get parsed resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get parsed resume: {str(e)}"
        )

# Import the new skill matcher
from agents.skill_matcher import skill_matcher

# ============================================================================
# SKILL ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/skill-analysis/comprehensive")
@require_credits("skill_analysis")
async def comprehensive_skill_analysis(request: dict):
    """
    Advanced skill matching using multiple AI models and rule-based systems
    """
    try:
        job_skills = request.get("job_skills", [])
        resume_skills = request.get("resume_skills", [])
        analysis_type = request.get("analysis_type", "hybrid")  # hybrid, ai_only, rule_only
        
        print(f"🧠 Starting comprehensive skill analysis ({analysis_type})...")
        print(f"📋 Job Skills ({len(job_skills)}): {job_skills}")
        print(f"👤 Resume Skills ({len(resume_skills)}): {resume_skills}")
        
        # Use the new advanced skill matcher
        result = await skill_matcher.analyze_skills_comprehensive(job_skills, resume_skills)
        
        # Convert to API response format
        api_response = {
            "success": True,
            "match_percentage": round(result.match_percentage, 1),
            "match_level": result.match_level,
            "analysis_method": result.analysis_method,
            "confidence_score": result.confidence_score,
            "matched_skills": [
                {
                    "job_skill": match.job_skill,
                    "resume_skill": match.resume_skill,
                    "match_type": match.match_type,
                    "confidence": match.confidence,
                    "reasoning": match.reasoning
                } for match in result.matched_skills
            ],
            "missing_skills": result.missing_skills,
            "bonus_skills": result.bonus_skills,
            "summary": {
                "total_job_skills": len(job_skills),
                "total_resume_skills": len(resume_skills),
                "matched_count": len(result.matched_skills),
                "missing_count": len(result.missing_skills),
                "bonus_count": len(result.bonus_skills)
            }
        }
        
        print(f"✅ Comprehensive analysis completed!")
        print(f"🎯 Match: {result.match_percentage:.1f}% ({result.match_level})")
        print(f"🔧 Method: {result.analysis_method}")
        print(f"✅ Matched: {len(result.matched_skills)} skills")
        print(f"❌ Missing: {len(result.missing_skills)} skills")
        print(f"🎁 Bonus: {len(result.bonus_skills)} skills")
        
        return api_response
        
    except Exception as e:
        print(f"❌ Comprehensive skill analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Comprehensive skill analysis failed: {str(e)}"
        )

@app.post("/skill-analysis/fast")
@require_credits("skill_analysis_fast")
async def fast_skill_analysis(request: dict):
    """
    Fast rule-based skill matching for quick results
    """
    try:
        job_skills = request.get("job_skills", [])
        resume_skills = request.get("resume_skills", [])
        
        print(f"⚡ Starting fast skill analysis...")
        
        # Use rule-based matching only
        result = await skill_matcher._rule_based_matching(job_skills, resume_skills)
        
        # Convert to API response format
        api_response = {
            "success": True,
            "match_percentage": round(result.match_percentage, 1),
            "match_level": result.match_level,
            "analysis_method": "rule_based_fast",
            "matched_skills": [
                {
                    "job_skill": match.job_skill,
                    "resume_skill": match.resume_skill,
                    "match_type": match.match_type,
                    "confidence": match.confidence,
                    "reasoning": match.reasoning
                } for match in result.matched_skills
            ],
            "missing_skills": result.missing_skills,
            "bonus_skills": result.bonus_skills
        }
        
        print(f"⚡ Fast analysis completed: {result.match_percentage:.1f}% match")
        
        return api_response
        
    except Exception as e:
        print(f"❌ Fast skill analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Fast skill analysis failed: {str(e)}"
        )

@app.post("/skill-analysis/ai-powered")
@require_credits("skill_analysis_ai")
async def ai_powered_skill_analysis(request: dict):
    """
    AI-only skill matching using advanced language models
    """
    try:
        job_skills = request.get("job_skills", [])
        resume_skills = request.get("resume_skills", [])
        
        print(f"🤖 Starting AI-powered skill analysis...")
        
        # Use AI-powered matching only
        result = await skill_matcher._ai_powered_matching(job_skills, resume_skills)
        
        # Convert to API response format
        api_response = {
            "success": True,
            "match_percentage": round(result.match_percentage, 1),
            "match_level": result.match_level,
            "analysis_method": "ai_powered",
            "matched_skills": [
                {
                    "job_skill": match.job_skill,
                    "resume_skill": match.resume_skill,
                    "match_type": match.match_type,
                    "confidence": match.confidence,
                    "reasoning": match.reasoning
                } for match in result.matched_skills
            ],
            "missing_skills": result.missing_skills,
            "bonus_skills": result.bonus_skills
        }
        
        print(f"🤖 AI analysis completed: {result.match_percentage:.1f}% match")
        
        return api_response
        
    except Exception as e:
        print(f"❌ AI skill analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI skill analysis failed: {str(e)}"
        )

# Main skill matching endpoint (legacy compatible)
@app.post("/skill-match-analysis")
@require_credits("skill_analysis")
async def skill_match_analysis(request: dict):
    """
    Advanced skill matching using the new comprehensive system
    """
    try:
        job_skills = request.get("job_skills", [])
        resume_skills = request.get("resume_skills", [])
        
        print(f"🎯 Starting skill match analysis...")
        print(f"📋 Job Skills ({len(job_skills)}): {job_skills}")
        print(f"👤 Resume Skills ({len(resume_skills)}): {resume_skills}")
        
        # Use the new advanced skill matcher
        result = await skill_matcher.analyze_skills_comprehensive(job_skills, resume_skills)
        
        # Convert to API response format (legacy compatible)
        api_response = {
            "success": True,
            "match_percentage": round(result.match_percentage, 1),
            "match_level": result.match_level,
            "matched_skills": [
                {
                    "job_skill": match.job_skill,
                    "resume_skill": match.resume_skill,
                    "match_type": match.match_type,
                    "confidence": match.confidence,
                    "reasoning": match.reasoning
                } for match in result.matched_skills
            ],
            "missing_skills": result.missing_skills,
            "bonus_skills": result.bonus_skills,
            "summary": {
                "total_job_skills": len(job_skills),
                "total_resume_skills": len(resume_skills),
                "matched_count": len(result.matched_skills),
                "missing_count": len(result.missing_skills),
                "bonus_count": len(result.bonus_skills)
            }
        }
        
        print(f"✅ Skill analysis completed!")
        print(f"🎯 Match: {result.match_percentage:.1f}% ({result.match_level})")
        print(f"✅ Matched: {len(result.matched_skills)} skills")
        print(f"❌ Missing: {len(result.missing_skills)} skills")
        
        return api_response
        
    except Exception as e:
        print(f"❌ Skill match analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Skill match analysis failed: {str(e)}"
        )

# This endpoint is removed - using comprehensive parsing instead

# Content Generation Endpoints
@app.post("/generate-cold-email")
@require_credits("cold_email")
async def generate_cold_email(request: dict):
    """Generate personalized cold email using LangGraph"""
    try:
        job_data = request.get("job_data", {})
        resume_data = request.get("resume_data", {})
        skill_match_data = request.get("skill_match_data", {})
        user_id = request.get("user_id")  # Required for credit deduction
        
        print("🔥 Starting cold email generation...")
        print(f"📊 Request data types:")
        print(f"   job_data: {type(job_data)} - {job_data}")
        print(f"   resume_data: {type(resume_data)} - {str(resume_data)[:200]}...")
        print(f"   skill_match_data: {type(skill_match_data)} - {skill_match_data}")
        
        # Ensure resume_data is a dict
        if not isinstance(resume_data, dict):
            print(f"⚠️ Converting resume_data from {type(resume_data)} to dict")
            resume_data = {}
        
        result = await content_generator.generate_content(
            job_data=job_data,
            resume_data=resume_data,
            skill_match_data=skill_match_data,
            content_type="cold_email"
        )
        
        return result
        
    except Exception as e:
        print(f"❌ Cold email generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Cold email generation failed: {str(e)}"
        )

@app.post("/generate-cover-letter")
@require_credits("cover_letter")
async def generate_cover_letter(request: dict):
    """Generate personalized cover letter using comprehensive resume data"""
    try:
        job_data = request.get("job_data", {})
        resume_data = request.get("resume_data", {})  # Resume data sent directly from frontend
        skill_match_data = request.get("skill_match_data", {})
        user_id = request.get("user_id")  # Optional - for fetching from Supabase if needed
        
        print("📄 Starting cover letter generation...")
        
        # Use provided resume data or fetch from Supabase
        if resume_data and resume_data.get('skills'):
            print("✅ Using resume data provided from frontend")
            comprehensive_resume_data = resume_data
        elif user_id:
            print("📖 Getting comprehensive resume data from Supabase...")
            comprehensive_resume_data = await comprehensive_parser.get_parsed_resume_from_supabase(user_id)
            
            if not comprehensive_resume_data:
                raise HTTPException(
                    status_code=404, 
                    detail="No parsed resume found. Please upload and parse your resume first."
                )
            print("✅ Using comprehensive resume data from Supabase")
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either resume_data or user_id is required"
            )
        
        print(f"📊 Resume data summary: {len(comprehensive_resume_data.get('skills', []))} skills, {len(comprehensive_resume_data.get('experience', []))} experiences, {len(comprehensive_resume_data.get('projects', []))} projects")
        
        result = await content_generator.generate_content(
            job_data=job_data,
            resume_data=comprehensive_resume_data,
            skill_match_data=skill_match_data,
            content_type="cover_letter"
        )
        
        return result
        
    except Exception as e:
        print(f"❌ Cover letter generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Cover letter generation failed: {str(e)}"
        )

@app.post("/generate-linkedin-dm")
@require_credits("linkedin_dm")
async def generate_linkedin_dm(request: dict):
    """Generate personalized LinkedIn DM using LangGraph"""
    try:
        job_data = request.get("job_data", {})
        resume_data = request.get("resume_data", {})
        skill_match_data = request.get("skill_match_data", {})
        user_id = request.get("user_id")  # Required for credit deduction
        
        print("💼 Starting LinkedIn DM generation...")
        
        result = await content_generator.generate_content(
            job_data=job_data,
            resume_data=resume_data,
            skill_match_data=skill_match_data,
            content_type="linkedin_dm"
        )
        
        return result
        
    except Exception as e:
        print(f"❌ LinkedIn DM generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"LinkedIn DM generation failed: {str(e)}"
        )

@app.post("/generate-linkedin-connection-note")
@require_credits("linkedin_connection")
async def generate_linkedin_connection_note(request: dict):
    """Generate personalized LinkedIn connection note using LangGraph"""
    try:
        job_data = request.get("job_data", {})
        resume_data = request.get("resume_data", {})
        skill_match_data = request.get("skill_match_data", {})
        
        print("🤝 Starting LinkedIn connection note generation...")
        
        result = await content_generator.generate_content(
            job_data=job_data,
            resume_data=resume_data,
            skill_match_data=skill_match_data,
            content_type="linkedin_connection_note"
        )
        
        return result
        
    except Exception as e:
        print(f"❌ LinkedIn connection note generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"LinkedIn connection note generation failed: {str(e)}"
        )



@app.get("/credits/test")
async def test_credits_system():
    """Test the credits system connectivity"""
    try:
        # Test with a dummy user ID
        result = await credit_manager.get_user_credits("test-user-123")
        return {
            "status": "success",
            "message": "Credits system is working",
            "test_result": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Credits system error: {str(e)}",
            "error_type": type(e).__name__
        }

@app.post("/credits/check")
async def check_user_credits(request: dict):
    """Check user's current credit balance"""
    try:
        print(f"🔍 Credits check request received: {request}")
        
        user_id = request.get("user_id")
        
        if not user_id:
            print("❌ Missing user_id in request")
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"💳 Checking credits for user: {user_id}")
        
        result = await credit_manager.get_user_credits(user_id)
        
        print(f"✅ Credit check result: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to check credits: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check credits: {str(e)}"
        )

@app.post("/credits/deduct")
async def deduct_credits(request: dict):
    """Deduct credits for an action using AI-powered credit management"""
    try:
        user_id = request.get("user_id")
        action_type = request.get("action_type")
        metadata = request.get("metadata", {})
        
        if not user_id or not action_type:
            raise HTTPException(status_code=400, detail="user_id and action_type are required")
        
        print(f"💰 Processing credit deduction for user {user_id}, action: {action_type}")
        
        # Use LangGraph AI agent to process credit usage
        result = await credit_manager.process_credit_usage(user_id, action_type, metadata)
        
        if not result["success"]:
            raise HTTPException(status_code=402, detail=result["error_message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Credit deduction failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Credit deduction failed: {str(e)}"
        )

@app.post("/credits/history")
async def get_credit_history(request: dict):
    """Get user's credit transaction history"""
    try:
        user_id = request.get("user_id")
        limit = request.get("limit", 50)
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"📊 Getting credit history for user: {user_id}")
        
        result = await credit_manager.get_credit_history(user_id, limit)
        
        return result
        
    except Exception as e:
        print(f"❌ Failed to get credit history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get credit history: {str(e)}"
        )

@app.post("/credits/add")
async def add_credits(request: dict):
    """Add credits to user account (admin/purchase endpoint)"""
    try:
        user_id = request.get("user_id")
        credits_to_add = request.get("credits_to_add")
        reason = request.get("reason", "manual_addition")
        
        if not user_id or not credits_to_add:
            raise HTTPException(status_code=400, detail="user_id and credits_to_add are required")
        
        if credits_to_add <= 0:
            raise HTTPException(status_code=400, detail="credits_to_add must be positive")
        
        print(f"💎 Adding {credits_to_add} credits to user: {user_id}")
        
        result = await credit_manager.add_credits(user_id, credits_to_add, reason)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error_message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to add credits: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add credits: {str(e)}"
        )

@app.post("/user/signup-credits")
async def assign_signup_credits(request: dict):
    """Assign initial credits to new user after signup"""
    try:
        user_id = request.get("user_id")
        email = request.get("email")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"🎉 Assigning signup credits to new user: {user_id} ({email})")
        
        # Give 20 credits to new users
        result = await credit_manager.add_credits(
            user_id=user_id, 
            credits_to_add=20, 
            reason="signup_bonus"
        )
        
        if result["success"]:
            print(f"✅ Successfully assigned 20 signup credits to user {user_id}")
            return {
                "success": True,
                "message": "Signup credits assigned successfully",
                "credits_added": 20,
                "new_balance": result.get("new_balance", 20)
            }
        else:
            raise HTTPException(status_code=400, detail=result["error_message"])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to assign signup credits: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign signup credits: {str(e)}"
        )

# ============================================================================
# STRIPE PAYMENT ENDPOINTS
# ============================================================================

@app.post("/stripe/create-checkout-session")
async def create_checkout_session(request: dict):
    """Create a Stripe checkout session for credit purchase"""
    try:
        package_id = request.get("package_id")
        user_id = request.get("user_id")
        
        if not package_id or not user_id:
            raise HTTPException(status_code=400, detail="package_id and user_id are required")
        
        # Define credit packages (should match frontend)
        credit_packages = {
            "starter": {"credits": 50, "price": 999, "name": "Starter Pack"},  # $9.99 in cents
            "professional": {"credits": 150, "price": 2499, "name": "Professional Pack", "bonus": 25},  # $24.99
            "premium": {"credits": 300, "price": 4499, "name": "Premium Pack", "bonus": 75}  # $44.99
        }
        
        if package_id not in credit_packages:
            raise HTTPException(status_code=400, detail="Invalid package_id")
        
        package = credit_packages[package_id]
        total_credits = package["credits"] + package.get("bonus", 0)
        
        print(f"💳 Creating checkout session for user {user_id}, package: {package_id}")
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{package["name"]} - {total_credits} Credits',
                        'description': f'{package["credits"]} credits' + (f' + {package.get("bonus", 0)} bonus credits' if package.get("bonus") else ''),
                    },
                    'unit_amount': package["price"],
                },
                'quantity': 1,
            }],
            metadata={
                'user_id': user_id,
                'package_id': package_id,
                'credits': package["credits"],
                'bonus_credits': package.get("bonus", 0),
                'package_name': package["name"]
            },
            mode='payment',
            success_url='https://hiremate-68eezfpda-mitansh108s-projects.vercel.app/payments?success=true',
            cancel_url='https://hiremate-68eezfpda-mitansh108s-projects.vercel.app/payments?canceled=true',
        )
        
        print(f"✅ Checkout session created: {session.id}")
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"❌ Checkout session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Checkout session creation failed: {str(e)}")

@app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        if not webhook_secret:
            print("⚠️ Warning: STRIPE_WEBHOOK_SECRET not set")
            # For development, we'll skip signature verification
            event = stripe.Event.construct_from(
                await request.json(), stripe.api_key
            )
        else:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except stripe.error.SignatureVerificationError as e:
                print(f"❌ Webhook signature verification failed: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        
        print(f"🔔 Received webhook event: {event['type']}")
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            user_id = session['metadata'].get('user_id')
            credits = int(session['metadata'].get('credits', 0))
            bonus_credits = int(session['metadata'].get('bonus_credits', 0))
            package_name = session['metadata'].get('package_name', 'Credit Purchase')
            
            total_credits = credits + bonus_credits
            
            print(f"💰 Payment succeeded for user {user_id}: {total_credits} credits")
            
            # Add credits to user account
            result = await credit_manager.add_credits(
                user_id=user_id,
                credits_to_add=total_credits,
                reason=f"stripe_purchase_{package_name.lower().replace(' ', '_')}"
            )
            
            if result["success"]:
                print(f"✅ Successfully added {total_credits} credits to user {user_id}")
            else:
                print(f"❌ Failed to add credits: {result.get('error_message')}")
        
        # Handle failed payment
        elif event['type'] == 'checkout.session.expired':
            session = event['data']['object']
            user_id = session['metadata'].get('user_id')
            print(f"❌ Payment session expired for user {user_id}")
        
        return {"success": True}
        
    except Exception as e:
        print(f"❌ Webhook handling failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Webhook handling failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )