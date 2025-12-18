import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const files = fs.readdirSync(publicDir)
    
    // Find all metadata files
    const metadataFiles = files.filter(file => file.endsWith('_metadata.json'))
    
    const uploadedExams = metadataFiles.map(file => {
      try {
        const metadataPath = path.join(publicDir, file)
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        
        // Check if CSV exists (meaning it's been parsed)
        const csvFileName = `cutoffs_${metadata.examId}.csv`
        const csvPath = path.join(publicDir, csvFileName)
        const hasData = fs.existsSync(csvPath)
        
        return {
          id: metadata.examId,
          name: metadata.examName,
          year: metadata.year,
          uploadedAt: metadata.uploadedAt,
          parsedAt: metadata.parsedAt,
          hasData,
          category: metadata.category || null, // Include category if available
          parserStrategy: metadata.parserStrategy || null
        }
      } catch (error) {
        console.error(`Error reading metadata file ${file}:`, error)
        return null
      }
    }).filter(exam => exam !== null)
    
    return NextResponse.json({
      exams: uploadedExams
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch exams', details: error.message },
      { status: 500 }
    )
  }
}

