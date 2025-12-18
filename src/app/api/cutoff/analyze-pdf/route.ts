import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import Groq from 'groq-sdk'

const execAsync = promisify(exec)

// Extract sample text from PDF using Python
async function extractSampleText(pdfPath: string): Promise<string> {
  const pythonScript = `import pdfplumber
import sys

pdf_path = sys.argv[1]
sample_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5

try:
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        pages_to_read = min(sample_pages, total_pages)
        
        text_samples = []
        for i in range(pages_to_read):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                text_samples.append(text[:2000])
        
        if total_pages > pages_to_read * 2:
            mid_page = pdf.pages[total_pages // 2]
            mid_text = mid_page.extract_text()
            if mid_text:
                text_samples.append(mid_text[:2000])
        
        if total_pages > pages_to_read:
            last_page = pdf.pages[-1]
            last_text = last_page.extract_text()
            if last_text:
                text_samples.append(last_text[:2000])
        
        result = "\\n\\n--- PAGE BREAK ---\\n\\n".join(text_samples)
        print(result)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`

  try {
    const scriptsDir = path.join(process.cwd(), 'scripts')
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true })
    }
    
    const scriptPath = path.join(scriptsDir, 'extract_sample.py')
    fs.writeFileSync(scriptPath, pythonScript)
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${pdfPath}" 5`
    )
    
    if (stderr && !stderr.includes('tqdm') && !stderr.includes('Reading PDF')) {
      console.error('Extraction stderr:', stderr)
    }
    
    return stdout || ''
  } catch (error: any) {
    console.error('Failed to extract sample text:', error)
    return ''
  }
}

// Analyze PDF structure using LLM
async function analyzePDFStructure(sampleText: string): Promise<any> {
  const prompt = `You are analyzing a PDF document that contains college admission cutoff data. 

Here is a sample of the PDF content:

${sampleText.substring(0, 4000)}

Please analyze this PDF structure and provide a JSON response with:
1. "format_type": The type of format (e.g., "engineering_cutoff", "mba_cutoff", "medical_cutoff", "unknown")
2. "structure": Description of how data is organized
3. "key_patterns": Array of regex patterns or text patterns to identify:
   - College/institute names
   - Course/program names
   - Categories (like OPEN, SC, ST, etc.)
   - Rank numbers
   - Percentile/score values
4. "parsing_strategy": Recommended approach to extract data (e.g., "engineering_format", "mba_format", "medical_format")
5. "column_mapping": Expected CSV columns based on the structure

Respond ONLY with valid JSON, no additional text.`

  try {
    // Check if Groq API key is available
    const apiKey = process.env.GROQ_API_KEY
    
    if (apiKey) {
      const groq = new Groq({
        apiKey: apiKey
      })
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a PDF structure analyzer. Always respond with valid JSON only, no markdown formatting, no code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1500
      })
      
      const content = chatCompletion.choices[0]?.message?.content || '{}'
      
      // Try to extract JSON from response (handle markdown code blocks if present)
      let jsonString = content.trim()
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      
      // Try to find JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // If no match, try parsing the whole string
      return JSON.parse(jsonString)
    }
    
    // Fallback: Use a simple heuristic-based analysis
    return analyzeHeuristically(sampleText)
  } catch (error: any) {
    console.error('Groq LLM analysis error:', error)
    // Fallback to heuristic analysis
    return analyzeHeuristically(sampleText)
  }
}

// Heuristic-based analysis as fallback
function analyzeHeuristically(sampleText: string): any {
  const text = sampleText.toLowerCase()
  
  // Detect format type - check for MBA/MMS first as it's more specific
  let formatType = 'unknown'
  if (text.includes('mba') || text.includes('mms') || text.includes('pgdm') || 
      text.includes('management') || text.includes('post graduate') && text.includes('management')) {
    formatType = 'mba_cutoff'
  } else if (text.includes('engineering') || text.includes('b.tech') || text.includes('be')) {
    formatType = 'engineering_cutoff'
  } else if (text.includes('medical') || text.includes('mbbs') || text.includes('bds')) {
    formatType = 'medical_cutoff'
  } else if (text.includes('pharmacy') || text.includes('b.pharm')) {
    formatType = 'pharmacy_cutoff'
  }
  
  // Detect common patterns
  const hasStage = /stage\s+\d+/i.test(sampleText)
  const hasRank = /\brank\b/i.test(sampleText) || /^\s*I\s+/m.test(sampleText)
  const hasPercentile = /percentile/i.test(sampleText) || /\([\d.]+\)/.test(sampleText)
  const hasCategory = /open|sc|st|obc|nt|ews/i.test(sampleText)
  
  // Determine parsing strategy
  let parsingStrategy = 'engineering_format'
  if (formatType === 'mba_cutoff') {
    parsingStrategy = 'mba_format'
  } else if (formatType === 'medical_cutoff') {
    parsingStrategy = 'medical_format'
  } else if (formatType === 'pharmacy_cutoff') {
    parsingStrategy = 'pharmacy_format'
  }
  
  return {
    format_type: formatType,
    structure: `Detected ${formatType} format`,
    key_patterns: [
      hasStage ? 'Stage pattern detected' : null,
      hasRank ? 'Rank pattern detected' : null,
      hasPercentile ? 'Percentile pattern detected' : null,
      hasCategory ? 'Category pattern detected' : null
    ].filter(Boolean),
    parsing_strategy: parsingStrategy,
    column_mapping: ['college_code', 'college_name', 'course_code', 'course_name', 'category', 'rank', 'percentile']
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, year } = body
    
    if (!examId || !year) {
      return NextResponse.json(
        { error: 'Missing exam details' },
        { status: 400 }
      )
    }
    
    const pdfFileName = `${examId}_${year}.pdf`
    const pdfPath = path.join(process.cwd(), 'public', pdfFileName)
    
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: `PDF file not found: ${pdfFileName}` },
        { status: 404 }
      )
    }
    
    // Extract sample text
    const sampleText = await extractSampleText(pdfPath)
    
    if (!sampleText) {
      return NextResponse.json(
        { error: 'Failed to extract text from PDF' },
        { status: 500 }
      )
    }
    
    // Analyze structure
    const analysis = await analyzePDFStructure(sampleText)
    
    // Save analysis to metadata
    const metadataPath = path.join(process.cwd(), 'public', `${examId}_metadata.json`)
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
      metadata.pdfAnalysis = analysis
      metadata.analyzedAt = new Date().toISOString()
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    }
    
    return NextResponse.json({
      success: true,
      analysis,
      sampleTextLength: sampleText.length
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze PDF', details: error.message },
      { status: 500 }
    )
  }
}

