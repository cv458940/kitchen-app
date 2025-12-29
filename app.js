class KitchenChecklistApp {
    constructor() {
        this.currentCategory = 'cleaning';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderChecklist();
        this.updateStats();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addItemBtn');
        const newItemInput = document.getElementById('newItemInput');
        const tabButtons = document.querySelectorAll('.tab-button');

        addBtn.addEventListener('click', () => this.addItem());
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addItem();
            }
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
                this.updateActiveTab(e.target);
            });
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.renderChecklist();
        this.updateStats();
    }

    updateActiveTab(activeButton) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    addItem() {
        const input = document.getElementById('newItemInput');
        const text = input.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        if (!this.data[this.currentCategory]) {
            this.data[this.currentCategory] = [];
        }

        const newItem = {
            id: Date.now(),
            text: text,
            completed: false
        };

        this.data[this.currentCategory].push(newItem);
        this.saveData();
        this.renderChecklist();
        this.updateStats();
        input.value = '';
        input.focus();
    }

    deleteItem(id) {
        this.data[this.currentCategory] = this.data[this.currentCategory].filter(
            item => item.id !== id
        );
        this.saveData();
        this.renderChecklist();
        this.updateStats();
    }

    toggleItem(id) {
        const item = this.data[this.currentCategory].find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveData();
            this.renderChecklist();
            this.updateStats();
        }
    }

    renderChecklist() {
        const container = document.getElementById('checklistItems');
        const items = this.data[this.currentCategory] || [];

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
        const items = this.data[this.currentCategory] || [];
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
        return saved ? JSON.parse(saved) : {
            cleaning: [],
            inventory: [],
            mealprep: [],
            shopping: []
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new KitchenChecklistApp();
