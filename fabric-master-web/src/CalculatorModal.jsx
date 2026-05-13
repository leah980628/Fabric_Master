import React, { useState, useEffect } from 'react';

const bagTypes = [
  "1번 기본형(가로*세로)", 
  "1-1번 분리형(가로*세로)", 
  "2번 기본형(가로*세로*밑면)", 
  "2-1번 분리형(가로*세로*밑면)",
  "3번 옆면형(가로*세로*밑면*옆면)", 
  "3-1번 U자형(앞뒤분리)"
];

const factoryListDefault = ["미정"];

const fabricSupplierListDefault = ["미정", "동대문", "성광", "신진", "대성", "유림", "태양"];
const webbingSupplierListDefault = ["미정", "성광", "동대문", "광일", "삼호"];
const biasSupplierListDefault = ["미정", "동대문", "성광", "유림"];
const metalSupplierListDefault = ["미정", "동대문", "신진", "대성"];
const printSupplierListDefault = ["미정", "나래인쇄", "하나인쇄", "태양인쇄", "성진인쇄"];
const freightSupplierListDefault = ["미정", "로젠택배", "경동택배", "대신화물", "직접납품"];

export default function CalculatorModal({ item, onClose, onSave, onCopy, onDelete, onStatusChange, pipelineStages, currentUser }) {
  const [activeTab, setActiveTab] = useState('가방사양');

  const initFromItem = (defaultObj, itemObj) => {
    if (!itemObj) return defaultObj;
    const result = { ...defaultObj };
    for (const key in defaultObj) {
      if (itemObj[key] !== undefined) {
        result[key] = itemObj[key];
      }
    }
    return result;
  };

  // 1. 기본 사양
  const [specs, setSpecs] = useState(() => {
    const defaultSpecs = initFromItem({
      type: "1번 기본형(가로*세로)",
      fabricSupplier: "미정",
      fabricName: "메인 원단",
      fabricContent: "",
      w: 0, h: 0, d: 0, sideD: 0,
      qty: 100, fabricWidth: 63, fabricPrice: 0,
      topSeam: 6, bottomSeam: 1.5, sideSeam: 1.5, loss: 3,
      useSeparateBodyFabric: false,
      bodyParts: {
        partA: { supplier: "미정", name: "", width: 63, price: 0 }, // 앞면 또는 메인
        partB: { supplier: "미정", name: "", width: 63, price: 0 }, // 뒷면 또는 옆/밑면
        partC: { supplier: "미정", name: "", width: 63, price: 0 }  // 기타 부위
      }
    }, item);

    // 가방사양의 원단 데이터가 존재하고, 사양계산의 메인 원단이 비어있거나 초기값인 경우 덮어쓰기
    if (item?.fabric && (!defaultSpecs.fabricName || defaultSpecs.fabricName === "메인 원단")) {
      defaultSpecs.fabricName = item.fabric;
      // 부위별 원단 이름도 동기화 (비어있거나 메인 원단인 경우)
      if (!defaultSpecs.bodyParts.partA.name || defaultSpecs.bodyParts.partA.name === "메인 원단") defaultSpecs.bodyParts.partA.name = item.fabric;
      if (!defaultSpecs.bodyParts.partB.name || defaultSpecs.bodyParts.partB.name === "메인 원단") defaultSpecs.bodyParts.partB.name = item.fabric;
      if (!defaultSpecs.bodyParts.partC.name || defaultSpecs.bodyParts.partC.name === "메인 원단") defaultSpecs.bodyParts.partC.name = item.fabric;
    }

    return defaultSpecs;
  });

  const [fabricSuppliers, setFabricSuppliers] = useState(fabricSupplierListDefault);
  const [factories, setFactories] = useState(factoryListDefault);
  const [webbingSuppliers, setWebbingSuppliers] = useState(webbingSupplierListDefault);
  const [biasSuppliers, setBiasSuppliers] = useState(biasSupplierListDefault);
  const [metalSuppliers, setMetalSuppliers] = useState(metalSupplierListDefault);
  const [printSuppliers, setPrintSuppliers] = useState(printSupplierListDefault);
  const [freightSuppliers, setFreightSuppliers] = useState(freightSupplierListDefault);

  // 1-1. 부가 원단 부속 (재끈, 안주머니, 기타)
  const [extras, setExtras] = useState(() => initFromItem({
    hasStrap: false, strapW: 5, strapL: 60, strapQty: 0, strapTopSeam: 0, strapBottomSeam: 0, strapSideSeam: 0,
    strapFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasPocket: false, pocketW: 20, pocketH: 15, pocketQty: 0, pocketTopSeam: 0, pocketBottomSeam: 0, pocketSideSeam: 0,
    pocketFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasBottomPatch: false, bottomPatchW: 36, bottomPatchH: 10, bottomPatchQty: 0, bottomPatchTopSeam: 0, bottomPatchBottomSeam: 0, bottomPatchSideSeam: 0,
    bottomPatchFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasFrontPocket: false, frontPocketW: 25, frontPocketH: 20, frontPocketQty: 0, frontPocketTopSeam: 0, frontPocketBottomSeam: 0, frontPocketSideSeam: 0,
    frontPocketFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasSidePocket: false, sidePocketW: 15, sidePocketH: 18, sidePocketQty: 0, sidePocketTopSeam: 0, sidePocketBottomSeam: 0, sidePocketSideSeam: 0,
    sidePocketFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasTumblerPocket: false, tumblerPocketW: 12, tumblerPocketH: 20, tumblerPocketQty: 0, tumblerPocketTopSeam: 0, tumblerPocketBottomSeam: 0, tumblerPocketSideSeam: 0,
    tumblerPocketFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 },
    hasLining: false, liningW: 36, liningH: 36, liningQty: 0, liningTopSeam: 0, liningBottomSeam: 0, liningSideSeam: 0,
    liningFabric: { isCustom: false, supplier: "미정", name: "안감", width: 63, price: 0 },
    hasOther: false, otherW: 10, otherH: 10, otherQty: 0, otherTopSeam: 0, otherBottomSeam: 0, otherSideSeam: 0,
    otherFabric: { isCustom: false, supplier: "미정", name: "", width: 63, price: 0 }
  }, item));

  const handleExtrasChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExtras(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (parseFloat(value) || 0) }));
  };

  const handleExtraFabricChange = (part, field, value) => {
    setExtras(prev => {
      const prevFabric = prev[`${part}Fabric`];
      let newFabric = { ...prevFabric, [field]: value };
      
      // 별도설정이 켜지면 기본값을 '미정' 등으로 초기화
      if (field === 'isCustom' && value === true) {
        newFabric.supplier = '미정';
        newFabric.name = ''; // 이름도 초기화 (필요시)
      }

      return {
        ...prev,
        [`${part}Fabric`]: newFabric
      };
    });
  };

  const handleBodyPartFabricChange = (part, field, value) => {
    setSpecs(prev => ({
      ...prev,
      bodyParts: {
        ...prev.bodyParts,
        [part]: { ...prev.bodyParts[part], [field]: field === 'supplier' || field === 'name' ? value : (parseFloat(value) || 0) }
      }
    }));
  };

  // 2. 부자재, 인쇄 및 공임
  const [costs, setCosts] = useState(() => {
    const defaultCosts = initFromItem({
      factory: "미정",
      laborUnit: 0, laborContent: "",
      webbingSupplier: "미정", webbingUnit: 0, webbingContent: "",
      webbingFinishLen: 60, webbingSeam: 6, webbingPrice: 0,
      webbingRollLen: 100, webbingLoss: 3, webbingQtyPerBag: 2,
      hasOuterBias: false, outerBiasSupplier: "미정", outerBiasUnit: 0, outerBiasContent: "",
      outerBiasFinishLen: 80, outerBiasSeam: 3, outerBiasPrice: 0,
      outerBiasRollLen: 100, outerBiasLoss: 3, outerBiasQtyPerBag: 1,
      hasInnerBias: false, innerBiasSupplier: "미정", innerBiasUnit: 0, innerBiasContent: "",
      innerBiasFinishLen: 80, innerBiasSeam: 3, innerBiasPrice: 0,
      innerBiasRollLen: 100, innerBiasLoss: 3, innerBiasQtyPerBag: 1,
      metalSupplier: "미정", metalUnit: 0, metalContent: "", hasMetal: false,
      metalSupplier2: "미정", metalUnit2: 0, metalContent2: "", hasMetal2: false,
      printSupplier: "미정", printUnit: 0, printContent: "",
      hasPrint2: false, printSupplier2: "미정", printUnit2: 0, printContent2: "",
      freightSupplier: "미정", freightTotal: 0, freightContent: "",
      hasFreight2: false, freightSupplier2: "미정", freightTotal2: 0, freightContent2: "",
    }, item);

    // 가방사양의 웨빙/인쇄 데이터가 존재하고, 사양계산의 내용이 비어있는 경우 덮어쓰기
    if (item?.webbing && !defaultCosts.webbingContent) {
      defaultCosts.webbingContent = item.webbing;
    }
    if (item?.printing && !defaultCosts.printContent) {
      defaultCosts.printContent = item.printing;
    }

    return defaultCosts;
  });

  // 3. 결제 및 추가 정보 (새로 추가된 필드들)
  const [extraInfo, setExtraInfo] = useState(() => initFromItem({
    paymentMethod: '계좌이체', tax1: '', tax2: '', paymentContent: '',
    paymentPic: '', paymentContact: '', paymentContact2: '', paymentEmail: '',
    deposit: 0, balance: 0, tax1Ratio: 100, tax2Ratio: 0,
    driveLink: '', driveFolderId: '', proofImage: '',
    deliveryAddress: '', workOrderDate: '', prodCheck: '',
    factoryShipDate: '', trackingNum: '',
    orderConfirmed: item.orderConfirmed || false
  }, item));

  const [proofFiles, setProofFiles] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [isFetchingProofs, setIsFetchingProofs] = useState(false);

  // 코멘트 기능 상태
  const [comments, setComments] = useState(() => {
    // 기존 코멘트 파싱 ("[작업자 MM/DD HH:mm] 내용" 형식)
    const raw = item?.comments || '';
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* JSON 파싱 실패 시 문자열로 처리 */ }
    return raw ? [{ author: '', text: raw, time: '' }] : [];
  });
  const [newComment, setNewComment] = useState('');

  // 공장 및 업체 목록 동적 로딩 (분류별 필터링)
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const apiBase = `http://${window.location.hostname}:3001`;
        const res = await fetch(`${apiBase}/api/factories`);
        const data = await res.json();
        
        const filterBy = (...categories) => {
          const names = data
            .filter(f => categories.includes(f.분류))
            .map(f => f.공장이름);
          return ["미정", ...names.filter(n => n !== "미정")];
        };

        setFactories(filterBy("봉재"));
        setFabricSuppliers(filterBy("원단"));
        setWebbingSuppliers(filterBy("웨빙"));
        setBiasSuppliers(filterBy("웨빙"));
        setPrintSuppliers(filterBy("인쇄업체", "인쇄"));
        setMetalSuppliers(filterBy("금속부자재", "기타부자재")); 
        setFreightSuppliers(filterBy("기타부자재")); 
      } catch (err) {
        console.error('Failed to fetch factories:', err);
      }
    };
    fetchFactories();
  }, []);

  const [othersEditing, setOthersEditing] = useState([]);

  // Heartbeat Effect: 동시 편집 중인 다른 사용자 확인
  useEffect(() => {
    if (!item?.id) return;
    
    // 로컬 스토리지나 App의 currentUser 사용
    const storedUser = localStorage.getItem('fabric_master_user') || '';
    const userToReport = currentUser || storedUser || '익명';
    const apiBase = `http://${window.location.hostname}:3001`;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch(`${apiBase}/api/orders/${item.id}/editing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser: userToReport })
        });
        const data = await res.json();
        if (data.others) {
          setOthersEditing(data.others);
        }
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000); // 10초마다 신호
    return () => clearInterval(interval);
  }, [item?.id, currentUser]);

  const [bagSpecs, setBagSpecs] = useState({
    productType: item?.productType || '에코백',
    fabric: item?.fabric || '',
    webbing: item?.webbing || '',
    printing: item?.printing || '',
    options: item?.options || '',
    targetDate: item?.targetDate || '',
    consultMemo: item?.consultMemo || item?.memo || ''
  });

  const [customerInfo, setCustomerInfo] = useState({
    company: item?.company || '',
    pic: item?.pic || '',
    contact: item?.contact || '',
    contact2: item?.contact2 || '',
    email: item?.email || '',
    consultType: item?.consultType || '신규'
  });

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBagSpecsChange = (e) => {
    const { name, value } = e.target;
    setBagSpecs(prev => ({ ...prev, [name]: value }));

    // 가방사양 -> 사양계산 자동 연동
    if (name === 'fabric') {
      setSpecs(prev => ({ 
        ...prev, 
        fabricName: value,
        // 메인 원단명이 바뀌면 부위별 원단명도 동기화
        bodyParts: {
          partA: { ...prev.bodyParts.partA, name: prev.bodyParts.partA.name === '' || prev.bodyParts.partA.name === prev.fabricName ? value : prev.bodyParts.partA.name },
          partB: { ...prev.bodyParts.partB, name: prev.bodyParts.partB.name === '' || prev.bodyParts.partB.name === prev.fabricName ? value : prev.bodyParts.partB.name },
          partC: { ...prev.bodyParts.partC, name: prev.bodyParts.partC.name === '' || prev.bodyParts.partC.name === prev.fabricName ? value : prev.bodyParts.partC.name },
        }
      }));
    } else if (name === 'webbing') {
      setCosts(prev => ({ ...prev, webbingContent: value }));
    } else if (name === 'printing') {
      setCosts(prev => ({ ...prev, printContent: value }));
    }
  };

  // 4. 마진뷰
  const [margin, setMargin] = useState(() => {
    // 기존 데이터인 경우 납품가를 customDeliveryUnit에 설정
    if (item?.isLegacy && item?.legacyResult) {
      return {
        percent: item.legacyResult.percent || 30,
        customDeliveryUnit: item.legacyResult.finalDeliveryUnit || 0
      };
    }
    return initFromItem({ percent: 30, customDeliveryUnit: 0 }, item);
  });

  const [result, setResult] = useState(() => {
    // 기존 데이터인 경우 시트의 최종 금액들을 우선 로드
    if (item?.isLegacy && item?.legacyResult) {
      const lr = item.legacyResult;
      const qty = item.qty || 1;
      return {
        totalCostUnit: lr.totalCostAll || 0, // 시트의 '생산합계'는 개당 금액
        totalCostAll: (lr.totalCostAll || 0) * qty, // 총 생산원가
        finalDeliveryUnit: lr.finalDeliveryUnit || 0, // 납품가(개당)
        finalDeliveryAll: lr.finalDeliveryAll || 0, // 납품가 합계
        finalDeliveryAllVAT: lr.finalDeliveryAllVAT || 0, // 납품가+부가세
        marginAmountUnit: lr.marginAmountUnit || 0, // 마진(개당)
        percent: lr.percent || 0, // 마진%
        netYard: 0, grossYard: 0, fabricTotalCost: 0, fabricUnitCost: 0, bodyNetYard: 0
      };
    }
    return {
      netYard: 0, grossYard: 0, fabricTotalCost: 0, fabricUnitCost: 0, 
      totalCostUnit: 0, totalCostAll: 0, marginAmountUnit: 0, 
      finalDeliveryUnit: 0, finalDeliveryAll: 0, finalDeliveryAllVAT: 0,
      bodyNetYard: 0
    };
  });

  // 기존 데이터 모드: 계산기가 초기 실행 시 덮어쓰지 않도록 보호
  const [isLegacyLocked, setIsLegacyLocked] = useState(item?.isLegacy || false);

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    const numVal = parseFloat(value) || 0;
    
    setSpecs(prev => {
      let newType = prev.type;
      
      // 사이즈 입력에 따른 가방 형태 자동 추천 연결 로직
      if (name === 'd' && numVal > 0 && prev.type === "1번 기본형(가로*세로)") {
        newType = "2번 기본형(가로*세로*밑면)";
      } else if (name === 'sideD' && numVal > 0 && (prev.type === "1번 기본형(가로*세로)" || prev.type === "2번 기본형(가로*세로*밑면)" || prev.type === "2-1번 분리형(가로*세로*밑면)")) {
        newType = "3번 옆면형(가로*세로*밑면*옆면)";
      } else if (name === 'type') {
        newType = value;
      }

      const isStringField = name === 'type' || name === 'fabricSupplier';
      const finalVal = isStringField || name === 'fabricContent' ? value : numVal;
      
      const newSpecs = { ...prev, [name]: finalVal, type: newType };

      // 메인 원단 정보 변경 시 부위별 원단 동기화
      if (name === 'fabricWidth' || name === 'fabricPrice' || name === 'fabricSupplier') {
        const propMap = { fabricWidth: 'width', fabricPrice: 'price', fabricSupplier: 'supplier' };
        const bodyProp = propMap[name];
        const defaultVal = name === 'fabricWidth' ? 63 : name === 'fabricPrice' ? 0 : '미정';
        
        const shouldSync = (part) => {
          const partVal = prev.bodyParts[part][bodyProp];
          return partVal === defaultVal || partVal === prev[name];
        };

        newSpecs.bodyParts = {
          partA: { ...prev.bodyParts.partA, [bodyProp]: shouldSync('partA') ? finalVal : prev.bodyParts.partA[bodyProp] },
          partB: { ...prev.bodyParts.partB, [bodyProp]: shouldSync('partB') ? finalVal : prev.bodyParts.partB[bodyProp] },
          partC: { ...prev.bodyParts.partC, [bodyProp]: shouldSync('partC') ? finalVal : prev.bodyParts.partC[bodyProp] },
        };
      }

      return newSpecs;
    });
  };

  const handleAddSupplier = async (type) => {
    const name = prompt("새로운 업체 이름을 입력하세요:");
    if (!name) return;

    let category = '';
    if (type === 'fabric') category = '원단';
    else if (type === 'webbing' || type === 'bias') category = '웨빙';
    else if (type === 'metal') category = '금속부자재';
    else if (type === 'print') category = '인쇄업체';
    else if (type === 'freight') category = '기타부자재';

    try {
      const apiBase = `http://${window.location.hostname}:3001`;
      await fetch(`${apiBase}/api/factories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 공장이름: name, 분류: category })
      });

      if (type === 'fabric') {
        if (!fabricSuppliers.includes(name)) setFabricSuppliers(prev => [...prev, name]);
        setSpecs(prev => ({ ...prev, fabricSupplier: name }));
      } else if (type === 'webbing') {
        if (!webbingSuppliers.includes(name)) setWebbingSuppliers(prev => [...prev, name]);
        setCosts(prev => ({ ...prev, webbingSupplier: name }));
      } else if (type === 'bias') {
        if (!biasSuppliers.includes(name)) setBiasSuppliers(prev => [...prev, name]);
      } else if (type === 'metal') {
        if (!metalSuppliers.includes(name)) setMetalSuppliers(prev => [...prev, name]);
      } else if (type === 'print') {
        if (!printSuppliers.includes(name)) setPrintSuppliers(prev => [...prev, name]);
      } else if (type === 'freight') {
        if (!freightSuppliers.includes(name)) setFreightSuppliers(prev => [...prev, name]);
        setCosts(prev => ({ ...prev, freightSupplier: name }));
      }
    } catch (err) {
      console.error('Failed to add supplier:', err);
      alert('업체 등록에 실패했습니다.');
    }
  };

  const handleAddFactory = async () => {
    const name = prompt("새로운 생산공장 이름을 입력하세요:");
    if (name && !factories.includes(name)) {
      try {
        const apiBase = `http://${window.location.hostname}:3001`;
        await fetch(`${apiBase}/api/factories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 공장이름: name, 분류: '봉재' })
        });
        setFactories(prev => [...prev, name]);
        setCosts(prev => ({ ...prev, factory: name }));
      } catch (err) {
        console.error('Failed to add factory:', err);
        alert('공장 등록에 실패했습니다.');
      }
    }
  };

  const handleCreateDriveFolder = async () => {
    try {
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      const folderName = `${yymmdd}_${customerInfo.company}_(${specs.qty}장)`;

      const apiBase = `http://${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/api/drive/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName })
      });

      const resData = await response.json();
      if (resData.success) {
        setExtraInfo(prev => ({ ...prev, driveLink: resData.webViewLink, driveFolderId: resData.folderId }));
        alert(`구글 드라이브에 폴더가 생성되었습니다:\n${folderName}`);
      } else {
        alert(`폴더 생성 실패: ${resData.error || '알 수 없는 오류'}`);
        if (resData.error === 'Parent Folder ID is not configured') {
          alert('서버 설정에 부모 폴더 ID가 필요합니다. 상위 폴더 ID를 알려주시면 바로 해결해 드릴 수 있습니다!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('서버 연결에 실패했습니다.');
    }
  };

  const fetchProofFiles = async () => {
    if (!extraInfo.driveFolderId) {
      alert("구글 드라이브 폴더가 지정되지 않았습니다. 먼저 '폴더 생성'을 완료하거나 폴더 ID를 연동해주세요.");
      return;
    }
    setIsFetchingProofs(true);
    try {
      const apiBase = `http://${window.location.hostname}:3001`;
      const res = await fetch(`${apiBase}/api/drive/proofs/${extraInfo.driveFolderId}`);
      const data = await res.json();
      if (data.success) {
        setProofFiles(data.files || []);
        if (data.files && data.files.length === 0) {
          alert("폴더 내에 시안 이미지 파일(jpg, png 등)이 없습니다.\n예: 240430_업체명(100장)_시안.jpg 등 파일명에 '시안'이 포함되거나 이미지 확장자여야 합니다.");
        }
      } else {
        alert("시안 이미지를 불러오는데 실패했습니다: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsFetchingProofs(false);
    }
  };

  const handleGenerateEstimate = async () => {
    if (!extraInfo.driveFolderId) {
      alert("먼저 구글 드라이브 폴더를 생성해주세요 (결제 및 추가정보 탭).");
      return;
    }
    
    try {
      const orderData = {
        company: customerInfo.company,
        pic: customerInfo.pic,
        contact: customerInfo.contact,
        email: customerInfo.email,
        fabric: specs.fabricName,
        size: `W: ${specs.w} x H: ${specs.h} x D: ${specs.d}`,
        webbing: bagSpecs.webbing || costs.webbingContent,
        print: bagSpecs.printing || costs.printContent,
        options: bagSpecs.options,
        qty: specs.qty,
        unitPrice: result.finalDeliveryUnit,
        totalAmount: result.finalDeliveryAll,
        vat: result.finalDeliveryAllVAT - result.finalDeliveryAll,
        finalAmount: result.finalDeliveryAllVAT,
        paymentMethod: extraInfo.paymentMethod,
        consultMemo: bagSpecs.consultMemo
      };

      const apiBase = `http://${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/api/estimate/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: extraInfo.driveFolderId, orderData })
      });

      const resData = await response.json();
      if (resData.success) {
        alert("견적서가 성공적으로 발행되었습니다!");
        window.open(resData.pdfLink, '_blank');
      } else {
        alert(`견적서 발행 실패: ${resData.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error(err);
      alert('서버 연결에 실패했습니다.');
    }
  };

  const handleCostChange = (e) => {
    const { name, value } = e.target;
    setCosts(prev => ({ 
      ...prev, 
      [name]: (name === 'factory' || name.endsWith('Content') || name.endsWith('Supplier')) ? value : (parseFloat(value) || 0)
    }));
  };

  // 웨빙 자동 계산 (costs 변경 시)
  useEffect(() => {
    const c = costs;
    if (c.webbingFinishLen > 0 && c.webbingPrice > 0 && c.webbingRollLen > 0 && specs.qty > 0) {
      const cutLen = c.webbingFinishLen + (c.webbingSeam * 2); // 1개당 재단 길이
      const netTotalCm = cutLen * c.webbingQtyPerBag * specs.qty; // 총 필요량(cm)
      const rollLenCm = c.webbingRollLen * 100; // 롤 길이(cm)
      const rollsNeeded = Math.ceil((netTotalCm * (1 + c.webbingLoss / 100)) / rollLenCm);
      const totalCost = rollsNeeded * c.webbingPrice;
      const unitCost = Math.round(totalCost / specs.qty);
      setCosts(prev => ({ ...prev, webbingUnit: unitCost }));
    }
  }, [costs.webbingFinishLen, costs.webbingSeam, costs.webbingPrice, costs.webbingRollLen, costs.webbingLoss, costs.webbingQtyPerBag, specs.qty]);

  // 겉헤리(바이어스) 자동 계산
  useEffect(() => {
    const c = costs;
    if (c.hasOuterBias && c.outerBiasFinishLen > 0 && c.outerBiasPrice > 0 && c.outerBiasRollLen > 0 && specs.qty > 0) {
      const cutLen = c.outerBiasFinishLen + (c.outerBiasSeam * 2);
      const netTotalCm = cutLen * c.outerBiasQtyPerBag * specs.qty;
      const rollLenCm = c.outerBiasRollLen * 100;
      const rollsNeeded = Math.ceil((netTotalCm * (1 + c.outerBiasLoss / 100)) / rollLenCm);
      const totalCost = rollsNeeded * c.outerBiasPrice;
      setCosts(prev => ({ ...prev, outerBiasUnit: Math.round(totalCost / specs.qty) }));
    } else if (!c.hasOuterBias) {
      setCosts(prev => ({ ...prev, outerBiasUnit: 0 }));
    }
  }, [costs.hasOuterBias, costs.outerBiasFinishLen, costs.outerBiasSeam, costs.outerBiasPrice, costs.outerBiasRollLen, costs.outerBiasLoss, costs.outerBiasQtyPerBag, specs.qty]);

  // 속헤리(바이어스) 자동 계산
  useEffect(() => {
    const c = costs;
    if (c.hasInnerBias && c.innerBiasFinishLen > 0 && c.innerBiasPrice > 0 && c.innerBiasRollLen > 0 && specs.qty > 0) {
      const cutLen = c.innerBiasFinishLen + (c.innerBiasSeam * 2);
      const netTotalCm = cutLen * c.innerBiasQtyPerBag * specs.qty;
      const rollLenCm = c.innerBiasRollLen * 100;
      const rollsNeeded = Math.ceil((netTotalCm * (1 + c.innerBiasLoss / 100)) / rollLenCm);
      const totalCost = rollsNeeded * c.innerBiasPrice;
      setCosts(prev => ({ ...prev, innerBiasUnit: Math.round(totalCost / specs.qty) }));
    } else if (!c.hasInnerBias) {
      setCosts(prev => ({ ...prev, innerBiasUnit: 0 }));
    }
  }, [costs.hasInnerBias, costs.innerBiasFinishLen, costs.innerBiasSeam, costs.innerBiasPrice, costs.innerBiasRollLen, costs.innerBiasLoss, costs.innerBiasQtyPerBag, specs.qty]);

  const handleExtraInfoChange = (e) => {
    const { name, value } = e.target;
    setExtraInfo(prev => {
      const next = { ...prev, [name]: value };
      
      // 선금이나 잔금이 변경되면 비율 자동 계산
      if (name === 'deposit' || name === 'balance') {
        const dep = parseFloat(next.deposit) || 0;
        const bal = parseFloat(next.balance) || 0;
        const total = dep + bal;
        if (total > 0) {
          next.tax1Ratio = Math.round((dep / total) * 100);
          next.tax2Ratio = 100 - next.tax1Ratio;
        } else {
          next.tax1Ratio = 100;
          next.tax2Ratio = 0;
        }
      }
      
      // 수동으로 비율 조정 시 상호 연동
      if (name === 'tax1Ratio') {
        const ratio = parseFloat(value) || 0;
        next.tax2Ratio = Math.max(0, 100 - ratio);
      }
      if (name === 'tax2Ratio') {
        const ratio = parseFloat(value) || 0;
        next.tax1Ratio = Math.max(0, 100 - ratio);
      }
      
      return next;
    });
  };

  const handleMarginPercentChange = (e) => {
    setMargin({ percent: parseFloat(e.target.value) || 0, customDeliveryUnit: 0 });
  };
  const handleDeliveryPriceChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    let newPercent = margin.percent;
    if (val > 0) {
      // (납품가 - 원가) / 납품가 * 100
      newPercent = Math.round(((val - result.totalCostUnit) / val) * 1000) / 10;
    }
    setMargin({ percent: newPercent, customDeliveryUnit: val });
  };

  useEffect(() => {
    const s = specs;
    const fw = (s.fabricWidth * 2.54) - 3;
    let net = 0;

    try {
      // --- 원단별 그룹화 계산 준비 ---
      const fabricGroups = {}; // Key: "Supplier|FabricName"

      const addToGroup = (supplier, name, yard, width, price) => {
        if (!yard || yard <= 0) return;
        const key = `${supplier}|${name}`;
        if (!fabricGroups[key]) {
          fabricGroups[key] = { supplier, name, yard: 0, width, price };
        }
        fabricGroups[key].yard += yard;
      };

      // 1. 몸판(Body) 계산
      let bodyNetYard = 0;
      const calculatePartYard = (pw, ph, count_override, fabric) => {
        const fw_local = (fabric.width * 2.54) - 3;
        const count = count_override || Math.floor(fw_local / pw);
        if (count > 0) return (ph / count) / 91.44;
        return 0;
      };

      // 부위별 원단 결정 헬퍼
      const getBodyFabric = (partKey) => {
        if (s.useSeparateBodyFabric) {
          return {
            supplier: s.bodyParts[partKey].supplier,
            name: s.bodyParts[partKey].name || "몸판 원단",
            width: s.bodyParts[partKey].width,
            price: s.bodyParts[partKey].price
          };
        }
        return {
          supplier: s.fabricSupplier,
          name: s.fabricName || "메인 원단",
          width: s.fabricWidth,
          price: s.fabricPrice
        };
      };

      if (s.type === "1번 기본형(가로*세로)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = (s.h * 2) + s.topSeam + s.bottomSeam;
          const fabric = getBodyFabric('partA');
          const yard = calculatePartYard(pw, ph, null, fabric);
          addToGroup(fabric.supplier, fabric.name, yard, fabric.width, fabric.price);
          bodyNetYard = yard;
      } else if (s.type === "1-1번 분리형(가로*세로)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = s.h + s.topSeam + s.bottomSeam;
          
          const f1 = getBodyFabric('partA');
          const yard1 = calculatePartYard(pw, ph, null, f1);
          addToGroup(f1.supplier, f1.name, yard1, f1.width, f1.price);
          
          const f2 = getBodyFabric('partB');
          const yard2 = calculatePartYard(pw, ph, null, f2);
          addToGroup(f2.supplier, f2.name, yard2, f2.width, f2.price);
          
          bodyNetYard = yard1 + yard2;
      } else if (s.type === "2번 기본형(가로*세로*밑면)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = (s.h * 2) + s.d + s.topSeam + s.bottomSeam;
          const fabric = getBodyFabric('partA');
          const yard = calculatePartYard(pw, ph, null, fabric);
          addToGroup(fabric.supplier, fabric.name, yard, fabric.width, fabric.price);
          bodyNetYard = yard;
      } else if (s.type === "2-1번 분리형(가로*세로*밑면)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = s.h + (s.d / 2) + s.topSeam + s.bottomSeam;
          
          const f1 = getBodyFabric('partA');
          const yard1 = calculatePartYard(pw, ph, null, f1);
          addToGroup(f1.supplier, f1.name, yard1, f1.width, f1.price);
          
          const f2 = getBodyFabric('partB');
          const yard2 = calculatePartYard(pw, ph, null, f2);
          addToGroup(f2.supplier, f2.name, yard2, f2.width, f2.price);
          
          bodyNetYard = yard1 + yard2;
      } else if (s.type === "3번 옆면형(가로*세로*밑면*옆면)") {
          const f1 = getBodyFabric('partA');
          const pw1 = s.w + (s.sideSeam * 2);
          const ph1 = (s.h * 2) + s.d + s.topSeam + s.bottomSeam;
          const yard1 = calculatePartYard(pw1, ph1, null, f1);
          addToGroup(f1.supplier, f1.name, yard1, f1.width, f1.price);

          const f2 = getBodyFabric('partB');
          const pw2 = s.sideD + (s.sideSeam * 2);
          const ph2 = s.h + s.topSeam + s.bottomSeam;
          const yard2 = calculatePartYard(pw2, ph2, null, f2);
          addToGroup(f2.supplier, f2.name, yard2, f2.width, f2.price);

          bodyNetYard = yard1 + yard2;
      } else if (s.type === "3-1번 U자형(앞뒤분리)") {
          const f1 = getBodyFabric('partA'); // 앞면
          const f2 = getBodyFabric('partB'); // 뒷면
          const f3 = getBodyFabric('partC'); // U자 옆면
          
          const pw12 = s.w + (s.sideSeam * 2);
          const ph12 = s.h + s.topSeam + s.bottomSeam;
          const yard1 = calculatePartYard(pw12, ph12, null, f1);
          const yard2 = calculatePartYard(pw12, ph12, null, f2);
          
          const pw3 = s.sideD + (s.sideSeam * 2);
          const ph3 = (s.h * 2) + s.w + s.topSeam + s.bottomSeam;
          const yard3 = calculatePartYard(pw3, ph3, null, f3);
          
          addToGroup(f1.supplier, f1.name, yard1, f1.width, f1.price);
          addToGroup(f2.supplier, f2.name, yard2, f2.width, f2.price);
          addToGroup(f3.supplier, f3.name, yard3, f3.width, f3.price);
          
          bodyNetYard = yard1 + yard2 + yard3;
      }

      // 2. 부가 원단 부속 요척 추가
      const getExtraFabric = (key) => {
        const info = extras[`${key}Fabric`];
        if (info.isCustom) {
          return { supplier: info.supplier, name: info.name || `${key} 원단`, width: info.width, price: info.price };
        }
        return { supplier: s.fabricSupplier, name: s.fabricName || "메인 원단", width: s.fabricWidth, price: s.fabricPrice };
      };

      let strapYard = 0, pocketYard = 0, bottomPatchYard = 0, frontPocketYard = 0, sidePocketYard = 0, tumblerPocketYard = 0, liningYard = 0, otherYard = 0;
      
      if (extras.hasStrap && extras.strapW > 0 && extras.strapL > 0) {
        const f = getExtraFabric('strap');
        const pw = extras.strapW + (extras.strapSideSeam * 2);
        const ph = extras.strapL + extras.strapTopSeam + extras.strapBottomSeam;
        strapYard = calculatePartYard(pw, ph, null, f) * extras.strapQty;
        addToGroup(f.supplier, f.name, strapYard, f.width, f.price);
      }
      if (extras.hasPocket && extras.pocketW > 0 && extras.pocketH > 0) {
        const f = getExtraFabric('pocket');
        const pw = extras.pocketW + (extras.pocketSideSeam * 2);
        const ph = extras.pocketH + extras.pocketTopSeam + extras.pocketBottomSeam;
        pocketYard = calculatePartYard(pw, ph, null, f) * extras.pocketQty;
        addToGroup(f.supplier, f.name, pocketYard, f.width, f.price);
      }
      if (extras.hasBottomPatch && extras.bottomPatchW > 0 && extras.bottomPatchH > 0) {
        const f = getExtraFabric('bottomPatch');
        const pw = extras.bottomPatchW + (extras.bottomPatchSideSeam * 2);
        const ph = extras.bottomPatchH + extras.bottomPatchTopSeam + extras.bottomPatchBottomSeam;
        bottomPatchYard = calculatePartYard(pw, ph, null, f) * extras.bottomPatchQty;
        addToGroup(f.supplier, f.name, bottomPatchYard, f.width, f.price);
      }
      if (extras.hasFrontPocket && extras.frontPocketW > 0 && extras.frontPocketH > 0) {
        const f = getExtraFabric('frontPocket');
        const pw = extras.frontPocketW + (extras.frontPocketSideSeam * 2);
        const ph = extras.frontPocketH + extras.frontPocketTopSeam + extras.frontPocketBottomSeam;
        frontPocketYard = calculatePartYard(pw, ph, null, f) * extras.frontPocketQty;
        addToGroup(f.supplier, f.name, frontPocketYard, f.width, f.price);
      }
      if (extras.hasSidePocket && extras.sidePocketW > 0 && extras.sidePocketH > 0) {
        const f = getExtraFabric('sidePocket');
        const pw = extras.sidePocketW + (extras.sidePocketSideSeam * 2);
        const ph = extras.sidePocketH + extras.sidePocketTopSeam + extras.sidePocketBottomSeam;
        sidePocketYard = calculatePartYard(pw, ph, null, f) * extras.sidePocketQty;
        addToGroup(f.supplier, f.name, sidePocketYard, f.width, f.price);
      }
      if (extras.hasTumblerPocket && extras.tumblerPocketW > 0 && extras.tumblerPocketH > 0) {
        const f = getExtraFabric('tumblerPocket');
        const pw = extras.tumblerPocketW + (extras.tumblerPocketSideSeam * 2);
        const ph = extras.tumblerPocketH + extras.tumblerPocketTopSeam + extras.tumblerPocketBottomSeam;
        tumblerPocketYard = calculatePartYard(pw, ph, null, f) * extras.tumblerPocketQty;
        addToGroup(f.supplier, f.name, tumblerPocketYard, f.width, f.price);
      }
      if (extras.hasLining && extras.liningW > 0 && extras.liningH > 0) {
        const f = getExtraFabric('lining');
        const pw = extras.liningW + (extras.liningSideSeam * 2);
        const ph = extras.liningH + extras.liningTopSeam + extras.liningBottomSeam;
        liningYard = calculatePartYard(pw, ph, null, f) * extras.liningQty;
        addToGroup(f.supplier, f.name, liningYard, f.width, f.price);
      }
      if (extras.hasOther && extras.otherW > 0 && extras.otherH > 0) {
        const f = getExtraFabric('other');
        const pw = extras.otherW + (extras.otherSideSeam * 2);
        const ph = extras.otherH + extras.otherTopSeam + extras.otherBottomSeam;
        otherYard = calculatePartYard(pw, ph, null, f) * extras.otherQty;
        addToGroup(f.supplier, f.name, otherYard, f.width, f.price);
      }

      // 3. 최종 원단 비용 및 그룹화 데이터 정리
      let totalFabricCostAll = 0;
      const orderGroups = {}; // { supplier: [ {name, yard, price, cost} ] }

      Object.values(fabricGroups).forEach(group => {
        const grossYard = Math.ceil((group.yard * s.qty) * (1 + (s.loss / 100)));
        const cost = grossYard * group.price;
        totalFabricCostAll += cost;

        if (!orderGroups[group.supplier]) orderGroups[group.supplier] = [];
        orderGroups[group.supplier].push({
          name: group.name,
          width: group.width,
          netYard: Math.round(group.yard * 100) / 100,
          grossYard,
          price: group.price,
          cost
        });
      });

      const fabricUnitCost = s.qty > 0 ? (totalFabricCostAll / s.qty) : 0;
      const netYard = Math.round((bodyNetYard + strapYard + pocketYard + bottomPatchYard + frontPocketYard + sidePocketYard + tumblerPocketYard + liningYard + otherYard) * 100) / 100;

      const allocatedFreight = s.qty > 0 ? (costs.freightTotal / s.qty) : 0;
      const totalCostUnit = fabricUnitCost + costs.webbingUnit + costs.outerBiasUnit + costs.innerBiasUnit + costs.metalUnit + costs.metalUnit2 + costs.laborUnit + costs.printUnit + costs.printUnit2 + allocatedFreight;
      
      let marginAmountUnit = 0;
      let finalDeliveryUnit = 0;
      if (margin.customDeliveryUnit > 0) {
        finalDeliveryUnit = margin.customDeliveryUnit;
        marginAmountUnit = finalDeliveryUnit - totalCostUnit;
      } else {
        // 판매가 대비 마진율 계산: 납품가 = 원가 / (1 - 마진율)
        if (margin.percent >= 100) {
          finalDeliveryUnit = totalCostUnit; // 100% 이상은 오류 방지
        } else {
          finalDeliveryUnit = totalCostUnit / (1 - (margin.percent / 100));
        }
        marginAmountUnit = finalDeliveryUnit - totalCostUnit;
      }

      // 기존 데이터 모드일 때는 계산기 실행 건너뛰 (시트 값 보존)
      if (isLegacyLocked) return;

      setResult({
        netYard, 
        fabricTotalCost: totalFabricCostAll, 
        fabricUnitCost,
        orderGroups, // 업체별 그룹 데이터 추가
        strapYard: Math.round(strapYard * 100) / 100,
        pocketYard: Math.round(pocketYard * 100) / 100,
        bottomPatchYard: Math.round(bottomPatchYard * 100) / 100,
        frontPocketYard: Math.round(frontPocketYard * 100) / 100,
        sidePocketYard: Math.round(sidePocketYard * 100) / 100,
        tumblerPocketYard: Math.round(tumblerPocketYard * 100) / 100,
        liningYard: Math.round(liningYard * 100) / 100,
        otherYard: Math.round(otherYard * 100) / 100,
        bodyNetYard: Math.round(bodyNetYard * 100) / 100,
        totalCostUnit, 
        totalCostAll: totalCostUnit * s.qty,
        marginAmountUnit, finalDeliveryUnit, 
        finalDeliveryAll: finalDeliveryUnit * s.qty,
        finalDeliveryAllVAT: (finalDeliveryUnit * s.qty) * 1.1
      });

    } catch(err) {
      console.log(err);
    }
  }, [specs, costs, margin, extras, isLegacyLocked]);

  const handleFinalSave = async () => {
    // 코멘트 데이터를 JSON 문자열로 저장
    const commentsJson = JSON.stringify(comments);

    const data = {
      ...specs, ...costs, ...extras, ...extraInfo, ...bagSpecs, ...customerInfo, ...margin,
      factory: costs.factory,
      marginInfo: result,
      comments: commentsJson,
      currentUser: currentUser || '',
      // 금융 데이터 명시적 전달 (시트 컬럼 저장용)
      totalCostAll: result.totalCostUnit || 0, // 시트의 '생산합계'는 개당
      finalDeliveryUnit: result.finalDeliveryUnit || 0,
      finalDeliveryAll: result.finalDeliveryAll || 0,
      finalDeliveryAllVAT: result.finalDeliveryAllVAT || 0,
      marginAmountUnit: result.marginAmountUnit || 0
    };

    // 만약 출고 일자가 선택되어 있다면 구글 캘린더 등록 시도
    if (extraInfo.factoryShipDate) {
      try {
        const apiBase = `http://${window.location.hostname}:3001`;
        const response = await fetch(`${apiBase}/api/calendar/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `[출고] ${item?.company || '신규'} - ${specs.type}`,
            description: `주문번호: ${item?.id}\n수량: ${specs.qty}개\n원단: ${bagSpecs.fabric}\n배송지: ${extraInfo.deliveryAddress}`,
            startDate: extraInfo.factoryShipDate
          })
        });
        const resultJson = await response.json();
        if (resultJson.success) {
          console.log('Calendar event created:', resultJson.eventId);
        }
      } catch (err) {
        console.error('Calendar registration failed', err);
      }
    }

    onSave(data);
  };

  const showD = ["2번 기본형(가로*세로*밑면)", "2-1번 분리형(가로*세로*밑면)", "3번 옆면형(가로*세로*밑면*옆면)"].includes(specs.type);
  const showSideD = ["3번 옆면형(가로*세로*밑면*옆면)", "3-1번 U자형(앞뒤분리)"].includes(specs.type);

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
      <div className="modal-content" style={{maxWidth: '1300px', width: '98vw', height: '92vh'}}>
        <div className="modal-header-container">
          <div className="modal-header-content">
            <div className="modal-header-info">
              <div style={{
                padding:'4px 12px', 
                borderRadius:'20px', 
                fontSize:'12px', 
                fontWeight:'700',
                background: customerInfo.consultType === '신규' ? '#ecfdf5' : '#eff6ff',
                color: customerInfo.consultType === '신규' ? '#10b981' : '#3b82f6',
                border: `1px solid ${customerInfo.consultType === '신규' ? '#10b981' : '#3b82f6'}`
              }}>
                {customerInfo.consultType === '신규' ? '✨ 신규 상담' : '🔄 재상담'}
              </div>
              {othersEditing.length > 0 && (
                <div style={{
                  padding: '4px 12px', background: '#fff1f2', color: '#e11d48',
                  borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #fda4af',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{width: '6px', height: '6px', background: '#e11d48', borderRadius: '50%'}}></span>
                  ⚠️ 현재 {othersEditing.join(', ')} 님이 편집 중입니다!
                </div>
              )}
              <div>
                <div style={{fontSize:'12px', color:'#64748b', marginBottom:'2px', display:'flex', alignItems:'center', gap:'8px'}}>
                  주문 고유번호: <span style={{fontWeight:'700', color:'#1e293b'}}>{item?.id}</span>
                  <span style={{
                    fontSize:'10px', fontWeight:'800', padding:'1px 6px', borderRadius:'4px',
                    background: item.isLegacy ? '#f3e8ff' : '#dbeafe',
                    color: item.isLegacy ? '#7e22ce' : '#1d4ed8',
                    border: `1px solid ${item.isLegacy ? '#c084fc' : '#60a5fa'}`
                  }}>
                    {item.isLegacy ? '💾 기존 데이터' : '🌐 웹앱 데이터'}
                  </span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <h2 style={{margin:0, fontSize:'20px', fontWeight:800}}>{customerInfo.company}</h2>
                  {item.isLegacy && (
                    <button
                      onClick={() => {
                        if (isLegacyLocked) {
                          if (window.confirm('기존 데이터 잠금을 해제하면 자동 계산기가 작동합니다.\n시트에 저장된 금액이 새로 계산된 값으로 변경될 수 있습니다.\n\n잠금을 해제하시겠습니까?')) {
                            setIsLegacyLocked(false);
                          }
                        } else {
                          setIsLegacyLocked(true);
                        }
                      }}
                      style={{
                        fontSize:'12px', fontWeight:700, padding:'4px 14px', borderRadius:'6px', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'6px',
                        background: isLegacyLocked ? '#fef3c7' : '#dcfce7',
                        color: isLegacyLocked ? '#92400e' : '#166534',
                        border: `1px solid ${isLegacyLocked ? '#fbbf24' : '#4ade80'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      {isLegacyLocked ? '🔒 잠금 (시트 금액 보존 중)' : '🔓 잠금해제 (자동계산 활성화)'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-header-controls">
              <div className="modal-header-actions">
                <button 
                  onClick={() => {
                    const newItem = onCopy(item.id);
                    if (newItem) onClose();
                  }}
                  style={{padding:'6px 14px', background:'white', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px', color:'#475569'}}>
                  📋 복사
                </button>
                <button 
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                  style={{padding:'6px 14px', background:'#fff1f2', border:'1px solid #fecaca', color:'#ef4444', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px'}}>
                  🗑️ 삭제
                </button>
              </div>

              <div className="modal-header-status" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{fontSize:'12px', fontWeight:700, color:'#64748b'}}>진행 단계:</span>
                  <select 
                    value={item.status} 
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                    style={{padding:'4px 8px', borderRadius:'6px', border:'none', background:'transparent', fontSize:'14px', fontWeight:800, color:'#4f46e5', cursor:'pointer', outline:'none'}}>
                    {pipelineStages?.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '15px', borderLeft: '1px solid #e2e8f0'}}>
                  <button 
                    onClick={() => {
                      const nextConfirmed = !extraInfo.orderConfirmed;
                      const now = new Date();
                      const dateStr = nextConfirmed ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` : '';
                      
                      setExtraInfo(prev => ({
                        ...prev, 
                        orderConfirmed: nextConfirmed,
                        orderConfirmedDate: dateStr
                      }));
                      
                      // 상태 자동 전환
                      if (nextConfirmed) {
                        onStatusChange(item.id, "오더확정");
                      } else {
                        onStatusChange(item.id, "견적안내");
                      }
                    }}
                    style={{
                      padding: '5px 12px', borderRadius: '20px', border: 'none',
                      background: extraInfo.orderConfirmed ? '#f43f5e' : '#f1f5f9',
                      color: extraInfo.orderConfirmed ? 'white' : '#64748b',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px',
                      boxShadow: extraInfo.orderConfirmed ? '0 2px 4px rgba(244, 63, 94, 0.2)' : 'none'
                    }}>
                    {extraInfo.orderConfirmed ? '✅ 오더확정 ON' : '⚪ 오더확정 OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="tab-button-group" style={{display: 'flex', background: '#f8fafc', padding: '0 24px', borderBottom: '1px solid #e2e8f0'}}>
          {['상담정보', '가방사양', '사양계산', '결제정보', '생산 및 납품'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === tab ? 'var(--primary-color)' : '#64748b',
                fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="modal-body" style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
          
          {/* TAB -1: 상담정보 */}
          {activeTab === '상담정보' && (
            <div style={{flex: 1, padding: '32px', overflowY: 'auto'}}>
              <h3 className="section-title">기본 상담 및 고객 정보</h3>
              <div style={{maxWidth:'800px', background:'white', padding:'32px', borderRadius:'16px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0'}}>
                
                <div style={{marginBottom:'24px'}}>
                  <label style={{display:'block', fontSize:'14px', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>상담 유형 구분</label>
                  <div style={{display:'flex', gap:'12px'}}>
                    <button 
                      onClick={() => setCustomerInfo(prev => ({...prev, consultType: '신규'}))}
                      style={{
                        flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                        background: customerInfo.consultType === '신규' ? '#10b981' : 'white',
                        color: customerInfo.consultType === '신규' ? 'white' : '#64748b',
                        fontWeight: 700, cursor:'pointer', transition:'all 0.2s'
                      }}>
                      ✨ 신규 상담
                    </button>
                    <button 
                      onClick={() => setCustomerInfo(prev => ({...prev, consultType: '재상담'}))}
                      style={{
                        flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                        background: customerInfo.consultType === '재상담' ? '#3b82f6' : 'white',
                        color: customerInfo.consultType === '재상담' ? 'white' : '#64748b',
                        fontWeight: 700, cursor:'pointer', transition:'all 0.2s'
                      }}>
                      🔄 재상담
                    </button>
                  </div>
                </div>

                <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px'}}>
                  <div className="form-group">
                    <label>업체명 (고객명)</label>
                    <input type="text" name="company" value={customerInfo.company} onChange={handleCustomerInfoChange} className="form-control" style={{fontSize:'16px', padding:'12px'}} />
                  </div>
                  <div className="form-group">
                    <label>담당자</label>
                    <input type="text" name="pic" value={customerInfo.pic} onChange={handleCustomerInfoChange} className="form-control" style={{fontSize:'16px', padding:'12px'}} />
                  </div>
                </div>

                <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginTop:'20px'}}>
                  <div className="form-group">
                    <label>연락처 1</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input type="text" name="contact" value={customerInfo.contact} onChange={handleCustomerInfoChange} className="form-control" style={{fontSize:'16px', padding:'12px', flex:1}} />
                      {customerInfo.contact && (
                        <a 
                          href={`tel:${customerInfo.contact}`}
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'center', padding:'0 15px', 
                            background:'#10b981', color:'white', borderRadius:'8px', textDecoration:'none', fontSize:'18px'
                          }}
                          title="전화 걸기">
                          📞
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>연락처 2 (선택)</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input type="text" name="contact2" value={customerInfo.contact2} onChange={handleCustomerInfoChange} className="form-control" style={{fontSize:'16px', padding:'12px', flex:1}} />
                      {customerInfo.contact2 && (
                        <a 
                          href={`tel:${customerInfo.contact2}`}
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'center', padding:'0 15px', 
                            background:'#3b82f6', color:'white', borderRadius:'8px', textDecoration:'none', fontSize:'18px'
                          }}
                          title="전화 걸기">
                          📞
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{marginTop:'20px'}}>
                  <label>이메일 주소</label>
                  <input type="email" name="email" value={customerInfo.email} onChange={handleCustomerInfoChange} className="form-control" style={{fontSize:'16px', padding:'12px'}} />
                </div>

                <div className="form-group" style={{marginTop:'20px'}}>
                  <label>사용 (납품) 예정일</label>
                  <div style={{display:'flex', gap:'8px'}}>
                    <input type="date" name="targetDate" value={bagSpecs.targetDate} onChange={handleBagSpecsChange} className="form-control" style={{fontSize:'16px', padding:'12px', flex:1}} />
                    {bagSpecs.targetDate && (
                      <button onClick={() => setBagSpecs(prev => ({...prev, targetDate: ''}))} style={{padding:'0 16px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600}}>지우기</button>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{marginTop:'32px', borderTop:'2px solid #f1f5f9', paddingTop:'24px'}}>
                  <label style={{fontSize:'16px', fontWeight:'800', color:'#1e293b', display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                    <span>💬</span> 상세 상담 코멘트 (Long-text)
                  </label>
                  <textarea 
                    name="consultMemo" 
                    value={bagSpecs.consultMemo} 
                    onChange={handleBagSpecsChange} 
                    className="form-control" 
                    rows="12" 
                    style={{
                      fontSize:'16px', 
                      padding:'20px', 
                      lineHeight:'1.6', 
                      background:'#fffbeb', 
                      borderColor:'#fef3c7', 
                      borderRadius:'12px',
                      boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)',
                      resize:'vertical'
                    }}
                    placeholder="상세한 상담 내용, 고객의 요구사항 변화, 히스토리 등을 자유롭게 기록하세요."></textarea>
                  <p style={{fontSize:'12px', color:'#94a3b8', marginTop:'8px'}}>* 칸 우측 하단을 드래그하여 높이를 조절할 수 있습니다.</p>
                </div>

                {/* 팀 코멘트 섹션 */}
                <div style={{marginTop:'32px', borderTop:'2px solid #e0e7ff', paddingTop:'24px'}}>
                  <label style={{fontSize:'16px', fontWeight:'800', color:'#4f46e5', display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
                    <span>📝</span> 팀 코멘트
                    {comments.length > 0 && (
                      <span style={{fontSize:'12px', background:'rgba(79,70,229,0.1)', color:'#4f46e5', padding:'2px 8px', borderRadius:'10px', fontWeight:600}}>
                        {comments.length}개
                      </span>
                    )}
                  </label>

                  {/* 기존 코멘트 목록 */}
                  <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px', maxHeight:'300px', overflowY:'auto'}}>
                    {comments.length === 0 ? (
                      <div style={{textAlign:'center', color:'#94a3b8', padding:'20px', background:'#f8fafc', borderRadius:'12px', fontSize:'14px'}}>
                        아직 코멘트가 없습니다. 첫 코멘트를 남겨보세요!
                      </div>
                    ) : (
                      comments.map((c, idx) => (
                        <div key={idx} style={{
                          padding:'12px 16px', background: c.author === currentUser ? '#eef2ff' : '#f8fafc',
                          borderRadius:'12px', border: c.author === currentUser ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                          position:'relative'
                        }}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px'}}>
                            <span style={{fontSize:'13px', fontWeight:700, color: c.author === currentUser ? '#4f46e5' : '#475569'}}>
                              👤 {c.author || '알 수 없음'}
                            </span>
                            <span style={{fontSize:'11px', color:'#94a3b8'}}>{c.time}</span>
                          </div>
                          <div style={{fontSize:'14px', color:'#334155', lineHeight:'1.5', whiteSpace:'pre-wrap'}}>{c.text}</div>
                          {c.author === currentUser && (
                            <button
                              onClick={() => setComments(prev => prev.filter((_, i) => i !== idx))}
                              style={{position:'absolute', top:'8px', right:'8px', background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'#94a3b8', padding:'4px'}}
                              title="삭제"
                            >❌</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* 새 코멘트 입력 */}
                  <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`${currentUser || '작업자'}님, 코멘트를 입력하세요...`}
                      className="form-control"
                      rows="2"
                      style={{flex:1, fontSize:'14px', padding:'12px', borderRadius:'10px', resize:'none'}}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newComment.trim()) {
                            const now = new Date();
                            const timeStr = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                            setComments(prev => [...prev, { author: currentUser || '미지정', text: newComment.trim(), time: timeStr }]);
                            setNewComment('');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newComment.trim()) {
                          const now = new Date();
                          const timeStr = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                          setComments(prev => [...prev, { author: currentUser || '미지정', text: newComment.trim(), time: timeStr }]);
                          setNewComment('');
                        }
                      }}
                      disabled={!newComment.trim()}
                      style={{
                        padding:'12px 20px', background: newComment.trim() ? '#4f46e5' : '#cbd5e1',
                        color:'white', border:'none', borderRadius:'10px', fontWeight:700, fontSize:'14px',
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed', whiteSpace:'nowrap',
                        transition:'all 0.2s'
                      }}
                    >등록</button>
                  </div>
                  <p style={{fontSize:'11px', color:'#94a3b8', marginTop:'6px'}}>* Enter로 빠른 등록, Shift+Enter로 줄바꾼. 저장 버튼을 눌러야 시트에 반영됩니다.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: 가방사양 */}
          {activeTab === '가방사양' && (
            <div style={{flex: 1, padding: '32px', overflowY: 'auto'}}>
              <h3 className="section-title">가방 제작 사양 (상담 기록)</h3>
              <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'900px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  {/* 품목 구분 추가 */}
                  <div className="form-group">
                    <label style={{fontSize:'14px', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>품목 구분</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button 
                        onClick={() => setBagSpecs(prev => ({...prev, productType: '에코백'}))}
                        style={{
                          flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                          background: bagSpecs.productType === '에코백' ? '#4f46e5' : 'white',
                          color: bagSpecs.productType === '에코백' ? 'white' : '#64748b',
                          fontWeight: 700, cursor:'pointer'
                        }}>
                        👜 에코백
                      </button>
                      <button 
                        onClick={() => setBagSpecs(prev => ({...prev, productType: '파우치'}))}
                        style={{
                          flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                          background: bagSpecs.productType === '파우치' ? '#8b5cf6' : 'white',
                          color: bagSpecs.productType === '파우치' ? 'white' : '#64748b',
                          fontWeight: 700, cursor:'pointer'
                        }}>
                        👝 파우치
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>수량 (개)</label>
                    <input type="number" name="qty" value={specs.qty} onChange={handleSpecChange} className="form-control" style={{borderColor:'#10b981', borderWidth:'2px'}}/>
                  </div>
                  <div className="form-group">
                    <label>원단 사양 (재질/두께 등)</label>
                    <input type="text" name="fabric" value={bagSpecs.fabric} onChange={handleBagSpecsChange} className="form-control" placeholder="예: 10수 캔버스 화이트"/>
                  </div>
                  <div className="form-group">
                    <label>사이즈 (가로 * 세로 * 밑면 * 옆면 cm)</label>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px'}}>
                      <div style={{position:'relative'}}>
                        <input type="number" name="w" value={specs.w} onChange={handleSpecChange} className="form-control" style={{paddingRight:'20px'}}/>
                        <span style={{position:'absolute', right:'5px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#94a3b8'}}>W</span>
                      </div>
                      <div style={{position:'relative'}}>
                        <input type="number" name="h" value={specs.h} onChange={handleSpecChange} className="form-control" style={{paddingRight:'20px'}}/>
                        <span style={{position:'absolute', right:'5px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#94a3b8'}}>H</span>
                      </div>
                      <div style={{position:'relative'}}>
                        <input type="number" name="d" value={specs.d} onChange={handleSpecChange} className="form-control" style={{paddingRight:'20px', borderColor: specs.d > 0 ? '#10b981' : '#e2e8f0'}}/>
                        <span style={{position:'absolute', right:'5px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#94a3b8'}}>D</span>
                      </div>
                      <div style={{position:'relative'}}>
                        <input type="number" name="sideD" value={specs.sideD} onChange={handleSpecChange} className="form-control" style={{paddingRight:'20px', borderColor: specs.sideD > 0 ? '#10b981' : '#e2e8f0'}}/>
                        <span style={{position:'absolute', right:'5px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', color:'#94a3b8'}}>S</span>
                      </div>
                    </div>
                    <p style={{fontSize:'11px', color:'#64748b', marginTop:'4px'}}>* 밑면(D)이나 옆면(S) 입력 시 가방 형태가 자동으로 연동됩니다.</p>
                  </div>
                  <div className="form-group">
                    <label>웨빙 사양 (종류/색상/길이 등)</label>
                    <input type="text" name="webbing" value={bagSpecs.webbing} onChange={handleBagSpecsChange} className="form-control" placeholder="예: 면웨빙 3cm 아이보리"/>
                  </div>
                  <div className="form-group">
                    <label>인쇄 사양 (도수/크기 등)</label>
                    <input type="text" name="printing" value={bagSpecs.printing} onChange={handleBagSpecsChange} className="form-control" placeholder="예: 단면 1도 실크스크린"/>
                  </div>
                  <div className="form-group">
                    <label>기타 옵션 (라벨/지퍼/안감 등)</label>
                    <input type="text" name="options" value={bagSpecs.options} onChange={handleBagSpecsChange} className="form-control" placeholder="예: 안주머니, 포인트 라벨 추가"/>
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  <div className="form-group" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <label style={{fontSize:'15px', fontWeight:'800', color:'#1e293b', display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                      <span>💬</span> 상담 코멘트 (상세 기록)
                    </label>
                    <textarea 
                      name="consultMemo" 
                      value={bagSpecs.consultMemo} 
                      onChange={handleBagSpecsChange} 
                      className="form-control" 
                      rows="20" 
                      style={{
                        flex: 1,
                        fontSize:'16px', 
                        padding:'20px', 
                        lineHeight:'1.6', 
                        background:'#fffbeb', 
                        borderColor:'#fef3c7', 
                        borderRadius:'12px',
                        boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)',
                        minHeight: '400px',
                        resize:'vertical'
                      }}
                      placeholder="가방 사양과 관련된 상세한 상담 내용 및 요구사항을 기록하세요."></textarea>
                    <p style={{fontSize:'12px', color:'#94a3b8', marginTop:'8px'}}>
                      * 고객 연락처 정보는 <strong>[상담정보]</strong> 탭에서 관리 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: 사양계산 (요척 및 단가) */}
          {activeTab === '사양계산' && (
            <div className="spec-calc-section" style={{display:'flex', flex: 1, overflow:'hidden'}}>
              {/* LEFT: 뼈대 및 구조 */}
              <div className="spec-calc-col" style={{flex: '1', padding: '24px', overflowY: 'auto', borderRight: '1px solid #f1f5f9', background: '#f8fafc'}}>
                <h3 className="section-title">1. 구조 및 원단 요척 계산</h3>
                <div className="form-group">
                  <label>제작 확정 수량</label>
                  <input type="number" name="qty" value={specs.qty} onChange={handleSpecChange} className="form-control" style={{borderColor:'#10b981', borderWidth:'2px'}}/>
                </div>
                <div className="form-group">
                  <label>가방 재단 형태</label>
                  <select name="type" value={specs.type} onChange={handleSpecChange} className="form-control">
                    {bagTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{display:'flex', justifyContent:'space-between'}}>
                    원단업체 선택
                    <button onClick={() => handleAddSupplier('fabric')} style={{fontSize:'11px', padding:'2px 6px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>+ 업체등록</button>
                  </label>
                  <select name="fabricSupplier" value={specs.fabricSupplier} onChange={handleSpecChange} className="form-control" style={{borderColor:'#3b82f6'}}>
                    {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', background:'white', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px'}}>
                  <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="w" value={specs.w} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="h" value={specs.h} onChange={handleSpecChange} className="form-control"/></div>
                  {showD && <div className="form-group" style={{margin:0}}><label>밑면(cm)</label><input type="number" name="d" value={specs.d} onChange={handleSpecChange} className="form-control"/></div>}
                  {showSideD && <div className="form-group" style={{margin:0}}><label>옆면(cm)</label><input type="number" name="sideD" value={specs.sideD} onChange={handleSpecChange} className="form-control"/></div>}
                </div>

                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>시접 및 원단 단가</h4>
                <div style={{background:'white', padding:'16px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px'}}>
                  <div className="form-group"><label>메인 원단명</label><input type="text" name="fabricName" value={specs.fabricName} onChange={(e) => {
                    const newName = e.target.value;
                    setSpecs(prev => ({
                      ...prev, 
                      fabricName: newName,
                      bodyParts: {
                        partA: { ...prev.bodyParts.partA, name: prev.bodyParts.partA.name === '' || prev.bodyParts.partA.name === prev.fabricName ? newName : prev.bodyParts.partA.name },
                        partB: { ...prev.bodyParts.partB, name: prev.bodyParts.partB.name === '' || prev.bodyParts.partB.name === prev.fabricName ? newName : prev.bodyParts.partB.name },
                        partC: { ...prev.bodyParts.partC, name: prev.bodyParts.partC.name === '' || prev.bodyParts.partC.name === prev.fabricName ? newName : prev.bodyParts.partC.name },
                      }
                    }));
                  }} className="form-control" placeholder="예: 10수 캔버스 화이트"/></div>
                  
                  <div className="form-group">
                    <label>원단 내용 (상세 사양)</label>
                    <textarea 
                      name="fabricContent" 
                      value={specs.fabricContent} 
                      onChange={handleSpecChange} 
                      className="form-control" 
                      rows="3" 
                      style={{fontSize:'12px', background:'#f0f9ff', borderColor:'#bae6fd', borderRadius:'6px'}}
                      placeholder="원단에 대한 상세 설명, 가공 방법 등을 자유롭게 기록하세요."
                    />
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                    <div className="form-group" style={{margin:0}}><label>원단폭(inch)</label><input type="number" name="fabricWidth" value={specs.fabricWidth} onChange={handleSpecChange} className="form-control"/></div>
                    <div className="form-group" style={{margin:0}}><label>야드단가(원)</label><input type="number" name="fabricPrice" value={specs.fabricPrice} onChange={handleSpecChange} className="form-control"/></div>
                  </div>
                  
                  <div style={{marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #f1f5f9'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', color:'#1e293b'}}>
                      <input type="checkbox" checked={specs.useSeparateBodyFabric} onChange={(e) => setSpecs(prev => ({...prev, useSeparateBodyFabric: e.target.checked}))} style={{width:'16px', height:'16px'}} />
                      몸판 부위별 원단 분리 사용 (앞/뒤/옆 등)
                    </label>
                    {specs.useSeparateBodyFabric && (
                      <div style={{marginTop:'12px', display:'flex', flexDirection:'column', gap:'12px', paddingLeft:'24px'}}>
                        {/* Part A: 앞면/메인 */}
                        <div style={{padding:'10px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                          <div style={{fontSize:'12px', fontWeight:700, marginBottom:'6px', color:'#3b82f6'}}>부위 A (앞면/메인)</div>
                          <select value={specs.bodyParts.partA.supplier} onChange={(e) => handleBodyPartFabricChange('partA', 'supplier', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}}>
                            {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input type="text" value={specs.bodyParts.partA.name} onChange={(e) => handleBodyPartFabricChange('partA', 'name', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}} placeholder="원단명"/>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                            <input type="number" value={specs.bodyParts.partA.width} onChange={(e) => handleBodyPartFabricChange('partA', 'width', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="폭(in)"/>
                            <input type="number" value={specs.bodyParts.partA.price} onChange={(e) => handleBodyPartFabricChange('partA', 'price', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="단가(원)"/>
                          </div>
                        </div>
                        {/* Part B: 뒷면/옆면 */}
                        {["1-1번 분리형(가로*세로)", "3번 옆면형(가로*세로*밑면*옆면)", "3-1번 U자형(앞뒤분리)"].includes(specs.type) && (
                          <div style={{padding:'10px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                            <div style={{fontSize:'12px', fontWeight:700, marginBottom:'6px', color:'#3b82f6'}}>부위 B ({specs.type.includes('3번') ? '옆/밑면' : '뒷면'})</div>
                            <select value={specs.bodyParts.partB.supplier} onChange={(e) => handleBodyPartFabricChange('partB', 'supplier', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={specs.bodyParts.partB.name} onChange={(e) => handleBodyPartFabricChange('partB', 'name', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={specs.bodyParts.partB.width} onChange={(e) => handleBodyPartFabricChange('partB', 'width', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="폭(in)"/>
                              <input type="number" value={specs.bodyParts.partB.price} onChange={(e) => handleBodyPartFabricChange('partB', 'price', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        {/* Part C: U자 옆면 */}
                        {specs.type === "3-1번 U자형(앞뒤분리)" && (
                          <div style={{padding:'10px', background:'#f8fafc', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                            <div style={{fontSize:'12px', fontWeight:700, marginBottom:'6px', color:'#3b82f6'}}>부위 C (U자형 옆면)</div>
                            <select value={specs.bodyParts.partC.supplier} onChange={(e) => handleBodyPartFabricChange('partC', 'supplier', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={specs.bodyParts.partC.name} onChange={(e) => handleBodyPartFabricChange('partC', 'name', e.target.value)} className="form-control" style={{fontSize:'12px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={specs.bodyParts.partC.width} onChange={(e) => handleBodyPartFabricChange('partC', 'width', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="폭(in)"/>
                              <input type="number" value={specs.bodyParts.partC.price} onChange={(e) => handleBodyPartFabricChange('partC', 'price', e.target.value)} className="form-control" style={{fontSize:'12px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'12px'}}>
                    <div className="form-group" style={{margin:0}}><label>시접 상단(cm)</label><input type="number" name="topSeam" value={specs.topSeam} onChange={handleSpecChange} className="form-control"/></div>
                    <div className="form-group" style={{margin:0}}><label>시접 하단(cm)</label><input type="number" name="bottomSeam" value={specs.bottomSeam} onChange={handleSpecChange} className="form-control"/></div>
                    <div className="form-group" style={{margin:0}}><label>시접 좌우(cm)</label><input type="number" name="sideSeam" value={specs.sideSeam} onChange={handleSpecChange} className="form-control"/></div>
                  </div>
                  <div className="form-group" style={{margin:0, marginTop:'8px'}}><label>로스율(%)</label><input type="number" name="loss" value={specs.loss} onChange={handleSpecChange} className="form-control"/></div>
                  <div style={{marginTop:'12px', fontSize:'13px', color:'#10b981', fontWeight:'700', padding:'8px', background:'#ecfdf5', borderRadius:'4px', border:'1px solid #a7f3d0', display:'inline-block'}}>
                    → 메인 원단 소요: {result.bodyNetYard || 0} yard/개
                  </div>
                </div>

                  {/* 재끈 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasStrap" checked={extras.hasStrap} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 재끈 (원단끈)
                    </label>
                    {extras.hasStrap && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="strapW" value={extras.strapW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>길이(cm)</label><input type="number" name="strapL" value={extras.strapL} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="strapQty" value={extras.strapQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="strapTopSeam" value={extras.strapTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="strapBottomSeam" value={extras.strapBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="strapSideSeam" value={extras.strapSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.strapFabric.isCustom} onChange={(e) => handleExtraFabricChange('strap', 'isCustom', e.target.checked)} />
                          재끈용 원단 별도 설정
                        </label>
                        {extras.strapFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.strapFabric.supplier} onChange={(e) => handleExtraFabricChange('strap', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.strapFabric.name} onChange={(e) => handleExtraFabricChange('strap', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.strapFabric.width} onChange={(e) => handleExtraFabricChange('strap', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.strapFabric.price} onChange={(e) => handleExtraFabricChange('strap', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 재끈 소요: {result.strapYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 안주머니 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasPocket" checked={extras.hasPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 안주머니
                    </label>
                    {extras.hasPocket && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="pocketW" value={extras.pocketW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="pocketH" value={extras.pocketH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="pocketQty" value={extras.pocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="pocketTopSeam" value={extras.pocketTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="pocketBottomSeam" value={extras.pocketBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="pocketSideSeam" value={extras.pocketSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.pocketFabric.isCustom} onChange={(e) => handleExtraFabricChange('pocket', 'isCustom', e.target.checked)} />
                          안주머니용 원단 별도 설정
                        </label>
                        {extras.pocketFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.pocketFabric.supplier} onChange={(e) => handleExtraFabricChange('pocket', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.pocketFabric.name} onChange={(e) => handleExtraFabricChange('pocket', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.pocketFabric.width} onChange={(e) => handleExtraFabricChange('pocket', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.pocketFabric.price} onChange={(e) => handleExtraFabricChange('pocket', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 안주머니 소요: {result.pocketYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 밑단뎃뎀 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasBottomPatch" checked={extras.hasBottomPatch} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 밑단뎃뎀
                    </label>
                    {extras.hasBottomPatch && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="bottomPatchW" value={extras.bottomPatchW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="bottomPatchH" value={extras.bottomPatchH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="bottomPatchQty" value={extras.bottomPatchQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="bottomPatchTopSeam" value={extras.bottomPatchTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="bottomPatchBottomSeam" value={extras.bottomPatchBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="bottomPatchSideSeam" value={extras.bottomPatchSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.bottomPatchFabric.isCustom} onChange={(e) => handleExtraFabricChange('bottomPatch', 'isCustom', e.target.checked)} />
                          밑단뎃뎀용 원단 별도 설정
                        </label>
                        {extras.bottomPatchFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.bottomPatchFabric.supplier} onChange={(e) => handleExtraFabricChange('bottomPatch', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.bottomPatchFabric.name} onChange={(e) => handleExtraFabricChange('bottomPatch', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.bottomPatchFabric.width} onChange={(e) => handleExtraFabricChange('bottomPatch', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.bottomPatchFabric.price} onChange={(e) => handleExtraFabricChange('bottomPatch', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 밑단뎃뎀 소요: {result.bottomPatchYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 앞주머니 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasFrontPocket" checked={extras.hasFrontPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 앞주머니
                    </label>
                    {extras.hasFrontPocket && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="frontPocketW" value={extras.frontPocketW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="frontPocketH" value={extras.frontPocketH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="frontPocketQty" value={extras.frontPocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="frontPocketTopSeam" value={extras.frontPocketTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="frontPocketBottomSeam" value={extras.frontPocketBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="frontPocketSideSeam" value={extras.frontPocketSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.frontPocketFabric.isCustom} onChange={(e) => handleExtraFabricChange('frontPocket', 'isCustom', e.target.checked)} />
                          앞주머니용 원단 별도 설정
                        </label>
                        {extras.frontPocketFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.frontPocketFabric.supplier} onChange={(e) => handleExtraFabricChange('frontPocket', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.frontPocketFabric.name} onChange={(e) => handleExtraFabricChange('frontPocket', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.frontPocketFabric.width} onChange={(e) => handleExtraFabricChange('frontPocket', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.frontPocketFabric.price} onChange={(e) => handleExtraFabricChange('frontPocket', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 앞주머니 소요: {result.frontPocketYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 옆주머니 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasSidePocket" checked={extras.hasSidePocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 옆주머니
                    </label>
                    {extras.hasSidePocket && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="sidePocketW" value={extras.sidePocketW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="sidePocketH" value={extras.sidePocketH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="sidePocketQty" value={extras.sidePocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="sidePocketTopSeam" value={extras.sidePocketTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="sidePocketBottomSeam" value={extras.sidePocketBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="sidePocketSideSeam" value={extras.sidePocketSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.sidePocketFabric.isCustom} onChange={(e) => handleExtraFabricChange('sidePocket', 'isCustom', e.target.checked)} />
                          옆주머니용 원단 별도 설정
                        </label>
                        {extras.sidePocketFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.sidePocketFabric.supplier} onChange={(e) => handleExtraFabricChange('sidePocket', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.sidePocketFabric.name} onChange={(e) => handleExtraFabricChange('sidePocket', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.sidePocketFabric.width} onChange={(e) => handleExtraFabricChange('sidePocket', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.sidePocketFabric.price} onChange={(e) => handleExtraFabricChange('sidePocket', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 옆주머니 소요: {result.sidePocketYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 텀블러주머니 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasTumblerPocket" checked={extras.hasTumblerPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 텀블러주머니
                    </label>
                    {extras.hasTumblerPocket && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="tumblerPocketW" value={extras.tumblerPocketW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="tumblerPocketH" value={extras.tumblerPocketH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="tumblerPocketQty" value={extras.tumblerPocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="tumblerPocketTopSeam" value={extras.tumblerPocketTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="tumblerPocketBottomSeam" value={extras.tumblerPocketBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="tumblerPocketSideSeam" value={extras.tumblerPocketSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.tumblerPocketFabric.isCustom} onChange={(e) => handleExtraFabricChange('tumblerPocket', 'isCustom', e.target.checked)} />
                          텀블러용 원단 별도 설정
                        </label>
                        {extras.tumblerPocketFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.tumblerPocketFabric.supplier} onChange={(e) => handleExtraFabricChange('tumblerPocket', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.tumblerPocketFabric.name} onChange={(e) => handleExtraFabricChange('tumblerPocket', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.tumblerPocketFabric.width} onChange={(e) => handleExtraFabricChange('tumblerPocket', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.tumblerPocketFabric.price} onChange={(e) => handleExtraFabricChange('tumblerPocket', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 텀블러주머니 소요: {result.tumblerPocketYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 안감 */}
                  <div style={{marginBottom:'12px', borderBottom:'1px solid #f1f5f9', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasLining" checked={extras.hasLining} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 안감 (Lining)
                    </label>
                    {extras.hasLining && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="liningW" value={extras.liningW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="liningH" value={extras.liningH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="liningQty" value={extras.liningQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="liningTopSeam" value={extras.liningTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="liningBottomSeam" value={extras.liningBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="liningSideSeam" value={extras.liningSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.liningFabric.isCustom} onChange={(e) => handleExtraFabricChange('lining', 'isCustom', e.target.checked)} />
                          안감 원단 별도 설정
                        </label>
                        {extras.liningFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.liningFabric.supplier} onChange={(e) => handleExtraFabricChange('lining', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.liningFabric.name} onChange={(e) => handleExtraFabricChange('lining', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.liningFabric.width} onChange={(e) => handleExtraFabricChange('lining', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.liningFabric.price} onChange={(e) => handleExtraFabricChange('lining', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 안감 원단 소요: {result.liningYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 기타 원단 */}
                  <div style={{marginBottom:'12px', pb:'8px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                      <input type="checkbox" name="hasOther" checked={extras.hasOther} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      + 기타 원단 부속
                    </label>
                    {extras.hasOther && (
                      <div style={{paddingLeft:'26px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="otherW" value={extras.otherW} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="otherH" value={extras.otherH} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="otherQty" value={extras.otherQty} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>상단 시접(cm)</label><input type="number" name="otherTopSeam" value={extras.otherTopSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>하단 시접(cm)</label><input type="number" name="otherBottomSeam" value={extras.otherBottomSeam} onChange={handleExtrasChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>좌우 시접(cm)</label><input type="number" name="otherSideSeam" value={extras.otherSideSeam} onChange={handleExtrasChange} className="form-control"/></div>
                        </div>
                        <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', cursor:'pointer', color:'#64748b', mb:'8px'}}>
                          <input type="checkbox" checked={extras.otherFabric.isCustom} onChange={(e) => handleExtraFabricChange('other', 'isCustom', e.target.checked)} />
                          기타 부속용 원단 별도 설정
                        </label>
                        {extras.otherFabric.isCustom && (
                          <div style={{marginTop:'6px', padding:'8px', background:'#f8fafc', borderRadius:'4px', border:'1px solid #e2e8f0'}}>
                            <select value={extras.otherFabric.supplier} onChange={(e) => handleExtraFabricChange('other', 'supplier', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}}>
                              {fabricSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input type="text" value={extras.otherFabric.name} onChange={(e) => handleExtraFabricChange('other', 'name', e.target.value)} className="form-control" style={{fontSize:'11px', marginBottom:'4px'}} placeholder="원단명"/>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px'}}>
                              <input type="number" value={extras.otherFabric.width} onChange={(e) => handleExtraFabricChange('other', 'width', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="폭(in)"/>
                              <input type="number" value={extras.otherFabric.price} onChange={(e) => handleExtraFabricChange('other', 'price', e.target.value)} className="form-control" style={{fontSize:'11px'}} placeholder="단가(원)"/>
                            </div>
                          </div>
                        )}
                        <div style={{marginTop:'6px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                          → 기타 원단 소요: {result.otherYard} yard/개
                        </div>
                      </div>
                    )}
                  </div>

                <div style={{marginTop:'16px', background:'#1e293b', color:'white', padding:'16px', borderRadius:'8px'}}>
                  <div style={{fontSize:'14px', color:'#94a3b8', marginBottom:'12px', borderBottom:'1px solid #334155', pb:'8px', fontWeight:700}}>📋 업체별 통합 원단 발주 리스트</div>
                  <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                    {result.orderGroups && Object.entries(result.orderGroups).map(([supplier, items]) => (
                      <div key={supplier} style={{padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.1)'}}>
                        <div style={{fontSize:'13px', fontWeight:800, color:'#fbbf24', marginBottom:'6px'}}>발주처: {supplier}</div>
                        <table style={{width:'100%', fontSize:'11px', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8'}}>
                              <th style={{textAlign:'left', pb:'4px'}}>품명(원단명)</th>
                              <th style={{textAlign:'center', pb:'4px'}}>규격</th>
                              <th style={{textAlign:'right', pb:'4px'}}>발주량(Gross)</th>
                              <th style={{textAlign:'right', pb:'4px'}}>금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                <td style={{py:'4px'}}>{idx + 1}. {item.name || '미지정'}</td>
                                <td style={{textAlign:'center'}}>{item.width}"</td>
                                <td style={{textAlign:'right', fontWeight:700, color:'#34d399'}}>{item.grossYard} Y</td>
                                <td style={{textAlign:'right'}}>₩ {item.cost.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{textAlign:'right', marginTop:'8px', fontSize:'12px', fontWeight:800, borderTop:'1px solid rgba(255,255,255,0.2)', pt:'4px'}}>
                          업체 합계: <span style={{color:'#fbbf24'}}>₩ {items.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #334155', paddingTop:'12px', marginTop:'12px'}}>
                    <span style={{fontSize:'13px', color:'#94a3b8'}}>전체 원단 구매 총액</span><span style={{fontWeight:'800', color:'#34d399', fontSize:'16px'}}>₩ {result.fabricTotalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE: 부자재 */}
              <div className="spec-calc-col" style={{flex: '1', padding: '24px', overflowY: 'auto'}}>
                <h3 className="section-title">2. 부자재 & 가공비(공임) 입력</h3>
                <div style={{background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                  <div className="form-group">
                    <label style={{display:'flex', justifyContent:'space-between'}}>
                      생산 공장 선택
                      <button onClick={handleAddFactory} style={{fontSize:'11px', padding:'2px 6px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>+ 공장등록</button>
                    </label>
                    <select name="factory" value={costs.factory} onChange={handleCostChange} className="form-control">
                      {factories.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>공임 (개당 재단/봉제비용)</label><input type="number" name="laborUnit" value={costs.laborUnit} onChange={handleCostChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}>
                    <label>공임내용 (상세 공정/주의사항)</label>
                    <textarea name="laborContent" value={costs.laborContent} onChange={handleCostChange} className="form-control" rows="3" style={{minHeight:'80px'}} placeholder="예: 바이어스 마감 처리, 안감 추가 등 상세 공정 내용 입력"></textarea>
                  </div>
                </div>
                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>부자재 (1개당 단가)</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom: '16px'}}>
                  
                  {/* 품목에 따른 순서 변경 로직 */}
                  {bagSpecs.productType === '에코백' ? (
                    <>
                      {/* 1. 웨빙 (에코백 우선) */}
                      <div className="form-group" style={{margin:0}}>
                        <label style={{fontWeight:'700', color:'#1e293b', fontSize:'14px', display:'flex', justifyContent:'space-between'}}>
                          <span>🧵 웨빙 자동 계산</span>
                          <button onClick={() => handleAddSupplier('webbing')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>+ 업체등록</button>
                        </label>
                        <select name="webbingSupplier" value={costs.webbingSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#3b82f6'}}>
                          {webbingSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>완성길이(cm)</label><input type="number" name="webbingFinishLen" value={costs.webbingFinishLen} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>시접(cm)</label><input type="number" name="webbingSeam" value={costs.webbingSeam} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개/가방)</label><input type="number" name="webbingQtyPerBag" value={costs.webbingQtyPerBag} onChange={handleCostChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>웨빙가격(원/롤)</label><input type="number" name="webbingPrice" value={costs.webbingPrice} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>1롤 길이(m)</label><input type="number" name="webbingRollLen" value={costs.webbingRollLen} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>로스(%)</label><input type="number" name="webbingLoss" value={costs.webbingLoss} onChange={handleCostChange} className="form-control"/></div>
                        </div>
                        {(() => {
                          const cutLen = costs.webbingFinishLen + (costs.webbingSeam * 2);
                          const netTotalCm = cutLen * costs.webbingQtyPerBag * specs.qty;
                          const rollLenCm = costs.webbingRollLen * 100;
                          const rollsNeeded = rollLenCm > 0 ? Math.ceil((netTotalCm * (1 + costs.webbingLoss / 100)) / rollLenCm) : 0;
                          const totalCost = rollsNeeded * costs.webbingPrice;
                          return (
                            <div style={{marginTop:'10px', background:'#1e293b', color:'white', padding:'12px', borderRadius:'8px', fontSize:'12px'}}>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>1개당 재단길이</span><span>{cutLen} cm</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>웨빙 주문길이(Net)</span><span>{netTotalCm.toLocaleString()} cm</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>최종 주문(롤)</span><span style={{fontWeight:'700', color:'#fbbf24'}}>{rollsNeeded} 롤</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>웨빙 예상비용</span><span>₩ {totalCost.toLocaleString()}</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #475569', paddingTop:'6px', marginTop:'4px'}}>
                                <span style={{fontWeight:'700', color:'#fbbf24'}}>★ 1개당 웨빙 비용</span><span style={{fontWeight:'800', color:'#34d399', fontSize:'14px'}}>₩ {costs.webbingUnit.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div style={{marginTop:'8px'}}>
                          <label style={{fontSize:'11px', color:'#64748b'}}>웨빙내용</label>
                          <textarea name="webbingContent" value={costs.webbingContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="종류, 색상 등"></textarea>
                        </div>
                      </div>

                      {/* 2. 금속/기타 부속 (에코백 차순위) */}
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                          <input type="checkbox" checked={costs.hasMetal} onChange={(e) => setCosts(prev => ({...prev, hasMetal: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                          <span>금속/기타 부속</span>
                          <button onClick={() => handleAddSupplier('metal')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                        </label>
                        {costs.hasMetal && (
                          <select name="metalSupplier" value={costs.metalSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#94a3b8'}}>
                            {metalSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {costs.hasMetal && (<>
                          <input type="number" name="metalUnit" value={costs.metalUnit} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                          <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 내용</label>
                          <textarea name="metalContent" value={costs.metalContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                        </>)}
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                          <input type="checkbox" checked={costs.hasMetal2} onChange={(e) => setCosts(prev => ({...prev, hasMetal2: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                          <span>금속/기타 부속 2</span>
                          <button onClick={() => handleAddSupplier('metal')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                        </label>
                        {costs.hasMetal2 && (
                          <select name="metalSupplier2" value={costs.metalSupplier2} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#94a3b8'}}>
                            {metalSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {costs.hasMetal2 && (<>
                          <input type="number" name="metalUnit2" value={costs.metalUnit2} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                          <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 2 내용</label>
                          <textarea name="metalContent2" value={costs.metalContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                        </>)}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 1. 금속/기타 부속 (파우치 우선) */}
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                          <input type="checkbox" checked={costs.hasMetal} onChange={(e) => setCosts(prev => ({...prev, hasMetal: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                          <span>금속/기타 부속</span>
                          <button onClick={() => handleAddSupplier('metal')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                        </label>
                        {costs.hasMetal && (
                          <select name="metalSupplier" value={costs.metalSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#94a3b8'}}>
                            {metalSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {costs.hasMetal && (<>
                          <input type="number" name="metalUnit" value={costs.metalUnit} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                          <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 내용</label>
                          <textarea name="metalContent" value={costs.metalContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                        </>)}
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                          <input type="checkbox" checked={costs.hasMetal2} onChange={(e) => setCosts(prev => ({...prev, hasMetal2: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                          <span>금속/기타 부속 2</span>
                          <button onClick={() => handleAddSupplier('metal')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                        </label>
                        {costs.hasMetal2 && (
                          <select name="metalSupplier2" value={costs.metalSupplier2} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#94a3b8'}}>
                            {metalSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {costs.hasMetal2 && (<>
                          <input type="number" name="metalUnit2" value={costs.metalUnit2} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                          <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 2 내용</label>
                          <textarea name="metalContent2" value={costs.metalContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                        </>)}
                      </div>

                      {/* 2. 웨빙 (파우치 차순위) */}
                      <div className="form-group" style={{margin:0}}>
                        <label style={{fontWeight:'700', color:'#1e293b', fontSize:'14px', display:'flex', justifyContent:'space-between'}}>
                          <span>🧵 웨빙 자동 계산</span>
                          <button onClick={() => handleAddSupplier('webbing')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>+ 업체등록</button>
                        </label>
                        <select name="webbingSupplier" value={costs.webbingSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#3b82f6'}}>
                          {webbingSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>완성길이(cm)</label><input type="number" name="webbingFinishLen" value={costs.webbingFinishLen} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>시접(cm)</label><input type="number" name="webbingSeam" value={costs.webbingSeam} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>수량(개/가방)</label><input type="number" name="webbingQtyPerBag" value={costs.webbingQtyPerBag} onChange={handleCostChange} className="form-control"/></div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                          <div className="form-group" style={{margin:0}}><label>웨빙가격(원/롤)</label><input type="number" name="webbingPrice" value={costs.webbingPrice} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>1롤 길이(m)</label><input type="number" name="webbingRollLen" value={costs.webbingRollLen} onChange={handleCostChange} className="form-control"/></div>
                          <div className="form-group" style={{margin:0}}><label>로스(%)</label><input type="number" name="webbingLoss" value={costs.webbingLoss} onChange={handleCostChange} className="form-control"/></div>
                        </div>
                        {(() => {
                          const cutLen = costs.webbingFinishLen + (costs.webbingSeam * 2);
                          const netTotalCm = cutLen * costs.webbingQtyPerBag * specs.qty;
                          const rollLenCm = costs.webbingRollLen * 100;
                          const rollsNeeded = rollLenCm > 0 ? Math.ceil((netTotalCm * (1 + costs.webbingLoss / 100)) / rollLenCm) : 0;
                          const totalCost = rollsNeeded * costs.webbingPrice;
                          return (
                            <div style={{marginTop:'10px', background:'#1e293b', color:'white', padding:'12px', borderRadius:'8px', fontSize:'12px'}}>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>1개당 재단길이</span><span>{cutLen} cm</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>웨빙 주문길이(Net)</span><span>{netTotalCm.toLocaleString()} cm</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#fbbf24'}}>최종 주문(롤)</span><span style={{fontWeight:'700', color:'#fbbf24'}}>{rollsNeeded} 롤</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                <span style={{color:'#94a3b8'}}>웨빙 예상비용</span><span>₩ {totalCost.toLocaleString()}</span>
                              </div>
                              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #475569', paddingTop:'6px', marginTop:'4px'}}>
                                <span style={{fontWeight:'700', color:'#fbbf24'}}>★ 1개당 웨빙 비용</span><span style={{fontWeight:'800', color:'#34d399', fontSize:'14px'}}>₩ {costs.webbingUnit.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div style={{marginTop:'8px'}}>
                          <label style={{fontSize:'11px', color:'#64748b'}}>웨빙내용</label>
                          <textarea name="webbingContent" value={costs.webbingContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="종류, 색상 등"></textarea>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 바이어스 섹션 (공통 하단) */}
                  {/* 겉헤리(바이어스) 토글 */}
                  <div className="form-group" style={{margin:0, marginTop:'12px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'700', color:'#1e293b', fontSize:'14px'}}>
                      <input type="checkbox" name="hasOuterBias" checked={costs.hasOuterBias} onChange={(e) => setCosts(prev => ({...prev, hasOuterBias: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'#f59e0b'}} />
                      <span>🎨 겉헤리(바이어스) 자동계산</span>
                      <button onClick={() => handleAddSupplier('bias')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                    </label>
                    {costs.hasOuterBias && (
                      <select name="outerBiasSupplier" value={costs.outerBiasSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#f59e0b'}}>
                        {biasSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    {costs.hasOuterBias && (<>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                        <div className="form-group" style={{margin:0}}><label>완성길이(cm)</label><input type="number" name="outerBiasFinishLen" value={costs.outerBiasFinishLen} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>시접(cm)</label><input type="number" name="outerBiasSeam" value={costs.outerBiasSeam} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>수량(개/가방)</label><input type="number" name="outerBiasQtyPerBag" value={costs.outerBiasQtyPerBag} onChange={handleCostChange} className="form-control"/></div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                        <div className="form-group" style={{margin:0}}><label>가격(원/롤)</label><input type="number" name="outerBiasPrice" value={costs.outerBiasPrice} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>1롤 길이(m)</label><input type="number" name="outerBiasRollLen" value={costs.outerBiasRollLen} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>로스(%)</label><input type="number" name="outerBiasLoss" value={costs.outerBiasLoss} onChange={handleCostChange} className="form-control"/></div>
                      </div>
                      {(() => {
                        const cutLen = costs.outerBiasFinishLen + (costs.outerBiasSeam * 2);
                        const netTotalCm = cutLen * costs.outerBiasQtyPerBag * specs.qty;
                        const rollLenCm = costs.outerBiasRollLen * 100;
                        const rollsNeeded = rollLenCm > 0 ? Math.ceil((netTotalCm * (1 + costs.outerBiasLoss / 100)) / rollLenCm) : 0;
                        const totalCost = rollsNeeded * costs.outerBiasPrice;
                        return (
                          <div style={{marginTop:'10px', background:'#78350f', color:'white', padding:'12px', borderRadius:'8px', fontSize:'12px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span style={{color:'#fbbf24'}}>1개당 재단길이</span><span>{cutLen} cm</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span style={{color:'#fbbf24'}}>최종 주문(롤)</span><span style={{fontWeight:'700'}}>{rollsNeeded} 롤</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #92400e', paddingTop:'6px', marginTop:'4px'}}>
                              <span style={{fontWeight:'700', color:'#fbbf24'}}>★ 1개당 겉헤리 비용</span><span style={{fontWeight:'800', color:'#34d399', fontSize:'14px'}}>₩ {costs.outerBiasUnit.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </>)}
                    {costs.hasOuterBias && (
                      <div style={{marginTop:'8px'}}>
                        <label style={{fontSize:'11px', color:'#64748b'}}>겉헤리 내용</label>
                        <textarea name="outerBiasContent" value={costs.outerBiasContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="겉헤리 종류, 색상, 폭 등"></textarea>
                      </div>
                    )}
                  </div>

                  {/* 속헤리(바이어스) 토글 */}
                  <div className="form-group" style={{margin:0, marginTop:'12px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'700', color:'#1e293b', fontSize:'14px'}}>
                      <input type="checkbox" name="hasInnerBias" checked={costs.hasInnerBias} onChange={(e) => setCosts(prev => ({...prev, hasInnerBias: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'#8b5cf6'}} />
                      <span>🪡 속헤리(바이어스) 자동계산</span>
                      <button onClick={() => handleAddSupplier('bias')} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                    </label>
                    {costs.hasInnerBias && (
                      <select name="innerBiasSupplier" value={costs.innerBiasSupplier} onChange={handleCostChange} className="form-control" style={{marginTop:'8px', borderColor:'#8b5cf6'}}>
                        {biasSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    {costs.hasInnerBias && (<>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                        <div className="form-group" style={{margin:0}}><label>완성길이(cm)</label><input type="number" name="innerBiasFinishLen" value={costs.innerBiasFinishLen} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>시접(cm)</label><input type="number" name="innerBiasSeam" value={costs.innerBiasSeam} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>수량(개/가방)</label><input type="number" name="innerBiasQtyPerBag" value={costs.innerBiasQtyPerBag} onChange={handleCostChange} className="form-control"/></div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginTop:'8px'}}>
                        <div className="form-group" style={{margin:0}}><label>가격(원/롤)</label><input type="number" name="innerBiasPrice" value={costs.innerBiasPrice} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>1롤 길이(m)</label><input type="number" name="innerBiasRollLen" value={costs.innerBiasRollLen} onChange={handleCostChange} className="form-control"/></div>
                        <div className="form-group" style={{margin:0}}><label>로스(%)</label><input type="number" name="innerBiasLoss" value={costs.innerBiasLoss} onChange={handleCostChange} className="form-control"/></div>
                      </div>
                      {(() => {
                        const cutLen = costs.innerBiasFinishLen + (costs.innerBiasSeam * 2);
                        const netTotalCm = cutLen * costs.innerBiasQtyPerBag * specs.qty;
                        const rollLenCm = costs.innerBiasRollLen * 100;
                        const rollsNeeded = rollLenCm > 0 ? Math.ceil((netTotalCm * (1 + costs.innerBiasLoss / 100)) / rollLenCm) : 0;
                        const totalCost = rollsNeeded * costs.innerBiasPrice;
                        return (
                          <div style={{marginTop:'10px', background:'#4c1d95', color:'white', padding:'12px', borderRadius:'8px', fontSize:'12px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span style={{color:'#c4b5fd'}}>1개당 재단길이</span><span>{cutLen} cm</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><span style={{color:'#c4b5fd'}}>최종 주문(롤)</span><span style={{fontWeight:'700'}}>{rollsNeeded} 롤</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #6d28d9', paddingTop:'6px', marginTop:'4px'}}>
                              <span style={{fontWeight:'700', color:'#c4b5fd'}}>★ 1개당 속헤리 비용</span><span style={{fontWeight:'800', color:'#34d399', fontSize:'14px'}}>₩ {costs.innerBiasUnit.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </>)}
                    {costs.hasInnerBias && (
                      <div style={{marginTop:'8px'}}>
                        <label style={{fontSize:'11px', color:'#64748b'}}>속헤리 내용</label>
                        <textarea name="innerBiasContent" value={costs.innerBiasContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="속헤리 종류, 색상, 폭 등"></textarea>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom:'16px', borderTop:'2px dashed #e2e8f0', paddingTop:'16px', marginTop:'8px'}}>
                  <div className="form-group" style={{margin:0}}>
                    <label style={{fontWeight:'800', color:'#047857', fontSize:'15px', display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                      <span>🖨️ 인쇄 1 (1개당 단가)</span>
                      <button onClick={() => handleAddSupplier('print')} style={{fontSize:'10px', padding:'2px 6px', background:'white', border:'1px solid #a7f3d0', borderRadius:'4px', cursor:'pointer', fontWeight:'normal', color:'#047857'}}>+ 업체등록</button>
                    </label>
                    <select name="printSupplier" value={costs.printSupplier} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px', borderColor:'#10b981', backgroundColor:'#f0fdf4'}}>
                      {printSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" name="printUnit" value={costs.printUnit} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}} placeholder="인쇄 단가 입력"/>
                    <div style={{fontSize:'13px', color:'white', fontWeight:'700', marginBottom:'12px', padding:'8px 12px', background:'#059669', borderRadius:'6px', display:'flex', justifyContent:'space-between'}}>
                      <span>인쇄 총비용 ({specs.qty}개)</span>
                      <span>₩ {(costs.printUnit * specs.qty).toLocaleString()}</span>
                    </div>
                    <label style={{fontSize:'11px', color:'#64748b'}}>인쇄내용</label>
                    <textarea name="printContent" value={costs.printContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="인쇄 방식, 도수 등"></textarea>
                  </div>
                  <div className="form-group" style={{margin:0, borderTop:'1px dashed #cbd5e1', paddingTop:'12px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'800', color:'#047857', fontSize:'14px'}}>
                      <input type="checkbox" checked={costs.hasPrint2} onChange={(e) => setCosts(prev => ({...prev, hasPrint2: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'#059669'}} />
                      <span>🖨️ 인쇄 2 (1개당 단가)</span>
                      <button onClick={(e) => { e.preventDefault(); handleAddSupplier('print'); }} style={{fontSize:'10px', padding:'2px 6px', background:'white', border:'1px solid #a7f3d0', borderRadius:'4px', cursor:'pointer', marginLeft:'auto', fontWeight:'normal', color:'#047857'}}>+ 업체등록</button>
                    </label>
                    {costs.hasPrint2 && (<>
                      <select name="printSupplier2" value={costs.printSupplier2} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px', marginTop:'10px', borderColor:'#10b981', backgroundColor:'#f0fdf4'}}>
                        {printSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" name="printUnit2" value={costs.printUnit2} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}} placeholder="추가 인쇄 단가 입력"/>
                      <div style={{fontSize:'13px', color:'white', fontWeight:'700', marginBottom:'12px', padding:'8px 12px', background:'#059669', borderRadius:'6px', display:'flex', justifyContent:'space-between'}}>
                        <span>인쇄 2 총비용 ({specs.qty}개)</span>
                        <span>₩ {(costs.printUnit2 * specs.qty).toLocaleString()}</span>
                      </div>
                      <label style={{fontSize:'11px', color:'#64748b'}}>인쇄 2 내용</label>
                      <textarea name="printContent2" value={costs.printContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="인쇄 2 방식, 도수 등"></textarea>
                    </>)}
                  </div>
                </div>
                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>운임/소모품 (총액 기준)</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px'}}>
                  <div className="form-group" style={{margin:0, background:'#f8fafc', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                      <span style={{fontWeight:'700'}}>운임/소모품 1</span>
                      <button onClick={(e) => { e.preventDefault(); handleAddSupplier('freight'); }} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>+ 업체등록</button>
                    </label>
                    <select name="freightSupplier" value={costs.freightSupplier} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px', borderColor:'#64748b'}}>
                      {freightSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" name="freightTotal" value={costs.freightTotal} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}} placeholder="총 비용 (원)"/>
                    <textarea name="freightContent" value={costs.freightContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="운임 1 상세 내용"></textarea>
                  </div>

                  <div className="form-group" style={{margin:0, background:'#f8fafc', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'700'}}>
                      <input type="checkbox" checked={costs.hasFreight2} onChange={(e) => setCosts(prev => ({...prev, hasFreight2: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'#64748b'}} />
                      <span>운임/소모품 2</span>
                      <button onClick={(e) => { e.preventDefault(); handleAddSupplier('freight'); }} style={{fontSize:'10px', padding:'2px 4px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer', marginLeft:'auto'}}>+ 업체등록</button>
                    </label>
                    {costs.hasFreight2 && (<>
                      <select name="freightSupplier2" value={costs.freightSupplier2} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px', marginTop:'8px', borderColor:'#64748b'}}>
                        {freightSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" name="freightTotal2" value={costs.freightTotal2} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}} placeholder="총 비용 (원)"/>
                      <textarea name="freightContent2" value={costs.freightContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="운임 2 상세 내용"></textarea>
                    </>)}
                  </div>
                </div>
              </div>

              {/* RIGHT: 최종 요약 및 마진 계산 */}
              <div className="spec-calc-col summary-panel" style={{flex: '1.2', padding: '32px', overflowY: 'auto', background: '#f8fafc', display:'flex', flexDirection:'column'}}>
                <h3 className="section-title" style={{color: '#3730a3', borderColor: '#c7d2fe'}}>3. 견적/이익 요약</h3>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom:'20px'}}>
                  <div style={{fontSize:'14px', color:'#64748b', marginBottom:'12px', fontWeight:'600'}}>가방 1개당 원가 breakdown</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>원단비 ({result.netYard} Y)</span> <span>₩ {Math.round(result.fabricUnitCost).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>부자재 합계</span> <span>₩ {(costs.webbingUnit + costs.metalUnit + costs.metalUnit2 + costs.outerBiasUnit + costs.innerBiasUnit).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>인쇄비 (1{costs.hasPrint2 && '+2'})</span> <span>₩ {(costs.printUnit + (costs.hasPrint2 ? costs.printUnit2 : 0)).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>물류/소모품 (1{costs.hasFreight2 && '+2'})</span> <span>₩ {Math.round((costs.freightTotal + (costs.hasFreight2 ? costs.freightTotal2 : 0)) / specs.qty || 0).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', paddingBottom:'8px', borderBottom:'1px dashed #cbd5e1'}}><span>공장 공임</span> <span>₩ {costs.laborUnit.toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:'12px', alignItems:'center'}}><span style={{fontSize:'15px', fontWeight:'700', color:'#1e293b'}}>총 1개당 시원가</span> <span style={{fontSize:'22px', fontWeight:'800'}}>₩ {Math.round(result.totalCostUnit).toLocaleString()}</span></div>
                </div>

                <div style={{background:'#ffffff', padding:'20px', borderRadius:'12px', border:'2px solid #6366f1'}}>
                  <div style={{fontWeight:'700', color:'#4f46e5', marginBottom:'16px'}}>마진 세팅 (직접 제어)</div>
                  <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                    <div className="form-group" style={{margin:0}}>
                      <label>마진율 (%)</label>
                      <div style={{display:'flex', alignItems:'center', background:'#f1f5f9', borderRadius:'6px'}}>
                        <input type="number" value={margin.percent} onChange={handleMarginPercentChange} className="form-control" style={{background:'transparent', border:'none', flex:1}}/><span style={{paddingRight:'12px'}}>%</span>
                      </div>
                    </div>
                    <div className="form-group" style={{margin:0}}><label>납품가 직접입력(원)</label><input type="number" value={margin.customDeliveryUnit || ''} onChange={handleDeliveryPriceChange} className="form-control" style={{borderColor: margin.customDeliveryUnit ? '#ef4444' : '#cbd5e1'}}/></div>
                  </div>
                  <div style={{marginTop:'16px', display:'flex', justifyContent:'space-between', color:'#64748b'}}>
                     <span>1개당 마진 차액: </span>
                     <span style={{fontWeight:'700', color:(result.marginAmountUnit > 0 ? '#10b981' : '#ef4444')}}>₩ {Math.round(result.marginAmountUnit).toLocaleString()}</span>
                  </div>
                  <div style={{marginTop:'8px', display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e2e8f0', color:'#334155'}}>
                     <span style={{fontWeight:'600'}}>마진 합계 ({specs.qty}개): </span>
                     <span style={{fontWeight:'800', fontSize:'16px', color:(result.marginAmountUnit > 0 ? '#059669' : '#dc2626')}}>₩ {Math.round(result.marginAmountUnit * specs.qty).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{marginTop:'auto', background:'linear-gradient(to right, #4f46e5, #4338ca)', color:'white', padding:'24px', borderRadius:'12px', boxShadow:'0 10px 15px -3px rgba(79, 70, 229, 0.4)'}}>
                  <div style={{fontSize:'14px', color:'#c7d2fe', marginBottom:'4px'}}>최종 고객 안내가 (공급가액 합계)</div>
                  <div style={{fontSize:'32px', fontWeight:'800'}}>₩ {Math.round(result.finalDeliveryAll).toLocaleString()}</div>
                  <div style={{marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.2)'}}>
                    <div style={{fontSize:'12px', color:'#c7d2fe', marginBottom:'2px'}}>부가세 10% 포함 합계</div>
                    <div style={{fontSize:'20px', fontWeight:'700'}}>₩ {Math.round(result.finalDeliveryAllVAT).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 결제 정보 */}
          {activeTab === '결제정보' && (
            <div style={{flex: 1, padding: '32px', overflowY: 'auto'}}>
              <h3 className="section-title">결제 상태 및 계산서 (세무/회계)</h3>
              <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'1100px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                  {/* 결제 담당자 정보를 왼쪽 상단으로 이동 */}
                  <div style={{background:'#f8fafc', padding:'24px', borderRadius:'12px', border:'1px solid #e2e8f0'}}>
                    <h4 style={{margin:'0 0 16px 0', fontSize:'16px', color:'#1e293b', display:'flex', alignItems:'center', gap:'8px'}}>
                      <span>💳</span> 결제 담당자 정보
                    </h4>
                    <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                      <div className="form-group" style={{margin:0}}>
                        <label>결제 담당자 성함</label>
                        <input type="text" name="paymentPic" value={extraInfo.paymentPic} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label>담당자 이메일</label>
                        <input type="email" name="paymentEmail" value={extraInfo.paymentEmail} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label>담당자 연락처 1</label>
                        <input type="text" name="paymentContact" value={extraInfo.paymentContact} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label>담당자 연락처 2</label>
                        <input type="text" name="paymentContact2" value={extraInfo.paymentContact2} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                    </div>
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                    <div className="form-group">
                      <label>결제 수량 / 금액 안내내용</label>
                      <textarea name="paymentContent" value={extraInfo.paymentContent} onChange={handleExtraInfoChange} className="form-control" rows="3" placeholder="예: 무통장입금으로 50% 선금 결제 등"></textarea>
                    </div>
                    <div className="form-group">
                      <label>결제방법</label>
                      <select name="paymentMethod" value={extraInfo.paymentMethod} onChange={handleExtraInfoChange} className="form-control">
                        <option value="계좌이체">계좌이체</option>
                        <option value="카드결제">카드결제</option>
                        <option value="현금영수증">현금영수증</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                      <div className="form-group">
                        <label>결제 선금 (입금액)</label>
                        <input type="number" name="deposit" value={extraInfo.deposit} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                      <div className="form-group">
                        <label>결제 잔금 (미수금)</label>
                        <input type="number" name="balance" value={extraInfo.balance} onChange={handleExtraInfoChange} className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  <div className="form-group">
                    <label>세금계산서 1 (발행일/예정일) 및 집계 비율</label>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <input type="date" name="tax1" value={extraInfo.tax1} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} />
                      <div style={{display:'flex', alignItems:'center', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0 8px'}}>
                        <input type="number" name="tax1Ratio" value={extraInfo.tax1Ratio} onChange={handleExtraInfoChange} style={{width:'40px', border:'none', background:'transparent', textAlign:'right', outline:'none', fontWeight:600}} />
                        <span style={{color:'#64748b', fontSize:'13px', marginLeft:'4px'}}>%</span>
                      </div>
                      <div style={{fontSize:'12px', color:'#4f46e5', fontWeight:700, width:'80px', textAlign:'right'}}>
                        ₩ {Math.round((result.finalDeliveryAllVAT || 0) * ((parseFloat(extraInfo.tax1Ratio) || 0) / 100)).toLocaleString()}
                      </div>
                      {extraInfo.tax1 && (
                        <button onClick={() => setExtraInfo(prev => ({...prev, tax1: ''}))} style={{padding:'8px 12px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600}}>지우기</button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>세금계산서 2 (발행일/예정일) 및 집계 비율</label>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <input type="date" name="tax2" value={extraInfo.tax2} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} />
                      <div style={{display:'flex', alignItems:'center', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0 8px'}}>
                        <input type="number" name="tax2Ratio" value={extraInfo.tax2Ratio} onChange={handleExtraInfoChange} style={{width:'40px', border:'none', background:'transparent', textAlign:'right', outline:'none', fontWeight:600}} />
                        <span style={{color:'#64748b', fontSize:'13px', marginLeft:'4px'}}>%</span>
                      </div>
                      <div style={{fontSize:'12px', color:'#4f46e5', fontWeight:700, width:'80px', textAlign:'right'}}>
                        ₩ {Math.round((result.finalDeliveryAllVAT || 0) * ((parseFloat(extraInfo.tax2Ratio) || 0) / 100)).toLocaleString()}
                      </div>
                      {extraInfo.tax2 && (
                        <button onClick={() => setExtraInfo(prev => ({...prev, tax2: ''}))} style={{padding:'8px 12px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600}}>지우기</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 생산 및 납품 */}
          {activeTab === '생산 및 납품' && (
            <div style={{flex: 1, padding: '32px', overflowY: 'auto'}}>
              <h3 className="section-title">생산 관리 및 배송 (물류/공장)</h3>
              <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'1000px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'16px', background:'#f8fafc', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0'}}>
                  <h4 style={{margin:0, color:'#1e293b'}}>공장 및 작업 파일</h4>
                  <div className="form-group">
                    <label style={{display:'flex', justifyContent:'space-between'}}>
                      구글 드라이브 (작업지시서/도안 링크)
                      <button 
                        onClick={handleCreateDriveFolder}
                        style={{fontSize:'11px', padding:'2px 8px', background:'var(--primary-color)', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:600}}>
                        📁 폴더 생성
                      </button>
                    </label>
                    <div style={{display:'flex', gap:'8px', marginTop:'4px'}}>
                      <input type="url" name="driveLink" value={extraInfo.driveLink} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} placeholder="https://drive.google.com/..." />
                      {extraInfo.driveLink && (
                        <button 
                          onClick={() => window.open(extraInfo.driveLink, '_blank')}
                          style={{padding:'0 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', whiteSpace:'nowrap'}}>
                          🔗 열기
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-group" style={{borderTop:'1px solid #e2e8f0', paddingTop:'16px'}}>
                    <label style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'700', color:'#1e293b'}}>🖼️ 시안 이미지 확인 (드라이브 연동)</span>
                      <button onClick={fetchProofFiles} disabled={isFetchingProofs} style={{fontSize:'11px', padding:'4px 8px', background:'#f8fafc', border:'1px solid #cbd5e1', borderRadius:'4px', cursor: isFetchingProofs ? 'not-allowed' : 'pointer', fontWeight:600}}>
                        {isFetchingProofs ? '⏳ 불러오는 중...' : '🔄 리스트 불러오기/새로고침'}
                      </button>
                    </label>
                    <div style={{marginTop:'8px', background:'white', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'8px'}}>
                      {proofFiles.length === 0 ? (
                        <div style={{fontSize:'12px', color:'#94a3b8', textAlign:'center', padding:'12px 0'}}>
                          드라이브 폴더에 업로드된 시안 파일이 없습니다.<br/>
                          '리스트 불러오기' 버튼을 눌러 목록을 업데이트하세요.
                        </div>
                      ) : (
                        <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'6px'}}>
                          {proofFiles.map(file => (
                            <li key={file.id} style={{fontSize:'12px', display:'flex', alignItems:'center', gap:'8px', padding:'6px', background:'#f8fafc', borderRadius:'4px'}}>
                              <span 
                                style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#3b82f6', cursor:'pointer', textDecoration:'underline'}} 
                                onClick={() => setSelectedProof(file)}>
                                📄 {file.name}
                              </span>
                              <button onClick={() => window.open(file.webViewLink, '_blank')} style={{fontSize:'10px', padding:'2px 6px', background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', cursor:'pointer'}}>드라이브 열기</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>작업지시서(작지) 확인 일자</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input type="date" name="workOrderDate" value={extraInfo.workOrderDate} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} />
                      {extraInfo.workOrderDate && (
                        <button onClick={() => setExtraInfo(prev => ({...prev, workOrderDate: ''}))} style={{padding:'0 12px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600}}>지우기</button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>생산내용 특이사항 체크</label>
                    <textarea name="prodCheck" value={extraInfo.prodCheck} onChange={handleExtraInfoChange} className="form-control" rows="3" placeholder="예: 시접 꼼꼼히, 인쇄 번짐 주의요망"></textarea>
                  </div>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'16px', background:'#f0fdf4', padding:'20px', borderRadius:'12px', border:'1px solid #bbf7d0'}}>
                  <h4 style={{margin:0, color:'#166534'}}>출고 및 납품</h4>
                  <div className="form-group">
                    <label>공장 출고 일자</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input type="date" name="factoryShipDate" value={extraInfo.factoryShipDate} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} />
                      {extraInfo.factoryShipDate && (
                        <button onClick={() => setExtraInfo(prev => ({...prev, factoryShipDate: ''}))} style={{padding:'0 12px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600}}>지우기</button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>납품(배송) 도착 주소</label>
                    <textarea name="deliveryAddress" value={extraInfo.deliveryAddress} onChange={handleExtraInfoChange} className="form-control" rows="3" placeholder="받으시는 분 주소 입력"></textarea>
                  </div>
                  <div className="form-group">
                    <label>택배 송장번호</label>
                    <input type="text" name="trackingNum" value={extraInfo.trackingNum} onChange={handleExtraInfoChange} className="form-control" placeholder="예: 로젠 1234-5678-90" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM GLOBAL ACTION BUTTON */}
        <div className="modal-footer-container">
            <button 
              className="modal-footer-btn-secondary"
              onClick={handleGenerateEstimate}>
              📄 견적서 발행 (PDF)
            </button>
            <button 
              className="modal-footer-btn-primary"
              onClick={handleFinalSave}>
              모든 사양 및 정보 저장하기 (상태 전환)
            </button>
        </div>
      </div>

      {/* 시안 이미지 뷰어 모달 */}
      {selectedProof && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          <div style={{position:'absolute', top:'20px', right:'20px'}}>
            <button onClick={() => setSelectedProof(null)} style={{background:'transparent', border:'none', color:'white', fontSize:'36px', cursor:'pointer', textShadow:'0 2px 4px rgba(0,0,0,0.5)'}}>×</button>
          </div>
          <div style={{color:'white', marginBottom:'16px', fontSize:'18px', fontWeight:600, padding:'8px 16px', background:'rgba(0,0,0,0.5)', borderRadius:'8px'}}>{selectedProof.name}</div>
          <img 
            src={`http://${window.location.hostname}:3001/api/drive/image/${selectedProof.id}`} 
            alt={selectedProof.name}
            style={{maxWidth:'90%', maxHeight:'80vh', objectFit:'contain', borderRadius:'8px', boxShadow:'0 10px 25px rgba(0,0,0,0.5)', backgroundColor:'white'}}
            onError={(e) => { e.target.onerror = null; alert('이미지를 불러올 수 없습니다. 권한 문제이거나 이미지 형식이 아닐 수 있습니다.'); setSelectedProof(null); }}
          />
        </div>
      )}
    </div>
  );
}
