import { useState, useEffect } from 'react';
import ConsultationModal from './ConsultationModal';
import CalculatorModal from './CalculatorModal';
import './index.css';

const PIPELINE_STAGES = [
  "상담진행", "견적안내", "오더확정", "샘플제작",
  "시안작업", "작업요청서", "공장발주", "공장출고확인",
  "납품완료", "사진촬영", "취소"
];

const STAGE_EMOJIS = {
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

const DUMMY_DATA = [
  { id: '230318_01', company: '위앤아이굿', pic: '유미순', qty: 1000, factory: '미정', date: '2023-03-31', status: '상담진행' },
  { id: '230318_02', company: '충남대학교', pic: '김규리', qty: 250, factory: '에코컴퍼니', date: '', status: '오더확정' },
  { id: '230318_03', company: '도도보틀', pic: '이현아', qty: 200, factory: '흥진상사', date: '', status: '견적안내' },
  { id: '230320_01', company: 'oo기업', pic: '손유경', qty: 140, factory: '모카', date: '', status: '공장발주' },
  { id: '230320_02', company: 'A산업', pic: '김철수', qty: 500, factory: '에코컴퍼니', date: '', status: '공장발주' },
  { id: '230320_03', company: 'B브랜드', pic: '이영희', qty: 300, factory: '모카', date: '', status: '공장발주' },
  { id: '230320_04', company: 'C커피', pic: '박주말', qty: 100, factory: '흥진상사', date: '', status: '공장발주' }
];

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
        <div className="card-title" style={{margin:0, flex:1}}>{item.company}</div>
        <span style={{
          fontSize:'10px', 
          fontWeight:'700', 
          padding:'2px 6px', 
          borderRadius:'10px',
          marginLeft:'6px',
          whiteSpace:'nowrap',
          background: isNew ? '#ecfdf5' : '#eff6ff',
          color: isNew ? '#10b981' : '#3b82f6',
          border: `1px solid ${isNew ? '#10b981' : '#3b82f6'}`
        }}>
          {isNew ? '✨ 신규' : '🔄 재상담'}
        </span>
      </div>
      <div className="card-subtitle">{item.id} | {item.pic}</div>
      <div className="card-meta" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:'4px'}}>
          <span className="qty-tag">{item.qty}개</span>
          {item.factory && item.factory !== '미정' && (
            <span className="factory-tag" style={{
              fontSize:'11px', background:'#e0e7ff', color:'#3730a3', padding:'2px 6px', borderRadius:'4px'
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
        <div className="column-header special-header" style={{background: 'rgba(16, 185, 129, 0.1)', borderBottom: '2px solid #10b981'}}>
          <span style={{color: '#059669', fontWeight: 700}}>{title} {STAGE_EMOJIS[title]}</span>
          <span className="badge" style={{background: '#10b981', color: 'white'}}>{items.length}</span>
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
             <div style={{color:'#94a3b8', fontSize:'12px', textAlign:'center', marginTop:'20px'}}>발주 대기 건이 없습니다.</div>
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
        <span>{title} {STAGE_EMOJIS[title]}</span>
        <span className="badge">{items.length}</span>
      </div>
      <div className="column-body">
        {items.map(item => (
          <KanbanCard key={item.id} item={item} onDragStart={onDragStart} onCardClick={onCardClick} onCopy={onCopy} onDelete={onDelete} />
        ))}
        {items.length === 0 && (
          <div style={{color:'#94a3b8', fontSize:'12px', textAlign:'center', marginTop:'20px'}}>비어있음</div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState(DUMMY_DATA);
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [calculatorItem, setCalculatorItem] = useState(null);

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
  };

  const handleStatusChange = (id, newStatus) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));
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

  const handleCreateConsult = (info) => {
    setItems(prev => {
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const datePrefix = `${yy}${mm}${dd}`;

      const todayItems = prev.filter(item => item.id && item.id.startsWith(datePrefix + '_'));
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
        consultMemo: info.memo
      };
      
      return [...prev, newItem];
    });
  };

  const handleSaveSpecs = (calculatedSpecs) => {
    setItems(items.map(item => {
      if (item.id === calculatorItem.id) {
        // 사양 저장 시 factory, qty 등 모든 데이터를 업데이트하고 상태를 견적안내로 변경
        return { 
          ...item, 
          ...calculatedSpecs, 
          status: item.status === '상담진행' ? '견적안내' : item.status 
        };
      }
      return item;
    }));
    setCalculatorItem(null);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const s = searchTerm.toLowerCase();
    return (
      item.company?.toLowerCase().includes(s) ||
      item.id?.toLowerCase().includes(s) ||
      item.pic?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="dashboard-container">
      <div className="header">
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
          <h1 style={{margin:0}}>가방 생산 통합 관리 대시보드</h1>
          {/* 검색창 추가 */}
          <div style={{position:'relative', width:'300px'}}>
            <input 
              type="text" 
              placeholder="업체명, 번호, 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width:'100%', padding:'10px 15px 10px 40px', borderRadius:'10px', 
                border:'1px solid #e2e8f0', fontSize:'14px', outline:'none',
                boxShadow:'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <span style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', fontSize:'16px'}}>🔍</span>
          </div>
        </div>
        <div className="button-group" style={{display: 'flex', gap: '12px'}}>
          <button 
            onClick={() => setIsTrashOpen(true)}
            style={{padding: '10px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', position: 'relative'}}>
            🗑️ 쓰레기통 
            {trash.length > 0 && <span style={{position:'absolute', top:'-8px', right:'-8px', background:'#ef4444', color:'white', borderRadius:'50%', width:'20px', height:'20px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>{trash.length}</span>}
          </button>
          <button 
            onClick={() => setIsConsultOpen(true)}
            style={{padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            + 새 주문 등록 (상담)
          </button>
          <button style={{padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}>
            📦 공장 발주 전송
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
                <div style={{textAlign:'center', color:'#94a3b8', marginTop:'50px'}}>비어있음</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {trash.map(item => (
                    <div key={item.id} style={{padding:'12px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:'700'}}>{item.company}</div>
                        <div style={{fontSize:'12px', color:'#64748b'}}>{item.id} | {item.pic}</div>
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

      {isConsultOpen && (
        <ConsultationModal 
          onClose={() => setIsConsultOpen(false)} 
          onSave={handleCreateConsult} 
        />
      )}

      {calculatorItem && (
        <CalculatorModal 
          item={calculatorItem} 
          onClose={() => setCalculatorItem(null)} 
          onSave={handleSaveSpecs}
          onCopy={handleCopyItem}
          onDelete={handleDeleteItem}
          onStatusChange={handleStatusChange}
          PIPELINE_STAGES={PIPELINE_STAGES}
        />
      )}
      
      <div className="kanban-board">
        {PIPELINE_STAGES.map(stage => {
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
