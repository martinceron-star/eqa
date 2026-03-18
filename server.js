const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'organizations.json');

const catalog = {
  countries: [
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' }
  ],
  industries: ['Manufactura', 'Tecnología', 'Salud', 'Construcción', 'Logística', 'Educación'],
  employeeRanges: ['1 - 10', '11 - 50', '51 - 200', '201 - 500', '500+'],
  processes: ['Consmanciclio', 'Asesponación', 'Soporte a clientes', 'Gestión documental']
};

function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]', 'utf8');
  }
}

function readOrganizations() {
  ensureStorage();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeOrganizations(organizations) {
  ensureStorage();
  fs.writeFileSync(dataFile, JSON.stringify(organizations, null, 2), 'utf8');
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { message: 'Archivo no encontrado.' });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain; charset=utf-8' });
    res.end(content);
  });
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.socket.destroy();
        reject(new Error('Payload demasiado grande.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/catalog') {
    sendJson(res, 200, catalog);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/organizations') {
    sendJson(res, 200, readOrganizations());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/organizations') {
    collectBody(req)
      .then((body) => {
        const { companyName, country, industry, employees, selectedProcesses } = body;
        if (!companyName || !country || !industry || !employees) {
          sendJson(res, 400, { message: 'Completa nombre, país, industria y número de empleados.' });
          return;
        }

        const organizations = readOrganizations();
        const organization = {
          id: organizations.length + 1,
          companyName: companyName.trim(),
          country,
          industry,
          employees,
          selectedProcesses: Array.isArray(selectedProcesses) ? selectedProcesses : [],
          createdAt: new Date().toISOString()
        };
        organizations.push(organization);
        writeOrganizations(organizations);
        sendJson(res, 201, { message: 'Organización registrada correctamente.', organization });
      })
      .catch((error) => {
        sendJson(res, 400, { message: error.message });
      });
    return;
  }

  const filePath =
    url.pathname === '/'
      ? path.join(publicDir, 'index.html')
      : path.join(publicDir, url.pathname.replace(/^\/+/, ''));

  if (filePath.startsWith(publicDir)) {
    sendFile(res, filePath);
    return;
  }

  sendJson(res, 404, { message: 'Ruta no encontrada.' });
}

function createServer() {
  ensureStorage();
  return http.createServer(requestHandler);
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { createServer, requestHandler, catalog, readOrganizations, writeOrganizations, dataFile };
