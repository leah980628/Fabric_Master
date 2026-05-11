require('dotenv').config();
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
const MASTER_SHEET_ID = process.env.MASTER_SHEET_ID;
const CALENDAR_ID = process.env.CALENDAR_ID;
const ROOT_DRIVE_FOLDER_ID = process.env.ROOT_DRIVE_FOLDER_ID; 

// Vertex AI Setup
const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION || 'global'; // 스크린샷 예시에 맞춰 global로 설정
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
    res.status(500).json({ error: '상담 정보를 불러오는 데 실패했습니다.' });
  }
});

// --- 제작내용 시트 필드 매핑 ---
const mapFrontendToSheet = (data) => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${dateStr} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  // 사이즈 문자열 조합
  const sizeStr = [
    data.w ? `W${data.w}` : '',
    data.h ? `H${data.h}` : '',
    data.d ? `D${data.d}` : '',
    data.sideD ? `S${data.sideD}` : ''
  ].filter(Boolean).join(' x ');

  // 세부 계산 파라미터 (시트 컬럼에 없는 데이터를 JSON으로 보존)
  const detailCalcData = JSON.stringify({
    specs: { type: data.type, w: data.w, h: data.h, d: data.d, sideD: data.sideD, 
             fabricWidth: data.fabricWidth, topSeam: data.topSeam, bottomSeam: data.bottomSeam,
             sideSeam: data.sideSeam, loss: data.loss, useSeparateBodyFabric: data.useSeparateBodyFabric,
             bodyParts: data.bodyParts, fabricName: data.fabricName },
    extras: data.hasStrap !== undefined ? {
      hasStrap: data.hasStrap, strapW: data.strapW, strapL: data.strapL, strapQty: data.strapQty,
      strapTopSeam: data.strapTopSeam, strapBottomSeam: data.strapBottomSeam, strapSideSeam: data.strapSideSeam,
      strapFabric: data.strapFabric,
      hasPocket: data.hasPocket, pocketW: data.pocketW, pocketH: data.pocketH, pocketQty: data.pocketQty,
      pocketFabric: data.pocketFabric,
      hasBottomPatch: data.hasBottomPatch, hasLining: data.hasLining, hasOther: data.hasOther,
      hasFrontPocket: data.hasFrontPocket, hasSidePocket: data.hasSidePocket, hasTumblerPocket: data.hasTumblerPocket
    } : {},
    costs: {
      webbingFinishLen: data.webbingFinishLen, webbingSeam: data.webbingSeam, webbingPrice: data.webbingPrice,
      webbingRollLen: data.webbingRollLen, webbingLoss: data.webbingLoss, webbingQtyPerBag: data.webbingQtyPerBag,
      hasOuterBias: data.hasOuterBias, hasInnerBias: data.hasInnerBias, hasMetal: data.hasMetal, hasMetal2: data.hasMetal2,
      hasPrint2: data.hasPrint2, hasFreight2: data.hasFreight2
    },
    margin: { percent: data.percent, customDeliveryUnit: data.customDeliveryUnit },
    customerInfo: { contact2: data.contact2, consultType: data.consultType },
    extraInfo: { driveFolderId: data.driveFolderId, paymentPic: data.paymentPic,
      paymentContact: data.paymentContact, paymentContact2: data.paymentContact2, paymentEmail: data.paymentEmail },
    comments: data.comments || '[]'
  });

  return {
    '등록일자': data._registeredDate || dateStr,
    'ID': data.id || '',
    '고유번호': data.id || '',
    '업체명': data.company || '',
    '담당자': data.pic || '',
    '연락처': data.contact || '',
    '이메일': data.email || '',
    '사용예정일': data.targetDate || '',
    '진행상태': data.status || '상담진행',
    '추가상담코멘트': data.consultMemo || '',
    '종류': data.productType || '에코백',
    '수량': data.qty || 0,
    '원단': data.fabric || data.fabricName || '',
    '사이즈': sizeStr,
    '웨빙': data.webbing || '',
    '인쇄': data.printing || '',
    '옵션': data.options || '',
    '기타': '',
    '생산공장': data.factory || '미정',
    '공임': data.laborContent || '',
    '공임가격': data.laborUnit || 0,
    '생산합계': data.totalCostAll || 0,
    '납품가': data.finalDeliveryUnit || 0,
    '납품가합계': data.finalDeliveryAll || 0,
    '부가세': Math.round((data.finalDeliveryAll || 0) * 0.1),
    '납품가합계+부가세': data.finalDeliveryAllVAT || 0,
    '마진가격': data.marginAmountUnit || 0,
    '마진%': data.percent || 0,
    '마진합계': (data.finalDeliveryAll || 0) - (data.totalCostAll || 0),
    '원단01업체': data.fabricSupplier || '미정',
    '원단01내용': data.fabricContent || data.fabricName || '',
    '원단01가격': data.fabricPrice || 0,
    '원단02업체': '', '원단02내용': '', '원단02가격': '',
    '웨빙01업체': data.webbingSupplier || '미정',
    '웨빙01내용': data.webbingContent || '',
    '웨빙01가격': data.webbingUnit || 0,
    '웨빙02업체': data.outerBiasSupplier || '',
    '웨빙02내용': data.outerBiasContent || '',
    '웨빙02가격': data.outerBiasUnit || 0,
    '금속부자재01업체': data.metalSupplier || '미정',
    '금속부자재01내용': data.metalContent || '',
    '금속부자재01 가격': data.metalUnit || 0,
    '금속부자재02업체': data.metalSupplier2 || '',
    '금속부자재02내용': data.metalContent2 || '',
    '금속부자재02 가격': data.metalUnit2 || 0,
    '기타부자재01업체': '', '기타부자재01내용': '', '기타부자재01가격': '',
    '기타부자재02업체': '', '기타부자재02내용': '', '기타부자재02가격': '',
    '운임과소모품업체': data.freightSupplier || '미정',
    '운임과소모품내용': data.freightContent || '',
    '운임과소모품 가격': data.freightTotal || 0,
    '인쇄공장01': data.printSupplier || '미정',
    '인쇄종류01': '', '인쇄내용01': data.printContent || '', '인쇄가격01': data.printUnit || 0,
    '인쇄공장02': data.printSupplier2 || '',
    '인쇄종류02': '', '인쇄내용02': data.printContent2 || '', '인쇄가격02': data.printUnit2 || 0,
    '생산합계': data.marginInfo?.totalCostUnit || 0,
    '납품가': data.marginInfo?.finalDeliveryUnit || 0,
    '납품가합계': data.marginInfo?.finalDeliveryAll || 0,
    '부가세': data.marginInfo?.finalDeliveryAllVAT ? Math.round(data.marginInfo.finalDeliveryAllVAT - data.marginInfo.finalDeliveryAll) : 0,
    '납품가합계+부가세': data.marginInfo?.finalDeliveryAllVAT || 0,
    '마진가격': data.marginInfo?.marginAmountUnit || 0,
    '마진%': data.percent || 30,
    '마진합계': data.marginInfo?.marginAmountUnit ? Math.round(data.marginInfo.marginAmountUnit * (data.qty || 0)) : 0,
    '추가견적안내': '',
    '결재벙법': data.paymentMethod || '계좌이체',
    '세금계산서발행1': data.tax1 || '',
    '세금계산서발행2': data.tax2 || '',
    '결제내용': data.paymentContent || '',
    '결제선금(완납)': data.deposit || 0,
    '결제잔금': data.balance || 0,
    '드라이브링크': data.driveLink || '',
    '시안 이미지': data.proofImage || '',
    '사진촬영': '',
    '납품주소': data.deliveryAddress || '',
    '작지확인일자': data.workOrderDate || '',
    '생산체크내용': data.prodCheck || '',
    '공장출고일자': data.factoryShipDate || '',
    '송장번호': data.trackingNum || '',
    '등록자': data._registeredBy || data.currentUser || '',
    '수정일시': timeStr,
    '수정작업자': data.currentUser || '',
    '파일생성': '',
    '상세계산데이터': detailCalcData
  };
};

