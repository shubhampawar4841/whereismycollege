import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// MHET CET exams are stored as cutoffs_mht-cet-mh-cap-round-X.csv
// We'll scan for available rounds and years from metadata files
const rounds = ['round1', 'round2', 'round3']

export async function GET() {
  try {
    const availableExams: Array<{
      id: string
      name: string
      year: string
      round: string
      roundName: string
      hasData: boolean
    }> = []

    const publicPath = path.join(process.cwd(), 'public')
    
    // Get all MHET CET metadata files
    const files = fs.readdirSync(publicPath)
    const mhetMetadataFiles = files.filter(f => 
      f.startsWith('mht-cet-mh-cap-round-') && f.endsWith('_metadata.json')
    )

    // Extract years and rounds from metadata
    const yearRoundMap = new Map<string, Set<string>>()

    for (const metadataFile of mhetMetadataFiles) {
      try {
        const metadataPath = path.join(publicPath, metadataFile)
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
        const metadata = JSON.parse(metadataContent)
        
        const year = metadata.year || '2024-2025'
        const round = metadata.examId?.match(/round-(\d+)/)?.[1] || '1'
        const roundKey = `round${round}`
        
        // Check if CSV exists
        const csvFileName = `cutoffs_${metadata.examId}.csv`
        const csvPath = path.join(publicPath, csvFileName)
        const hasData = fs.existsSync(csvPath)
        
        if (!yearRoundMap.has(year)) {
          yearRoundMap.set(year, new Set())
        }
        
        if (hasData) {
          yearRoundMap.get(year)!.add(roundKey)
        }
      } catch (error) {
        console.error(`Error reading metadata file ${metadataFile}:`, error)
      }
    }

    // Build exam list
    for (const [year, roundSet] of yearRoundMap.entries()) {
      for (const round of rounds) {
        const examId = `mht-cet-mh-cap-${round}`
        const csvFileName = `cutoffs_${examId}.csv`
        const csvPath = path.join(publicPath, csvFileName)
        const hasData = fs.existsSync(csvPath) && roundSet.has(round)
        
        const roundName = round.charAt(0).toUpperCase() + round.slice(1).replace('round', 'Round ')
        const examName = `MHT CET ${roundName} (${year})`
        
        availableExams.push({
          id: examId,
          name: examName,
          year,
          round,
          roundName,
          hasData
        })
      }
    }

    // Sort by year (newest first) then by round
    availableExams.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year.localeCompare(a.year)
      }
      return a.round.localeCompare(b.round)
    })

    return NextResponse.json({
      exams: availableExams,
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch MHT CET exams', details: error.message },
      { status: 500 }
    )
  }
}

