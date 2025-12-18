"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Search, Loader2, FileText, GraduationCap, BookOpen, ArrowLeft, Sparkles, MapPin, GitCompare, X, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getCategoryDisplayName, getCategoryFullInfo, groupCategoriesByNormalizedName, getNormalizedCategories } from '@/lib/category-normalizer'
import { extractLocation } from '@/lib/location-extractor'
import { useMinimumLoading } from '@/hooks/use-minimum-loading'
import { BouncingLoader } from '@/components/bouncing-loader'

interface CutoffData {
  college_code: string
  college_name: string
  course_code: string
  course_name: string
  seat_type: string
  category: string
  rank: number
  percentile: number
  opening_rank?: number
  closing_rank?: number
  gender?: string
}

interface FilterOptions {
  colleges: Array<{ code: string; name: string }>
  courses: Array<{ code: string; name: string }>
  categories: string[]
  seatTypes: string[]
  locations?: string[]
}

// Exam configurations
const examConfig: Record<string, { name: string; year: string }> = {
  'mht-cet': { name: 'MHT-CET', year: '2022' },
  'mhet': { name: 'MHET', year: '2024' },
  'pharma': { name: 'Pharmacy', year: '2024' },
  'jee': { name: 'JEE', year: '2024' },
  'neet': { name: 'NEET', year: '2024' },
  'gate': { name: 'GATE', year: '2024' }
}

// Helper function to get short seat type name
function getSeatTypeShortName(seatType: string): string {
  const lower = seatType.toLowerCase()
  if (lower.includes('home university') && lower.includes('home university candidates')) {
    return 'HU'
  } else if (lower.includes('other than home university') && lower.includes('other than home university candidates')) {
    return 'OHU'
  } else if (lower.includes('other than home university') && lower.includes('home university candidates')) {
    return 'OHU→HU'
  } else if (lower.includes('state level')) {
    return 'State Level'
  }
  // Return first 3 words or truncate
  const words = seatType.split(' ')
  if (words.length <= 3) return seatType
  return words.slice(0, 3).join(' ') + '...'
}

