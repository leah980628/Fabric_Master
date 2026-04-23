import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

def main():
    creds_path = '/Users/yms/.gemini/Fabric_Master/bagorderapp-fe5c29e3e221.json'
    sheet_id = '1xjEaEfCED47nURstJRp0N9ABRN1aTg9sZjZ6DhzIkb8'
    
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    
    try:
        creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
        service = build('sheets', 'v4', credentials=creds)
        
        metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = metadata.get('sheets', '')
        
        print(f"Spreadsheet Title: {metadata.get('properties', {}).get('title')}\n")
        
        for sheet in sheets:
            title = sheet.get("properties", {}).get("title", "")
            print(f"=== Sheet: {title} ===")
            
            # Read sample headers
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id, range=f"'{title}'!A1:N10").execute()
            
            rows = result.get('values', [])
            for idx, row in enumerate(rows):
                print(f"L{idx+1}: {row}")
            print("\n")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
