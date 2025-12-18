"use client"

import { useState } from 'react'
import { Upload, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function JeeMainsUploadPage() {
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedRound, setSelectedRound] = useState('round1')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file')
        return
      }
      setCsvFile(file)
      setUploadError('')
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!csvFile) {
      setUploadError('Please select a CSV file')
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
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadSuccess(true)
        setCsvFile(null)
        // Reset file input
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Refresh after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setUploadError(result.error || 'Failed to upload CSV')
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload CSV')
    } finally {
      setUploadingCsv(false)
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
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <Upload className="w-8 h-8 text-orange-400" />
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                JEE Mains CSV Upload
              </h1>
              <p className="text-gray-300">
                Upload CSV files for JEE Mains cutoff data
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-600/10 border-orange-500/30">
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
                    id="csv-file-input"
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
      </div>
    </div>
  )
}

