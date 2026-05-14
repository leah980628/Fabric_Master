const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function testSheet() {
  try {
    console.log('Using Sheet ID:', process.env.MASTER_SHEET_ID);
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: '제작내용!A:A', // ID 컬럼만 확인해서 행 수 파악
    });
    
    console.log('Successfully fetched data from "제작내용"!');
    const rows = response.data.values;
    console.log('Total Rows (including header):', rows ? rows.length : 0);
    if (rows && rows.length > 0) {
      console.log('Sample rows (IDs):', rows.slice(0, 5));
    } else {
      console.log('No rows found in "제작내용"!');
    }
  } catch (err) {
    console.error('Error fetching sheet:', err.message);
    if (err.response) {
       console.error('Response Data:', err.response.data);
    }
  }
}

testSheet();
