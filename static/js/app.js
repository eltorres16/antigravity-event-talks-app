document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshSpinner = document.getElementById('refresh-spinner');
  const searchInput = document.getElementById('search-input');
  const filterTags = document.querySelectorAll('.filter-tag');
  const timelineContainer = document.getElementById('timeline-container');
  const composerPlaceholder = document.getElementById('composer-placeholder');
  const composerForm = document.getElementById('composer-form');
  const tweetTextarea = document.getElementById('tweet-textarea');
  const charCounter = document.getElementById('char-counter');
  const tweetBtn = document.getElementById('tweet-btn');
  const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
  
  // Theme & Export Elements
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeText = document.getElementById('theme-text');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  // State
  let releases = [];
  let filteredReleases = [];
  let selectedUpdateId = null;
  let activeFilter = 'all';
  let searchQuery = '';

  // Initialize Theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeIconMoon.style.display = 'inline';
    themeIconSun.style.display = 'none';
    themeText.textContent = 'Oscuro';
  } else {
    document.body.classList.remove('light-theme');
    themeIconMoon.style.display = 'none';
    themeIconSun.style.display = 'inline';
    themeText.textContent = 'Claro';
  }

  // Initialize
  fetchReleases();

  // Event Listeners
  refreshBtn.addEventListener('click', fetchReleases);
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    filterAndRender();
  });

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      activeFilter = tag.dataset.filter.toLowerCase();
      filterAndRender();
    });
  });

  tweetTextarea.addEventListener('input', () => {
    updateCharCounter();
  });

  // Theme Toggle Listener
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    if (isLight) {
      themeIconMoon.style.display = 'inline';
      themeIconSun.style.display = 'none';
      themeText.textContent = 'Oscuro';
    } else {
      themeIconMoon.style.display = 'none';
      themeIconSun.style.display = 'inline';
      themeText.textContent = 'Claro';
    }
  });

  // Export to CSV Listener
  exportCsvBtn.addEventListener('click', exportToCSV);

  tweetBtn.addEventListener('click', () => {
    const text = encodeURIComponent(tweetTextarea.value);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, '_blank');
  });

  cancelTweetBtn.addEventListener('click', () => {
    clearSelection();
  });

  // Fetch from Flask API
  async function fetchReleases() {
    try {
      setLoading(true);
      const response = await fetch('/api/releases');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      releases = await response.json();
      filterAndRender();
    } catch (error) {
      console.error("Error fetching release notes:", error);
      timelineContainer.innerHTML = `
        <div class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3>Failed to load release notes</h3>
          <p>Please try again later. Connection error or Google Cloud feed is down.</p>
        </div>
      `;
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    if (isLoading) {
      refreshBtn.disabled = true;
      refreshSpinner.classList.add('active');
      // Show skeleton loading if no items
      if (releases.length === 0) {
        renderSkeletons();
      }
    } else {
      refreshBtn.disabled = false;
      refreshSpinner.classList.remove('active');
    }
  }

  function renderSkeletons() {
    timelineContainer.innerHTML = `
      <div class="skeleton-timeline">
        <div class="skeleton-group">
          <div class="skeleton-date"></div>
          <div class="skeleton-card"></div>
        </div>
        <div class="skeleton-group">
          <div class="skeleton-date"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      </div>
    `;
  }

  // Filter and Search Logic
  function filterAndRender() {
    // 1. Filter by category
    let temp = [];
    releases.forEach(entry => {
      // Filter individual updates inside each entry
      const matchedUpdates = entry.updates.filter(update => {
        const catMatch = activeFilter === 'all' || update.category.toLowerCase() === activeFilter;
        const textMatch = !searchQuery || 
                          update.category.toLowerCase().includes(searchQuery) ||
                          update.description_text.toLowerCase().includes(searchQuery) ||
                          entry.date.toLowerCase().includes(searchQuery);
        return catMatch && textMatch;
      });

      if (matchedUpdates.length > 0) {
        temp.push({
          ...entry,
          updates: matchedUpdates
        });
      }
    });

    filteredReleases = temp;
    renderTimeline();
  }

  // Render Timeline DOM
  function renderTimeline() {
    if (filteredReleases.length === 0) {
      timelineContainer.innerHTML = `
        <div class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3>No release notes found</h3>
          <p>Try adjusting your filters or search keywords.</p>
        </div>
      `;
      return;
    }

    timelineContainer.innerHTML = '';
    const timeline = document.createElement('div');
    timeline.className = 'timeline';

    filteredReleases.forEach(entry => {
      const group = document.createElement('div');
      group.className = 'timeline-group';

      const dot = document.createElement('div');
      dot.className = 'timeline-dot';
      group.appendChild(dot);

      const header = document.createElement('div');
      header.className = 'date-header';
      header.innerHTML = `${entry.date}`;
      group.appendChild(header);

      const list = document.createElement('div');
      list.className = 'updates-list';

      entry.updates.forEach((update, index) => {
        const updateId = `${entry.id}-${index}`;
        const card = document.createElement('div');
        card.className = `update-card ${selectedUpdateId === updateId ? 'selected' : ''}`;
        card.dataset.id = updateId;

        // Badge Class
        const badgeClass = `badge-${update.category.toLowerCase().replace(/\s+/g, '-')}`;

        card.innerHTML = `
          <div class="card-select-container">
            <div class="card-checkbox">
              <svg viewBox="0 0 24 24">
                <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="card-content">
            <div class="card-header">
              <span class="badge ${badgeClass}">${update.category}</span>
              <div class="card-actions">
                <button class="card-action-btn copy-btn" title="Copiar descripción al portapapeles">
                  <svg class="copy-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h10m-5-5l5 5m-5 5l5-5"/>
                  </svg>
                  <svg class="check-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="display: none; stroke: var(--success);">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
                <a href="${entry.link}" target="_blank" class="card-link" title="Open official release notes page">
                  Docs
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>
            <div class="card-body">
              ${update.description_html}
            </div>
          </div>
        `;

        // Bind copy button listener
        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid selecting the card for tweeting
          copyToClipboard(update.description_text, copyBtn);
        });

        card.addEventListener('click', (e) => {
          // If clicked a link inside the card body, don't trigger selection
          if (e.target.tagName === 'A' || e.target.closest('a')) {
            return;
          }
          selectUpdate(updateId, entry, update);
        });

        list.appendChild(card);
      });

      group.appendChild(list);
      timeline.appendChild(group);
    });

    timelineContainer.appendChild(timeline);
  }

  // Selection & Tweet Composer
  function selectUpdate(id, entry, update) {
    if (selectedUpdateId === id) {
      // Toggle off if clicking the same card
      clearSelection();
      return;
    }

    selectedUpdateId = id;
    
    // Update active visual class on all cards
    document.querySelectorAll('.update-card').forEach(card => {
      if (card.dataset.id === id) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    // Generate Tweet Template
    const cleanText = cleanTextForTweet(update.description_text);
    const shortText = truncateText(cleanText, 180);
    const tweetContent = `📢 BigQuery (${entry.date}) | #${update.category}\n\n"${shortText}"\n\nRead details: ${entry.link}\n#BigQuery #GoogleCloud`;

    // Populate Composer
    tweetTextarea.value = tweetContent;
    
    // Show Composer
    composerPlaceholder.style.display = 'none';
    composerForm.classList.add('active');

    updateCharCounter();
  }

  function clearSelection() {
    selectedUpdateId = null;
    document.querySelectorAll('.update-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Hide Composer
    composerForm.classList.remove('active');
    composerPlaceholder.style.display = 'flex';
  }

  // Utilities
  function cleanTextForTweet(text) {
    // Replace multiple spaces and newlines
    let clean = text.replace(/\s+/g, ' ').trim();
    // Strip trailing or leading spaces or leftover HTML tags just in case
    clean = clean.replace(/<[^>]*>?/gm, '');
    return clean;
  }

  function truncateText(text, limit) {
    if (text.length <= limit) return text;
    return text.substring(0, limit - 3) + '...';
  }

  function updateCharCounter() {
    const text = tweetTextarea.value;
    
    // Twitter URL count rule: Twitter counts any URL as 23 characters.
    // Let's find URLs in the text and adjust character counting to match Twitter's behavior.
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    let calculatedLength = text.length;
    urls.forEach(url => {
      calculatedLength = calculatedLength - url.length + 23;
    });

    const charsLeft = 280 - calculatedLength;
    charCounter.textContent = `${calculatedLength} / 280`;

    // Counter style based on remaining character threshold
    charCounter.className = 'char-counter';
    if (charsLeft < 0) {
      charCounter.classList.add('danger');
      tweetBtn.disabled = true;
    } else if (charsLeft <= 20) {
      charCounter.classList.add('warning');
      tweetBtn.disabled = false;
    } else {
      tweetBtn.disabled = false;
    }
  }

  // Copy to Clipboard Utility
  function copyToClipboard(text, buttonElement) {
    const copyIcon = buttonElement.querySelector('.copy-icon');
    const checkIcon = buttonElement.querySelector('.check-icon');
    
    navigator.clipboard.writeText(text).then(() => {
      // Show checkmark
      copyIcon.style.display = 'none';
      checkIcon.style.display = 'inline';
      
      // Reset back after 1.5s
      setTimeout(() => {
        checkIcon.style.display = 'none';
        copyIcon.style.display = 'inline';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  // Export to CSV Utility
  function exportToCSV() {
    if (filteredReleases.length === 0) {
      alert("No hay notas de lanzamiento para exportar.");
      return;
    }
    
    // Header Row
    let csvRows = [['Date', 'Category', 'Description', 'Link']];
    
    filteredReleases.forEach(entry => {
      entry.updates.forEach(update => {
        // Escape quotes
        const cleanDesc = update.description_text.replace(/"/g, '""');
        csvRows.push([
          `"${entry.date}"`,
          `"${update.category}"`,
          `"${cleanDesc}"`,
          `"${entry.link}"`
        ]);
      });
    });
    
    const csvString = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bigquery_release_notes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
