class KitchenChecklistApp {
    constructor() {
        this.currentChecklist = null;
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderChecklistTabs();

        // Select first checklist if available
        const checklistNames = Object.keys(this.data.checklists);
        if (checklistNames.length > 0) {
            this.switchChecklist(checklistNames[0]);
        }
    }

    setupEventListeners() {
        const addItemBtn = document.getElementById('addItemBtn');
        const newItemInput = document.getElementById('newItemInput');
        const addChecklistBtn = document.getElementById('addChecklistBtn');
        const newChecklistInput = document.getElementById('newChecklistInput');
        const deleteChecklistBtn = document.getElementById('deleteChecklistBtn');

        addItemBtn.addEventListener('click', () => this.addItem());
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addItem();
            }
        });

        addChecklistBtn.addEventListener('click', () => this.createChecklist());
        newChecklistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createChecklist();
            }
        });

        deleteChecklistBtn.addEventListener('click', () => this.deleteChecklist());
    }

    createChecklist() {
        const input = document.getElementById('newChecklistInput');
        const name = input.value.trim();

        if (name === '') {
            alert('Please enter a checklist name!');
            return;
        }

        if (this.data.checklists[name]) {
            alert('A checklist with this name already exists!');
            return;
        }

        this.data.checklists[name] = [];
        this.saveData();
        this.renderChecklistTabs();
        this.switchChecklist(name);
        input.value = '';
        input.focus();
    }

    deleteChecklist() {
        if (!this.currentChecklist) return;

        if (confirm(`Are you sure you want to delete "${this.currentChecklist}"? This will delete all tasks in this checklist.`)) {
            delete this.data.checklists[this.currentChecklist];
            this.saveData();

            const checklistNames = Object.keys(this.data.checklists);
            if (checklistNames.length > 0) {
                this.switchChecklist(checklistNames[0]);
            } else {
                this.currentChecklist = null;
                document.getElementById('currentChecklistName').textContent = 'Select a checklist';
                document.getElementById('deleteChecklistBtn').style.display = 'none';
                document.getElementById('checklistItems').innerHTML = `
                    <div class="empty-state">
                        <p>📝 Create your first checklist above!</p>
                    </div>
                `;
                document.getElementById('statsText').textContent = '0 tasks total';
            }

            this.renderChecklistTabs();
        }
    }

    renderChecklistTabs() {
        const tabsContainer = document.getElementById('checklistTabs');
        const checklistNames = Object.keys(this.data.checklists);

        if (checklistNames.length === 0) {
            tabsContainer.innerHTML = `
                <div class="no-checklists-message">
                    <p>Create your first checklist above to get started!</p>
                </div>
            `;
            return;
        }

        tabsContainer.innerHTML = checklistNames.map(name => `
            <button
                class="tab-button ${name === this.currentChecklist ? 'active' : ''}"
                onclick="app.switchChecklist('${this.escapeHtml(name)}')"
            >
                ${this.escapeHtml(name)}
            </button>
        `).join('');
    }

    switchChecklist(checklistName) {
        this.currentChecklist = checklistName;
        document.getElementById('currentChecklistName').textContent = checklistName;
        document.getElementById('deleteChecklistBtn').style.display = 'inline-block';
        this.renderChecklistTabs();
        this.renderChecklist();
        this.updateStats();
    }

    addItem() {
        if (!this.currentChecklist) {
            alert('Please create or select a checklist first!');
            return;
        }

        const input = document.getElementById('newItemInput');
        const text = input.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        const newItem = {
            id: Date.now(),
            text: text,
            completed: false
        };

        this.data.checklists[this.currentChecklist].push(newItem);
        this.saveData();
        this.renderChecklist();
        this.updateStats();
        input.value = '';
        input.focus();
    }

    deleteItem(id) {
        this.data.checklists[this.currentChecklist] = this.data.checklists[this.currentChecklist].filter(
            item => item.id !== id
        );
        this.saveData();
        this.renderChecklist();
        this.updateStats();
    }

    toggleItem(id) {
        const item = this.data.checklists[this.currentChecklist].find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveData();
            this.renderChecklist();
            this.updateStats();
        }
    }

    renderChecklist() {
        const container = document.getElementById('checklistItems');

        if (!this.currentChecklist) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 Create a checklist to get started!</p>
                </div>
            `;
            return;
        }

        const items = this.data.checklists[this.currentChecklist] || [];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 No tasks yet!</p>
                    <p style="font-size: 0.9rem; color: #bbb;">Add your first task above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="checklist-item ${item.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    id="item-${item.id}"
                    ${item.completed ? 'checked' : ''}
                    onchange="app.toggleItem(${item.id})"
                />
                <label for="item-${item.id}">${this.escapeHtml(item.text)}</label>
                <button class="delete-btn" onclick="app.deleteItem(${item.id})">Delete</button>
            </div>
        `).join('');
    }

    updateStats() {
        if (!this.currentChecklist) {
            document.getElementById('statsText').textContent = '0 tasks total';
            return;
        }

        const items = this.data.checklists[this.currentChecklist] || [];
        const total = items.length;
        const completed = items.filter(item => item.completed).length;
        const remaining = total - completed;

        const statsText = document.getElementById('statsText');
        if (total === 0) {
            statsText.textContent = '0 tasks total';
        } else {
            statsText.textContent = `${total} task${total !== 1 ? 's' : ''} total • ${completed} completed • ${remaining} remaining`;
        }
    }

    saveData() {
        localStorage.setItem('kitchenChecklistData', JSON.stringify(this.data));
    }

    loadData() {
        const saved = localStorage.getItem('kitchenChecklistData');
        if (saved) {
            const data = JSON.parse(saved);
            // Migrate old data format to new format
            if (!data.checklists) {
                return {
                    checklists: data
                };
            }
            return data;
        }
        return {
            checklists: {}
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new KitchenChecklistApp();
