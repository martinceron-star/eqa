const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');

const store = {
  company: {
    name: 'ACME S.A. de C.V.',
    standard: 'ISO 9001:2015',
    chapter: '4.1 Contexto de la organización',
    user: 'Admin',
    role: 'Super Admin'
  },
  navigation: [
    { title: 'Dashboard', items: ['Dashboard', 'Implementación del SGC'] },
    {
      title: 'Capítulos',
      items: [
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
      title: 'Riesgos',
      items: ['Auditorías', 'Indicadores', 'Documentos', 'Acciones correctivas', 'Reportes', 'Configuración']
    }
  ],
  tabs: ['Destacar', 'Partes interesadas', 'Alcance', 'Procesos'],
  sections: [
    {
      title: 'ANÁLISIS DEL CONTEXTO (PESTEL)',
      columns: [
        { title: 'Factores internos', items: ['Político', 'Económico', 'Social', 'Ambiental'] },
        { title: 'Factores externos', items: ['Social', 'Tecnológico', 'Legal / Regulatorio', 'Ambiental'] }
      ]
    },
    {
      title: 'ANÁLISIS INTERNO',
      columns: [
        { title: 'Criterios base', items: ['Cultura organizacional', 'Capacidades tecnológicas', 'Recursos disponibles'] },
        { title: 'Oportunidades', items: ['Recursos disponibles', 'Infraestructura'] }
      ]
    },
    {
      title: 'ANÁLISIS FODA',
      columns: [
        { title: 'Fortalezas', items: ['Debilidades'] },
        { title: 'Oportunidades', items: ['Amenazas'] }
      ]
    }
  ],
  chapterProgress: [
    { id: '4.2', label: 'Contexto', value: 60 },
    { id: '4.3', label: 'Alcance', value: 50 },
    { id: '4.4', label: 'Procesos', value: 40 }
  ],
  overallCompliance: 55,
  evidence: ['Registro de contexto', 'Matriz de partes interesadas', 'Documento de alcance', 'Mapa de procesos']
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  }[ext] || 'text/plain; charset=utf-8';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/context') {
    return sendJson(res, 200, store);
  }

  if (req.method === 'GET' && url.pathname === '/api/compliance') {
    return sendJson(res, 200, {
      standard: store.company.standard,
      chapter: store.company.chapter,
      completion: store.overallCompliance,
      sections: store.chapterProgress
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/context/analysis') {
    const { mode = 'draft' } = await collectBody(req);
    return sendJson(res, 200, {
      status: 'ok',
      mode,
      generatedAt: new Date().toISOString(),
      summary: `Se completó el análisis ${mode === 'continue' ? 'para avanzar al siguiente paso' : 'y se guardó como borrador'}.`,
      recommendations: [
        'Priorizar riesgos regulatorios con impacto alto.',
        'Actualizar la matriz FODA con indicadores cuantitativos.',
        'Validar alcance y procesos antes de la auditoría interna.'
      ]
    });
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^\.+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return sendFile(res, filePath);
  }

  return sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
