/* ── AI Command Centre – Application Logic ─────────────────── */

const STORAGE_KEY = 'ai-command-centre-data';

const DEFAULT_STATE = {
  projects: [
    { id: 'p1', name: 'Website Redesign', description: 'Modernize the company website with new branding', color: '#6366f1' },
    { id: 'p2', name: 'Mobile App', description: 'Cross-platform mobile application', color: '#10b981' },
  ],
  tasks: [
    { id: 't1', text: 'Create wireframes', projectId: 'p1', due: '2026-11-01', completed: false },
    { id: 't2', text: 'Design system setup', projectId: 'p1', due: '', completed: false },
    { id: 't3', text: 'Prototype screens', projectId: 'p2', due: '2026-11-15', completed: false },
  ],
  notes: '',
  activeProjectId: null,
};

let state = loadState();
let editingProjectId = null;
let editingTaskId = null;

/* ── Persistence ─────────────────────────────────────────────── */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(DEFAULT_STATE);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ── Utilities ───────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + 'T00:00:00') < today;
}

function getProjectTasks(projectId) {
  return state.tasks.filter(t => t.projectId === projectId);
}

/* ── Toast Notifications ─────────────────────────────────────── */
function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ── Render: Projects ────────────────────────────────────────── */
function renderProjects() {
  const container = document.getElementById('projectList');
  if (!container) return;

  if (state.projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📁</div><p>No projects yet. Create your first project!</p></div>';
    return;
  }

  container.innerHTML = state.projects.map(p => {
    const tasks = getProjectTasks(p.id);
    const done = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const isActive = state.activeProjectId === p.id;
    const cardClass = 'project-card' + (isActive ? ' active' : '');
    return '<div class="' + cardClass + '" data-id="' + p.id + '" tabindex="0">'
      + '<div class="project-card-header">'
      + '<div class="project-card-title"><span class="project-dot" style="background:' + p.color + '"></span>'
      + escapeHtml(p.name) + '</div>'
      + '<div class="project-card-actions">'
      + '<button class="btn-icon btn-edit-project" data-id="' + p.id + '" title="Edit project">✏️</button>'
      + '<button class="btn-icon btn-delete-project" data-id="' + p.id + '" title="Delete project">🗑️</button>'
      + '</div></div>'
      + (p.description ? '<div class="project-card-desc">' + escapeHtml(p.description) + '</div>' : '')
      + '<div class="progress-bar" style="height:4px;margin-top:8px;"><div class="progress-fill" style="width:'
      + (total ? Math.round((done / total) * 100) : 0)
      + '%;background:' + p.color + '"></div></div>'
      + '<div style="font-size:.75rem;color:var(--text-muted);margin-top:4px;">'
      + done + '/' + total + ' tasks</div>'
      + '</div>';
  }).join('');

  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-icon')) return;
      selectProject(card.dataset.id);
    });
    card.addEventListener('dblclick', e => {
      if (e.target.closest('.btn-icon')) return;
      openProjectModal(card.dataset.id);
    });
  });

  container.querySelectorAll('.btn-edit-project').forEach(btn => {
    btn.addEventListener('click', () => openProjectModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', () => deleteProject(btn.dataset.id));
  });
}

/* ── Render: Tasks ───────────────────────────────────────────── */
function renderTasks() {
  const container = document.getElementById('taskList');
  if (!container) return;

  const filtered = state.activeProjectId
    ? state.tasks.filter(t => t.projectId === state.activeProjectId)
    : state.tasks;

  if (filtered.length === 0) {
    const msg = state.activeProjectId
      ? 'No tasks for this project. Add one!'
      : 'No tasks yet. Create your first task!';
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>' + msg + '</p></div>';
    return;
  }

  container.innerHTML = filtered.map(t => {
    const project = state.projects.find(p => p.id === t.projectId);
    const overdue = isOverdue(t.due, t.completed);
    const itemClass = 'task-item' + (t.completed ? ' completed' : '');
    const cbClass = 'task-checkbox' + (t.completed ? ' checked' : '');
    const dueTag = t.due
      ? '<span class="task-tag' + (overdue ? ' overdue' : '') + '">'
      + formatDate(t.due) + (overdue ? ' (overdue)' : '') + '</span>'
      : '';
    const projectTag = project
      ? '<span class="task-tag" style="color:' + project.color + '">' + escapeHtml(project.name) + '</span>'
      : '';
    return '<div class="' + itemClass + '" data-id="' + t.id + '">'
      + '<div class="' + cbClass + '" data-id="' + t.id + '"></div>'
      + '<div class="task-content">'
      + '<div class="task-text">' + escapeHtml(t.text) + '</div>'
      + '<div class="task-meta">' + projectTag + dueTag + '</div>'
      + '</div>'
      + '<div class="task-actions">'
      + '<button class="btn-icon btn-edit-task" data-id="' + t.id + '" title="Edit task">✏️</button>'
      + '<button class="btn-icon btn-delete-task" data-id="' + t.id + '" title="Delete task">🗑️</button>'
      + '</div></div>';
  }).join('');

  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', () => toggleTask(cb.dataset.id));
  });
  container.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', () => openTaskModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

