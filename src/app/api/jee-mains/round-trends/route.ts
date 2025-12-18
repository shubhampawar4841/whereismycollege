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

interface YearTrend {
  year: string
  openingRank: number | null
  closingRank: number | null
  found: boolean
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
    const quota = searchParams.get('quota')
    const seatType = searchParams.get('seatType')
    const branch = searchParams.get('branch')
    const round = searchParams.get('round')

    if (!college || !quota || !seatType || !branch || !round) {
      return NextResponse.json(
        { error: 'College, quota, seat type, branch and round are required' },
        { status: 400 }
      )
    }

    const collegeLower = college.toLowerCase()
    const branchLower = branch.toLowerCase()
    const seatTypeLower = seatType.toLowerCase()
    const quotaLower = quota.toLowerCase()

    const trends: YearTrend[] = []

    /* =========================
       PROCESS EACH YEAR
    ========================= */

    for (const year of years) {
      const records = getRecordsForYearRound(year, round)

      const match = records.find((r) => {
        const collegeMatch =
          r.college.toLowerCase().includes(collegeLower) ||
          collegeLower.includes(r.college.toLowerCase())

        const branchMatch =
          r.branch.toLowerCase().includes(branchLower) ||
          branchLower.includes(r.branch.toLowerCase())

        const quotaMatch =
          r.quota.toLowerCase() === quotaLower

        const seatTypeMatch =
          r['seat type'].toLowerCase() === seatTypeLower

        return (
          collegeMatch &&
          branchMatch &&
          quotaMatch &&
          seatTypeMatch
        )
      })

      if (match) {
        trends.push({
          year,
          openingRank: match['opening rank'] || null,
          closingRank: match['closing rank'] || null,
          found: true,
        })
      } else {
        trends.push({
          year,
          openingRank: null,
          closingRank: null,
          found: false,
        })
      }
    }

    /* =========================
       RESPONSE
    ========================= */

    return NextResponse.json({
      success: true,
      trends,
      college,
      quota,
      seatType,
      branch,
      round,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    )
  }
}
