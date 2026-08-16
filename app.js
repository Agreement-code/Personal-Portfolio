/* ══════════════════════════════════════════════════════
   SUPABASE CLIENT
═══════════════════════════════════════════════════════ */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Populated after fetch — used by the modal
let projectsBySlug = {};
let certsBySlug = {};

const PLACEHOLDER_IMG = 'assets/img-placeholder.svg';

function withFallback(imgTag) {
  return imgTag.replace('<img ', `<img onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'" `);
}

/* ══════════════════════════════════════════════════════
   RENDER: SKILLS
═══════════════════════════════════════════════════════ */
function renderSkills(rows) {
  const grid = document.getElementById('skillsGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No skills added yet.</p>'; return; }
  grid.innerHTML = rows.map((s) => `
    <article class="card">
      <h3>${s.category}</h3>
      <p>${s.items || ''}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: EXPERIENCE
═══════════════════════════════════════════════════════ */
function renderExperience(rows) {
  const grid = document.getElementById('experienceGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No experience added yet.</p>'; return; }
  grid.innerHTML = rows.map((x) => `
    <article class="card">
      <h3>${x.title}</h3>
      <p>${x.description || ''}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: LEADERSHIP
═══════════════════════════════════════════════════════ */
function renderLeadership(rows) {
  const grid = document.getElementById('leadershipGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>Nothing added yet.</p>'; return; }
  grid.innerHTML = rows.map((x) => `
    <article class="card">
      <h3>${x.title}</h3>
      <p>${x.description || ''}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: VENTURES
═══════════════════════════════════════════════════════ */
function renderVentures(rows) {
  const grid = document.getElementById('venturesGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No ventures added yet.</p>'; return; }
  grid.innerHTML = rows.map((v) => `
    <article class="card venture-card">
      <p class="venture-tag">${v.tag || ''}</p>
      <h3>${v.title}</h3>
      <p>${v.description || ''}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: TESTIMONIALS
═══════════════════════════════════════════════════════ */
function renderTestimonials(rows) {
  const grid = document.getElementById('testimonialsGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No testimonials added yet.</p>'; return; }
  grid.innerHTML = rows.map((t) => `
    <article class="card testimonial-card">
      <p class="t-quote">"${t.quote}"</p>
      <p class="t-name">${t.name || ''}</p>
      <p class="t-role">${t.role || ''}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: CERTIFICATIONS (clickable, with images)
═══════════════════════════════════════════════════════ */
function renderCertifications(rows) {
  const grid = document.getElementById('certGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No certifications added yet.</p>'; return; }

  certsBySlug = {};
  rows.forEach((c) => { certsBySlug[c.slug] = c; });

  grid.innerHTML = rows.map((c) => {
    const badgeClass = c.status === 'completed' ? 'badge-done' : 'badge-progress';
    const badgeLabel = c.status === 'completed' ? 'Completed' : 'In Progress';
    const yearLine = c.year ? `<p><strong>Year:</strong> ${c.year}${c.extra_note ? ' · ' + c.extra_note : ''}</p>` : '';
    return withFallback(`
    <article class="card cert-card" data-cert="${c.slug}" tabindex="0" role="button" aria-label="View ${c.title}">
      <div class="card-img"><img src="${c.image || PLACEHOLDER_IMG}" alt="${c.title}"></div>
      <h3>${c.title}</h3>
      <p><strong>Issuer:</strong> ${c.issuer || ''} <span class="cert-badge ${badgeClass}">${badgeLabel}</span></p>
      ${yearLine}
      <p class="card-hint">Click to view certificate →</p>
    </article>
  `);
  }).join('');

  wireCertClicks();
}

/* ══════════════════════════════════════════════════════
   RENDER: GALLERY / PROJECTS (clickable, filterable, with images)
═══════════════════════════════════════════════════════ */
function renderProjects(rows) {
  const grid = document.getElementById('galleryGrid');
  if (!rows || !rows.length) { grid.innerHTML = '<p>No projects added yet.</p>'; return; }

  projectsBySlug = {};
  rows.forEach((p) => { projectsBySlug[p.slug] = p; });

  grid.innerHTML = rows.map((p) => withFallback(`
    <article class="project-card" data-gcat="${p.category}" data-project="${p.slug}" tabindex="0" role="button" aria-label="View ${p.title} details">
      <div class="card-img"><img src="${p.image || PLACEHOLDER_IMG}" alt="${p.title}"></div>
      <h3>${p.title}</h3>
      <p>${p.description || ''}</p>
      <p class="card-hint">Click for details →</p>
    </article>
  `)).join('');

  wireProjectClicks();
  wireFilters();
}

/* ══════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════ */
function openModal(kind, id) {
  const data = kind === 'project' ? projectsBySlug[id] : certsBySlug[id];
  if (!data) return;

  const overlay = document.getElementById('modalOverlay');
  const img = document.getElementById('modalImg');
  const meta = document.getElementById('modalMeta');
  const title = document.getElementById('modalTitle');
  const desc = document.getElementById('modalDesc');
  const stackWrap = document.getElementById('modalStack');
  const hlWrap = document.getElementById('modalHighlights');
  const linksWrap = document.getElementById('modalLinks');

  img.src = data.image || PLACEHOLDER_IMG;
  img.onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; };
  img.alt = data.title;
  title.textContent = data.title;
  stackWrap.innerHTML = '';
  hlWrap.innerHTML = '';
  linksWrap.innerHTML = '';

  if (kind === 'project') {
    meta.textContent = data.meta || '';
    desc.textContent = data.description || '';
    (data.stack || []).forEach((s) => {
      const span = document.createElement('span');
      span.className = 'stack-pill';
      span.textContent = s;
      stackWrap.appendChild(span);
    });
    (data.highlights || []).forEach((h) => {
      const li = document.createElement('li');
      li.textContent = h;
      hlWrap.appendChild(li);
    });
    if (data.github) {
      const a = document.createElement('a');
      a.href = data.github;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'btn modal-btn';
      a.textContent = 'View on GitHub';
      linksWrap.appendChild(a);
    }
  } else {
    const statusLabel = data.status === 'completed' ? 'Completed' : 'In Progress';
    meta.textContent = [data.issuer, statusLabel, data.year].filter(Boolean).join(' · ');
    desc.textContent = data.description || '';
    if (data.cert_url) {
      const a = document.createElement('a');
      a.href = data.cert_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'btn modal-btn';
      a.textContent = 'View Certificate';
      linksWrap.appendChild(a);
    }
    if (data.verify_url) {
      const a2 = document.createElement('a');
      a2.href = data.verify_url;
      a2.target = '_blank';
      a2.rel = 'noopener';
      a2.className = 'btn btn-outline modal-btn';
      a2.textContent = 'Verify with Issuer';
      linksWrap.appendChild(a2);
    }
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

function wireProjectClicks() {
  document.querySelectorAll('.project-card').forEach((card) => {
    const id = card.dataset.project;
    card.addEventListener('click', () => openModal('project', id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal('project', id); }
    });
  });
}

function wireCertClicks() {
  document.querySelectorAll('.cert-card').forEach((card) => {
    const id = card.dataset.cert;
    card.addEventListener('click', () => openModal('cert', id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal('cert', id); }
    });
  });
}

/* ══════════════════════════════════════════════════════
   GALLERY FILTERS (re-wired after every project render)
═══════════════════════════════════════════════════════ */
function wireFilters() {
  const filterButtons = document.querySelectorAll('#galleryFilters .filter-btn');
  const galleryCards = document.querySelectorAll('#galleryGrid .project-card');
  filterButtons.forEach((btn) => {
    btn.onclick = () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.gfilter;
      galleryCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.gcat === filter;
        card.classList.toggle('hidden', !show);
      });
    };
  });
}

/* ══════════════════════════════════════════════════════
   SIDEBAR NAV: mobile toggle + active link on scroll
═══════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
  const links = document.querySelectorAll('.nav-link[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (nav && nav.classList.contains('open')) nav.classList.remove('open');
    });
  });
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { threshold: 0.3 });
    sections.forEach((s) => navObserver.observe(s));
  }
}

/* ══════════════════════════════════════════════════════
   INIT: fetch everything from Supabase, then render
═══════════════════════════════════════════════════════ */
async function init() {
  initNav();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  try {
    const [skills, experience, certifications, ventures, projects, testimonials, leadership] = await Promise.all([
      supabaseClient.from('skills').select('*').order('sort_order'),
      supabaseClient.from('experience').select('*').order('sort_order'),
      supabaseClient.from('certifications').select('*').order('sort_order'),
      supabaseClient.from('ventures').select('*').order('sort_order'),
      supabaseClient.from('projects').select('*').order('sort_order'),
      supabaseClient.from('testimonials').select('*').order('sort_order'),
      supabaseClient.from('leadership').select('*').order('sort_order'),
    ]);

    if (skills.error) throw skills.error;
    renderSkills(skills.data);

    if (experience.error) throw experience.error;
    renderExperience(experience.data);

    if (certifications.error) throw certifications.error;
    renderCertifications(certifications.data);

    if (ventures.error) throw ventures.error;
    renderVentures(ventures.data);

    if (projects.error) throw projects.error;
    renderProjects(projects.data);

    if (testimonials.error) throw testimonials.error;
    renderTestimonials(testimonials.data);

    if (leadership.error) throw leadership.error;
    renderLeadership(leadership.data);
  } catch (err) {
    console.error('Failed to load content from Supabase:', err);
    document.querySelectorAll('.data-grid').forEach((g) => {
      g.innerHTML = '<p style="color:#ff8080;">Could not load content. Check your SUPABASE_URL and SUPABASE_ANON_KEY in config.js, and confirm supabase-schema.sql has been run in your Supabase project.</p>';
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
