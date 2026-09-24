// Import translations
import { uiTranslations } from "./translations/uiTranslations.js";
import { changelogTranslations } from "./translations/changelog.js";

// Notes data structure
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentNoteId;
let trash = JSON.parse(localStorage.getItem('trash')) || [];
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// DOM elements
const noteTitle = document.getElementById('noteTitle');
const textArea = document.getElementById('textArea');
const charCounter = document.getElementById('charCounter');

// Render all notes
function renderNotes() {
  const list = document.getElementById('notesList');
  list.innerHTML = "";

  notes.forEach(note => {
    const li = document.createElement('li');
    if (note.id === currentNoteId) {
      li.classList.add('active');
    }

    const titleSpan = document.createElement('span');
    titleSpan.textContent = note.title;
    titleSpan.onclick = () => openNote(note.id);

    li.appendChild(titleSpan);
    list.appendChild(li);
  });

  const delList = document.getElementById('deletedNotesList');
  delList.innerHTML = "";

  if (trash.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.dataset.i18n = 'trashEmpty';
    emptyMessage.textContent = translate('trashEmpty');

    delList.appendChild(emptyMessage);
  } else {
    trash.forEach(note => {
      const li = document.createElement('li');
      if (note.id === currentNoteId) {
        li.classList.add('active');
      }

      const titleSpan = document.createElement('span');
      titleSpan.textContent = note.title;
      titleSpan.onclick = () => openNote(note.id, true);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = "×";
      deleteButton.onclick = () => deleteNote(note.id);
      const restoreButton = document.createElement('button');
      restoreButton.textContent = "←";
      restoreButton.onclick = () => restoreNote(note.id);

      li.appendChild(titleSpan);
      li.appendChild(deleteButton);
      li.appendChild(restoreButton);
      delList.appendChild(li);
    });
  }
}

// Open a note
function openNote(id, fromTrash = false) {
  const source = fromTrash ? trash : notes;
  const note = source.find(n => n.id === id);
  if (note) {
    currentNoteId = id;
    localStorage.setItem('noteId', currentNoteId);

    noteTitle.value = note.title;
    textArea.value = note.content;
    charCount();
  }
}

// Save note
const saveButton = document.getElementById('saveButton');
saveButton.addEventListener('click', saveNote);
function saveNote() {
  const title = noteTitle.value;
  const content = textArea.value;

  if (!title && !content) {
    showToast(translate('nothingToSave'));
    return;
  } else if (!title) {
    showToast(translate('noTitleToSave'));
    return;
  } else if (!content) {
    showToast(translate('noContentToSave'));
    return;
  }

  if (currentNoteId) {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].id === currentNoteId) {
        notes[i].title = title;
        notes[i].content = content;
      };
    }
    currentNoteId = null;
    localStorage.removeItem('noteId');
  } else {
    const id = Date.now();
    notes.push({
      id,
      title,
      content
    });
  }

  localStorage.setItem('notes', JSON.stringify(notes));
  noteTitle.value = "";
  textArea.value = "";

  showToast(translate('noteSaved'));
  renderNotes();
  charCount();
}

// Move to trash
const trashButton = document.getElementById('trashButton');
trashButton.addEventListener('click', () => moveToTrash(currentNoteId));
function moveToTrash(id) {
  const noteToDelete = notes.find(n => n.id === id);
  if (!noteToDelete) {
    showToast(translate('nothingToDelete'));
    return;
  }

  notes = notes.filter(n => n.id !== id);
  localStorage.setItem('notes', JSON.stringify(notes));

  const now = Date.now();
  trash.push({
    ...noteToDelete,
    deleteAt: now,
    expiresAt: now + THIRTY_DAYS
  });
  localStorage.setItem('trash', JSON.stringify(trash));

  if (currentNoteId === id) {
    currentNoteId = null;
    noteTitle.value = "";
    textArea.value = "";
    charCount();
  }

  showToast(translate('noteMovedToTrash'));
  renderNotes();
}

// Restore note
function restoreNote(id) {
  const noteToRestore = trash.find(n => n.id === id);
  if (!noteToRestore) {
    showToast(translate('nothingToRestore'));
    return;
  }

  notes.push({
    id: noteToRestore.id,
    title: noteToRestore.title,
    content: noteToRestore.content
  })

  trash = trash.filter(n => n.id !== id);
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('trash', JSON.stringify(trash));

  showToast(translate('noteRestored'));
  renderNotes();
}

// Delete note
function deleteNote(id) {
  const noteToDelete = trash.find(n => n.id === id);
  if (!noteToDelete) {
    showToast(translate('nothingToDelete'));
    return;
  }

  trash = trash.filter(n => n.id !== id);
  localStorage.setItem('trash', JSON.stringify(trash));

  showToast(translate('noteDeleted'));
  renderNotes();
}

// Auto-delete trashed notes after expriration time
function cleanTrash() {
  trash = trash.filter(note => {
    return Date.now() < note.expiresAt;
  });

  localStorage.setItem('trash', JSON.stringify(trash));
}

// Show search menu (under development)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.code === 'KeyF') {
    showToast(translate('textFind'));
    e.preventDefault();
  }
});

