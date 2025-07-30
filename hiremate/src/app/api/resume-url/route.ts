import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    console.log('🔗 Generating signed URL for:', filePath)

    // Generate a signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (urlError) {
      console.error('❌ Failed to generate signed URL:', urlError)
      return NextResponse.json(
        { error: `Failed to generate download URL: ${urlError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Signed URL generated successfully')

    return NextResponse.json({
      success: true,
      url: urlData.signedUrl
    })

  } catch (error) {
    console.error('❌ URL generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}