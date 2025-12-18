"use client"

import { useState, useEffect, useRef } from 'react'
import { Loader2, Search, ArrowLeft, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts'
import { WaveLoader } from '@/components/wave-loader'
import { useMinimumLoading } from '@/hooks/use-minimum-loading'
import { getCategoryDisplayName } from '@/lib/category-normalizer'

interface RoundTrendData {
  round: string
  roundName: string
  rank: number | null
  percentile: number | null
  found: boolean
}

export default function MhetCetRoundTrendsPage() {
  const [college, setCollege] = useState('')
  const [category, setCategory] = useState('')
  const [seatType, setSeatType] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [roundTrends, setRoundTrends] = useState<RoundTrendData[]>([])
  const [error, setError] = useState('')
  
  // Filter options
  const [colleges, setColleges] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [seatTypes, setSeatTypes] = useState<string[]>([])
  const [courses, setCourses] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const availableYears = ['2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021']
  
  // College search dropdown
  const [collegeSearch, setCollegeSearch] = useState('')
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false)
  const collegeSearchRef = useRef<HTMLDivElement>(null)

  const showAnalyzing = useMinimumLoading(loading, 5000)

  // Fetch all colleges on mount
  useEffect(() => {
    fetchInitialOptions()
  }, [])

  // Close college dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collegeSearchRef.current && !collegeSearchRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter colleges based on search
  const filteredColleges = colleges.filter((c) => {
    if (!collegeSearch.trim()) return true
    const searchLower = collegeSearch.toLowerCase()
    return c.toLowerCase().includes(searchLower)
  })

  // Fetch categories when college is selected
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [college])

  // Fetch seat types when category is selected
  useEffect(() => {
    fetchSeatTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [college, category])

  // Fetch courses when seat type is selected
  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [college, category, seatType])

  const fetchInitialOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await fetch('/api/cutoff/data?examId=mht-cet-mh-cap-round-1&limit=10000')
      if (response.ok) {
        const data = await response.json()
        if (data.filters) {
          const allColleges = (data.filters.colleges || []).map((c: any) => c.name || c)
          setColleges(allColleges)
        }
      }
    } catch (error) {
      console.error('Failed to fetch options:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  // Fetch categories when college is selected
  const fetchCategories = async () => {
    if (!college) {
      setCategories([])
      setCategory('')
      return
    }

    setLoadingOptions(true)
    setCategories([])
    setCategory('')
    setSeatTypes([])
    setSeatType('')
    setCourses([])
    setCourse('')

    try {
      const params = new URLSearchParams({ college: college.trim() })
      const response = await fetch(`/api/mhet-cet/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  // Fetch seat types when college and category are selected
  const fetchSeatTypes = async () => {
    if (!college || !category) {
      setSeatTypes([])
      setSeatType('')
      setCourses([])
      setCourse('')
      return
    }

    setLoadingOptions(true)
    setSeatTypes([])
    setSeatType('')
    setCourses([])
    setCourse('')

    try {
      const params = new URLSearchParams({ 
        college: college.trim(),
        category: category
      })
      const response = await fetch(`/api/mhet-cet/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setSeatTypes(data.seatTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch seat types:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  // Fetch courses when college, category, and seat type are selected
  const fetchCourses = async () => {
    if (!college || !category || !seatType) {
      setCourses([])
      setCourse('')
      return
    }

    setLoadingOptions(true)
    setCourses([])
    setCourse('')

    try {
      const params = new URLSearchParams({ 
        college: college.trim(),
        category: category,
        seatType: seatType
      })
      const response = await fetch(`/api/mhet-cet/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleAnalyze = async () => {
    if (!college || !category || !seatType || !course || !year) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setRoundTrends([])

    try {
      const params = new URLSearchParams({
        college,
        category,
        seatType,
        course,
        year
      })

      const response = await fetch(`/api/mhet-cet/round-trends?${params}`)
      const result = await response.json()

      if (response.ok) {
        setRoundTrends(result.trends || [])
      } else {
        setError(result.error || 'Failed to fetch round trends')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch round trends')
    } finally {
      setLoading(false)
    }
  }

  const chartData = roundTrends.filter(t => t.found).map(t => ({
    round: t.roundName,
    rank: t.rank || 0,
    percentile: t.percentile || 0
  }))

  const hasData = chartData.length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/mhet-cet-trends"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trend Analyzers</span>
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="text-4xl sm:text-6xl">📈</div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Round-over-Round Trend Analyzer
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Analyze how cutoff varies across rounds (Round 1-3) for a specific year
              </p>
            </div>
          </div>
        </div>

        {/* Analyzing Loader */}
        {showAnalyzing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="w-full max-w-2xl px-4">
              <WaveLoader />
            </div>
          </div>
        )}

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Select Parameters</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Select college first, then course will be filtered accordingly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* College Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  College <span className="text-red-400">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="relative" ref={collegeSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={collegeSearch}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value)
                          setShowCollegeDropdown(true)
                        }}
                        onFocus={() => setShowCollegeDropdown(true)}
                        placeholder="Search college..."
                        className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 text-sm sm:text-base bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      {collegeSearch && (
                        <button
                          onClick={() => {
                            setCollegeSearch('')
                            setCollege('')
                            setShowCollegeDropdown(false)
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {showCollegeDropdown && collegeSearch && filteredColleges.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-black/95 border border-white/20 rounded-lg shadow-lg">
                        {filteredColleges.slice(0, 100).map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setCollege(c)
                              setCollegeSearch(c)
                              setShowCollegeDropdown(false)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-purple-500/20 transition-colors border-b border-white/5 last:border-b-0"
                          >
                            {c}
                          </button>
                        ))}
                        {filteredColleges.length > 100 && (
                          <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-white/5">
                            Showing first 100 of {filteredColleges.length} results
                          </div>
                        )}
                      </div>
                    )}
                    {showCollegeDropdown && collegeSearch && filteredColleges.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 px-4 py-2 bg-black/95 border border-white/20 rounded-lg shadow-lg text-sm text-gray-400">
                        No colleges found matching "{collegeSearch}"
                      </div>
                    )}
                  </div>
                )}
                {college && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {college}
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                {!college ? (
                  <div className="w-full px-3 sm:px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-xs sm:text-sm">
                    Select college first
                  </div>
                ) : loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select Category</option>
                      {categories.length === 0 ? (
                        <option disabled>No categories found</option>
                      ) : (
                        categories.map((c) => (
                          <option key={c} value={c}>
                            {getCategoryDisplayName(c)} ({c})
                          </option>
                        ))
                      )}
                    </select>
                    {categories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} available
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Seat Type Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Seat Type <span className="text-red-400">*</span>
                </label>
                {!college || !category ? (
                  <div className="w-full px-3 sm:px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-xs sm:text-sm">
                    {!college ? 'Select college first' : 'Select category first'}
                  </div>
                ) : loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <select
                    value={seatType}
                    onChange={(e) => setSeatType(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Select Seat Type</option>
                    {seatTypes.length === 0 ? (
                      <option disabled>No seat types found</option>
                    ) : (
                      seatTypes.map((st) => (
                        <option key={st} value={st}>
                          {st.length > 40 ? `${st.substring(0, 40)}...` : st}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Course <span className="text-red-400">*</span>
                </label>
                {!college || !category || !seatType ? (
                  <div className="w-full px-3 sm:px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-xs sm:text-sm">
                    {!college ? 'Select college first' : !category ? 'Select category first' : 'Select seat type first'}
                  </div>
                ) : loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Select Course</option>
                    {courses.length === 0 ? (
                      <option disabled>No courses found</option>
                    ) : (
                      courses.map((c) => (
                        <option key={c} value={c}>
                          {c.length > 50 ? `${c.substring(0, 50)}...` : c}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Year <span className="text-red-400">*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Select Year</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !college || !category || !seatType || !course || !year}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Analyze Trends</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {/* Charts */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
                {/* Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Rank by Round</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {college} - {course} ({category}, {seatType})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="round" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [value.toLocaleString(), 'Rank']}
                        />
                        <Line 
                          type="natural"
                          dataKey="rank" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          dot={{ fill: '#a855f7', r: 4 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            position="top"
                            offset={12}
                            className="fill-white"
                            fontSize={12}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Percentile Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Percentile by Round</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {college} - {course} ({category}, {seatType})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="round" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          label={{ value: 'Percentile', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [`${value.toFixed(2)}%`, 'Percentile']}
                        />
                        <Line 
                          type="natural"
                          dataKey="percentile" 
                          stroke="#ec4899" 
                          strokeWidth={2}
                          dot={{ fill: '#ec4899', r: 4 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            position="top"
                            offset={12}
                            className="fill-white"
                            fontSize={12}
                            formatter={(value: any) => `${value.toFixed(2)}%`}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* No Data Message */}
            {!loading && !hasData && roundTrends.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                <p className="text-yellow-400 text-xs sm:text-sm">
                  No data found for the selected combination. Try different filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

