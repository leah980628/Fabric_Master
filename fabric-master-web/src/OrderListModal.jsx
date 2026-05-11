import React, { useState, useMemo } from 'react';

export default function OrderListModal({ items, onClose }) {
  // 기본 월 설정 (현재 월)
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [activeTab, setActiveTab] = useState('계산서발행'); // '계산서발행', '오더확정'
  const [isExporting, setIsExporting] = useState(false);

  // 월별 데이터 필터링
  const filteredData = useMemo(() => {
    const baseData = items.filter(item => {
      const dateString = item.date || item._registeredDate || '';
      return dateString.startsWith(selectedMonth);
    });

    if (activeTab === '계산서발행') {
      // 세금계산서 일자가 있는 데이터만
      return baseData.filter(item => item.tax1 || item.tax2).sort((a, b) => b.id - a.id);
    } else {
      // 오더확정 체크된 데이터만
      return baseData.filter(item => item.orderConfirmed).sort((a, b) => b.id - a.id);
    }
  }, [items, selectedMonth, activeTab]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalQty = filteredData.reduce((sum, item) => sum + (item.qty || 0), 0);
    const totalSales = filteredData.reduce((sum, item) => {
      const sales = item.finalDeliveryAll || item.legacyResult?.finalDeliveryAll || 0;
      return sum + sales;
    }, 0);
    
    const totalVat = filteredData.reduce((sum, item) => {
      const sales = item.finalDeliveryAll || item.legacyResult?.finalDeliveryAll || 0;
      const salesVAT = item.finalDeliveryAllVAT || item.legacyResult?.finalDeliveryAllVAT || (sales * 1.1);
      return sum + (salesVAT - sales);
    }, 0);

    const totalCost = filteredData.reduce((sum, item) => {
      const costUnit = item.totalCostUnit || item.legacyResult?.totalCostUnit || 0;
      return sum + (costUnit * (item.qty || 0));
    }, 0);

    const totalMargin = totalSales - totalCost;
    const avgMarginRate = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;
    
    const avgSalesUnit = filteredData.length > 0 ? totalSales / totalQty : 0;
    const avgCostUnit = filteredData.length > 0 ? totalCost / totalQty : 0;

    return { totalQty, totalSales, totalVat, totalCost, totalMargin, avgMarginRate, avgSalesUnit, avgCostUnit };
  }, [filteredData]);

  // 구글 시트로 내보내기
  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert(`${activeTab === '계산서발행' ? '세금계산서 발행' : '오더 확정'} 내역이 없습니다.`);
      return;
    }

    try {
      setIsExporting(true);
      const apiBase = `http://${window.location.hostname}:3001`;
      
      const exportData = filteredData.map((item, index) => {
        const sales = item.finalDeliveryAll || item.legacyResult?.finalDeliveryAll || 0;
        const salesVAT = item.finalDeliveryAllVAT || item.legacyResult?.finalDeliveryAllVAT || (sales * 1.1);
        const costUnit = item.totalCostUnit || item.legacyResult?.totalCostUnit || 0;
        const costTotal = costUnit * (item.qty || 0);
        const margin = sales - costTotal;
        const salesUnit = item.finalDeliveryUnit || item.legacyResult?.finalDeliveryUnit || 0;

        return {
          번호: index + 1,
          등록일: item.date || item._registeredDate || '',
          거래처: item.company || '',
          구분: item.consultType || '신규',
          사이즈: `${item.w || 0}*${item.h || 0}*${item.d || 0}`,
          수량: item.qty || 0,
          장당판매가: salesUnit,
          판매합계: sales,
          부가세: salesVAT - sales,
          합계금액: salesVAT,
          장당원가: costUnit,
          원가합계: costTotal,
          마진금액: margin,
          마진율: sales > 0 ? (margin / sales * 100).toFixed(1) + '%' : '0%',
          결제상태: item.status || '',
          담당자: item.pic || '',
          연락처: item.contact || '',
          계산서일자: item.tax1 || item.tax2 || '',
          비고: item.consultMemo || '',
          공장: item.factory || '',
          드라이브: item.driveLink || ''
        };
      });

      const response = await fetch(`${apiBase}/api/reports/order-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          data: exportData,
          type: activeTab // 계산서발행 or 오더확정
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`구글 시트 내보내기가 완료되었습니다!`);
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
      <div className="modal-content" style={{width: '1200px', maxWidth: '98vw', height: '90vh', display:'flex', flexDirection:'column'}}>
        {/* Header */}
        <div className="modal-header" style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin:0, fontSize:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
            <span>📅</span> 통합 오더리스트 대시보드
          </h2>
          <button className="close-btn" onClick={onClose} style={{fontSize:'28px'}}>&times;</button>
        </div>

        {/* Stats & Tabs Container */}
        <div style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'}}>
          {/* 상단 통계 카드 */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px'}}>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>총 {activeTab === '계산서발행' ? '발행' : '확정'} 수량</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#1e293b'}}>{stats.totalQty.toLocaleString()} 개</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#3b82f6', marginBottom: '5px'}}>총 매출액</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#2563eb'}}>₩ {stats.totalSales.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#ea580c', marginBottom: '5px'}}>생산 원가</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#c2410c'}}>₩ {stats.totalCost.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#059669', marginBottom: '5px'}}>예상 마진</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#047857'}}>₩ {stats.totalMargin.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#7c3aed', marginBottom: '5px'}}>평균 마진율</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#6d28d9'}}>{stats.avgMarginRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button 
              onClick={() => setActiveTab('계산서발행')}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: activeTab === '계산서발행' ? '#4f46e5' : 'white',
                color: activeTab === '계산서발행' ? 'white' : '#64748b',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontWeight: 700, cursor: 'pointer', transition: '0.2s'
              }}>
              📑 계산서 발행기준
            </button>
            <button 
              onClick={() => setActiveTab('오더확정')}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: activeTab === '오더확정' ? '#f43f5e' : 'white',
                color: activeTab === '오더확정' ? 'white' : '#64748b',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontWeight: 700, cursor: 'pointer', transition: '0.2s'
              }}>
              🚩 오더 확정기준
            </button>

            <div style={{marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center'}}>
              <span style={{fontSize: '14px', color: '#64748b'}}>조회 월:</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px'}}
              />
              <button 
                onClick={handleExport}
                disabled={isExporting || filteredData.length === 0}
                style={{
                  padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', 
                  fontWeight: 800, cursor: 'pointer', opacity: (isExporting || filteredData.length === 0) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                {isExporting ? '🔄 생성 중' : `📊 ${activeTab === '계산서발행' ? '계산서' : '오더확정'} 시트 내보내기`}
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="modal-body" style={{flex: 1, padding: '0', overflowX: 'auto', overflowY: 'auto', background: 'white'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1400px'}}>
            <thead style={{position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
              <tr>
                <th style={{padding: '12px 10px', textAlign: 'center', width: '120px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>ID</th>
                <th style={{padding: '12px 10px', textAlign: 'left', width: '180px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>거래처</th>
                <th style={{padding: '12px 10px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>구분</th>
                <th style={{padding: '12px 10px', textAlign: 'center', width: '70px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>수량</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>장당판매가</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '110px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>판매합계</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>부가세</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '110px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>합계금액</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>장당원가</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '110px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>원가합계</th>
                <th style={{padding: '12px 10px', textAlign: 'right', width: '110px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>마진액</th>
                <th style={{padding: '12px 10px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>마진율</th>
                <th style={{padding: '12px 10px', textAlign: 'center', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>계산서일자</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{padding: '100px', textAlign: 'center', color: '#94a3b8', fontSize: '15px'}}>
                    해당 조건에 맞는 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const sales = item.finalDeliveryAll || item.legacyResult?.finalDeliveryAll || 0;
                  const salesVAT = item.finalDeliveryAllVAT || item.legacyResult?.finalDeliveryAllVAT || (sales * 1.1);
                  const costUnit = item.totalCostUnit || item.legacyResult?.totalCostUnit || 0;
                  const costTotal = costUnit * (item.qty || 0);
                  const margin = sales - costTotal;
                  const salesUnit = item.finalDeliveryUnit || item.legacyResult?.finalDeliveryUnit || 0;

                  return (
                    <tr key={item.id} style={{borderBottom: '1px solid #f1f5f9', hover: {background: '#f8fafc'}}}>
                      <td style={{padding: '12px 10px', textAlign: 'center', color: '#64748b', fontWeight: 600}}>{item.id}</td>
                      <td style={{padding: '12px 10px', fontWeight: 700, color: '#1e293b'}}>{item.company}</td>
                      <td style={{padding: '12px 10px', textAlign: 'center'}}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          background: item.consultType === '신규' ? '#ecfdf5' : '#eff6ff',
                          color: item.consultType === '신규' ? '#10b981' : '#3b82f6'
                        }}>{item.consultType || '신규'}</span>
                      </td>
                      <td style={{padding: '12px 10px', textAlign: 'center', fontWeight: 700}}>{(item.qty || 0).toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right'}}>₩ {salesUnit.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: 700}}>₩ {sales.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right', color: '#64748b'}}>₩ {(salesVAT - sales).toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#4f46e5'}}>₩ {salesVAT.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right'}}>₩ {costUnit.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right', color: '#ef4444'}}>₩ {costTotal.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#10b981'}}>₩ {margin.toLocaleString()}</td>
                      <td style={{padding: '12px 10px', textAlign: 'center'}}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#16a34a', fontWeight: 700
                        }}>{sales > 0 ? (margin / sales * 100).toFixed(1) + '%' : '0%'}</span>
                      </td>
                      <td style={{padding: '12px 10px', textAlign: 'center', color: '#64748b'}}>{item.tax1 || item.tax2 || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot style={{position: 'sticky', bottom: 0, background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #e2e8f0', zIndex: 5}}>
                <tr>
                  <td colSpan="3" style={{padding: '15px', textAlign: 'right', fontSize: '14px'}}>합계</td>
                  <td style={{padding: '15px', textAlign: 'center', fontSize: '14px'}}>{stats.totalQty.toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px'}}>평균 ₩ {Math.round(stats.avgSalesUnit).toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px'}}>₩ {stats.totalSales.toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px'}}>₩ {stats.totalVat.toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px', color: '#4f46e5'}}>₩ {(stats.totalSales + stats.totalVat).toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px'}}>평균 ₩ {Math.round(stats.avgCostUnit).toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px', color: '#ef4444'}}>₩ {stats.totalCost.toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'right', fontSize: '14px', color: '#10b981'}}>₩ {stats.totalMargin.toLocaleString()}</td>
                  <td style={{padding: '15px', textAlign: 'center', fontSize: '14px', color: '#f59e0b'}}>{stats.avgMarginRate.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