// 시트 행 → 프론트엔드 데이터 변환
const mapSheetToFrontend = (rowData) => {
  let detailData = {};
  try {
    if (rowData['상세계산데이터']) {
      detailData = JSON.parse(rowData['상세계산데이터']);
    }
  } catch (e) { /* JSON 파싱 실패 시 무시 */ }

  // 시트 상태값 → 앱 파이프라인 단계 매핑
  const statusMap = {
    '상담진행': '상담진행',
    '상담진행대기중': '상담진행',
    '견적안내': '견적안내',
    '견적안내email': '견적안내',
    '오더확정': '오더확정',
    '샘플제작': '샘플제작',
    '샘플안내와제작': '샘플제작',
    '시안작업': '시안작업',
    '작업요청서': '작업요청서',
    '공장발주': '공장발주',
    '공장출고확인': '공장출고확인',
    '납품완료': '납품완료',
    '사진촬영': '사진촬영',
    '취소': '취소'
  };
  const rawStatus = rowData['진행상태'] || '상담진행';
  const mappedStatus = statusMap[rawStatus] || '상담진행'; // 매핑에 없으면 상담진행으로

  // 사이즈 문자열 파싱 강화
  let w = 0, h = 0, d = 0, sideD = 0;
  const sizeStr = (rowData['사이즈'] || '').toUpperCase().replace(/\s/g, ''); // 공백 제거 및 대문자화
  
  if (sizeStr) {
    // 1. W, H, D, S 접두사가 있는 경우 우선 추출
    const wMatch = sizeStr.match(/W(\d+(\.\d+)?)/); if (wMatch) w = parseFloat(wMatch[1]);
    const hMatch = sizeStr.match(/H(\d+(\.\d+)?)/); if (hMatch) h = parseFloat(hMatch[1]);
    const dMatch = sizeStr.match(/D(\d+(\.\d+)?)/); if (dMatch) d = parseFloat(dMatch[1]);
    const sMatch = sizeStr.match(/S(\d+(\.\d+)?)/); if (sMatch) sideD = parseFloat(sMatch[1]);

    // 2. 접두사가 없는 경우 숫자들만 추출하여 순서대로 배정 (가로*세로*폭*옆면)
    if (!w && !h) {
      const numbers = sizeStr.split(/[X*]/).map(s => parseFloat(s.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n));
      if (numbers.length >= 1) w = numbers[0];
      if (numbers.length >= 2) h = numbers[1];
      if (numbers.length >= 3) d = numbers[2];
      if (numbers.length >= 4) sideD = numbers[3];
    }
  }

  return {
    id: rowData['고유번호'] || rowData['ID'] || '',
    company: rowData['업체명'] || '',
    pic: rowData['담당자'] || '',
    contact: rowData['연락처'] || '',
    email: rowData['이메일'] || '',
    status: mappedStatus,
    consultMemo: (rowData['사이즈'] ? `[원본사이즈: ${rowData['사이즈']}]\n` : '') + (rowData['추가상담코멘트'] || ''),
    productType: rowData['종류'] || '에코백',
    qty: parseInt(rowData['수량']) || 0,
    fabric: rowData['원단'] || '',
    w, h, d, sideD,
    webbing: rowData['웨빙'] || '',
    printing: rowData['인쇄'] || '',
    options: rowData['옵션'] || '',
    targetDate: rowData['사용예정일'] || '',
    factory: rowData['생산공장'] || '미정',
    laborUnit: parseFloat(rowData['공임가격']) || 0,
    laborContent: rowData['공임'] || '',
    fabricSupplier: rowData['원단01업체'] || '미정',
    fabricName: rowData['원단01내용'] || '',
    fabricPrice: parseFloat(rowData['원단01가격']) || 0,
    webbingSupplier: rowData['웨빙01업체'] || '미정',
    webbingContent: rowData['웨빙01내용'] || '',
    webbingUnit: parseFloat(rowData['웨빙01가격']) || 0,
    outerBiasSupplier: rowData['웨빙02업체'] || '',
    outerBiasContent: rowData['웨빙02내용'] || '',
    outerBiasUnit: parseFloat(rowData['웨빙02가격']) || 0,
    metalSupplier: rowData['금속부자재01업체'] || '미정',
    metalContent: rowData['금속부자재01내용'] || '',
    metalUnit: parseFloat(rowData['금속부자재01 가격']) || 0,
    metalSupplier2: rowData['금속부자재02업체'] || '',
    metalContent2: rowData['금속부자재02내용'] || '',
    metalUnit2: parseFloat(rowData['금속부자재02 가격']) || 0,
    freightSupplier: rowData['운임과소모품업체'] || '미정',
    freightContent: rowData['운임과소모품내용'] || '',
    freightTotal: parseFloat(rowData['운임과소모품 가격']) || 0,
    printSupplier: rowData['인쇄공장01'] || '미정',
    printContent: rowData['인쇄내용01'] || '',
    printUnit: parseFloat(rowData['인쇄가격01']) || 0,
    printSupplier2: rowData['인쇄공장02'] || '',
    printContent2: rowData['인쇄내용02'] || '',
    printUnit2: parseFloat(rowData['인쇄가격02']) || 0,
    paymentMethod: rowData['결재벙법'] || '계좌이체',
    tax1: rowData['세금계산서발행1'] || '',
    tax2: rowData['세금계산서발행2'] || '',
    paymentContent: rowData['결제내용'] || '',
    deposit: parseFloat(rowData['결제선금(완납)']) || 0,
    balance: parseFloat(rowData['결제잔금']) || 0,
    driveLink: rowData['드라이브링크'] || '',
    deliveryAddress: rowData['납품주소'] || '',
    workOrderDate: rowData['작지확인일자'] || '',
    prodCheck: rowData['생산체크내용'] || '',
    factoryShipDate: rowData['공장출고일자'] || '',
    trackingNum: rowData['송장번호'] || '',
    date: rowData['등록일자'] || '',
    _registeredBy: rowData['등록자'] || '',
    _registeredDate: rowData['등록일자'] || '',
    // 세부 계산 파라미터 복원
    ...(detailData.specs || {}),
    ...(detailData.extras || {}),
    ...(detailData.costs || {}),
    ...(detailData.margin || {}),
    ...(detailData.customerInfo || {}),
    ...(detailData.extraInfo || {}),
    fabricName: detailData.fabricName || '메인 원단',
    fabricContent: detailData.fabricContent || [
      rowData['원단01내용'] ? `[원단01] ${rowData['원단01내용']}` : '',
      rowData['원단02내용'] ? `[원단02] ${rowData['원단02내용']}` : ''
    ].filter(Boolean).join('\n') || '',
    comments: detailData.comments || '',
    isLegacy: !rowData['상세계산데이터'], // 상세데이터 JSON이 없으면 기존 데이터로 간주
    legacyResult: !rowData['상세계산데이터'] ? (() => {
      const totalCostUnit = parseInt(rowData['생산합계']) || 0;
      const deliveryUnit = parseInt(rowData['납품가']) || 0;
      let calculatedPercent = 0;
      if (deliveryUnit > 0 && totalCostUnit > 0) {
        calculatedPercent = Math.round(((deliveryUnit - totalCostUnit) / deliveryUnit) * 1000) / 10;
      } else {
        calculatedPercent = parseFloat(rowData['마진%']) || 0;
      }
      return {
        totalCostAll: totalCostUnit, // 시트의 '생산합계'는 개당 금액
        finalDeliveryUnit: deliveryUnit,
        finalDeliveryAll: parseInt(rowData['납품가합계']) || 0,
        finalDeliveryAllVAT: parseInt(rowData['납품가합계+부가세']) || 0,
        marginAmountUnit: parseInt(rowData['마진가격']) || 0,
        percent: calculatedPercent
      };
    })() : null
  };
};

