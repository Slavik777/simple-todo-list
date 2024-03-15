// const input = document.getElementsByName('task')[0];
// const ul = document.getElementsByClassName('tasks')[0];
// console.log(input.value.trim());
// ul.innerHTML += `<li class="task">
// <input type="checkbox" name="" id="">
// <span>${input.value.trim()}</span>
// <button>&times;</button>
// </li>`

const form = document.querySelector('form');
const input = form.querySelector('input[name="task"]');
const tasksList = document.querySelector('.tasks');
const host = window.location.hostname;
const ws = new WebSocket(`ws://${host}:8000`);

// loadTasks().then(showTasks)

// ws.addEventListener('open', ping)
// ws.addEventListener('message', reflect)
ws.addEventListener('message', handleWS)
ws.addEventListener('close', notify)

form.addEventListener('submit', handleSubmit)
tasksList.addEventListener('click', handleRemove)
tasksList.addEventListener('change', handleChange)

function ping() {
    setTimeout(() => {
        console.log('ping')
        ws.send('ping')
    }, 1000);
}

function handleWS(e){
    showTasks(JSON.parse(e.data))
}

function notify() {
    console.log('connection closed')
}

function reflect(e) {
    console.log(e.data);

    setTimeout(() => {
        console.log('ping')
        ws.send('ping')
    }, 1000);
}



function showTasks(tasks) {
    tasksList.innerHTML = ''

    for (const task of tasks) {
        tasksList.innerHTML += `
            <li class="task">
                <input type="checkbox" ${task.done ? 'checked' : ''}>
                <span>${task.text}</span>
                <button>&times;</button>
            </li>
        `;
    }
}

function handleSubmit(e) {
    e.preventDefault();
    const taskText = input.value
    if (taskText) {
        addTask(taskText)
        input.value = ''
    }
}

function handleRemove(e) {
    if (e.target.tagName === 'BUTTON') {
        const items = Array.from(tasksList.children)
        const item = e.target.closest('.task',)
        const index = items.indexOf(item);

        removeTask(index)
    }
}

function handleChange(e) {
    const items = Array.from(tasksList.children)
    const item = e.target.closest('.task')
    const index = items.indexOf(item);
    const checked = e.target.checked;

    updateTask(index, checked)
}

function updateTask(index, checked) {
    ws.send(JSON.stringify({index, checked}))
}
function loadTasks() {
    return fetch('/api/tasks').then((response)=> response.json())
}

function addTask(task) {
    ws.send(JSON.stringify({text: task, done: false}))
}

function removeTask(index) {
    ws.send(JSON.stringify(index))
}
function _removeTask(index) {
    const init = {
        method: "DELETE",
        headers: {"Content-Type": 'text/json; charset=utf8'},
        body: JSON.stringify(index)
    }
    
    return fetch('/api/remove', init).then((response)=> response.json())
}

function _addTask(task) {
    const init = {
        method: "POST",
        headers: {"Content-Type": 'text/json; charset=utf8'},
        body: JSON.stringify(task)
    }
    
    return fetch('/api/add', init).then((response)=> response.json())
}

function _updateTask(index, checked) {
    const payload = {index, checked}

    const init = {
        method: "PUT",
        headers: {"Content-Type": 'text/json; charset=utf8'},
        body: JSON.stringify(payload)
    }
    
    return fetch('/api/check', init).then((response)=> response.json())
}
