// ---- GitHub Scanner ----
const ghForm = document.getElementById('gh-form');
const ghUsername = document.getElementById('gh-username');
const ghError = document.getElementById('gh-error');
const ghResults = document.getElementById('gh-results');

const els = {
  avatar:  document.getElementById('gh-avatar'),
  name:    document.getElementById('gh-name'),
  login:   document.getElementById('gh-login'),
  bio:     document.getElementById('gh-bio'),
  url:     document.getElementById('gh-url'),
  repos:   document.getElementById('gh-repos'),
  followers: document.getElementById('gh-followers'),
  following: document.getElementById('gh-following'),
  stars:   document.getElementById('gh-stars'),
  forks:   document.getElementById('gh-forks'),
  langs:   document.getElementById('gh-langs'),
  topRepos:document.getElementById('gh-top-repos'),
};

ghForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ghError.hidden = true;
  ghResults.hidden = true;

  const user = ghUsername.value.trim();
  if(!user) return;

  try {
    // Profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
    if(!userRes.ok) throw new Error('User not found');
    const u = await userRes.json();

    // Repos (up to 100)
    const repoRes = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`);
    const repos = repoRes.ok ? await repoRes.json() : [];

    // Aggregate
    const totals = repos.reduce((acc, r) => {
      acc.stars += r.stargazers_count||0;
      acc.forks += r.forks_count||0;
      const lang = r.language || 'Other';
      acc.langs[lang] = (acc.langs[lang]||0) + 1;
      return acc;
    }, {stars:0, forks:0, langs:{} });

    const topLangs = Object.entries(totals.langs)
      .sort((a,b)=>b[1]-a[1]).slice(0,6);

    const topRepos = [...repos]
      .sort((a,b)=>b.stargazers_count - a.stargazers_count)
      .slice(0,6);

    // Fill UI
    els.avatar.src = u.avatar_url;
    els.name.textContent = u.name || '—';
    els.login.textContent = '@' + (u.login||user);
    els.bio.textContent = u.bio || '';
    els.url.href = u.html_url; els.url.textContent = 'View on GitHub →';
    els.repos.textContent = u.public_repos ?? repos.length;
    els.followers.textContent = u.followers ?? 0;
    els.following.textContent = u.following ?? 0;
    els.stars.textContent = totals.stars;
    els.forks.textContent = totals.forks;

    els.langs.innerHTML = topLangs.length
      ? topLangs.map(([lang,count])=>`<li>${lang}: <b>${count}</b> repo(s)</li>`).join('')
      : '<li>No languages detected</li>';

    els.topRepos.innerHTML = topRepos.length
      ? topRepos.map(r=>`
          <li>
            <a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a>
            — ⭐ ${r.stargazers_count} • 🍴 ${r.forks_count} • ${r.language||'Other'}
          </li>
        `).join('')
      : '<li>No public repos</li>';

    ghResults.hidden = false;
  } catch (err) {
    ghError.textContent = err.message || 'Something went wrong';
    ghError.hidden = false;
  }
});

// ---- LinkedIn Preview (no scraping; just validate & format) ----
const liForm = document.getElementById('li-form');
const liUrlInput = document.getElementById('li-url');
const liError = document.getElementById('li-error');
const liResults = document.getElementById('li-results');
const liHandle = document.getElementById('li-handle');
const liLink = document.getElementById('li-link');
const copyBtn = document.getElementById('copy-link');

liForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  liError.hidden = true;
  liResults.hidden = true;

  const url = liUrlInput.value.trim();
  try{
    const u = new URL(url);
    if (!/linkedin\.com$/i.test(u.hostname) && !/linkedin\.com$/i.test(u.hostname.replace(/^www\./,''))) {
      throw new Error('Please enter a valid linkedin.com URL');
    }
    // extract handle if possible
    // e.g. /in/krishna-patel-8329b72a4/
    let handle = u.pathname.replace(/\/+$/,''); // trim trailing slash
    handle = handle || '/';
    liHandle.textContent = handle;
    liLink.href = u.toString();
    liResults.hidden = false;
  }catch(err){
    liError.textContent = err.message || 'Invalid URL';
    liError.hidden = false;
  }
});

copyBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(liLink.href);
    copyBtn.textContent = 'Copied!';
    setTimeout(()=>copyBtn.textContent='Copy Link',1200);
  }catch{
    copyBtn.textContent = 'Copy failed';
    setTimeout(()=>copyBtn.textContent='Copy Link',1200);
  }
});
