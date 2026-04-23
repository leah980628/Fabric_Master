import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

def main():
    creds_path = '/Users/yms/.gemini/Fabric_Master/bagorderapp-fe5c29e3e221.json'
    sheet_id = '1BkiHbZda1rC_BSJP3cLoKFdJrCglyT89kp6HyHdhg7A'
    
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    
    try:
        creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
        service = build('sheets', 'v4', credentials=creds)
        
        # Get spreadsheet metadata
        sheet_metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = sheet_metadata.get('sheets', '')
        
        print(f"Spreadsheet Title: {sheet_metadata.get('properties', {}).get('title')}\n")
        
        for sheet in sheets:
            title = sheet.get("properties", {}).get("title", "")
            print(f"=== Sheet: {title} ===")
            
            # Get first 5 rows to understand columns and samples
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id, range=f"'{title}'!A1:Z10").execute()
            
            rows = result.get('values', [])
            if not rows:
                print("No data found.")
                continue
                
            for idx, row in enumerate(rows):
                print(f"Row {idx}: {row}")
            print("\n")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
