const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Google Sheets Auth
const KEY_FILE_PATH = path.join(__dirname, '../bagorderapp-fe5c29e3e221.json');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/cloud-platform'
];

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});

// AppSheet Master Sheet & Calendar ID
const MASTER_SHEET_ID = '1BkiHbZda1rC_BSJP3cLoKFdJrCglyT89kp6HyHdhg7A';
const CALENDAR_ID = 'leah@wenigood.com';

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
