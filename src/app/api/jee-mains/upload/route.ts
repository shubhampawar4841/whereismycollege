import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const year = formData.get('year') as string
    const round = formData.get('round') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!year || !round) {
      return NextResponse.json(
        { error: 'Year and round are required' },
        { status: 400 }
      )
    }

    // Validate year
    const validYears = ['2024', '2023', '2022','2021','2020']
    if (!validYears.includes(year)) {
      return NextResponse.json(
        { error: 'Invalid year. Must be 2024, 2023, 2022, 2021, or 2020' },
        { status: 400 }
      )
    }

    // Validate round
    const validRounds = ['round1', 'round2', 'round3', 'round4', 'round5']
    if (!validRounds.includes(round)) {
      return NextResponse.json(
        { error: 'Invalid round. Must be round1, round2, round3, round4, or round5' },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      )
    }

    // Create folder if it doesn't exist
    const folderName = `jeemains${year}`
    const folderPath = path.join(process.cwd(), 'public', folderName)
    
    try {
      await mkdir(folderPath, { recursive: true })
    } catch (error: any) {
      // Folder might already exist, that's okay
      if (error.code !== 'EEXIST') {
        throw error
      }
    }

    // Handle round1 typo (roun1 instead of round1)
    const filename = round === 'round1' ? `roun1-${year}.csv` : `${round}-${year}.csv`
    const filePath = path.join(folderPath, filename)

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write file
    await writeFile(filePath, buffer)

    // Clear cache for this year/round combination
    // The cache will be refreshed on next request
    const cacheKey = `${year}-${round}`
    // Note: Cache clearing is handled by timestamp checking in getCachedRecords

    return NextResponse.json({
      success: true,
      message: 'CSV file uploaded successfully',
      path: `/${folderName}/${filename}`,
      year,
      round,
      filename
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

