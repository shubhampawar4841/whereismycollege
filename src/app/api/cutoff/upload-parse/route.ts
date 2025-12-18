import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { clearCache } from '../data/route'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, examName, year, parserStrategy: providedStrategy } = body

    if (!examId || !examName || !year) {
      return NextResponse.json(
        { error: 'Missing exam details' },
        { status: 400 }
      )
    }

    const pdfFileName = `${examId}_${year}.pdf`
    const pdfPath = path.join(process.cwd(), 'public', pdfFileName)
    const csvFileName = `cutoffs_${examId}.csv`
    const csvPath = path.join(process.cwd(), 'public', csvFileName)

    // Step 1: Check for existing debug analysis, then analyze PDF structure
    let analysis = null
    
    // First, check if debug analysis exists in metadata
    const metadataPath = path.join(process.cwd(), 'public', `${examId}_metadata.json`)
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
      if (metadata.debugAnalysis) {
        analysis = metadata.debugAnalysis
        console.log('Using existing debug analysis:', {
          format_type: analysis.format_type,
          parsing_strategy: analysis.parsing_strategy
        })
      }
    }
    
    // If no debug analysis and parser strategy provided, use it
    if (!analysis && providedStrategy) {
      analysis = {
        format_type: providedStrategy.replace('_format', '_cutoff'),
        parsing_strategy: providedStrategy
      }
      console.log('Using provided parser strategy:', providedStrategy)
    }
    
    // If still no analysis, try LLM analysis
    if (!analysis) {
      try {
        const analyzeResponse = await fetch(`${request.nextUrl.origin}/api/cutoff/analyze-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId, year })
        })
        
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json()
          analysis = analyzeData.analysis
          console.log('PDF Analysis:', analysis)
        }
      } catch (error) {
        console.warn('Analysis failed, proceeding with default parser:', error)
      }
    }

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: `PDF file not found: ${pdfFileName}` },
        { status: 404 }
      )
    }

    // Check if Python is available
    let pythonCmd = 'python'
    try {
      await execAsync('python --version')
    } catch {
      try {
        await execAsync('python3 --version')
        pythonCmd = 'python3'
      } catch {
        return NextResponse.json(
          { error: 'Python is not installed. Please install Python to parse PDFs.' },
          { status: 500 }
        )
      }
    }

    // Step 2: Run the Python script with analysis data
    // Use dynamic parser if analysis is available, otherwise use default
    const scriptPath = analysis 
      ? path.join(process.cwd(), 'scripts', 'parse_cutoff_dynamic.py')
      : path.join(process.cwd(), 'scripts', 'parse_cutoff.py')
    
    let command = `${pythonCmd} "${scriptPath}" "${pdfPath}" "${csvPath}"`
    
    // Pass analysis as JSON string to dynamic parser
    if (analysis) {
      const analysisJson = JSON.stringify(analysis).replace(/"/g, '\\"')
      command += ` "${analysisJson}"`
    }
    
    try {
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr && !stderr.includes('tqdm') && !stderr.includes('Reading PDF')) {
        console.error('Python script stderr:', stderr)
      }
      
      // Check if CSV was created (even if empty, it's still created)
      if (fs.existsSync(csvPath)) {
        const stats = fs.statSync(csvPath)
        const csvContent = fs.readFileSync(csvPath, 'utf-8')
        const hasData = csvContent.split('\n').length > 2 // More than header and empty line
        const recordCount = hasData ? csvContent.split('\n').length - 2 : 0
        
        // Clear cache after parsing
        clearCache(examId)
        
        // Update exam config
        const metadataPath = path.join(process.cwd(), 'public', `${examId}_metadata.json`)
        let metadata: any = {}
        if (fs.existsSync(metadataPath)) {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
          metadata.parsedAt = new Date().toISOString()
          metadata.csvFileName = csvFileName
          metadata.hasData = hasData
          metadata.recordCount = recordCount
          if (analysis) {
            metadata.pdfAnalysis = analysis
          }
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
        }
        
        if (hasData) {
          return NextResponse.json({
            success: true,
            message: 'PDF parsed successfully',
            csvPath: `/${csvFileName}`,
            examId,
            examName,
            year,
            size: stats.size,
            recordCount: recordCount
          })
        } else {
          return NextResponse.json({
            success: false,
            warning: 'PDF processed but no data extracted. The format might not be supported yet.',
            csvPath: `/${csvFileName}`,
            examId,
            examName,
            year,
            analysis: analysis || null
          }, { status: 200 }) // Return 200 but with warning
        }
      } else {
        return NextResponse.json(
          { error: 'CSV file was not created', stderr: stderr || 'No error message' },
          { status: 500 }
        )
      }
    } catch (error: any) {
      console.error('Parse error:', error)
      return NextResponse.json(
        { error: 'Failed to parse PDF', details: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

