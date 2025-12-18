import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const years = ['2024', '2023', '2022', '2021', '2020']
const rounds = ['round1', 'round2', 'round3', 'round4', 'round5']

function getRecordsForYearRound(year: string, round: string) {
  const filename = round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
  const folderName = `jeemains${year}`
  const csvPath = path.join(process.cwd(), 'public', folderName, filename)
  
  if (!fs.existsSync(csvPath)) {
    return []
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'opening rank' || context.column === 'closing rank') {
        return parseInt(value) || 0
      }
      return value
    }
  })
  
  return records.filter((r: any) => {
    const openingRank = parseInt(r['opening rank']) || 0
    const closingRank = parseInt(r['closing rank']) || 0
    return r.college && r.branch && (openingRank > 0 || closingRank > 0)
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const college = searchParams.get('college')
    
    if (!college) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      )
    }
    
    const branchesSet = new Set<string>()
    const roundsSet = new Set<string>()
    const collegeLower = college.toLowerCase()
    
    // Check all years and rounds for this college
    for (const year of years) {
      for (const round of rounds) {
        const records = getRecordsForYearRound(year, round)
        
        const matchingRecords = records.filter((r: any) => {
          const recordCollege = (r.college || '').toLowerCase()
          return recordCollege.includes(collegeLower) || collegeLower.includes(recordCollege)
        })
        
        if (matchingRecords.length > 0) {
          roundsSet.add(round)
          matchingRecords.forEach((r: any) => {
            if (r.branch) {
              branchesSet.add(r.branch)
            }
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      branches: Array.from(branchesSet).sort(),
      rounds: Array.from(roundsSet).sort()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch options', details: error.message },
      { status: 500 }
    )
  }
}