/* ── Render: Overall Progress ────────────────────────────────── */
function renderProgress() {
  const fill = document.getElementById('overallFill');
  const label = document.getElementById('overallLabel');
  if (!fill || !label) return;

  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  fill.style.width = pct + '%';
  label.textContent = pct + '% complete · ' + done + '/' + total + ' tasks';
}

/* ── Render: Notes ───────────────────────────────────────────── */
function renderNotes() {
  const area = document.getElementById('notesArea');
  const meta = document.getElementById('notesMeta');
  if (!area) return;
  area.value = state.notes || '';
  updateNotesMeta();
}

function updateNotesMeta() {
  const meta = document.getElementById('notesMeta');
  if (!meta) return;
  const len = (state.notes || '').length;
  meta.textContent = len > 0 ? len + ' characters' : '';
}

/* ── Render All ──────────────────────────────────────────────── */
function renderAll() {
  renderProjects();
  renderTasks();
  renderProgress();
  renderNotes();
}

/* ── Project Actions ─────────────────────────────────────────── */
function selectProject(id) {
  state.activeProjectId = state.activeProjectId === id ? null : id;
  saveState();
  renderAll();
}

function openProjectModal(projectId) {
  editingProjectId = projectId;
  const modal = document.getElementById('projectModal');
  const title = document.getElementById('projectModalTitle');
  const nameInput = document.getElementById('projectName');
  const descInput = document.getElementById('projectDesc');
  const colorSelect = document.getElementById('projectColor');

  if (projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    title.textContent = 'Edit Project';
    nameInput.value = project.name;
    descInput.value = project.description || '';
    colorSelect.value = project.color;
  } else {
    title.textContent = 'New Project';
    nameInput.value = '';
    descInput.value = '';
    colorSelect.value = '#6366f1';
  }

  modal.classList.remove('hidden');
  nameInput.focus();
  nameInput.select();
}

function closeProjectModal() {
  editingProjectId = null;
  document.getElementById('projectModal').classList.add('hidden');
}

function saveProject() {
  const nameInput = document.getElementById('projectName');
  const descInput = document.getElementById('projectDesc');
  const colorSelect = document.getElementById('projectColor');

  const name = nameInput.value.trim();
  if (!name) {
    showToast('Please enter a project name', 'error');
    nameInput.focus();
    return;
  }

  if (editingProjectId) {
    const project = state.projects.find(p => p.id === editingProjectId);
    if (project) {
      project.name = name;
      project.description = descInput.value.trim();
      project.color = colorSelect.value;
    }
    showToast('Project updated', 'success');
  } else {
    state.projects.push({
      id: uid(),
      name: name,
      description: descInput.value.trim(),
      color: colorSelect.value,
    });
    state.activeProjectId = state.projects[state.projects.length - 1].id;
    showToast('Project created', 'success');
  }

  saveState();
  closeProjectModal();
  renderAll();
}

function deleteProject(id) {
  if (!confirm('Delete this project and all its tasks?')) return;
  state.projects = state.projects.filter(p => p.id !== id);
  state.tasks = state.tasks.filter(t => t.projectId !== id);
  if (state.activeProjectId === id) state.activeProjectId = null;
  saveState();
  renderAll();
  showToast('Project deleted', 'info');
}

/* ── Task Actions ────────────────────────────────────────────── */
function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderAll();
  }
}

