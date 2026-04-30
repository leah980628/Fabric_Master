const { google } = require('googleapis');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE_PATH, scopes: SCOPES });
const doc_id = '16ts1RfdYLUm1scZLIZ0nFvYrHM7YIDRy8kdt-3MbgYs';

async function main() {
  try {
    const client = await auth.getClient();
    const docs = google.docs({ version: 'v1', auth: client });
    
    const res = await docs.documents.get({ documentId: doc_id });
    const content = res.data.body.content;
    let text = '';
    content.forEach(el => {
      if (el.paragraph) {
        el.paragraph.elements.forEach(elem => {
          if (elem.textRun) {
            text += elem.textRun.content;
          }
        });
      }
    });
    console.log("Document Text:", text);
  } catch(e) {
    console.error("Error reading doc:", e);
  }
}
main();
