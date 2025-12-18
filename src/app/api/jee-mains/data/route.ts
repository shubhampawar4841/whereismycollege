import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Cache for parsed CSV data
let cachedRecords: Record<string, any[]> = {}
let cacheTimestamp: Record<string, number> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedRecords(round: string, year: string) {
  const now = Date.now()
  const cacheKey = `${year}-${round}`
  
  // Handle typo in round1 filename (roun1 instead of round1)
  const filename = round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
  const folderName = `jeemains${year}`
  const csvPath = path.join(process.cwd(), 'public', folderName, filename)
  
  // Check if cache is valid
  if (cachedRecords[cacheKey] && (now - (cacheTimestamp[cacheKey] || 0)) < CACHE_DURATION) {
    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath)
      if (stats.mtimeMs <= (cacheTimestamp[cacheKey] || 0)) {
        return cachedRecords[cacheKey]
      }
    }
  }
  
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
  
  // Filter out empty rows and rows with 0 ranks
  const validRecords = records.filter((r: any) => {
    const openingRank = parseInt(r['opening rank']) || 0
    const closingRank = parseInt(r['closing rank']) || 0
    return r.college && r.branch && (openingRank > 0 || closingRank > 0)
  })
  
  cachedRecords[cacheKey] = validRecords
  cacheTimestamp[cacheKey] = now
  
  return validRecords
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || '2024'
    const round = searchParams.get('round') || 'round1'
    const search = searchParams.get('search')?.toLowerCase() || ''
    const college = searchParams.get('college') || ''
    const branch = searchParams.get('branch') || ''
    const quota = searchParams.get('quota') || ''
    const seatType = searchParams.get('seatType') || ''
    const gender = searchParams.get('gender') || ''
    const minRank = searchParams.get('minRank')
    const maxRank = searchParams.get('maxRank')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const records = getCachedRecords(round, year)
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file not found for this round' },
        { status: 404 }
      )
    }
    
    // Filter records
    let filtered = records
    if (search || college || branch || quota || seatType || gender || minRank || maxRank) {
      filtered = records.filter((record: any) => {
        if (search) {
          const searchLower = search.toLowerCase()
          if (!record.college?.toLowerCase().includes(searchLower) && 
              !record.branch?.toLowerCase().includes(searchLower)) {
            return false
          }
        }
        if (college && record.college !== college) return false
        if (branch && record.branch !== branch) return false
        if (quota && record.quota !== quota) return false
        if (seatType && record['seat type'] !== seatType) return false
        if (gender && record.gender !== gender) return false
        if (minRank) {
          const closingRank = parseInt(record['closing rank']) || 0
          if (closingRank < parseInt(minRank)) return false
        }
        if (maxRank) {
          const openingRank = parseInt(record['opening rank']) || 0
          if (openingRank > parseInt(maxRank)) return false
        }
        return true
      })
    }
    
    // Get unique filter options
    const uniqueColleges = Array.from(
      new Map(records.map((r: any) => [r.college, r.college])).values()
    ).filter(Boolean).sort()
    
    const uniqueBranches = Array.from(
      new Map(records.map((r: any) => [r.branch, r.branch])).values()
    ).filter(Boolean).sort()
    
    const uniqueQuotas = Array.from(
      new Set(records.map((r: any) => r.quota))
    ).filter(Boolean).sort()
    
    const uniqueSeatTypes = Array.from(
      new Set(records.map((r: any) => r['seat type']))
    ).filter(Boolean).sort()
    
    const uniqueGenders = Array.from(
      new Set(records.map((r: any) => r.gender))
    ).filter(Boolean).sort()
    
    // Paginate
    const start = (page - 1) * limit
    const end = start + limit
    const paginated = filtered.slice(start, end)
    
    return NextResponse.json({
      data: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      filters: {
        colleges: uniqueColleges,
        branches: uniqueBranches,
        quotas: uniqueQuotas,
        seatTypes: uniqueSeatTypes,
        genders: uniqueGenders
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to read CSV', details: error.message },
      { status: 500 }
    )
  }
}

