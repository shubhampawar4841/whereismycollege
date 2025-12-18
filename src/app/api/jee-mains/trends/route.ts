import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface JeeRecord {
  college: string
  branch: string
  quota: string
  'seat type': string
  gender?: string
  'opening rank': number
  'closing rank': number
}

const years = ['2024', '2023', '2022', '2021', '2020']

function getRecordsForYear(
  year: string,
  round: string
): JeeRecord[] {
  const filename =
    round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
  const folderName = `jeemains${year}`
  const csvPath = path.join(process.cwd(), 'public', folderName, filename)

  if (!fs.existsSync(csvPath)) return []

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as JeeRecord[]

  return records.filter((r) => {
    const opening = Number(r['opening rank']) || 0
    const closing = Number(r['closing rank']) || 0
    return r.college && r.branch && (opening > 0 || closing > 0)
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const college = searchParams.get('college')
    const quota = searchParams.get('quota')
    const seatType = searchParams.get('seatType')
    const branch = searchParams.get('branch')
    const round = searchParams.get('round') || 'round1'

    if (!college || !quota || !seatType || !branch) {
      return NextResponse.json(
        { error: 'College, quota, seat type, and branch are required' },
        { status: 400 }
      )
    }

    const collegeLower = college.toLowerCase()
    const branchLower = branch.toLowerCase()
    const quotaLower = quota.toLowerCase()
    const seatTypeLower = seatType.toLowerCase()

    const trends: {
      year: string
      openingRank: number | null
      closingRank: number | null
      found: boolean
    }[] = []

    for (const year of years) {
      const records = getRecordsForYear(year, round)

      const match = records.find((r) => {
        return (
          (r.college.toLowerCase().includes(collegeLower) ||
            collegeLower.includes(r.college.toLowerCase())) &&
          (r.branch.toLowerCase().includes(branchLower) ||
            branchLower.includes(r.branch.toLowerCase())) &&
          r.quota.toLowerCase() === quotaLower &&
          r['seat type'].toLowerCase() === seatTypeLower
        )
      })

      trends.push(
        match
          ? {
              year,
              openingRank: match['opening rank'],
              closingRank: match['closing rank'],
              found: true,
            }
          : {
              year,
              openingRank: null,
              closingRank: null,
              found: false,
            }
      )
    }

    return NextResponse.json({
      success: true,
      trends,
      college,
      quota,
      seatType,
      branch,
      round,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error.message },
      { status: 500 }
    )
  }
}
