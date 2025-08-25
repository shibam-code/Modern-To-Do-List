class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadTasks();
        this.render();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('task-input');
        this.addBtn = document.getElementById('add-btn');
        
        // Filter elements
        this.filterAllBtn = document.getElementById('filter-all');
        this.filterActiveBtn = document.getElementById('filter-active');
        this.filterCompletedBtn = document.getElementById('filter-completed');
        
        // Task list and actions
        this.taskList = document.getElementById('task-list');
        this.clearCompletedBtn = document.getElementById('clear-completed');
        
        // Counter elements
        this.totalTasksSpan = document.getElementById('total-tasks');
        this.completedTasksSpan = document.getElementById('completed-tasks');
        this.progressPercentageSpan = document.getElementById('progress-percentage');
        
        // Empty state
        this.emptyState = document.getElementById('empty-state');
    }

    attachEventListeners() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Filter events
        this.filterAllBtn.addEventListener('click', () => this.setFilter('all'));
        this.filterActiveBtn.addEventListener('click', () => this.setFilter('active'));
        this.filterCompletedBtn.addEventListener('click', () => this.setFilter('completed'));

        // Clear completed tasks
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());

        // Task list events (using event delegation)
        this.taskList.addEventListener('click', (e) => this.handleTaskListClick(e));
        this.taskList.addEventListener('keypress', (e) => this.handleTaskListKeypress(e));
        this.taskList.addEventListener('blur', (e) => this.handleTaskListBlur(e), true);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const text = this.taskInput.value.trim();
        
        if (!text) {
            this.taskInput.focus();
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task); // Add to beginning for better UX
        this.taskInput.value = '';
        this.taskInput.focus();
        
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }

    editTask(id) {
        if (this.editingTaskId && this.editingTaskId !== id) {
            this.cancelEdit();
        }
        
        this.editingTaskId = id;
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        const textElement = taskElement.querySelector('.task-text');
        
        textElement.contentEditable = true;
        textElement.classList.add('editing');
        textElement.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textElement);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    saveEdit(id, newText) {
        const text = newText.trim();
        
        if (!text) {
            this.deleteTask(id);
            return;
        }

        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = text;
            this.saveTasks();
        }
        
        this.cancelEdit();
        this.render();
    }

    cancelEdit() {
        if (this.editingTaskId) {
            this.editingTaskId = null;
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        switch (filter) {
            case 'all':
                this.filterAllBtn.classList.add('active');
                break;
            case 'active':
                this.filterActiveBtn.classList.add('active');
                break;
            case 'completed':
                this.filterCompletedBtn.classList.add('active');
                break;
        }
        
        this.render();
    }

    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) return;
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
        }
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    updateCounters() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        this.totalTasksSpan.textContent = totalTasks;
        this.completedTasksSpan.textContent = completedTasks;
        this.progressPercentageSpan.textContent = `${progressPercentage}%`;
        
        // Update clear completed button state
        this.clearCompletedBtn.disabled = completedTasks === 0;
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-task-id', task.id);
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-text" data-action="edit">${this.escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="btn-icon btn-edit" data-action="edit" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" data-action="delete" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Clear task list
        this.taskList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            
            // Update empty state message based on filter
            const emptyMessage = this.emptyState.querySelector('p');
            switch (this.currentFilter) {
                case 'active':
                    emptyMessage.textContent = 'No active tasks. Great job!';
                    break;
                case 'completed':
                    emptyMessage.textContent = 'No completed tasks yet.';
                    break;
                default:
                    emptyMessage.textContent = 'No tasks yet. Add one above!';
            }
        } else {
            this.emptyState.classList.add('hidden');
            
            // Render tasks
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.taskList.appendChild(taskElement);
            });
        }
        
        // Update counters
        this.updateCounters();
    }

    handleTaskListClick(e) {
        const action = e.target.getAttribute('data-action') || e.target.closest('[data-action]')?.getAttribute('data-action');
        const taskId = e.target.closest('.task-item')?.getAttribute('data-task-id');
        
        if (!taskId || !action) return;
        
        switch (action) {
            case 'toggle':
                this.toggleTask(taskId);
                break;
            case 'edit':
                if (!this.editingTaskId) {
                    this.editTask(taskId);
                }
                break;
            case 'delete':
                this.deleteTask(taskId);
                break;
        }
    }

    handleTaskListKeypress(e) {
        if (e.key === 'Enter' && this.editingTaskId) {
            e.preventDefault();
            const newText = e.target.textContent;
            this.saveEdit(this.editingTaskId, newText);
        }
    }

    handleTaskListBlur(e) {
        if (e.target.classList.contains('editing') && this.editingTaskId) {
            const newText = e.target.textContent;
            this.saveEdit(this.editingTaskId, newText);
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('todoapp_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks to localStorage:', error);
            alert('Unable to save tasks. Your browser may have storage limitations.');
        }
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem('todoapp_tasks');
            if (stored) {
                this.tasks = JSON.parse(stored);
                
                // Validate and clean up tasks
                this.tasks = this.tasks.filter(task => 
                    task && 
                    typeof task.id === 'string' && 
                    typeof task.text === 'string' && 
                    typeof task.completed === 'boolean'
                );
            }
        } catch (error) {
            console.error('Failed to load tasks from localStorage:', error);
            this.tasks = [];
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Service Worker registration for better performance (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Note: Service worker file not included as it's not required for basic functionality
        // but this shows where it would be registered for a PWA version
    });
}
