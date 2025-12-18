import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    const examId = formData.get('examId') as string
    const examName = formData.get('examName') as string
    const year = formData.get('year') as string
    const category = formData.get('category') as string | null
    const parserStrategy = formData.get('parserStrategy') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!examId || !examName || !year) {
      return NextResponse.json(
        { error: 'Missing exam details' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public')
    
    // Save PDF with exam-specific name
    const pdfFileName = `${examId}_${year}.pdf`
    const pdfPath = path.join(publicDir, pdfFileName)
    
    await writeFile(pdfPath, buffer)

    // Store exam metadata (we'll use this later)
    const metadata: any = {
      examId,
      examName,
      year,
      pdfFileName,
      uploadedAt: new Date().toISOString()
    }
    
    if (category) {
      metadata.category = category
    }
    if (parserStrategy) {
      metadata.parserStrategy = parserStrategy
    }

    // Save metadata to a JSON file (optional, for tracking)
    const metadataPath = path.join(publicDir, `${examId}_metadata.json`)
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      pdfPath: pdfFileName,
      examId,
      examName,
      year
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