// --- 주문 활동 로그 API ---
async function logActivity(currentUser, action, company, orderId, details) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const now = new Date();
    // KST 시간대 변환 (로컬 시간이 KST가 아닐 경우 대비)
    const offset = now.getTimezoneOffset() * 60000;
    const kstDate = new Date(now.getTime() - offset + (9 * 3600000));
    const timeStr = `${kstDate.getFullYear()}-${String(kstDate.getMonth()+1).padStart(2,'0')}-${String(kstDate.getDate()).padStart(2,'0')} ${String(kstDate.getHours()).padStart(2,'0')}:${String(kstDate.getMinutes()).padStart(2,'0')}`;
    
    const row = [timeStr, currentUser || '시스템', action, company || '', orderId || '', details || ''];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID,
      range: '활동로그!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
  } catch (err) {
    console.error('활동 로그 기록 실패:', err.message);
  }
}

app.get('/api/logs', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '활동로그!A:F',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return res.json([]);
    
    const headers = rows[0];
    let data = rows.slice(1).map((row, index) => {
      const rowData = { id: index };
      headers.forEach((header, i) => { rowData[header] = row[i] || ''; });
      return rowData;
    });
    
    // 가장 최신 로그가 위로 오도록 정렬 (최대 100건만 반환)
    data = data.reverse().slice(0, 100);
    res.json(data);
  } catch (error) {
    console.error('활동 로그 조회 에러:', error.message);
    res.status(500).json({ error: '활동 로그를 불러오는 데 실패했습니다.' });
  }
});

