import requests
import pandas as pd
from bs4 import BeautifulSoup
import openpyxl
import os
import time
import random
import sys
import argparse
import re
import traceback

# Define the base URL for the result page
BASE_URL = "https://results.indiaresults.com/wb/caluniv/b.a-b.sc-semester-iii-2024/result.asp?rollno="

# Define default file paths
DEFAULT_INPUT_FILE = "input.xlsx"
DEFAULT_OUTPUT_FILE = "exam_results.xlsx"
DEFAULT_LOG_FILE = "scraping_log.xlsx"

# Debug mode
DEBUG = False  # Set to False by default for production use

def log_debug(message):
    """Print debug messages if DEBUG is True"""
    if DEBUG:
        print(f"[DEBUG] {message}")

def clean_roll_number(roll_no):
    """Remove spaces and dashes from roll numbers"""
    if isinstance(roll_no, str):
        return roll_no.replace(' ', '').replace('-', '')
    return str(roll_no).replace(' ', '').replace('-', '')

def extract_data(soup, roll_no):
    """Extract data from the BeautifulSoup object"""
    try:
        # Find personal details section
        if DEBUG:
            log_debug("Searching for personal details section")
            
        # Look for Remarks to confirm result page is found
        remarks_element = "Semester Not Cleared"  # Default value for failed students
        sgpa_value = ""
        
        # Find SGPA - it's often near the SGPA text
        sgpa_element = soup.find(string=lambda text: text and "SGPA" in text)
        if sgpa_element:
            # Try to find the next cell or sibling element containing the value
            parent = sgpa_element.parent
            if parent:
                # Try to find sibling td
                sibling = parent.find_next_sibling('td')
                if sibling:
                    sgpa_value = sibling.text.strip()
                    log_debug(f"Found SGPA: {sgpa_value}")
                else:
                    # Try to find the value in the next row
                    next_cell = parent.find_next('td')
                    if next_cell:
                        sgpa_value = next_cell.text.strip()
                        log_debug(f"Found SGPA: {sgpa_value}")
        
        # Find the remarks more directly - search for strings that look like remarks
        remarks_keywords = ["Semester Not Cleared", "Semester Cleared", "Pass", "Failed"]
        for keyword in remarks_keywords:
            element = soup.find(string=lambda text: text and keyword in text)
            if element:
                if "Semester Not Cleared" in element:
                    remarks_element = "Semester Not Cleared"
                elif "Semester Cleared" in element:
                    remarks_element = "Semester Cleared"
                elif "Pass" in element and not "Passed" in element:
                    remarks_element = "Pass" 
                elif "Failed" in element and not "Failed in" in element:
                    remarks_element = "Failed"
                    
                log_debug(f"Found remark: {remarks_element}")
                break
        
        # Find the table rows - look for the Marks Details section
        subject_rows = soup.find_all('tr')
        if DEBUG:
            log_debug(f"Found {len(subject_rows)} rows after header")

        # Collect all subject results
        subject_results = []
        
        # Prepare a pattern to identify subject rows
        # Most subject codes follow patterns like PLSA-CC11, PLSA-DSE-A1, etc.
        subject_pattern = re.compile(r'^([A-Z]{2,5}-[A-Z]{2,3}(?:-[A-Z]\d|\d{2}))$')
        
        # Keep track of whether we're in the marking section
        in_marking_section = False
        
        for row in subject_rows:
            # Extract cells from row
            cells = row.find_all('td')
            if not cells or len(cells) < 1:
                continue
                
            subject_cell = cells[0].get_text(strip=True)
            log_debug(f"Processing subject row: {subject_cell}")
            
            # Check if this is the subject header row
            if subject_cell == "Subject & Course" or "Subject" in subject_cell and "Course" in subject_cell:
                in_marking_section = True
                log_debug(f"Found subject header row: {subject_cell}")
                continue
            
            # Skip everything until we find the marking section
            if not in_marking_section:
                continue
                
            # Skip non-subject rows
            if "Final Result" in subject_cell:
                # We're done with the marking section
                in_marking_section = False
                log_debug(f"Reached end of marking section")
                continue
                
            # Skip rows that don't look like subjects
            if not subject_pattern.match(subject_cell) and not subject_cell.startswith("GE"):
                # Skip rows that are clearly not subjects
                if ("Search" in subject_cell or "Print" in subject_cell or 
                    "SGPA" in subject_cell or "Remarks" in subject_cell or
                    "Personal Details" in subject_cell or "Marks Details" in subject_cell):
                    log_debug(f"Skipping non-subject row: {subject_cell}")
                    continue
                
                # Some legitimate subjects might not match the pattern
                log_debug(f"Subject doesn't match pattern but continuing: {subject_cell}")
            
            # Try to extract marks data
            theory_marks = "N/A"
            practical_marks = "N/A"
            internal_marks = "N/A"
            total_marks = "N/A"
            status = "N/A"
            grade = "N/A"
            
            if len(cells) >= 6:
                # Extract marks data
                theory_marks = cells[1].get_text(strip=True) if len(cells) > 1 else "N/A"
                practical_marks = cells[2].get_text(strip=True) if len(cells) > 2 else "N/A"
                internal_marks = cells[3].get_text(strip=True) if len(cells) > 3 else "N/A"
                total_marks = cells[4].get_text(strip=True) if len(cells) > 4 else "N/A"
                status = cells[5].get_text(strip=True) if len(cells) > 5 else "N/A"
                grade = cells[6].get_text(strip=True) if len(cells) > 6 else "N/A"
                
                # Skip rows with header-like content in the marks columns
                if ("Theoretical" in theory_marks or "Practical" in practical_marks or 
                    "Internal" in internal_marks or "Total" in total_marks or
                    "Status" in status or "Grade" in grade):
                    log_debug(f"Skipping header row with column titles")
                    continue
                
                log_debug(f"Extracted: {subject_cell}, theory: {theory_marks}, practical: {practical_marks}, total: {total_marks}")
                
                # Record the subject result
                subject_result = {
                    "Roll No": roll_no,
                    "Reg No": "Not found",  # Will be updated from Excel
                    "Name": "Not found",    # Will be updated from Excel
                    "Subject": subject_cell,
                    "Theory Marks": theory_marks,
                    "Practical Marks": practical_marks,
                    "Internal Assessment": internal_marks,
                    "Total": total_marks,
                    "Status": status,
                    "Grade": grade,
                    "SGPA": sgpa_value,
                    "Remarks": remarks_element
                }
                
                subject_results.append(subject_result)
            
        if not subject_results:
            return [], "No subject data found"
            
        log_debug(f"Found {len(subject_results)} subjects for roll {roll_no}")
        return subject_results, "Success"
        
    except Exception as e:
        if DEBUG:
            log_debug(f"Error extracting data: {str(e)}")
            traceback.print_exc()
        return [], f"Exception: {str(e)}"

