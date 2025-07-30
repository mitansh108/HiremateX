import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf-extractor'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'File must be a PDF' },
                { status: 400 }
            )
        }

        // Extract text from PDF
        const text = await extractTextFromPDF(file)

        return NextResponse.json({
            success: true,
            text
        })

    } catch (error) {
        console.error('PDF text extraction failed:', error)
        return NextResponse.json(
            { error: 'Failed to extract text from PDF' },
            { status: 500 }
        )
    }
}