"use client"

import { useState, useEffect } from 'react'
import { ArrowRight, Upload, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { examCategories, allExams, type ExamType } from '@/lib/exam-categories'
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

  useEffect(() => {
    fetchUploadedExams()
    // Refresh every 3 seconds to check for new uploads
    const interval = setInterval(fetchUploadedExams, 3000)
    return () => clearInterval(interval)
  }, [])

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
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
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
          <p className="text-xl text-gray-300 max-w-2xl mx-auto text-center">
            Find cutoff data for various entrance exams organized by categories
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {examCategories
            .filter(category => 
              // Filter out categories without data
              !['agriculture-education', 'fine-art-education', 'higher-education', 'medical-education'].includes(category.id)
            )
            .map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card className={`bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full`}>
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`text-5xl ${category.icon}`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm mt-1">
                        {category.exams.length} exam{category.exams.length !== 1 ? 's' : ''}
                        {/* Uploaded count - Hidden from public UI */}
                        {/* {getUploadedCountForCategory(category.id) > 0 && (
                          <span className="text-green-400 ml-2">
                            +{getUploadedCountForCategory(category.id)} uploaded
                          </span>
                        )} */}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4 text-sm">
                    {category.exams.slice(0, 3).map(e => e.name).join(', ')}
                    {category.exams.length > 3 && ` +${category.exams.length - 3} more`}
                  </p>
                  <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                    <span>View All Exams</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* JEE Mains Trend Analyzer Card */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/jee-mains-trends">
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">📊</div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">
                      JEE Mains Cutoff Trend Analyzer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm mt-1">
                      Analyze trends across years and rounds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-sm">
                  Year-over-year and round-over-round analysis
                </p>
                <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>View Trend Analyzer</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* College Details Explorer Card */}
          <Link href="/college-details">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">🏛️</div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      College Details Explorer
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm mt-1">
                      Complete cutoff data for any college
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 text-sm">
                  Search and explore all college information
                </p>
                <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent group-hover:gap-3 transition-all">
                  <span>Explore Colleges</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Total Exam Types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allExams.length}</div>
              {/* Uploaded exams count - Hidden from public UI */}
              {/* {uploadedExams.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{uploadedExams.length} uploaded</p>
              )} */}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{examCategories.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Parser Strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
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
