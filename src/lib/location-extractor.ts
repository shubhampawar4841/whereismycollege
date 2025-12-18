/**
 * Location Extraction Utility
 * Extracts city/village names from college names for location-based search
 */

/**
 * Common Maharashtra cities and their variations
 */
const MAHARASHTRA_CITIES = [
  'Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik', 'Solapur', 'Amravati', 'Kolhapur',
  'Sangli', 'Nanded', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Chandrapur', 'Parbhani',
  'Ichalkaranji', 'Jalna', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Kamptee',
  'Gondia', 'Barshi', 'Achalpur', 'Osmanabad', 'Nandurbar', 'Wardha', 'Udgir', 'Hinganghat',
  'Washim', 'Dharashiv', 'Ratnagiri', 'Sindhudurg', 'Raigad', 'Thane', 'Palghar', 'Dhule',
  'Nandurbar', 'Buldhana', 'Jalgaon', 'Bhandara', 'Gadchiroli', 'Gondia', 'Chandrapur',
  'Yavatmal', 'Washim', 'Akola', 'Amravati', 'Buldhana', 'Jalgaon', 'Dhule', 'Nandurbar',
  'Nashik', 'Ahmednagar', 'Pune', 'Satara', 'Sangli', 'Solapur', 'Kolhapur', 'Ratnagiri',
  'Sindhudurg', 'Raigad', 'Thane', 'Palghar', 'Mumbai', 'Aurangabad', 'Jalna', 'Parbhani',
  'Hingoli', 'Nanded', 'Latur', 'Osmanabad', 'Beed', 'Chandrapur', 'Gadchiroli', 'Gondia',
  'Bhandara', 'Nagpur', 'Wardha', 'Yavatmal', 'Washim', 'Akola', 'Amravati', 'Buldhana'
]

/**
 * Extract location (city/village) from college name
 * Examples:
 * - "Government College of Engineering, Amravati" -> "Amravati"
 * - "Sant Gadge Baba Amravati University,Amravati" -> "Amravati"
 * - "College Name, Yavatmal" -> "Yavatmal"
 */
export function extractLocation(collegeName: string): string | null {
  if (!collegeName) return null
  
  // Split by comma - location is usually after the last comma
  const parts = collegeName.split(',').map(p => p.trim())
  
  // Check if last part is a city name
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1]
    
    // Check if it matches known cities
    const cityMatch = MAHARASHTRA_CITIES.find(city => 
      lastPart.toLowerCase() === city.toLowerCase() ||
      lastPart.toLowerCase().includes(city.toLowerCase()) ||
      city.toLowerCase().includes(lastPart.toLowerCase())
    )
    
    if (cityMatch) {
      return cityMatch
    }
    
    // If it's a short word (likely a city), return it
    if (lastPart.length > 2 && lastPart.length < 30 && !lastPart.toLowerCase().includes('university')) {
      return lastPart
    }
  }
  
  // Try to find city name anywhere in the college name
  for (const city of MAHARASHTRA_CITIES) {
    if (collegeName.toLowerCase().includes(city.toLowerCase())) {
      return city
    }
  }
  
  return null
}

/**
 * Extract all locations from a list of college names
 */
export function extractAllLocations(collegeNames: string[]): string[] {
  const locations = new Set<string>()
  
  collegeNames.forEach(name => {
    const location = extractLocation(name)
    if (location) {
      locations.add(location)
    }
  })
  
  return Array.from(locations).sort()
}

/**
 * Check if a search query is a location query
 */
export function isLocationQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim()
  
  // Common location query patterns
  const locationPatterns = [
    /in\s+(\w+)/i,
    /near\s+(\w+)/i,
    /(\w+)\s+area/i,
    /(\w+)\s+college/i,
    /college\s+in\s+(\w+)/i,
    /colleges\s+in\s+(\w+)/i
  ]
  
  // Check patterns
  for (const pattern of locationPatterns) {
    if (pattern.test(query)) {
      return true
    }
  }
  
  // Check if query matches a known city
  const isCity = MAHARASHTRA_CITIES.some(city => 
    lowerQuery === city.toLowerCase() ||
    lowerQuery.includes(city.toLowerCase()) ||
    city.toLowerCase().includes(lowerQuery)
  )
  
  return isCity
}

/**
 * Extract location from a search query
 * Examples:
 * - "colleges in amravati" -> "Amravati"
 * - "amravati area" -> "Amravati"
 * - "i want college in amravati" -> "Amravati"
 */
export function extractLocationFromQuery(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim()
  
  // Try to extract from patterns
  const patterns = [
    /in\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /near\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+area/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+college/i,
    /college\s+in\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /colleges\s+in\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  ]
  
  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match && match[1]) {
      const location = match[1].trim()
      // Check if it's a known city
      const cityMatch = MAHARASHTRA_CITIES.find(city => 
        location.toLowerCase() === city.toLowerCase() ||
        location.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(location.toLowerCase())
      )
      if (cityMatch) {
        return cityMatch
      }
      // Return even if not in known cities (might be a village)
      if (location.length > 2) {
        return location
      }
    }
  }
  
  // Check if entire query is a city name
  const cityMatch = MAHARASHTRA_CITIES.find(city => 
    lowerQuery === city.toLowerCase()
  )
  if (cityMatch) {
    return cityMatch
  }
  
  return null
}

/**
 * Match colleges by location
 */
export function matchCollegesByLocation(colleges: Array<{ name: string }>, locationQuery: string): Array<{ name: string }> {
  const location = extractLocationFromQuery(locationQuery) || locationQuery.toLowerCase()
  const locationLower = location.toLowerCase()
  
  return colleges.filter(college => {
    const collegeLocation = extractLocation(college.name)
    if (collegeLocation) {
      return collegeLocation.toLowerCase().includes(locationLower) ||
             locationLower.includes(collegeLocation.toLowerCase())
    }
    // Fallback: check if location appears in college name
    return college.name.toLowerCase().includes(locationLower)
  })
}


