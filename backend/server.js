require('dotenv').config();
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/health', healthRoutes);

// 根路由（用于简单的连通性检查）
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
});