def save_html_for_debugging(roll_no, content):
    """Save the HTML content to a file for debugging"""
    if DEBUG:
        debug_dir = "debug_html"
        os.makedirs(debug_dir, exist_ok=True)
        filename = os.path.join(debug_dir, f"{roll_no}.html")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        log_debug(f"Saved HTML content to {filename}")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Scrape exam results from India Results website.")
    parser.add_argument("--input", "-i", type=str, default=DEFAULT_INPUT_FILE,
                        help=f"Input Excel file containing roll numbers (default: {DEFAULT_INPUT_FILE})")
    parser.add_argument("--output", "-o", type=str, default=DEFAULT_OUTPUT_FILE,
                        help=f"Output Excel file to save results (default: {DEFAULT_OUTPUT_FILE})")
    parser.add_argument("--log", "-l", type=str, default=DEFAULT_LOG_FILE,
                        help=f"Log file to save scraping results (default: {DEFAULT_LOG_FILE})")
    parser.add_argument("--column", "-c", type=str, default=None,
                        help="Column name in the Excel file containing roll numbers")
    parser.add_argument("--start", "-s", type=int, default=0,
                        help="Starting index to resume scraping (default: 0)")
    parser.add_argument("--count", "-n", type=int, default=None,
                        help="Number of roll numbers to process (default: all)")
    parser.add_argument("--delay", "-d", type=float, default=2.0,
                        help="Average delay between requests in seconds (default: 2.0)")
    parser.add_argument("--debug", action="store_true",
                        help="Enable debug mode with verbose output and HTML saving")
    return parser.parse_args()

