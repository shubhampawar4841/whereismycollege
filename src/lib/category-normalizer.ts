/**
 * Category Code Normalization Utility
 * Converts complex category codes (like GOPENH, GOBCS) to readable names (like OPEN, OBC)
 */

export interface CategoryInfo {
  normalizedName: string
  fullName: string
  description: string
  type: 'general' | 'local' | 'special' | 'reserved'
}

/**
 * Normalizes category codes to readable names
 * Examples:
 * - GOPENH -> OPEN (General Open Home)
 * - GOBCS -> OBC (General OBC State)
 * - GSCH -> SC (General SC Home)
 * - LOPENO -> OPEN (Local Open Other)
 */
export function normalizeCategory(categoryCode: string): CategoryInfo {
  if (!categoryCode) {
    return {
      normalizedName: 'Unknown',
      fullName: 'Unknown Category',
      description: 'Unknown category',
      type: 'special'
    }
  }

  const code = categoryCode.toUpperCase().trim()
  
  // Special categories that don't need normalization
  if (code === 'EWS') {
    return {
      normalizedName: 'EWS',
      fullName: 'Economically Weaker Section',
      description: 'Economically Weaker Section - 10% reservation',
      type: 'special'
    }
  }
  
  if (code === 'TFWS') {
    return {
      normalizedName: 'TFWS',
      fullName: 'Tuition Fee Waiver Scheme',
      description: 'Tuition Fee Waiver Scheme - for economically backward students',
      type: 'special'
    }
  }
  
  if (code === 'PWD' || code.startsWith('PWD')) {
    return {
      normalizedName: 'PWD',
      fullName: 'Persons with Disabilities',
      description: 'Reservation for Persons with Disabilities',
      type: 'special'
    }
  }
  
  if (code === 'ORPHAN') {
    return {
      normalizedName: 'ORPHAN',
      fullName: 'Orphan',
      description: 'Reservation for orphan students',
      type: 'special'
    }
  }
  
  if (code === 'DEF' || code.startsWith('DEF')) {
    return {
      normalizedName: 'DEF',
      fullName: 'Defense',
      description: 'Defense category reservation',
      type: 'special'
    }
  }
  
  if (code === 'CAP' || code === 'III') {
    return {
      normalizedName: code,
      fullName: code,
      description: `Category code: ${code}`,
      type: 'special'
    }
  }

  // Extract category type (G = General, L = Local)
  const isGeneral = code.startsWith('G')
  const isLocal = code.startsWith('L')
  
  // Extract base category
  let baseCategory = ''
  let suffix = ''
  
  // Common patterns:
  // GOPENH, GOPENO, GOPENS -> OPEN
  // GOBCS, GOBCH, GOBC -> OBC
  // GSCH, GSCS, GSC -> SC
  // GSTH, GSTS, GST -> ST
  // GNTBH, GNTDH, GNT -> NT
  // GVJH, GVJ -> VJ
  // GSEBCH, GSEBCO, GSEBC -> SEBC
  // LOPENH, LOPENO, LOPENS -> OPEN
  // etc.
  
  // Handle NT variants (NT-A, NT-B, NT-C, NT-D)
  if (code.includes('NT')) {
    if (code.includes('NTB') || code.includes('NT-B')) {
      baseCategory = 'NT-B'
    } else if (code.includes('NTD') || code.includes('NT-D')) {
      baseCategory = 'NT-D'
    } else if (code.includes('NTA') || code.includes('NT-A')) {
      baseCategory = 'NT-A'
    } else if (code.includes('NTC') || code.includes('NT-C')) {
      baseCategory = 'NT-C'
    } else {
      baseCategory = 'NT'
    }
    suffix = code.replace(/^[GL]?NT[ABCD-]?/i, '').replace(/NT[ABCD-]?/i, '')
  } else if (code.includes('OPEN')) {
    baseCategory = 'OPEN'
    suffix = code.replace(/^[GL]?OPEN/i, '').replace(/OPEN/i, '')
  } else if (code.includes('OBC')) {
    baseCategory = 'OBC'
    suffix = code.replace(/^[GL]?OBC/i, '').replace(/OBC/i, '')
  } else if (code.includes('SC')) {
    baseCategory = 'SC'
    suffix = code.replace(/^[GL]?SC/i, '').replace(/SC/i, '')
  } else if (code.includes('ST')) {
    baseCategory = 'ST'
    suffix = code.replace(/^[GL]?ST/i, '').replace(/ST/i, '')
  } else if (code.includes('VJ')) {
    baseCategory = 'VJ'
    suffix = code.replace(/^[GL]?VJ/i, '').replace(/VJ/i, '')
  } else if (code.includes('DT')) {
    baseCategory = 'DT'
    suffix = code.replace(/^[GL]?DT/i, '').replace(/DT/i, '')
  } else if (code.includes('SBC') || code.includes('SEBC')) {
    baseCategory = 'SEBC'
    suffix = code.replace(/^[GL]?SE?BC/i, '').replace(/SE?BC/i, '')
  } else {
    // Fallback: try to extract meaningful parts
    const withoutPrefix = code.replace(/^[GL]/, '')
    if (withoutPrefix.length > 0) {
      baseCategory = withoutPrefix
    } else {
      baseCategory = code
    }
  }
  
  // Determine full name based on prefix and suffix
  let fullName = baseCategory
  if (isGeneral) {
    fullName = `General ${baseCategory}`
  } else if (isLocal) {
    fullName = `Local ${baseCategory}`
  }
  
  // Add suffix meaning
  if (suffix.includes('H')) {
    fullName += ' (Home University)'
  } else if (suffix.includes('O')) {
    fullName += ' (Other University)'
  } else if (suffix.includes('S')) {
    fullName += ' (State Level)'
  }
  
  // Category descriptions
  const descriptions: Record<string, string> = {
    'OPEN': 'Open category - No reservation',
    'OBC': 'Other Backward Class - 27% reservation',
    'SC': 'Scheduled Caste - 15% reservation',
    'ST': 'Scheduled Tribe - 7.5% reservation',
    'NT': 'Nomadic Tribes - includes NT-A, NT-B, NT-C, NT-D',
    'NT-A': 'Nomadic Tribes - Type A',
    'NT-B': 'Nomadic Tribes - Type B',
    'NT-C': 'Nomadic Tribes - Type C',
    'NT-D': 'Nomadic Tribes - Type D',
    'VJ': 'Vimukta Jati - De-notified tribes',
    'DT': 'Denotified Tribes',
    'SEBC': 'Socially and Economically Backward Class'
  }
  
  const description = descriptions[baseCategory] || `${baseCategory} category`
  
  return {
    normalizedName: baseCategory,
    fullName: fullName,
    description: description,
    type: isLocal ? 'local' : isGeneral ? 'general' : 'reserved'
  }
}

/**
 * Get category display name for UI
 */
export function getCategoryDisplayName(categoryCode: string): string {
  return normalizeCategory(categoryCode).normalizedName
}

/**
 * Get category full name with description
 */
export function getCategoryFullInfo(categoryCode: string): CategoryInfo {
  return normalizeCategory(categoryCode)
}

/**
 * Group categories by normalized name for filtering
 */
export function groupCategoriesByNormalizedName(categories: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>()
  
  categories.forEach(cat => {
    const normalized = normalizeCategory(cat).normalizedName
    if (!grouped.has(normalized)) {
      grouped.set(normalized, [])
    }
    grouped.get(normalized)!.push(cat)
  })
  
  return grouped
}

/**
 * Get all unique normalized category names from a list
 */
export function getNormalizedCategories(categories: string[]): string[] {
  const normalized = new Set<string>()
  categories.forEach(cat => {
    normalized.add(normalizeCategory(cat).normalizedName)
  })
  return Array.from(normalized).sort()
}

