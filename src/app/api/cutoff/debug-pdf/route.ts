import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import Groq from 'groq-sdk'

const execAsync = promisify(exec)

// Extract more detailed sample text from PDF
async function extractDetailedSample(pdfPath: string): Promise<{ text: string; pageCount: number }> {
  const pythonScript = `import pdfplumber
import sys
import json

pdf_path = sys.argv[1]
sample_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 10

try:
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        pages_to_read = min(sample_pages, total_pages)
        
        text_samples = []
        structure_info = []
        
        for i in range(pages_to_read):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                # Get more text from each page (first 3000 chars)
                text_samples.append(f"=== PAGE {i+1} ===\\n{text[:3000]}")
                
                # Try to extract tables if any
                tables = page.extract_tables()
                if tables:
                    structure_info.append(f"Page {i+1}: Found {len(tables)} table(s)")
        
        # Get middle and last pages
        if total_pages > pages_to_read * 2:
            mid_page = pdf.pages[total_pages // 2]
            mid_text = mid_page.extract_text()
            if mid_text:
                text_samples.append(f"=== PAGE {total_pages // 2 + 1} (MIDDLE) ===\\n{mid_text[:3000]}")
        
        if total_pages > pages_to_read:
            last_page = pdf.pages[-1]
            last_text = last_page.extract_text()
            if last_text:
                text_samples.append(f"=== PAGE {total_pages} (LAST) ===\\n{last_text[:3000]}")
        
        result = {
            "text": "\\n\\n--- PAGE BREAK ---\\n\\n".join(text_samples),
            "total_pages": total_pages,
            "structure_info": structure_info
        }
        print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e), "text": "", "total_pages": 0, "structure_info": []}))
    sys.exit(1)
`

  try {
    const scriptsDir = path.join(process.cwd(), 'scripts')
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true })
    }
    
    const scriptPath = path.join(scriptsDir, 'extract_detailed_sample.py')
    fs.writeFileSync(scriptPath, pythonScript)
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${pdfPath}" 10`
    )
    
    if (stderr && !stderr.includes('tqdm') && !stderr.includes('Reading PDF')) {
      console.error('Extraction stderr:', stderr)
    }
    
    const result = JSON.parse(stdout || '{"text": "", "total_pages": 0, "structure_info": []}')
    return {
      text: result.text || '',
      pageCount: result.total_pages || 0
    }
  } catch (error: any) {
    console.error('Failed to extract detailed sample:', error)
    return { text: '', pageCount: 0 }
  }
}

