const form = document.getElementById('organization-form');
const countrySelect = document.getElementById('country');
const industrySelect = document.getElementById('industry');
const employeeSelect = document.getElementById('employees');
const processList = document.getElementById('process-list');
const processSearch = document.getElementById('process-search');
const message = document.getElementById('message');
const organizationsList = document.getElementById('organizations-list');
const refreshBtn = document.getElementById('refresh-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const selectedFlag = document.getElementById('selected-flag');
const selectedCountryLabel = document.getElementById('selected-country-label');

let processes = [];
const selectedProcesses = new Set();

function createOption(label, value = '') {
  const option = document.createElement('option');
  option.textContent = label;
  option.value = value || label;
  return option;
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function renderProcesses(filter = '') {
  processList.innerHTML = '';
  const normalized = filter.trim().toLowerCase();
  processes
    .filter((process) => process.toLowerCase().includes(normalized))
    .forEach((process) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `process-chip ${selectedProcesses.has(process) ? 'active' : ''}`.trim();
      button.textContent = process;
      button.addEventListener('click', () => {
        if (selectedProcesses.has(process)) {
          selectedProcesses.delete(process);
        } else {
          selectedProcesses.add(process);
        }
        renderProcesses(processSearch.value);
      });
      processList.appendChild(button);
    });
}

async function loadCatalog() {
  const response = await fetch('/api/catalog');
  const catalog = await response.json();

  countrySelect.innerHTML = '';
  industrySelect.innerHTML = '';
  employeeSelect.innerHTML = '';

  countrySelect.appendChild(createOption('- Selecciona un país -', ''));
  industrySelect.appendChild(createOption('- Selecciona una industria -', ''));
  employeeSelect.appendChild(createOption('- Selecciona -', ''));

  catalog.countries.forEach((country) => {
    const option = createOption(`${country.flag} ${country.name}`, country.code);
    option.dataset.flag = country.flag;
    option.dataset.name = country.name;
    countrySelect.appendChild(option);
  });

  catalog.industries.forEach((industry) => {
    industrySelect.appendChild(createOption(industry));
  });

  catalog.employeeRanges.forEach((range) => {
    employeeSelect.appendChild(createOption(range));
  });

  processes = catalog.processes;
  renderProcesses();
}

async function loadOrganizations() {
  const response = await fetch('/api/organizations');
  const organizations = await response.json();

  organizationsList.innerHTML = organizations.length
    ? ''
    : '<p class="empty">Aún no hay organizaciones registradas.</p>';

  organizations
    .slice()
    .reverse()
    .forEach((organization) => {
      const article = document.createElement('article');
      article.className = 'saved-item';
      article.innerHTML = `
        <h3>${organization.companyName}</h3>
        <p><strong>País:</strong> ${organization.country}</p>
        <p><strong>Industria:</strong> ${organization.industry}</p>
        <p><strong>Empleados:</strong> ${organization.employees}</p>
        <p><strong>Procesos:</strong> ${organization.selectedProcesses.join(', ') || 'Sin procesos seleccionados'}</p>
      `;
      organizationsList.appendChild(article);
    });
}

countrySelect.addEventListener('change', () => {
  const selectedOption = countrySelect.selectedOptions[0];
  selectedFlag.textContent = selectedOption?.dataset.flag || '🌎';
  selectedCountryLabel.textContent = selectedOption?.dataset.name || 'Selecciona un país';
});

processSearch.addEventListener('input', (event) => {
  renderProcesses(event.target.value);
});

refreshBtn.addEventListener('click', () => {
  loadOrganizations().catch(() => setMessage('No se pudo actualizar la lista.', 'error'));
});

analyzeBtn.addEventListener('click', () => {
  const companyName = document.getElementById('companyName').value.trim();
  const industry = industrySelect.value;
  const employees = employeeSelect.value;

  const recommendation = companyName
    ? `IA: ${companyName} en ${industry || 'tu sector'} con ${employees || 'un tamaño por definir'} debería priorizar contexto, riesgos y control documental.`
    : 'IA: completa el nombre de la empresa para generar una recomendación más útil.';

  setMessage(recommendation, 'success');
});

form.addEventListener('reset', () => {
  selectedProcesses.clear();
  window.setTimeout(() => {
    renderProcesses();
    selectedFlag.textContent = '🇲🇽';
    selectedCountryLabel.textContent = 'México';
    setMessage('Formulario limpiado.', 'success');
  }, 0);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('Guardando organización...');

  const payload = {
    companyName: form.companyName.value,
    country: countrySelect.selectedOptions[0]?.dataset.name || countrySelect.value,
    industry: form.industry.value,
    employees: form.employees.value,
    selectedProcesses: Array.from(selectedProcesses)
  };

  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || 'No fue posible guardar la organización.', 'error');
    return;
  }

  setMessage(data.message, 'success');
  form.reset();
  await loadOrganizations();
});

Promise.all([loadCatalog(), loadOrganizations()]).catch(() => {
  setMessage('Error cargando la aplicación.', 'error');
});
