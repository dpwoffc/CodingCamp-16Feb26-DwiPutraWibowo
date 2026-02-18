const STORAGE_KEY = 'todo_spa_items_v1';

const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const cancelBtn = document.getElementById('cancelBtn');
const todoForm = document.getElementById('todoForm');
const datetimeInput = document.getElementById('datetime');
const titleInput = document.getElementById('title');
const tbody = document.querySelector('#todoTable tbody');
const filterSelect = document.getElementById('filterSelect');

let todos = [];

function loadTodos(){
	try{
		const raw = localStorage.getItem(STORAGE_KEY);
		todos = raw ? JSON.parse(raw) : [];
	}catch(e){todos=[]}
}

function saveTodos(){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

function formatDate(iso){
	const d = new Date(iso);
	if(isNaN(d)) return '-';
	return d.toLocaleString();
}

function diffTimeParts(target){
	const now = new Date();
	const t = new Date(target);
	let diff = Math.max(0, t - now);
	const days = Math.floor(diff / (24*3600*1000));
	diff -= days * 24*3600*1000;
	const hours = Math.floor(diff / (3600*1000));
	diff -= hours * 3600*1000;
	const mins = Math.floor(diff / (60*1000));
	diff -= mins * 60*1000;
	const secs = Math.floor(diff / 1000);
	return {days,hours,mins,secs, total: (new Date(target) - now)};
}

function partsToString(p){
	if(p.total<=0) return 'Sekarang / Lewat';
	if(p.days>0) return `${p.days}d ${p.hours}h ${p.mins}m ${p.secs}s`;
	if(p.hours>0) return `${p.hours}h ${p.mins}m ${p.secs}s`;
	if(p.mins>0) return `${p.mins}m ${p.secs}s`;
	return `${p.secs}s`;
}

function renderTodos(){
	tbody.innerHTML = '';
	let list = [...todos];
	const filter = filterSelect.value;
	const now = new Date();

	if(filter === 'besok'){
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1,0,0,0);
		const end = new Date(start.getFullYear(), start.getMonth(), start.getDate()+1,0,0,0);
		list = list.filter(t=>{const d=new Date(t.datetime); return d>=start && d<end});
	}else if(filter==='lusa'){
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()+2,0,0,0);
		const end = new Date(start.getFullYear(), start.getMonth(), start.getDate()+1,0,0,0);
		list = list.filter(t=>{const d=new Date(t.datetime); return d>=start && d<end});
	}else if(filter==='terdekat'){
		list.sort((a,b)=> Math.abs(new Date(a.datetime)-now) - Math.abs(new Date(b.datetime)-now));
	}else if(filter==='terbaru'){
		list.sort((a,b)=> b.createdAt - a.createdAt);
	}else if(filter==='terlama'){
		list.sort((a,b)=> a.createdAt - b.createdAt);
	}

	list.forEach(item=>{
		const tr = document.createElement('tr');
		if(item.done) tr.classList.add('done');

		const tdDate = document.createElement('td');
		tdDate.textContent = formatDate(item.datetime);

		const tdTitle = document.createElement('td');
		tdTitle.textContent = item.title;

		const tdCountdown = document.createElement('td');
		const parts = diffTimeParts(item.datetime);
		tdCountdown.textContent = item.done ? 'Selesai' : partsToString(parts);
		tdCountdown.dataset.datetime = item.datetime;

		const tdActions = document.createElement('td');
		tdActions.className = 'actions';

		const doneBtn = document.createElement('button');
		doneBtn.className = 'btn btn-green';
		doneBtn.title = 'Selesai';
		doneBtn.innerHTML = '✓';
		doneBtn.onclick = ()=>{ toggleDone(item.id); };

		const delBtn = document.createElement('button');
		delBtn.className = 'btn btn-red';
		delBtn.title = 'Hapus';
		delBtn.innerHTML = '🗑';
		delBtn.onclick = ()=>{ deleteTodo(item.id); };

		tdActions.appendChild(doneBtn);
		tdActions.appendChild(delBtn);

		tr.appendChild(tdDate);
		tr.appendChild(tdTitle);
		tr.appendChild(tdCountdown);
		tr.appendChild(tdActions);

		tbody.appendChild(tr);
	});
}

function toggleDone(id){
	const idx = todos.findIndex(t=>t.id===id);
	if(idx===-1) return;
	todos[idx].done = !todos[idx].done;
	saveTodos();
	renderTodos();
}

function deleteTodo(id){
	todos = todos.filter(t=>t.id!==id);
	saveTodos();
	renderTodos();
}

function addTodo(obj){
	todos.push(obj);
	saveTodos();
	renderTodos();
}

todoForm.addEventListener('submit', (e)=>{
	e.preventDefault();
	const dt = datetimeInput.value;
	const title = titleInput.value.trim();
	if(!dt||!title) return;
	addTodo({id:uid(), datetime:dt, title, done:false, createdAt: Date.now()});
	todoForm.reset();
	closeModal();
});

function openModal(){ modal.classList.remove('hidden'); datetimeInput.focus(); }
function closeModal(){ modal.classList.add('hidden'); todoForm.reset(); }

addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
filterSelect.addEventListener('change', renderTodos);

function tick(){
	document.querySelectorAll('#todoTable tbody td[data-datetime]').forEach(td=>{
		const dt = td.dataset.datetime;
		const item = todos.find(t=>t.datetime===dt || t.id===td.closest('tr').dataset.id);
		const parts = diffTimeParts(dt);
		td.textContent = partsToString(parts);
	});
}

loadTodos();
renderTodos();
setInterval(renderTodos, 1000);

