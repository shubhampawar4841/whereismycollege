import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import Groq from 'groq-sdk'
import { getCategoryDisplayName, getCategoryFullInfo, getNormalizedCategories } from '@/lib/category-normalizer'
import { extractLocation, extractLocationFromQuery, isLocationQuery, extractAllLocations } from '@/lib/location-extractor'

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

// Match course names intelligently
function matchCourseName(courseName: string, availableCourses: string[]): string[] {
  const userInput = courseName.toLowerCase().trim()
  const matched: string[] = []
  
  // Common course aliases
  const courseAliases: Record<string, string[]> = {
    'cs': ['computer science', 'computer engineering', 'cs', 'cse', 'computer'],
    'computer': ['computer science', 'computer engineering', 'cs', 'cse', 'computer'],
    'computer science': ['computer science', 'computer engineering', 'cs', 'cse'],
    'it': ['information technology', 'it', 'information tech'],
    'ece': ['electronics', 'ece', 'electronics and communication'],
    'mechanical': ['mechanical', 'mechanical engineering'],
    'civil': ['civil', 'civil engineering'],
    'electrical': ['electrical', 'electrical engineering'],
    'mba': ['mba', 'master of business', 'management'],
    'mca': ['mca', 'master of computer'],
    'pharmacy': ['pharmacy', 'pharm', 'b.pharm']
  }
  
  // Find aliases
  let searchTerms: string[] = [userInput]
  for (const [key, aliases] of Object.entries(courseAliases)) {
    if (userInput.includes(key) || aliases.some(a => userInput.includes(a))) {
      searchTerms = [...searchTerms, ...aliases]
      break
    }
  }
  
  // Match courses
  availableCourses.forEach(course => {
    const courseLower = course.toLowerCase()
    if (searchTerms.some(term => courseLower.includes(term))) {
      matched.push(course)
    }
  })
  
  return matched.length > 0 ? matched : availableCourses
}

// Match category codes intelligently
function matchCategoryCode(userCategory: string, allCategories: string[]): string[] {
  if (!userCategory) return []
  
  const userInput = userCategory.toLowerCase().trim()
  const matched: string[] = []
  
  // Try exact match first
  allCategories.forEach(cat => {
    const normalized = getCategoryDisplayName(cat).toLowerCase()
    if (normalized === userInput || cat.toLowerCase() === userInput) {
      matched.push(cat)
    }
  })
  
  // If no exact match, try partial
  if (matched.length === 0) {
    allCategories.forEach(cat => {
      const normalized = getCategoryDisplayName(cat).toLowerCase()
      if (normalized.includes(userInput) || userInput.includes(normalized)) {
        matched.push(cat)
      }
    })
  }
  
  return matched
}

