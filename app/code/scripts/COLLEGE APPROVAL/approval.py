
# from selenium import webdriver  
# import time  
# from selenium.webdriver.common.keys import Keys  
# import pandas as pd
# from selenium.common.exceptions import TimeoutException
# from selenium.webdriver.remote.webdriver import WebDriver




# def attach_to_session(executor_url, session_id):
#     original_execute = WebDriver.execute
#     def new_command_execute(self, command, params=None):
#         if command == "newSession":
#             # Mock the response
#             return {'success': 0, 'value': None, 'sessionId': session_id}
#         else:
#             return original_execute(self, command, params)
#     # Patch the function before creating the driver object
#     WebDriver.execute = new_command_execute
#     driver = webdriver.Remote(command_executor=executor_url, desired_capabilities={})
#     driver.session_id = session_id
#     # Replace the patched function with original function
#     WebDriver.execute = original_execute
#     return driver

# #Configuration
# df=pd.read_csv("sheet/sheet1.csv") 
# all_rollno=df["Registration No."].tolist()
# #url="http://127.0.0.1:59514"
# url="http://127.0.0.1:57260"
# sessionId="539c515e188a00228f8988537296a82a"
# #sessionId="e34b177cee8734e1fff88b5e6728de17"
# link="https://www.cuexamwindow.in/CollegeApprovalCandidateList.aspx?rand=26/05/2025-16:06:27"
# #link="https://www.cuexamwindow.in/CollegeApprovalCandidateList.aspx?rand=19/02/2022-13:54:44" ///BA_BSC link
# tt=0.5



# driver = attach_to_session(url, sessionId)


# list_error=[]
# driver.get(link)
# time.sleep(tt)

# for k,roll in enumerate(all_rollno):
    

#     #if(k<=454):
#     #    continue
#     if(roll=='exit'):
#         break
    
    
#     try:
        
       
#         time.sleep(tt)
#         print("step 1  " ,k)
#         #adding registration no
#         txt= driver.find_element_by_id("ctl00_ContentPlaceHolder1_txtRegistrationNo")
#         time.sleep(tt)
#         txt.click()
#         time.sleep(tt)
#         txt.send_keys(roll)
        
            
        
#         print("step 2.1 " , k)
#         #click on search
#         time.sleep(tt)
#         driver.find_element_by_id("ctl00_ContentPlaceHolder1_btnSearch").send_keys(Keys.ENTER)
#         time.sleep(1)
        
        
#         try:
#             print("step 2.2 " , k)
#             driver.find_element_by_xpath("//span[ @aria-labelledby='select2-ctl00_ContentPlaceHolder1_grdvwRegistrationFormList_ctl02_ddlCollegiate-container']").click()
#             time.sleep(tt)
#             print("step 2.3 " , k)
#             driver.find_element_by_xpath("//li[ @class='select2-results__option']").click()
#             time.sleep(tt)
#         except:
#             pass
            
#         print("step 3 ", k)
#         #click on approve
#         driver.find_element_by_xpath("//a[ @class='btn bg-olive margin']").click()
#         time.sleep(tt)
        
        
        
#         print("step 4 ", k)
#         #accept the alert
#         driver.switch_to.alert.accept()
#         time.sleep(2)
        
        
        
#         try:
#             print("step 5 ", k)
#             driver.find_element_by_xpath("//a[ @class='btn btn-sm bg-red']").click()
#             time.sleep(tt)
#         except:
#             print("step 5 error ", k)
#             driver.get(link)
#             time.sleep(tt)
        
#         print(k,"   ",roll)
        
        
        
#     except:
#         list_error.append(roll)
#         print("Error = ",roll,"  ",k)
#         driver.get(link)
#         time.sleep(2)
        
    
# for i in list_error:
#     print(i)
































from selenium import webdriver
import time
from selenium.webdriver.common.keys import Keys
import pandas as pd
import sys
from selenium.webdriver.remote.webdriver import WebDriver


def attach_to_session(executor_url, session_id):
    original_execute = WebDriver.execute

    def new_command_execute(self, command, params=None):
        if command == "newSession":
            return {'success': 0, 'value': None, 'sessionId': session_id}
        else:
            return original_execute(self, command, params)

    WebDriver.execute = new_command_execute
    driver = webdriver.Remote(command_executor=executor_url, desired_capabilities={})
    driver.session_id = session_id
    WebDriver.execute = original_execute
    return driver


def main():
    if len(sys.argv) < 5:
        print("Usage: python approval.py <executor_url> <session_id> <approval_page_url> <csv_file_path>")
        sys.exit(1)

    executor_url = sys.argv[1]
    session_id = sys.argv[2]
    approval_page_url = sys.argv[3]
    csv_file_path = sys.argv[4]

    try:
        df = pd.read_csv(csv_file_path)
    except Exception as e:
        print(f"Failed to read CSV: {e}")
        sys.exit(1)

    all_rollno = df["Registration No."].tolist()
    tt = 0.5
    list_error = []

    driver = attach_to_session(executor_url, session_id)
    driver.get(approval_page_url)
    time.sleep(tt)

    for k, roll in enumerate(all_rollno):
        if roll == 'exit':
            break

        try:
            time.sleep(tt)
            print(f"Step 1 - Processing {k}: {roll}")

            txt = driver.find_element_by_id("ctl00_ContentPlaceHolder1_txtRegistrationNo")
            time.sleep(tt)
            txt.click()
            time.sleep(tt)
            txt.clear()
            txt.send_keys(roll)

            time.sleep(tt)
            driver.find_element_by_id("ctl00_ContentPlaceHolder1_btnSearch").send_keys(Keys.ENTER)
            time.sleep(1)

            try:
                driver.find_element_by_xpath("//span[@aria-labelledby='select2-ctl00_ContentPlaceHolder1_grdvwRegistrationFormList_ctl02_ddlCollegiate-container']").click()
                time.sleep(tt)
                driver.find_element_by_xpath("//li[@class='select2-results__option']").click()
                time.sleep(tt)
            except:
                pass

            driver.find_element_by_xpath("//a[@class='btn bg-olive margin']").click()
            time.sleep(tt)

            driver.switch_to.alert.accept()
            time.sleep(2)

            try:
                driver.find_element_by_xpath("//a[@class='btn btn-sm bg-red']").click()
                time.sleep(tt)
            except:
                driver.get(approval_page_url)
                time.sleep(tt)

            print(f"Processed: {k}  RollNo: {roll}")

        except Exception as e:
            list_error.append(roll)
            print(f"Error processing roll {roll} at index {k}: {e}")
            driver.get(approval_page_url)
            time.sleep(2)

    print("Errors in processing following roll numbers:")
    for err_roll in list_error:
        print(err_roll)


if __name__ == "__main__":
    main()
