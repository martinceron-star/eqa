async function loadDashboard() {
  const response = await fetch('/api/dashboard');
  const data = await response.json();

  document.getElementById('user-name').textContent = data.user.name;
  document.getElementById('user-role').textContent = data.user.role;
  document.getElementById('page-title').textContent = data.summary.title;
  document.getElementById('page-subtitle').textContent = data.summary.subtitle;
  document.getElementById('context-title').textContent = data.context.title;
  document.getElementById('compliance').textContent = `${data.summary.compliance}%`;

  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = data.sideNav
    .map(
      (section, sectionIndex) => `
        <section class="nav__section">
          <div class="nav__title">${section.section}</div>
          ${section.items
            .map(
              (item, itemIndex) => `
                <div class="nav__item ${sectionIndex === 0 && itemIndex === 0 ? 'nav__item--active' : ''}">
                  ${item}
                </div>
              `
            )
            .join('')}
        </section>
      `
    )
    .join('');

  const chapters = document.getElementById('chapters');
  chapters.innerHTML = data.context.chapters
    .map(
      (chapter) => `
        <article class="chapter__row">
          <div class="chapter__meta">
            <span>${chapter.name}</span>
            <span>${chapter.progress}%</span>
          </div>
          <div class="progress">
            <div class="progress__bar" style="width: ${chapter.progress}%; background: ${chapter.color};"></div>
          </div>
        </article>
      `
    )
    .join('');

  const evidenceList = document.getElementById('evidence-list');
  evidenceList.innerHTML = data.requiredEvidence.map((item) => `<li>${item}</li>`).join('');
}

loadDashboard().catch((error) => {
  console.error('No se pudo cargar el dashboard', error);
});