// Get relevant cutoff data for recommendation with intelligent matching
function getRelevantData(
  records: any[], 
  percentile: number, 
  courseName?: string, 
  category?: string,
  question?: string,
  location?: string
) {
  // First, get all records where user's percentile is above cutoff
  let filtered = records.filter((r: any) => {
    const recordPercentile = parseFloat(r.percentile) || 0
    return recordPercentile > 0 && recordPercentile <= percentile
  })
  
  // Get all available courses for matching
  const allCourses = Array.from(new Set(records.map((r: any) => r.course_name)))
  const allCategories = Array.from(new Set(records.map((r: any) => r.category)))
  
  // Match location if provided
  if (location) {
    const locationLower = location.toLowerCase()
    filtered = filtered.filter((r: any) => {
      const collegeLocation = extractLocation(r.college_name || '')
      if (collegeLocation) {
        return collegeLocation.toLowerCase().includes(locationLower) ||
               locationLower.includes(collegeLocation.toLowerCase())
      }
      // Fallback: check if location appears in college name
      return r.college_name?.toLowerCase().includes(locationLower)
    })
  }
  
  // Match course if provided
  if (courseName || question) {
    const searchText = question ? `${courseName || ''} ${question}`.trim() : courseName || ''
    if (searchText) {
      const matchedCourses = matchCourseName(searchText, allCourses)
      filtered = filtered.filter((r: any) => 
        matchedCourses.some(mc => r.course_name?.toLowerCase().includes(mc.toLowerCase()))
      )
    }
  }
  
  // Match category if provided
  if (category) {
    const matchedCategories = matchCategoryCode(category, allCategories)
    if (matchedCategories.length > 0) {
      filtered = filtered.filter((r: any) => matchedCategories.includes(r.category))
    }
  }
  
  // Sort by percentile (descending) to get best options
  filtered.sort((a: any, b: any) => {
    const aPercentile = parseFloat(a.percentile) || 0
    const bPercentile = parseFloat(b.percentile) || 0
    return bPercentile - aPercentile
  })
  
  return filtered
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, percentile, marks, courseName, category, question } = body
    
    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
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
    
    // Filter out records with 0 percentile and 0 rank (invalid/placeholder data)
    const validRecords = records.filter((r: any) => {
      const percentile = parseFloat(r.percentile) || 0
      const rank = parseInt(r.rank) || 0
      return percentile > 0 || rank > 0
    })
    
    // Calculate percentile if marks provided but percentile not
    let userPercentile = percentile
    if (marks && !percentile) {
      // Simple estimation - in real scenario, you'd need exam-specific conversion
      userPercentile = parseFloat(marks) // Assuming marks are already in percentile format
    }
    
    if (!userPercentile) {
      return NextResponse.json(
        { error: 'Please provide either percentile or marks' },
        { status: 400 }
      )
    }
    
    // STEP 1: Understand user intent using AI
    const apiKey = process.env.GROQ_API_KEY
    const groq = new Groq({ apiKey })
    
    // Get all available courses and categories for context (from valid records only)
    const allCourses = Array.from(new Set(validRecords.map((r: any) => r.course_name)))
    const allCategories = Array.from(new Set(validRecords.map((r: any) => r.category)))
    const normalizedCategories = getNormalizedCategories(allCategories)
    
    // Extract locations from college names (from valid records only)
    const allLocations = extractAllLocations(validRecords.map((r: any) => r.college_name || ''))
    
    // First, understand what the user wants
    const intentPrompt = `You are analyzing a user's college admission query. Understand their intent and extract key information.

User Input:
- Percentile: ${userPercentile}%
${courseName ? `- Course mentioned: "${courseName}"` : ''}
${category ? `- Category mentioned: "${category}"` : ''}
${question ? `- Question/Additional info: "${question}"` : ''}

Available Courses in database: ${allCourses.slice(0, 30).join(', ')}${allCourses.length > 30 ? '...' : ''}
Available Categories: ${normalizedCategories.join(', ')}
Available Locations/Cities: ${allLocations.slice(0, 20).join(', ')}${allLocations.length > 20 ? '...' : ''}

Your task: Understand what the user REALLY wants:
1. What specific course/branch do they want? (e.g., if they say "computer" or "cs", they likely mean Computer Science/Computer Engineering)
2. What category do they want to apply in? (normalize to OPEN, OBC, SC, ST, etc.)
3. What location/city do they prefer? (e.g., "colleges in amravati", "amravati area", "i want college in amravati" = Amravati)
4. Any specific preferences or constraints?

Common course aliases:
- "cs", "computer", "computer science" = Computer Science/Computer Engineering
- "it" = Information Technology
- "ece" = Electronics and Communication Engineering
- etc.

Location patterns to detect:
- "in [city]" = location preference
- "[city] area" = location preference
- "college in [city]" = location preference
- "[city]" alone might be location if it matches a known city

Respond with JSON only:
{
  "understoodCourse": "exact course name or null if unclear",
  "courseAliases": ["list of possible course matches"],
  "understoodCategory": "normalized category name (OPEN/OBC/SC/ST/etc) or null",
  "understoodLocation": "city name or null if no location preference",
  "userIntent": "brief summary of what user wants",
  "constraints": ["any constraints mentioned"]
}`
    
    const intentCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an intent analyzer. Extract user requirements from their query. Always respond with valid JSON only, no markdown.'
        },
        {
          role: 'user',
          content: intentPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500
    })
    
    const intentContent = intentCompletion.choices[0]?.message?.content || '{}'
    let intentJson = intentContent.trim()
    if (intentJson.startsWith('```')) {
      intentJson = intentJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const intentMatch = intentJson.match(/\{[\s\S]*\}/)
    const userIntent = intentMatch ? JSON.parse(intentMatch[0]) : JSON.parse(intentJson)
    
    // STEP 2: Get relevant data based on understood intent (use valid records only)
    const understoodCourse = userIntent.understoodCourse || courseName
    const understoodCategory = userIntent.understoodCategory || category
    const understoodLocation = userIntent.understoodLocation || (question ? extractLocationFromQuery(question) : null)
    const relevantData = getRelevantData(validRecords, userPercentile, understoodCourse, understoodCategory, question, understoodLocation || undefined)
    
    // Also get broader data for comparison
    const allRelevantData = understoodCategory 
      ? getRelevantData(validRecords, userPercentile, undefined, understoodCategory, undefined, understoodLocation || undefined)
      : getRelevantData(validRecords, userPercentile, undefined, undefined, undefined, understoodLocation || undefined)
    const courseSpecificData = understoodCourse 
      ? getRelevantData(validRecords, userPercentile, understoodCourse, undefined, undefined, understoodLocation || undefined)
      : []
    
    // Prepare comprehensive data summary
    const dataSummary = {
      totalRecords: validRecords.length,
      relevantOptions: relevantData.length,
      allCategoryOptions: allRelevantData.length,
      courseSpecificOptions: courseSpecificData.length,
      userPercentile: userPercentile,
      userIntent: userIntent,
      topColleges: relevantData.slice(0, 15).map((r: any) => ({
        college: r.college_name,
        location: extractLocation(r.college_name || ''),
        course: r.course_name,
        category: getCategoryDisplayName(r.category),
        categoryCode: r.category,
        categoryFullName: getCategoryFullInfo(r.category).fullName,
        categoryDescription: getCategoryFullInfo(r.category).description,
        cutoffPercentile: parseFloat(r.percentile) || 0,
        cutoffRank: parseInt(r.rank) || 0,
        seatType: r.seat_type,
        margin: userPercentile - parseFloat(r.percentile) // How much above cutoff
      })),
      safetyOptions: relevantData.filter((r: any) => {
        const margin = userPercentile - parseFloat(r.percentile)
        return margin >= 5 // 5% or more above cutoff
      }).slice(0, 10).map((r: any) => ({
        college: r.college_name,
        course: r.course_name,
        category: getCategoryDisplayName(r.category),
        cutoffPercentile: parseFloat(r.percentile) || 0,
        margin: userPercentile - parseFloat(r.percentile)
      })),
      availableCategories: normalizedCategories,
      availableCourses: allCourses.slice(0, 20),
      filteredOut: records.length - validRecords.length // Count of filtered records
    }

    // STEP 3: Generate recommendations based on understood intent and data
    const prompt = `You are an expert college admission counselor for Maharashtra CAP (Centralized Admission Process) rounds.

USER INTENT ANALYSIS (what user really wants):
${JSON.stringify(userIntent, null, 2)}

USER DETAILS:
- Percentile: ${userPercentile}%
- Desired Course: ${userIntent.understoodCourse || courseName || 'Not specified'}
- Category Preference: ${userIntent.understoodCategory || category || 'Not specified'}
- Location Preference: ${userIntent.understoodLocation || 'Not specified'}
${question ? `- Additional Question: "${question}"` : ''}

CUTOFF DATA ANALYSIS:
- Total records in database: ${dataSummary.totalRecords}
- Exact matches (course + category): ${dataSummary.relevantOptions} options
- All options in preferred category: ${dataSummary.allCategoryOptions} options
- All options for preferred course: ${dataSummary.courseSpecificOptions} options

TOP MATCHING OPTIONS (where user can get admission):
${JSON.stringify(dataSummary.topColleges, null, 2)}

SAFETY OPTIONS (5%+ margin above cutoff):
${JSON.stringify(dataSummary.safetyOptions, null, 2)}

Available Categories: ${dataSummary.availableCategories.join(', ')}
Available Courses: ${dataSummary.availableCourses.slice(0, 15).join(', ')}${dataSummary.availableCourses.length > 15 ? '...' : ''}

CATEGORY CONTEXT:
- OPEN = Open category (no reservation, most competitive)
- OBC = Other Backward Class (27% reservation)
- SC = Scheduled Caste (15% reservation) 
- ST = Scheduled Tribe (7.5% reservation)
- NT = Nomadic Tribes
- EWS = Economically Weaker Section (10% reservation)
- TFWS = Tuition Fee Waiver Scheme

YOUR TASK - Provide SPECIFIC, ACTIONABLE recommendations:

1. **Recommendations** (Top 5-10): 
   - Focus on EXACT matches first (preferred course + category)
   - If exact matches are limited, include best alternatives
   - For each: college name, course name, category (use simple names like "SC", not "GSCH"), cutoff percentile, margin above cutoff, and SPECIFIC reason why it's good for THIS user

2. **Safety Options**: 
   - Colleges where user's percentile is 5%+ above cutoff
   - High probability of admission
   - Include margin and why it's safe

3. **Reach Options**: 
   - Colleges where user's percentile is within 2-3% of cutoff
   - Can try but competitive
   - Explain strategy

4. **Category Advice**: 
   - If user specified category (${userIntent.understoodCategory || 'none'}): Analyze if it's good for their percentile
   - Compare with other categories if data shows better options
   - Explain reservation benefits clearly
   - If user's percentile is ${userPercentile}% and they want ${userIntent.understoodCourse || 'a course'}, which category gives best chances?

5. **Location Advice** (if location specified):
   - If user wants colleges in ${userIntent.understoodLocation || 'a specific location'}, analyze options in that area
   - Mention if there are good colleges in that location for their percentile
   - Suggest nearby locations if options are limited

6. **Course Suggestions**: 
   - If user wants "${userIntent.understoodCourse || courseName}" but options are limited, suggest similar courses
   - Explain why alternatives might work
   - If exact course not available, what are closest matches?

7. **General Advice**: 
   - SPECIFIC strategy for THIS user (percentile ${userPercentile}%, course: ${userIntent.understoodCourse || 'any'}, category: ${userIntent.understoodCategory || 'any'})
   - CAP round strategy
   - How to maximize admission chances
   - What to do if current options aren't ideal

CRITICAL REQUIREMENTS:
- Be SPECIFIC and ACTIONABLE - don't give generic advice
- Use actual data from the cutoff list provided
- If user wants "${userIntent.understoodCourse || 'a specific course'}", prioritize that
- If user specified category "${userIntent.understoodCategory || 'none'}", focus on that but also mention alternatives if better
- Use simple category names (SC, OBC, OPEN) not codes (GSCH, GOBCS)
- If data shows ${dataSummary.relevantOptions} exact matches, list them specifically
- If no exact matches, explain why and suggest alternatives
- Be encouraging but realistic

Format as JSON:
{
  "recommendations": [{"college": "...", "course": "...", "category": "SC/OBC/OPEN/etc", "cutoffPercentile": ..., "margin": ..., "reason": "specific reason for THIS user"}],
  "safetyOptions": [{"college": "...", "course": "...", "category": "...", "cutoffPercentile": ..., "margin": ..., "reason": "..."}],
  "reachOptions": [{"college": "...", "course": "...", "category": "...", "cutoffPercentile": ..., "margin": ..., "reason": "..."}],
  "categoryAdvice": "Specific advice for user's category preference and percentile...",
  "courseSuggestions": ["Course 1", "Course 2", ...],
  "generalAdvice": "Specific, actionable advice for this user..."
}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful college admission counselor. Always respond with valid JSON only, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000
    })
    
    const content = chatCompletion.choices[0]?.message?.content || '{}'
    
    // Parse JSON response
    let jsonString = content.trim()
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonString)
    
    return NextResponse.json({
      success: true,
      recommendations,
      dataSummary: {
        totalOptions: relevantData.length,
        userPercentile: userPercentile
      }
    })
  } catch (error: any) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    )
  }
}

