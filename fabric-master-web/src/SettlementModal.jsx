import React, { useState, useMemo } from 'react';

export default function SettlementModal({ items, onClose }) {
  // 기본 월 설정 (현재 월)
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedFactory, setSelectedFactory] = useState('전체');
  const [isExporting, setIsExporting] = useState(false);

  // 정산 데이터 집계 로직
  const settlementData = useMemo(() => {
    // 1. 해당 월에 속하는 주문 필터링 (출고일 기준, 없으면 사용예정일, 없으면 등록일)
    const filteredItems = items.filter(item => {
      const dateString = item.factoryShipDate || item.targetDate || item.date || '';
      return dateString.startsWith(selectedMonth);
    });

    // 2. 공장별로 그룹화 및 유효한 데이터만 추출
    const grouped = {};
    filteredItems.forEach(item => {
      const factory = item.factory || '미정';
      // 공장이 '미정'이거나, 상태가 '취소'인 항목은 제외
      if (item.status === '취소' || factory === '미정') return;
      
      // 세금계산서(tax1)가 발행되지 않은 건은 정산 리스트에서 제외
      if (!item.tax1) return;
      
      if (!grouped[factory]) {
        grouped[factory] = [];
      }
      
      const qty = parseInt(item.qty) || 0;
      const laborUnit = parseFloat(item.laborUnit) || 0;
      const totalCost = qty * laborUnit;

      grouped[factory].push({
        id: item.id,
        company: item.company || '미상',
        qty: qty,
        laborUnit: laborUnit,
        shipDate: item.factoryShipDate || item.targetDate || item.date || '',
        totalCost: totalCost,
        productType: item.productType || '에코백',
        status: item.status,
        taxDate: item.tax1 || ''
      });
    });

    return grouped;
  }, [items, selectedMonth]);

  // 선택된 공장 목록 추출
  const factoryList = ['전체', ...Object.keys(settlementData).sort()];

  // 화면에 표시할 데이터 필터링
  const displayData = useMemo(() => {
    if (selectedFactory === '전체') {
      return settlementData;
    }
    return { [selectedFactory]: settlementData[selectedFactory] || [] };
  }, [settlementData, selectedFactory]);

  // 구글 시트로 내보내기 함수
  const handleExport = async () => {
    if (Object.keys(settlementData).length === 0) {
      alert('내보낼 정산 데이터가 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      const apiBase = `http://${window.location.hostname}:3001`;
      
      // 내보낼 데이터 가공 (평탄화)
      const exportRows = [];
      Object.entries(settlementData).forEach(([factory, orders]) => {
        orders.forEach(order => {
          exportRows.push({
            생산공장: factory,
            고유번호: order.id,
            업체명: order.company,
            수량: order.qty,
            공임단가: order.laborUnit,
            출고일: order.shipDate,
            합산금액: order.totalCost,
            세금계산서: order.taxDate
          });
        });
      });

      const response = await fetch(`${apiBase}/api/reports/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          data: exportRows
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`구글 시트(정산_${selectedMonth.replace('-', '_')}) 탭으로 내보내기가 완료되었습니다!`);
      } else {
        alert(`내보내기 실패: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
      <div className="modal-content" style={{width: '1000px', maxWidth: '95vw', height: '80vh', display:'flex', flexDirection:'column'}}>
        {/* Header */}
        <div className="modal-header" style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin:0, fontSize:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
            <span>💰</span> 봉재공장 월별 정산 현황
          </h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Filters & Actions */}
        <div style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <div className="form-group" style={{margin: 0}}>
              <label style={{fontSize: '12px', color: '#64748b', marginRight: '8px'}}>정산 월</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-control"
                style={{width: 'auto', display: 'inline-block'}}
              />
            </div>
            <div className="form-group" style={{margin: 0}}>
              <label style={{fontSize: '12px', color: '#64748b', marginRight: '8px'}}>공장 선택</label>
              <select 
                value={selectedFactory} 
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="form-control"
                style={{width: 'auto', display: 'inline-block'}}
              >
                {factoryList.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting || Object.keys(settlementData).length === 0}
            style={{
              padding: '10px 20px', 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 700, 
              cursor: (isExporting || Object.keys(settlementData).length === 0) ? 'not-allowed' : 'pointer',
              opacity: (isExporting || Object.keys(settlementData).length === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isExporting ? '🔄 내보내는 중...' : '📊 구글 시트로 내보내기'}
          </button>
        </div>

        {/* List Body */}
        <div className="modal-body" style={{flex: 1, padding: '24px', overflowY: 'auto', background: '#f1f5f9'}}>
          {Object.keys(displayData).length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
              해당 월에 완료되거나 출고 예정인 공장 발주 내역이 없습니다.
            </div>
          ) : (
            Object.entries(displayData).map(([factory, orders]) => {
              const factoryTotalQty = orders.reduce((sum, order) => sum + order.qty, 0);
              const factoryTotalCost = orders.reduce((sum, order) => sum + order.totalCost, 0);

              return (
                <div key={factory} style={{background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px'}}>
                    <h3 style={{margin: 0, color: '#1e293b', fontSize: '18px'}}>🏭 {factory}</h3>
                    <div style={{textAlign: 'right'}}>
                      <span style={{fontSize: '13px', color: '#64748b', marginRight: '15px'}}>총 수량: {factoryTotalQty.toLocaleString()}개</span>
                      <span style={{fontSize: '16px', fontWeight: 800, color: '#f59e0b'}}>합계: ₩ {factoryTotalCost.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px'}}>
                    <thead>
                      <tr style={{background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #cbd5e1'}}>
                        <th style={{padding: '10px', textAlign: 'center'}}>고유번호</th>
                        <th style={{padding: '10px', textAlign: 'left'}}>업체명 (품목)</th>
                        <th style={{padding: '10px', textAlign: 'center'}}>출고일</th>
                        <th style={{padding: '10px', textAlign: 'center'}}>세금계산서</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>수량</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>공임단가</th>
                        <th style={{padding: '10px', textAlign: 'right'}}>합산금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                          <td style={{padding: '10px', textAlign: 'center', color: '#3b82f6', fontWeight: 600}}>{order.id}</td>
                          <td style={{padding: '10px'}}>{order.company} <span style={{fontSize: '11px', color: '#94a3b8'}}>({order.productType})</span></td>
                          <td style={{padding: '10px', textAlign: 'center'}}>{order.shipDate || '-'}</td>
                          <td style={{padding: '10px', textAlign: 'center', color: order.taxDate ? '#10b981' : '#94a3b8'}}>{order.taxDate || '미발행'}</td>
                          <td style={{padding: '10px', textAlign: 'right'}}>{order.qty.toLocaleString()}</td>
                          <td style={{padding: '10px', textAlign: 'right'}}>₩ {order.laborUnit.toLocaleString()}</td>
                          <td style={{padding: '10px', textAlign: 'right', fontWeight: 700, color: '#1e293b'}}>₩ {order.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
