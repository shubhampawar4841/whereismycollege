import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const years = ['2024', '2023', '2022', '2021', '2020']
const rounds = ['round1', 'round2', 'round3', 'round4', 'round5']

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

    for (const year of years) {
      const folderName = `jeemains${year}`
      const folderPath = path.join(process.cwd(), 'public', folderName)
      
      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        continue
      }

      // Check if this year has at least one round with data
      let yearHasData = false
      const yearExams: typeof availableExams = []

      for (const round of rounds) {
        // Handle typo in round1 filename
        const filename = round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
        const filePath = path.join(folderPath, filename)
        
        const hasData = fs.existsSync(filePath)
        
        if (hasData) {
          yearHasData = true
        }
        
        const roundName = round.charAt(0).toUpperCase() + round.slice(1).replace('round', 'Round ')
        const examId = `jee-mains-${round}-${year}`
        const examName = `JEE Mains ${roundName} (${year})`
        
        yearExams.push({
          id: examId,
          name: examName,
          year,
          round,
          roundName,
          hasData
        })
      }
      
      // Only add exams for this year if at least one round has data
      if (yearHasData) {
        availableExams.push(...yearExams)
      }
    }

    // Sort by year (newest first) then by round
    availableExams.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year.localeCompare(a.year) // Newest year first
      }
      return a.round.localeCompare(b.round) // Round 1-5 order
    })

    return NextResponse.json({
      exams: availableExams,
      total: availableExams.length
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list JEE Mains exams', details: error.message },
      { status: 500 }
    )
  }
}

