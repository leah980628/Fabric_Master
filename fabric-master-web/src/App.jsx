import { useState, useEffect } from 'react';
import ConsultationModal from './ConsultationModal';
import CalculatorModal from './CalculatorModal';
import FactoryManagementModal from './FactoryManagementModal';
import SettlementModal from './SettlementModal';
import ActivityLogPanel from './ActivityLogPanel';
import UserSelectModal, { getCurrentUser, setCurrentUser } from './UserSelectModal';
import './index.css';

const pipelineStages = [
  "상담진행", "견적안내", "오더확정", "샘플제작",
  "시안작업", "작업요청서", "공장발주", "공장출고확인",
  "납품완료", "사진촬영", "취소"
];

const stageEmojis = {
  "상담진행": "💬",
  "견적안내": "📄",
  "오더확정": "✅",
  "샘플제작": "✂️",
  "시안작업": "🎨",
  "작업요청서": "📝",
  "공장발주": "🏭",
  "공장출고확인": "📦",
  "납품완료": "🚚",
  "사진촬영": "📸",
  "취소": "❌"
};

const dummyData = [];

function KanbanCard({ item, onDragStart, onCardClick, onCopy, onDelete }) {
  const isNew = item.consultType === '신규';
  
  return (
    <div 
      className="kanban-card"
      draggable 
      onDragStart={(e) => onDragStart(e, item.id)}
      onClick={() => onCardClick(item)}
      title="클릭하여 사양 및 요척 계산"
    >
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px'}}>
        <div className="card-title" style={{margin:0, flex:1, fontSize:'14px', fontWeight:700}}>{item.company}</div>
        <div style={{display:'flex', flexDirection:'column', gap:'4px', alignItems:'flex-end'}}>
          <span style={{
            fontSize:'9px', 
            fontWeight:'800', 
            padding:'1px 5px', 
            borderRadius:'4px',
            whiteSpace:'nowrap',
            background: item.isLegacy ? '#f3e8ff' : '#dbeafe',
            color: item.isLegacy ? '#7e22ce' : '#1d4ed8',
            border: `1px solid ${item.isLegacy ? '#c084fc' : '#60a5fa'}`
          }}>
            {item.isLegacy ? '💾 기존' : '🌐 웹앱'}
          </span>
          <span style={{
            fontSize:'9px', 
            fontWeight:'700', 
            padding:'1px 5px', 
            borderRadius:'4px',
            whiteSpace:'nowrap',
            background: isNew ? '#ecfdf5' : '#fff7ed',
            color: isNew ? '#059669' : '#d97706',
            border: `1px solid ${isNew ? '#34d399' : '#fbbf24'}`
          }}>
            {isNew ? '✨ 신규' : '🔄 재상담'}
          </span>
        </div>
      </div>
      <div className="card-subtitle">{item.id} | {item.pic}</div>
      <div className="card-meta" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:'4px'}}>
          <span className="qty-tag">{item.qty}개</span>
          {item.factory && item.factory !== '미정' && (
            <span className="factory-tag" style={{
              fontSize:'11px', background:'rgba(129, 140, 248, 0.1)', color:'var(--primary-color)', padding:'2px 6px', borderRadius:'4px'
            }}>{item.factory}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, items, onDrop, onDragOver, onDragStart, onCardClick, onCopy, onDelete }) {
  // 공장발주 컬럼일 경우 아코디언 형태로 렌더링
  if (title === '공장발주') {
    const grouped = items.reduce((acc, item) => {
      const f = item.factory || '미정';
      if(!acc[f]) acc[f] = [];
      acc[f].push(item);
      return acc;
    }, {});

    return (
      <div 
        className="kanban-column"
        onDrop={(e) => onDrop(e, title)}
        onDragOver={onDragOver}
      >
        <div className="column-header special-header" style={{background: 'rgba(52, 211, 153, 0.1)', borderBottom: '2px solid rgba(52, 211, 153, 0.5)'}}>
          <span style={{color: 'var(--secondary-color)', fontWeight: 700}}>{title} {stageEmojis[title]}</span>
          <span className="badge" style={{background: 'rgba(52, 211, 153, 0.3)', color: 'white'}}>{items.length}</span>
        </div>
        <div className="column-body">
          {Object.entries(grouped).map(([factoryName, groupItems]) => (
            <div key={factoryName} className="factory-group">
              <div className="factory-group-header">
                <span>🏭 {factoryName}</span>
                <span className="badge-small">{groupItems.length}</span>
              </div>
              <div className="factory-group-items">
                {groupItems.map(item => (
                  <KanbanCard key={item.id} item={item} onDragStart={onDragStart} onCardClick={onCardClick} onCopy={onCopy} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
             <div style={{color:'var(--text-sub)', fontSize:'12px', textAlign:'center', marginTop:'20px'}}>발주 대기 건이 없습니다.</div>
          )}
        </div>
      </div>
    );
  }

  // 일반 컬럼 렌더링
  return (
    <div 
      className="kanban-column"
      onDrop={(e) => onDrop(e, title)}
      onDragOver={onDragOver}
    >
      <div className="column-header">
        <span>{title} {stageEmojis[title]}</span>
        <span className="badge">{items.length}</span>
      </div>
      <div className="column-body">
        {items.map(item => (
          <KanbanCard key={item.id} item={item} onDragStart={onDragStart} onCardClick={onCardClick} onCopy={onCopy} onDelete={onDelete} />
        ))}
        {items.length === 0 && (
          <div style={{color:'var(--text-sub)', fontSize:'12px', textAlign:'center', marginTop:'20px'}}>비어있음</div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState(dummyData);
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [isFactoryManageOpen, setIsFactoryManageOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [calculatorItem, setCalculatorItem] = useState(null);
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [showUserSelect, setShowUserSelect] = useState(!getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const apiBase = `http://${window.location.hostname}:3001`;

  const handleUserSelect = (name) => {
    setCurrentUserState(name);
    setCurrentUser(name);
    setShowUserSelect(false);
  };

  // 앱 시작 시 Google Sheets에서 데이터 불러오기
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiBase}/api/orders`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      } catch (err) {
        console.error('주문 데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('itemId', id);
  };

  const [trash, setTrash] = useState([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    }));
    // 시트에 상태 저장 (비동기)
    fetch(`${apiBase}/api/orders/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, currentUser })
    }).catch(err => console.error('상태 저장 실패:', err));
  };

  const handleStatusChange = (id, newStatus) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));
    // 시트에 상태 저장 (비동기)
    fetch(`${apiBase}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, currentUser })
    }).catch(err => console.error('상태 저장 실패:', err));
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('이 항목을 쓰레기통으로 이동하시겠습니까?')) {
      const target = items.find(item => item.id === id);
      if (target) {
        setTrash(prev => [...prev, target]);
        setItems(prev => prev.filter(item => item.id !== id));
        if (calculatorItem?.id === id) setCalculatorItem(null);
      }
    }
  };

  const handleRestoreItem = (id) => {
    const target = trash.find(item => item.id === id);
    if (target) {
      setItems(prev => [...prev, target]);
      setTrash(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('쓰레기통을 완전히 비우시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      setTrash([]);
    }
  };

  const handleCopyItem = (id) => {
    const target = items.find(item => item.id === id);
    if (!target) return;

    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yy}${mm}${dd}`;

    const todayItems = items.filter(item => item.id && item.id.startsWith(datePrefix + '_'));
    let nextNum = 1;
    if (todayItems.length > 0) {
      const maxNum = Math.max(...todayItems.map(item => {
        const parts = item.id.split('_');
        return parseInt(parts[1], 10) || 0;
      }));
      nextNum = maxNum + 1;
    }
    const newId = `${datePrefix}_${String(nextNum).padStart(2, '0')}`;

    const newItem = {
      ...target,
      id: newId,
      company: `${target.company} (복사본)`,
      status: '상담진행' // 복사본은 처음 단계로
    };

    setItems([...items, newItem]);
    alert('카드가 복사되었습니다.');
    return newItem;
  };

  const handleCreateConsult = async (info) => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yy}${mm}${dd}`;

    const todayItems = items.filter(item => item.id && item.id.startsWith(datePrefix + '_'));
    let nextNum = 1;
    if (todayItems.length > 0) {
      const maxNum = Math.max(...todayItems.map(item => {
        const parts = item.id.split('_');
        return parseInt(parts[1], 10) || 0;
      }));
      nextNum = maxNum + 1;
    }
    const newId = `${datePrefix}_${String(nextNum).padStart(2, '0')}`;

    const newItem = {
      id: newId,
      company: info.company || '신규고객',
      pic: info.pic,
      contact: info.contact,
      contact2: info.contact2,
      email: info.email,
      consultType: info.consultType || '신규',
      qty: 0,
      factory: '미정',
      date: info.date || today.toISOString().split('T')[0],
      status: '상담진행',
      consultMemo: info.memo,
      targetDate: info.date || '',
      currentUser
    };
    
    setItems(prev => [...prev, newItem]);

    // Google Sheets에 저장
    try {
      await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } catch (err) {
      console.error('주문 등록 실패:', err);
    }
  };

  const handleSaveSpecs = async (calculatedSpecs) => {
    const updatedItem = { 
      ...calculatorItem, 
      ...calculatedSpecs, 
      status: calculatorItem.status === '상담진행' ? '견적안내' : calculatorItem.status,
      currentUser
    };
    
    setItems(items.map(item => {
      if (item.id === calculatorItem.id) {
        return updatedItem;
      }
      return item;
    }));
    setCalculatorItem(null);

    // Google Sheets에 저장
    try {
      const res = await fetch(`${apiBase}/api/orders/${calculatorItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      const result = await res.json();
      if (result.success) {
        console.log('시트 저장 완료');
      } else {
        alert('시트 저장에 실패했습니다: ' + (result.error || ''));
      }
    } catch (err) {
      console.error('시트 저장 실패:', err);
      alert('서버 연결에 실패했습니다. 데이터는 로컬에만 저장되었습니다.');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' 또는 'oldest'

  const filteredItems = items.filter(item => {
    const s = searchTerm.toLowerCase();
    return (
      item.company?.toLowerCase().includes(s) ||
      item.id?.toLowerCase().includes(s) ||
      item.pic?.toLowerCase().includes(s)
    );
  }).sort((a, b) => {
    // ID 기준 정렬 (YYMMDD_NN 형식)
    const idA = (a._originalId || a.id || '').replace(/_r\d+$/, '');
    const idB = (b._originalId || b.id || '').replace(/_r\d+$/, '');
    if (sortOrder === 'newest') {
      return idB.localeCompare(idA); // 최신순 (내림차순)
    } else {
      return idA.localeCompare(idB); // 오래된순 (오름차순)
    }
  });

  return (
    <div className="dashboard-container">
      {/* 작업자 선택 모달 */}
      {showUserSelect && (
        <UserSelectModal onSelect={handleUserSelect} />
      )}

      <div className="header">
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
          <h1 style={{margin:0}}>가방 생산 통합 관리 대시보드</h1>
          {/* 검색창 */}
          <div style={{position:'relative', width:'300px'}}>
            <input 
              type="text" 
              placeholder="업체명, 번호, 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width:'100%', padding:'10px 15px 10px 40px', borderRadius:'10px', 
                border:'1px solid var(--border-color)', fontSize:'14px', outline:'none',
                background:'white', color:'var(--text-main)',
                boxShadow:'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <span style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', fontSize:'16px'}}>🔍</span>
          </div>
          {/* 정렬 버튼 추가 */}
          <button 
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            style={{
              padding: '10px 15px', 
              background: 'white', 
              border: '1px solid var(--border-color)', 
              borderRadius: '10px', 
              fontSize: '14px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-main)',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
              whiteSpace: 'nowrap'
            }}
          >
            {sortOrder === 'newest' ? '🆕 최신순' : '⏳ 오래된순'}
          </button>
        </div>
        <div className="button-group" style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          {/* 현재 작업자 표시 */}
          <button 
            onClick={() => setShowUserSelect(true)}
            style={{padding: '8px 16px', background: 'rgba(129, 140, 248, 0.1)', color: 'var(--primary-color)', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '20px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display:'flex', alignItems:'center', gap:'6px'}}>
            👤 {currentUser || '작업자 선택'}
          </button>
          <button 
            onClick={() => setIsLogOpen(true)}
            style={{padding: '10px 20px', background: 'rgba(241, 245, 249, 0.8)', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            🕒 활동 로그
          </button>
          <button 
            onClick={() => setIsFactoryManageOpen(true)}
            style={{padding: '10px 20px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            ⚙️ 공장 관리
          </button>
          <button 
            onClick={() => setIsSettlementOpen(true)}
            style={{padding: '10px 20px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            💰 공장 정산
          </button>
          <button 
            onClick={() => setIsConsultOpen(true)}
            style={{padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            + 새 주문 등록 (상담)
          </button>
          <button style={{padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            📦 공장 발주 전송
          </button>
          <button 
            onClick={() => setIsTrashOpen(true)}
            style={{padding: '10px 20px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', position: 'relative'}}>
            🗑️ 쓰레기통 
            {trash.length > 0 && <span style={{position:'absolute', top:'-8px', right:'-8px', background:'#ef4444', color:'white', borderRadius:'50%', width:'20px', height:'20px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>{trash.length}</span>}
          </button>
        </div>
      </div>
      
      {isTrashOpen && (
        <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
          <div className="modal-content" style={{width: '600px', height: '500px', display: 'flex', flexDirection: 'column'}}>
            <div className="modal-header">
              <h2>🗑️ 쓰레기통 (삭제된 항목)</h2>
              <button className="close-btn" onClick={() => setIsTrashOpen(false)}>&times;</button>
            </div>
            <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
              {trash.length === 0 ? (
                <div style={{textAlign:'center', color:'var(--text-sub)', marginTop:'50px'}}>비어있음</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {trash.map(item => (
                    <div key={item.id} style={{padding:'12px', background:'white', borderRadius:'8px', border:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:'700'}}>{item.company}</div>
                        <div style={{fontSize:'12px', color:'var(--text-sub)'}}>{item.id} | {item.pic}</div>
                      </div>
                      <button 
                        onClick={() => handleRestoreItem(item.id)}
                        style={{padding:'6px 12px', background:'#10b981', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'13px'}}>
                        되살리기 ↩️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{padding:'20px', textAlign:'right'}}>
              <button 
                onClick={handleEmptyTrash}
                disabled={trash.length === 0}
                style={{padding:'10px 20px', background:trash.length > 0 ? '#ef4444' : '#fecaca', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600}}>
                쓰레기통 비우기 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 및 패널 영역 */}
      <ActivityLogPanel isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      {isConsultOpen && (
        <ConsultationModal 
          onClose={() => setIsConsultOpen(false)} 
          onSave={handleCreateConsult} 
        />
      )}

      {isFactoryManageOpen && (
        <FactoryManagementModal 
          onClose={() => setIsFactoryManageOpen(false)} 
        />
      )}

      {isSettlementOpen && (
        <SettlementModal items={items} onClose={() => setIsSettlementOpen(false)} />
      )}

      {calculatorItem && (
        <CalculatorModal 
          item={calculatorItem} 
          onClose={() => setCalculatorItem(null)} 
          onSave={handleSaveSpecs}
          onCopy={handleCopyItem}
          onDelete={handleDeleteItem}
          onStatusChange={handleStatusChange}
          pipelineStages={pipelineStages}
          currentUser={currentUser}
        />
      )}
      
      <div className="kanban-board">
        {pipelineStages.map(stage => {
          const stageItems = filteredItems.filter(i => i.status === stage);
          return (
            <KanbanColumn 
              key={stage} 
              title={stage} 
              items={stageItems} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCardClick={setCalculatorItem}
              onCopy={handleCopyItem}
              onDelete={handleDeleteItem}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