function openTaskModal(taskId) {
  editingTaskId = taskId;
  const modal = document.getElementById('taskModal');
  const title = document.getElementById('taskModalTitle');
  const textInput = document.getElementById('taskText');
  const projectSelect = document.getElementById('taskProject');
  const dueInput = document.getElementById('taskDue');

  projectSelect.innerHTML = state.projects.map(p =>
    '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>'
  ).join('');

  if (taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    title.textContent = 'Edit Task';
    textInput.value = task.text;
    projectSelect.value = task.projectId;
    dueInput.value = task.due || '';
  } else {
    title.textContent = 'New Task';
    textInput.value = '';
    if (state.activeProjectId) projectSelect.value = state.activeProjectId;
    dueInput.value = '';
  }

  modal.classList.remove('hidden');
  textInput.focus();
  textInput.select();
}

function closeTaskModal() {
  editingTaskId = null;
  document.getElementById('taskModal').classList.add('hidden');
}

function saveTask() {
  const textInput = document.getElementById('taskText');
  const projectSelect = document.getElementById('taskProject');
  const dueInput = document.getElementById('taskDue');

  const text = textInput.value.trim();
  if (!text) {
    showToast('Please enter a task description', 'error');
    textInput.focus();
    return;
  }
  if (!projectSelect.value) {
    showToast('Please select a project', 'error');
    return;
  }

  if (editingTaskId) {
    const task = state.tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.text = text;
      task.projectId = projectSelect.value;
      task.due = dueInput.value;
    }
    showToast('Task updated', 'success');
  } else {
    state.tasks.push({
      id: uid(),
      text: text,
      projectId: projectSelect.value,
      due: dueInput.value,
      completed: false,
    });
    showToast('Task created', 'success');
  }

  saveState();
  closeTaskModal();
  renderAll();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderAll();
  showToast('Task deleted', 'info');
}

/* ── Notes Actions ───────────────────────────────────────────── */
function saveNotes(value) {
  state.notes = value;
  saveState();
  updateNotesMeta();
}

function clearNotes() {
  if (!confirm('Clear all notes?')) return;
  state.notes = '';
  saveState();
  renderNotes();
  showToast('Notes cleared', 'info');
}

/* ── Export / Import / Reset ──────────────────────────────────── */
function exportData() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-command-centre-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.projects && data.tasks) {
        state = data;
        saveState();
        renderAll();
        showToast('Data imported successfully', 'success');
      } else {
        showToast('Invalid data format', 'error');
      }
    } catch {
      showToast('Failed to parse JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('Reset to defaults? This will erase all your projects, tasks, and notes.')) return;
  state = structuredClone(DEFAULT_STATE);
  saveState();
  renderAll();
  showToast('Data reset to defaults', 'info');
}

/* ── Init ────────────────────────────────────────────────────── */
function init() {
  const body = document.body;
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  body.appendChild(toastContainer);

  const addProjectBtn = document.getElementById('addProjectBtn');
  const cancelProjectBtn = document.getElementById('cancelProjectBtn');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const projectModal = document.getElementById('projectModal');

  if (addProjectBtn) addProjectBtn.addEventListener('click', () => openProjectModal());
  if (cancelProjectBtn) cancelProjectBtn.addEventListener('click', closeProjectModal);
  if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);
  if (projectModal) projectModal.addEventListener('click', e => {
    if (e.target === projectModal) closeProjectModal();
  });

  const addTaskBtn = document.getElementById('addTaskBtn');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const taskModal = document.getElementById('taskModal');

  if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskModal());
  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
  if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTask);
  if (taskModal) taskModal.addEventListener('click', e => {
    if (e.target === taskModal) closeTaskModal();
  });

  const notesArea = document.getElementById('notesArea');
  if (notesArea) notesArea.addEventListener('input', e => saveNotes(e.target.value));

  const clearNotesBtn = document.getElementById('clearNotesBtn');
  if (clearNotesBtn) clearNotesBtn.addEventListener('click', clearNotes);

  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const resetBtn = document.getElementById('resetBtn');

  if (exportBtn) exportBtn.addEventListener('click', exportData);
  if (importBtn) importBtn.addEventListener('click', () => importFile.click());
  if (importFile) importFile.addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
  });
  if (resetBtn) resetBtn.addEventListener('click', resetData);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProjectModal(); closeTaskModal(); }
  });

  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
