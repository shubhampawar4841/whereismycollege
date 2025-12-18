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
    const year = searchParams.get('year')

    if (!college || !category || !seatType || !course || !year) {
      return NextResponse.json(
        { error: 'College, category, seat type, course and year are required' },
        { status: 400 }
      )
    }

    const collegeLower = college.toLowerCase().trim()
    const courseLower = course.toLowerCase().trim()
    const categoryLower = category.toLowerCase().trim()
    const seatTypeLower = seatType.toLowerCase().trim()

    const trends: {
      round: string
      roundName: string
      rank: number | null
      percentile: number | null
      found: boolean
    }[] = []

    for (const round of rounds) {
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

      const roundName = round.charAt(0).toUpperCase() + round.slice(1).replace('round', 'Round ')

      trends.push(
        match
          ? {
              round,
              roundName,
              rank: Number(match.rank) || null,
              percentile: Number(match.percentile) || null,
              found: true,
            }
          : {
              round,
              roundName,
              rank: null,
              percentile: null,
              found: false,
            }
      )
    }

    return NextResponse.json({
      success: true,
      trends,
      college,
      category,
      seatType,
      course,
      year,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch round trends', details: error.message },
      { status: 500 }
    )
  }
}

