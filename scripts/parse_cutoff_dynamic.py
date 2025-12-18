import pdfplumber
import pandas as pd
import re
import sys
import json
from tqdm import tqdm

# Get command line arguments
if len(sys.argv) < 3:
    print("Usage: python parse_cutoff_dynamic.py <pdf_path> <output_csv_path> [analysis_json]")
    sys.exit(1)

PDF_PATH = sys.argv[1]
OUTPUT_CSV = sys.argv[2]
ANALYSIS_JSON = sys.argv[3] if len(sys.argv) > 3 else '{}'

# Parse analysis if provided
analysis = {}
try:
    if ANALYSIS_JSON and ANALYSIS_JSON != '{}':
        analysis = json.loads(ANALYSIS_JSON)
except:
    pass

rows = []
current_college = None
current_course = None
current_seat_type = None

# Determine parsing strategy from analysis
format_type = analysis.get('format_type', 'unknown')
parsing_strategy = analysis.get('parsing_strategy', 'engineering_format')

print(f"Reading PDF: {PDF_PATH}")
print(f"Detected format: {format_type}")
print(f"Using strategy: {parsing_strategy}")

# Common patterns
college_pattern = re.compile(r"^(\d+)\s*-\s*(.+)$")
course_pattern = re.compile(r"^(\d+)\s*-\s*(.+)$")
stage_pattern = re.compile(r"^Stage\s+(.+)$")
rank_line_pattern = re.compile(r"^I\s+(.+)$")
percentile_pattern = re.compile(r"\(([\d.]+)\)")
rank_number_pattern = re.compile(r"\b(\d+)\b")

# MBA-specific patterns
mba_college_pattern = re.compile(r"^(\d+)\s*[-–]\s*(.+)$", re.IGNORECASE)
mba_course_pattern = re.compile(r"^(\d{6,})\s*[-–]\s*(.+)$", re.IGNORECASE)
mba_category_pattern = re.compile(r"\b(OPEN|SC|ST|OBC|NT|EWS|VJ|DT|SBC)\b", re.IGNORECASE)
mba_rank_pattern = re.compile(r"\b(\d+)\b")
mba_score_pattern = re.compile(r"(\d+\.?\d*)")

