# # from selenium import webdriver  
# # import time  
# # from selenium.webdriver.common.keys import Keys  
# # import pandas as pd
# # from selenium.common.exceptions import TimeoutException
# # from selenium.webdriver.remote.webdriver import WebDriver



# # driver = webdriver.Chrome(executable_path='../driver/chromedriver.exe')


# # url = driver.command_executor._url       
# # session_id = driver.session_id            

# # print(url,"   ",session_id)
# # a=input("Enter to exit")



# # from selenium import webdriver  
# # import json
# # from selenium.webdriver.chrome.service import Service
# # from selenium.webdriver.chrome.options import Options

# # options = Options()
# # options.add_experimental_option("detach", True)  # Keeps browser open after script ends
# # driver = webdriver.Chrome(service=Service('../driver/chromedriver.exe'), options=options)

# # # Output as JSON
# # session_info = {
# #     "url": driver.command_executor._url,
# #     "session_id": driver.session_id
# # }
# # print(json.dumps(session_info))
















# import os
# import json
# import platform
# from selenium import webdriver
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.chrome.options import Options

# # Determine platform-specific chromedriver path
# def get_driver_path():
#     base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'driver'))
#     system = platform.system()

#     if system == 'Windows':
#         return os.path.join(base_path, 'chromedriver.exe')
#     elif system == 'Darwin':  # macOS
#         return os.path.join(base_path, 'chromedriver')
#     elif system == 'Linux':
#         return os.path.join(base_path, 'chromedriver')
#     else:
#         raise RuntimeError(f"Unsupported OS: {system}")

# # Chrome options
# options = Options()
# options.add_experimental_option("detach", True)

# # Start the driver
# driver_path = get_driver_path()
# driver = webdriver.Chrome(service=Service(driver_path), options=options)

# # Output session info as JSON
# session_info = {
#     "url": driver.command_executor._url,
#     "session_id": driver.session_id
# }
# print(json.dumps(session_info))












from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import os

# Install chromedriver and get the base folder
driver_dir = os.path.dirname(ChromeDriverManager().install())

# Build path explicitly to chromedriver binary (the actual executable)
driver_path = os.path.join(driver_dir, "chromedriver")

options = Options()
options.add_experimental_option("detach", True)  # so browser stays open

service = Service(driver_path)

driver = webdriver.Chrome(service=service, options=options)

import json
session_info = {
    "url": driver.command_executor._url,
    "session_id": driver.session_id
}
print(json.dumps(session_info))
