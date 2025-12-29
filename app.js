class KitchenListsApp {
    constructor() {
        this.currentUser = null;
        this.currentChecklist = null;
        this.viewMode = 'myLists'; // 'myLists' or 'employeeLists'
        this.selectedEmployee = 'all';
        this.data = this.loadData();
        this.init();
    }

    init() {
        // Initialize default admin user if none exist
        if (!this.data.users || this.data.users.length === 0) {
            this.data.users = [
                { username: 'Admin', role: 'admin', password: 'password' }
            ];
            this.saveData();
        }

        // Ensure admin user exists (migration)
        const adminExists = this.data.users.find(u => u.role === 'admin');
        if (!adminExists) {
            this.data.users.push({ username: 'Admin', role: 'admin', password: 'password' });
            this.saveData();
        }

        this.setupEventListeners();
        this.showLoginScreen();
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('userSelect').addEventListener('change', (e) => this.handleUserSelection(e));
        document.getElementById('userSelect').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Checklist management
        document.getElementById('addItemBtn').addEventListener('click', () => this.addItem());
        document.getElementById('newItemInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        document.getElementById('addChecklistBtn').addEventListener('click', () => this.createChecklist());
        document.getElementById('newChecklistInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createChecklist();
        });

        document.getElementById('deleteChecklistBtn').addEventListener('click', () => this.deleteChecklist());

        // Manager controls
        document.getElementById('myListsBtn').addEventListener('click', () => this.switchView('myLists'));
        document.getElementById('employeeListsBtn').addEventListener('click', () => this.switchView('employeeLists'));
        document.getElementById('manageUsersBtn').addEventListener('click', () => this.openUserModal());

        // Employee filter
        document.getElementById('employeeSelect').addEventListener('change', (e) => {
            this.selectedEmployee = e.target.value;
            this.renderChecklistTabs();
            this.currentChecklist = null;
            this.renderChecklist();
        });

        // User management modal
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeUserModal());
        document.getElementById('addUserBtn').addEventListener('click', () => this.addUser());
        document.getElementById('newUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addUser();
        });
        document.getElementById('newUserRole').addEventListener('change', (e) => {
            const passwordField = document.getElementById('newUserPassword');
            if (e.target.value === 'manager') {
                passwordField.style.display = 'block';
            } else {
                passwordField.style.display = 'none';
                passwordField.value = '';
            }
        });
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        this.populateUserSelect();
    }

    populateUserSelect() {
        const select = document.getElementById('userSelect');
        select.innerHTML = '<option value="">-- Select User --</option>';

        this.data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.username} (${user.role})`;
            select.appendChild(option);
        });
    }

    handleUserSelection(e) {
        const username = e.target.value;
        const passwordSection = document.getElementById('passwordSection');
        const passwordInput = document.getElementById('passwordInput');

        if (username) {
            const user = this.data.users.find(u => u.username === username);
            // Show password field for admin users
            if (user && (user.role === 'admin' || user.role === 'manager')) {
                passwordSection.style.display = 'block';
                passwordInput.focus();
            } else {
                passwordSection.style.display = 'none';
                passwordInput.value = '';
            }
        } else {
            passwordSection.style.display = 'none';
            passwordInput.value = '';
        }
    }

    login() {
        const username = document.getElementById('userSelect').value;
        if (!username) {
            alert('Please select a user!');
            return;
        }

        const user = this.data.users.find(u => u.username === username);

        // Check password for admin/manager users
        if (user && (user.role === 'admin' || user.role === 'manager')) {
            const password = document.getElementById('passwordInput').value;
            if (!password) {
                alert('Please enter your password!');
                return;
            }
            if (user.password !== password) {
                alert('Incorrect password!');
                return;
            }
        }

        this.currentUser = user;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        // Clear password field
        document.getElementById('passwordInput').value = '';

        // Update welcome message
        document.getElementById('userWelcome').textContent =
            `Welcome, ${this.currentUser.username} (${this.currentUser.role})`;

        // Show manager controls if admin or manager
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'manager') {
            document.getElementById('managerControls').style.display = 'block';
            this.populateEmployeeSelect();
        } else {
            document.getElementById('managerControls').style.display = 'none';
        }

        this.viewMode = 'myLists';
        this.renderChecklistTabs();
    }

    logout() {
        this.currentUser = null;
        this.currentChecklist = null;
        this.viewMode = 'myLists';
        this.showLoginScreen();
    }

    switchView(mode) {
        this.viewMode = mode;
        this.currentChecklist = null;

        // Update button states
        document.getElementById('myListsBtn').classList.toggle('active', mode === 'myLists');
        document.getElementById('employeeListsBtn').classList.toggle('active', mode === 'employeeLists');

        // Show/hide employee filter
        document.getElementById('employeeFilter').style.display =
            mode === 'employeeLists' ? 'flex' : 'none';

        this.renderChecklistTabs();
        this.renderChecklist();
    }

    populateEmployeeSelect() {
        const select = document.getElementById('employeeSelect');
        select.innerHTML = '<option value="all">All Employees</option>';

        this.data.users
            .filter(u => u.role === 'employee')
            .forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = user.username;
                select.appendChild(option);
            });
    }

    createChecklist() {
        const input = document.getElementById('newChecklistInput');
        const name = input.value.trim();

        if (name === '') {
            alert('Please enter a checklist name!');
            return;
        }

        const owner = this.viewMode === 'myLists' ? this.currentUser.username : this.selectedEmployee;

        if (!this.data.checklists[owner]) {
            this.data.checklists[owner] = {};
        }

        if (this.data.checklists[owner][name]) {
            alert('A checklist with this name already exists!');
            return;
        }

        this.data.checklists[owner][name] = [];
        this.saveData();
        this.renderChecklistTabs();
        this.switchChecklist(owner, name);
        input.value = '';
        input.focus();
    }

    deleteChecklist() {
        if (!this.currentChecklist) return;

        const { owner, name } = this.currentChecklist;

        if (confirm(`Are you sure you want to delete "${name}"? This will delete all tasks in this checklist.`)) {
            delete this.data.checklists[owner][name];
            this.saveData();

            const availableChecklists = this.getAvailableChecklists();
            if (availableChecklists.length > 0) {
                const first = availableChecklists[0];
                this.switchChecklist(first.owner, first.name);
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

    getAvailableChecklists() {
        const checklists = [];

        if (this.viewMode === 'myLists') {
            // Show only current user's checklists
            const userChecklists = this.data.checklists[this.currentUser.username] || {};
            Object.keys(userChecklists).forEach(name => {
                checklists.push({ owner: this.currentUser.username, name });
            });
        } else {
            // Show employee checklists (manager view)
            if (this.selectedEmployee === 'all') {
                this.data.users
                    .filter(u => u.role === 'employee')
                    .forEach(user => {
                        const userChecklists = this.data.checklists[user.username] || {};
                        Object.keys(userChecklists).forEach(name => {
                            checklists.push({ owner: user.username, name });
                        });
                    });
            } else {
                const userChecklists = this.data.checklists[this.selectedEmployee] || {};
                Object.keys(userChecklists).forEach(name => {
                    checklists.push({ owner: this.selectedEmployee, name });
                });
            }
        }

        return checklists;
    }

    renderChecklistTabs() {
        const tabsContainer = document.getElementById('checklistTabs');
        const checklists = this.getAvailableChecklists();

        if (checklists.length === 0) {
            tabsContainer.innerHTML = `
                <div class="no-checklists-message">
                    <p>Create your first checklist above to get started!</p>
                </div>
            `;
            return;
        }

        tabsContainer.innerHTML = checklists.map(checklist => {
            const isActive = this.currentChecklist &&
                            this.currentChecklist.owner === checklist.owner &&
                            this.currentChecklist.name === checklist.name;
            const displayName = this.viewMode === 'employeeLists' ?
                `${checklist.owner} - ${checklist.name}` : checklist.name;

            return `
                <button
                    class="tab-button ${isActive ? 'active' : ''}"
                    onclick="app.switchChecklist('${this.escapeHtml(checklist.owner)}', '${this.escapeHtml(checklist.name)}')"
                >
                    ${this.escapeHtml(displayName)}
                </button>
            `;
        }).join('');
    }

    switchChecklist(owner, name) {
        this.currentChecklist = { owner, name };
        document.getElementById('currentChecklistName').textContent =
            this.viewMode === 'employeeLists' ? `${owner} - ${name}` : name;
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

        const { owner, name } = this.currentChecklist;

        const newItem = {
            id: Date.now(),
            text: text,
            completed: false,
            completedAt: null,
            completedBy: null
        };

        this.data.checklists[owner][name].push(newItem);
        this.saveData();
        this.renderChecklist();
        this.updateStats();
        input.value = '';
        input.focus();
    }

    deleteItem(id) {
        const { owner, name } = this.currentChecklist;
        this.data.checklists[owner][name] = this.data.checklists[owner][name].filter(
            item => item.id !== id
        );
        this.saveData();
        this.renderChecklist();
        this.updateStats();
    }

    toggleItem(id) {
        const { owner, name } = this.currentChecklist;
        const item = this.data.checklists[owner][name].find(item => item.id === id);

        if (item) {
            item.completed = !item.completed;
            if (item.completed) {
                item.completedAt = new Date().toISOString();
                item.completedBy = this.currentUser.username;
            } else {
                item.completedAt = null;
                item.completedBy = null;
            }
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

        const { owner, name } = this.currentChecklist;
        const items = this.data.checklists[owner][name] || [];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 No tasks yet!</p>
                    <p style="font-size: 0.9rem; color: #bbb;">Add your first task above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            let timestampHTML = '';
            if (item.completed && item.completedAt) {
                const date = new Date(item.completedAt);
                const timeStr = date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
                timestampHTML = `<span class="task-timestamp">✓ ${timeStr} by ${item.completedBy}</span>`;
            }

            return `
                <div class="checklist-item ${item.completed ? 'completed' : ''}">
                    <input
                        type="checkbox"
                        id="item-${item.id}"
                        ${item.completed ? 'checked' : ''}
                        onchange="app.toggleItem(${item.id})"
                    />
                    <label for="item-${item.id}">
                        ${this.escapeHtml(item.text)}
                        ${timestampHTML}
                    </label>
                    <button class="delete-btn" onclick="app.deleteItem(${item.id})">Delete</button>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        if (!this.currentChecklist) {
            document.getElementById('statsText').textContent = '0 tasks total';
            return;
        }

        const { owner, name } = this.currentChecklist;
        const items = this.data.checklists[owner][name] || [];
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

    // User Management
    openUserModal() {
        document.getElementById('userModal').style.display = 'flex';
        this.renderUserList();
    }

    closeUserModal() {
        document.getElementById('userModal').style.display = 'none';
    }

    addUser() {
        const usernameInput = document.getElementById('newUsername');
        const username = usernameInput.value.trim();
        const role = document.getElementById('newUserRole').value;
        const passwordInput = document.getElementById('newUserPassword');

        if (username === '') {
            alert('Please enter a name!');
            return;
        }

        if (this.data.users.find(u => u.username === username)) {
            alert('A user with this name already exists!');
            return;
        }

        const newUser = { username, role };

        // Add password for managers
        if (role === 'manager') {
            const password = passwordInput.value.trim();
            if (!password) {
                alert('Please enter a password for the manager!');
                return;
            }
            newUser.password = password;
        }

        this.data.users.push(newUser);
        this.saveData();
        this.renderUserList();
        this.populateUserSelect();
        this.populateEmployeeSelect();

        // Reset form
        usernameInput.value = '';
        passwordInput.value = '';
        passwordInput.style.display = 'none';
        document.getElementById('newUserRole').value = 'employee';
    }

    deleteUser(username) {
        if (username === this.currentUser.username) {
            alert('You cannot delete yourself!');
            return;
        }

        const user = this.data.users.find(u => u.username === username);
        if (user.role === 'admin') {
            alert('Cannot delete admin accounts!');
            return;
        }

        const userType = user.role === 'manager' ? 'manager' : 'employee';
        if (confirm(`Are you sure you want to delete ${userType} "${username}"? This will also delete all their checklists.`)) {
            this.data.users = this.data.users.filter(u => u.username !== username);
            delete this.data.checklists[username];
            this.saveData();
            this.renderUserList();
            this.populateUserSelect();
            this.populateEmployeeSelect();

            if (this.viewMode === 'employeeLists') {
                this.renderChecklistTabs();
            }
        }
    }

    renderUserList() {
        const container = document.getElementById('userList');

        // Show all users except admins
        const nonAdminUsers = this.data.users.filter(u => u.role !== 'admin');

        if (nonAdminUsers.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No users yet</p>';
            return;
        }

        container.innerHTML = nonAdminUsers.map(user => `
            <div class="user-item">
                <div class="user-item-info">
                    <span>${this.escapeHtml(user.username)}</span>
                    <span class="user-role-badge ${user.role}">${user.role}</span>
                </div>
                <button class="delete-user-btn" onclick="app.deleteUser('${this.escapeHtml(user.username)}')">Delete</button>
            </div>
        `).join('');
    }

    // Data Management
    saveData() {
        localStorage.setItem('kitchenListsData', JSON.stringify(this.data));
    }

    loadData() {
        const saved = localStorage.getItem('kitchenListsData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            users: [],
            checklists: {}
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new KitchenListsApp();
