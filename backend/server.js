const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Google Sheets Auth
const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/cloud-platform'
];

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

// AppSheet Master Sheet & Calendar ID
const MASTER_SHEET_ID = '1BkiHbZda1rC_BSJP3cLoKFdJrCglyT89kp6HyHdhg7A';
const CALENDAR_ID = 'leah@wenigood.com';
const ROOT_DRIVE_FOLDER_ID = '1a2ZiGOVtxCMaa-luQhyP0T71w6zpGLZw'; 

// Vertex AI Setup
const PROJECT_ID = 'bagorderapp';
const LOCATION = 'global'; // 스크린샷 예시에 맞춰 global로 설정
const vertex_ai = new VertexAI({ 
  project: PROJECT_ID, 
  location: LOCATION,
  keyFilename: KEY_FILE_PATH 
});
const model = vertex_ai.getGenerativeModel({
  model: 'gemini-3.1-pro-preview',
});

app.get('/api/consultations', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // Read from "상담정보" tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '상담정보!A:Z',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }
    
    // Convert to JSON (Header mapping)
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });
      return rowData;
    });
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// --- Factory Management APIs ---

app.get('/api/factories', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '공장리스트!A:Z',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return res.json([]);
    
    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      const rowData = { rowIndex: index + 2 }; // Row index in Google Sheets (1-based, +1 for header)
      headers.forEach((header, i) => {
        rowData[header] = row[i] || '';
      });
      return rowData;
    });
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch factories' });
  }
});

app.post('/api/factories', async (req, res) => {
  try {
    const factoryData = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // Get headers first to ensure order
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '공장리스트!A1:Z1',
    });
    const headers = headerRes.data.values[0];
    
    const newRow = headers.map(header => factoryData[header] || '');
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID,
      range: '공장리스트!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add factory' });
  }
});

app.put('/api/factories/:rowIndex', async (req, res) => {
  try {
    const { rowIndex } = req.params;
    const factoryData = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '공장리스트!A1:Z1',
    });
    const headers = headerRes.data.values[0];
    const updatedRow = headers.map(header => factoryData[header] || '');
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: MASTER_SHEET_ID,
      range: `공장리스트!A${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update factory' });
  }
});

app.delete('/api/factories/:rowIndex', async (req, res) => {
  try {
    const { rowIndex } = req.params;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Google Sheets API doesn't have a simple "delete row" by index in values API.
    // We need to use batchUpdate with deleteDimension.
    // First, find the sheet ID for '공장리스트'
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === '공장리스트');
    const sheetId = sheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MASTER_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: parseInt(rowIndex) - 1,
                endIndex: parseInt(rowIndex)
              }
            }
          }
        ]
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete factory' });
  }
});

app.post('/api/drive/folder', async (req, res) => {
  console.log('--- Drive Folder Creation Started ---');
  try {
    const { folderName } = req.body;
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });

    const now = new Date();
    const yearStr = `${now.getFullYear()}년`;
    const monthStr = `${now.getFullYear()}년${(now.getMonth() + 1).toString().padStart(2, '0')}월`;

    async function getOrCreateFolder(name, parentId) {
      console.log(`Checking/Creating folder: "${name}" under parent: "${parentId}"`);
      const q = `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const list = await drive.files.list({ 
        q, 
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives'
      });
      
      if (list.data.files && list.data.files.length > 0) {
        return list.data.files[0].id;
      } else {
        const folder = await drive.files.create({
          resource: {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
          },
          fields: 'id',
          supportsAllDrives: true
        });
        return folder.data.id;
      }
    }

    // 1. 년도 폴더
    const yearFolderId = await getOrCreateFolder(yearStr, ROOT_DRIVE_FOLDER_ID);
    // 2. 월 폴더
    const monthFolderId = await getOrCreateFolder(monthStr, yearFolderId);

    // 3. 최종 주문 폴더
    const finalFolder = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [monthFolderId],
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true
    });

    console.log('Success! WebLink:', finalFolder.data.webViewLink);
    res.json({ success: true, webViewLink: finalFolder.data.webViewLink, folderId: finalFolder.data.id });

  } catch (error) {
    console.error('!!! Google Drive API Error !!!');
    console.error('Message:', error.message);
    res.status(500).json({ error: 'Failed to create drive folder', details: error.message });
  }
});

