// Contexts-only manager (add/rename/delete/reorder/select)
const STORAGE_KEY = 'todo-list-v1'; // keep for compatibility
const STORAGE_CONTEXT_KEY = 'todo-list-context-v1';
const STORAGE_ORDER_KEY = 'todo-list-order-v1';

const appTitle = document.getElementById('app-title');
const newContextForm = document.getElementById('new-context-form');
const newContextInput = document.getElementById('new-context-input');
const contextsList = document.getElementById('contexts-list');

let tasksByContext = {};
let contextsOrder = [];
let currentContext = null;

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByContext));
  localStorage.setItem(STORAGE_CONTEXT_KEY, JSON.stringify({ currentContext }));
  localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(contextsOrder));
}

function load(){
  try{ tasksByContext = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e){ tasksByContext = {}; }
  // do not restore a previously-selected context when returning to the contexts list.
  // Clear any persisted currentContext so no checkbox remains checked on this page.
  try{ localStorage.removeItem(STORAGE_CONTEXT_KEY); currentContext = null; } catch(e){ currentContext = null; }
  try{ contextsOrder = JSON.parse(localStorage.getItem(STORAGE_ORDER_KEY)) || []; } catch(e){ contextsOrder = []; }
}

function ensureDefaultContexts(){
  if(!tasksByContext || Object.keys(tasksByContext).length === 0){
    tasksByContext = { 'Contexte 1': [], 'Contexte 2': [], 'Contexte 3': [] };
  }
  if(!contextsOrder || contextsOrder.length === 0){
    contextsOrder = Object.keys(tasksByContext);
  }
}

function createIcon(svgPath, attrs = ''){
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" ${attrs}>${svgPath}</svg>`;
}

function renderContexts(){
  contextsList.innerHTML = '';
  // ensure all keys are in order
  Object.keys(tasksByContext).forEach(k => { if(!contextsOrder.includes(k)) contextsOrder.push(k); });
  const ctxNames = contextsOrder.filter(n => n in tasksByContext);

  ctxNames.forEach(name => {
    const label = document.createElement('label');
    label.className = 'context-item';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'context-checkbox';
    chk.dataset.context = name;
    if(currentContext === name){ chk.checked = true; label.classList.add('checked'); }

    const spanText = document.createElement('span');
    spanText.className = 'label-text';
    spanText.textContent = name;

    const actions = document.createElement('div');
    actions.className = 'context-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'context-edit';
    editBtn.setAttribute('aria-label', `Modifier ${name}`);
    editBtn.innerHTML = createIcon('<path d="M3 21v-3.75L14.06 6.19l3.75 3.75L6.75 21H3z" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>');

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'context-delete';
    delBtn.setAttribute('aria-label', `Supprimer ${name}`);
    delBtn.innerHTML = createIcon('<path d="M3 6h18" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M10 11v6M14 11v6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>');

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    label.appendChild(chk);
    label.appendChild(spanText);
    label.appendChild(actions);

    // checkbox change — exclusive selection
    chk.addEventListener('change', () => {
    if(chk.checked){
      currentContext = name;
          // uncheck others
          const others = contextsList.querySelectorAll('.context-checkbox');
          others.forEach(c => { if(c !== chk){ c.checked = false; const lbl = c.closest('.context-item'); if(lbl) lbl.classList.remove('checked'); } });
          label.classList.add('checked');
          // keep the title static (do not change appTitle here)
          save();
      // open a new page for the selected context
      const url = `context.html?context=${encodeURIComponent(name)}`;
      window.location.href = url;
        } else {
          currentContext = null;
          const all = contextsList.querySelectorAll('.context-item');
          all.forEach(l => l.classList.remove('checked'));
          // keep the title static (do not change appTitle here)
          save();
        }
    });

    // inline edit
    const startInlineEdit = () => {
      const oldName = name;
      spanText.contentEditable = 'true';
      chk.disabled = true;
      spanText.focus();
      const range = document.createRange(); range.selectNodeContents(spanText);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);

      const finish = () => {
        spanText.contentEditable = 'false';
        chk.disabled = false;
        const newNameRaw = spanText.textContent || '';
        const newName = newNameRaw.trim();
        if(!newName){ spanText.textContent = oldName; cleanup(); return; }
        if(newName === oldName){ cleanup(); return; }
        if(tasksByContext[newName]){ alert('Un contexte avec ce nom existe déjà.'); spanText.textContent = oldName; cleanup(); return; }
        // rename in model
        tasksByContext[newName] = tasksByContext[oldName] || [];
        delete tasksByContext[oldName];
        const idx = contextsOrder.indexOf(oldName);
        if(idx > -1) contextsOrder[idx] = newName;
        if(currentContext === oldName) currentContext = newName;
        save();
        renderContexts();
        cleanup();
      };

      const onKey = (evt) => {
        if(evt.key === 'Enter'){ evt.preventDefault(); spanText.blur(); }
        else if(evt.key === 'Escape'){ spanText.textContent = oldName; spanText.blur(); }
      };

      function cleanup(){ spanText.removeEventListener('blur', finish); spanText.removeEventListener('keydown', onKey); }

      spanText.addEventListener('blur', finish);
      spanText.addEventListener('keydown', onKey);
    };

    editBtn.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(); });
    spanText.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(); });

    // delete immediate
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      delete tasksByContext[name];
      const idx = contextsOrder.indexOf(name);
      if(idx > -1) contextsOrder.splice(idx,1);
      if(currentContext === name) currentContext = null;
      save();
      renderContexts();
    });

    // drag & drop ordering
    label.draggable = true;
    label.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', name); label.classList.add('dragging'); });
    label.addEventListener('dragend', () => { label.classList.remove('dragging'); document.querySelectorAll('.context-item').forEach(el => el.classList.remove('drag-before','drag-after')); });
    label.addEventListener('dragover', (e) => { e.preventDefault(); const rect = label.getBoundingClientRect(); const offset = e.clientY - rect.top; const before = offset < rect.height / 2; label.classList.toggle('drag-before', before); label.classList.toggle('drag-after', !before); });
    label.addEventListener('dragleave', () => { label.classList.remove('drag-before','drag-after'); });
    label.addEventListener('drop', (e) => {
      e.preventDefault();
      const src = e.dataTransfer.getData('text/plain'); if(!src || src === name) return;
      const rect = label.getBoundingClientRect(); const before = (e.clientY - rect.top) < rect.height / 2;
      const sIdx = contextsOrder.indexOf(src); if(sIdx > -1) contextsOrder.splice(sIdx,1);
      let destIdx = contextsOrder.indexOf(name); if(destIdx === -1) destIdx = contextsOrder.length;
      const insertAt = before ? destIdx : destIdx + 1; contextsOrder.splice(insertAt, 0, src);
      document.querySelectorAll('.context-item').forEach(el => el.classList.remove('drag-before','drag-after','dragging'));
      save(); renderContexts();
    });

    contextsList.appendChild(label);
  });
}

// Add new context handler
if(newContextForm){
  newContextForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (newContextInput.value || '').trim();
    if(!v) return;
    if(tasksByContext[v]){ alert('Ce contexte existe déjà.'); newContextInput.value = ''; return; }
    tasksByContext[v] = [];
    contextsOrder.push(v);
    newContextInput.value = '';
    save();
    renderContexts();
  });
}

// init
load();
ensureDefaultContexts();
renderContexts();
// always keep the visible title static
if(appTitle) appTitle.textContent = 'Sélectionnez votre contexte';

// expose a tiny debug API
window.__contexts = { tasksByContext, contextsOrder, getCurrent: () => currentContext };