// --- 주문 CRUD API ---

// 전체 주문 목록 불러오기 (제작내용 시트)
app.get('/api/orders', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID,
      range: '제작내용!A:DZ',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return res.json([]);
    
    const headers = rows[0];
    const idCounts = {}; // 중복 ID 추적
    const data = rows.slice(1).map((row, index) => {
      const rowData = { _rowIndex: index + 2 };
      headers.forEach((header, i) => { rowData[header] = row[i] || ''; });
      const item = mapSheetToFrontend(rowData);
      item._rowIndex = index + 2;
      
      // 중복 ID 처리: 같은 ID가 여러 행에 있으면 행 번호를 붙여 구분
      if (!item.id) return null;
      if (idCounts[item.id] === undefined) {
        idCounts[item.id] = 0;
      } else {
        idCounts[item.id]++;
        item._originalId = item.id; // 원본 ID 보존
        item.id = `${item.id}_r${index + 2}`; // 고유 ID 생성
      }
      return item;
    }).filter(Boolean); // null 제외
    
    res.json(data);
  } catch (error) {
    console.error('주문 목록 조회 에러:', error.message);
    res.status(500).json({ error: '주문 목록을 불러오는 데 실패했습니다.' });
  }
});

// 새 주문 등록 (상담정보 + 제작내용 양쪽에 행 추가)
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // 1. 제작내용 시트에 추가
    const sheetData = mapFrontendToSheet({ ...orderData, _registeredDate: dateStr, _registeredBy: orderData.currentUser });
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID, range: '제작내용!1:1',
    });
    const headers = headerRes.data.values[0];
    const newRow = headers.map(h => sheetData[h] !== undefined ? sheetData[h] : '');

    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID, range: '제작내용!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    // 2. 상담정보 시트에도 기본 정보 추가
    const consultHeaderRes = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID, range: '상담정보!1:1',
    });
    const consultHeaders = consultHeaderRes.data.values[0];
    const consultData = {
      '등록일자': dateStr, '구분': orderData.consultType || '신규',
      '고유번호': orderData.id || '', '업체명': orderData.company || '',
      '담당자': orderData.pic || '', '연락처': orderData.contact || '',
      '이메일': orderData.email || '', '수량': orderData.qty || 0,
      '사용예정일': orderData.targetDate || '', '기타문의사항': orderData.consultMemo || orderData.memo || '',
      '등록자': orderData.currentUser || '', '수정일시': dateStr,
      '납품주소': orderData.deliveryAddress || ''
    };
    const consultRow = consultHeaders.map(h => consultData[h] !== undefined ? consultData[h] : '');

    await sheets.spreadsheets.values.append({
      spreadsheetId: MASTER_SHEET_ID, range: '상담정보!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [consultRow] },
    });

    // 활동 로그 기록
    logActivity(orderData.currentUser, '등록', orderData.company, orderData.id, '신규 업체를 등록했습니다.');

    res.json({ success: true });
  } catch (error) {
    console.error('주문 등록 에러:', error.message);
    res.status(500).json({ error: '주문 등록에 실패했습니다.' });
  }
});

