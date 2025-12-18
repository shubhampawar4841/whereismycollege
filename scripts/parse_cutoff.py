import pdfplumber
import pandas as pd
import re
import sys
from tqdm import tqdm

# Get command line arguments
if len(sys.argv) < 3:
    print("Usage: python parse_cutoff.py <pdf_path> <output_csv_path>")
    sys.exit(1)

PDF_PATH = sys.argv[1]
OUTPUT_CSV = sys.argv[2]

rows = []
current_college = None
current_course = None
current_seat_type = None

college_pattern = re.compile(r"^(\d+)\s*-\s*(.+)$")
course_pattern = re.compile(r"^(\d+)\s*-\s*(.+)$")
stage_pattern = re.compile(r"^Stage\s+(.+)$")
rank_line_pattern = re.compile(r"^I\s+(.+)$")
percentile_pattern = re.compile(r"\(([\d.]+)\)")
rank_number_pattern = re.compile(r"\b(\d+)\b")

print(f"Reading PDF: {PDF_PATH}")

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

                # 🏫 College detection (format: "1002 - Government College of Engineering, Amravati")
                # Colleges have shorter codes (typically 4 digits) and contain college/university keywords
                college_match = college_pattern.match(line)
                if college_match:
                    code = college_match.group(1)
                    name = college_match.group(2).strip()
                    # College codes are typically 3-5 digits, and names contain college/university/institute
                    if len(code) <= 5 and any(keyword in name.lower() for keyword in ['college', 'university', 'institute', 'school']):
                        current_college = {
                            "code": code,
                            "name": name
                        }
                        # Reset course when new college is found
                        current_course = None

                # 📘 Course detection (format: "100219110 - Civil Engineering")
                # Courses have longer codes (typically 8-9 digits) and contain engineering/technology keywords
                course_match = course_pattern.match(line)
                if course_match:
                    code = course_match.group(1)
                    name = course_match.group(2).strip()
                    # Course codes are typically 8-9 digits, and names contain engineering/technology
                    if len(code) >= 8 and any(keyword in name.lower() for keyword in ['engineering', 'technology', 'tech']):
                        current_course = {
                            "code": code,
                            "name": name
                        }

                # 🪑 Seat Type detection
                if "State Level" in line and "Stage" not in line:
                    current_seat_type = "State Level"
                elif "Home University Seats Allotted to Home University Candidates" in line:
                    current_seat_type = "Home University Seats Allotted to Home University Candidates"
                elif "Home University Seats Allotted to Other Than Home University Candidates" in line:
                    current_seat_type = "Home University Seats Allotted to Other Than Home University Candidates"
                elif "Other Than Home University Seats Allotted to Other Than Home University Candidates" in line:
                    current_seat_type = "Other Than Home University Seats Allotted to Other Than Home University Candidates"

                # 📊 Stage line detection (contains categories)
                stage_match = stage_pattern.match(line)
                if stage_match and current_college and current_course:
                    categories = stage_match.group(1).split()
                    
                    # Look for rank line (next line starting with "I")
                    if i + 1 < len(lines):
                        rank_line = lines[i + 1].strip()
                        rank_match = rank_line_pattern.match(rank_line)
                        
                        if rank_match:
                            # Extract all rank numbers
                            rank_numbers = rank_number_pattern.findall(rank_match.group(1))
                            
                            # Look for percentile line (line after rank line)
                            if i + 2 < len(lines):
                                percentile_line = lines[i + 2].strip()
                                percentiles = percentile_pattern.findall(percentile_line)
                                
                                # Match categories with ranks and percentiles by index
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
        print("\n[ERROR] No data extracted from PDF")
        sys.exit(1)

except FileNotFoundError:
    print(f"\n[ERROR] PDF file not found: {PDF_PATH}")
    sys.exit(1)
except Exception as e:
    print(f"\n[ERROR] Failed to parse PDF: {str(e)}")
    sys.exit(1)