// Highlight search matches in text (under development)
function highlight(query) {
  let text = textArea.innerText;
  const regex = new RexExp(query, "gi");

  if (!query) {
    editor.innerHTML = text;
    return;
  }

  textArea.innerHTML = text.replace(regex, match => {
    return `<mark>${match}</mark>`;
  });
}

// Show a toast notification
function showToast(text) {
  const el = document.getElementById('toast');  
  el.textContent = text;
  el.classList.add('show');

  setTimeout(() => {
    el.classList.remove('show');
  }, 2000);
}

// Show toast notifications for clipboard actions
document.addEventListener('copy', () => {
  showToast(translate('textCopy'));
});
document.addEventListener('paste', () => {
  showToast(translate('textPaste'));
});
document.addEventListener('cut', () => {
  showToast(translate('textCut'));
});

// Settings overlay
const settingsButton = document.getElementById('settingsButton');
const settingsOverlay = document.getElementById('settingsOverlay');
settingsButton.addEventListener('click', () => {
  changelogOverlay.classList.remove('active');
  translateOverlay.classList.remove('active');
  settingsOverlay.classList.toggle('active');
});

// Switch between light and dark themes
const themeButton = document.getElementById('themeButton');
themeButton.addEventListener('click', switchTheme);
function switchTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const icon = document.getElementById('themeIcon');
  icon.src = document.documentElement.classList.contains('dark')
    ? "images/sun.svg"
    : "images/moon.svg";
}

// Toggle translate dropdown visibility
const translateButton = document.getElementById('translateButton');
const translateOverlay = document.getElementById('translateOverlay');
translateButton.addEventListener('click', () => {
  translateOverlay.classList.toggle('active');
  changelogOverlay.classList.remove('active');
  infoOverlay.classList.remove('active');
});

// Character counter
textArea.addEventListener('input', charCount);
function charCount() {
  const count = textArea.value.length;
  charCounter.textContent = translate('charCounter') + count;
}

// Toggle changelog overlay visibility
const changelogButton = document.getElementById('changelogButton');
const changelogOverlay = document.getElementById('changelogOverlay');
changelogButton.addEventListener('click', () => {
  changelogOverlay.classList.toggle('active');
  translateOverlay.classList.remove('active');
  infoOverlay.classList.remove('active');
});

// Show version in changelog overlay
function updateChangelogVersion() {
  document.querySelectorAll('.changelogVersion').forEach(el => {
    el.textContent = `${translate('changelogVersion')} ${el.dataset.version}`;
  });
}

// Toggle trash overlay visibility
const trashPanelButton = document.getElementById('trashPanelButton');
const trashOverlay = document.getElementById('trashOverlay');
trashPanelButton.addEventListener('click', () => {
  trashOverlay.classList.toggle('active');
});

// Toggle info overlay visibility
const infoButton = document.getElementById('infoButton');
const infoOverlay = document.getElementById('infoOverlay');
infoButton.addEventListener('click', () => {
  infoOverlay.classList.toggle('active');
  trashOverlay.classList.remove('active');
  changelogOverlay.classList.remove('active');
  translateOverlay.classList.remove('active');
});

// Hide overlays on textarea focus
textArea.addEventListener('focus', () => {
  trashOverlay.classList.remove('active');
  changelogOverlay.classList.remove('active');
  translateOverlay.classList.remove('active');
  settingsOverlay.classList.remove('active');
  infoOverlay.classList.remove('active');
});

noteTitle.addEventListener('focus', () => {
  trashOverlay.classList.remove('active');
  changelogOverlay.classList.remove('active');
  translateOverlay.classList.remove('active');
  settingsOverlay.classList.remove('active');
  infoOverlay.classList.remove('active');
});

// Default language
let currentLang = localStorage.getItem('lang') || 'en';
function translate(key) {
  return uiTranslations[currentLang][key] || key;
}
function translateChangelog(key) {
  return changelogTranslations[currentLang][key] || key;
}

// Language selection
document.querySelectorAll('input[name="language"]').forEach(input => {
  input.addEventListener('change', (e) => {
    const lang = e.target.value;
    changeLanguage(lang);
  });
});

// Update text content for selected language
function updateTexts() {
  // Simple text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = translate(el.dataset.i18n);
  });

  // Placeholder text content
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = translate(el.dataset.i18nPlaceholder);
  });

  // Changelog entries
  document.querySelectorAll('.changelog li').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translateChangelog(key);
  });
}

// Change language and save the preference
function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  updateTexts();
  charCount();
  updateChangelogVersion()
}

// Set current language radio button as checked
document.querySelector(`input[value="${currentLang}"]`).checked = true;

// Load saved data on page load
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme');
  const icon = document.getElementById('themeIcon');
  icon.src = theme === 'dark'
    ? "images/sun.svg"
    : "images/moon.svg"

  // Icons preloading
  const preload = (src) => {
    const img = new Image();
    img.src = src;
  };

  // Load current note
  const savedId = localStorage.getItem('noteId');
  notes = JSON.parse(localStorage.getItem('notes')) || [];
  if (savedId) {
    const note = notes.find(n => n.id === Number(savedId));
    if (note) {
      currentNoteId = note.id;
      noteTitle.value = note.title;
      textArea.value = note.content;
    }
  }

  cleanTrash();
  renderNotes();
  charCount();
  preload("images/sun.svg");
  preload("images/moon.svg");
});

// Initialize UI translations
updateTexts();
updateChangelogVersion();