try:
    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page in tqdm(pdf.pages, desc="Processing pages"):
            text = page.extract_text()
            if not text:
                continue

            lines = text.split("\n")
            i = 0
            
            while i < len(lines):
                line = lines[i].strip()
                
                if not line:
                    i += 1
                    continue

                # MBA Format Parsing - Improved structure detection
                # Check if this looks like MBA format (even if not detected as such)
                is_mba_format = (
                    parsing_strategy == 'mba_format' or 
                    format_type == 'mba_cutoff' or
                    'mba' in text.lower() or 
                    'mms' in text.lower() or
                    'management' in text.lower()
                )
                
                if is_mba_format:
                    # Try to detect MBA college pattern (format: "CODE - NAME")
                    mba_college_match = mba_college_pattern.match(line)
                    if mba_college_match:
                        code = mba_college_match.group(1)
                        name = mba_college_match.group(2).strip()
                        # MBA college codes are typically 4 digits
                        if len(code) <= 6:
                            current_college = {
                                "code": code,
                                "name": name
                            }
                            current_course = None
                            current_seat_type = None
                    
                    # Try to detect MBA course/program (format: "CODE - NAME")
                    # Course codes are longer (8-9 digits)
                    mba_course_match = mba_course_pattern.match(line)
                    if mba_course_match:
                        code = mba_course_match.group(1)
                        name = mba_course_match.group(2).strip()
                        if len(code) >= 6:
                            current_course = {
                                "code": code,
                                "name": name
                            }
                    
                    # Seat Type detection for MBA
                    if "Home University Seats Allotted to Home University Candidates" in line:
                        current_seat_type = "Home University Seats Allotted to Home University Candidates"
                    elif "Other Than Home University Seats Allotted to Other Than Home University Candidates" in line:
                        current_seat_type = "Other Than Home University Seats Allotted to Other Than Home University Candidates"
                    elif "Other Than Home University Seats Allotted to Home University Candidates" in line:
                        current_seat_type = "Other Than Home University Seats Allotted to Home University Candidates"
                    elif "State Level" in line and "Seats" not in line:
                        current_seat_type = "State Level"
                    
                    # MBA structure: Categories line -> Ranks line -> "Stage-I" -> Percentiles line
                    # Check if we have college and course, seat_type might be set on previous lines
                    if current_college and current_course:
                        # Look for categories line (contains category codes like GOPENH, GSCH, etc.)
                        # Category codes are typically uppercase letters, 3-8 chars, often starting with G, L, E, T, etc.
                        category_codes = re.findall(r'\b([A-Z]{3,8})\b', line)
                        
                        # Filter out common non-category words
                        filtered_categories = [cat for cat in category_codes 
                                             if cat not in ['STAGE', 'STATUS', 'UNIVERSITY', 'DEPARTMENT', 'HOME', 'OTHER', 'THAN', 'ALLOTTED', 'CANDIDATES', 'LEVEL']]
                        
                        # If we found category codes, look for ranks and percentiles in next lines
                        if filtered_categories and len(filtered_categories) >= 2:
                            # Next line should have ranks (numbers)
                            if i + 1 < len(lines):
                                ranks_line = lines[i + 1].strip()
                                ranks = mba_rank_pattern.findall(ranks_line)
                                
                                # Look for "Stage-I" or "Stage" line
                                percentiles_line_idx = i + 2
                                
                                if i + 2 < len(lines):
                                    next_line = lines[i + 2].strip()
                                    if "Stage" in next_line:
                                        percentiles_line_idx = i + 3
                                
                                # Percentiles are in parentheses on the line after Stage (or same line if no Stage)
                                if percentiles_line_idx < len(lines):
                                    percentiles_line = lines[percentiles_line_idx].strip()
                                    percentiles = percentile_pattern.findall(percentiles_line)
                                    
                                    # Match categories with ranks and percentiles by index
                                    for idx, category in enumerate(filtered_categories):
                                        rank = int(ranks[idx]) if idx < len(ranks) and ranks[idx].isdigit() else 0
                                        percentile = float(percentiles[idx]) if idx < len(percentiles) else 0.0
                                        
                                        rows.append({
                                            "college_code": current_college["code"],
                                            "college_name": current_college["name"],
                                            "course_code": current_course["code"],
                                            "course_name": current_course["name"],
                                            "seat_type": current_seat_type or "Unknown",
                                            "category": category,
                                            "rank": rank,
                                            "percentile": percentile
                                        })

                # Engineering Format Parsing (original logic)
                else:
                    # College detection
                    college_match = college_pattern.match(line)
                    if college_match:
                        code = college_match.group(1)
                        name = college_match.group(2).strip()
                        if len(code) <= 5 and any(keyword in name.lower() for keyword in ['college', 'university', 'institute', 'school']):
                            current_college = {
                                "code": code,
                                "name": name
                            }
                            current_course = None

                    # Course detection
                    course_match = course_pattern.match(line)
                    if course_match:
                        code = course_match.group(1)
                        name = course_match.group(2).strip()
                        if len(code) >= 8 and any(keyword in name.lower() for keyword in ['engineering', 'technology', 'tech']):
                            current_course = {
                                "code": code,
                                "name": name
                            }

                    # Seat Type detection
                    if "State Level" in line and "Stage" not in line:
                        current_seat_type = "State Level"
                    elif "Home University Seats Allotted to Home University Candidates" in line:
                        current_seat_type = "Home University Seats Allotted to Home University Candidates"
                    elif "Home University Seats Allotted to Other Than Home University Candidates" in line:
                        current_seat_type = "Home University Seats Allotted to Other Than Home University Candidates"
                    elif "Other Than Home University Seats Allotted to Other Than Home University Candidates" in line:
                        current_seat_type = "Other Than Home University Seats Allotted to Other Than Home University Candidates"

                    # Stage line detection
                    stage_match = stage_pattern.match(line)
                    if stage_match and current_college and current_course:
                        categories = stage_match.group(1).split()
                        
                        if i + 1 < len(lines):
                            rank_line = lines[i + 1].strip()
                            rank_match = rank_line_pattern.match(rank_line)
                            
                            if rank_match:
                                rank_numbers = rank_number_pattern.findall(rank_match.group(1))
                                
                                if i + 2 < len(lines):
                                    percentile_line = lines[i + 2].strip()
                                    percentiles = percentile_pattern.findall(percentile_line)
                                    
                                    for idx, category in enumerate(categories):
                                        if idx < len(rank_numbers) and idx < len(percentiles):
                                            rows.append({
                                                "college_code": current_college["code"],
                                                "college_name": current_college["name"],
                                                "course_code": current_course["code"],
                                                "course_name": current_course["name"],
                                                "seat_type": current_seat_type or "Unknown",
                                                "category": category,
                                                "rank": int(rank_numbers[idx]),
                                                "percentile": float(percentiles[idx])
                                            })
                
                i += 1

    # Save to CSV
    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(OUTPUT_CSV, index=False)
        print(f"\n[SUCCESS] Saved: {OUTPUT_CSV}")
        print(f"Total rows: {len(df)}")
        print(f"Unique colleges: {df['college_code'].nunique()}")
        print(f"Unique courses: {df['course_code'].nunique()}")
        print(f"\nSample data:")
        print(df.head(10).to_string())
    else:
        print("\n[WARNING] No data extracted from PDF")
        print("The PDF format might not match expected patterns.")
        print("Creating empty CSV with headers...")
        # Create empty CSV with headers
        df = pd.DataFrame(columns=['college_code', 'college_name', 'course_code', 'course_name', 'seat_type', 'category', 'rank', 'percentile'])
        df.to_csv(OUTPUT_CSV, index=False)
        sys.exit(0)  # Exit with 0 so upload still succeeds

except FileNotFoundError:
    print(f"\n[ERROR] PDF file not found: {PDF_PATH}")
    sys.exit(1)
except Exception as e:
    print(f"\n[ERROR] Failed to parse PDF: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

