/**
 * PDF Text Extraction Utility
 * Simplified for better build performance
 */

export async function extractTextFromPDF(file: File): Promise<string> {
    // Only attempt PDF extraction in runtime, not during build
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        throw new Error('PDF extraction disabled during build')
    }
    
    try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Dynamic import to avoid build issues
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)

        if (pdfData.text && pdfData.text.trim().length > 0) {
            console.log(`✅ PDF text extracted successfully: ${pdfData.text.length} characters`)
            return pdfData.text.trim()
        }

        throw new Error('No text found in PDF')

    } catch (error) {
        console.error('❌ PDF extraction error:', error)
        throw new Error(error instanceof Error ? error.message : 'PDF extraction failed')
    }
}

export async function validatePDFBuffer(buffer: Buffer): Promise<boolean> {
    try {
        // Check if buffer starts with PDF signature
        const pdfSignature = buffer.subarray(0, 4).toString()
        return pdfSignature === '%PDF'
    } catch {
        return false
    }
}

export function cleanExtractedText(text: string): string {
    return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim()
}