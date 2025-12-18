import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface MhetRecord {
  college_name: string
  course_name: string
  category: string
  seat_type: string
  rank?: number
  percentile?: number
}

const rounds = ['round1', 'round2', 'round3']

function getRecordsForRound(round: string, filterZeroValues: boolean = false): MhetRecord[] {
  // Convert round1 -> round-1, round2 -> round-2, etc.
  const roundWithDash = round.replace('round', 'round-')
  const examId = `mht-cet-mh-cap-${roundWithDash}`
  const csvFileName = `cutoffs_${examId}.csv`
  const csvPath = path.join(process.cwd(), 'public', csvFileName)

  if (!fs.existsSync(csvPath)) {
    return []
  }

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      cast: (value, context) => {
        // Handle rank column
        if (context.column === 'rank') {
          const num = parseInt(String(value)) || 0
          return num
        }
        // Handle percentile column
        if (context.column === 'percentile') {
          const num = parseFloat(String(value)) || 0
          return num
        }
        // For string columns, return as-is (csv-parse handles quotes automatically)
        return value
      }
    }) as MhetRecord[]

    // Filter out records with missing required fields
    let filtered = records.filter((r) => {
      if (!r.college_name || !r.course_name || !r.category) {
        return false
      }
      return true
    })

    // Optionally filter out records with 0 rank and 0 percentile
    // For options API, we want ALL combinations, even with 0 values
    // For trends API, we only want records with actual data
    if (filterZeroValues) {
      filtered = filtered.filter((r) => {
        const rank = Number(r.rank) || 0
        const percentile = Number(r.percentile) || 0
        return rank > 0 || percentile > 0
      })
    }

    return filtered
  } catch (error: any) {
    console.error(`Error parsing CSV for round ${round}:`, error.message)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const college = searchParams.get('college')
    const category = searchParams.get('category')
    const seatType = searchParams.get('seatType')
    const course = searchParams.get('course')

    if (!college) {
      return NextResponse.json(
        { error: 'College parameter is required' },
        { status: 400 }
      )
    }

    const collegeLower = college.toLowerCase().trim()
    const courses = new Set<string>()
    const categories = new Set<string>()
    const seatTypes = new Set<string>()
    const availableRounds = new Set<string>()

    // Check all rounds for this college
    // For options API, we want ALL combinations (including 0 values) to show all available options
    for (const round of rounds) {
      const records = getRecordsForRound(round, false) // false = don't filter 0 values
      
      if (records.length === 0) continue
      
      // Filter by college first
      let matchingRecords = records.filter((r) => {
        const recordCollege = String(r.college_name || '').toLowerCase().trim()
        if (!recordCollege) return false
        return recordCollege.includes(collegeLower) || collegeLower.includes(recordCollege)
      })

      // Filter by category if provided
      if (category) {
        matchingRecords = matchingRecords.filter((r) => r.category === category)
      }

      // Filter by seat type if provided
      if (seatType) {
        matchingRecords = matchingRecords.filter((r) => r.seat_type === seatType)
      }

      // Filter by course if provided
      if (course) {
        matchingRecords = matchingRecords.filter((r) => r.course_name === course)
      }

      if (matchingRecords.length > 0) {
        availableRounds.add(round)

        // Get unique values based on what filters are already applied
        matchingRecords.forEach((r) => {
          // Always add categories (if not already filtered)
          if (!category && r.category) categories.add(r.category)
          
          // Add seat types only if category is selected (or if no category filter)
          if ((category || !category) && !seatType && r.seat_type) seatTypes.add(r.seat_type)
          
          // Add courses only if category and seat type are selected (or if not filtered)
          if ((category && seatType) || (!category && !seatType) || (category && !seatType)) {
            if (!course && r.course_name) courses.add(r.course_name)
          }
        })
      }
    }

    // Return options based on what's already selected
    const result: any = {
      success: true,
      rounds: Array.from(availableRounds).sort(),
    }

    // Only return categories if college is selected but category is not
    if (!category) {
      result.categories = Array.from(categories).sort()
    }

    // Only return seat types if category is selected but seat type is not
    if (category && !seatType) {
      result.seatTypes = Array.from(seatTypes).sort()
    }

    // Only return courses if category and seat type are selected but course is not
    if (category && seatType && !course) {
      result.courses = Array.from(courses).sort()
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in mhet-cet/options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch options', details: error.message },
      { status: 500 }
    )
  }
}
