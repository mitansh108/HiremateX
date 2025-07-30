import { NextResponse } from 'next/server';
// import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

interface JobData {
  role: string;
  skills: string[];
  company?: string;
  location?: string;
  description?: string;
  responsibilities?: string;
  qualifications?: string;
  preferredQualifications?: string;
  education?: string;
  experience?: string;
  benefits?: string;
  salary?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { url, manualText } = await request.json();

    if (!url && !manualText) {
      return NextResponse.json(
        { error: 'URL or manual text is required' },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required - missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with service role for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Deduct credits for job extraction
    console.log('💳 Deducting credits for job extraction...');
    try {
      const creditResponse = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/credits/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          action_type: 'job_search',
          metadata: {
            endpoint: 'extract-job',
            url: url || 'manual_text',
            content_length: manualText?.length || 0
          }
        })
      });

      if (!creditResponse.ok) {
        let creditError;
        try {
          creditError = await creditResponse.json();
        } catch (parseError) {
          console.error('❌ Failed to parse credit response:', parseError);
          creditError = { detail: 'Credit service unavailable' };
        }
        
        return NextResponse.json(
          { 
            error: 'insufficient_credits',
            message: creditError.detail || 'Insufficient credits for job extraction',
            requiresCredits: true
          },
          { status: 402 }
        );
      }

      const creditResult = await creditResponse.json();
      console.log(`✅ Credits deducted: ${creditResult.credits_used}. Remaining: ${creditResult.credits_after}`);
      
    } catch (creditError) {
      console.error('❌ Credit deduction failed:', creditError);
      // Continue without credit deduction if service is unavailable
      console.log('⚠️ Continuing without credit deduction due to service unavailability');
    }

    let content: string;

    if (manualText) {
      console.log('📝 Using manual text input, length:', manualText.length);
      content = manualText;
    } else {
      console.log('🌐 Attempting to scrape URL:', url);
      try {
        // Simple fetch-based scraping as fallback
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Basic HTML text extraction (remove tags)
        content = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (!content || content.length < 100) {
          throw new Error('Insufficient content extracted from URL');
        }
        
        console.log('✅ Successfully scraped content, length:', content.length);
        
      } catch (scrapeError) {
        console.error('❌ Web scraping failed:', scrapeError);
        return NextResponse.json(
          {
            error: 'scraping_blocked',
            message: 'Unable to scrape this job posting. The site may be protected or the URL is invalid. Please paste the job description manually.',
            requiresManualInput: true,
          },
          { status: 200 }
        );
      }
    }

    const prompt = `
You are a comprehensive job posting analyzer with EXPERT-LEVEL technical skill detection capabilities. Your PRIMARY and MOST CRITICAL task is to identify ALL technical skills with 99%+ accuracy.

Job posting content:
${content}

🎯 PRIMARY MISSION - TECHNICAL SKILLS EXTRACTION (99%+ ACCURACY REQUIRED):
Scan the ENTIRE job posting for technical skills including:
- Programming Languages: Python, JavaScript, Java, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, etc.
- Frontend: React, Angular, Vue, HTML, CSS, TypeScript, jQuery, Bootstrap, Tailwind, etc.
- Backend: Node.js, Django, Flask, Spring, Express, FastAPI, Laravel, Rails, etc.
- Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB, etc.
- Cloud/DevOps: AWS, Azure, GCP, Docker, Kubernetes, Jenkins, Terraform, Ansible, etc.
- Tools: Git, Linux, Nginx, Apache, Webpack, Babel, Jest, Pytest, etc.
- Data/AI: Pandas, NumPy, TensorFlow, PyTorch, Spark, Hadoop, Tableau, Power BI, etc.
- Mobile: iOS, Android, React Native, Flutter, Xamarin, etc.

🧠 INTELLIGENT SKILL INFERENCE:
Also include IMPLIED technical skills based on the role:
- If "Full Stack Developer" → likely needs: HTML, CSS, JavaScript, Git, REST APIs
- If "Data Scientist" → likely needs: SQL, Python/R, Statistics, Machine Learning
- If "DevOps Engineer" → likely needs: Linux, Bash, CI/CD, Monitoring tools
- If "Frontend Developer" → likely needs: Responsive Design, Browser DevTools, NPM/Yarn
- If mentions "APIs" → likely needs: REST, JSON, HTTP, Postman
- If mentions "Database" → likely needs: SQL, Database Design
- If mentions "Cloud" → likely needs: Cloud Architecture, Networking

Extract and return ONLY a JSON object with this structure:
{
  "role": "Job title/position name",
  "company": "Company name",
  "location": "Job location (city, state, remote, etc.)",
  "description": "Generate a concise 2-3 sentence summary of what this role involves and its main purpose",
  "responsibilities": "Generate a brief paragraph summarizing the key responsibilities and daily tasks",
  "skills": ["COMPREHENSIVE list of ALL technical skills - mentioned AND implied"],
  "qualifications": "Generate a concise paragraph summarizing the required qualifications and must-have requirements",
  "preferredQualifications": "Generate a brief paragraph summarizing preferred qualifications and nice-to-have skills",
  "education": "Education requirements (degree, field of study)",
  "experience": "Years of experience required",
  "benefits": "Generate a brief paragraph summarizing benefits, perks, and compensation details if mentioned",
  "salary": "Salary range or compensation info if mentioned"
}

Instructions:
- 🎯 SKILLS ARRAY IS YOUR TOP PRIORITY - Extract with 99%+ accuracy
- Include both explicitly mentioned AND logically implied technical skills
- Return ONLY the JSON object, no additional text.
    `;

    // 🔁 Replace Gemini with Groq call
    console.log('🤖 Sending prompt to Groq...');
    const groqResponse = await groq.chat.completions.create({
      model: 'llama3-70b-8192', // or llama3-8b-8192 if smaller is desired
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const responseText = groqResponse.choices[0].message.content?.trim() || '';
    console.log('📥 Groq response:', responseText.slice(0, 200) + '...');

    let jobData: JobData;

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Groq response');
      }
      jobData = JSON.parse(jsonMatch[0]);

      if (!jobData.role || !Array.isArray(jobData.skills)) {
        throw new Error('Invalid job data format');
      }
    } catch (error) {
      console.error('❌ Error parsing job data:', error);
      return NextResponse.json(
        {
          error: 'scraping_blocked',
          message: 'Unable to process this job posting automatically. Please paste the job description manually.',
          requiresManualInput: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(jobData);
  } catch (error) {
    console.error('❌ Error extracting job data:', error);
    return NextResponse.json(
      {
        error: 'scraping_blocked',
        message: 'This site is protected against automated scraping. Please paste the job description manually.',
        requiresManualInput: true,
      },
      { status: 200 }
    );
  }
}
