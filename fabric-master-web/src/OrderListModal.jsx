import React, { useState, useMemo } from 'react';

export default function OrderListModal({ items, onClose }) {
  // 기본 월 설정 (현재 월)
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [isExporting, setIsExporting] = useState(false);

  // 월별 데이터 필터링 (취소, 상담진행, 견적안내 제외)
  const filteredData = useMemo(() => {
    const excludedStatuses = ['취소', '상담진행', '견적안내'];
    return items.filter(item => {
      const dateString = item.date || item._registeredDate || '';
      const matchesMonth = dateString.startsWith(selectedMonth);
      const isNotExcluded = !excludedStatuses.includes(item.status);
      return matchesMonth && isNotExcluded;
    }).sort((a, b) => b.id - a.id);
  }, [items, selectedMonth]);

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
    
    // 평균 단가 계산 (가중 평균이 아닌 단순 합산은 의미가 없으므로 평균으로 표시)
    const avgSalesUnit = filteredData.length > 0 ? totalSales / totalQty : 0;
    const avgCostUnit = filteredData.length > 0 ? totalCost / totalQty : 0;

    return { totalQty, totalSales, totalVat, totalCost, totalMargin, avgMarginRate, avgSalesUnit, avgCostUnit };
  }, [filteredData]);

  // 구글 시트로 내보내기 (세금계산서 발행 기준)
  const handleExport = async () => {
    // 세금계산서(tax1)가 발행된 건만 추출
    const taxIssuedItems = filteredData.filter(item => item.tax1 || item.tax2);

    if (taxIssuedItems.length === 0) {
      alert('세금계산서가 발행된(일자가 입력된) 오더 내역이 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      const apiBase = `http://${window.location.hostname}:3001`;
      
      const exportData = taxIssuedItems.map((item, index) => {
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
          data: exportData
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`구글 시트(오더리스트_${selectedMonth.replace('-', '_')}) 탭으로 내보내기가 완료되었습니다!`);
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

        {/* Filters & Stats */}
        <div style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <div className="form-group" style={{margin: 0}}>
                <label style={{fontSize: '12px', color: '#64748b', marginRight: '8px'}}>조회 월</label>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-control"
                  style={{width: 'auto', display: 'inline-block'}}
                />
              </div>
              <span style={{fontSize: '14px', color: '#64748b'}}>총 {filteredData.length}건의 오더</span>
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting || filteredData.length === 0}
              style={{
                padding: '10px 20px', 
                background: '#4f46e5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 700, 
                cursor: (isExporting || filteredData.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isExporting || filteredData.length === 0) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isExporting ? '🔄 내보내는 중...' : '📊 계산서 발행기준 시트 생성'}
            </button>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px'}}>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>총 판매액</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#1e293b'}}>₩ {stats.totalSales.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>총 부가세</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#64748b'}}>₩ {stats.totalVat.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>총 생산원가</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#ef4444'}}>₩ {stats.totalCost.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>예상 마진</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#10b981'}}>₩ {stats.totalMargin.toLocaleString()}</div>
            </div>
            <div style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
              <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>평균 마진율</div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#f59e0b'}}>{stats.avgMarginRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="modal-body" style={{flex: 1, padding: '0', overflowX: 'auto', overflowY: 'auto', background: 'white'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1300px'}}>
            <thead style={{position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
              <tr>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '110px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>ID</th>
                <th style={{padding: '12px 8px', textAlign: 'left', width: '150px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>거래처</th>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>구분</th>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '60px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>수량</th>
                <th style={{padding: '12px 8px', textAlign: 'right', width: '90px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>장당원가</th>
                <th style={{padding: '12px 8px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>원가합계</th>
                <th style={{padding: '12px 8px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>판매합계</th>
                <th style={{padding: '12px 8px', textAlign: 'right', width: '100px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>마진</th>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '70px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>마진율</th>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '90px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>계산서일자</th>
                <th style={{padding: '12px 8px', textAlign: 'center', width: '80px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>상태</th>
                <th style={{padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'}}>비고</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{padding: '100px', textAlign: 'center', color: '#94a3b8'}}>해당 월에 등록된 오더가 없습니다.</td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const sales = item.finalDeliveryAll || item.legacyResult?.finalDeliveryAll || 0;
                  const costUnit = item.totalCostUnit || item.legacyResult?.totalCostUnit || 0;
                  const costTotal = costUnit * (item.qty || 0);
                  const margin = sales - costTotal;
                  const taxDate = item.tax1 || item.tax2 || '';

                  return (
                    <tr key={item.id} style={{borderBottom: '1px solid #f1f5f9', hover: {background: '#f8fafc'}}}>
                      <td style={{padding: '10px 8px', textAlign: 'center', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={item.id}>{item.id}</td>
                      <td style={{padding: '10px 8px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.company}</td>
                      <td style={{padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                        <span style={{
                          fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                          background: item.consultType === '신규' ? '#ecfdf5' : '#fff7ed',
                          color: item.consultType === '신규' ? '#059669' : '#d97706',
                          border: `1px solid ${item.consultType === '신규' ? '#34d399' : '#fbbf24'}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.consultType || '신규'}
                        </span>
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap'}}>{(item.qty || 0).toLocaleString()}</td>
                      <td style={{padding: '10px 8px', textAlign: 'right', color: '#64748b', whiteSpace: 'nowrap'}}>₩ {costUnit.toLocaleString()}</td>
                      <td style={{padding: '10px 8px', textAlign: 'right', color: '#ef4444', whiteSpace: 'nowrap'}}>₩ {costTotal.toLocaleString()}</td>
                      <td style={{padding: '10px 8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap'}}>₩ {sales.toLocaleString()}</td>
                      <td style={{padding: '10px 8px', textAlign: 'right', color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap'}}>₩ {margin.toLocaleString()}</td>
                      <td style={{padding: '10px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap'}}>
                        {sales > 0 ? (margin / sales * 100).toFixed(1) + '%' : '0%'}
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center', color: taxDate ? '#4f46e5' : '#94a3b8', fontWeight: taxDate ? 700 : 400, whiteSpace: 'nowrap'}}>
                        {taxDate || '-'}
                      </td>
                      <td style={{padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap'}}>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '10px', 
                          background: item.status === '취소' ? '#fff1f2' : '#f0f9ff',
                          color: item.status === '취소' ? '#ef4444' : '#0369a1',
                          border: `1px solid ${item.status === '취소' ? '#fecaca' : '#b9e6fe'}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{padding: '10px 8px', color: '#64748b', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {item.consultMemo || ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot style={{position: 'sticky', bottom: 0, zIndex: 10, background: '#f1f5f9', boxShadow: '0 -2px 4px rgba(0,0,0,0.05)', fontWeight: 800, fontSize: '15px'}}>
              <tr>
                <td colSpan="3" style={{padding: '15px 8px', textAlign: 'center', color: '#1e293b'}}>합계 / 평균</td>
                <td style={{padding: '15px 8px', textAlign: 'center'}}>{stats.totalQty.toLocaleString()}</td>
                <td style={{padding: '15px 8px', textAlign: 'right', color: '#64748b'}}>₩ {Math.round(stats.avgCostUnit).toLocaleString()}</td>
                <td style={{padding: '15px 8px', textAlign: 'right', color: '#ef4444'}}>₩ {stats.totalCost.toLocaleString()}</td>
                <td style={{padding: '15px 8px', textAlign: 'right', color: '#1e293b'}}>₩ {stats.totalSales.toLocaleString()}</td>
                <td style={{padding: '15px 8px', textAlign: 'right', color: '#10b981'}}>₩ {stats.totalMargin.toLocaleString()}</td>
                <td style={{padding: '15px 8px', textAlign: 'center', color: '#f59e0b'}}>
                  {stats.avgMarginRate.toFixed(1)}%
                </td>
                <td colSpan="3" style={{background: '#f8fafc'}}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
