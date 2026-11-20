(() => {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const forecast = ['☀ 72°', '☁ 68°', '☀ 75°', '☂ 64°', '☀ 71°', '⛅ 69°', '☀ 73°'];
  const palette = ['', 'mint', 'lilac', 'peach'];

  const dateKey = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const mondayOf = date => {
    const d = new Date(date);
    const shift = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - shift);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const sameDay = (a, b) => dateKey(a) === dateKey(b);
  const niceDate = date => `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const baseMonday = mondayOf(new Date());

  let weekStart = new Date(baseMonday);
  let selectedDate = new Date();
  let view = 'week';

  const offsetKey = offset => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + offset);
    return dateKey(d);
  };

  let entries = [
    { date: offsetKey(0), outfit: 'Blue jeans & a white tee', event: 'Coffee with Maya' },
    { date: offsetKey(1), outfit: 'The soft blue sweater', event: 'Library study session' },
    { date: offsetKey(3), outfit: 'Linen shirt & sneakers', event: 'Walk by the water' },
    { date: offsetKey(5), outfit: 'Favorite weekend layers', event: 'Farmers market' }
  ];

  try {
    const savedEntries = localStorage.getItem('bluebell-outfits');
    if (savedEntries) entries = JSON.parse(savedEntries);
  } catch {
    // Keep the sample planner if browser storage is unavailable.
  }

  const grid = document.getElementById('calendarGrid');
  const weekdays = document.getElementById('weekdayRow');
  const heading = document.getElementById('week-heading');
  const range = document.getElementById('dateRange');
  const dialog = document.getElementById('outfitDialog');
  const entriesFor = date => entries.filter(item => item.date === dateKey(date));

  function render() {
    weekdays.innerHTML = DAYS.slice(1).concat(DAYS[0])
      .map(day => `<div>${day}</div>`).join('');

    const count = view === 'week' ? 7 : 42;
    let start;

    if (view === 'week') {
      start = new Date(weekStart);
    } else {
      start = mondayOf(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
    }

    if (view === 'week') {
      heading.textContent = 'This week';
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      range.textContent = `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}${
        start.getMonth() !== end.getMonth() ? ` ${MONTHS[end.getMonth()]}` : ''
      }, ${end.getFullYear()}`;
    } else {
      heading.textContent = MONTHS[weekStart.getMonth()];
      range.textContent = String(weekStart.getFullYear());
    }

    const today = new Date();
    const cells = [];

    for (let i = 0; i < count; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const items = entriesFor(date);
      const dayNum = date.getDay();
      const weather = forecast[(date.getDate() + dayNum) % forecast.length];
      const outside = view === 'month' && date.getMonth() !== weekStart.getMonth();

      const classes = [
        'day-cell',
        sameDay(date, selectedDate) ? 'selected' : '',
        sameDay(date, today) ? 'today' : '',
        outside ? 'outside-month' : ''
      ].filter(Boolean).join(' ');

      const pills = items.map((item, n) => {
        const photos = item.photos || (item.photo ? [item.photo] : []);
        const thumb = photos.slice(0, 1)
          .map(photo => `<img class="look-thumb" src="${photo}" alt="">`)
          .join('');

        return `<div class="look-pill ${palette[(date.getDate() + n) % palette.length]}">
          ${thumb}${escapeHtml(item.outfit)}${item.link ? ' <span aria-label="Has a clothing link">↗</span>' : ''}
        </div>${item.event ? `<span class="event-label">${escapeHtml(item.event)}</span>` : ''}`;
      }).join('');

      const hint = items.length ? '' : '<p class="empty-hint">＋ Plan a look</p>';

      cells.push(`
        <button type="button" class="${classes}" data-date="${dateKey(date)}"
          aria-label="${niceDate(date)}${items.length ? `, ${items.map(x => x.outfit).join(', ')}` : ', no outfit planned'}">
          <span class="day-top">
            <span class="day-number">${date.getDate()}</span>
            <span class="weather" aria-label="Sample forecast">${weather}</span>
          </span>
          ${pills}${hint}
        </button>
      `);
    }

    grid.innerHTML = cells.join('');
    grid.querySelectorAll('.day-cell').forEach(button => {
      button.addEventListener('click', () => {
        selectedDate = parseKey(button.dataset.date);
        render();
      });
    });

    renderDetail();
    renderDayOptions();
  }

  function renderDetail() {
    document.getElementById('selectedDateHeading').textContent = niceDate(selectedDate);

    const items = entriesFor(selectedDate);
    const outfit = items.length
      ? items.map(item => {
          const photos = item.photos || (item.photo ? [item.photo] : []);
          const photoMarkup = photos.length
            ? `<div class="detail-photos">${photos.map((photo, index) =>
                `<img class="detail-photo" src="${photo}" alt="${escapeHtml(item.outfit)} photo ${index + 1}">`
              ).join('')}</div>`
            : '';

          const linkMarkup = item.link
            ? ` <a class="detail-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">View clothing link ↗</a>`
            : '';

          return `${escapeHtml(item.outfit)}${linkMarkup}${photoMarkup}`;
        }).join('<br>')
      : '<span class="panel-muted">No outfit planned yet</span>';

    const plan = items.some(item => item.event)
      ? items.filter(item => item.event).map(item => escapeHtml(item.event)).join('<br>')
      : '<span class="panel-muted">Nothing on the calendar yet</span>';

    document.getElementById('detailContent').innerHTML = `
      <div class="detail-panel">
        <div class="panel-label">What you’ll wear</div>
        <div class="panel-value">${outfit}</div>
      </div>
      <div class="detail-panel">
        <div class="panel-label">Your plans</div>
        <div class="panel-value">${plan}</div>
      </div>
    `;
  }

  function parseKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function renderDayOptions() {
    const select = document.getElementById('outfitDay');
    const start = new Date(weekStart);

    select.innerHTML = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return `<option value="${dateKey(date)}" ${sameDay(date, selectedDate) ? 'selected' : ''}>${niceDate(date)}</option>`;
    }).join('');
  }

  document.querySelectorAll('.view-option').forEach(button => {
    button.addEventListener('click', () => {
      view = button.dataset.view;
      document.querySelectorAll('.view-option').forEach(option => {
        const active = option === button;
        option.classList.toggle('selected', active);
        option.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  });

  document.getElementById('prevPeriod').addEventListener('click', () => {
    weekStart.setDate(weekStart.getDate() + (view === 'week' ? -7 : -28));
    selectedDate = new Date(weekStart);
    render();
  });

  document.getElementById('nextPeriod').addEventListener('click', () => {
    weekStart.setDate(weekStart.getDate() + (view === 'week' ? 7 : 28));
    selectedDate = new Date(weekStart);
    render();
  });

  document.getElementById('todayButton').addEventListener('click', () => {
    weekStart = mondayOf(new Date());
    selectedDate = new Date();
    render();
  });

  document.getElementById('addLookBtn').addEventListener('click', () => {
    renderDayOptions();
    dialog.showModal();
    document.getElementById('outfitName').focus();
  });

  document.getElementById('editDayBtn').addEventListener('click', () => {
    renderDayOptions();
    dialog.showModal();
    document.getElementById('outfitName').focus();
  });

  document.getElementById('outfitForm').addEventListener('submit', async event => {
    event.preventDefault();

    const name = document.getElementById('outfitName').value.trim();
    const day = document.getElementById('outfitDay').value;
    if (!name) return;

    let link = document.getElementById('clothingLink').value.trim();
    if (link) {
      try {
        const url = new URL(link);
        if (!['https:', 'http:'].includes(url.protocol)) link = '';
      } catch {
        link = '';
      }
    }

    const photoFiles = Array.from(document.getElementById('outfitPhotos').files).slice(0, 5);
    const photos = await Promise.all(photoFiles.map(readPhoto));

    entries.push({
      date: day,
      outfit: name,
      event: document.getElementById('outfitEvent').value.trim(),
      link,
      photos: photos.filter(Boolean)
    });

    try {
      localStorage.setItem('bluebell-outfits', JSON.stringify(entries));
    } catch {
      // The new entry still appears until the page is closed.
    }

    selectedDate = parseKey(day);
    weekStart = mondayOf(selectedDate);
    document.getElementById('outfitForm').reset();
    dialog.close();
    render();
  });

  function readPhoto(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');

      reader.onload = () => {
        const image = new Image();
        image.onerror = () => resolve('');

        image.onload = () => {
          const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  const chatMessages = document.getElementById('chatMessages');

  function replyTo(prompt) {
    const text = prompt.toLowerCase();

    if (text.includes('comfy') || text.includes('comfort')) {
      return 'Try your favorite jeans with a soft tee and a light layer. Comfy sneakers will carry you through the day.';
    }
    if (text.includes('sun') || text.includes('warm') || text.includes('hot')) {
      return 'It looks like a light layers kind of day! Try a breathable top, easy trousers, and keep a cardigan handy for later.';
    }
    if (text.includes('rain') || text.includes('wet')) {
      return 'A cozy knit, your go-to trousers, and water-friendly shoes make a good rainy-day start. Bring a light umbrella, too.';
    }
    if (text.includes('work') || text.includes('meeting') || text.includes('office')) {
      return 'Try a crisp shirt tucked into trousers, then add a soft cardigan or blazer. A simple accessory makes it feel finished.';
    }
    if (text.includes('date') || text.includes('dinner')) {
      return 'Pick one piece you feel great in, like a favorite skirt or a neat pair of trousers, and keep the rest relaxed and comfortable.';
    }

    const outfits = entries.map(item => item.outfit);
    return outfits.length
      ? `From your planner, “${outfits[Math.floor(Math.random() * outfits.length)]}” could be a lovely starting point. Add a light layer if the evening cools down.`
      : 'Start with a piece you love, then build around the weather and your plans. Add an outfit to your calendar and I can use it for suggestions!';
  }

  function sendPrompt(value) {
    const text = value.trim();
    if (!text) return;

    chatMessages.insertAdjacentHTML('beforeend', `
      <div class="chat-bubble user-bubble">${escapeHtml(text)}</div>
      <div class="chat-bubble bot-bubble">${escapeHtml(replyTo(text))}</div>
    `);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  document.getElementById('chatForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    sendPrompt(input.value);
    input.value = '';
    input.focus();
  });

  document.querySelectorAll('.prompt-chip').forEach(button => {
    button.addEventListener('click', () => sendPrompt(button.textContent));
  });

  document.querySelector('.mobile-menu').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });

  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => document.querySelector('.sidebar').classList.remove('open'));
  });

  render();
})();
