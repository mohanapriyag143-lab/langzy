// --- MOCK DATABASE ---
const mockDatabase = {
    students: [
        { id: 1, name: "Mohana Priya", points: 75 },
        { id: 2, name: "Keerthi Varshini", points: 120 },
        { id: 3, name: "Kanimozhi", points: 40 },
        { id: 4, name: "Harnitha", points: 155 },
        { id: 5, name: "Jaya Nandhini", points: 95 },
    ],
    // Simplified activities for this example
    activities: {
        1: ["Joined Coding Club: +10", "Attended Workshop: +15"],
        2: ["Won Debate: +50"],
    },
    milestones: [
        { name: "First 50 Points", threshold: 50 },
        { name: "Century Scorer", threshold: 100 },
        { name: "Project Pro", threshold: 150 },
    ],
    badges: [
        { name: "Initiator", icon: "🚀", threshold: 10 },
        { name: "Contributor", icon: "⭐", threshold: 50 },
        { name: "High-Flyer", icon: "✈️", threshold: 100 },
        { name: "Virtuoso", icon: "🏆", threshold: 150 },
    ],
};

// --- GLOBAL EVENT LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop();

    if (page === 'index.html' || page === '') setupLoginPage();
    else if (page === 'student.html') setupStudentDashboard();
    else if (page === 'mentor.html') setupMentorDashboard();
    else if (page === 'floorwing.html') setupFloorwingDashboard();
    else if (page === 'admin.html') setupAdminDashboard();
    
    // Universal logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});

// --- LOGIN PAGE LOGIC ---
function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.getElementById('role').value;
            // Redirect each role to its own page
            window.location.href = `${role}.html`;
        });
    }
}

// --- STUDENT DASHBOARD ---
function setupStudentDashboard() {
    // For demo, we'll always show the first student
    const student = mockDatabase.students[0]; 
    document.getElementById('student-name').textContent = `Welcome, ${student.name}!`;
    document.getElementById('student-points').textContent = student.points;
    renderLeaderboard();
    renderMilestones(student.points);
    renderBadges(student.points);
    renderActivityLog(student.id);
}

// --- MENTOR DASHBOARD ---
function setupMentorDashboard() {
    renderMentorStudentList();
}

function renderMentorStudentList() {
    const container = document.getElementById('student-list-container');
    container.innerHTML = '';
    // Mentors see all students for this demo
    mockDatabase.students.forEach(student => {
        container.innerHTML += `
            <div class="student-item" data-id="${student.id}">
                <div><strong>${student.name}</strong> - ${student.points} Points</div>
                <form class="points-form">
                    <input type="number" class="points-input" placeholder="Pts" required>
                    <button type="submit" class="btn">Assign</button>
                </form>
            </div>`;
    });
    addPointAssignmentListeners();
}

function addPointAssignmentListeners() {
    document.querySelectorAll('.points-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const studentId = parseInt(e.target.closest('.student-item').dataset.id);
            const pointsToAdd = parseInt(e.target.querySelector('.points-input').value);
            if (!isNaN(pointsToAdd)) {
                const student = mockDatabase.students.find(s => s.id === studentId);
                if (student) {
                    student.points += pointsToAdd;
                    renderMentorStudentList(); // Re-render the list with updated points
                }
            }
        });
    });
}

// --- FLOORWING DASHBOARD ---
function setupFloorwingDashboard() {
    const students = mockDatabase.students;
    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const averagePoints = totalStudents > 0 ? (totalPoints / totalStudents).toFixed(1) : 0;
    const topPerformer = students.sort((a,b) => b.points - a.points)[0];

    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('average-points').textContent = averagePoints;
    document.getElementById('top-performer').textContent = topPerformer ? topPerformer.name : '-';
    
    const tableBody = document.getElementById('all-students-table-body');
    tableBody.innerHTML = '';
    students.forEach(s => {
        tableBody.innerHTML += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.points}</td></tr>`;
    });
}

// --- ADMIN DASHBOARD ---
function setupAdminDashboard() {
    renderUserManagementTable();
    const form = document.getElementById('add-student-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('new-student-name').value;
        const points = parseInt(document.getElementById('initial-points').value);
        const newId = Math.max(...mockDatabase.students.map(s => s.id)) + 1;

        if (name && !isNaN(points)) {
            mockDatabase.students.push({ id: newId, name, points });
            renderUserManagementTable(); // Re-render table with new user
            form.reset(); // Clear the form
        }
    });
}

function renderUserManagementTable() {
    const tableBody = document.getElementById('manage-users-table-body');
    tableBody.innerHTML = '';
    mockDatabase.students.forEach(s => {
        tableBody.innerHTML += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.points}</td></tr>`;
    });
}

// --- SHARED RENDERING FUNCTIONS ---
function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const topStudents = [...mockDatabase.students].sort((a,b) => b.points - a.points).slice(0,3);
    list.innerHTML = '';
    topStudents.forEach((s, i) => {
        list.innerHTML += `<li><span class="rank">${i+1}</span> ${s.name} <span class="points">${s.points} pts</span></li>`;
    });
}

function renderMilestones(points) {
    const container = document.getElementById('milestones-container');
    if (!container) return;
    container.innerHTML = '';
    mockDatabase.milestones.forEach(ms => {
        const progress = Math.min((points / ms.threshold) * 100, 100);
        container.innerHTML += `
            <div class="milestone">
                <span>${ms.name} (Goal: ${ms.threshold} pts)</span>
                <div class="progress-bar"><div class="progress" style="width: ${progress}%;"></div></div>
            </div>`;
    });
}

function renderBadges(points) {
    const container = document.getElementById('badges-container');
    if (!container) return;
    container.innerHTML = '';
    mockDatabase.badges.forEach(badge => {
        const isUnlocked = points >= badge.threshold;
        container.innerHTML += `
            <div class="badge ${isUnlocked ? 'unlocked' : 'locked'}" title="${badge.name} (Unlock at ${badge.threshold} pts)">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>`;
    });
}

function renderActivityLog(studentId) {
    const list = document.getElementById('activity-log');
    if (!list) return;
    list.innerHTML = '';
    const activities = mockDatabase.activities[studentId] || ['No recent activity.'];
    activities.forEach(act => {
        list.innerHTML += `<li>${act}</li>`;
    });
}