import React, { useState, useEffect } from 'react';

export default function FactoryManagementModal({ onClose }) {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({
    분류: '', 공장이름: '', 설명: '', 담당자: '', 핸드폰: '', 연럭처: '', 팩스: '', 이메일: '', 공장주소: '', 공장발주시트: ''
  });

  const apiBase = `http://${window.location.hostname}:3001`;

  const fetchFactories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/factories`);
      const data = await res.json();
      setFactories(data);
    } catch (err) {
      console.error(err);
      alert('공장 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRow 
        ? `${apiBase}/api/factories/${editingRow}` 
        : `${apiBase}/api/factories`;
      const method = editingRow ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(editingRow ? '수정되었습니다.' : '등록되었습니다.');
        setFormData({ 분류: '', 공장이름: '', 설명: '', 담당자: '', 핸드폰: '', 연럭처: '', 팩스: '', 이메일: '', 공장주소: '', 공장발주시트: '' });
        setEditingRow(null);
        fetchFactories();
      }
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (factory) => {
    setEditingRow(factory.rowIndex);
    const { rowIndex, ...data } = factory;
    setFormData(data);
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${apiBase}/api/factories/${rowIndex}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchFactories();
      }
    } catch (err) {
      console.error(err);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="modal-overlay" style={{background: 'rgba(15, 23, 42, 0.6)'}}>
      <div className="modal-content" style={{width: '1000px', maxWidth: '95vw', height: '80vh', display:'flex', flexDirection:'column'}}>
        <div className="modal-header" style={{padding: '20px 24px', borderBottom: '1px solid #e2e8f0'}}>
          <h2 style={{margin:0, fontSize:'20px'}}>🏭 공장 관리 (마스터 데이터)</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body" style={{flex:1, overflow:'hidden', display:'flex', gap:'20px', padding:'20px'}}>
          {/* 입력 폼 */}
          <div style={{width:'350px', background:'#f8fafc', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', overflowY:'auto'}}>
            <h3 style={{marginTop:0, fontSize:'16px', marginBottom:'15px'}}>{editingRow ? '공장 정보 수정' : '새 공장 등록'}</h3>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>분류</label>
                <input type="text" name="분류" value={formData.분류} onChange={handleChange} className="form-control" placeholder="예: 가방생산" />
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>공장이름*</label>
                <input type="text" name="공장이름" value={formData.공장이름} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>설명</label>
                <input type="text" name="설명" value={formData.설명} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>담당자</label>
                <input type="text" name="담당자" value={formData.담당자} onChange={handleChange} className="form-control" />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div className="form-group">
                  <label style={{fontSize:'12px'}}>핸드폰</label>
                  <input type="text" name="핸드폰" value={formData.핸드폰} onChange={handleChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'12px'}}>연럭처(일반)</label>
                  <input type="text" name="연럭처" value={formData.연럭처} onChange={handleChange} className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>팩스 번호</label>
                <input type="text" name="팩스" value={formData.팩스} onChange={handleChange} className="form-control" placeholder="02-000-0000" />
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>이메일</label>
                <input type="email" name="이메일" value={formData.이메일} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label style={{fontSize:'12px'}}>공장주소</label>
                <input type="text" name="공장주소" value={formData.공장주소} onChange={handleChange} className="form-control" />
              </div>
              
              <div style={{marginTop:'10px', display:'flex', gap:'8px'}}>
                <button type="submit" style={{flex:1, padding:'12px', background:'var(--primary-color)', color:'white', border:'none', borderRadius:'8px', fontWeight:700, cursor:'pointer'}}>
                  {editingRow ? '수정 완료' : '공장 등록'}
                </button>
                {editingRow && (
                  <button type="button" onClick={() => { setEditingRow(null); setFormData({ 분류: '', 공장이름: '', 설명: '', 담당자: '', 핸드폰: '', 연럭처: '', 팩스: '', 이메일: '', 공장주소: '', 공장발주시트: '' }); }} style={{padding:'12px', background:'#e2e8f0', border:'none', borderRadius:'8px', cursor:'pointer'}}>취소</button>
                )}
              </div>
            </form>
          </div>

          {/* 목록 테이블 */}
          <div style={{flex:1, background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            <div style={{padding:'15px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', fontWeight:700, fontSize:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'15px'}}>
              <span style={{whiteSpace:'nowrap'}}>공장 목록 ({factories.length})</span>
              <div style={{flex:1, position:'relative'}}>
                <input 
                  type="text" 
                  placeholder="공장이름, 담당자, 분류 검색..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width:'100%', padding:'6px 12px', paddingLeft:'32px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'13px'
                  }}
                />
                <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)'}}>🔍</span>
              </div>
              <button onClick={fetchFactories} style={{background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'12px', whiteSpace:'nowrap'}}>새로고침 🔄</button>
            </div>
            <div style={{flex:1, overflowY:'auto'}}>
              {loading ? (
                <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>불러오는 중...</div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                  <thead style={{position:'sticky', top:0, background:'#f1f5f9', zIndex:1}}>
                    <tr>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0', width:'150px'}}>공장이름</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0', minWidth:'120px'}}>담당자</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0', width:'160px'}}>연락처</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0', width:'120px'}}>팩스</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0'}}>주소</th>
                      <th style={{padding:'12px', textAlign:'center', borderBottom:'1px solid #e2e8f0', width:'100px'}}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factories
                      .filter(f => 
                        (f.공장이름?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (f.담당자?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (f.분류?.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(f => (
                      <tr key={f.rowIndex} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'12px', fontWeight:700}}>{f.공장이름}</td>
                        <td style={{padding:'12px', whiteSpace:'nowrap'}}>{f.담당자}</td>
                        <td style={{padding:'12px', whiteSpace:'nowrap'}}>{f.핸드폰 || f.연럭처}</td>
                        <td style={{padding:'12px', color:'#64748b', whiteSpace:'nowrap'}}>{f.팩스}</td>
                        <td style={{padding:'12px', color:'#64748b', fontSize:'11px'}}>{f.공장주소}</td>
                        <td style={{padding:'12px', textAlign:'center'}}>
                          <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                            <button onClick={() => handleEdit(f)} style={{padding:'4px 8px', background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe', borderRadius:'4px', cursor:'pointer', fontSize:'11px'}}>수정</button>
                            <button onClick={() => handleDelete(f.rowIndex)} style={{padding:'4px 8px', background:'#fff1f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:'4px', cursor:'pointer', fontSize:'11px'}}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
