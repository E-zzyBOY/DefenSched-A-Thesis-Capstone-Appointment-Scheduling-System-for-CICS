/**
 * DefenSched — System Logic
 * Handles: SPA navigation, role switching, mock validation, and UI interactions.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // 0. GOOGLE OAUTH ERROR HANDLER
    // Show error banner if redirected back with ?googleError= in URL
    // ============================================================
    const urlParams = new URLSearchParams(window.location.search);
    const googleError = urlParams.get('googleError');
    if (googleError) {
        const banner = document.getElementById('google-error-banner');
        const text   = document.getElementById('google-error-text');
        if (banner && text) {
            text.textContent = decodeURIComponent(googleError);
            banner.style.display = 'flex';
        }
        // Clean the URL so the error doesn't persist on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ============================================================
    // 1. STATE & MOCK DATA
    // ============================================================
    
    let currentState = {
        role: null,
        user: { name: 'Dr. Maria Clara', email: 'm.clara@cics.edu.ph' },
        currentPanel: 'dashboard'
    };

    const ROLES = {
        admin: {
            label: 'Research Coordinator',
            nav: [
                { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
                { id: 'scheduling', icon: 'fa-calendar-plus', label: 'Global Schedules' },
                { id: 'faculty', icon: 'fa-users-gear', label: 'Manage Faculty' },
                { id: 'honoraria', icon: 'fa-file-invoice-dollar', label: 'Honoraria' },
                { id: 'reports', icon: 'fa-file-lines', label: 'System Logs' }
            ]
        },
        faculty: {
            label: 'Adviser & Panelist',
            nav: [
                { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
                { id: 'faculty', icon: 'fa-clock', label: 'My Availability' },
                { id: 'scheduling', icon: 'fa-calendar-check', label: 'Assigned Sessions' },
                { id: 'honoraria', icon: 'fa-wallet', label: 'My Honoraria' }
            ]
        },
        student: {
            label: 'Thesis Student',
            nav: [
                { id: 'dashboard', icon: 'fa-chart-line', label: 'Overview' },
                { id: 'scheduling', icon: 'fa-calendar-plus', label: 'Book Defense' },
                { id: 'manuscript', icon: 'fa-file-upload', label: 'Submit Manuscript' }
            ]
        }
    };

    // ============================================================
    // 2. DOM ELEMENTS
    // ============================================================
    
    const body = document.body;
    const loginScreen = document.getElementById('login-screen');
    const mainLayout = document.getElementById('main-layout');
    const loginForm = document.getElementById('login-form');
    const roleCards = document.querySelectorAll('.role-card');
    const backToRolesBtn = document.getElementById('back-to-roles');
    const roleSelectionArea = document.querySelector('.role-selection');
    
    const navLinksList = document.getElementById('nav-links');
    const panels = document.querySelectorAll('.panel');
    const panelTitle = document.getElementById('current-panel-title');
    
    const userRoleLabel = document.getElementById('user-role-label');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    
    const notifToggle = document.getElementById('notif-toggle');
    const notifDropdown = document.getElementById('notif-dropdown');
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.querySelector('.sidebar');

    // ============================================================
    // 3. AUTHENTICATION / ROLE SELECTION
    // ============================================================

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            const role = card.dataset.role;
            currentState.role = role;
            
            // Show login form
            roleSelectionArea.classList.add('hidden');
            loginForm.classList.remove('hidden');
            
            // Update button text for context
            loginForm.querySelector('.btn-primary').textContent = `SIGN IN AS ${role.toUpperCase()}`;
        });
    });

    backToRolesBtn.addEventListener('click', () => {
        roleSelectionArea.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        
        // Mock Auth
        loginScreen.classList.add('hidden');
        mainLayout.classList.remove('hidden');
        body.classList.remove('pre-auth');
        
        initDashboard(currentState.role);
        showToast(`Welcome back, ${currentState.role}!`, 'success');
    });

    logoutBtn.addEventListener('click', () => {
        location.reload(); // Simple way to reset state
    });

    // ============================================================
    // 4. NAVIGATION & PANEL CONTROL
    // ============================================================

    function initDashboard(role) {
        const config = ROLES[role];
        userRoleLabel.textContent = config.label;
        userNameDisplay.textContent = role === 'student' ? 'Group Alpha' : 'Dr. Maria Clara';
        
        // Build Sidebar
        navLinksList.innerHTML = '';
        config.nav.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `nav-link ${index === 0 ? 'active' : ''}`;
            li.innerHTML = `<i class="fas ${item.icon}"></i> <span>${item.label}</span>`;
            li.addEventListener('click', () => switchPanel(item.id, li));
            navLinksList.appendChild(li);
        });

        switchPanel('dashboard');
        renderCalendar();
    }

    function switchPanel(panelId, navEl = null) {
        // Update Nav UI
        if (navEl) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            navEl.classList.add('active');
        }

        // Update Panels Visibility
        panels.forEach(p => {
            p.classList.remove('active');
            if (p.id === `panel-${panelId}`) p.classList.add('active');
        });

        // Update Title
        const activeNav = ROLES[currentState.role].nav.find(n => n.id === panelId);
        panelTitle.textContent = activeNav ? activeNav.label : 'Dashboard';
        
        // Close mobile sidebar if open
        sidebar.classList.remove('open');
    }

    // ============================================================
    // 5. UI COMPONENTS
    // ============================================================

    // Notifications
    notifToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => notifDropdown.classList.add('hidden'));

    // Mobile Sidebar
    mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
    });

    // Mock Toast
    function showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: var(--navy-dark); color: white; padding: 1rem 1.5rem; 
            border-radius: 8px; margin-top: 10px; box-shadow: var(--shadow-md);
            animation: slideIn 0.3s ease-out; position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        `;
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Calendar Generation
    function renderCalendar() {
        const cal = document.getElementById('dashboard-calendar');
        if (!cal) return;
        
        cal.innerHTML = '';
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(d => cal.innerHTML += `<div class="cal-day header">${d}</div>`);
        
        for (let i = 1; i <= 30; i++) {
            const isToday = i === 28;
            const hasEvent = [5, 12, 19, 25].includes(i);
            cal.innerHTML += `
                <div class="cal-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">
                    ${i}
                </div>
            `;
        }
    }

    // ============================================================
    // 6. SCHEDULING LOGIC (Mock)
    // ============================================================

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('input', () => {
            const inputs = bookingForm.querySelectorAll('input, select');
            let filledCount = 0;
            inputs.forEach(input => { if (input.value) filledCount++; });
            
            // Quadruple-Check Simulation
            const vAdviser = document.getElementById('val-adviser');
            const vPanel = document.getElementById('val-panel');
            const vVenue = document.getElementById('val-venue');
            const vRules = document.getElementById('val-rules');
            const confirmBtn = document.getElementById('confirm-booking');
            const conflictAlert = document.getElementById('conflict-warning');

            if (filledCount >= 1) vAdviser.classList.add('checked');
            if (filledCount >= 2) vPanel.classList.add('checked');
            if (filledCount >= 3) vVenue.classList.add('checked');
            if (filledCount >= 4) {
                vRules.classList.add('checked');
                confirmBtn.disabled = false;
                conflictAlert.classList.add('hidden');
            } else {
                confirmBtn.disabled = true;
            }

            // Demo Conflict
            if (filledCount === 3) conflictAlert.classList.remove('hidden');
        });

        document.getElementById('confirm-booking').addEventListener('click', () => {
            showToast('Appointment successfully confirmed!', 'success');
            switchPanel('dashboard');
        });
    }

    // ============================================================
    // 7. DRAG AND DROP (Mock)
    // ============================================================
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', () => {
            dropZone.classList.remove('drag-over');
            showToast('Manuscript uploaded successfully!', 'success');
        });
    }

    // ============================================================
    // 8. CLOCK
    // ============================================================
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = timeStr;
    }
    setInterval(updateClock, 60000);
    updateClock();

});
