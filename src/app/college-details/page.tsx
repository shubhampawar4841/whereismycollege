"use client"

import { useState, useEffect } from 'react'
import { Building2, Loader2, Search, ArrowLeft, GraduationCap, Calendar, Filter, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface CollegeData {
  year: string
  round: string
  roundName: string
  branch: string
  quota: string
  seatType: string
  gender?: string
  openingRank: number
  closingRank: number
}

export default function CollegeDetailsPage() {
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CollegeData[]>([])
  const [filters, setFilters] = useState<{
    branches: string[]
    quotas: string[]
    seatTypes: string[]
    years: string[]
    rounds: string[]
  }>({
    branches: [],
    quotas: [],
    seatTypes: [],
    years: [],
    rounds: []
  })
  const [collegeName, setCollegeName] = useState('')
  const [totalRecords, setTotalRecords] = useState(0)
  const [error, setError] = useState('')
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedQuota, setSelectedQuota] = useState('')
  const [selectedSeatType, setSelectedSeatType] = useState('')
  
  // Autocomplete colleges
  const [colleges, setColleges] = useState<string[]>([])
  const [loadingColleges, setLoadingColleges] = useState(false)

  useEffect(() => {
    fetchColleges()
  }, [])

  const fetchColleges = async () => {
    setLoadingColleges(true)
    try {
      const response = await fetch('/api/jee-mains/data?round=round1&year=2024&limit=10000')
      if (response.ok) {
        const result = await response.json()
        if (result.filters?.colleges) {
          setColleges(result.filters.colleges || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error)
    } finally {
      setLoadingColleges(false)
    }
  }

  const handleSearch = async () => {
    if (!college.trim()) {
      setError('Please enter a college name')
      return
    }

    setLoading(true)
    setError('')
    setData([])
    setCollegeName('')
    setTotalRecords(0)

    try {
      const params = new URLSearchParams({ college: college.trim() })
      const response = await fetch(`/api/jee-mains/college-details?${params}`)
      const result = await response.json()

      if (response.ok) {
        setData(result.data || [])
        setFilters(result.filters || {
          branches: [],
          quotas: [],
          seatTypes: [],
          years: [],
          rounds: []
        })
        setCollegeName(result.college || college)
        setTotalRecords(result.totalRecords || 0)
      } else {
        setError(result.error || 'Failed to fetch college details')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch college details')
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on selections
  const filteredData = data.filter(item => {
    if (selectedYear && item.year !== selectedYear) return false
    if (selectedRound && item.round !== selectedRound) return false
    if (selectedBranch && item.branch !== selectedBranch) return false
    if (selectedQuota && item.quota !== selectedQuota) return false
    if (selectedSeatType && item.seatType !== selectedSeatType) return false
    return true
  })

  // Group data by year and round for better visualization
  const groupedData = filteredData.reduce((acc, item) => {
    const key = `${item.year}-${item.round}`
    if (!acc[key]) {
      acc[key] = {
        year: item.year,
        round: item.roundName,
        items: []
      }
    }
    acc[key].items.push(item)
    return acc
  }, {} as Record<string, { year: string; round: string; items: CollegeData[] }>)

  const groupedArray = Object.values(groupedData).sort((a, b) => {
    if (a.year !== b.year) return b.year.localeCompare(a.year)
    return a.round.localeCompare(b.round)
  })

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
            <Building2 className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                College Details Explorer
              </h1>
              <p className="text-gray-300">
                View all cutoff data for any college across all years and rounds
              </p>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle>Search College</CardTitle>
            <CardDescription>
              Enter a college name to view all available cutoff data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                {loadingColleges ? (
                  <div className="flex items-center justify-center h-12">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search college name..."
                    list="colleges-list-details"
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                )}
                <datalist id="colleges-list-details">
                  {colleges.slice(0, 300).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !college.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {collegeName && (
          <>
            {/* College Info Card */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30 mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{collegeName}</CardTitle>
                    <CardDescription className="text-gray-300">
                      Complete cutoff data across all years and rounds
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-400">{totalRecords}</div>
                    <div className="text-sm text-gray-400">Total Records</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Branches</div>
                    <div className="text-xl font-bold">{filters.branches.length}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Quotas</div>
                    <div className="text-xl font-bold">{filters.quotas.length}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Seat Types</div>
                    <div className="text-xl font-bold">{filters.seatTypes.length}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Years</div>
                    <div className="text-xl font-bold">{filters.years.length}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Rounds</div>
                    <div className="text-xl font-bold">{filters.rounds.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="bg-black/20 border-white/5 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">All Years</option>
                      {filters.years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Round</label>
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">All Rounds</option>
                      {filters.rounds.map(r => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1).replace('round', 'Round ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">All Branches</option>
                      {filters.branches.map(b => (
                        <option key={b} value={b}>{b.length > 40 ? `${b.substring(0, 40)}...` : b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quota</label>
                    <select
                      value={selectedQuota}
                      onChange={(e) => setSelectedQuota(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">All Quotas</option>
                      {filters.quotas.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Seat Type</label>
                    <select
                      value={selectedSeatType}
                      onChange={(e) => setSelectedSeatType(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">All Seat Types</option>
                      {filters.seatTypes.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(selectedYear || selectedRound || selectedBranch || selectedQuota || selectedSeatType) && (
                  <button
                    onClick={() => {
                      setSelectedYear('')
                      setSelectedRound('')
                      setSelectedBranch('')
                      setSelectedQuota('')
                      setSelectedSeatType('')
                    }}
                    className="mt-4 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Data Display */}
            {filteredData.length > 0 ? (
              <div className="space-y-6">
                {groupedArray.map((group, idx) => (
                  <Card key={idx} className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {group.year} - {group.round}
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({group.items.length} records)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Branch</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Quota</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Seat Type</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Opening Rank</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Closing Rank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item, itemIdx) => (
                              <tr key={itemIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-sm">{item.branch}</td>
                                <td className="px-4 py-3 text-sm">{item.quota}</td>
                                <td className="px-4 py-3 text-sm">{item.seatType}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{item.openingRank.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{item.closingRank.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/20 border-white/5">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400">No data found for the selected filters.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

