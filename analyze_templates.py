import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

def analyze_spreadsheet(service, sheet_id, name):
    print(f"\n{'='*10} Analyzing {name} ({sheet_id}) {'='*10}")
    try:
        metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = metadata.get('sheets', '')
        for s in sheets:
            title = s.get("properties", {}).get("title")
            print(f"- Sheet Tab: {title}")
            # Read sample to understand template structure
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id, range=f"'{title}'!A1:N20").execute()
            rows = result.get('values', [])
            for idx, row in enumerate(rows):
                print(f"L{idx+1}: {row}")
    except Exception as e:
        print(f"Error {name}: {e}")

def main():
    creds_path = '/Users/yms/.gemini/Fabric_Master/bagorderapp-fe5c29e3e221.json'
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/documents.readonly']
    
    try:
        creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
        
        # Analyze Delivery Note Spreadsheet
        sheets_service = build('sheets', 'v4', credentials=creds)
        analyze_spreadsheet(sheets_service, '116dTfVGk8tErpm-eCgjm3xdG3UCOjQeo', "Delivery Note")
        
        # Analyze Estimate Google Doc (Metadata)
        docs_service = build('docs', 'v1', credentials=creds)
        doc_id = '16ts1RfdYLUm1scZLIZ0nFvYrHM7YIDRy8kdt-3MbgYs'
        doc = docs_service.documents().get(documentId=doc_id).execute()
        print(f"\n{'='*10} Estimate Doc Title: {doc.get('title')} {'='*10}")
        # Note: Parsing full doc content is complex, but I'll check common placeholders if possible or just the structure.
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
