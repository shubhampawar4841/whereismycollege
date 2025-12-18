"use client"

import { useState, useEffect } from 'react'
import { ArrowLeft, MessageSquare, Sparkles, Loader2, GraduationCap, BookOpen, TrendingUp, Target, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getCategoryDisplayName } from '@/lib/category-normalizer'

interface Recommendation {
  college: string
  course: string
  category: string
  cutoffPercentile: number
  reason: string
}

interface AIResponse {
  recommendations: Recommendation[]
  safetyOptions: Recommendation[]
  reachOptions: Recommendation[]
  categoryAdvice: string
  courseSuggestions: string[]
  generalAdvice: string
}

// Helper function to format percentile
const formatPercentile = (value: any): string => {
  if (value === null || value === undefined) return '0.00'
  const num = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

export default function RecommendPage() {
  const params = useParams()
  const examId = params?.examId as string
  
  const [percentile, setPercentile] = useState('')
  const [marks, setMarks] = useState('')
  const [courseName, setCourseName] = useState('')
  const [category, setCategory] = useState('')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [error, setError] = useState('')

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!percentile && !marks) {
      setError('Please enter either percentile or marks')
      return
    }
    
    setLoading(true)
    setError('')
    setResponse(null)
    
    try {
      const res = await fetch('/api/cutoff/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examId,
          percentile: percentile ? parseFloat(percentile) : undefined,
          marks: marks ? parseFloat(marks) : undefined,
          courseName: courseName.trim() || undefined,
          category: category || undefined,
          question: question.trim() || undefined
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setResponse(data.recommendations)
      } else {
        setError(data.error || 'Failed to get recommendations')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/exams/${examId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cutoff Data</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                AI Recommendations
              </h1>
              <p className="text-gray-300">Get personalized college and course recommendations based on your marks</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enter Your Details
            </CardTitle>
            <CardDescription>
              Provide your marks/percentile and preferences to get AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGetRecommendations} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Percentile */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Percentile
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentile}
                    onChange={(e) => setPercentile(e.target.value)}
                    placeholder="e.g., 85.5"
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Marks (Alternative) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Marks (Alternative)
                  </label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="e.g., 150"
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">If percentile not available</p>
                </div>
              </div>

              {/* Course Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Desired Course/Branch (Optional)
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g., Computer Engineering, MBA, MCA"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., OPEN, OBC, SC, ST, NT, EWS"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter category name (OPEN, OBC, SC, ST, NT, VJ, DT, SEBC, EWS, TFWS, PWD) - not the technical code
                </p>
              </div>

              {/* Custom Question */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Any Specific Question? (Optional)
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which colleges are best for Computer Engineering? What are my chances?"
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!percentile && !marks)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Getting Recommendations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Get AI Recommendations</span>
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {response && (
          <div className="space-y-6">
            {/* Top Recommendations */}
            {response.recommendations && response.recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>
                    Best colleges and courses you can get into
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {response.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-black/30 rounded-lg border border-white/5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold text-white">{rec.college}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-pink-400" />
                            <span className="text-gray-300">{rec.course}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm mb-2">
                            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
                              {rec.category}
                            </span>
                            <span className="text-gray-400">
                              Cutoff: {formatPercentile(rec.cutoffPercentile)}%
                            </span>
                          </div>
                          {rec.reason && (
                            <p className="text-sm text-gray-400 mt-2">{rec.reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Safety Options */}
            {response.safetyOptions && response.safetyOptions.length > 0 && (
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    Safety Options
                  </CardTitle>
                  <CardDescription>
                    Colleges where your percentile is well above cutoff (safe bets)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {response.safetyOptions.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-black/30 rounded-lg border border-white/5">
                      <div className="font-medium text-white">{rec.college}</div>
                      <div className="text-sm text-gray-400">{rec.course} - {rec.category}</div>
                      <div className="text-xs text-gray-500 mt-1">Cutoff: {formatPercentile(rec.cutoffPercentile)}%</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reach Options */}
            {response.reachOptions && response.reachOptions.length > 0 && (
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Reach Options
                  </CardTitle>
                  <CardDescription>
                    Colleges where your percentile is close to cutoff (can try)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {response.reachOptions.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-black/30 rounded-lg border border-white/5">
                      <div className="font-medium text-white">{rec.college}</div>
                      <div className="text-sm text-gray-400">{rec.course} - {rec.category}</div>
                      <div className="text-xs text-gray-500 mt-1">Cutoff: {formatPercentile(rec.cutoffPercentile)}%</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Category Advice */}
            {response.categoryAdvice && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/30">
                <CardHeader>
                  <CardTitle>Category Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{response.categoryAdvice}</p>
                </CardContent>
              </Card>
            )}

            {/* Course Suggestions */}
            {response.courseSuggestions && response.courseSuggestions.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle>Course Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {response.courseSuggestions.map((course, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                        {course}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General Advice */}
            {response.generalAdvice && (
              <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-500/30">
                <CardHeader>
                  <CardTitle>General Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap">{response.generalAdvice}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

