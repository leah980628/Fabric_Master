import React, { useState } from 'react';

export default function ConsultationModal({ onClose, onSave }) {
  const [info, setInfo] = useState({
    company: '', pic: '', contact: '', date: '', memo: ''
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
    <div className="modal-overlay">
      <div className="modal-content" style={{width: '500px'}}>
        <div className="modal-header">
          <h2>1단계. 신규 상담 등록 (가계약)</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{padding: '24px'}}>
          <div className="form-group">
            <label>업체명 (고객명)</label>
            <input type="text" name="company" value={info.company} onChange={handleChange} className="form-control" placeholder="예: 충남대학교" />
          </div>
          <div className="form-group">
            <label>담당자</label>
            <input type="text" name="pic" value={info.pic} onChange={handleChange} className="form-control" placeholder="예: 홍길동" />
          </div>
          <div className="form-group">
            <label>연락처</label>
            <input type="text" name="contact" value={info.contact} onChange={handleChange} className="form-control" placeholder="010-0000-0000" />
          </div>
          <div className="form-group">
            <label>사용 (납품) 예정일</label>
            <input type="date" name="date" value={info.date} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label>초기 상담 내용 (수량 포함 요약)</label>
            <textarea name="memo" value={info.memo} onChange={handleChange} className="form-control" rows="3" placeholder="예: 컨퍼런스용, 에코백 500개 예상. 사양 미정"></textarea>
          </div>
          <button 
            onClick={handleSave}
            style={{width: '100%', padding: '14px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '16px'}}>
            임시 저장 및 상담카드 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
