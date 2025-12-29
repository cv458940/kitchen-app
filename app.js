// Initialize Supabase client
const SUPABASE_URL = 'https://qotwmbeawwxlmbzuhazt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdHdtYmVhd3d4bG1ienVoYXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzM0NzMsImV4cCI6MjA4MjU0OTQ3M30.v9w7LxV-JdTmi5zWdoyf4otcpcnAT7UGkn6NXIlqAo0';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class KitchenListsApp {
    constructor() {
        this.currentUser = null;
        this.currentChecklist = null;
        this.currentView = 'dashboard'; // 'dashboard' or 'checklists'
        this.users = [];
        this.checklists = [];
        this.tasks = [];
        this.lastResetDate = null;
        this.init();
    }

    async init() {
        try {
            // Load initial data
            await this.loadUsers();
            await this.checkAndResetDaily();
            this.setupEventListeners();
            this.showLoginScreen();
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize app. Please refresh the page.');
        }
    }

    async checkAndResetDaily() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Check localStorage for last reset date
        const lastReset = localStorage.getItem('lastResetDate');

        if (lastReset !== todayStr) {
            // It's a new day, reset all tasks
            console.log('New day detected, resetting all tasks...');
            await this.resetAllTasks();
            localStorage.setItem('lastResetDate', todayStr);
        }
    }

    async resetAllTasks() {
        const { error } = await supabaseClient
            .from('tasks')
            .update({
                completed: false,
                value: null,
                completed_at: null,
                completed_by: null
            })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all tasks

        if (error) {
            console.error('Error resetting tasks:', error);
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
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showDashboard());
        document.getElementById('checklistsBtn').addEventListener('click', () => this.showChecklists());
        document.getElementById('manageUsersBtn').addEventListener('click', () => this.openUserModal());

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
            // Show dashboard for managers/admins
            await this.showDashboard();
        } else {
            document.getElementById('managerControls').style.display = 'none';
            // Show checklists for employees
            await this.showChecklists();
        }
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
        this.currentView = 'dashboard';
        this.checklists = [];
        this.tasks = [];
        this.showLoginScreen();
    }

    // ============================================
    // VIEW SWITCHING
    // ============================================

    async showDashboard() {
        this.currentView = 'dashboard';

        // Update button states
        document.getElementById('dashboardBtn').classList.add('active');
        document.getElementById('checklistsBtn').classList.remove('active');

        // Hide checklist view, show dashboard
        document.getElementById('checklistManagementView').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'block';

        // Load and render dashboard data
        await this.loadChecklists();
        await this.loadAllTasks();
        this.renderDashboard();
    }

    async showChecklists() {
        this.currentView = 'checklists';

        // Update button states (only for managers/admins)
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'manager') {
            document.getElementById('dashboardBtn').classList.remove('active');
            document.getElementById('checklistsBtn').classList.add('active');
        }

        // Show checklist view, hide dashboard
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('checklistManagementView').style.display = 'block';

        await this.loadChecklists();
        await this.loadAllTasks(); // Load all tasks to check completion status
        this.renderChecklistTabs();
        this.updateUIPermissions();
    }

    // ============================================
    // DASHBOARD
    // ============================================

    async loadAllTasks() {
        // Load all tasks for all checklists
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*');

        if (error) {
            console.error('Error loading all tasks:', error);
            this.tasks = [];
        } else {
            this.tasks = data || [];
        }
    }

    renderDashboard() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate stats
        const totalChecklists = this.checklists.length;

        // Count checklists that have all tasks completed today
        const checklistCompletionStatus = this.checklists.map(checklist => {
            const checklistTasks = this.tasks.filter(t => t.checklist_id === checklist.id);
            if (checklistTasks.length === 0) return { checklist, allCompleted: false, completedToday: false };

            const allCompleted = checklistTasks.every(task => {
                if (task.type === 'checkbox') {
                    return task.completed;
                } else {
                    return task.value && task.value.trim() !== '';
                }
            });

            const completedToday = checklistTasks.every(task => {
                if (!task.completed_at) return false;
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                return completedDate.getTime() === today.getTime();
            });

            return { checklist, allCompleted: allCompleted && completedToday, completedToday };
        });

        const completedChecklistsToday = checklistCompletionStatus.filter(cs => cs.allCompleted).length;
        const completionPercentage = totalChecklists > 0
            ? Math.round((completedChecklistsToday / totalChecklists) * 100)
            : 0;

        // Get active users (users who completed at least one task today)
        const activeUserIds = new Set();
        this.tasks.forEach(task => {
            if (task.completed_at && task.completed_by) {
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate.getTime() === today.getTime()) {
                    activeUserIds.add(task.completed_by);
                }
            }
        });

        // Update stat cards
        document.getElementById('totalChecklistsCount').textContent = totalChecklists;
        document.getElementById('completedChecklistsCount').textContent = completedChecklistsToday;
        document.getElementById('activeUsersCount').textContent = activeUserIds.size;
        document.getElementById('completionPercentage').textContent = `${completionPercentage}%`;

        // Render stats
        this.renderActiveUserStats(today, checklistCompletionStatus);
        this.renderUserCompletionStats(today);
    }

    renderActiveUserStats(today, checklistCompletionStatus) {
        const container = document.getElementById('activeUserStats');

        // Get users who completed at least one task today
        const activeUserIds = new Set();
        this.tasks.forEach(task => {
            if (task.completed_at && task.completed_by) {
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate.getTime() === today.getTime()) {
                    activeUserIds.add(task.completed_by);
                }
            }
        });

        if (activeUserIds.size === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No users have completed tasks today</p>';
            return;
        }

        // Calculate completion stats for each active user
        const userStats = Array.from(activeUserIds).map(userId => {
            const user = this.users.find(u => u.id === userId);
            if (!user) return null;

            // Count how many checklists this user helped complete today
            const checklistsCompleted = checklistCompletionStatus.filter(cs => {
                if (!cs.completed) return false;

                // Check if this user contributed to this checklist
                const checklistTasks = this.tasks.filter(t => t.checklist_id === cs.checklist.id);
                return checklistTasks.some(task => {
                    if (task.completed_by !== userId) return false;
                    if (!task.completed_at) return false;
                    const completedDate = new Date(task.completed_at);
                    completedDate.setHours(0, 0, 0, 0);
                    return completedDate.getTime() === today.getTime();
                });
            }).length;

            // Count total tasks completed by this user today
            const tasksCompleted = this.tasks.filter(task => {
                if (task.completed_by !== userId) return false;
                if (!task.completed_at) return false;
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                return completedDate.getTime() === today.getTime();
            }).length;

            return {
                user,
                checklistsCompleted,
                tasksCompleted
            };
        }).filter(stat => stat !== null);

        // Sort by checklists completed (descending), then by tasks completed
        userStats.sort((a, b) => {
            if (b.checklistsCompleted !== a.checklistsCompleted) {
                return b.checklistsCompleted - a.checklistsCompleted;
            }
            return b.tasksCompleted - a.tasksCompleted;
        });

        container.innerHTML = userStats.map(stat => {
            return `
                <div class="user-stat-row">
                    <div class="user-stat-info">
                        <span class="user-stat-name">${this.escapeHtml(stat.user.username)}</span>
                        <span class="user-role-badge ${stat.user.role}">${stat.user.role}</span>
                    </div>
                    <div class="user-stat-numbers">
                        <div class="stat-badge checklists">
                            <span class="stat-badge-number">${stat.checklistsCompleted}</span>
                            <span class="stat-badge-label">Checklist${stat.checklistsCompleted !== 1 ? 's' : ''} Completed</span>
                        </div>
                        <div class="stat-badge tasks">
                            <span class="stat-badge-number">${stat.tasksCompleted}</span>
                            <span class="stat-badge-label">Task${stat.tasksCompleted !== 1 ? 's' : ''} Done</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderUserCompletionStats(today) {
        const container = document.getElementById('userCompletionStats');

        if (this.checklists.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No checklists available</p>';
            return;
        }

        // Build completion data for each checklist
        const checklistData = this.checklists.map(checklist => {
            const checklistTasks = this.tasks.filter(t => t.checklist_id === checklist.id);

            if (checklistTasks.length === 0) {
                return { checklist, completed: false, contributors: [], totalTasks: 0, completedTasks: 0 };
            }

            const allCompleted = checklistTasks.every(task => {
                if (task.type === 'checkbox') {
                    return task.completed;
                } else {
                    return task.value && task.value.trim() !== '';
                }
            });

            const completedToday = checklistTasks.every(task => {
                if (!task.completed_at) return false;
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                return completedDate.getTime() === today.getTime();
            });

            // Get unique contributors who completed tasks today
            const contributorIds = new Set();
            checklistTasks.forEach(task => {
                if (task.completed_at) {
                    const completedDate = new Date(task.completed_at);
                    completedDate.setHours(0, 0, 0, 0);
                    if (completedDate.getTime() === today.getTime() && task.completed_by) {
                        contributorIds.add(task.completed_by);
                    }
                }
            });

            const contributors = Array.from(contributorIds).map(id =>
                this.users.find(u => u.id === id)
            ).filter(u => u);

            const completedTasksToday = checklistTasks.filter(task => {
                if (!task.completed_at) return false;
                const completedDate = new Date(task.completed_at);
                completedDate.setHours(0, 0, 0, 0);
                return completedDate.getTime() === today.getTime();
            }).length;

            return {
                checklist,
                completed: allCompleted && completedToday,
                contributors,
                totalTasks: checklistTasks.length,
                completedTasks: completedTasksToday
            };
        });

        // Sort: completed first, then by name
        checklistData.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? -1 : 1;
            return a.checklist.name.localeCompare(b.checklist.name);
        });

        container.innerHTML = checklistData.map(data => {
            const percentage = data.totalTasks > 0
                ? Math.round((data.completedTasks / data.totalTasks) * 100)
                : 0;

            const completionBadge = data.completed
                ? '<span class="completion-badge complete">✓ Complete</span>'
                : `<span class="completion-badge incomplete">${data.completedTasks}/${data.totalTasks} tasks</span>`;

            const contributorsList = data.contributors.length > 0
                ? data.contributors.map(u => `<span class="contributor-badge">${this.escapeHtml(u.username)}</span>`).join(' ')
                : '<span class="no-contributors">No activity today</span>';

            return `
                <div class="checklist-stat-row ${data.completed ? 'completed' : ''}">
                    <div class="checklist-stat-header">
                        <span class="checklist-stat-name">${this.escapeHtml(data.checklist.name)}</span>
                        ${completionBadge}
                    </div>
                    <div class="checklist-stat-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="progress-percentage">${percentage}%</span>
                    </div>
                    <div class="checklist-contributors">
                        <span class="contributors-label">Completed by:</span>
                        ${contributorsList}
                    </div>
                </div>
            `;
        }).join('');
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

        // Check if checklist already exists
        const existing = this.checklists.find(c => c.name === name);

        if (existing) {
            alert('A checklist with this name already exists!');
            return;
        }

        // Create checklist with current user as creator (for tracking only)
        const { data, error } = await supabaseClient
            .from('checklists')
            .insert([{ name, owner_id: this.currentUser.id }])
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
        // Show all checklists to everyone
        return this.checklists;
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

            // Check if checklist is complete
            const checklistTasks = this.tasks.filter(t => t.checklist_id === checklist.id);
            let isComplete = false;

            if (checklistTasks.length > 0) {
                isComplete = checklistTasks.every(task => {
                    if (task.type === 'checkbox') {
                        return task.completed;
                    } else {
                        return task.value && task.value.trim() !== '';
                    }
                });
            }

            const completionIcon = isComplete ? '✓ ' : '';

            return `
                <button
                    class="tab-button ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}"
                    onclick="app.switchChecklist('${checklist.id}')"
                >
                    ${completionIcon}${this.escapeHtml(checklist.name)}
                </button>
            `;
        }).join('');
    }

    async switchChecklist(checklistId) {
        this.currentChecklist = checklistId;
        const checklist = this.checklists.find(c => c.id === checklistId);

        if (!checklist) return;

        document.getElementById('currentChecklistName').textContent = checklist.name;

        const isManagerOrAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'manager';
        document.getElementById('deleteChecklistBtn').style.display = isManagerOrAdmin ? 'inline-block' : 'none';

        await this.loadTasks(checklistId);
        await this.loadAllTasks(); // Reload all tasks to update completion status
        this.renderChecklistTabs();
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
        await this.loadAllTasks(); // Reload all tasks to update completion status
        this.renderChecklistTabs(); // Update tab completion status
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
        await this.loadAllTasks(); // Reload all tasks to update completion status
        this.renderChecklistTabs(); // Update tab completion status
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
            await this.loadAllTasks(); // Reload all tasks to update completion status
            this.renderChecklistTabs(); // Update tab completion status
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
            await this.loadAllTasks(); // Reload all tasks to update completion status
            this.renderChecklistTabs(); // Update tab completion status
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
