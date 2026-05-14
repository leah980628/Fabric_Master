const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Import mapSheetToFrontend (mocked if necessary or read from server.js)
const serverCode = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
// Extract mapSheetToFrontend using regex or just require it if exported (it's not exported)
// For speed, let's just copy the relevant functions or use a very simple mock to test the loop overhead

async function testMapping() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('Fetching data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: '제작내용!A:DZ',
    });
    
    const rows = response.data.values;
    const headers = rows[0];
    
    console.log('Starting mapping of', rows.length, 'rows...');
    const start = Date.now();
    
    // We'll just evaluate the mapping logic here for testing
    const data = rows.slice(1).map((row, index) => {
      const rowData = { _rowIndex: index + 2 };
      headers.forEach((header, i) => { rowData[header] = row[i] || ''; });
      
      // Simple mock of mapSheetToFrontend to see loop overhead
      // (In reality, server.js has more complex logic)
      return rowData;
    });
    
    const end = Date.now();
    console.log(`Mapping took ${end - start}ms`);
    console.log('JSON stringify size:', (JSON.stringify(data).length / 1024 / 1024).toFixed(2), 'MB');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testMapping();
