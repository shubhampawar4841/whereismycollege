"use client"

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface JeeMainsRound {
  id: string
  name: string
  year: string
  round: string
  roundName: string
  hasData: boolean
}

export default function JeeMainsYearPage() {
  const params = useParams()
  const year = params?.year as string
  const [rounds, setRounds] = useState<JeeMainsRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRounds()
  }, [year])

  const fetchRounds = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/jee-mains/list')
      if (response.ok) {
        const data = await response.json()
        // Filter rounds for this year that have data
        const yearRounds = (data.exams || []).filter((exam: any) => exam.year === year && exam.hasData)
        setRounds(yearRounds)
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const roundColors = [
    { color: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', gradient: 'from-blue-600 to-cyan-600' },
    { color: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/30', gradient: 'from-purple-600 to-pink-600' },
    { color: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/30', gradient: 'from-green-600 to-emerald-600' },
    { color: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/30', gradient: 'from-orange-600 to-red-600' },
    { color: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/30', gradient: 'from-yellow-600 to-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/categories/jee-mains"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to JEE Mains</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">🎓</div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                JEE Mains {year}
              </h1>
              <p className="text-gray-300">
                Select a round to view cutoff data
              </p>
            </div>
          </div>
        </div>

        {/* Rounds Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : rounds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rounds.map((round, index) => {
                const roundColor = roundColors[index % roundColors.length]
                return (
                  <Link key={round.id} href={`/exams/${round.id}`}>
                    <Card className={`bg-gradient-to-br ${roundColor.color} ${roundColor.border} hover:${roundColor.border.replace('/30', '/50')} transition-all duration-300 hover:scale-105 cursor-pointer group h-full ${round.hasData ? 'border-green-500/30' : ''}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                              {round.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-sm mt-1">
                              JEE Mains {round.roundName} {round.year}
                            </CardDescription>
                          </div>
                          {round.hasData && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded border border-green-500/30">
                              Available
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4 text-sm">Cutoff data for {round.year}</p>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${roundColor.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                            <span>{round.hasData ? 'View Cutoff Data' : 'No Data'}</span>
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-gray-500">jee_mains_format</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            
            {/* Show count */}
            {rounds.length > 0 && (
              <div className="mt-6 text-sm text-gray-400">
                Showing {rounds.length} round{rounds.length !== 1 ? 's' : ''} for {year}
              </div>
            )}
          </>
        ) : (
          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/30">
            <CardContent className="py-20 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No rounds available for {year}.</p>
              <p className="text-gray-500 text-sm mb-4">Add CSV files to jeemains{year} folder.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

