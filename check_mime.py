import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

def main():
    creds_path = '/Users/yms/.gemini/Fabric_Master/bagorderapp-fe5c29e3e221.json'
    scopes = ['https://www.googleapis.com/auth/drive.metadata.readonly']
    file_id = '116dTfVGk8tErpm-eCgjm3xdG3UCOjQeo'
    
    try:
        creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
        service = build('drive', 'v3', credentials=creds)
        
        file_metadata = service.files().get(fileId=file_id, fields='name, mimeType').execute()
        print(f"File Name: {file_metadata.get('name')}")
        print(f"MIME Type: {file_metadata.get('mimeType')}")
        
    except Exception as e:
        print(f"Error checking file: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
