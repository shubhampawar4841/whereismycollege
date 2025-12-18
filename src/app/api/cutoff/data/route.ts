import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { extractLocation, extractLocationFromQuery, isLocationQuery } from '@/lib/location-extractor'

// Cache for parsed CSV data
let cachedRecords: Record<string, any[]> = {}
let cacheTimestamp: Record<string, number> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Cache for filter options
let cachedFilters: Record<string, any> = {}

function getCachedRecords(examId: string) {
  const now = Date.now()
  const csvPath = path.join(process.cwd(), 'public', `cutoffs_${examId}.csv`)
  
  // Check if cache is valid
  if (cachedRecords[examId] && (now - (cacheTimestamp[examId] || 0)) < CACHE_DURATION) {
    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath)
      // If file hasn't changed, return cache
      if (stats.mtimeMs <= (cacheTimestamp[examId] || 0)) {
        return cachedRecords[examId]
      }
    }
  }
  
  // Check if CSV exists
  if (!fs.existsSync(csvPath)) {
    return []
  }
  
  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'rank') return parseInt(value) || 0
      if (context.column === 'percentile') return parseFloat(value) || 0
      return value
    }
  })
  
  // Update cache
  cachedRecords[examId] = records
  cacheTimestamp[examId] = now
  
  return records
}

function getCachedFilters(examId: string, records: any[]) {
  if (cachedFilters[examId]) return cachedFilters[examId]
  
  const uniqueColleges = Array.from(
    new Map(records.map((r: any) => [r.college_code, { code: r.college_code, name: r.college_name }])).values()
  )
  const uniqueCourses = Array.from(
    new Map(records.map((r: any) => [r.course_code, { code: r.course_code, name: r.course_name }])).values()
  )
  const uniqueCategories = Array.from(new Set(records.map((r: any) => r.category))).filter(Boolean).sort()
  const uniqueSeatTypes = Array.from(new Set(records.map((r: any) => r.seat_type))).filter(Boolean).sort()
  
  // Extract unique locations
  const uniqueLocations = Array.from(
    new Set(
      records
        .map((r: any) => extractLocation(r.college_name || ''))
        .filter((loc): loc is string => loc !== null)
    )
  ).sort()
  
  cachedFilters[examId] = {
    colleges: uniqueColleges,
    courses: uniqueCourses,
    categories: uniqueCategories,
    seatTypes: uniqueSeatTypes,
    locations: uniqueLocations
  }
  
  return cachedFilters[examId]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId') || 'mht-cet'
    
    // Get cached records
    const records = getCachedRecords(examId)
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file not found. Please parse the PDF first.' },
        { status: 404 }
      )
    }

    // Get query parameters for filtering
    const search = searchParams.get('search')?.toLowerCase() || ''
    const course = searchParams.get('course') || ''
    const category = searchParams.get('category') || ''
    const seatType = searchParams.get('seatType') || ''
    const minPercentile = searchParams.get('minPercentile')
    const maxPercentile = searchParams.get('maxPercentile')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Filter out records with 0 percentile and 0 rank (invalid/placeholder data)
    let validRecords = records.filter((record: any) => {
      const percentile = parseFloat(record.percentile) || 0
      const rank = parseInt(record.rank) || 0
      // Only show records with valid cutoff data (percentile > 0 or rank > 0)
      return percentile > 0 || rank > 0
    })
    
    // Optimized filtering - use early returns
    let filtered = validRecords
    if (search || course || category || seatType || minPercentile || maxPercentile) {
      // Check if search is a location query
      const isLocation = search ? isLocationQuery(search) : false
      const locationQuery = search ? extractLocationFromQuery(search) : null
      
      filtered = validRecords.filter((record: any) => {
        if (search) {
          const searchLower = search.toLowerCase()
          
          // Location-based search
          if (isLocation && locationQuery) {
            const collegeLocation = extractLocation(record.college_name || '')
            if (collegeLocation) {
              const locationMatch = collegeLocation.toLowerCase().includes(locationQuery.toLowerCase()) ||
                                   locationQuery.toLowerCase().includes(collegeLocation.toLowerCase())
              if (!locationMatch && !record.college_name?.toLowerCase().includes(locationQuery.toLowerCase())) {
                return false
              }
            } else {
              // Fallback: check if location appears in college name
              if (!record.college_name?.toLowerCase().includes(locationQuery.toLowerCase())) {
                return false
              }
            }
          } else {
            // Regular search (college name or course name)
            if (!record.college_name?.toLowerCase().includes(searchLower) && 
                !record.course_name?.toLowerCase().includes(searchLower)) {
              return false
            }
          }
        }
        if (course && record.course_code !== course) return false
        if (category && record.category !== category) return false
        if (seatType && record.seat_type !== seatType) return false
        if (minPercentile && parseFloat(record.percentile) < parseFloat(minPercentile)) return false
        if (maxPercentile && parseFloat(record.percentile) > parseFloat(maxPercentile)) return false
        return true
      })
    }

    // Get cached filters (use valid records for filter options)
    const filters = getCachedFilters(examId, validRecords)

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
      filters
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to read CSV', details: error.message },
      { status: 500 }
    )
  }
}

// Clear cache when PDF is parsed
export function clearCache(examId: string) {
  cachedRecords[examId] = []
  cachedFilters[examId] = null
  cacheTimestamp[examId] = 0
}

