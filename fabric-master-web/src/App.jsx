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

function KanbanCard({ item, onDragStart, onCardClick }) {
  return (
    <div 
      className="kanban-card"
      draggable 
      onDragStart={(e) => onDragStart(e, item.id)}
      onClick={() => onCardClick(item)}
      title="클릭하여 사양 및 요척 계산"
    >
      <div className="card-title">{item.company}</div>
      <div className="card-subtitle">{item.id} | {item.pic}</div>
      <div className="card-meta">
        <span className="qty-tag">{item.qty}개</span>
        {item.factory && item.factory !== '미정' && (
           <span className="factory-tag" style={{
             fontSize:'11px', background:'#e0e7ff', color:'#3730a3', padding:'2px 6px', borderRadius:'4px'
           }}>{item.factory}</span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ title, items, onDrop, onDragOver, onDragStart, onCardClick }) {
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
                  <KanbanCard key={item.id} item={item} onDragStart={onDragStart} onCardClick={onCardClick} />
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
          <KanbanCard key={item.id} item={item} onDragStart={onDragStart} onCardClick={onCardClick} />
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
        qty: 0,
        factory: '미정',
        date: info.date || today.toISOString().split('T')[0],
        status: '상담진행'
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

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>가방 생산 통합 관리 대시보드</h1>
        <div className="button-group" style={{display: 'flex', gap: '12px'}}>
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
        />
      )}
      
      <div className="kanban-board">
        {PIPELINE_STAGES.map(stage => {
          const stageItems = items.filter(i => i.status === stage);
          return (
            <KanbanColumn 
              key={stage} 
              title={stage} 
              items={stageItems} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCardClick={setCalculatorItem}
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
