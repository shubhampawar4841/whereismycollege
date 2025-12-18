"use client"

import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function JeeMainsTrendsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">📊</div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                JEE Mains Trend Analyzers
              </h1>
              <p className="text-gray-300">
                Choose an analyzer to view cutoff trends
              </p>
            </div>
          </div>
        </div>

        {/* Analyzer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Year-over-Year Analyzer */}
          <Link href="/jee-mains-trends/year-trends">
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">📊</div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">
                      Year-over-Year Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm mt-1">
                      Analyze trends across years (2020-2024)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-sm">
                  View how cutoff ranks change across multiple years for a specific round. Perfect for understanding long-term trends.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Analyzer</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Round-over-Round Analyzer */}
          <Link href="/jee-mains-trends/round-trends">
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">📈</div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      Round-over-Round Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm mt-1">
                      Analyze trends across rounds (Round 1-5)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-sm">
                  View how cutoff ranks change across all rounds for a specific year. See the progression within a single admission cycle.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Analyzer</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
