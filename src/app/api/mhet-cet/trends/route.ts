import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface MhetRecord {
  college_name: string
  course_name: string
  category: string
  seat_type: string
  rank: number
  percentile: number
}

// Years to check - adjust based on available data
const years = ['2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021']
const rounds = ['round1', 'round2', 'round3']

function getRecordsForRound(round: string): MhetRecord[] {
  // Convert round1 -> round-1, round2 -> round-2, etc.
  const roundWithDash = round.replace('round', 'round-')
  const examId = `mht-cet-mh-cap-${roundWithDash}`
  const csvFileName = `cutoffs_${examId}.csv`
  const csvPath = path.join(process.cwd(), 'public', csvFileName)

  if (!fs.existsSync(csvPath)) return []

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: (value, context) => {
      if (context.column === 'rank') return parseInt(value) || 0
      if (context.column === 'percentile') return parseFloat(value) || 0
      return value
    }
  }) as MhetRecord[]

  // Filter out records with 0 rank and 0 percentile
  return records.filter((r) => {
    if (!r.college_name || !r.course_name || !r.category || !r.seat_type) {
      return false
    }
    const rank = Number(r.rank) || 0
    const percentile = Number(r.percentile) || 0
    return rank > 0 || percentile > 0
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const college = searchParams.get('college')
    const category = searchParams.get('category')
    const seatType = searchParams.get('seatType')
    const course = searchParams.get('course')
    const round = searchParams.get('round') || 'round1'

    if (!college || !category || !seatType || !course) {
      return NextResponse.json(
        { error: 'College, category, seat type, and course are required' },
        { status: 400 }
      )
    }

    const collegeLower = college.toLowerCase().trim()
    const courseLower = course.toLowerCase().trim()
    const categoryLower = category.toLowerCase().trim()
    const seatTypeLower = seatType.toLowerCase().trim()

    // For now, we only have 2024-2025 data, so search in the round CSV directly
    const records = getRecordsForRound(round)

    // Simple exact match search: college_name, category, seat_type, course_name
    const match = records.find((r) => {
      const rCollege = (r.college_name || '').toLowerCase().trim()
      const rCourse = (r.course_name || '').toLowerCase().trim()
      const rCategory = (r.category || '').toLowerCase().trim()
      const rSeatType = (r.seat_type || '').toLowerCase().trim()
      
      // College matching: either string includes the other
      const collegeMatch = rCollege.includes(collegeLower) || collegeLower.includes(rCollege)
      // Course matching: either string includes the other
      const courseMatch = rCourse.includes(courseLower) || courseLower.includes(rCourse)
      // Category and seat type: exact match
      const categoryMatch = rCategory === categoryLower
      const seatTypeMatch = rSeatType === seatTypeLower
      
      return collegeMatch && courseMatch && categoryMatch && seatTypeMatch
    })

    // For year-over-year, we return the same data for all years (since we only have 2024-2025)
    // In the future, when we have multiple years, we can search year-specific CSVs
    const trends = years.map((year) => {
      if (match) {
        return {
          year,
          rank: Number(match.rank) || null,
          percentile: Number(match.percentile) || null,
          found: true,
        }
      } else {
        return {
          year,
          rank: null,
          percentile: null,
          found: false,
        }
      }
    })

    return NextResponse.json({
      success: true,
      trends,
      college,
      category,
      seatType,
      course,
      round,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error.message },
      { status: 500 }
    )
  }
}

