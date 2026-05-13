import React, { useState, useEffect } from 'react';

export default function ActivityLogPanel({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const apiBase = `http://${window.location.hostname}:3001`;
      const res = await fetch(`${apiBase}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('로그 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // 1분(60초)마다 자동 새로고침하여 실시간성 제공
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getActionStyle = (action) => {
    if (action.includes('등록')) return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    if (action.includes('수정')) return { bg: '#fef3c7', text: '#92400e', border: '#fde047' };
    if (action.includes('상태')) return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' };
    return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15, 23, 42, 0.4)', zIndex: 9998, backdropFilter: 'blur(2px)'
        }} 
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '420px', height: '100%',
        background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1), -8px 0 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{
          padding: '24px', borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.5)'
        }}>
          <div>
            <h2 style={{margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a'}}>🕒 실시간 활동 로그</h2>
            <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#64748b'}}>팀원들의 작업 내역을 확인합니다</p>
          </div>
          <button 
            onClick={fetchLogs}
            style={{
              background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer',
              padding: '8px', borderRadius: '50%', color: '#64748b', transition: 'all 0.2s',
              transform: loading ? 'rotate(180deg)' : 'none'
            }}
            title="새로고침"
          >
            ↻
          </button>
        </div>

        <div style={{flex: 1, overflowY: 'auto', padding: '24px'}}>
          {logs.length === 0 && !loading && (
            <div style={{textAlign: 'center', color: '#94a3b8', marginTop: '40px'}}>
              최근 활동 내역이 없습니다.
            </div>
          )}
          {logs.map((log, idx) => {
            const style = getActionStyle(log['액션'] || '');
            return (
              <div key={idx} style={{
                position: 'relative', paddingLeft: '24px', marginBottom: '24px',
                borderLeft: '2px solid #e2e8f0'
              }}>
                <div style={{
                  position: 'absolute', left: '-5px', top: '4px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: style.text, boxShadow: `0 0 0 4px #ffffff`
                }} />
                
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px'}}>
                  <span style={{fontSize: '12px', fontWeight: 600, color: '#64748b'}}>{log['일시']}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                    background: style.bg, color: style.text, border: `1px solid ${style.border}`
                  }}>
                    {log['액션']}
                  </span>
                </div>
                
                <div style={{
                  background: 'white', padding: '16px', borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', background: '#f8fafc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0'
                    }}>
                      {log['작업자']?.[0] || '?'}
                    </div>
                    <span style={{fontSize: '14px', fontWeight: 700, color: '#334155'}}>{log['작업자']}</span>
                    <span style={{fontSize: '13px', color: '#64748b'}}>작업자</span>
                  </div>
                  
                  <div style={{fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center'}}>
                    { (log['주문ID'] || log['고유번호']) && (
                      <span style={{
                        fontSize: '12px', fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', 
                        padding: '2px 6px', borderRadius: '4px', marginRight: '8px'
                      }}>
                        {log['주문ID'] || log['고유번호']}
                      </span>
                    )}
                    {log['업체명'] || log['업채명']}
                  </div>
                  
                  <div style={{fontSize: '14px', color: '#475569', lineHeight: 1.5}}>
                    {log['상세내용']}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
