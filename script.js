
    // === ELEMENTS ===
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('overlay');
    const closeMenu = document.getElementById('closeMenu');
    const editor = document.getElementById('editor');
    const headingInput = document.getElementById('headingInput');
    const tagInput = document.getElementById('tagInput');
    const hintsDesktop = document.getElementById('hintsDesktop');
    const hintsMobile = document.getElementById('hintsMobile');
    const searchDesktop = document.getElementById('searchDesktop');
    const searchMobile = document.getElementById('searchMobile');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const nameModal = document.getElementById('nameModal');
    const nameInput = document.getElementById('nameInput');
    const saveNameBtn = document.getElementById('saveNameBtn');

    const storageKey = 'stuno_notes_v4';
    const userKey = 'stuno_username';
    let headings = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let userName = localStorage.getItem(userKey);

    // === USER NAME LOGIC ===
    function showNameModal() {
      nameModal.style.display = 'flex';
      nameInput.focus();
    }

    function saveUserName() {
      const name = nameInput.value.trim();
      if (name) {
        localStorage.setItem(userKey, name);
        userNameDisplay.textContent = name;
        nameModal.style.display = 'none';
      } else {
        alert('Please enter your name!');
      }
    }

    userNameDisplay.addEventListener('click', showNameModal);
    saveNameBtn.addEventListener('click', saveUserName);
    nameInput.addEventListener('keypress', e => { if (e.key === 'Enter') saveUserName(); });

    // Load user name
    if (userName) {
      userNameDisplay.textContent = userName;
    } else {
      showNameModal();
    }

    // === HAMBURGER MENU ===
    function openMenu() {
      navMenu.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeMenuFunc() {
      navMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    hamburger.addEventListener('click', openMenu);
    closeMenu.addEventListener('click', closeMenuFunc);
    overlay.addEventListener('click', closeMenuFunc);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenuFunc(); });

    // === NOTES LOGIC ===
    function saveToStorage() { localStorage.setItem(storageKey, JSON.stringify(headings)); }

    function renderHints(container, filter = '') {
      container.innerHTML = '';
      const q = filter.toLowerCase();
      const results = headings.filter(h => 
        !q || h.title.toLowerCase().includes(q) || h.tags.some(t => t.toLowerCase().includes(q))
      );
      if (!results.length) {
        container.innerHTML = '<div style="padding:16px;color:var(--muted);text-align:center;font-style:italic">No notes found</div>';
        return;
      }
      results.forEach(h => {
        const el = document.createElement('div');
        el.style.cssText = 'padding:12px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;border-radius:8px;margin-bottom:4px';
        el.innerHTML = `<div style="font-weight:600">${h.title}</div><div style="font-size:12px;color:var(--muted)">${h.tags.join(', ')}</div>`;
        el.onclick = () => { openHeading(h.id); closeMenuFunc(); };
        container.appendChild(el);
      });
    }

    function openHeading(id) {
      const h = headings.find(x => x.id === id);
      if (!h) return;
      headingInput.value = h.title;
      tagInput.value = h.tags.join(',');
      editor.innerHTML = h.content;
    }

    function addNew() {
      const h = { id: Date.now(), title: 'New Note', tags: [], content: 'Start here...' };
      headings.unshift(h);
      saveToStorage();
      renderHints(hintsDesktop);
      renderHints(hintsMobile);
      openHeading(h.id);
    }

    function saveCurrent() {
      const title = headingInput.value.trim() || 'Untitled';
      const tags = tagInput.value.split(',').map(s => s.trim()).filter(Boolean);
      const content = editor.innerHTML;
      const existing = headings.find(h => h.title === title);
      if (existing) {
        existing.tags = tags;
        existing.content = content;
      } else {
        headings.unshift({ id: Date.now(), title, tags, content });
      }
      saveToStorage();
      renderHints(hintsDesktop);
      renderHints(hintsMobile);
      const btn = document.getElementById('saveBtn');
      btn.textContent = 'Saved';
      setTimeout(() => btn.textContent = 'Save', 1000);
    }

    // === IMPORT FUNCTION ===
    function importNote(file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.title && data.content) {
            const newNote = {
              id: Date.now() + Math.random(),
              title: data.title,
              tags: data.tags || [],
              content: data.content
            };
            headings.unshift(newNote);
            saveToStorage();
            renderHints(hintsDesktop);
            renderHints(hintsMobile);
            openHeading(newNote.id);
            alert('Note imported successfully!');
          } else {
            alert('Invalid note format!');
          }
        } catch (err) {
          alert('Failed to import: Invalid JSON');
        }
      };
      reader.readAsText(file);
    }

    // Import Buttons
    document.getElementById('importBtnMobile').onclick = 
    document.getElementById('importBtnDesktop').onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) importNote(file);
      };
      input.click();
    };

    // === SHARE ===
    document.getElementById('shareBtn').onclick = () => {
      const data = { title: headingInput.value, tags: tagInput.value, content: editor.innerHTML };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${data.title || 'note'}.json`; a.click();
      URL.revokeObjectURL(url);
      alert('Note downloaded! Share this .json file.');
    };

    // === HIGHLIGHT ===
    document.getElementById('highlightBtn').onclick = () => {
      const sel = window.getSelection();
      if (sel.rangeCount && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = document.getElementById('colorPicker').value;
        span.style.padding = '0 3px';
        span.style.borderRadius = '3px';
        try { range.surroundContents(span); } catch { }
        sel.removeAllRanges();
      } else {
        alert('Select text to highlight!');
      }
    };

    // === IMAGE ===
    document.getElementById('imageInput').onchange = e => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          editor.appendChild(img);
          editor.appendChild(document.createElement('br'));
        };
        reader.readAsDataURL(file);
      }
    };

    // === PREVIEW ===
    document.getElementById('previewBtn').onclick = () => {
      document.getElementById('preview').innerHTML = editor.innerHTML;
      document.getElementById('previewCard').style.display = 'block';
    };
    document.getElementById('closePreview').onclick = () => {
      document.getElementById('previewCard').style.display = 'none';
    };

    // === SEARCH ===
    searchDesktop.oninput = () => renderHints(hintsDesktop, searchDesktop.value.toLowerCase());
    searchMobile.oninput = () => renderHints(hintsMobile, searchMobile.value.toLowerCase());

    // === EVENTS ===
    document.getElementById('newBtnMobile').onclick = 
    document.getElementById('newBtnDesktop').onclick = addNew;
    document.getElementById('saveBtn').onclick = saveCurrent;

    // === INIT ===
    if (!headings.length) addNew();
    renderHints(hintsDesktop);
    renderHints(hintsMobile);
 