// 주문 데이터 전체 업데이트 (고유번호로 행 찾기)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. 헤더와 전체 데이터 읽기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID, range: '제작내용!A:DZ',
    });
    const rows = response.data.values;
    const headers = rows[0];
    const idColIndex = headers.indexOf('고유번호');
    
    // 2. 고유번호로 행 찾기
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) { targetRowIndex = i + 1; break; }
    }
    
    if (targetRowIndex === -1) {
      return res.status(404).json({ error: `주문번호 ${id}를 찾을 수 없습니다.` });
    }

    // 3. 기존 등록일자와 등록자 보존
    const existingRow = rows[targetRowIndex - 1];
    const regDateIdx = headers.indexOf('등록일자');
    const regByIdx = headers.indexOf('등록자');
    orderData._registeredDate = existingRow[regDateIdx] || '';
    orderData._registeredBy = existingRow[regByIdx] || '';

    // 4. 상세계산데이터 컬럼 자동 추가 (기존 데이터 잠금 해제 저장용)
    let detailColIndex = headers.indexOf('상세계산데이터');
    if (detailColIndex === -1) {
      headers.push('상세계산데이터');
      detailColIndex = headers.length - 1;
      // 시트의 첫 번째 줄(헤더) 업데이트
      await sheets.spreadsheets.values.update({
        spreadsheetId: MASTER_SHEET_ID,
        range: '제작내용!1:1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
    }

    // 5. 데이터 매핑 및 업데이트
    const sheetData = mapFrontendToSheet(orderData);
    const updatedRow = headers.map(h => sheetData[h] !== undefined ? sheetData[h] : '');

    await sheets.spreadsheets.values.update({
      spreadsheetId: MASTER_SHEET_ID,
      range: `제작내용!A${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });

    // 활동 로그 기록
    logActivity(orderData.currentUser, '수정', orderData.company, id, '사양 또는 견적 정보를 수정했습니다.');

    res.json({ success: true });
  } catch (error) {
    console.error('주문 업데이트 에러:', error.message);
    res.status(500).json({ error: '주문 업데이트에 실패했습니다.' });
  }
});

// 진행상태만 변경 (칸반 드래그 시)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentUser } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: MASTER_SHEET_ID, range: '제작내용!A:DZ',
    });
    const rows = response.data.values;
    const headers = rows[0];
    const idColIndex = headers.indexOf('고유번호');
    const statusColIndex = headers.indexOf('진행상태');
    const modTimeColIndex = headers.indexOf('수정일시');
    const modUserColIndex = headers.indexOf('수정작업자');

    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIndex] === id) { targetRowIndex = i + 1; break; }
    }
    if (targetRowIndex === -1) {
      return res.status(404).json({ error: `주문번호 ${id}를 찾을 수 없습니다.` });
    }

    // 상태 + 수정일시 + 수정작업자 업데이트
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const existingRow = [...rows[targetRowIndex - 1]];
    // 헤더 길이에 맞게 패딩
    while (existingRow.length < headers.length) existingRow.push('');
    existingRow[statusColIndex] = status;
    if (modTimeColIndex >= 0) existingRow[modTimeColIndex] = timeStr;
    if (modUserColIndex >= 0) existingRow[modUserColIndex] = currentUser || '';

    await sheets.spreadsheets.values.update({
      spreadsheetId: MASTER_SHEET_ID,
      range: `제작내용!A${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [existingRow] },
    });

    // 활동 로그 기록
    const company = existingRow[headers.indexOf('업체명')] || '';
    logActivity(currentUser, '상태변경', company, id, `진행 상태를 '${status}'(으)로 변경했습니다.`);

    res.json({ success: true });
  } catch (error) {
    console.error('상태 변경 에러:', error.message);
    res.status(500).json({ error: '상태 변경에 실패했습니다.' });
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
    res.status(500).json({ error: '공장 리스트를 불러오는 데 실패했습니다.' });
  }
});

