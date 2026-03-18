const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const dashboardData = {
  user: {
    name: 'Admin',
    role: 'Power Admin'
  },
  summary: {
    title: 'Dashboard',
    subtitle: 'Resumen del frontero',
    compliance: 55
  },
  context: {
    title: 'CONTEXTO DE LA ORGANIZACIÓN',
    chapters: [
      { name: 'Capítulo 4 - Contexto', progress: 70, color: '#2d67df' },
      { name: 'Capítulo 5 - Liderazgo', progress: 60, color: '#4f7dd9' },
      { name: 'Capítulo 6 - Planificación', progress: 50, color: '#3ba973' },
      { name: 'Capítulo 7 - Soporte', progress: 40, color: '#64b47d' },
      { name: 'Capítulo 8 - Operación', progress: 30, color: '#77bc75' },
      { name: 'Capítulo 9 - Evaluación', progress: 20, color: '#d7a34b' },
      { name: 'Capítulo 10 - Mejora', progress: 20, color: '#d49d50' }
    ]
  },
  requiredEvidence: [
    'Guía de auditoría del título',
    'Pruebas de mecanismo',
    'Plan de procesos objetivo'
  ],
  sideNav: [
    {
      section: 'Dashboard',
      items: [
        'Dashboard',
        'Implementación de SGC',
        'Capítulo 4 - Contexto',
        'Capítulo 5 - Liderazgo',
        'Capítulo 6 - Planificación',
        'Capítulo 7 - Soporte',
        'Capítulo 8 - Operación',
        'Capítulo 9 - Evaluación',
        'Capítulo 10 - Mejora'
      ]
    },
    {
      section: 'Gestión',
      items: ['Riesgos', 'Auditorías', 'Indicadores', 'Documentos', 'Acciones correctivas', 'Reportes']
    }
  ]
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream'
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/dashboard') {
    sendJson(res, 200, dashboardData);
    return;
  }

  const safePath = path.normalize(requestUrl.pathname).replace(/^\/+/, '');
  const filePath = path.join(publicDir, safePath || 'index.html');

  if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  serveFile(res, path.join(publicDir, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`EQA dashboard running on http://localhost:${PORT}`);
});
