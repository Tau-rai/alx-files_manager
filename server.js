// First API
const express = require('express');

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());

const routes = require('./routes/index');

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