// --- 정산 리포트 내보내기 ---
app.post('/api/reports/settlement', async (req, res) => {
  try {
    const { month, data } = req.body;
    if (!month || !data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, error: '잘못된 데이터 형식입니다.' });
    }

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // 시트 이름: 정산_2024_05
    const sheetName = `정산_${month.replace('-', '_')}`;
    
    // 1. 해당 이름의 시트(탭)가 존재하는지 확인
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
    const existingSheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    
    // 2. 없으면 새로 생성
    if (!existingSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: MASTER_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: { rowCount: 1000, columnCount: 10 }
              }
            }
          }]
        }
      });
    } else {
      // 이미 존재하면 기존 데이터 지우기 (옵셔널)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: MASTER_SHEET_ID,
        range: `'${sheetName}'!A:G`,
      });
    }
    
    // 3. 데이터 준비 (헤더 포함)
    const headers = ['생산공장', '고유번호', '업체명', '수량', '공임단가', '출고일', '공임합계', '부가세', '합계금액', '세금계산서(발행일)'];
    const rows = [headers];
    
    data.forEach(item => {
      rows.push([
        item['생산공장'] || '',
        item['고유번호'] || '',
        item['업체명'] || '',
        item['수량'] || 0,
        item['공임단가'] || 0,
        item['출고일'] || '',
        item['합산금액'] || 0,
        item['부가세'] || 0,
        item['합계금액'] || 0,
        item['세금계산서'] || ''
      ]);
    });
    
    // 4. 데이터 쓰기
    await sheets.spreadsheets.values.update({
      spreadsheetId: MASTER_SHEET_ID,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
    
    // 5. 헤더 스타일링 및 숫자 포맷 지정 (간단히 첫 줄 볼드 처리 요청)
    const sheetId = existingSheet 
      ? existingSheet.properties.sheetId 
      : (await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID })).data.sheets.find(s => s.properties.title === sheetName).properties.sheetId;
      
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MASTER_SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }
        ]
      }
    });

    res.json({ success: true, sheetName });
  } catch (error) {
    console.error('정산 내보내기 오류:', error);
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ error: '공장 정보 추가에 실패했습니다.' });
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
    res.status(500).json({ error: '공장 정보 수정에 실패했습니다.' });
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
    res.status(500).json({ error: '공장 정보 삭제에 실패했습니다.' });
  }
});

