const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

async function listSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });
    
    console.log('Listing spreadsheets...');
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)',
    });
    
    console.log('Found:', response.data.files);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listSheets();
