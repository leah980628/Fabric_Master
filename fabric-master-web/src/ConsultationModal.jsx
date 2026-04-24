import React, { useState } from 'react';

export default function ConsultationModal({ onClose, onSave }) {
  const [info, setInfo] = useState({
    company: '', pic: '', contact: '', contact2: '', email: '', date: '', memo: '', consultType: '신규'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(info);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
      <div className="modal-content" style={{width: '550px', padding: 0}}>
        <div className="modal-header" style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0'}}>
          <h2 style={{margin:0, fontSize:'20px'}}>1단계. 상담 등록 (가계약)</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{padding: '24px'}}>
          <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
            <button 
              onClick={() => setInfo(prev => ({...prev, consultType: '신규'}))}
              style={{
                flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                background: info.consultType === '신규' ? '#10b981' : 'white',
                color: info.consultType === '신규' ? 'white' : '#64748b',
                fontWeight: 700, cursor:'pointer'
              }}>
              ✨ 신규 상담
            </button>
            <button 
              onClick={() => setInfo(prev => ({...prev, consultType: '재상담'}))}
              style={{
                flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', 
                background: info.consultType === '재상담' ? '#3b82f6' : 'white',
                color: info.consultType === '재상담' ? 'white' : '#64748b',
                fontWeight: 700, cursor:'pointer'
              }}>
              🔄 재상담
            </button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div className="form-group">
              <label>업체명 (고객명)</label>
              <input type="text" name="company" value={info.company} onChange={handleChange} className="form-control" placeholder="예: 충남대학교" />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <input type="text" name="pic" value={info.pic} onChange={handleChange} className="form-control" placeholder="예: 홍길동" />
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'12px'}}>
            <div className="form-group">
              <label>연락처 1</label>
              <input type="text" name="contact" value={info.contact} onChange={handleChange} className="form-control" placeholder="010-0000-0000" />
            </div>
            <div className="form-group">
              <label>연락처 2 (선택)</label>
              <input type="text" name="contact2" value={info.contact2} onChange={handleChange} className="form-control" placeholder="042-000-0000" />
            </div>
          </div>

          <div className="form-group" style={{marginTop:'12px'}}>
            <label>이메일</label>
            <input type="email" name="email" value={info.email} onChange={handleChange} className="form-control" placeholder="example@email.com" />
          </div>

          <div className="form-group" style={{marginTop:'12px'}}>
            <label>사용 (납품) 예정일</label>
            <input type="date" name="date" value={info.date} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group" style={{marginTop:'12px'}}>
            <label>초기 상담 내용 (수량 포함 요약)</label>
            <textarea name="memo" value={info.memo} onChange={handleChange} className="form-control" rows="3" placeholder="예: 컨퍼런스용, 에코백 500개 예상. 사양 미정"></textarea>
          </div>

          <button 
            onClick={handleSave}
            style={{width: '100%', padding: '16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'}}>
            상담 등록 및 카드 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
