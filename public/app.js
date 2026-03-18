const state = {
  toastTimer: null
};

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function renderNavigation(navigation) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';

  navigation.forEach((section, sectionIndex) => {
    const wrapper = createEl('section', 'nav-section');
    wrapper.appendChild(createEl('h3', '', section.title));

    section.items.forEach((item, itemIndex) => {
      const button = createEl('button', `nav-item${sectionIndex === 1 && itemIndex === 0 ? ' active' : ''}`);
      button.innerHTML = `<span>${sectionIndex === 1 ? '▣' : '•'}</span><span>${item}</span>`;
      wrapper.appendChild(button);
    });

    nav.appendChild(wrapper);
  });
}

function renderTabs(tabs) {
  const tabsContainer = document.getElementById('tabs');
  tabsContainer.innerHTML = '';

  tabs.forEach((tab, index) => {
    const pill = createEl('div', `tab-pill${index === 0 ? ' active' : ''}`, tab);
    tabsContainer.appendChild(pill);
  });
}

function renderSections(sections) {
  const container = document.getElementById('analysis-sections');
  container.innerHTML = '';

  sections.forEach((section) => {
    const block = createEl('section', 'analysis-block');
    block.appendChild(createEl('h2', '', section.title));

    const columns = createEl('div', 'analysis-columns');
    section.columns.forEach((column) => {
      const fieldGroup = createEl('div', 'field-group');
      fieldGroup.appendChild(createEl('h3', '', column.title));

      column.items.forEach((item, itemIndex) => {
        const row = createEl('div', 'metric-row');
        row.appendChild(createEl('span', '', item));
        const progress = createEl('div', 'progress');
        const bar = createEl('span');
        bar.style.width = `${Math.max(24, 42 + itemIndex * 12)}%`;
        progress.appendChild(bar);
        row.appendChild(progress);
        fieldGroup.appendChild(row);
      });

      columns.appendChild(fieldGroup);
    });

    block.appendChild(columns);
    container.appendChild(block);
  });
}

function renderCompliance(data) {
  document.getElementById('chapter-progress-label').textContent = `${data.completion}%`;
  document.getElementById('overall-compliance').textContent = `${data.completion}%`;
  document.getElementById('overall-progress-bar').style.width = `${data.completion}%`;

  const list = document.getElementById('chapter-progress-list');
  list.innerHTML = '';

  data.sections.forEach((section) => {
    const item = createEl('div', 'progress-item');
    const row = createEl('div', 'panel-title-row');
    row.appendChild(createEl('strong', '', `${section.id} ${section.label}`));
    row.appendChild(createEl('span', '', `${section.value}%`));
    item.appendChild(row);
    const progress = createEl('div', 'progress');
    const bar = createEl('span');
    bar.style.width = `${section.value}%`;
    progress.appendChild(bar);
    item.appendChild(progress);
    list.appendChild(item);
  });
}

function renderEvidence(items) {
  const evidenceList = document.getElementById('evidence-list');
  evidenceList.innerHTML = '';
  items.forEach((item) => evidenceList.appendChild(createEl('li', '', item)));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

async function triggerAnalysis(mode) {
  const response = await fetch('/api/context/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  const data = await response.json();
  showToast(`${data.summary} Recomendación clave: ${data.recommendations[0]}`);
}

async function init() {
  const [contextResponse, complianceResponse] = await Promise.all([
    fetch('/api/context'),
    fetch('/api/compliance')
  ]);

  const context = await contextResponse.json();
  const compliance = await complianceResponse.json();

  document.getElementById('company-name').textContent = context.company.name;
  document.getElementById('chapter-title').textContent = context.company.chapter;
  document.getElementById('user-name').textContent = context.company.user;
  document.getElementById('user-role').textContent = context.company.role;
  document.getElementById('topbar-user-name').textContent = context.company.user;
  document.getElementById('topbar-user-role').textContent = context.company.role;

  renderNavigation(context.navigation);
  renderTabs(context.tabs);
  renderSections(context.sections);
  renderCompliance(compliance);
  renderEvidence(context.evidence);

  document.getElementById('analyze-btn').addEventListener('click', () => triggerAnalysis('analysis'));
  document.getElementById('save-btn').addEventListener('click', () => triggerAnalysis('draft'));
  document.getElementById('continue-btn').addEventListener('click', () => triggerAnalysis('continue'));
}

init().catch((error) => {
  console.error(error);
  showToast('No fue posible cargar el tablero.');
});
