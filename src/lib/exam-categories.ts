export interface ExamCategory {
  id: string
  name: string
  icon: string
  color: string
  gradient: string
  exams: ExamType[]
}

export interface ExamType {
  id: string
  name: string
  fullName: string
  category: string
  parserStrategy: string
  description: string
}

export const examCategories: ExamCategory[] = [
  {
    id: 'jee-mains',
    name: 'JEE Mains',
    icon: '🎓',
    color: 'from-orange-500 to-yellow-500',
    gradient: 'from-orange-600 to-yellow-600',
    exams: [
      {
        id: 'jee-mains-round1-2024',
        name: 'JEE Mains Round 1 (2024)',
        fullName: 'JEE Mains 2024 Round 1',
        category: 'jee-mains',
        parserStrategy: 'jee_mains_format',
        description: 'JEE Mains 2024 Round 1 cutoff data'
      },
      {
        id: 'jee-mains-round2-2024',
        name: 'JEE Mains Round 2 (2024)',
        fullName: 'JEE Mains 2024 Round 2',
        category: 'jee-mains',
        parserStrategy: 'jee_mains_format',
        description: 'JEE Mains 2024 Round 2 cutoff data'
      },
      {
        id: 'jee-mains-round3-2024',
        name: 'JEE Mains Round 3 (2024)',
        fullName: 'JEE Mains 2024 Round 3',
        category: 'jee-mains',
        parserStrategy: 'jee_mains_format',
        description: 'JEE Mains 2024 Round 3 cutoff data'
      },
      {
        id: 'jee-mains-round4-2024',
        name: 'JEE Mains Round 4 (2024)',
        fullName: 'JEE Mains 2024 Round 4',
        category: 'jee-mains',
        parserStrategy: 'jee_mains_format',
        description: 'JEE Mains 2024 Round 4 cutoff data'
      },
      {
        id: 'jee-mains-round5-2024',
        name: 'JEE Mains Round 5 (2024)',
        fullName: 'JEE Mains 2024 Round 5',
        category: 'jee-mains',
        parserStrategy: 'jee_mains_format',
        description: 'JEE Mains 2024 Round 5 cutoff data'
      }
    ]
  },
  {
    id: 'technical-education',
    name: 'Maharashtra Exams',
    icon: '🧑‍💻',
    color: 'from-blue-500 to-cyan-500',
    gradient: 'from-blue-600 to-cyan-600',
    exams: [
      // Post Graduate
      {
        id: 'mba-mms',
        name: 'MBA / MMS',
        fullName: 'Master of Business Administration / Master of Management Studies',
        category: 'technical-education',
        parserStrategy: 'mba_format',
        description: 'Post Graduate Management courses'
      },
      {
        id: 'mca',
        name: 'MCA',
        fullName: 'Master of Computer Applications',
        category: 'technical-education',
        parserStrategy: 'mca_format',
        description: 'Post Graduate Computer Applications'
      },
      {
        id: 'me-mtech',
        name: 'M.E. / M.Tech',
        fullName: 'Master of Engineering / Master of Technology',
        category: 'technical-education',
        parserStrategy: 'engineering_format',
        description: 'Post Graduate Engineering courses'
      },
      {
        id: 'me-mtech-wp',
        name: 'M.E./M.Tech (Working Professionals)',
        fullName: 'Master of Engineering / Technology for Working Professionals',
        category: 'technical-education',
        parserStrategy: 'engineering_format',
        description: 'Post Graduate Engineering for Working Professionals'
      },
      {
        id: 'march',
        name: 'M.Arch',
        fullName: 'Master of Architecture',
        category: 'technical-education',
        parserStrategy: 'architecture_format',
        description: 'Post Graduate Architecture'
      },
      {
        id: 'mhmct',
        name: 'M.HMCT',
        fullName: 'Master of Hotel Management and Catering Technology',
        category: 'technical-education',
        parserStrategy: 'hmct_format',
        description: 'Post Graduate Hotel Management'
      },
      {
        id: 'mpharmacy',
        name: 'M.Pharmacy / Pharm.D',
        fullName: 'Master of Pharmacy / Doctor of Pharmacy',
        category: 'technical-education',
        parserStrategy: 'pharmacy_format',
        description: 'Post Graduate Pharmacy courses'
      },
      {
        id: 'mplanning',
        name: 'M.Planning',
        fullName: 'Master of Planning',
        category: 'technical-education',
        parserStrategy: 'planning_format',
        description: 'Post Graduate Planning'
      },
      {
        id: 'mca-lateral',
        name: 'MCA – Second Year (Lateral Entry)',
        fullName: 'Master of Computer Applications Lateral Entry',
        category: 'technical-education',
        parserStrategy: 'mca_format',
        description: 'MCA Lateral Entry'
      },
      {
        id: 'mca-wp',
        name: 'MCA (Working Professionals)',
        fullName: 'Master of Computer Applications for Working Professionals',
        category: 'technical-education',
        parserStrategy: 'mca_format',
        description: 'MCA for Working Professionals'
      },
      {
        id: 'mba-lateral',
        name: 'MBA – Second Year (Lateral Entry)',
        fullName: 'Master of Business Administration Lateral Entry',
        category: 'technical-education',
        parserStrategy: 'mba_format',
        description: 'MBA Lateral Entry'
      },
      {
        id: 'mba-wp',
        name: 'MBA / MMS (Working Professionals)',
        fullName: 'MBA/MMS for Working Professionals',
        category: 'technical-education',
        parserStrategy: 'mba_format',
        description: 'MBA/MMS for Working Professionals'
      },
      // Under Graduate
      {
        id: 'be-btech',
        name: 'B.E. / B.Tech',
        fullName: 'Bachelor of Engineering / Bachelor of Technology',
        category: 'technical-education',
        parserStrategy: 'engineering_format',
        description: 'Undergraduate Engineering courses'
      },
      {
        id: 'bca-bba',
        name: 'BCA / BBA / BMS / BBM / MCA (Integrated)',
        fullName: 'Bachelor of Computer Applications / Business Administration / Management Studies',
        category: 'technical-education',
        parserStrategy: 'bca_bba_format',
        description: 'Undergraduate Business and Computer courses'
      },
      {
        id: 'bpharmacy',
        name: 'B.Pharmacy / Pharm.D',
        fullName: 'Bachelor of Pharmacy / Doctor of Pharmacy',
        category: 'technical-education',
        parserStrategy: 'pharmacy_format',
        description: 'Undergraduate Pharmacy courses'
      },
      {
        id: 'barch',
        name: 'B.Architecture',
        fullName: 'Bachelor of Architecture',
        category: 'technical-education',
        parserStrategy: 'architecture_format',
        description: 'Undergraduate Architecture'
      },
      {
        id: 'bhmct',
        name: 'B.HMCT / B.HMCT (Integrated)',
        fullName: 'Bachelor of Hotel Management and Catering Technology',
        category: 'technical-education',
        parserStrategy: 'hmct_format',
        description: 'Undergraduate Hotel Management'
      },
      {
        id: 'bplanning',
        name: 'B.Planning',
        fullName: 'Bachelor of Planning',
        category: 'technical-education',
        parserStrategy: 'planning_format',
        description: 'Undergraduate Planning'
      },
      {
        id: 'bdesign',
        name: 'B.Design',
        fullName: 'Bachelor of Design',
        category: 'technical-education',
        parserStrategy: 'design_format',
        description: 'Undergraduate Design'
      },
      {
        id: 'bpharmacy-practice',
        name: 'B.Pharmacy (Practice)',
        fullName: 'Bachelor of Pharmacy Practice',
        category: 'technical-education',
        parserStrategy: 'pharmacy_format',
        description: 'Undergraduate Pharmacy Practice'
      },
      // Direct Second Year
      {
        id: 'dse-engineering',
        name: 'Direct Second Year Engineering (DSE)',
        fullName: 'Direct Second Year Engineering',
        category: 'technical-education',
        parserStrategy: 'engineering_format',
        description: 'Direct Second Year Engineering'
      },
      {
        id: 'dse-engineering-wp',
        name: 'DSE Engineering (Working Professional)',
        fullName: 'Direct Second Year Engineering for Working Professionals',
        category: 'technical-education',
        parserStrategy: 'engineering_format',
        description: 'DSE Engineering for Working Professionals'
      },
      {
        id: 'dsp-pharmacy',
        name: 'Direct Second Year Pharmacy (DSP)',
        fullName: 'Direct Second Year Pharmacy',
        category: 'technical-education',
        parserStrategy: 'pharmacy_format',
        description: 'Direct Second Year Pharmacy'
      },
      {
        id: 'dse-hmct',
        name: 'Direct Second Year Degree in HMCT',
        fullName: 'Direct Second Year HMCT',
        category: 'technical-education',
        parserStrategy: 'hmct_format',
        description: 'Direct Second Year HMCT'
      }
    ]
  },
  {
    id: 'agriculture-education',
    name: 'Agriculture Education',
    icon: '🌾',
    color: 'from-green-500 to-emerald-500',
    gradient: 'from-green-600 to-emerald-600',
    exams: [
      {
        id: 'agriculture-allied',
        name: 'Agriculture & Allied Courses',
        fullName: 'Agriculture and Allied Courses',
        category: 'agriculture-education',
        parserStrategy: 'agriculture_format',
        description: 'Undergraduate Agriculture courses'
      },
      {
        id: 'dse-agriculture',
        name: 'Direct Second Year B.Sc. (Agriculture)',
        fullName: 'Direct Second Year B.Sc. Agriculture',
        category: 'agriculture-education',
        parserStrategy: 'agriculture_format',
        description: 'Direct Second Year Agriculture'
      }
    ]
  },
  {
    id: 'fine-art-education',
    name: 'Fine Art Education',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
    gradient: 'from-purple-600 to-pink-600',
    exams: [
      {
        id: 'fine-art',
        name: 'Fine Art Courses',
        fullName: 'Fine Art Courses',
        category: 'fine-art-education',
        parserStrategy: 'fine_art_format',
        description: 'Undergraduate Fine Art courses'
      }
    ]
  },
  {
    id: 'higher-education',
    name: 'Higher Education',
    icon: '📚',
    color: 'from-orange-500 to-red-500',
    gradient: 'from-orange-600 to-red-600',
    exams: [
      {
        id: 'med',
        name: 'M.Ed',
        fullName: 'Master of Education',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Post Graduate Education'
      },
      {
        id: 'mped',
        name: 'M.P.Ed',
        fullName: 'Master of Physical Education',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Post Graduate Physical Education'
      },
      {
        id: 'bed-med-integrated',
        name: 'B.Ed–M.Ed (Integrated)',
        fullName: 'B.Ed–M.Ed Integrated',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Integrated B.Ed–M.Ed'
      },
      {
        id: 'llb-5years',
        name: 'LL.B – 5 Years (Integrated)',
        fullName: 'Bachelor of Laws 5 Years Integrated',
        category: 'higher-education',
        parserStrategy: 'law_format',
        description: '5 Years Integrated Law'
      },
      {
        id: 'llb-3years',
        name: 'LL.B – 3 Years',
        fullName: 'Bachelor of Laws 3 Years',
        category: 'higher-education',
        parserStrategy: 'law_format',
        description: '3 Years Law'
      },
      {
        id: 'bed',
        name: 'B.Ed',
        fullName: 'Bachelor of Education',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Undergraduate Education'
      },
      {
        id: 'bped',
        name: 'B.P.Ed',
        fullName: 'Bachelor of Physical Education',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Undergraduate Physical Education'
      },
      {
        id: 'ba-bed-integrated',
        name: 'B.A.–B.Ed / B.Sc.–B.Ed (Integrated)',
        fullName: 'B.A.–B.Ed / B.Sc.–B.Ed Integrated',
        category: 'higher-education',
        parserStrategy: 'education_format',
        description: 'Integrated B.A./B.Sc.–B.Ed'
      }
    ]
  },
  {
    id: 'medical-education',
    name: 'Medical Education',
    icon: '🩺',
    color: 'from-red-500 to-pink-500',
    gradient: 'from-red-600 to-pink-600',
    exams: [
      {
        id: 'neet-pgm',
        name: 'NEET-PGM',
        fullName: 'NEET Post Graduate Medical',
        category: 'medical-education',
        parserStrategy: 'neet_format',
        description: 'Post Graduate Medical Entrance'
      },
      {
        id: 'pg-dnb',
        name: 'PG DNB',
        fullName: 'Post Graduate Diplomate of National Board',
        category: 'medical-education',
        parserStrategy: 'neet_format',
        description: 'Post Graduate DNB'
      },
      {
        id: 'neet-pgd',
        name: 'NEET-PGD',
        fullName: 'NEET Post Graduate Dental',
        category: 'medical-education',
        parserStrategy: 'neet_format',
        description: 'Post Graduate Dental Entrance'
      },
      {
        id: 'pgp-pgd',
        name: 'PGP / PGD / PGASLP / M.Sc. (P&O)',
        fullName: 'Post Graduate Programs in Paramedical',
        category: 'medical-education',
        parserStrategy: 'medical_format',
        description: 'Post Graduate Paramedical courses'
      },
      {
        id: 'neet-ug',
        name: 'NEET-UG',
        fullName: 'NEET Undergraduate',
        category: 'medical-education',
        parserStrategy: 'neet_format',
        description: 'Undergraduate Medical Entrance'
      },
      {
        id: 'bnys',
        name: 'BNYS (NEET-UG)',
        fullName: 'Bachelor of Naturopathy and Yogic Sciences',
        category: 'medical-education',
        parserStrategy: 'neet_format',
        description: 'Undergraduate Naturopathy'
      },
      {
        id: 'bsc-nursing',
        name: 'B.Sc. Nursing',
        fullName: 'Bachelor of Science in Nursing',
        category: 'medical-education',
        parserStrategy: 'nursing_format',
        description: 'Undergraduate Nursing'
      },
      {
        id: 'anm-gnm',
        name: 'ANM / GNM',
        fullName: 'Auxiliary Nurse Midwifery / General Nursing and Midwifery',
        category: 'medical-education',
        parserStrategy: 'nursing_format',
        description: 'Nursing Diploma courses'
      },
      {
        id: 'dpn-phn',
        name: 'DPN–PHN',
        fullName: 'Diploma in Public Health Nursing',
        category: 'medical-education',
        parserStrategy: 'nursing_format',
        description: 'Public Health Nursing Diploma'
      }
    ]
  }
]

// Get all exams flattened
export const allExams: ExamType[] = examCategories.flatMap(cat => cat.exams)

// Get exam by ID
export function getExamById(id: string): ExamType | undefined {
  return allExams.find(exam => exam.id === id)
}

// Get exams by category
export function getExamsByCategory(categoryId: string): ExamType[] {
  const category = examCategories.find(cat => cat.id === categoryId)
  return category ? category.exams : []
}

// Get parser strategy for exam
export function getParserStrategy(examId: string): string {
  const exam = getExamById(examId)
  return exam?.parserStrategy || 'engineering_format'
}