// Analyze PDF with detailed scraping requirements
async function analyzePDFForScraping(
  sampleText: string, 
  pageCount: number,
  examType?: string,
  examName?: string
): Promise<any> {
  const examContext = examType && examName 
    ? `\n\nContext: This PDF is for "${examName}" (Type: ${examType}).`
    : ''

  const prompt = `You are analyzing a PDF document that contains college admission cutoff/merit data. 

Here is a sample of the PDF content (from multiple pages):

${sampleText.substring(0, 6000)}

Total pages in PDF: ${pageCount}

${examContext}

Please analyze this PDF structure in detail and provide a comprehensive JSON response with:

1. "format_type": The type of format (e.g., "engineering_cutoff", "mba_cutoff", "medical_cutoff", "pharmacy_cutoff", "law_cutoff", "unknown")

2. "document_structure": Detailed description of how the document is organized:
   - How colleges/institutes are identified
   - How courses/programs are identified
   - How seat types are categorized
   - How categories (OPEN, SC, ST, OBC, etc.) are represented
   - How ranks/merit numbers are shown
   - How scores/percentiles are displayed
   - Any tables, sections, or special formatting

3. "data_fields_to_extract": Array of objects, each with:
   - "field_name": Name of the field (e.g., "college_code", "college_name", "course_code", "course_name", "category", "rank", "percentile", "merit_score", "seat_type")
   - "description": What this field represents
   - "location": Where to find this field in the PDF (e.g., "Same line as college name", "Next line after categories", "In parentheses after rank")
   - "pattern": Regex pattern or text pattern to identify this field
   - "required": Whether this field is mandatory

4. "parsing_strategy": Recommended approach:
   - "line_by_line": Process line by line
   - "section_based": Process by sections
   - "table_based": Extract from tables
   - "pattern_matching": Use regex patterns
   - "hybrid": Combination of approaches

5. "key_patterns": Object with regex patterns for:
   - "college_identifier": Pattern to identify college/institute lines
   - "course_identifier": Pattern to identify course/program lines
   - "category_identifier": Pattern to identify category codes
   - "rank_identifier": Pattern to identify rank/merit numbers
   - "score_identifier": Pattern to identify scores/percentiles
   - "seat_type_identifier": Pattern to identify seat types

6. "parsing_instructions": Step-by-step instructions on how to parse this PDF:
   - Step 1: ...
   - Step 2: ...
   - etc.

7. "expected_csv_columns": Array of column names for the output CSV

8. "special_considerations": Any special cases, edge cases, or things to watch out for

9. "confidence": Your confidence level (0-100) in being able to parse this format

Respond ONLY with valid JSON, no markdown formatting, no code blocks. The JSON should be well-structured and complete.`

  try {
    const apiKey = process.env.GROQ_API_KEY
    
    if (apiKey) {
      const groq = new Groq({
        apiKey: apiKey
      })
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a PDF structure analyzer and data extraction expert. Always respond with valid JSON only, no markdown formatting, no code blocks. Be detailed and specific in your analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2, // Lower temperature for more consistent analysis
        max_tokens: 3000 // More tokens for detailed analysis
      })
      
      const content = chatCompletion.choices[0]?.message?.content || '{}'
      
      // Clean up JSON response
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
    
    return {
      error: 'No API key available',
      format_type: 'unknown',
      parsing_strategy: 'engineering_format'
    }
  } catch (error: any) {
    console.error('LLM analysis error:', error)
    return {
      error: error.message,
      format_type: 'unknown',
      parsing_strategy: 'engineering_format'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, year, examType, examName } = body
    
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
    
    console.log(`[DEBUG] Starting detailed analysis for ${pdfFileName}`)
    
    // Step 1: Extract detailed sample
    console.log('[DEBUG] Extracting detailed sample text...')
    const { text: sampleText, pageCount } = await extractDetailedSample(pdfPath)
    
    if (!sampleText) {
      return NextResponse.json(
        { error: 'Failed to extract text from PDF' },
        { status: 500 }
      )
    }
    
    console.log(`[DEBUG] Extracted ${sampleText.length} characters from ${pageCount} pages`)
    
    // Step 2: Analyze with LLM for detailed scraping requirements
    console.log('[DEBUG] Analyzing PDF structure with LLM...')
    const analysis = await analyzePDFForScraping(sampleText, pageCount, examType, examName)
    
    console.log('[DEBUG] Analysis complete:', {
      format_type: analysis.format_type,
      parsing_strategy: analysis.parsing_strategy,
      confidence: analysis.confidence
    })
    
    // Step 3: Save detailed analysis to metadata
    const metadataPath = path.join(process.cwd(), 'public', `${examId}_metadata.json`)
    let metadata: any = {}
    
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    }
    
    metadata.debugAnalysis = {
      ...analysis,
      analyzedAt: new Date().toISOString(),
      sampleTextLength: sampleText.length,
      pageCount: pageCount
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    
    return NextResponse.json({
      success: true,
      analysis: analysis,
      sampleTextLength: sampleText.length,
      pageCount: pageCount,
      sampleTextPreview: sampleText.substring(0, 500) + '...'
    })
  } catch (error: any) {
    console.error('[DEBUG] Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to debug PDF', details: error.message },
      { status: 500 }
    )
  }
}




