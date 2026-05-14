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
    
    console.log('Fetching rows count...');
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      ranges: ['제작내용'],
      includeGridData: false
    });
    
    const sheet = metadata.data.sheets.find(s => s.properties.title === '제작내용');
    console.log('Grid Properties:', sheet.properties.gridProperties);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSheet();
