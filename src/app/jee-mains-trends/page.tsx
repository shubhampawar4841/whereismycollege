"use client"

import { useState, useEffect } from 'react'
import { TrendingUp, Loader2, Search, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList, Line, LineChart } from 'recharts'

interface TrendData {
  year: string
  openingRank: number | null
  closingRank: number | null
  found: boolean
}

interface RoundTrendData {
  round: string
  roundName: string
  openingRank: number | null
  closingRank: number | null
  found: boolean
}

export default function JeeMainsTrendsPage() {
  // Year-over-year trends (by round)
  const [college, setCollege] = useState('')
  const [quota, setQuota] = useState('')
  const [seatType, setSeatType] = useState('')
  const [branch, setBranch] = useState('')
  const [round, setRound] = useState('')
  const [loading, setLoading] = useState(false)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [error, setError] = useState('')
  
  // Round-over-round trends (by year)
  const [college2, setCollege2] = useState('')
  const [quota2, setQuota2] = useState('')
  const [seatType2, setSeatType2] = useState('')
  const [branch2, setBranch2] = useState('')
  const [year2, setYear2] = useState('')
  const [loading2, setLoading2] = useState(false)
  const [roundTrends, setRoundTrends] = useState<RoundTrendData[]>([])
  const [error2, setError2] = useState('')
  
  // Filter options
  const [colleges, setColleges] = useState<string[]>([])
  const [quotas, setQuotas] = useState<string[]>([])
  const [seatTypes, setSeatTypes] = useState<string[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [rounds, setRounds] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Options for round trends (separate from year trends)
  const [colleges2, setColleges2] = useState<string[]>([])
  const [branches2, setBranches2] = useState<string[]>([])
  const [rounds2, setRounds2] = useState<string[]>([])
  const [loadingOptions2, setLoadingOptions2] = useState(false)
  const availableYears = ['2024', '2023', '2022', '2021', '2020']

  // Fetch all colleges and quotas on mount
  useEffect(() => {
    fetchInitialOptions()
  }, [])

  // Fetch branches and rounds when college is selected (for year trends)
  useEffect(() => {
    if (college) {
      fetchBranchesAndRounds()
    } else {
      setBranches([])
      setRounds([])
      setBranch('')
      setRound('')
    }
  }, [college])

  // Fetch branches and rounds when college2 is selected (for round trends)
  useEffect(() => {
    if (college2) {
      fetchBranchesAndRounds2()
    } else {
      setBranches2([])
      setRounds2([])
      setBranch2('')
    }
  }, [college2])

  const fetchInitialOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await fetch('/api/jee-mains/data?round=round1&year=2024&limit=10000')
      if (response.ok) {
        const data = await response.json()
        if (data.filters) {
          const allColleges = data.filters.colleges || []
          setColleges(allColleges)
          setColleges2(allColleges) // Share colleges between both analyzers
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

  const fetchBranchesAndRounds = async () => {
    if (!college) return

    setLoadingOptions(true)
    setBranches([])
    setRounds([])
    setBranch('')
    setRound('')

    try {
      const params = new URLSearchParams({ college })
      const response = await fetch(`/api/jee-mains/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
        setRounds(data.rounds || [])
      } else {
        console.error('Failed to fetch branches and rounds')
      }
    } catch (error) {
      console.error('Failed to fetch branches and rounds:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const fetchBranchesAndRounds2 = async () => {
    if (!college2) return

    setLoadingOptions2(true)
    setBranches2([])
    setRounds2([])
    setBranch2('')

    try {
      const params = new URLSearchParams({ college: college2 })
      const response = await fetch(`/api/jee-mains/options?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setBranches2(data.branches || [])
        setRounds2(data.rounds || [])
      } else {
        console.error('Failed to fetch branches and rounds')
      }
    } catch (error) {
      console.error('Failed to fetch branches and rounds:', error)
    } finally {
      setLoadingOptions2(false)
    }
  }

  const handleAnalyze = async () => {
    if (!college || !quota || !seatType || !branch || !round) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setTrends([])

    try {
      const params = new URLSearchParams({
        college,
        quota,
        seatType,
        branch,
        round
      })

      const response = await fetch(`/api/jee-mains/trends?${params}`)
      const result = await response.json()

      if (response.ok) {
        setTrends(result.trends || [])
      } else {
        setError(result.error || 'Failed to fetch trends')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch trends')
    } finally {
      setLoading(false)
    }
  }

  const handleRoundTrendAnalyze = async () => {
    if (!college2 || !quota2 || !seatType2 || !branch2 || !year2) {
      setError2('Please fill in all fields')
      return
    }

    setLoading2(true)
    setError2('')
    setRoundTrends([])

    try {
      const params = new URLSearchParams({
        college: college2,
        quota: quota2,
        seatType: seatType2,
        branch: branch2,
        year: year2
      })

      const response = await fetch(`/api/jee-mains/round-trends?${params}`)
      const result = await response.json()

      if (response.ok) {
        setRoundTrends(result.trends || [])
      } else {
        setError2(result.error || 'Failed to fetch round trends')
      }
    } catch (error: any) {
      setError2(error.message || 'Failed to fetch round trends')
    } finally {
      setLoading2(false)
    }
  }

  // Prepare chart data for year trends
  const chartData = trends
    .filter(t => t.found)
    .map(t => ({
      year: t.year,
      openingRank: t.openingRank || 0,
      closingRank: t.closingRank || 0
    }))
    .reverse() // Show oldest to newest

  const hasData = chartData.length > 0

  // Prepare chart data for round trends
  const roundChartData = roundTrends
    .filter(t => t.found)
    .map(t => ({
      round: t.roundName,
      openingRank: t.openingRank || 0,
      closingRank: t.closingRank || 0
    }))

  const hasRoundData = roundChartData.length > 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-8 h-8 text-orange-400" />
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                JEE Mains Cutoff Trend Analyzer
              </h1>
              <p className="text-gray-300">
                Analyze opening and closing rank trends across the last 5 years
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/30">
          <CardHeader>
            <CardTitle>Year-over-Year Trend Analyzer</CardTitle>
            <CardDescription>
              Analyze how cutoff varies across years (2020-2024) for a specific round. Select college first, then branch and round will be filtered accordingly.
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
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Search college..."
                    list="colleges-list"
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                )}
                <datalist id="colleges-list">
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
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
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
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Seat Type</option>
                  {seatTypes.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection - Only shown after college is selected */}
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
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
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

              {/* Round Selection - Only shown after college is selected */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Round <span className="text-red-400">*</span>
                </label>
                {!college ? (
                  <div className="w-full px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-sm">
                    Select college first
                  </div>
                ) : loadingOptions ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select Round</option>
                    {rounds.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1).replace('round', 'Round ')}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !college || !quota || !seatType || !branch || !round}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze Trends</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Charts */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Opening Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Opening Rank Trend</CardTitle>
                    <CardDescription>
                      {college} - {branch} ({quota}, {seatType})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="year" 
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
                        />
                        <Bar 
                          dataKey="openingRank" 
                          fill="#f97316" 
                          radius={[8, 8, 0, 0]}
                        >
                          <LabelList
                            position="top"
                            offset={12}
                            className="fill-white"
                            fontSize={12}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Closing Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Closing Rank Trend</CardTitle>
                    <CardDescription>
                      {college} - {branch} ({quota}, {seatType})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="year" 
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
                        />
                        <Bar 
                          dataKey="closingRank" 
                          fill="#eab308" 
                          radius={[8, 8, 0, 0]}
                        >
                          <LabelList
                            position="top"
                            offset={12}
                            className="fill-white"
                            fontSize={12}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* No Data Message */}
            {!loading && !hasData && trends.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                <p className="text-yellow-400 text-sm">
                  No data found for the selected combination. Try different filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Round-over-Round Trends Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/30 mt-8">
          <CardHeader>
            <CardTitle>Round-over-Round Trend Analyzer</CardTitle>
            <CardDescription>
              Analyze how cutoff varies across rounds (Round 1-5) for a specific year
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
                {loadingOptions2 ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={college2}
                    onChange={(e) => setCollege2(e.target.value)}
                    placeholder="Search college..."
                    list="colleges-list-2"
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                )}
                <datalist id="colleges-list-2">
                  {colleges2.slice(0, 200).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {college2 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {branches2.length} branch{branches2.length !== 1 ? 'es' : ''} found
                  </p>
                )}
              </div>

              {/* Quota Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quota <span className="text-red-400">*</span>
                </label>
                <select
                  value={quota2}
                  onChange={(e) => setQuota2(e.target.value)}
                  disabled={loadingOptions2}
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
                  value={seatType2}
                  onChange={(e) => setSeatType2(e.target.value)}
                  disabled={loadingOptions2}
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

              {/* Branch Selection - Only shown after college is selected */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Branch <span className="text-red-400">*</span>
                </label>
                {!college2 ? (
                  <div className="w-full px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-gray-500 text-sm">
                    Select college first
                  </div>
                ) : loadingOptions2 ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <select
                    value={branch2}
                    onChange={(e) => setBranch2(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Branch</option>
                    {branches2.map((b) => (
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
                  value={year2}
                  onChange={(e) => setYear2(e.target.value)}
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
              onClick={handleRoundTrendAnalyze}
              disabled={loading2 || !college2 || !quota2 || !seatType2 || !branch2 || !year2}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading2 ? (
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
            {error2 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error2}</p>
              </div>
            )}

            {/* Round Trends Charts */}
            {hasRoundData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Opening Rank Chart */}
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Opening Rank by Round</CardTitle>
                    <CardDescription>
                      {college2} - {branch2} ({quota2}, {seatType2}) - {year2}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={roundChartData}
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
                      {college2} - {branch2} ({quota2}, {seatType2}) - {year2}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={roundChartData}
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
            {!loading2 && !hasRoundData && roundTrends.length > 0 && (
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