app.post('/api/drive/folder', async (req, res) => {
  console.log('--- 구글 드라이브 폴더 생성 시작 ---');
  try {
    const { folderName } = req.body;
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client });

    const now = new Date();
    const yearStr = `${now.getFullYear()}년`;
    const monthStr = `${now.getFullYear()}년${(now.getMonth() + 1).toString().padStart(2, '0')}월`;

    async function getOrCreateFolder(name, parentId) {
      console.log(`폴더 확인/생성 중: "${name}" (부모 폴더: "${parentId}")`);
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

    console.log('성공! 웹 링크:', finalFolder.data.webViewLink);
    res.json({ success: true, webViewLink: finalFolder.data.webViewLink, folderId: finalFolder.data.id });

  } catch (error) {
    console.error('!!! 구글 드라이브 API 에러 !!!');
    console.error('메시지:', error.message);
    res.status(500).json({ error: '드라이브 폴더 생성에 실패했습니다.', details: error.message });
  }
});

app.get('/api/drive/proofs/:folderId', async (req, res) => {
  try {
    const folderId = req.params.folderId;
    if (!folderId) return res.status(400).json({ error: '폴더 ID가 누락되었습니다.' });
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
    console.error('드라이브 시안 파일 에러:', error.message);
    res.status(500).json({ error: '시안 파일을 불러오는 데 실패했습니다.' });
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
      console.error('드라이브 스트림 에러', err);
      res.status(500).end();
    });
    response.data.pipe(res);
  } catch (error) {
    console.error('드라이브 이미지 프록시 에러:', error.message);
    res.status(500).send('이미지 스트림에 실패했습니다.');
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
      console.error('견적서 생성 에러:', error);
      res.status(500).json({ error: '견적서 생성에 실패했습니다.', details: error.message });
    }
  });

app.post('/api/calendar/event', async (req, res) => {
  console.log('캘린더 요청 수신:', req.body);
  try {
    const { summary, description, startDate } = req.body;
    if (!startDate) {
      console.error('에러: 시작 날짜가 누락되었습니다.');
      return res.status(400).json({ error: '시작 날짜가 누락되었습니다.' });
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

    console.log('캘린더에 일정 추가 시도:', CALENDAR_ID);
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('일정 생성 성공:', response.data.id);
    res.json({ success: true, eventId: response.data.id });
  } catch (error) {
    console.error('구글 캘린더 API 에러:', error.message);
    if (error.response) {
      console.error('에러 응답 데이터:', error.response.data);
    }
    res.status(500).json({ error: '캘린더 일정 생성에 실패했습니다.', details: error.message });
  }
});

// Vertex AI Gemini API Endpoint (REST API Direct Call for Gemini 3.1)
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: '프롬프트가 필요합니다.' });

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
    console.error('Vertex AI 에러:', error.message);
    res.status(500).json({ error: '제미나이 API 호출에 실패했습니다.', details: error.message });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`백엔드 API 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
