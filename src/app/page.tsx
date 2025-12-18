"use client"

import { useState, useEffect } from 'react'
import { ArrowRight, Upload, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { examCategories, allExams, type ExamType } from '@/lib/exam-categories'
import { BouncingLoader } from '@/components/bouncing-loader'
import { useMinimumLoading } from '@/hooks/use-minimum-loading'
// import { UserMenu } from '@/components/auth/user-menu'

interface UploadedExam {
  id: string
  name: string
  year: string
  uploadedAt: string
  parsedAt?: string
  hasData: boolean
}

export default function Home() {
  const [uploadedExams, setUploadedExams] = useState<UploadedExam[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const showLoading = useMinimumLoading(loading && isInitialLoad, 3500) // Only show on initial load

  useEffect(() => {
    fetchUploadedExams()
    // Refresh every 3 seconds to check for new uploads
    const interval = setInterval(fetchUploadedExams, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Mark initial load as complete after first load
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false)
    }
  }, [loading, isInitialLoad])

  const fetchUploadedExams = async () => {
    try {
      const response = await fetch('/api/exams/list')
      if (response.ok) {
        const data = await response.json()
        setUploadedExams(data.exams || [])
      }
    } catch (error) {
      console.error('Failed to fetch uploaded exams:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get uploaded exams count per category
  const getUploadedCountForCategory = (categoryId: string) => {
    return uploadedExams.filter(uploaded => {
      const uploadedCategory = (uploaded as any).category
      return uploadedCategory === categoryId
    }).length
  }


  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Exam Cutoff Finder
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              {/* Login Menu - Commented out */}
              {/* <UserMenu /> */}
            </div>
          </div>
          {/* Upload PDF Button - Hidden from public UI */}
          {/* <div className="text-center mb-4">
            <Link
              href="/shubham"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF</span>
            </Link>
          </div> */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto text-center px-4">
            Find cutoff data for various entrance exams organized by categories
          </p>
        </div>

        {/* Loading State */}
        {showLoading && (
          <div className="flex items-center justify-center py-12">
            <BouncingLoader />
          </div>
        )}

        {/* All Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Exam Categories */}
          {examCategories.map((category) => {
            const hasNoData = ['agriculture-education', 'fine-art-education', 'higher-education', 'medical-education'].includes(category.id)
            
            return (
              <div key={category.id}>
                {hasNoData ? (
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-not-allowed group h-full opacity-75">
                    <CardHeader>
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="text-4xl sm:text-5xl">
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                            {category.name}
                          </CardTitle>
                          <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                            <span className="text-yellow-400">Coming Soon</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4 text-xs sm:text-sm italic">
                        This category will be available soon
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Link href={`/categories/${category.id}`}>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
                      <CardHeader>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="text-4xl sm:text-5xl flex-shrink-0">
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                              {category.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                              {category.exams.length} exam{category.exams.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4 text-xs sm:text-sm line-clamp-2">
                          {category.exams.slice(0, 3).map(e => e.name).join(', ')}
                          {category.exams.length > 3 && ` +${category.exams.length - 3} more`}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                          <span>View All Exams</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            )
          })}

          {/* JEE Mains Trend Analyzer Card */}
          <Link href="/jee-mains-trends">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl flex-shrink-0">📊</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                      JEE Mains Cutoff Trend Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                      Analyze trends across years and rounds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-xs sm:text-sm">
                  Year-over-year and round-over-round analysis
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Trend Analyzer</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* MHT CET Trend Analyzer Card */}
          <Link href="/mhet-cet-trends">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl flex-shrink-0">📊</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                      MHT CET Cutoff Trend Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                      Analyze trends across years and rounds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-xs sm:text-sm">
                  Year-over-year and round-over-round analysis
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Trend Analyzer</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* College Details Explorer Card */}
          <Link href="/college-details">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-4xl sm:text-5xl flex-shrink-0">🏛️</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors break-words">
                      College Details Explorer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1">
                      Complete cutoff data for any college
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-xs sm:text-sm">
                  Search and explore all college information
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>Explore Colleges</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400 text-xs sm:text-sm">Total Exam Types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{allExams.length}</div>
              {/* Uploaded exams count - Hidden from public UI */}
              {/* {uploadedExams.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{uploadedExams.length} uploaded</p>
              )} */}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400 text-xs sm:text-sm">Categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{examCategories.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400 text-xs sm:text-sm">Parser Strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {new Set(allExams.map(e => e.parserStrategy)).size}
              </div>
              <p className="text-xs text-gray-500 mt-1">Different formats</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
