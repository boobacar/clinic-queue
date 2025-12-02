const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { initSockets } = require('./socket');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api', routes);

const assetsPath = path.join(__dirname, 'assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath));
}

const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const server = http.createServer(app);
initSockets(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