def main():
    """Main function to execute the scraping process"""
    # Parse command-line arguments
    args = parse_arguments()
    
    # Set global debug mode
    global DEBUG
    DEBUG = args.debug
    
    print("Starting data extraction process...")
    if DEBUG:
        print(f"DEBUG mode enabled. HTML responses will be saved in debug_html/ directory")
        os.makedirs("debug_html", exist_ok=True)
    
    # Read input Excel file
    try:
        df_input = pd.read_excel(args.input)
        print(f"Found {len(df_input)} roll numbers in the input file: {args.input}")
    except Exception as e:
        print(f"Error reading input file: {str(e)}")
        return
    
    # Print the column names to help identify the roll number column
    print(f"Columns in the input file: {df_input.columns.tolist()}")
    
    # Determine which column contains roll numbers, registration numbers, and names
    roll_column = args.column
    reg_column = None
    name_column = None
    
    if not roll_column:
        for col in df_input.columns:
            if 'roll' in col.lower():
                roll_column = col
                break
    
    # Find registration number column and name column
    for col in df_input.columns:
        if 'reg' in col.lower() and 'no' in col.lower():
            reg_column = col
        elif 'name' in col.lower() or 'candidate' in col.lower():
            name_column = col
    
    if not roll_column:
        roll_column = df_input.columns[1]  # Default to second column if 'roll' not found
    
    print(f"Using column '{roll_column}' for roll numbers")
    if reg_column:
        print(f"Using column '{reg_column}' for registration numbers")
    if name_column:
        print(f"Using column '{name_column}' for names")
    
    # Clean roll numbers
    roll_numbers = [clean_roll_number(roll) for roll in df_input[roll_column].tolist()]
    print(f"First 5 roll numbers after cleaning: {roll_numbers[:5]}")
    
    # Create a dictionary to look up registration numbers and names by roll number
    roll_to_reg = {}
    roll_to_name = {}
    
    # Map original roll numbers to reg numbers and names
    for _, row in df_input.iterrows():
        original_roll = str(row[roll_column])
        clean_roll = clean_roll_number(original_roll)
        
        if reg_column and pd.notna(row.get(reg_column)):
            roll_to_reg[clean_roll] = str(row[reg_column])
        
        if name_column and pd.notna(row.get(name_column)):
            roll_to_name[clean_roll] = str(row[name_column])
    
    # Initialize results DataFrame and log DataFrame
    columns = [
        "Roll No", "Reg No", "Name", "Subject", "Theory Marks", "Practical Marks", 
        "Internal Assessment", "Total", "Status", "Grade", "SGPA", "Remarks"
    ]
    results_df = pd.DataFrame(columns=columns)
    log_df = pd.DataFrame(columns=["Roll No", "Status"])
    
    # Create output Excel writer
    with pd.ExcelWriter(args.output, engine='openpyxl') as writer:
        results_df.to_excel(writer, sheet_name="Results", index=False)
    
    # Create log Excel writer
    with pd.ExcelWriter(args.log, engine='openpyxl') as writer:
        log_df.to_excel(writer, sheet_name="Log", index=False)
    
    # Process each roll number
    start_idx = args.start
    total_rolls = len(roll_numbers)
    
    # Limit processing if count is specified
    end_idx = total_rolls
    if args.count:
        end_idx = min(start_idx + args.count, total_rolls)
        
    successful = 0
    failed = 0
    
    print(f"Will process roll numbers from index {start_idx} to {end_idx-1}")
    
    for i, roll_no in enumerate(roll_numbers[start_idx:end_idx], start=start_idx):
        print(f"Processing {i+1}/{end_idx} ({100*(i-start_idx+1)/(end_idx-start_idx):.1f}%): Roll No. {roll_no}")
        
        try:
            # Add a small delay to avoid overwhelming the server
            delay = random.uniform(args.delay * 0.5, args.delay * 1.5)
            time.sleep(delay)
            
            # Make the request
            url = BASE_URL + roll_no
            log_debug(f"Making request to URL: {url}")
            
            response = requests.get(url, timeout=30)
            log_debug(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                # Save the HTML content for debugging
                if DEBUG:
                    save_html_for_debugging(roll_no, response.text)
                
                soup = BeautifulSoup(response.text, "html.parser")
                subject_results, status = extract_data(soup, roll_no)
                
                if subject_results:
                    log_debug(f"Found {len(subject_results)} subjects for roll {roll_no}")
                    
                    # Use registration number and name from Excel file if available
                    reg_no = roll_to_reg.get(roll_no, "Not found")
                    name = roll_to_name.get(roll_no, "Not found")
                    
                    # Update the registration number and name in the results
                    for result in subject_results:
                        if reg_no != "Not found":
                            result["Reg No"] = reg_no
                        if name != "Not found":
                            result["Name"] = name
                    
                    # Append data to results Excel file
                    df_subjects = pd.DataFrame(subject_results)
                    
                    # Read existing data if file exists
                    if os.path.exists(args.output):
                        existing_df = pd.read_excel(args.output, sheet_name="Results")
                        # Combine existing data with new data
                        df_subjects = pd.concat([existing_df, df_subjects], ignore_index=True)
                    
                    # Save all data to a single sheet
                    df_subjects.to_excel(args.output, sheet_name="Results", index=False)
                    
                    # Log success
                    log_entry = pd.DataFrame([[roll_no, "Success"]], columns=["Roll No", "Status"])
                    successful += 1
                else:
                    # Log failure
                    log_entry = pd.DataFrame([[roll_no, status]], columns=["Roll No", "Status"])
                    failed += 1
                    
            else:
                # Log HTTP error
                log_entry = pd.DataFrame([[roll_no, f"HTTP Error: {response.status_code}"]], columns=["Roll No", "Status"])
                failed += 1
                
        except Exception as e:
            # Log any other error
            log_entry = pd.DataFrame([[roll_no, f"Exception: {str(e)}"]], columns=["Roll No", "Status"])
            failed += 1
            
        # Append to log file
        with pd.ExcelWriter(args.log, mode='a', engine='openpyxl', if_sheet_exists='overlay') as writer:
            book = openpyxl.load_workbook(args.log)
            sheet = book["Log"]
            current_rows = sheet.max_row
            log_entry.to_excel(writer, sheet_name="Log", index=False, header=False, startrow=current_rows)
            
        # Print progress
        print(f"Completed {i+1}/{end_idx} ({100*(i-start_idx+1)/(end_idx-start_idx):.1f}%) - Success: {successful}, Failed: {failed}")
    
    print(f"\n✅ Data extraction complete!")
    print(f"✅ Results saved to: {args.output}")
    print(f"✅ Log saved to: {args.log}")
    print(f"✅ Summary: {successful} successful, {failed} failed out of {end_idx-start_idx} roll numbers")

if __name__ == "__main__":
    main()
