const http = require('http');

http.get('http://localhost:3001/api/orders', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total items from API:', json.length);
      if (json.length > 0) {
        const statuses = {};
        json.forEach(item => {
          statuses[item.status] = (statuses[item.status] || 0) + 1;
        });
        console.log('Status breakdown:', statuses);
        console.log('Sample item (ID):', json[0].id);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      console.log('Data sample:', data.slice(0, 100));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
