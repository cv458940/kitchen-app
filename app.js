// Initialize Supabase client
const SUPABASE_URL = 'https://qotwmbeawwxlmbzuhazt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHdtYmVhd3d4bG1ienVoYXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzM0NzMsImV4cCI6MjA4MjU0OTQ3M30.v9w7LxV-JdTmi5zWdoyf4otcpcnAT7UGkn6NXIlqAo0';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class KitchenListsApp {
    constructor() {
        this.currentUser = null;
        this.currentChecklist = null;
        this.selectedEmployee = 'all';
        this.users = [];
        this.checklists = [];
        this.tasks = [];
        this.init();
    }

    async init() {
        try {
            // Load initial data
            await this.loadUsers();
            this.setupEventListeners();
            this.showLoginScreen();
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize app. Please refresh the page.');
        }
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

    // ============================================
    // DATABASE OPERATIONS
    // ============================================

    async loadUsers() {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('username');

        if (error) {
            console.error('Error loading users:', error);
            this.users = [];
        } else {
            this.users = data || [];
        }
    }

    async loadChecklists(ownerId = null) {
        let query = supabaseClient
            .from('checklists')
            .select('*')
            .order('name');

        if (ownerId) {
            query = query.eq('owner_id', ownerId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading checklists:', error);
            this.checklists = [];
        } else {
            this.checklists = data || [];
        }
    }

    async loadTasks(checklistId) {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('checklist_id', checklistId)
            .order('position');

        if (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        } else {
            this.tasks = data || [];
        }
    }

    // ============================================
    // LOGIN / LOGOUT
    // ============================================

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        this.populateUserSelect();
    }

    populateUserSelect() {
        const select = document.getElementById('userSelect');
        select.innerHTML = '<option value="">-- Select User --</option>';

        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.username} (${user.role})`;
            select.appendChild(option);
        });
    }

    handleUserSelection(e) {
        const userId = e.target.value;
        const passwordSection = document.getElementById('passwordSection');
        const passwordInput = document.getElementById('passwordInput');

        if (userId) {
            const user = this.users.find(u => u.id === userId);
            // Show password field for admin/manager users
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

    async login() {
        const userId = document.getElementById('userSelect').value;
        if (!userId) {
            alert('Please select a user!');
            return;
        }

        const user = this.users.find(u => u.id === userId);

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
            document.getElementById('employeeFilter').style.display = 'flex';
            this.populateEmployeeSelect();
        } else {
            document.getElementById('managerControls').style.display = 'none';
            document.getElementById('employeeFilter').style.display = 'none';
        }

        await this.loadChecklists();
        this.renderChecklistTabs();
        this.updateUIPermissions();
    }

    updateUIPermissions() {
        const isManagerOrAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'manager';

        // Show/hide task creation section
        const addItemSection = document.querySelector('.add-item-section');
        if (addItemSection) {
            addItemSection.style.display = isManagerOrAdmin ? 'flex' : 'none';
        }

        // Show/hide checklist creation section
        const checklistManager = document.querySelector('.checklist-manager');
        if (checklistManager) {
            checklistManager.style.display = isManagerOrAdmin ? 'block' : 'none';
        }

        // Show/hide delete checklist button
        const deleteChecklistBtn = document.getElementById('deleteChecklistBtn');
        if (deleteChecklistBtn && !isManagerOrAdmin) {
            deleteChecklistBtn.style.display = 'none';
        }
    }

    logout() {
        this.currentUser = null;
        this.currentChecklist = null;
        this.selectedEmployee = 'all';
        this.checklists = [];
        this.tasks = [];
        this.showLoginScreen();
    }

    // ============================================
    // EMPLOYEE FILTER
    // ============================================

    populateEmployeeSelect() {
        const select = document.getElementById('employeeSelect');
        select.innerHTML = '<option value="all">All</option>';

        // Add current user (manager/admin) as first option
        const myOption = document.createElement('option');
        myOption.value = this.currentUser.id;
        myOption.textContent = `${this.currentUser.username} (Me)`;
        select.appendChild(myOption);

        // Add all employees
        this.users
            .filter(u => u.role === 'employee')
            .forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.username;
                select.appendChild(option);
            });
    }

    // ============================================
    // CHECKLIST MANAGEMENT
    // ============================================

    async createChecklist() {
        const input = document.getElementById('newChecklistInput');
        const name = input.value.trim();

        if (name === '') {
            alert('Please enter a checklist name!');
            return;
        }

        // Determine owner based on selected employee filter
        let ownerId = this.currentUser.id;
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'manager') {
            if (this.selectedEmployee !== 'all') {
                ownerId = this.selectedEmployee;
            }
        }

        // Check if checklist already exists
        const existing = this.checklists.find(c =>
            c.owner_id === ownerId && c.name === name
        );

        if (existing) {
            alert('A checklist with this name already exists!');
            return;
        }

        const { data, error } = await supabaseClient
            .from('checklists')
            .insert([{ name, owner_id: ownerId }])
            .select()
            .single();

        if (error) {
            console.error('Error creating checklist:', error);
            alert('Failed to create checklist. Please try again.');
            return;
        }

        await this.loadChecklists();
        this.renderChecklistTabs();
        await this.switchChecklist(data.id);
        input.value = '';
        input.focus();
    }

    async deleteChecklist() {
        if (!this.currentChecklist) return;

        const checklistName = this.checklists.find(c => c.id === this.currentChecklist)?.name;

        if (confirm(`Are you sure you want to delete "${checklistName}"? This will delete all tasks in this checklist.`)) {
            const { error } = await supabaseClient
                .from('checklists')
                .delete()
                .eq('id', this.currentChecklist);

            if (error) {
                console.error('Error deleting checklist:', error);
                alert('Failed to delete checklist. Please try again.');
                return;
            }

            await this.loadChecklists();
            const availableChecklists = this.getAvailableChecklists();

            if (availableChecklists.length > 0) {
                await this.switchChecklist(availableChecklists[0].id);
            } else {
                this.currentChecklist = null;
                this.tasks = [];
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
        // For employees, show only their own checklists
        if (this.currentUser.role === 'employee') {
            return this.checklists.filter(c => c.owner_id === this.currentUser.id);
        }

        // For managers/admins, filter based on selected employee
        if (this.selectedEmployee === 'all') {
            // Show all checklists (manager's own + all employees')
            return this.checklists;
        } else {
            // Show checklists for the selected user only
            return this.checklists.filter(c => c.owner_id === this.selectedEmployee);
        }
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
            const isActive = this.currentChecklist === checklist.id;
            const owner = this.users.find(u => u.id === checklist.owner_id);

            // Always show owner name for managers/admins when viewing all or multiple users
            const isManagerOrAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'manager';
            const showOwner = isManagerOrAdmin && this.selectedEmployee === 'all';
            const displayName = showOwner ?
                `${owner?.username || 'Unknown'} - ${checklist.name}` : checklist.name;

            return `
                <button
                    class="tab-button ${isActive ? 'active' : ''}"
                    onclick="app.switchChecklist('${checklist.id}')"
                >
                    ${this.escapeHtml(displayName)}
                </button>
            `;
        }).join('');
    }

    async switchChecklist(checklistId) {
        this.currentChecklist = checklistId;
        const checklist = this.checklists.find(c => c.id === checklistId);

        if (!checklist) return;

        const owner = this.users.find(u => u.id === checklist.owner_id);
        const isManagerOrAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'manager';
        const showOwner = isManagerOrAdmin && this.selectedEmployee === 'all';
        const displayName = showOwner
            ? `${owner?.username || 'Unknown'} - ${checklist.name}`
            : checklist.name;

        document.getElementById('currentChecklistName').textContent = displayName;
        document.getElementById('deleteChecklistBtn').style.display = isManagerOrAdmin ? 'inline-block' : 'none';

        this.renderChecklistTabs();
        await this.loadTasks(checklistId);
        this.renderChecklist();
        this.updateStats();
        this.updateUIPermissions();
    }

    // ============================================
    // TASK MANAGEMENT
    // ============================================

    async addItem() {
        if (!this.currentChecklist) {
            alert('Please create or select a checklist first!');
            return;
        }

        const input = document.getElementById('newItemInput');
        const text = input.value.trim();
        const taskType = document.getElementById('taskTypeSelect').value;

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        const position = this.tasks.length;

        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([{
                checklist_id: this.currentChecklist,
                text: text,
                type: taskType,
                value: null,
                completed: false,
                completed_at: null,
                completed_by: null,
                comment: '',
                position: position
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
            return;
        }

        await this.loadTasks(this.currentChecklist);
        this.renderChecklist();
        this.updateStats();
        input.value = '';
        input.focus();
    }

    async deleteItem(id) {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
            return;
        }

        await this.loadTasks(this.currentChecklist);
        this.renderChecklist();
        this.updateStats();
    }

    async toggleItem(id) {
        const task = this.tasks.find(t => t.id === id);

        if (task && task.type === 'checkbox') {
            const newCompleted = !task.completed;
            const updateData = {
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null,
                completed_by: newCompleted ? this.currentUser.id : null
            };

            const { error } = await supabaseClient
                .from('tasks')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error toggling task:', error);
                alert('Failed to update task. Please try again.');
                return;
            }

            await this.loadTasks(this.currentChecklist);
            this.renderChecklist();
            this.updateStats();
        }
    }

    async updateTaskValue(id, value) {
        const task = this.tasks.find(t => t.id === id);

        if (task && (task.type === 'temperature' || task.type === 'text')) {
            const hasValue = value && value.trim() !== '';
            const updateData = {
                value: value,
                completed_at: hasValue ? new Date().toISOString() : null,
                completed_by: hasValue ? this.currentUser.id : null
            };

            const { error } = await supabaseClient
                .from('tasks')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating task value:', error);
                return;
            }

            await this.loadTasks(this.currentChecklist);
            this.updateStats();
        }
    }

    async updateTaskComment(id, comment) {
        const { error } = await supabaseClient
            .from('tasks')
            .update({ comment })
            .eq('id', id);

        if (error) {
            console.error('Error updating task comment:', error);
            return;
        }

        // Update local cache without reloading
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.comment = comment;
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

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 No tasks yet!</p>
                    <p style="font-size: 0.9rem; color: #bbb;">Add your first task above</p>
                </div>
            `;
            return;
        }

        const isManagerOrAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'manager';

        container.innerHTML = this.tasks.map(item => {
            let timestampHTML = '';
            const hasValue = item.type === 'checkbox' ? item.completed : (item.value && item.value.trim() !== '');

            if (hasValue && item.completed_at) {
                const date = new Date(item.completed_at);
                const timeStr = date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
                const completedByUser = this.users.find(u => u.id === item.completed_by);
                const completedByName = completedByUser?.username || 'Unknown';
                timestampHTML = `<span class="task-timestamp">✓ ${timeStr} by ${completedByName}</span>`;
            }

            let taskInputHTML = '';

            if (item.type === 'checkbox') {
                taskInputHTML = `
                    <input
                        type="checkbox"
                        id="item-${item.id}"
                        ${item.completed ? 'checked' : ''}
                        onchange="app.toggleItem('${item.id}')"
                    />
                    <label for="item-${item.id}">
                        ${this.escapeHtml(item.text)}
                        ${timestampHTML}
                    </label>
                `;
            } else if (item.type === 'temperature') {
                taskInputHTML = `
                    <span style="flex: 1;">
                        ${this.escapeHtml(item.text)}:
                        <input
                            type="number"
                            class="task-input temperature"
                            value="${item.value || ''}"
                            placeholder="°F"
                            onchange="app.updateTaskValue('${item.id}', this.value)"
                            onblur="app.updateTaskValue('${item.id}', this.value)"
                        />
                        <span class="task-label">°F</span>
                        ${timestampHTML}
                    </span>
                `;
            } else if (item.type === 'text') {
                taskInputHTML = `
                    <span style="flex: 1;">
                        ${this.escapeHtml(item.text)}:
                        <input
                            type="text"
                            class="task-input text"
                            value="${this.escapeHtml(item.value || '')}"
                            placeholder="Enter value..."
                            onchange="app.updateTaskValue('${item.id}', this.value)"
                            onblur="app.updateTaskValue('${item.id}', this.value)"
                        />
                        ${timestampHTML}
                    </span>
                `;
            }

            const deleteButtonHTML = isManagerOrAdmin ?
                `<button class="delete-btn" onclick="app.deleteItem('${item.id}')">Delete</button>` : '';

            const commentHTML = `
                <div class="task-comment-section">
                    <input
                        type="text"
                        class="task-comment-input"
                        value="${this.escapeHtml(item.comment || '')}"
                        placeholder="Add comment..."
                        onchange="app.updateTaskComment('${item.id}', this.value)"
                        onblur="app.updateTaskComment('${item.id}', this.value)"
                    />
                </div>
            `;

            return `
                <div class="checklist-item ${item.completed ? 'completed' : ''}">
                    ${taskInputHTML}
                    ${deleteButtonHTML}
                </div>
                ${commentHTML}
            `;
        }).join('');
    }

    updateStats() {
        if (!this.currentChecklist) {
            document.getElementById('statsText').textContent = '0 tasks total';
            return;
        }

        const total = this.tasks.length;

        // Count completed based on task type
        const completed = this.tasks.filter(item => {
            if (item.type === 'checkbox') {
                return item.completed;
            } else {
                return item.value && item.value.trim() !== '';
            }
        }).length;

        const remaining = total - completed;

        const statsText = document.getElementById('statsText');
        if (total === 0) {
            statsText.textContent = '0 tasks total';
        } else {
            statsText.textContent = `${total} task${total !== 1 ? 's' : ''} total • ${completed} completed • ${remaining} remaining`;
        }
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    async openUserModal() {
        document.getElementById('userModal').style.display = 'flex';
        await this.loadUsers();
        this.renderUserList();
    }

    closeUserModal() {
        document.getElementById('userModal').style.display = 'none';
    }

    async addUser() {
        const usernameInput = document.getElementById('newUsername');
        const username = usernameInput.value.trim();
        const role = document.getElementById('newUserRole').value;
        const passwordInput = document.getElementById('newUserPassword');

        if (username === '') {
            alert('Please enter a name!');
            return;
        }

        if (this.users.find(u => u.username === username)) {
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

        const { error } = await supabaseClient
            .from('users')
            .insert([newUser]);

        if (error) {
            console.error('Error adding user:', error);
            alert('Failed to add user. Please try again.');
            return;
        }

        await this.loadUsers();
        this.renderUserList();
        this.populateUserSelect();
        this.populateEmployeeSelect();

        // Reset form
        usernameInput.value = '';
        passwordInput.value = '';
        passwordInput.style.display = 'none';
        document.getElementById('newUserRole').value = 'employee';
    }

    async deleteUser(userId) {
        if (userId === this.currentUser.id) {
            alert('You cannot delete yourself!');
            return;
        }

        const user = this.users.find(u => u.id === userId);
        if (user.role === 'admin') {
            alert('Cannot delete admin accounts!');
            return;
        }

        const userType = user.role === 'manager' ? 'manager' : 'employee';
        if (confirm(`Are you sure you want to delete ${userType} "${user.username}"? This will also delete all their checklists.`)) {
            const { error } = await supabaseClient
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user. Please try again.');
                return;
            }

            await this.loadUsers();
            this.renderUserList();
            this.populateUserSelect();
            this.populateEmployeeSelect();

            // Reload checklists since user's checklists were deleted
            await this.loadChecklists();
            this.renderChecklistTabs();
        }
    }

    renderUserList() {
        const container = document.getElementById('userList');

        // Show all users except admins
        const nonAdminUsers = this.users.filter(u => u.role !== 'admin');

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
                <button class="delete-user-btn" onclick="app.deleteUser('${user.id}')">Delete</button>
            </div>
        `).join('');
    }

    // ============================================
    // UTILITIES
    // ============================================

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const app = new KitchenListsApp();
