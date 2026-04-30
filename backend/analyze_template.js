const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE_PATH, scopes: SCOPES });
const sheet_id = '116dTfVGk8tErpm-eCgjm3xdG3UCOjQeo';

async function main() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheet_id });
    console.log(`Spreadsheet Title: ${meta.data.properties.title}\n`);
    
    for (const sheet of meta.data.sheets) {
      const title = sheet.properties.title;
      console.log(`=== Sheet: ${title} ===`);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        range: `'${title}'!A1:Z30`
      });
      const rows = res.data.values;
      if (!rows) {
        console.log("No data found.");
        continue;
      }
      rows.forEach((row, idx) => {
        console.log(`Row ${idx+1}:`, JSON.stringify(row));
      });
      console.log("\n");
    }
  } catch(e) {
    console.error(e);
  }
}
main();
