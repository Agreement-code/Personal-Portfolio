/* ══════════════════════════════════════════════════════
   SUPABASE CLIENT
═══════════════════════════════════════════════════════ */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Populated after fetch — used by the modal
let projectsBySlug = {};
let certsBySlug = {};

const PLACEHOLDER_IMG = 'img-placeholder.svg';

/* ══════════════════════════════════════════════════════
   SECURITY HELPERS
   Every value that comes from Supabase is treated as
   untrusted — it's editable by anyone with dashboard
   access, and could contain HTML/JS by accident or design.
   escapeHtml() neutralises it before it's ever inserted
   via innerHTML, so it can't break out into a tag or
   attribute. isSafeUrl() blocks javascript:/data: links
   so a malicious URL in a "github" or "verify" field can't
   execute script when clicked.
═══════════════════════════════════════════════════════ */
function escapeHtml(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeUrl(url) {
  if (!url) return false;
  try {
    // Relative paths (e.g. assets/certs/ibm.jpg) are always fine.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return true;
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

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
      <h3>${escapeHtml(s.category)}</h3>
      <p>${escapeHtml(s.items)}</p>
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
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(x.description)}</p>
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
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(x.description)}</p>
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
      <p class="venture-tag">${escapeHtml(v.tag)}</p>
      <h3>${escapeHtml(v.title)}</h3>
      <p>${escapeHtml(v.description)}</p>
    </article>
  `).join('');
}

/* ══════════════════════════════════════════════════════
   RENDER: TESTIMONIALS — featured card + carousel + mini grid
═══════════════════════════════════════════════════════ */
let testimonialsData = [];
let currentTestiIndex = 0;

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0] || '').join('');
  return initials.toUpperCase() || '?';
}

function renderFeaturedTestimonial(index) {
  const featured = document.getElementById('testimonialFeatured');
  const t = testimonialsData[index];
  if (!t) return;

  const initials = getInitials(t.name);
  const color = t.avatar_color || '#64d9ff';
  const roleLine = [t.role, t.company].filter(Boolean).join(' — ');

  featured.innerHTML = `
    <div class="featured-quote-icon">"</div>
    <p class="featured-quote-text">${escapeHtml(t.quote)}</p>
    <div class="featured-author">
      <div class="avatar-badge" style="background:${escapeHtml(color)}">${escapeHtml(initials)}</div>
      <div class="featured-author-text">
        <p class="featured-author-name">${escapeHtml(t.name)}</p>
        <p class="featured-author-role">${escapeHtml(roleLine)}</p>
      </div>
    </div>
  `;

  // Dots
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Mini cards
  document.querySelectorAll('.testimonial-mini-card').forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });
}

function goToTestimonial(index) {
  const len = testimonialsData.length;
  if (!len) return;
  currentTestiIndex = ((index % len) + len) % len;
  renderFeaturedTestimonial(currentTestiIndex);
}

function renderTestimonials(rows) {
  const featured = document.getElementById('testimonialFeatured');
  const grid = document.getElementById('testimonialsGrid');
  const dotsWrap = document.getElementById('testiDots');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');

  testimonialsData = rows || [];

  if (!testimonialsData.length) {
    featured.innerHTML = '<p>No testimonials added yet.</p>';
    grid.innerHTML = '';
    dotsWrap.innerHTML = '';
    return;
  }

  // Dots
  dotsWrap.innerHTML = testimonialsData.map((_, i) =>
    `<button class="carousel-dot" data-index="${i}" aria-label="Go to testimonial ${i + 1}"></button>`
  ).join('');
  dotsWrap.querySelectorAll('.carousel-dot').forEach((dot) => {
    dot.addEventListener('click', () => goToTestimonial(Number(dot.dataset.index)));
  });

  prevBtn.onclick = () => goToTestimonial(currentTestiIndex - 1);
  nextBtn.onclick = () => goToTestimonial(currentTestiIndex + 1);

  // Mini grid — click promotes a testimonial to featured
  grid.innerHTML = testimonialsData.map((t, i) => {
    const initials = getInitials(t.name);
    const color = t.avatar_color || '#64d9ff';
    const roleLine = [t.role, t.company].filter(Boolean).join(' — ');
    return `
      <article class="testimonial-mini-card" data-index="${i}" tabindex="0" role="button" aria-label="View ${escapeHtml(t.name)}'s testimonial">
        <div class="avatar-badge" style="background:${escapeHtml(color)}">${escapeHtml(initials)}</div>
        <div>
          <p class="mini-quote">"${escapeHtml(t.quote)}"</p>
          <p class="mini-name">${escapeHtml(t.name)}</p>
          <p class="mini-role">${escapeHtml(roleLine)}</p>
        </div>
      </article>
    `;
  }).join('');
  grid.querySelectorAll('.testimonial-mini-card').forEach((card) => {
    const i = Number(card.dataset.index);
    card.addEventListener('click', () => goToTestimonial(i));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToTestimonial(i); }
    });
  });

  goToTestimonial(0);
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
    const yearLine = c.year
      ? `<p><strong>Year:</strong> ${escapeHtml(c.year)}${c.extra_note ? ' · ' + escapeHtml(c.extra_note) : ''}</p>`
      : '';
    const safeImage = isSafeUrl(c.image) ? c.image : PLACEHOLDER_IMG;
    return withFallback(`
    <article class="card cert-card" data-cert="${escapeHtml(c.slug)}" tabindex="0" role="button" aria-label="View ${escapeHtml(c.title)}">
      <div class="card-img"><img src="${escapeHtml(safeImage)}" alt="${escapeHtml(c.title)}"></div>
      <h3>${escapeHtml(c.title)}</h3>
      <p><strong>Issuer:</strong> ${escapeHtml(c.issuer)} <span class="cert-badge ${badgeClass}">${badgeLabel}</span></p>
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

  grid.innerHTML = rows.map((p) => {
    const safeImage = isSafeUrl(p.image) ? p.image : PLACEHOLDER_IMG;
    return withFallback(`
    <article class="project-card" data-gcat="${escapeHtml(p.category)}" data-project="${escapeHtml(p.slug)}" tabindex="0" role="button" aria-label="View ${escapeHtml(p.title)} details">
      <div class="card-img"><img src="${escapeHtml(safeImage)}" alt="${escapeHtml(p.title)}"></div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <p class="card-hint">Click for details →</p>
    </article>
  `);
  }).join('');

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

  // textContent everywhere below — never innerHTML — so nothing here
  // needs escaping; the browser treats it as plain text automatically.
  img.src = isSafeUrl(data.image) ? data.image : PLACEHOLDER_IMG;
  img.onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; };
  img.alt = data.title || '';
  title.textContent = data.title || '';
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
    if (data.github && isSafeUrl(data.github)) {
      const a = document.createElement('a');
      a.href = data.github;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn modal-btn';
      a.textContent = 'View on GitHub';
      linksWrap.appendChild(a);
    }
  } else {
    const statusLabel = data.status === 'completed' ? 'Completed' : 'In Progress';
    meta.textContent = [data.issuer, statusLabel, data.year].filter(Boolean).join(' · ');
    desc.textContent = data.description || '';
    if (data.cert_url && isSafeUrl(data.cert_url)) {
      const a = document.createElement('a');
      a.href = data.cert_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn modal-btn';
      a.textContent = 'View Certificate';
      linksWrap.appendChild(a);
    }
    if (data.verify_url && isSafeUrl(data.verify_url)) {
      const a2 = document.createElement('a');
      a2.href = data.verify_url;
      a2.target = '_blank';
      a2.rel = 'noopener noreferrer';
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
      setupCardDots('galleryGrid');
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
/* ══════════════════════════════════════════════════════
   SWIPE-PROGRESS DOTS (Skills, Experience, Certifications,
   Ventures, Gallery, Leadership). Builds a dot per visible
   card, tracks which one is centered while swiping via
   IntersectionObserver, and lets tapping a dot jump there.
   Safe to call again (e.g. after Gallery's filter changes)
   — it rebuilds from scratch each time.
═══════════════════════════════════════════════════════ */
const cardDotObservers = {};

function setupCardDots(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  let dotsWrap = document.getElementById(gridId + 'Dots');
  if (!dotsWrap) {
    dotsWrap = document.createElement('div');
    dotsWrap.id = gridId + 'Dots';
    dotsWrap.className = 'swipe-dots';
    grid.insertAdjacentElement('afterend', dotsWrap);
  }

  if (cardDotObservers[gridId]) {
    cardDotObservers[gridId].disconnect();
  }

  const cards = Array.from(grid.children).filter((c) => !c.classList.contains('hidden'));

  if (cards.length <= 1) {
    dotsWrap.innerHTML = '';
    return;
  }

  dotsWrap.innerHTML = cards.map((_, i) =>
    `<button class="carousel-dot" data-i="${i}" aria-label="Go to card ${i + 1}"></button>`
  ).join('');
  const dots = Array.from(dotsWrap.children);
  dots[0].classList.add('active');

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = cards.indexOf(entry.target);
        if (idx !== -1) {
          dots.forEach((d) => d.classList.remove('active'));
          dots[idx].classList.add('active');
        }
      }
    });
  }, { root: grid, threshold: 0.6 });

  cards.forEach((c) => observer.observe(c));
  cardDotObservers[gridId] = observer;
}

function setupAllCardDots() {
  ['skillsGrid', 'experienceGrid', 'certGrid', 'venturesGrid', 'galleryGrid', 'leadershipGrid']
    .forEach(setupCardDots);
}

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

    setupAllCardDots();
  } catch (err) {
    console.error('Failed to load content from Supabase:', err);
    document.querySelectorAll('.data-grid').forEach((g) => {
      g.innerHTML = '<p style="color:#ff8080;">Could not load content. Check your SUPABASE_URL and SUPABASE_ANON_KEY in config.js, and confirm supabase-schema.sql has been run in your Supabase project.</p>';
    });
  }
}

document.addEventListener('DOMContentLoaded', init);