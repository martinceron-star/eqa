const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT) || 3000;

const demoUser = {
  email: 'usuario@empresa.com',
  password: 'ISO9001!'
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, file) => {
    if (error) {
      sendJson(res, 404, { ok: false, message: 'Archivo no encontrado.' });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
  });
}

function handleLogin(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) {
      req.socket.destroy();
    }
  });

  req.on('end', () => {
    try {
      const { email = '', password = '' } = JSON.parse(body || '{}');
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        sendJson(res, 400, {
          ok: false,
          message: 'Debes ingresar correo electrónico y contraseña.'
        });
        return;
      }

      if (normalizedEmail !== demoUser.email || password !== demoUser.password) {
        sendJson(res, 401, {
          ok: false,
          message: 'Credenciales inválidas. Usa la cuenta demo indicada debajo del formulario.'
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        message: 'Inicio de sesión exitoso.',
        user: {
          name: 'Administrador ISO',
          email: demoUser.email,
          role: 'Responsable del Sistema de Gestión'
        }
      });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        message: 'No se pudo procesar la solicitud.'
      });
    }
  });
}

function requestHandler(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && requestUrl.pathname === '/api/login') {
    handleLogin(req, res);
    return;
  }

  if (req.method === 'GET') {
    const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      sendJson(res, 403, { ok: false, message: 'Acceso denegado.' });
      return;
    }

    serveStaticFile(res, filePath);
    return;
  }

  sendJson(res, 405, { ok: false, message: 'Método no permitido.' });
}

if (require.main === module) {
  http.createServer(requestHandler).listen(port, () => {
    console.log(`Servidor disponible en http://localhost:${port}`);
  });
}

module.exports = {
  requestHandler,
  demoUser
};
