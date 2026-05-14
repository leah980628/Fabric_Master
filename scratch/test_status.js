const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function testStatus() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: '제작내용!A:DZ',
    });
    
    const rows = response.data.values;
    const headers = rows[0];
    const statusIndex = headers.indexOf('진행상태');
    
    const statusCounts = {};
    rows.slice(1).forEach(row => {
      const s = row[statusIndex] || 'Empty';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    
    console.log('Status Counts:', statusCounts);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testStatus();
