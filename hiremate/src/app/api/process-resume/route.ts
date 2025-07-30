import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTextFromPDF, validatePDFBuffer, cleanExtractedText } from '@/lib/pdf-extractor'

// Create Supabase client for server-side operations with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to ensure user profile exists
const ensureUserProfile = async (userId: string) => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // Get user details from auth
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !user) {
        console.error('Error getting user details:', authError);
        return { success: false, error: 'User not found' };
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { success: false, error: profileError };
      } else {
        console.log('Profile created successfully for user:', userId);
        return { success: true };
      }
    }
    
    return { success: true }; // Profile already exists
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return { success: false, error };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Note: Don't check Content-Type manually - Next.js handles FormData automatically

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const filename = formData.get('filename') as string

    if (!file || !userId || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📄 Processing resume upload:', {
      filename,
      userId,
      fileSize: file.size,
      fileType: file.type
    })

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Create unique file path
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${filename}`
    const filePath = `${userId}/${uniqueFilename}`

    console.log('📁 Uploading to Supabase storage:', filePath)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    let uploadData: any = null
    const { data: initialUploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)

      // If bucket doesn't exist, try to create it
      if (uploadError.message.includes('Bucket not found')) {
        console.log('🪣 Creating resumes bucket...')
        const { error: bucketError } = await supabase.storage.createBucket('resumes', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf']
        })

        if (bucketError) {
          console.error('Failed to create bucket:', bucketError)
          return NextResponse.json(
            { error: `Failed to create storage bucket: ${bucketError.message}` },
            { status: 500 }
          )
        } else {
          // Try upload again after creating bucket
          const { data: retryUploadData, error: retryUploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            })

          if (retryUploadError) {
            return NextResponse.json(
              { error: `Failed to upload file after creating bucket: ${retryUploadError.message}` },
              { status: 500 }
            )
          }

          uploadData = retryUploadData
        }
      } else {
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadError.message}` },
          { status: 500 }
        )
      }
    } else {
      uploadData = initialUploadData
    }

    console.log('✅ File uploaded successfully:', uploadData)

    // Generate a signed URL for the uploaded file (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (urlError) {
      console.error('❌ Failed to generate signed URL:', urlError)
      // Continue anyway, we can generate URLs later when needed
    }

    // Ensure user profile exists before saving resume
    console.log('👤 Ensuring user profile exists for:', userId)
    const profileResult = await ensureUserProfile(userId)
    if (!profileResult.success) {
      console.error('❌ Failed to ensure user profile:', profileResult.error)
      // Try to clean up uploaded file
      await supabase.storage.from('resumes').remove([filePath])
      return NextResponse.json(
        { error: `Failed to create user profile: ${profileResult.error}` },
        { status: 500 }
      )
    }

    // Save resume record to database (matching your existing schema)
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        filename: filename,
        file_path: filePath,
        parsed_data: null // Will be populated by Python parsing
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('resumes').remove([filePath])
      return NextResponse.json(
        { error: `Failed to save resume record: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Resume record saved:', resumeData)

    console.log('✅ Resume uploaded to Supabase successfully!')

    // STEP 2: Extract text from PDF
    console.log('📄 Step 2: Extracting text from PDF...')

    // Validate PDF buffer first
    const isValidPDF = await validatePDFBuffer(buffer)
    if (!isValidPDF) {
      console.error('❌ Invalid PDF file')
      return NextResponse.json({
        success: false,
        error: 'Invalid PDF file format'
      }, { status: 400 })
    }

    // Skip PDF text extraction during build - let Python service handle it
    console.log('📄 Skipping frontend PDF extraction, will let Python service handle it')
    let extractedText = ''
    let useBufferFallback = true

    // STEP 3: Send data to Python service for parsing
    console.log('📄 Step 3: Sending data to Python service for parsing...')

    let parsingSuccess = false
    let parsingError = null

    try {
      // Prepare data for Python service
      const requestData = useBufferFallback 
        ? {
            resume_id: resumeData.id,
            raw_text: buffer.toString('base64'), // Send PDF buffer as base64 for Python to extract text
            is_pdf_buffer: true
          }
        : {
            resume_id: resumeData.id,
            raw_text: extractedText, // Send extracted text
            is_pdf_buffer: false
          }

      console.log(`📤 Sending ${useBufferFallback ? 'PDF buffer' : 'extracted text'} to Python service`)

      // Call Python service
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const parseResponse = await fetch('http://localhost:8000/parse-resume-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (parseResponse.ok) {
        const parseResult = await parseResponse.json()
        if (parseResult.success) {
          console.log('✅ Python parsing completed and stored in Supabase!')
          console.log('📊 Parsed data preview:', {
            skills: parseResult.data?.skills?.length || 0,
            experience: parseResult.data?.experience?.length || 0,
            projects: parseResult.data?.projects?.length || 0
          })
          parsingSuccess = true
        } else {
          console.error('❌ Python parsing failed:', parseResult.message || 'Unknown error')
          parsingError = parseResult.message || 'Parsing failed'
        }
      } else {
        const errorText = await parseResponse.text()
        console.error('❌ Python service error:', parseResponse.status, errorText)
        parsingError = `Python service error: ${parseResponse.status}`
      }

    } catch (parseError) {
      console.error('❌ Python parsing failed:', parseError)
      parsingError = parseError instanceof Error ? parseError.message : 'Network error'
    }

    // Return response with parsing status
    return NextResponse.json({
      success: true,
      message: parsingSuccess
        ? 'Resume uploaded and parsed successfully'
        : 'Resume uploaded successfully, but parsing failed',
      resume: {
        id: resumeData.id,
        filename: resumeData.filename,
        filePath: resumeData.file_path,
        fileUrl: urlData?.signedUrl || null,
        uploadedAt: resumeData.created_at
      },
      parsing: {
        success: parsingSuccess,
        error: parsingError
      }
    })

  } catch (error) {
    console.error('❌ Resume processing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}