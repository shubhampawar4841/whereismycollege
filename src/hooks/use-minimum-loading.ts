import { useState, useEffect, useRef } from 'react'

/**
 * Hook to ensure loading state shows for a minimum duration
 * @param isLoading - Current loading state
 * @param minDuration - Minimum duration in milliseconds (default: 3000ms)
 * @returns Boolean indicating if loading should still be shown
 */
export function useMinimumLoading(isLoading: boolean, minDuration: number = 3000) {
  const [showLoading, setShowLoading] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (isLoading) {
      // Start loading
      startTimeRef.current = Date.now()
      setShowLoading(true)
    } else if (startTimeRef.current !== null) {
      // Calculate elapsed time
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, minDuration - elapsed)

      if (remaining > 0) {
        // Wait for remaining time before hiding
        const timer = setTimeout(() => {
          setShowLoading(false)
          startTimeRef.current = null
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        // Already past minimum duration, hide immediately
        setShowLoading(false)
        startTimeRef.current = null
      }
    }
  }, [isLoading, minDuration])

  return showLoading
}

