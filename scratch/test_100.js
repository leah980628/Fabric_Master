const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function testSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('Fetching A1:DZ100 from 제작내용...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: '제작내용!A1:DZ100',
    });
    
    console.log('Rows found:', response.data.values ? response.data.values.length : 0);
    if (response.data.values && response.data.values.length > 1) {
       console.log('Sample data (Row 2):', response.data.values[1]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSheet();
