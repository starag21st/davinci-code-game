const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 정적 파일 서빙 (index.html, style.css, js 폴더 등)
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
