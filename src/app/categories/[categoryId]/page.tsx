"use client"

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { examCategories, getExamsByCategory, type ExamType } from '@/lib/exam-categories'

interface UploadedExam {
  id: string
  name: string
  year: string
  uploadedAt: string
  parsedAt?: string
  hasData: boolean
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params?.categoryId as string
  
  // Handle JEE Mains separately - show years as cards
  const [jeeMainsYears, setJeeMainsYears] = useState<string[]>([])
  const [jeeMainsLoading, setJeeMainsLoading] = useState(false)
  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedRound, setSelectedRound] = useState('round1')

  useEffect(() => {
    if (categoryId === 'jee-mains') {
      fetchJeeMainsYears()
    }
  }, [categoryId])

  const fetchJeeMainsYears = async () => {
    setJeeMainsLoading(true)
    try {
      const response = await fetch('/api/jee-mains/list')
      if (response.ok) {
        const data = await response.json()
        // Get unique years that have at least one exam with data
        const examsWithData = (data.exams || []).filter((exam: any) => exam.hasData)
        const yearSet = new Set<string>()
        examsWithData.forEach((exam: any) => {
          if (exam.year) yearSet.add(exam.year)
        })
        const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a))
        setJeeMainsYears(years)
      }
    } catch (error) {
      console.error('Failed to fetch JEE Mains years:', error)
    } finally {
      setJeeMainsLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!csvFile) {
      setUploadError('Please select a CSV file')
      return
    }

    if (!selectedYear || !selectedRound) {
      setUploadError('Please select year and round')
      return
    }

    setUploadingCsv(true)
    setUploadError('')
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('year', selectedYear)
      formData.append('round', selectedRound)

      const response = await fetch('/api/jee-mains/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadSuccess(true)
        setCsvFile(null)
        // Refresh the years list
        await fetchJeeMainsYears()
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadSuccess(false)
        }, 3000)
      } else {
        setUploadError(result.error || 'Failed to upload CSV')
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload CSV')
    } finally {
      setUploadingCsv(false)
    }
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.csv')) {
        setCsvFile(file)
        setUploadError('')
      } else {
        setUploadError('Please select a CSV file')
        setCsvFile(null)
      }
    }
  }
  
  const category = examCategories.find(cat => cat.id === categoryId)
  const exams = category ? getExamsByCategory(categoryId) : []
  
  const [uploadedExams, setUploadedExams] = useState<UploadedExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (categoryId !== 'jee-mains') {
      fetchUploadedExams()
      // Refresh every 3 seconds to check for new uploads
      const interval = setInterval(fetchUploadedExams, 3000)
      return () => clearInterval(interval)
    }
  }, [categoryId]) // Re-fetch when category changes

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

  // Get uploaded exams that match this category
  const uploadedExamsInCategory = uploadedExams.filter(uploaded => {
    // If uploaded exam has category metadata, match it
    if ((uploaded as any).category === categoryId) {
      return true
    }
    return false
  })

  // Convert uploaded exams to display format (only show uploaded ones)
  const allExamsWithStatus: (ExamType & { isUploaded?: boolean; hasData?: boolean; year?: string })[] = uploadedExamsInCategory.map(uploaded => {
    // Check if this uploaded exam matches a predefined exam
    const matchingPredefined = exams.find(exam => exam.id === uploaded.id)
    
    if (matchingPredefined) {
      // Use predefined exam details but with uploaded status
      return {
        ...matchingPredefined,
        isUploaded: true,
        hasData: uploaded.hasData,
        year: uploaded.year
      }
    } else {
      // Create a new exam entry for uploaded exam not in predefined list
      return {
        id: uploaded.id,
        name: uploaded.name,
        fullName: `${uploaded.name} ${uploaded.year}`,
        category: categoryId,
        parserStrategy: (uploaded as any).parserStrategy || 'engineering_format',
        description: `Cutoff data for ${uploaded.year}`,
        isUploaded: true,
        hasData: uploaded.hasData,
        year: uploaded.year
      }
    }
  })

  // Handle JEE Mains category - show years as cards
  if (categoryId === 'jee-mains') {
    const jeeMainsCategory = examCategories.find(cat => cat.id === 'jee-mains')
    if (!jeeMainsCategory) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              Go back to homepage
            </Link>
          </div>
        </div>
      )
    }

    const yearColors = [
      { color: 'from-orange-500/10 to-yellow-500/10', border: 'border-orange-500/30', gradient: 'from-orange-600 to-yellow-600' },
      { color: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/30', gradient: 'from-purple-600 to-pink-600' },
      { color: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', gradient: 'from-blue-600 to-cyan-600' },
      { color: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/30', gradient: 'from-green-600 to-emerald-600' },
      { color: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/30', gradient: 'from-red-600 to-rose-600' }
    ]

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
              <span>Back to Categories</span>
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🎓</div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {jeeMainsCategory.name}
                </h1>
                <p className="text-gray-300">
                  Select a year to view rounds
                </p>
              </div>
            </div>
          </div>

          {/* CSV Upload Section */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/30 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload JEE Mains CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file for a specific year and round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Year Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={uploadingCsv}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                      required
                    >
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                    </select>
                  </div>

                  {/* Round Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Round</label>
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      disabled={uploadingCsv}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                      required
                    >
                      <option value="round1">Round 1</option>
                      <option value="round2">Round 2</option>
                      <option value="round3">Round 3</option>
                      <option value="round4">Round 4</option>
                      <option value="round5">Round 5</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      disabled={uploadingCsv}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700 disabled:opacity-50"
                      required
                    />
                    {csvFile && (
                      <p className="text-xs text-gray-400 mt-1">{csvFile.name}</p>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{uploadError}</span>
                  </div>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm">CSV uploaded successfully! Refreshing...</span>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="submit"
                  disabled={uploadingCsv || !csvFile}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploadingCsv ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload CSV</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* JEE Mains Years Grid */}
          {jeeMainsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : jeeMainsYears.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jeeMainsYears.map((year, index) => {
                  const yearColor = yearColors[index % yearColors.length]
                  return (
                    <Link key={year} href={`/categories/jee-mains/${year}`}>
                      <Card className={`bg-gradient-to-br ${yearColor.color} ${yearColor.border} hover:${yearColor.border.replace('/30', '/50')} transition-all duration-300 hover:scale-105 cursor-pointer group h-full`}>
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <CardTitle className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors">
                                JEE Mains {year}
                              </CardTitle>
                              <CardDescription className="text-gray-400 text-sm mt-1">
                                View all rounds for {year}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300 mb-4 text-sm">Cutoff data for {year}</p>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${yearColor.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                              <span>View Rounds</span>
                              <FileText className="w-4 h-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              
              {/* Show count */}
              {jeeMainsYears.length > 0 && (
                <div className="mt-6 text-sm text-gray-400">
                  Showing {jeeMainsYears.length} year{jeeMainsYears.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          ) : (
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/30">
              <CardContent className="py-20 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">No JEE Mains data available yet.</p>
                <p className="text-gray-500 text-sm mb-4">Add CSV files to jeemains2024, jeemains2023, or jeemains2022 folders.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Go back to homepage
          </Link>
        </div>
      </div>
    )
  }

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
            <span>Back to Categories</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{category.icon}</div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {category.name}
              </h1>
              <p className="text-gray-300">
                {allExamsWithStatus.length} uploaded exam{allExamsWithStatus.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {allExamsWithStatus.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allExamsWithStatus.map((exam) => (
                <Link key={exam.id} href={`/exams/${exam.id}`}>
                  <Card className={`bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group h-full ${exam.isUploaded ? 'border-green-500/30' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            {exam.name}
                            {exam.year && <span className="text-lg text-gray-400 ml-2">({exam.year})</span>}
                          </CardTitle>
                          <CardDescription className="text-gray-400 text-sm mt-1">
                            {exam.fullName}
                          </CardDescription>
                        </div>
                        {exam.isUploaded && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded border border-green-500/30">
                            Uploaded
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4 text-sm">{exam.description}</p>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                          <span>{exam.hasData === false ? 'Parsing...' : 'View Cutoff Data'}</span>
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-gray-500">{exam.parserStrategy}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Show count */}
            {allExamsWithStatus.length > 0 && (
              <div className="mt-6 text-sm text-gray-400">
                Showing {allExamsWithStatus.length} uploaded exam{allExamsWithStatus.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardContent className="py-20 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No uploaded exams in this category yet.</p>
              <p className="text-gray-500 text-sm mb-4">Upload a PDF to see it here.</p>
              <Link
                href="/shubham"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span>Upload PDF</span>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

