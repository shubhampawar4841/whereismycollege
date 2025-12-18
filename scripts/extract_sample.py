import pdfplumber
import sys

pdf_path = sys.argv[1]
sample_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5

try:
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        pages_to_read = min(sample_pages, total_pages)
        
        text_samples = []
        for i in range(pages_to_read):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                text_samples.append(text[:2000])
        
        if total_pages > pages_to_read * 2:
            mid_page = pdf.pages[total_pages // 2]
            mid_text = mid_page.extract_text()
            if mid_text:
                text_samples.append(mid_text[:2000])
        
        if total_pages > pages_to_read:
            last_page = pdf.pages[-1]
            last_text = last_page.extract_text()
            if last_text:
                text_samples.append(last_text[:2000])
        
        result = "\n\n--- PAGE BREAK ---\n\n".join(text_samples)
        print(result)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
