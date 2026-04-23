import React, { useState, useEffect } from 'react';

const BAG_TYPES = [
  "1번 기본형(가로*세로)", 
  "1-1번 분리형(가로*세로)", 
  "2번 기본형(가로*세로*밑면)", 
  "3번 옆면형(가로*세로*밑면*옆면)", 
  "3-1번 U자형(앞뒤분리)"
];

const FACTORY_LIST = [
  "미정", "승화파트너스", "느티나무사랑", "에코씨엔티", "가나", "모카", "에코컴퍼니", "흥진상사"
];

export default function CalculatorModal({ item, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('가방사양');

  // 1. 기본 사양
  const [specs, setSpecs] = useState({
    type: "1번 기본형(가로*세로)",
    w: 36, h: 36, d: 10, sideD: 10,
    qty: item?.qty || 100, fabricWidth: 63, fabricPrice: 5000,
    topSeam: 6, bottomSeam: 1.5, sideSeam: 1.5, loss: 3
  });

  // 1-1. 부가 원단 부속 (재끈, 안주머니, 기타)
  const [extras, setExtras] = useState({
    hasStrap: false, strapW: 5, strapL: 60, strapQty: 2,
    hasPocket: false, pocketW: 20, pocketH: 15, pocketQty: 1,
    hasFrontPocket: false, frontPocketW: 25, frontPocketH: 20, frontPocketQty: 1,
    hasSidePocket: false, sidePocketW: 15, sidePocketH: 18, sidePocketQty: 2,
    hasTumblerPocket: false, tumblerPocketW: 12, tumblerPocketH: 20, tumblerPocketQty: 1,
    hasOther: false, otherW: 10, otherH: 10, otherQty: 1
  });

  const handleExtrasChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExtras(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (parseFloat(value) || 0) }));
  };

  // 2. 부자재, 인쇄 및 공임
  const [costs, setCosts] = useState({
    factory: "미정",
    laborUnit: 0, laborContent: "",
    webbingUnit: 0, webbingContent: "",
    webbingFinishLen: 60, webbingSeam: 6, webbingPrice: 25000,
    webbingRollLen: 100, webbingLoss: 3, webbingQtyPerBag: 2,
    hasOuterBias: false, outerBiasUnit: 0, outerBiasContent: "",
    outerBiasFinishLen: 80, outerBiasSeam: 3, outerBiasPrice: 15000,
    outerBiasRollLen: 100, outerBiasLoss: 3, outerBiasQtyPerBag: 1,
    hasInnerBias: false, innerBiasUnit: 0, innerBiasContent: "",
    innerBiasFinishLen: 80, innerBiasSeam: 3, innerBiasPrice: 12000,
    innerBiasRollLen: 100, innerBiasLoss: 3, innerBiasQtyPerBag: 1,
    metalUnit: 0, metalContent: "", hasMetal: false,
    metalUnit2: 0, metalContent2: "", hasMetal2: false,
    printUnit: 0, printContent: "",
    printUnit2: 0, printContent2: "",
    freightTotal: 0, freightContent: "",
  });

  // 3. 결제 및 추가 정보 (새로 추가된 필드들)
  const [extraInfo, setExtraInfo] = useState({
    paymentMethod: '', tax1: '', tax2: '', paymentContent: '',
    deposit: 0, balance: 0,
    driveLink: '', proofImage: '',
    deliveryAddress: '', workOrderDate: '', prodCheck: '',
    factoryShipDate: '', trackingNum: ''
  });

  const [bagSpecs, setBagSpecs] = useState({
    fabric: '', webbing: '', printing: '', options: '',
    targetDate: '', consultMemo: ''
  });

  const handleBagSpecsChange = (e) => {
    const { name, value } = e.target;
    setBagSpecs(prev => ({ ...prev, [name]: value }));
  };

  // 4. 마진뷰
  const [margin, setMargin] = useState({ percent: 30, customDeliveryUnit: 0 });

  const [result, setResult] = useState({
    netYard: 0, grossYard: 0, fabricTotalCost: 0, fabricUnitCost: 0, 
    totalCostUnit: 0, totalCostAll: 0, marginAmountUnit: 0, 
    finalDeliveryUnit: 0, finalDeliveryAll: 0, finalDeliveryAllVAT: 0
  });

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    const numVal = parseFloat(value) || 0;
    
    setSpecs(prev => {
      let newType = prev.type;
      
      // 사이즈 입력에 따른 가방 형태 자동 추천 연결 로직
      if (name === 'd' && numVal > 0 && prev.type === "1번 기본형(가로*세로)") {
        newType = "2번 기본형(가로*세로*밑면)";
      } else if (name === 'sideD' && numVal > 0 && (prev.type === "1번 기본형(가로*세로)" || prev.type === "2번 기본형(가로*세로*밑면)")) {
        newType = "3번 옆면형(가로*세로*밑면*옆면)";
      } else if (name === 'type') {
        newType = value;
      }

      return { ...prev, [name]: name === 'type' ? value : numVal, type: newType };
    });
  };

  const handleCostChange = (e) => {
    const { name, value } = e.target;
    setCosts(prev => ({ 
      ...prev, 
      [name]: (name === 'factory' || name.endsWith('Content')) ? value : parseFloat(value) || 0 
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
    setExtraInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleMarginPercentChange = (e) => {
    setMargin({ percent: parseFloat(e.target.value) || 0, customDeliveryUnit: 0 });
  };
  const handleDeliveryPriceChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    let newPercent = margin.percent;
    if (val > 0 && result.totalCostUnit > 0) {
      // (납품가 - 원가) / 원가 * 100
      newPercent = Math.round(((val - result.totalCostUnit) / result.totalCostUnit) * 1000) / 10;
    }
    setMargin({ percent: newPercent, customDeliveryUnit: val });
  };

  useEffect(() => {
    const s = specs;
    const fw = (s.fabricWidth * 2.54) - 3;
    let net = 0;

    try {
      if (s.type === "1번 기본형(가로*세로)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = (s.h * 2) + s.topSeam + s.bottomSeam;
          const count = Math.floor(fw / pw);
          if (count > 0) net = (ph / count) / 91.44;
      } else if (s.type === "1-1번 분리형(가로*세로)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = s.h + s.topSeam + s.bottomSeam;
          const count = Math.floor(fw / pw);
          if (count > 0) net = ((ph / count) / 91.44) * 2;
      } else if (s.type === "2번 기본형(가로*세로*밑면)") {
          const pw = s.w + (s.sideSeam * 2);
          const ph = (s.h * 2) + s.d + s.topSeam + s.bottomSeam;
          const count = Math.floor(fw / pw);
          if (count > 0) net = (ph / count) / 91.44;
      } else if (s.type === "3번 옆면형(가로*세로*밑면*옆면)") {
          const count1 = Math.floor(fw / (s.w + (s.sideSeam * 2)));
          const count2 = Math.floor(fw / (s.sideD + (s.sideSeam * 2)));
          if (count1 > 0 && count2 > 0) {
            net = ((((s.h * 2) + s.d + s.topSeam + s.bottomSeam) / count1) / 91.44) + 
                  (((s.h + s.topSeam + s.bottomSeam) / count2) / 91.44);
          }
      } else if (s.type === "3-1번 U자형(앞뒤분리)") {
          const count1 = Math.floor(fw / (s.w + (s.sideSeam * 2)));
          const count2 = Math.floor(fw / (s.sideD + (s.sideSeam * 2)));
          if (count1 > 0 && count2 > 0) {
            net = (((s.h + s.topSeam + s.bottomSeam) / count1) / 91.44 * 2) + 
                  ((((s.h * 2) + s.w + s.topSeam + s.bottomSeam) / count2) / 91.44);
          }
      }

      // 부가 원단 부속 요척 추가 (시접 미포함, 순수 사이즈 기준)
      let strapYard = 0, pocketYard = 0, frontPocketYard = 0, sidePocketYard = 0, tumblerPocketYard = 0, otherYard = 0;
      if (extras.hasStrap && extras.strapW > 0 && extras.strapL > 0) {
        const strapCount = Math.floor(fw / extras.strapW);
        if (strapCount > 0) strapYard = (extras.strapL / strapCount) / 91.44 * extras.strapQty;
      }
      if (extras.hasPocket && extras.pocketW > 0 && extras.pocketH > 0) {
        const pocketCount = Math.floor(fw / extras.pocketW);
        if (pocketCount > 0) pocketYard = (extras.pocketH / pocketCount) / 91.44 * extras.pocketQty;
      }
      if (extras.hasFrontPocket && extras.frontPocketW > 0 && extras.frontPocketH > 0) {
        const c = Math.floor(fw / extras.frontPocketW);
        if (c > 0) frontPocketYard = (extras.frontPocketH / c) / 91.44 * extras.frontPocketQty;
      }
      if (extras.hasSidePocket && extras.sidePocketW > 0 && extras.sidePocketH > 0) {
        const c = Math.floor(fw / extras.sidePocketW);
        if (c > 0) sidePocketYard = (extras.sidePocketH / c) / 91.44 * extras.sidePocketQty;
      }
      if (extras.hasTumblerPocket && extras.tumblerPocketW > 0 && extras.tumblerPocketH > 0) {
        const c = Math.floor(fw / extras.tumblerPocketW);
        if (c > 0) tumblerPocketYard = (extras.tumblerPocketH / c) / 91.44 * extras.tumblerPocketQty;
      }
      if (extras.hasOther && extras.otherW > 0 && extras.otherH > 0) {
        const otherCount = Math.floor(fw / extras.otherW);
        if (otherCount > 0) otherYard = (extras.otherH / otherCount) / 91.44 * extras.otherQty;
      }
      net += strapYard + pocketYard + frontPocketYard + sidePocketYard + tumblerPocketYard + otherYard;

      const netYard = Math.max(0, Math.round(net * 100) / 100);
      const grossYard = Math.max(0, Math.ceil((netYard * s.qty) * (1 + (s.loss / 100))));
      const fabricTotalCost = grossYard * s.fabricPrice;
      const fabricUnitCost = s.qty > 0 ? (fabricTotalCost / s.qty) : 0;

      const allocatedFreight = s.qty > 0 ? (costs.freightTotal / s.qty) : 0;
      
      const totalCostUnit = fabricUnitCost + costs.webbingUnit + costs.outerBiasUnit + costs.innerBiasUnit + costs.metalUnit + costs.metalUnit2 + costs.laborUnit + costs.printUnit + costs.printUnit2 + allocatedFreight;
      
      let marginAmountUnit = 0;
      let finalDeliveryUnit = 0;
      if (margin.customDeliveryUnit > 0) {
        finalDeliveryUnit = margin.customDeliveryUnit;
        marginAmountUnit = finalDeliveryUnit - totalCostUnit;
      } else {
        marginAmountUnit = totalCostUnit * (margin.percent / 100);
        finalDeliveryUnit = totalCostUnit + marginAmountUnit;
      }

      setResult({
        netYard, grossYard, fabricTotalCost, fabricUnitCost,
        strapYard: Math.round(strapYard * 100) / 100,
        pocketYard: Math.round(pocketYard * 100) / 100,
        frontPocketYard: Math.round(frontPocketYard * 100) / 100,
        sidePocketYard: Math.round(sidePocketYard * 100) / 100,
        tumblerPocketYard: Math.round(tumblerPocketYard * 100) / 100,
        otherYard: Math.round(otherYard * 100) / 100,
        totalCostUnit, totalCostAll: totalCostUnit * s.qty,
        marginAmountUnit, finalDeliveryUnit, 
        finalDeliveryAll: finalDeliveryUnit * s.qty,
        finalDeliveryAllVAT: (finalDeliveryUnit * s.qty) * 1.1
      });

    } catch(err) {
      console.log(err);
    }
  }, [specs, costs, margin, extras]);

  const handleFinalSave = async () => {
    const data = {
      ...specs, ...costs, ...extraInfo, ...bagSpecs,
      factory: costs.factory,
      marginInfo: result
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

  const showD = ["2번 기본형(가로*세로*밑면)", "3번 옆면형(가로*세로*밑면*옆면)"].includes(specs.type);
  const showSideD = ["3번 옆면형(가로*세로*밑면*옆면)", "3-1번 U자형(앞뒤분리)"].includes(specs.type);

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
      <div className="modal-content" style={{maxWidth: '1300px', width: '98vw', height: '92vh'}}>
        <div className="modal-header">
          <div>
            <div style={{fontSize:'12px', color:'#64748b', marginBottom:'2px'}}>주문 고유번호: {item?.id}</div>
            <h2 style={{margin:0}}>{item?.company} - {item?.item}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="tab-button-group" style={{display: 'flex', background: '#f8fafc', padding: '0 24px', borderBottom: '1px solid #e2e8f0'}}>
          {['가방사양', '사양계산', '결제정보', '생산 및 납품'].map(tab => (
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
          
          {/* TAB 0: 가방사양 */}
          {activeTab === '가방사양' && (
            <div style={{flex: 1, padding: '32px', overflowY: 'auto'}}>
              <h3 className="section-title">가방 제작 사양 (상담 기록)</h3>
              <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'900px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
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
                  <div className="form-group">
                    <label>사용(납품) 예정일</label>
                    <input type="date" name="targetDate" value={bagSpecs.targetDate} onChange={handleBagSpecsChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <label>상담 코멘트 (특이사항)</label>
                    <textarea name="consultMemo" value={bagSpecs.consultMemo} onChange={handleBagSpecsChange} className="form-control" style={{flex: 1, minHeight: '150px'}} placeholder="고객 요청사항 및 특이사항 메모"></textarea>
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
                  <label>가방 형태</label>
                  <select name="type" value={specs.type} onChange={handleSpecChange} className="form-control">
                    {BAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', background:'white', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px'}}>
                  <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="w" value={specs.w} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="h" value={specs.h} onChange={handleSpecChange} className="form-control"/></div>
                  {showD && <div className="form-group" style={{margin:0}}><label>밑면(cm)</label><input type="number" name="d" value={specs.d} onChange={handleSpecChange} className="form-control"/></div>}
                  {showSideD && <div className="form-group" style={{margin:0}}><label>옆면(cm)</label><input type="number" name="sideD" value={specs.sideD} onChange={handleSpecChange} className="form-control"/></div>}
                </div>

                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>시접 및 원단 단가</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', background:'white', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                  <div className="form-group" style={{margin:0}}><label>원단폭(inch)</label><input type="number" name="fabricWidth" value={specs.fabricWidth} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>야드단가(원)</label><input type="number" name="fabricPrice" value={specs.fabricPrice} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>시접 상단(cm)</label><input type="number" name="topSeam" value={specs.topSeam} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>시접 하단(cm)</label><input type="number" name="bottomSeam" value={specs.bottomSeam} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>시접 좌우(cm)</label><input type="number" name="sideSeam" value={specs.sideSeam} onChange={handleSpecChange} className="form-control"/></div>
                  <div className="form-group" style={{margin:0}}><label>로스율(%)</label><input type="number" name="loss" value={specs.loss} onChange={handleSpecChange} className="form-control"/></div>
                </div>

                {/* 부가 원단 부속 토글 */}
                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px', marginTop:'16px'}}>부가 원단 부속 (선택)</h4>
                <div style={{background:'white', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px'}}>
                  {/* 재끈 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasStrap" checked={extras.hasStrap} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 재끈 (원단끈)
                  </label>
                  {extras.hasStrap && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="strapW" value={extras.strapW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>길이(cm)</label><input type="number" name="strapL" value={extras.strapL} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="strapQty" value={extras.strapQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasStrap && (
                    <div style={{paddingLeft:'26px', marginBottom:'12px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 재끈 소요: {result.strapYard} yard/개
                    </div>
                  )}
                  {/* 안주머니 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasPocket" checked={extras.hasPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 안주머니
                  </label>
                  {extras.hasPocket && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="pocketW" value={extras.pocketW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="pocketH" value={extras.pocketH} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="pocketQty" value={extras.pocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasPocket && (
                    <div style={{paddingLeft:'26px', marginBottom:'12px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 안주머니 소요: {result.pocketYard} yard/개
                    </div>
                  )}
                  {/* 앞주머니 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasFrontPocket" checked={extras.hasFrontPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 앞주머니
                  </label>
                  {extras.hasFrontPocket && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="frontPocketW" value={extras.frontPocketW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="frontPocketH" value={extras.frontPocketH} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="frontPocketQty" value={extras.frontPocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasFrontPocket && (
                    <div style={{paddingLeft:'26px', marginBottom:'12px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 앞주머니 소요: {result.frontPocketYard} yard/개
                    </div>
                  )}
                  {/* 옆주머니 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasSidePocket" checked={extras.hasSidePocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 옆주머니
                  </label>
                  {extras.hasSidePocket && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="sidePocketW" value={extras.sidePocketW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="sidePocketH" value={extras.sidePocketH} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="sidePocketQty" value={extras.sidePocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasSidePocket && (
                    <div style={{paddingLeft:'26px', marginBottom:'12px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 옆주머니 소요: {result.sidePocketYard} yard/개
                    </div>
                  )}
                  {/* 텀블러주머니 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasTumblerPocket" checked={extras.hasTumblerPocket} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 텀블러주머니
                  </label>
                  {extras.hasTumblerPocket && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="tumblerPocketW" value={extras.tumblerPocketW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="tumblerPocketH" value={extras.tumblerPocketH} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="tumblerPocketQty" value={extras.tumblerPocketQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasTumblerPocket && (
                    <div style={{paddingLeft:'26px', marginBottom:'12px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 텀블러주머니 소요: {result.tumblerPocketYard} yard/개
                    </div>
                  )}
                  {/* 기타 원단 */}
                  <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'8px', fontSize:'14px', fontWeight:'600', color:'#334155'}}>
                    <input type="checkbox" name="hasOther" checked={extras.hasOther} onChange={handleExtrasChange} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                    + 기타 원단 부속
                  </label>
                  {extras.hasOther && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'4px', paddingLeft:'26px'}}>
                      <div className="form-group" style={{margin:0}}><label>가로(cm)</label><input type="number" name="otherW" value={extras.otherW} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>세로(cm)</label><input type="number" name="otherH" value={extras.otherH} onChange={handleExtrasChange} className="form-control"/></div>
                      <div className="form-group" style={{margin:0}}><label>수량(개)</label><input type="number" name="otherQty" value={extras.otherQty} onChange={handleExtrasChange} className="form-control"/></div>
                    </div>
                  )}
                  {extras.hasOther && (
                    <div style={{paddingLeft:'26px', marginBottom:'4px', fontSize:'12px', color:'#10b981', fontWeight:'600'}}>
                      → 기타 원단 소요: {result.otherYard} yard/개
                    </div>
                  )}
                </div>

                <div style={{marginTop:'16px', background:'#1e293b', color:'white', padding:'16px', borderRadius:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{fontSize:'13px', color:'#94a3b8'}}>필요 발주 요척 (Gross)</span><span style={{fontWeight:'700'}}>{result.grossYard} Yard</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #334155', paddingTop:'8px', marginTop:'4px'}}>
                    <span style={{fontSize:'13px'}}>원단 구매 예상총액</span><span style={{fontWeight:'700', color:'#34d399'}}>₩ {result.fabricTotalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE: 부자재 */}
              <div className="spec-calc-col" style={{flex: '1', padding: '24px', overflowY: 'auto'}}>
                <h3 className="section-title">2. 부자재 & 가공비(공임) 입력</h3>
                <div style={{background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                  <div className="form-group"><label>생산 공장 선택</label>
                    <select name="factory" value={costs.factory} onChange={handleCostChange} className="form-control">
                      {FACTORY_LIST.map(f => <option key={f} value={f}>{f}</option>)}
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
                  <div className="form-group" style={{margin:0}}>
                    <label style={{fontWeight:'700', color:'#1e293b', fontSize:'14px'}}>🧵 웨빙 자동 계산</label>
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

                  {/* 겉헤리(바이어스) 토글 */}
                  <div className="form-group" style={{margin:0, marginTop:'12px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'700', color:'#1e293b', fontSize:'14px'}}>
                      <input type="checkbox" name="hasOuterBias" checked={costs.hasOuterBias} onChange={(e) => setCosts(prev => ({...prev, hasOuterBias: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'#f59e0b'}} />
                      🎨 겉헤리(바이어스) 자동계산
                    </label>
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
                      🪡 속헤리(바이어스) 자동계산
                    </label>
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
                  <div className="form-group" style={{margin:0}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                      <input type="checkbox" checked={costs.hasMetal} onChange={(e) => setCosts(prev => ({...prev, hasMetal: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      금속/기타 부속
                    </label>
                    {costs.hasMetal && (<>
                      <input type="number" name="metalUnit" value={costs.metalUnit} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                      <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 내용</label>
                      <textarea name="metalContent" value={costs.metalContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                    </>)}
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontWeight:'600', color:'#1e293b'}}>
                      <input type="checkbox" checked={costs.hasMetal2} onChange={(e) => setCosts(prev => ({...prev, hasMetal2: e.target.checked}))} style={{width:'18px', height:'18px', accentColor:'var(--primary-color)'}} />
                      금속/기타 부속 2
                    </label>
                    {costs.hasMetal2 && (<>
                      <input type="number" name="metalUnit2" value={costs.metalUnit2} onChange={handleCostChange} className="form-control" placeholder="단가 (원)" style={{marginTop:'8px', marginBottom:'8px'}}/>
                      <label style={{fontSize:'11px', color:'#64748b'}}>금속기타 2 내용</label>
                      <textarea name="metalContent2" value={costs.metalContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="단추, 고리, 지퍼 등"></textarea>
                    </>)}
                  </div>
                </div>
                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>인쇄 (1개당 단가)</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom:'16px'}}>
                  <div className="form-group" style={{margin:0}}>
                    <label>인쇄 단가 (개당)</label>
                    <input type="number" name="printUnit" value={costs.printUnit} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}}/>
                    <div style={{fontSize:'12px', color:'#10b981', fontWeight:'600', marginBottom:'8px'}}>
                      → 인쇄 총비용: ₩ {(costs.printUnit * specs.qty).toLocaleString()} ({specs.qty}개)
                    </div>
                    <label style={{fontSize:'11px', color:'#64748b'}}>인쇄내용</label>
                    <textarea name="printContent" value={costs.printContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="인쇄 방식, 도수 등"></textarea>
                  </div>
                  <div className="form-group" style={{margin:0}}>
                    <label>인쇄 2 단가 (개당)</label>
                    <input type="number" name="printUnit2" value={costs.printUnit2} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}}/>
                    <div style={{fontSize:'12px', color:'#10b981', fontWeight:'600', marginBottom:'8px'}}>
                      → 인쇄 2 총비용: ₩ {(costs.printUnit2 * specs.qty).toLocaleString()} ({specs.qty}개)
                    </div>
                    <label style={{fontSize:'11px', color:'#64748b'}}>인쇄 2 내용</label>
                    <textarea name="printContent2" value={costs.printContent2} onChange={handleCostChange} className="form-control" rows="2" placeholder="인쇄 2 방식, 도수 등"></textarea>
                  </div>
                </div>
                <h4 style={{fontSize:'13px', color:'#475569', marginBottom:'8px'}}>운임/소모품 (총액 기준)</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px'}}>
                  <div className="form-group" style={{margin:0}}>
                    <label>운임/소모품 총비용</label>
                    <input type="number" name="freightTotal" value={costs.freightTotal} onChange={handleCostChange} className="form-control" style={{marginBottom:'8px'}}/>
                    <label style={{fontSize:'11px', color:'#64748b'}}>운임/소모품 내용</label>
                    <textarea name="freightContent" value={costs.freightContent} onChange={handleCostChange} className="form-control" rows="2" placeholder="택배비, 포장지 등"></textarea>
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
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>인쇄비 (1+2)</span> <span>₩ {(costs.printUnit + costs.printUnit2).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'4px'}}><span>물류/소모품 분배</span> <span>₩ {Math.round(costs.freightTotal / specs.qty || 0).toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', paddingBottom:'8px', borderBottom:'1px dashed #cbd5e1'}}><span>공장 공임</span> <span>₩ {costs.laborUnit.toLocaleString()}</span></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:'12px', alignItems:'center'}}><span style={{fontSize:'15px', fontWeight:'700', color:'#1e293b'}}>총 1개당 시원가</span> <span style={{fontSize:'22px', fontWeight:'800'}}>₩ {Math.round(result.totalCostUnit).toLocaleString()}</span></div>
                </div>

                <div style={{background:'#ffffff', padding:'20px', borderRadius:'12px', border:'2px solid #6366f1'}}>
                  <div style={{fontWeight:'700', color:'#4f46e5', marginBottom:'16px'}}>마진 세팅 (직접 제어)</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
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
              <div className="responsive-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'900px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  <div className="form-group">
                    <label>결제 수량 / 금액 안내내용</label>
                    <textarea name="paymentContent" value={extraInfo.paymentContent} onChange={handleExtraInfoChange} className="form-control" rows="4" placeholder="예: 무통장입금으로 50% 선금 결제 등"></textarea>
                  </div>
                  <div className="form-group">
                    <label>결제방법</label>
                    <input type="text" name="paymentMethod" value={extraInfo.paymentMethod} onChange={handleExtraInfoChange} className="form-control" placeholder="카드, 계좌이체 등"/>
                  </div>
                  <div className="form-group">
                    <label>결제 선금 (입금액)</label>
                    <input type="number" name="deposit" value={extraInfo.deposit} onChange={handleExtraInfoChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>결제 잔금 (미수금)</label>
                    <input type="number" name="balance" value={extraInfo.balance} onChange={handleExtraInfoChange} className="form-control" />
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  <div className="form-group">
                    <label>세금계산서 1 (발행상태/사업자번호)</label>
                    <input type="text" name="tax1" value={extraInfo.tax1} onChange={handleExtraInfoChange} className="form-control" placeholder="계산서 발행 완료 등"/>
                  </div>
                  <div className="form-group">
                    <label>세금계산서 2 (비고)</label>
                    <input type="text" name="tax2" value={extraInfo.tax2} onChange={handleExtraInfoChange} className="form-control" placeholder=""/>
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
                    <label>구글 드라이브 (작업지시서/도안 링크)</label>
                    <div style={{display:'flex', gap:'8px'}}>
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
                  <div className="form-group">
                    <label>시안 이미지 링크 (인쇄/로고)</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      <input type="url" name="proofImage" value={extraInfo.proofImage} onChange={handleExtraInfoChange} className="form-control" style={{flex:1}} placeholder="https://... 이미지 URL" />
                      {extraInfo.proofImage && (
                        <button 
                          onClick={() => window.open(extraInfo.proofImage, '_blank')}
                          style={{padding:'0 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'12px', whiteSpace:'nowrap'}}>
                          🖼️ 열기
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>작업지시서(작지) 확인 일자</label>
                    <input type="date" name="workOrderDate" value={extraInfo.workOrderDate} onChange={handleExtraInfoChange} className="form-control" />
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
                    <input type="date" name="factoryShipDate" value={extraInfo.factoryShipDate} onChange={handleExtraInfoChange} className="form-control" />
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
        <div className="modal-footer" style={{padding:'20px 24px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end'}}>
             <button 
              onClick={handleFinalSave}
              style={{padding:'14px 28px', background:'var(--primary-color)', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'15px', cursor:'pointer', boxShadow:'0 4px 6px rgba(16, 185, 129, 0.2)'}}>
              모든 사양 및 정보 저장하기 (상태 전환)
            </button>
        </div>
      </div>
    </div>
  );
}