// Memoized table row component
const TableRow = ({ row, isJeeMains = false }: { row: CutoffData; isJeeMains?: boolean }) => {
  const location = extractLocation(row.college_name)
  
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-white">{row.college_name}</div>
            <div className="flex items-center gap-2 mt-1">
              {!isJeeMains && <span className="text-xs text-gray-500">Code: {row.college_code}</span>}
              {location && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <div>
            <div className="font-medium text-white">{row.course_name}</div>
            {!isJeeMains && <div className="text-xs text-gray-500">Code: {row.course_code}</div>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {isJeeMains ? (
          <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 text-xs font-medium">
            {row.category}
          </span>
        ) : (
          <span 
            className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-medium"
            title={getCategoryFullInfo(row.category).fullName + ' - ' + getCategoryFullInfo(row.category).description}
          >
            {getCategoryDisplayName(row.category)}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: row.seat_type.toLowerCase().includes('home university') && row.seat_type.toLowerCase().includes('home university candidates')
              ? 'rgba(34, 197, 94, 0.2)'
              : row.seat_type.toLowerCase().includes('other than home university') && row.seat_type.toLowerCase().includes('other than home university candidates')
              ? 'rgba(59, 130, 246, 0.2)'
              : row.seat_type.toLowerCase().includes('state level')
              ? 'rgba(168, 85, 247, 0.2)'
              : 'rgba(107, 114, 128, 0.2)',
            color: row.seat_type.toLowerCase().includes('home university') && row.seat_type.toLowerCase().includes('home university candidates')
              ? 'rgb(34, 197, 94)'
              : row.seat_type.toLowerCase().includes('other than home university') && row.seat_type.toLowerCase().includes('other than home university candidates')
              ? 'rgb(59, 130, 246)'
              : row.seat_type.toLowerCase().includes('state level')
              ? 'rgb(168, 85, 247)'
              : 'rgb(156, 163, 175)'
          }}
          title={row.seat_type}
        >
          {getSeatTypeShortName(row.seat_type)}
        </span>
        {isJeeMains && row.gender && (
          <div className="text-xs text-gray-400 mt-1">{row.gender}</div>
        )}
      </td>
      {isJeeMains ? (
        <>
          <td className="px-6 py-4 text-right font-mono text-gray-300">
            {row.opening_rank ? row.opening_rank.toLocaleString() : '-'}
          </td>
          <td className="px-6 py-4 text-right font-mono text-orange-400 font-semibold">
            {row.closing_rank ? row.closing_rank.toLocaleString() : '-'}
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 text-right font-mono text-gray-300">{row.rank.toLocaleString()}</td>
          <td className="px-6 py-4 text-right font-mono text-purple-400 font-semibold">
            {row.percentile.toFixed(2)}
          </td>
        </>
      )}
    </tr>
  )
}

export default function CutoffPage() {
  const params = useParams()
  const examId = params?.examId as string
  
  // Parse JEE Mains exam ID
  const jeeMainsMatch = examId?.match(/jee-mains-(round\d+)-(\d{4})/)
  const isJeeMains = examId?.startsWith('jee-mains-')
  const jeeMainsRoundName = jeeMainsMatch ? jeeMainsMatch[1].replace('round', 'Round ') : null
  const jeeMainsRound = jeeMainsMatch ? jeeMainsMatch[1] : null
  const jeeMainsYear = jeeMainsMatch ? jeeMainsMatch[2] : null
  
  const [examInfo, setExamInfo] = useState<{ name: string; year: string }>(() => {
    if (isJeeMains && jeeMainsRoundName && jeeMainsYear) {
      return { name: `JEE Mains ${jeeMainsRoundName}`, year: jeeMainsYear }
    }
    return examConfig[examId] || { name: examId, year: '2024' }
  })

  const [data, setData] = useState<CutoffData[]>([])
  const [loading, setLoading] = useState(true)
  const showLoading = useMinimumLoading(loading, 3500) // Show for at least 3.5 seconds

  // Fetch exam metadata if available
  useEffect(() => {
    const fetchExamMetadata = async () => {
      try {
        const response = await fetch(`/${examId}_metadata.json`)
        if (response.ok) {
          const metadata = await response.json()
          setExamInfo({
            name: metadata.examName || examId,
            year: metadata.year || '2024'
          })
        }
      } catch (error) {
        // Metadata not found, use default
        console.log('Metadata not found, using default')
      }
    }
    fetchExamMetadata()
  }, [examId])
  const [parsing, setParsing] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    colleges: [],
    courses: [],
    categories: [],
    seatTypes: []
  })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSeatType, setSelectedSeatType] = useState('')
  const [minPercentile, setMinPercentile] = useState('')
  const [maxPercentile, setMaxPercentile] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedColleges, setSelectedColleges] = useState<string[]>([])
  const [selectedCourseForCompare, setSelectedCourseForCompare] = useState('')
  const [comparisonData, setComparisonData] = useState<any[]>([])
  const [comparisonCategories, setComparisonCategories] = useState<any[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [collegeSearch, setCollegeSearch] = useState('')
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false)
  const collegeSearchRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeSearchRef.current && !collegeSearchRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Get unique colleges for comparison dropdown
  const availableColleges = useMemo(() => {
    return Array.from(
      new Map(filters.colleges.map(c => [c.code, c])).values()
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [filters.colleges])
  
  // Filter colleges based on search
  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return availableColleges.filter(c => !selectedColleges.includes(c.code))
    const searchLower = collegeSearch.toLowerCase()
    return availableColleges
      .filter(c => !selectedColleges.includes(c.code))
      .filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower)
      )
      .slice(0, 10) // Limit to 10 results
  }, [collegeSearch, availableColleges, selectedColleges])
  
  // Add college to comparison
  const addCollegeToCompare = useCallback((collegeCode: string) => {
    if (selectedColleges.includes(collegeCode)) return
    if (selectedColleges.length >= 4) {
      alert('Maximum 4 colleges can be compared at once')
      return
    }
    setSelectedColleges(prev => [...prev, collegeCode])
  }, [selectedColleges])
  
  // Remove college from comparison
  const removeCollegeFromCompare = useCallback((collegeCode: string) => {
    setSelectedColleges(prev => prev.filter(code => code !== collegeCode))
  }, [])
  
  // Compare selected colleges
  const handleCompare = useCallback(async () => {
    if (selectedColleges.length === 0) {
      alert('Please select at least one college to compare')
      return
    }
    
    setComparing(true)
    try {
      const response = await fetch('/api/cutoff/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          examId, 
          collegeCodes: selectedColleges,
          courseCode: selectedCourseForCompare || undefined
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setComparisonData(result.comparison)
        // Sort categories by normalized name for better display
        const sortedCategories = (result.allCategories || []).sort((a: any, b: any) => 
          a.name.localeCompare(b.name)
        )
        setComparisonCategories(sortedCategories)
        setShowComparison(true)
      } else {
        alert(`Failed to compare: ${result.error}`)
      }
    } catch (error: any) {
      alert(`Error comparing colleges: ${error.message}`)
    } finally {
      setComparing(false)
    }
  }, [selectedColleges, selectedCourseForCompare, examId])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Use JEE Mains API if it's a JEE Mains exam
      if (isJeeMains && jeeMainsRound && jeeMainsYear) {
        const params = new URLSearchParams({
          year: jeeMainsYear,
          round: jeeMainsRound,
          page: page.toString(),
          limit: '50'
        })
        
        if (debouncedSearch) params.append('search', debouncedSearch)
        if (selectedCourse) params.append('college', selectedCourse) // For JEE Mains, course filter maps to college
        if (selectedCategory) params.append('branch', selectedCategory) // For JEE Mains, category filter maps to branch
        if (selectedSeatType) params.append('seatType', selectedSeatType)
        // JEE Mains doesn't have percentile, so skip those filters

        const response = await fetch(`/api/jee-mains/data?${params}`)
        const result = await response.json()

        if (response.ok) {
          // Transform JEE Mains data to match expected format
          const transformedData = (result.data || []).map((row: any) => ({
            college_code: row.college || '',
            college_name: row.college || '',
            course_code: row.branch || '',
            course_name: row.branch || '',
            seat_type: row['seat type'] || '',
            category: row.quota || '',
            rank: parseInt(row['closing rank']) || 0,
            percentile: 0, // JEE Mains doesn't have percentile
            opening_rank: parseInt(row['opening rank']) || 0,
            closing_rank: parseInt(row['closing rank']) || 0,
            gender: row.gender || ''
          }))
          setData(transformedData)
          setTotalPages(result.totalPages || 1)
          setTotal(result.total || 0)
          if (result.filters) {
            // Transform JEE Mains filters
            setFilters({
              colleges: (result.filters.colleges || []).map((c: string) => ({ code: c, name: c })),
              courses: (result.filters.branches || []).map((b: string) => ({ code: b, name: b })),
              categories: result.filters.quotas || [],
              seatTypes: result.filters.seatTypes || []
            })
          }
        } else {
          console.error('Failed to fetch JEE Mains data:', result.error)
        }
        return
      }

      // Regular Maharashtra exam API
      const params = new URLSearchParams({
        examId,
        search: debouncedSearch,
        course: selectedCourse,
        category: selectedCategory,
        page: page.toString(),
        limit: '50'
      })
      if (selectedSeatType) params.append('seatType', selectedSeatType)
      if (minPercentile) params.append('minPercentile', minPercentile)
      if (maxPercentile) params.append('maxPercentile', maxPercentile)

      const response = await fetch(`/api/cutoff/data?${params}`)
      const result = await response.json()

      if (response.ok) {
        setData(result.data)
        setFilters(result.filters)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      } else {
        console.error('Failed to fetch data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [examId, debouncedSearch, selectedCourse, selectedCategory, selectedSeatType, minPercentile, maxPercentile, page, isJeeMains, jeeMainsRound, jeeMainsYear])

  const parsePDF = async () => {
    try {
      setParsing(true)
      const response = await fetch('/api/cutoff/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ examId })
      })
      const result = await response.json()

      if (response.ok) {
        alert('PDF parsed successfully! Refreshing data...')
        await fetchData()
      } else {
        alert(`Failed to parse PDF: ${result.error}`)
      }
    } catch (error: any) {
      alert(`Error parsing PDF: ${error.message}`)
    } finally {
      setParsing(false)
    }
  }

  // Fetch data when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCourse, selectedCategory, selectedSeatType, minPercentile, maxPercentile])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Limit filter options for performance
  const limitedCourses = useMemo(() => {
    return filters.courses.slice(0, 500) // Limit to first 500 courses
  }, [filters.courses])

  // Group categories by normalized name for better UX
  const groupedCategories = useMemo(() => {
    const grouped = groupCategoriesByNormalizedName(filters.categories)
    const normalized = getNormalizedCategories(filters.categories)
    return { grouped, normalized }
  }, [filters.categories])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Comparison Section */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Compare Colleges
            </CardTitle>
            <CardDescription>
              Select up to 4 colleges to compare their cutoff data across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* College Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Colleges ({selectedColleges.length}/4)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedColleges.map((collegeCode) => {
                    const college = availableColleges.find(c => c.code === collegeCode)
                    return (
                      <div
                        key={collegeCode}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg"
                      >
                        <span className="text-sm text-white">{college?.name || collegeCode}</span>
                        <button
                          onClick={() => removeCollegeFromCompare(collegeCode)}
                          className="p-1 hover:bg-green-600/30 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                {selectedColleges.length < 4 && (
                  <div className="relative" ref={collegeSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search college by name or code..."
                        value={collegeSearch}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value)
                          setShowCollegeDropdown(true)
                        }}
                        onFocus={() => setShowCollegeDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                    {showCollegeDropdown && filteredColleges.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-black/95 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredColleges.map((college) => (
                          <button
                            key={college.code}
                            onClick={() => {
                              addCollegeToCompare(college.code)
                              setCollegeSearch('')
                              setShowCollegeDropdown(false)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <div className="font-medium text-white">{college.name}</div>
                            <div className="text-xs text-gray-400">Code: {college.code}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showCollegeDropdown && collegeSearch && filteredColleges.length === 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-black/95 border border-white/10 rounded-lg shadow-lg p-4 text-center text-gray-400 text-sm">
                        No colleges found matching "{collegeSearch}"
                      </div>
                    )}
                  </div>
                )}
                {selectedColleges.length >= 4 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Maximum 4 colleges selected. Remove one to add another.
                  </p>
                )}
              </div>
              
              {/* Course Filter (Optional) */}
              {selectedColleges.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Course (Optional)
                  </label>
                  <select
                    value={selectedCourseForCompare}
                    onChange={(e) => setSelectedCourseForCompare(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                  >
                    <option value="">All Courses</option>
                    {limitedCourses.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Compare Button */}
              {selectedColleges.length > 0 && (
                <button
                  onClick={handleCompare}
                  disabled={comparing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {comparing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-5 h-5" />
                      <span>Compare {selectedColleges.length} College{selectedColleges.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Exams</span>
          </Link>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {examInfo.name} Cutoff {examInfo.year}
              </h1>
              <p className="text-gray-300">College admission cutoff data for engineering courses</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/exams/${examId}/recommend`}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span>AI Recommendations</span>
              </Link>
              {/* Parse PDF Button - Hidden from public UI */}
              {/* <button
                onClick={parsePDF}
                disabled={parsing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Parse PDF</span>
                  </>
                )}
              </button> */}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400">Total Records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400">Colleges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filters.colleges.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400">Courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filters.courses.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400">Categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filters.categories.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by college, course, or location (e.g., 'colleges in Amravati', 'Amravati area')..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Seat Type Quick Filters */}
              {filters.seatTypes.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Seat Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSeatType('')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedSeatType === ''
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      All
                    </button>
                    {filters.seatTypes.map((seatType) => {
                      const shortName = getSeatTypeShortName(seatType)
                      return (
                        <button
                          key={seatType}
                          type="button"
                          onClick={() => setSelectedSeatType(seatType)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedSeatType === seatType
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          title={seatType}
                        >
                          {shortName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Courses</option>
                    {limitedCourses.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    {groupedCategories.normalized.map((normalizedCat) => {
                      const codes = groupedCategories.grouped.get(normalizedCat) || []
                      const categoryInfo = getCategoryFullInfo(codes[0])
                      return (
                        <optgroup key={normalizedCat} label={`${normalizedCat} - ${categoryInfo.description}`}>
                          {codes.map((code) => (
                            <option key={code} value={code}>
                              {getCategoryDisplayName(code)} ({code})
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                  {selectedCategory && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getCategoryFullInfo(selectedCategory).description}
                    </p>
                  )}
                </div>

                {/* Min Percentile - Only show for non-JEE Mains exams */}
                {!isJeeMains && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Min Percentile</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={minPercentile}
                        onChange={(e) => setMinPercentile(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* Max Percentile */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Max Percentile</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={maxPercentile}
                        onChange={(e) => setMaxPercentile(e.target.value)}
                        placeholder="100.00"
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {showLoading ? (
          <div className="flex items-center justify-center py-20">
            <BouncingLoader />
          </div>
        ) : data.length === 0 ? (
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardContent className="py-20 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No data found.</p>
              {/* Parse PDF Button - Hidden from public UI */}
              {/* <button
                onClick={parsePDF}
                disabled={parsing}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                Parse PDF
              </button> */}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">College</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{isJeeMains ? 'Branch' : 'Course'}</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">{isJeeMains ? 'Quota' : 'Category'}</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Seat Type</th>
                        {isJeeMains ? (
                          <>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Opening Rank</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Closing Rank</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Rank</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Percentile</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <TableRow 
                          key={`${row.college_code}-${row.course_code}-${row.category}-${index}`} 
                          row={row}
                          isJeeMains={isJeeMains}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-gray-400 text-sm">
                  Showing page {page} of {totalPages} ({total} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Comparison Dashboard */}
        {showComparison && comparisonData.length > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30 max-w-7xl w-full my-8">
              <CardHeader className="sticky top-0 bg-black/80 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <GitCompare className="w-6 h-6" />
                      Comparison Dashboard
                    </CardTitle>
                    <CardDescription>
                      Comparing {comparisonData.length} college{comparisonData.length !== 1 ? 's' : ''} across all categories
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => {
                      setShowComparison(false)
                      setSelectedColleges([])
                      setSelectedCourseForCompare('')
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* College Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {comparisonData.map((college, idx) => (
                    <Card key={idx} className="bg-black/30 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{college.collegeName}</CardTitle>
                        <CardDescription className="text-xs">
                          Code: {college.collegeCode}
                          {college.location && (
                            <span className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {college.location}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Courses: </span>
                            <span className="text-white">{college.courses.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Categories: </span>
                            <span className="text-white">{college.categories.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Records: </span>
                            <span className="text-white">{college.totalRecords}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Category-wise Comparison Table */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Category-wise Cutoff Comparison</h3>
                  
                  {comparisonCategories.map((category) => {
                    // Get data for this category from all colleges
                    const categoryRows = comparisonData.map((college) => {
                      const catData = college.categories.find((c: any) => c.code === category.code)
                      return {
                        college: college.collegeName,
                        collegeCode: college.collegeCode,
                        location: college.location,
                        categoryData: catData || null
                      }
                    }).filter(row => row.categoryData !== null)
                    
                    if (categoryRows.length === 0) return null
                    
                    return (
                      <Card key={category.code} className="bg-black/20 border-white/5 mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm font-medium">
                              {category.name}
                            </span>
                            <span className="text-sm text-gray-400 font-normal">
                              {category.fullName}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">College</th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Seat Type</th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Cutoff %</th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Rank</th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">All Options</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryRows.map((row, rowIdx) => (
                                  <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4">
                                      <div className="font-medium text-white">{row.college}</div>
                                      <div className="text-xs text-gray-500">Code: {row.collegeCode}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                      {row.location && (
                                        <span className="flex items-center gap-1 text-sm text-gray-300">
                                          <MapPin className="w-4 h-4" />
                                          {row.location}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">
                                        {getSeatTypeShortName(row.categoryData.bestSeatType)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <span className="font-mono text-purple-400 font-semibold">
                                        {row.categoryData.bestPercentile.toFixed(2)}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <span className="font-mono text-gray-300">
                                        {row.categoryData.bestRank.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        {row.categoryData.seatTypeData.slice(0, 3).map((seat: any, seatIdx: number) => (
                                          <span
                                            key={seatIdx}
                                            className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs"
                                            title={`${seat.seatType}: ${seat.percentile.toFixed(2)}%`}
                                          >
                                            {getSeatTypeShortName(seat.seatType)}: {seat.percentile.toFixed(1)}%
                                          </span>
                                        ))}
                                        {row.categoryData.seatTypeData.length > 3 && (
                                          <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-400 text-xs">
                                            +{row.categoryData.seatTypeData.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Comparison shows all available cutoff data organized by category. Lower percentile = higher rank = better cutoff.
                  </p>
                  <button
                    onClick={() => {
                      setShowComparison(false)
                      setSelectedColleges([])
                      setSelectedCourseForCompare('')
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    Close
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