app.get('/api/drive/proofs/:folderId', async (req, res) => {
  try {
    const folderId = req.params.folderId;
    if (!folderId) return res.status(400).json({ error: 'Missing folderId' });
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });
    // 확장자 jpg, png 또는 이름에 '시안' 포함
    const query = `'${folderId}' in parents and (mimeType contains 'image/' or name contains '시안') and trashed = false`;
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives'
    });
    res.json({ success: true, files: response.data.files });
  } catch (error) {
    console.error('Drive Proofs Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drive/image/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });
    
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.on('error', err => {
      console.error('Error in drive stream', err);
      res.status(500).end();
    });
    response.data.pipe(res);
  } catch (error) {
    console.error('Drive Image Proxy Error:', error.message);
    res.status(500).send('Image stream failed');
  }
});

  app.post('/api/estimate/generate', async (req, res) => {
    try {
      const { folderId, orderData } = req.body;
      const templateId = '16ts1RfdYLUm1scZLIZ0nFvYrHM7YIDRy8kdt-3MbgYs';
      const client = await auth.getClient();
      const drive = google.drive({ version: 'v3', auth: client });
      const docs = google.docs({ version: 'v1', auth: client });
  
      // 1. Determine Title
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const datePrefix = `${yy}${mm}${dd}`;
      const dateStr = today.toISOString().split('T')[0];
      const baseTitle = `${datePrefix}_${orderData.company || '신규'}_견적서`;
      
      let finalTitle = baseTitle;
      if (folderId) {
        const query = `'${folderId}' in parents and name contains '${baseTitle}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`;
        const existingFiles = await drive.files.list({
          q: query,
          fields: 'files(name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives'
        });
        const count = existingFiles.data.files.length;
        if (count > 0) {
          finalTitle = `${baseTitle}_${String(count).padStart(2, '0')}`;
        }
      }
  
      // 2. Copy document
      const copyParams = {
        fileId: templateId,
        requestBody: { name: finalTitle },
        supportsAllDrives: true
      };
      if (folderId) {
        copyParams.requestBody.parents = [folderId];
      }
      
      const copiedFile = await drive.files.copy(copyParams);
      const newDocId = copiedFile.data.id;
  
      // 3. Prepare text replacements
      const map = {
        '<<[ID]>>': '',
        '<<[고유번호]>>': '',
        '<<[등록일자]>>': dateStr,
        '<<[수정일시]>>': dateStr,
        '<<[업체명]>>': orderData.company || '',
        '<<[담당자]>>': orderData.pic || '',
        '<<[연락처]>>': orderData.contact || '',
        '<<[이메일]>>': orderData.email || '',
        '<<[시안 이미지]>>': '',
        '<<[원단]>>': orderData.fabric || '',
        '<<[사이즈]>>': orderData.size || '',
        '<<[웨빙]>>': orderData.webbing || '',
        '<<[인쇄]>>': orderData.print || '',
        '<<[옵션]>>': orderData.options || '',
        '<<[기타]>>': orderData.consultMemo || '',
        '<<[수량]>>': String(orderData.qty) || '0',
        '<<[납품가]>>': Number(orderData.unitPrice).toLocaleString() || '0',
        '<<[납품가합계]>>': Number(orderData.totalAmount).toLocaleString() || '0',
        '<<[부가세]>>': Number(orderData.vat).toLocaleString() || '0',
        '<<[납품가합계+부가세]>>': Number(orderData.finalAmount).toLocaleString() || '0',
        '<<[결재벙법]>>': orderData.paymentMethod || '계좌이체'
      };
  
      const requests = Object.keys(map).map(key => ({
        replaceAllText: {
          containsText: { text: key, matchCase: true },
          replaceText: String(map[key])
        }
      }));
  
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests }
      });
  
      // 4. Export as PDF and save in Drive
      const exportRes = await drive.files.export({
        fileId: newDocId,
        mimeType: 'application/pdf'
      }, { responseType: 'stream' });
  
      const pdfFileParams = {
        requestBody: {
          name: finalTitle,
          mimeType: 'application/pdf'
        },
        media: {
          mimeType: 'application/pdf',
          body: exportRes.data
        },
        fields: 'id, webViewLink',
        supportsAllDrives: true
      };
      if (folderId) {
        pdfFileParams.requestBody.parents = [folderId];
      }
      
      const pdfFile = await drive.files.create(pdfFileParams);
  
      // 5. Return links
      const fileRes = await drive.files.get({
        fileId: newDocId,
        fields: 'webViewLink',
        supportsAllDrives: true
      });
  
      res.json({
        success: true,
        webViewLink: fileRes.data.webViewLink,
        pdfLink: pdfFile.data.webViewLink
      });
  
    } catch (error) {
      console.error('Estimate Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate estimate', details: error.message });
    }
  });

app.post('/api/calendar/event', async (req, res) => {
  console.log('Received calendar request:', req.body);
  try {
    const { summary, description, startDate } = req.body;
    if (!startDate) {
      console.error('Error: startDate is missing');
      return res.status(400).json({ error: 'Missing startDate' });
    }

    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Calculate end date (next day for all-day event)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const endDateStr = end.toISOString().split('T')[0];

    const event = {
      summary: summary,
      description: description,
      start: { date: startDate },
      end: { date: endDateStr },
    };

    console.log('Attempting to insert event into calendar:', CALENDAR_ID);
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Successfully created event:', response.data.id);
    res.json({ success: true, eventId: response.data.id });
  } catch (error) {
    console.error('Google Calendar API Error:', error.message);
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to create calendar event', details: error.message });
  }
});

// Vertex AI Gemini API Endpoint (REST API Direct Call for Gemini 3.1)
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // 서비스 계정 인증 토큰 가져오기
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/publishers/google/models/gemini-3.1-pro-preview:streamGenerateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    // 스트리밍 응답이 배열 형태로 올 수 있으므로 처리
    let fullText = "";
    if (Array.isArray(data)) {
      data.forEach(chunk => {
        if (chunk.candidates && chunk.candidates[0].content.parts[0].text) {
          fullText += chunk.candidates[0].content.parts[0].text;
        }
      });
    } else if (data.candidates) {
      fullText = data.candidates[0].content.parts[0].text;
    }

    res.json({ result: fullText });
  } catch (error) {
    console.error('Vertex AI Error:', error.message);
    res.status(500).json({ error: 'Gemini API call failed', details: error.message });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API Server running on http://localhost:${PORT}`);
});
