import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { clearCache } from '../data/route'

const execAsync = promisify(exec)

// Exam PDF configurations
const examPdfConfig: Record<string, { pdfName: string; csvName: string }> = {
  'mht-cet': {
    pdfName: '2022ENGG_CAP1_CutOff.pdf',
    csvName: 'cutoffs_mht-cet.csv'
  },
  'mhet': {
    pdfName: 'mhet_cutoff.pdf',
    csvName: 'cutoffs_mhet.csv'
  },
  'pharma': {
    pdfName: 'pharma_cutoff.pdf',
    csvName: 'cutoffs_pharma.csv'
  },
  'jee': {
    pdfName: 'jee_cutoff.pdf',
    csvName: 'cutoffs_jee.csv'
  },
  'neet': {
    pdfName: 'neet_cutoff.pdf',
    csvName: 'cutoffs_neet.csv'
  },
  'gate': {
    pdfName: 'gate_cutoff.pdf',
    csvName: 'cutoffs_gate.csv'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const examId = body.examId || 'mht-cet'
    
    const config = examPdfConfig[examId]
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      )
    }

    const pdfPath = path.join(process.cwd(), 'public', config.pdfName)
    const csvPath = path.join(process.cwd(), 'public', config.csvName)

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: `PDF file not found: ${config.pdfName}` },
        { status: 404 }
      )
    }

    // Check if Python is available
    try {
      await execAsync('python --version')
    } catch {
      try {
        await execAsync('python3 --version')
      } catch {
        return NextResponse.json(
          { error: 'Python is not installed. Please run the Python script manually.' },
          { status: 500 }
        )
      }
    }

    // Run the Python script with exam-specific parameters
    const scriptPath = path.join(process.cwd(), 'scripts', 'parse_cutoff.py')
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    
    try {
      const { stdout, stderr } = await execAsync(
        `${pythonCmd} "${scriptPath}" "${pdfPath}" "${csvPath}"`
      )
      
      if (stderr && !stderr.includes('tqdm')) {
        console.error('Python script stderr:', stderr)
      }
      
      // Check if CSV was created
      if (fs.existsSync(csvPath)) {
        const stats = fs.statSync(csvPath)
        // Clear cache after parsing
        clearCache(examId)
        return NextResponse.json({
          success: true,
          message: 'PDF parsed successfully',
          csvPath: `/${config.csvName}`,
          size: stats.size,
          stdout: stdout
        })
      } else {
        return NextResponse.json(
          { error: 'CSV file was not created', stderr },
          { status: 500 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to parse PDF', details: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}




