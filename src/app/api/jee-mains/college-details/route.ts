import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

/* =========================
   TYPES
========================= */

interface JeeRecord {
  college: string
  branch: string
  quota: string
  'seat type': string
  gender?: string
  'opening rank': number
  'closing rank': number
}

interface CollegeData {
  year: string
  round: string
  roundName: string
  college: string
  branch: string
  quota: string
  seatType: string
  gender?: string
  openingRank: number
  closingRank: number
}

/* =========================
   CONSTANTS
========================= */

const years = ['2024', '2023', '2022', '2021', '2020']
const rounds = ['round1', 'round2', 'round3', 'round4', 'round5']

/* =========================
   HELPERS
========================= */

function getRecordsForYearRound(
  year: string,
  round: string
): JeeRecord[] {
  const filename =
    round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
  const folderName = `jeemains${year}`
  const csvPath = path.join(process.cwd(), 'public', folderName, filename)

  if (!fs.existsSync(csvPath)) {
    return []
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as JeeRecord[]

  return records.filter((r) => {
    const openingRank = Number(r['opening rank']) || 0
    const closingRank = Number(r['closing rank']) || 0
    return (
      Boolean(r.college) &&
      Boolean(r.branch) &&
      (openingRank > 0 || closingRank > 0)
    )
  })
}

/* =========================
   API ROUTE
========================= */

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

    const collegeLower = college.toLowerCase()
    const allData: CollegeData[] = []

    /* =========================
       COLLECT DATA
    ========================= */

    for (const year of years) {
      for (const round of rounds) {
        const records = getRecordsForYearRound(year, round)

        records
          .filter((r) => {
            const recordCollege = r.college.toLowerCase()
            return (
              recordCollege.includes(collegeLower) ||
              collegeLower.includes(recordCollege)
            )
          })
          .forEach((r) => {
            allData.push({
              year,
              round,
              roundName:
                'Round ' + round.replace('round', ''),
              college: r.college,
              branch: r.branch,
              quota: r.quota,
              seatType: r['seat type'],
              gender: r.gender,
              openingRank: Number(r['opening rank']) || 0,
              closingRank: Number(r['closing rank']) || 0,
            })
          })
      }
    }

    /* =========================
       FILTER OPTIONS
    ========================= */

    const branches = Array.from(
      new Set(allData.map((d) => d.branch))
    ).sort()

    const quotas = Array.from(
      new Set(allData.map((d) => d.quota))
    ).sort()

    const seatTypes = Array.from(
      new Set(allData.map((d) => d.seatType))
    ).sort()

    const availableYears = Array.from(
      new Set(allData.map((d) => d.year))
    ).sort().reverse()

    const availableRounds = Array.from(
      new Set(allData.map((d) => d.round))
    ).sort()

    /* =========================
       ACTUAL COLLEGE NAME
    ========================= */

    const actualCollegeName =
      allData[0]?.college ?? college

    /* =========================
       RESPONSE
    ========================= */

    return NextResponse.json({
      success: true,
      college: actualCollegeName,
      totalRecords: allData.length,
      data: allData,
      filters: {
        branches,
        quotas,
        seatTypes,
        years: availableYears,
        rounds: availableRounds,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch college details',
      },
      { status: 500 }
    )
  }
}
