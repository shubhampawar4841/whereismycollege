import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { getCategoryDisplayName, getCategoryFullInfo } from '@/lib/category-normalizer'
import { extractLocation } from '@/lib/location-extractor'

// Cache for parsed CSV data
let cachedRecords: Record<string, any[]> = {}
let cacheTimestamp: Record<string, number> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedRecords(examId: string) {
  const now = Date.now()
  const csvPath = path.join(process.cwd(), 'public', `cutoffs_${examId}.csv`)
  
  // Check if cache is valid
  if (cachedRecords[examId] && (now - (cacheTimestamp[examId] || 0)) < CACHE_DURATION) {
    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath)
      if (stats.mtimeMs <= (cacheTimestamp[examId] || 0)) {
        return cachedRecords[examId]
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
      if (context.column === 'rank') return parseInt(value) || 0
      if (context.column === 'percentile') return parseFloat(value) || 0
      return value
    }
  })
  
  cachedRecords[examId] = records
  cacheTimestamp[examId] = now
  
  return records
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, collegeCodes, courseCode } = body
    
    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      )
    }
    
    if (!collegeCodes || !Array.isArray(collegeCodes) || collegeCodes.length === 0) {
      return NextResponse.json(
        { error: 'At least one college is required' },
        { status: 400 }
      )
    }
    
    if (collegeCodes.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 colleges can be compared at once' },
        { status: 400 }
      )
    }
    
    // Get cutoff data
    const records = getCachedRecords(examId)
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No cutoff data available for this exam' },
        { status: 404 }
      )
    }
    
    // Get all unique categories across all selected colleges
    const allCategories = new Set<string>()
    const allSeatTypes = new Set<string>()
    
    // Process each college
    const collegeData = collegeCodes.map((collegeCode: string) => {
      // Filter records for this college
      let collegeRecords = records.filter((r: any) => r.college_code === collegeCode)
      
      // Filter by course if specified
      if (courseCode) {
        collegeRecords = collegeRecords.filter((r: any) => r.course_code === courseCode)
      }
      
      // Group by category and seat type
      const categoryData: Record<string, any[]> = {}
      
      collegeRecords.forEach((r: any) => {
        const categoryKey = r.category
        if (!categoryData[categoryKey]) {
          categoryData[categoryKey] = []
        }
        categoryData[categoryKey].push(r)
        allCategories.add(r.category)
        allSeatTypes.add(r.seat_type)
      })
      
      // Get college info from first record
      const firstRecord = collegeRecords[0]
      if (!firstRecord) {
        return null
      }
      
      // Get all courses for this college
      const courses = Array.from(new Set(collegeRecords.map((r: any) => ({
        code: r.course_code,
        name: r.course_name
      }))))
      
      // Organize by category
      const categories = Object.entries(categoryData).map(([categoryCode, records]) => {
        // Get best option for this category (highest percentile = lowest rank)
        const best = records.reduce((best: any, current: any) => {
          const currentPercentile = parseFloat(current.percentile) || 0
          const bestPercentile = parseFloat(best.percentile) || 0
          return currentPercentile > bestPercentile ? current : best
        }, records[0])
        
        // Get all seat types for this category
        const seatTypeData = records.map((r: any) => ({
          seatType: r.seat_type,
          percentile: parseFloat(r.percentile) || 0,
          rank: parseInt(r.rank) || 0
        }))
        
        return {
          code: categoryCode,
          name: getCategoryDisplayName(categoryCode),
          fullName: getCategoryFullInfo(categoryCode).fullName,
          bestPercentile: parseFloat(best.percentile) || 0,
          bestRank: parseInt(best.rank) || 0,
          bestSeatType: best.seat_type,
          seatTypeData: seatTypeData.sort((a, b) => b.percentile - a.percentile),
          totalOptions: records.length
        }
      }).sort((a, b) => b.bestPercentile - a.bestPercentile)
      
      return {
        collegeCode: firstRecord.college_code,
        collegeName: firstRecord.college_name,
        location: extractLocation(firstRecord.college_name || ''),
        courses: courses,
        categories: categories,
        totalRecords: collegeRecords.length
      }
    }).filter(Boolean)
    
    return NextResponse.json({
      success: true,
      comparison: collegeData,
      allCategories: Array.from(allCategories).map(cat => ({
        code: cat,
        name: getCategoryDisplayName(cat),
        fullName: getCategoryFullInfo(cat).fullName
      })),
      allSeatTypes: Array.from(allSeatTypes),
      examId
    })
  } catch (error: any) {
    console.error('Comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to compare colleges', details: error.message },
      { status: 500 }
    )
  }
}

