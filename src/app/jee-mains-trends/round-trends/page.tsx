"use client"

import { useState, useEffect } from 'react'
import { Loader2, Search, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts'
import { WaveLoader } from '@/components/wave-loader'
import { useMinimumLoading } from '@/hooks/use-minimum-loading'

interface RoundTrendData {
  round: string
  roundName: string
  openingRank: number | null
  closingRank: number | null
  found: boolean
}

export default function RoundTrendsPage() {
  const [college, setCollege] = useState('')
  const [quota, setQuota] = useState('')
  const [seatType, setSeatType] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [roundTrends, setRoundTrends] = useState<RoundTrendData[]>([])
  const [error, setError] = useState('')
  
  // Filter options
  const [colleges, setColleges] = useState<string[]>([])
  const [quotas, setQuotas] = useState<string[]>([])
  const [seatTypes, setSeatTypes] = useState<string[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const availableYears = ['2024', '2023', '2022', '2021', '2020']

  const showAnalyzing = useMinimumLoading(loading, 5000) // Show chip loader for at least 5 seconds

  // Fetch all colleges and quotas on mount
  useEffect(() => {
    fetchInitialOptions()
  }, [])

  // Fetch branches when college is selected
  useEffect(() => {
    if (college) {
      fetchBranches()
    } else {
      setBranches([])
      setBranch('')
    }
  }, [college])

  const fetchInitialOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await fetch('/api/jee-mains/data?round=round1&year=2024&limit=10000')
      if (response.ok) {
        const data = await response.json()
        if (data.filters) {
          const allColleges = data.filters.colleges || []
          setColleges(allColleges)
          setQuotas(data.filters.quotas || [])
          setSeatTypes(data.filters.seatTypes || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch options:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const fetchBranches = async () => {
    if (!college) return

    setLoadingOptions(true)
    setBranches([])
    setBranch('')

    try {
      const params = new URLSearchParams({ college })
      const response = await fetch(`/api/jee-mains/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      } else {
        console.error('Failed to fetch branches')
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleAnalyze = async () => {
    if (!college || !quota || !seatType || !branch || !year) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setRoundTrends([])

    try {
      const params = new URLSearchParams({
        college,
        quota,
        seatType,
        branch,
        year
      })

      const response = await fetch(`/api/jee-mains/round-trends?${params}`)
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
    openingRank: t.openingRank || 0,
    closingRank: t.closingRank || 0
  }))

  const hasData = chartData.length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/jee-mains-trends"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Trend Analyzers</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">📊</div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Round-over-Round Trend Analyzer
              </h1>
              <p className="text-gray-300">
                Analyze how cutoff varies across rounds (Round 1-5) for a specific year
              </p>
            </div>
          </div>
        </div>

        {/* Analyzing Loader */}
        {showAnalyzing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <WaveLoader />
          </div>
        )}

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/30">
          <CardHeader>
            <CardTitle>Select Parameters</CardTitle>
            <CardDescription>
              Select college first, then branch will be filtered accordingly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* College Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  College <span className="text-red-400">*</span>
                </label>
                {loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Search college..."
                    list="colleges-list-2"
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                )}
                <datalist id="colleges-list-2">
                  {colleges.slice(0, 200).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {college && (
                  <p className="text-xs text-gray-500 mt-1">
                    {branches.length} branch{branches.length !== 1 ? 'es' : ''} found
                  </p>
                )}
              </div>

              {/* Quota Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quota <span className="text-red-400">*</span>
                </label>
                <select
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Quota</option>
                  {quotas.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seat Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seat Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={seatType}
                  onChange={(e) => setSeatType(e.target.value)}
                  disabled={loadingOptions}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Seat Type</option>
                  {seatTypes.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Branch <span className="text-red-400">*</span>
                </label>
                {!college ? (
                  <div className="w-full px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-sm">
                    Select college first
                  </div>
                ) : loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b.length > 50 ? `${b.substring(0, 50)}...` : b}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year <span className="text-red-400">*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
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
              disabled={loading || !college || !quota || !seatType || !branch || !year}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze Round Trends</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Round Trends Charts */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Opening Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Opening Rank by Round</CardTitle>
                    <CardDescription>
                      {college} - {branch} ({quota}, {seatType}) - {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 24,
                          left: 24,
                          right: 24,
                          bottom: 24,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                        <XAxis 
                          dataKey="round" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                          label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [value.toLocaleString(), 'Opening Rank']}
                          cursor={false}
                        />
                        <Line
                          type="natural"
                          dataKey="openingRank"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{
                            fill: "#3b82f6",
                            r: 4,
                          }}
                          activeDot={{
                            r: 6,
                          }}
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

                {/* Closing Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Closing Rank by Round</CardTitle>
                    <CardDescription>
                      {college} - {branch} ({quota}, {seatType}) - {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 24,
                          left: 24,
                          right: 24,
                          bottom: 24,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                        <XAxis 
                          dataKey="round" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af' }}
                          label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [value.toLocaleString(), 'Closing Rank']}
                          cursor={false}
                        />
                        <Line
                          type="natural"
                          dataKey="closingRank"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{
                            fill: "#06b6d4",
                            r: 4,
                          }}
                          activeDot={{
                            r: 6,
                          }}
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
              </div>
            )}

            {/* No Data Message */}
            {!loading && !hasData && roundTrends.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">
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

