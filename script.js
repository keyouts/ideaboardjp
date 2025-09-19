let board = document.getElementById('board');
let selectedNote = null;
let notesData = JSON.parse(localStorage.getItem('moodBoardNotes')) || {};
let customTags = JSON.parse(localStorage.getItem('moodBoardTags')) || [];

const tagFilter = document.getElementById('tagFilter');
const tagDeleteSelect = document.getElementById('tagDeleteSelect');
const newTagInput = document.getElementById('newTagInput');
const createTagBtn = document.getElementById('createTag');
const deleteTagBtn = document.getElementById('deleteTag');

function saveNotes() {
  localStorage.setItem('moodBoardNotes', JSON.stringify(notesData));
}

function saveTags() {
  localStorage.setItem('moodBoardTags', JSON.stringify(customTags));
}

function updateTagFilterDropdown() {
  tagFilter.innerHTML = '';
  const allTags = ['all', ...customTags];
  allTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag === 'all' ? 'すべて表示' : tag;
    tagFilter.appendChild(option);
  });
}

function updateTagDeleteDropdown() {
  tagDeleteSelect.innerHTML = '';
  customTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagDeleteSelect.appendChild(option);
  });
}

function getTagOptionsHTML(selectedTag = '') {
  let options = `<option value="">タグなし</option>`;
  customTags.forEach(tag => {
    options += `<option value="${tag}" ${tag === selectedTag ? 'selected' : ''}>${tag}</option>`;
  });
  return options;
}

function updateAllNoteTagDropdowns() {
  document.querySelectorAll('.note').forEach(note => {
    const id = note.dataset.id;
    const tagSelect = note.querySelector('.tagSelect');
    const currentTag = notesData[id].tag || '';
    tagSelect.innerHTML = getTagOptionsHTML(currentTag);
  });
}

function createNote(id, content = '', x = 100, y = 100, image = '', tag = '') {
  const note = document.createElement('div');
  note.className = 'note';
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  note.dataset.id = id;

  note.innerHTML = `
    <textarea placeholder="クリックして編集">${content}</textarea>
    ${image ? `<img src="${image}" />` : ''}
    <div class="controls">
      <button class="addImage">画像を追加</button>
      <button class="selectNote">選択</button>
      <select class="tagSelect">${getTagOptionsHTML(tag)}</select>
    </div>
  `;

  board.appendChild(note);
  makeDraggable(note);

  const textarea = note.querySelector('textarea');
  textarea.addEventListener('input', (e) => {
    notesData[id].content = e.target.value;
    saveNotes();
  });

  const tagSelect = note.querySelector('.tagSelect');
  tagSelect.addEventListener('change', (e) => {
    notesData[id].tag = e.target.value;
    saveNotes();
    applyTagFilter();
  });

  tagSelect.value = tag;

  note.querySelector('.addImage').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement('img');
        img.src = reader.result;
        note.appendChild(img);
        notesData[id].image = reader.result;
        saveNotes();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  note.querySelector('.selectNote').onclick = () => {
    if (selectedNote) selectedNote.style.borderColor = '#000';
    selectedNote = note;
    note.style.borderColor = 'red';
  };
}

function makeDraggable(el) {
  let offsetX, offsetY, isDragging = false;

  el.addEventListener('mousedown', (e) => {
    if (['TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) return;
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      const id = el.dataset.id;
      notesData[id].x = x;
      notesData[id].y = y;
      saveNotes();
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    el.style.zIndex = '';
  });

  el.addEventListener('dblclick', () => {
    el.querySelector('textarea').focus();
  });
}

document.getElementById('addNote').onclick = () => {
  const id = Date.now().toString();
  notesData[id] = { content: '', x: 100, y: 100, image: '', tag: '' };
  saveNotes();
  createNote(id);
};

document.getElementById('deleteNote').onclick = () => {
  if (selectedNote) {
    const id = selectedNote.dataset.id;
    board.removeChild(selectedNote);
    delete notesData[id];
    selectedNote = null;
    saveNotes();
    applyTagFilter();
  }
};

tagFilter.onchange = applyTagFilter;

function applyTagFilter() {
  const selectedTag = tagFilter.value;
  document.querySelectorAll('.note').forEach(note => {
    const id = note.dataset.id;
    const tag = notesData[id].tag || '';
    note.style.display = (selectedTag === 'all' || tag === selectedTag) ? 'block' : 'none';
  });
}

createTagBtn.onclick = () => {
  const newTag = newTagInput.value.trim();
  if (newTag && !customTags.includes(newTag)) {
    customTags.push(newTag);
    saveTags();
    updateTagFilterDropdown();
    updateTagDeleteDropdown();
    updateAllNoteTagDropdowns();
    newTagInput.value = '';
  }
};

deleteTagBtn.onclick = () => {
  const tagToDelete = tagDeleteSelect.value;
  if (tagToDelete && customTags.includes(tagToDelete)) {
    customTags = customTags.filter(tag => tag !== tagToDelete);
    for (let id in notesData) {
      if (notesData[id].tag === tagToDelete) {
        notesData[id].tag = '';
      }
    }
    saveTags();
    saveNotes();
    updateTagFilterDropdown();
    updateTagDeleteDropdown();
    updateAllNoteTagDropdowns();
    applyTagFilter();
  }
};

window.onload = () => {
  for (let id in notesData) {
    const { content, x, y, image, tag } = notesData[id];
    createNote(id, content, x, y, image, tag);
  }
  updateTagFilterDropdown();
  updateTagDeleteDropdown();
  updateAllNoteTagDropdowns();
  applyTagFilter();
};

