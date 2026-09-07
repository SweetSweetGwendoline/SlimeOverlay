const getElement = (id) => document.getElementById(id);

const SECTIONS = {
    outfits: 'Outfits',
    cards: 'Cards',
    achievements: 'Achievements',
    commands: 'Commands',
};

const PLACEHOLDER_DESCRIPTIONS = {
    achievements: 'Achievement details will live here once they’re available.',
    commands: 'The command reference is on its way.',
};

function navigate() {
    const requestedSection = location.hash.slice(1);
    const section = Object.hasOwn(SECTIONS, requestedSection) ? requestedSection : 'outfits';
    const title = SECTIONS[section];
    document.title = `${title} · Slime Overlay Wiki`;
    getElement('breadcrumb').hidden = false;
    getElement('section-intro').hidden = false;
    getElement('crumb').textContent = title;
    getElement('page-title').textContent = title;
    getElement('outfits').hidden = section !== 'outfits';
    getElement('cards').hidden = section !== 'cards';
    getElement('placeholder').hidden = !Object.hasOwn(PLACEHOLDER_DESCRIPTIONS, section);
    getElement('placeholder-description').textContent = PLACEHOLDER_DESCRIPTIONS[section] ?? '';
    document.querySelectorAll('[data-section]').forEach(link => {
        if (link.dataset.section === section) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

window.addEventListener('hashchange', navigate);
navigate();
