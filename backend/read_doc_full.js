const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE_PATH, scopes: SCOPES });
const doc_id = '16ts1RfdYLUm1scZLIZ0nFvYrHM7YIDRy8kdt-3MbgYs';

function extractText(content) {
  let text = '';
  if (!content) return text;
  
  content.forEach(el => {
    if (el.paragraph) {
      el.paragraph.elements.forEach(elem => {
        if (elem.textRun) {
          text += elem.textRun.content;
        }
      });
    } else if (el.table) {
      el.table.tableRows.forEach(row => {
        row.tableCells.forEach(cell => {
          text += extractText(cell.content);
        });
      });
    } else if (el.tableOfContents) {
      text += extractText(el.tableOfContents.content);
    }
  });
  return text;
}

async function main() {
  try {
    const client = await auth.getClient();
    const docs = google.docs({ version: 'v1', auth: client });
    
    const res = await docs.documents.get({ documentId: doc_id });
    const fullText = extractText(res.data.body.content);
    console.log("Full Document Text:\n", fullText);
    
    // Extract placeholders (<<[...]>>)
    const matches = fullText.match(/<<\[.*?\]>>/g);
    if (matches) {
      console.log("Placeholders found:");
      const uniqueMatches = [...new Set(matches)];
      uniqueMatches.forEach(m => console.log(m));
    } else {
      console.log("No placeholders found.");
    }
  } catch(e) {
    console.error("Error reading doc:", e);
  }
}
main();
