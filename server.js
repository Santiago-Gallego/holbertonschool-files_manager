const process = require('process');
const express = require('express');
const router = require('./routes/index');

const app = express();
const port = process.env.PORT || '5000';

app.use(express.json());
app.use('/', router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
