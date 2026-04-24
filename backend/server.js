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

app.post('/api/drive/folder', async (req, res) => {
  console.log('--- Drive Folder Creation Started ---');
  try {
    const { folderName } = req.body;
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });

    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');

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
    res.json({ success: true, webViewLink: finalFolder.data.webViewLink });

  } catch (error) {
    console.error('!!! Google Drive API Error !!!');
    console.error('Message:', error.message);
    res.status(500).json({ error: 'Failed to create drive folder', details: error.message });
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
