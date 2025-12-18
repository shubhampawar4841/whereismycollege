"use client"

import { useState } from 'react'
import { Upload, FileText, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { examCategories } from '@/lib/exam-categories'

export default function ShubhamPage() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [examName, setExamName] = useState('')
  const [year, setYear] = useState('')
  const [round, setRound] = useState('')
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [examId, setExamId] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [debugging, setDebugging] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)

  // Get default parser strategy based on category
  const getDefaultParserStrategy = () => {
    if (!selectedCategory) return 'engineering_format'
    
    const category = examCategories.find(cat => cat.id === selectedCategory)
    if (!category || category.exams.length === 0) return 'engineering_format'
    
    // Get the most common parser strategy for this category
    const strategies = category.exams.map(e => e.parserStrategy)
    const mostCommon = strategies.reduce((a, b, _, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    )
    return mostCommon || 'engineering_format'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Please upload a PDF file')
        setFile(null)
      }
    }
  }

  const generateExamId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a PDF file')
      return
    }
    
    if (!examName.trim()) {
      setError('Please enter an exam name')
      return
    }
    
    if (!year.trim()) {
      setError('Please enter a year')
      return
    }

    // Generate exam ID from name, category, and round
    let finalExamName = examName.trim()
    if (round.trim()) {
      finalExamName = `${finalExamName} ${round.trim()}`
    }
    const generatedExamId = generateExamId(finalExamName)
    const parserStrategy = getDefaultParserStrategy()
    
    setExamId(generatedExamId)
    setError('')
    setSuccess(false)
    setUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('examName', finalExamName)
      formData.append('year', year.trim())
      formData.append('examId', generatedExamId)
      formData.append('category', selectedCategory || '')
      formData.append('parserStrategy', parserStrategy)

      // Upload and parse
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 50 // Upload is 50% of progress
          setUploadProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadProgress(50)
          setUploading(false)
          setParsing(true)
          
          // Start parsing (with analysis step)
          setUploadProgress(60) // Analysis phase
          
          fetch('/api/cutoff/upload-parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              examId: generatedExamId,
              examName: finalExamName,
              year: year.trim(),
              parserStrategy: parserStrategy
            })
          })
          .then(async (response) => {
            const result = await response.json()
            if (response.ok) {
              setUploadProgress(100)
              if (result.warning) {
                // Show warning but still mark as success
                setError(result.warning)
                setSuccess(true) // Still show success so exam appears
              } else {
                setSuccess(true)
                setError('')
              }
              setParsing(false)
            } else {
              setError(result.error || 'Failed to parse PDF')
              setParsing(false)
            }
          })
          .catch((err) => {
            setError(err.message || 'Failed to parse PDF')
            setParsing(false)
          })
        } else {
          const result = JSON.parse(xhr.responseText)
          setError(result.error || 'Failed to upload PDF')
          setUploading(false)
        }
      })

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.')
        setUploading(false)
      })

      xhr.open('POST', '/api/cutoff/upload')
      xhr.send(formData)

    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setUploading(false)
    }
  }

  const handleDebugPDF = async () => {
    if (!file || !examName.trim() || !year.trim()) {
      setError('Please upload a PDF and enter exam details first')
      return
    }

    let finalExamName = examName.trim()
    if (round.trim()) {
      finalExamName = `${finalExamName} ${round.trim()}`
    }
    const generatedExamId = generateExamId(finalExamName)
    setDebugging(true)
    setError('')
    setDebugResult(null)

    try {
      // First upload the file
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('examName', finalExamName)
      formData.append('year', year.trim())
      formData.append('examId', generatedExamId)

      const uploadResponse = await fetch('/api/cutoff/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF')
      }

          // Then debug it
          const debugResponse = await fetch('/api/cutoff/debug-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              examId: generatedExamId,
              year: year.trim(),
              examName: finalExamName,
              category: selectedCategory || undefined
            })
          })

      const result = await debugResponse.json()
      
      if (debugResponse.ok) {
        setDebugResult(result)
      } else {
        setError(result.error || 'Failed to debug PDF')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to debug PDF')
    } finally {
      setDebugging(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Exams</span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Upload Exam Cutoff PDF
          </h1>
          <p className="text-gray-300">Upload a PDF file to parse and view cutoff data</p>
        </div>

        {/* Upload Form */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload & Parse PDF
            </CardTitle>
            <CardDescription>
              Select a PDF file, enter exam details, and we'll parse it for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PDF File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading || parsing}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      file
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/20 hover:border-purple-500/50 bg-white/5'
                    } ${uploading || parsing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-8 h-8 text-purple-400 mb-2" />
                        <span className="text-sm text-gray-300">{file.name}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-300">Click to upload PDF</span>
                        <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={uploading || parsing}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Category (Optional)</option>
                  {examCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <p className="text-xs text-gray-500 mt-1">
                    Parser: {getDefaultParserStrategy()}
                  </p>
                )}
              </div>

              {/* Exam Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam Name
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g., MBA/MMS Cap MH, MHT CET, MCA Cap MH"
                  disabled={uploading || parsing}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the exam name as you want it to appear
                </p>
              </div>

              {/* Round (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Round (Optional)
                </label>
                <input
                  type="text"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder="e.g., Round 1, Round 2, CAP Round 1"
                  disabled={uploading || parsing}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For multiple CAP rounds, specify the round here
                </p>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2024, 2023"
                  disabled={uploading || parsing}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  required
                />
              </div>

              {/* Progress Bar */}
              {(uploading || parsing) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {uploading ? 'Uploading...' : uploadProgress < 70 ? 'Analyzing PDF structure...' : 'Parsing PDF...'}
                    </span>
                    <span className="text-gray-400">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-green-400 text-sm block mb-2">
                      PDF parsed successfully! Data is ready to view.
                    </span>
                    {examId && (
                      <Link
                        href={`/exams/${examId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium"
                      >
                        View Cutoff Data
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Debug Button */}
              <button
                type="button"
                onClick={handleDebugPDF}
                disabled={debugging || uploading || parsing || !file || !examName.trim() || !year.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {debugging ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing PDF Structure...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Debug PDF Structure</span>
                  </>
                )}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || parsing || !file || !examName.trim() || !year.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : parsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Parsing PDF...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload & Parse</span>
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Debug Results */}
        {debugResult && (
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/30 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF Structure Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Format Type:</span>
                  <p className="text-white font-medium">{debugResult.analysis?.format_type || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Parsing Strategy:</span>
                  <p className="text-white font-medium">{debugResult.analysis?.parsing_strategy || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Confidence:</span>
                  <p className="text-white font-medium">{debugResult.analysis?.confidence || 'N/A'}%</p>
                </div>
                <div>
                  <span className="text-gray-400">Pages:</span>
                  <p className="text-white font-medium">{debugResult.pageCount}</p>
                </div>
              </div>

              {debugResult.analysis?.data_fields_to_extract && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Fields to Extract:</h4>
                  <div className="space-y-2">
                    {debugResult.analysis.data_fields_to_extract.map((field: any, idx: number) => (
                      <div key={idx} className="p-2 bg-black/30 rounded text-xs">
                        <div className="font-medium text-purple-300">{field.field_name}</div>
                        <div className="text-gray-400">{field.description}</div>
                        <div className="text-gray-500 mt-1">Location: {field.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugResult.analysis?.parsing_instructions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Parsing Instructions:</h4>
                  <div className="p-3 bg-black/30 rounded text-xs text-gray-300 whitespace-pre-wrap">
                    {typeof debugResult.analysis.parsing_instructions === 'string' 
                      ? debugResult.analysis.parsing_instructions
                      : JSON.stringify(debugResult.analysis.parsing_instructions, null, 2)}
                  </div>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                  View Full Analysis JSON
                </summary>
                <pre className="mt-2 p-3 bg-black/50 rounded overflow-auto max-h-96 text-xs">
                  {JSON.stringify(debugResult.analysis, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-300">
            <p>• Upload a PDF file containing cutoff data</p>
            <p>• Select category (optional - helps determine parser strategy)</p>
            <p>• Enter the exam name manually (e.g., "MBA/MMS Cap MH", "MHT CET")</p>
            <p>• Enter round if applicable (e.g., "Round 1", "CAP Round 1")</p>
            <p>• Enter the year</p>
            <p>• Click "Debug PDF Structure" to analyze what needs to be scraped</p>
            <p>• Click "Upload & Parse" to parse and extract the data</p>
            <p>• Once parsed, you can view the data in the cutoff viewer</p>
            <p className="text-purple-400 mt-2">💡 Tip: For multiple CAP rounds, upload each round separately with different round numbers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

