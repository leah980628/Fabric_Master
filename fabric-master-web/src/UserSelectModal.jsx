import React, { useState } from 'react';

// 기본 직원 목록 (localStorage에 저장된 목록과 병합)
const defaultWorkers = ['유미순', '전보건', '이영화'];

// localStorage에서 작업자 목록 불러오기
const getWorkerList = () => {
  try {
    const saved = localStorage.getItem('fabricWorkerList');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 기본 목록과 병합 (중복 제거)
      const merged = [...new Set([...defaultWorkers, ...parsed])];
      return merged;
    }
  } catch (e) {
    console.error('작업자 목록 로드 실패:', e);
  }
  return defaultWorkers;
};

// localStorage에 작업자 목록 저장
const saveWorkerList = (list) => {
  try {
    localStorage.setItem('fabricWorkerList', JSON.stringify(list));
  } catch (e) {
    console.error('작업자 목록 저장 실패:', e);
  }
};

// 현재 작업자 불러오기
export const getCurrentUser = () => {
  return localStorage.getItem('fabricCurrentUser') || '';
};

// 현재 작업자 저장
export const setCurrentUser = (name) => {
  localStorage.setItem('fabricCurrentUser', name);
};

export default function UserSelectModal({ onSelect }) {
  const [workers, setWorkers] = useState(getWorkerList);
  const [selected, setSelected] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSelect = () => {
    if (!selected) {
      alert('작업자를 선택해주세요.');
      return;
    }
    setCurrentUser(selected);
    onSelect(selected);
  };

  const handleAddWorker = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (workers.includes(trimmed)) {
      alert('이미 등록된 이름입니다.');
      return;
    }
    const updated = [...workers, trimmed];
    setWorkers(updated);
    saveWorkerList(updated);
    setSelected(trimmed);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999}}>
      <div className="modal-content" style={{
        maxWidth: '420px', width: '90vw', padding: 0,
        borderRadius: '20px', overflow: 'hidden'
      }}>
        <div style={{
          padding: '32px 28px 20px',
          background: 'linear-gradient(135deg, var(--primary-color), #6366f1)',
          color: 'white', textAlign: 'center'
        }}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👤</div>
          <h2 style={{margin: 0, fontSize: '22px', fontWeight: 800}}>작업자 선택</h2>
          <p style={{margin: '8px 0 0', fontSize: '14px', opacity: 0.8}}>
            등록/수정 시 자동으로 기록됩니다
          </p>
        </div>

        <div style={{padding: '28px'}}>
          {/* 작업자 선택 버튼 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '16px'
          }}>
            {workers.map(name => (
              <button
                key={name}
                onClick={() => setSelected(name)}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: selected === name 
                    ? '2px solid var(--primary-color)' 
                    : '2px solid #e2e8f0',
                  background: selected === name 
                    ? 'rgba(129, 140, 248, 0.1)' 
                    : 'white',
                  color: selected === name ? 'var(--primary-color)' : '#475569',
                  fontWeight: selected === name ? 700 : 500,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {selected === name && '✅'} {name}
              </button>
            ))}
          </div>

          {/* 새 직원 등록 */}
          {isAdding ? (
            <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWorker()}
                placeholder="이름을 입력하세요"
                className="form-control"
                style={{flex: 1, fontSize: '15px', padding: '12px'}}
                autoFocus
              />
              <button
                onClick={handleAddWorker}
                style={{
                  padding: '0 16px', background: 'var(--primary-color)',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                등록
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewName(''); }}
                style={{
                  padding: '0 12px', background: '#f1f5f9',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  cursor: 'pointer', color: '#64748b'
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%', padding: '12px',
                background: '#f8fafc', border: '2px dashed #cbd5e1',
                borderRadius: '12px', color: '#64748b',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              + 새 직원 등록
            </button>
          )}

          {/* 확인 버튼 */}
          <button
            onClick={handleSelect}
            disabled={!selected}
            style={{
              width: '100%', padding: '16px',
              background: selected ? 'var(--primary-color)' : '#cbd5e1',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: 700, fontSize: '16px',
              cursor: selected ? 'pointer' : 'not-allowed',
              boxShadow: selected ? '0 4px 12px rgba(129, 140, 248, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {selected ? `👤 ${selected}(으)로 시작하기` : '작업자를 선택하세요'}
          </button>
        </div>
      </div>
    </div>
  );
}
