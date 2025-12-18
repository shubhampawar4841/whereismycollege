"use client"

import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function MhetCetTrendsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="text-4xl sm:text-6xl">📊</div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                MHT CET Trend Analyzers
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Choose an analyzer to view cutoff trends
              </p>
            </div>
          </div>
        </div>

        {/* Analyzer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Year-over-Year Trend Analyzer */}
          <Link href="/mhet-cet-trends/year-trends">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl">📊</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                      Year-over-Year Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                      Analyze trends across years (2020-2024)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-xs sm:text-sm">
                  View cutoff trends by year for a specific round
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Analyzer</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Round-over-Round Trend Analyzer */}
          <Link href="/mhet-cet-trends/round-trends">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl">📈</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                      Round-over-Round Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                      Analyze trends across rounds (Round 1-3)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-xs sm:text-sm">
                  View cutoff trends by round for a specific year
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Analyzer</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

