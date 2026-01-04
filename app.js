// State
let habits = [];
let currentDate = new Date();
let statsDate = new Date();
let selectedDate = null;
let currentGraphHabit = null;
let currentGraphRange = 'week';
let measurementChart = null;
let calendarView = 'month'; // 'month' or 'year'
const STORAGE_KEY = 'habitTrackerData';

// DOM Elements
const habitsList = document.getElementById('habitsList');
const calendarDays = document.getElementById('calendarDays');
const currentMonth = document.getElementById('currentMonth');
const habitModal = document.getElementById('habitModal');
const habitForm = document.getElementById('habitForm');
const modalTitle = document.getElementById('modalTitle');
const dayModal = document.getElementById('dayModal');
const dayModalTitle = document.getElementById('dayModalTitle');
const dayHabitsList = document.getElementById('dayHabitsList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    loadTheme();
    renderHabits();
    renderCalendar();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addHabitBtn').addEventListener('click', () => openModal());
    document.getElementById('cancelBtn').addEventListener('click', () => closeModal());
    document.getElementById('closeDayModalBtn').addEventListener('click', () => closeDayModal());
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importFile').addEventListener('change', importData);
    habitForm.addEventListener('submit', saveHabit);

    // Settings menu toggle
    document.getElementById('settingsBtn').addEventListener('click', toggleSettingsMenu);
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);

    // Close settings menu when clicking outside
    document.addEventListener('click', (e) => {
        const settingsDropdown = document.querySelector('.settings-dropdown');
        if (!settingsDropdown.contains(e.target)) {
            document.querySelector('.settings-menu').classList.add('hidden');
        }
    });

    // Track type switching
    document.getElementById('trackType').addEventListener('change', handleTrackTypeChange);
    document.getElementById('periodicType').addEventListener('change', handlePeriodicTypeChange);

    // Main tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Stats subtab switching
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
    });

    // Stats month navigation
    document.getElementById('statsPrevMonth').addEventListener('click', () => changeStatsMonth(-1));
    document.getElementById('statsNextMonth').addEventListener('click', () => changeStatsMonth(1));

    // Graph modal
    document.getElementById('closeGraphModalBtn').addEventListener('click', () => closeGraphModal());
    document.querySelectorAll('.graph-time-btn').forEach(btn => {
        btn.addEventListener('click', () => changeGraphRange(btn.dataset.range));
    });

    // iOS Setup modal
    document.getElementById('iosSetupBtn').addEventListener('click', openIosSetupModal);
    document.getElementById('closeIosSetupBtn').addEventListener('click', closeIosSetupModal);
    document.querySelector('.carousel-prev').addEventListener('click', prevSlide);
    document.querySelector('.carousel-next').addEventListener('click', nextSlide);
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide)));
    });

    // Calendar view toggle
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchCalendarView(btn.dataset.view));
    });
}

function handleTrackTypeChange() {
    const trackType = document.getElementById('trackType').value;
    const periodicOptions = document.getElementById('periodicOptions');
    const measurementOptions = document.getElementById('measurementOptions');

    if (trackType === 'periodic') {
        periodicOptions.classList.remove('hidden');
        measurementOptions.classList.add('hidden');
    } else {
        periodicOptions.classList.add('hidden');
        measurementOptions.classList.remove('hidden');
    }
}

function handlePeriodicTypeChange() {
    const periodicType = document.getElementById('periodicType').value;
    const frequencyXLabel = document.getElementById('frequencyXLabel');
    const frequencyXGroup = document.getElementById('frequencyXGroup');

    if (periodicType === 'everyday') {
        frequencyXGroup.classList.add('hidden');
    } else {
        frequencyXGroup.classList.remove('hidden');
    }

    switch (periodicType) {
        case 'everyday':
            frequencyXLabel.textContent = 'Everyday';
            break;
        case 'perWeek':
            frequencyXLabel.textContent = 'Times per week';
            break;
        case 'perMonth':
            frequencyXLabel.textContent = 'Times per month';
            break;
        case 'everyXDays':
            frequencyXLabel.textContent = 'Every X days';
            break;
    }
}

// Storage Functions
function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        habits = JSON.parse(data);
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// Habit Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function openModal(habitId = null) {
    const form = habitForm;
    form.reset();

    // Reset form to default state
    document.getElementById('trackType').value = 'periodic';
    document.getElementById('periodicType').value = 'perWeek';
    document.getElementById('frequencyX').value = '3';
    document.getElementById('measurementUnit').value = '';
    handleTrackTypeChange();
    handlePeriodicTypeChange();

    if (habitId) {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            modalTitle.textContent = 'Edit Track';
            document.getElementById('habitId').value = habit.id;
            document.getElementById('habitName').value = habit.name;
            document.getElementById('habitColor').value = habit.color;

            // Set track type
            const trackType = habit.trackType || 'periodic';
            document.getElementById('trackType').value = trackType;
            handleTrackTypeChange();

            if (trackType === 'periodic') {
                const periodicType = habit.periodicType || 'perWeek';
                document.getElementById('periodicType').value = periodicType;
                document.getElementById('frequencyX').value = habit.frequencyX || habit.frequency || 3;
                handlePeriodicTypeChange();
            } else {
                document.getElementById('measurementUnit').value = habit.unit || '';
            }
        }
    } else {
        modalTitle.textContent = 'Add New Track';
        document.getElementById('habitId').value = '';
    }

    habitModal.classList.remove('hidden');
}

function closeModal() {
    habitModal.classList.add('hidden');
}

function saveHabit(e) {
    e.preventDefault();

    const id = document.getElementById('habitId').value;
    const name = document.getElementById('habitName').value;
    const color = document.getElementById('habitColor').value;
    const trackType = document.getElementById('trackType').value;

    let habitData = {
        name,
        color,
        trackType,
        showInCalendar: true
    };

    if (trackType === 'periodic') {
        const periodicType = document.getElementById('periodicType').value;
        const frequencyX = parseInt(document.getElementById('frequencyX').value);

        habitData.periodicType = periodicType;
        habitData.frequencyX = frequencyX;

        // For backwards compatibility, set frequency based on type
        habitData.frequency = frequencyX;
    } else {
        habitData.unit = document.getElementById('measurementUnit').value;
        habitData.frequency = 0; // Measurements don't have frequency
    }

    if (id) {
        const index = habits.findIndex(h => h.id === id);
        if (index !== -1) {
            habits[index] = { ...habits[index], ...habitData };
        }
    } else {
        habits.push({
            id: generateId(),
            ...habitData,
            history: []
        });
    }

    saveToStorage();
    renderHabits();
    renderCalendar();
    closeModal();
}

function deleteHabit(id) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        saveToStorage();
        renderHabits();
        renderCalendar();
    }
}

function toggleHabitVisibility(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.showInCalendar = !habit.showInCalendar;
        saveToStorage();
        renderCalendar();
        renderTodo();
        renderMonthlyStats();
        renderHabitStats();
    }
}

function markHabitDone(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        const today = getLocalDateStr(new Date());
        if (!habit.history.includes(today)) {
            habit.history.push(today);
            saveToStorage();
            renderHabits();
            renderCalendar();
        }
    }
}

function toggleHabitOnDate(habitId, dateStr) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        const index = habit.history.indexOf(dateStr);
        if (index === -1) {
            habit.history.push(dateStr);
        } else {
            habit.history.splice(index, 1);
        }
        saveToStorage();
        renderHabits();
        renderCalendar();
    }
}

// Helper to get local date string (YYYY-MM-DD)
function getLocalDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekProgress(habit) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Monday = 0, Sunday = 6 (convert from Sunday = 0)
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - mondayOffset);

    let count = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = getLocalDateStr(date);
        if (habit.history.includes(dateStr)) {
            count++;
        }
    }
    return count;
}

// Get progress for periodic tracks based on their type
function getPeriodicProgress(habit) {
    const periodicType = habit.periodicType || 'perWeek';
    const frequencyX = habit.frequencyX || habit.frequency || 3;

    switch (periodicType) {
        case 'everyday': {
            const today = getLocalDateStr(new Date());
            const isDoneToday = habit.history.includes(today);
            return { progress: isDoneToday ? 1 : 0, target: 1, label: 'everyday', isEveryday: true };
        }
        case 'perWeek': {
            const progress = getWeekProgress(habit);
            return { progress, target: frequencyX, label: 'this week' };
        }
        case 'perMonth': {
            const progress = getMonthProgress(habit);
            return { progress, target: frequencyX, label: 'this month' };
        }
        case 'everyXDays': {
            // Check if done within last X days
            const { done, daysSince } = getDaysSinceLastDone(habit);
            const progress = done && daysSince < frequencyX ? 1 : 0;
            return { progress, target: 1, label: `every ${frequencyX} days` };
        }
        default:
            return { progress: getWeekProgress(habit), target: frequencyX, label: 'this week' };
    }
}

function getMonthProgress(habit) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    let count = 0;
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const dateStr = getLocalDateStr(d);
        if (habit.history.includes(dateStr)) {
            count++;
        }
    }
    return count;
}

function getDaysSinceLastDone(habit) {
    if (!habit.history || habit.history.length === 0) {
        return { done: false, daysSince: Infinity };
    }
    const sortedHistory = [...habit.history].sort().reverse();
    const lastDate = new Date(sortedHistory[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return { done: true, daysSince: diffDays };
}

// Get last measurement entry
function getLastMeasurement(habit) {
    if (!habit.measurements || habit.measurements.length === 0) {
        return null;
    }
    const sorted = [...habit.measurements].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
}

// Get measurement value for a specific date
function getMeasurementForDate(habit, dateStr) {
    if (!habit.measurements || habit.measurements.length === 0) {
        return null;
    }
    const measurement = habit.measurements.find(m => m.date === dateStr);
    return measurement ? measurement.value : null;
}

// Save measurement for a specific date
function saveMeasurementForDate(habitId, value) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.measurements) {
        habit.measurements = [];
    }

    if (value === '' || value === null) {
        // Remove measurement for this date
        habit.measurements = habit.measurements.filter(m => m.date !== selectedDate);
        // Remove from history if no measurement
        habit.history = habit.history.filter(d => d !== selectedDate);
    } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const existingIndex = habit.measurements.findIndex(m => m.date === selectedDate);
            if (existingIndex >= 0) {
                habit.measurements[existingIndex].value = numValue;
            } else {
                habit.measurements.push({ date: selectedDate, value: numValue });
            }
            // Add to history for calendar display
            if (!habit.history.includes(selectedDate)) {
                habit.history.push(selectedDate);
            }
        }
    }

    saveToStorage();
    renderHabits();
    renderCalendar();
}

// Open measurement input modal
function openMeasurementInput(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const value = prompt(`Enter ${habit.name} value${habit.unit ? ` (${habit.unit})` : ''}:`);
    if (value !== null && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            if (!habit.measurements) {
                habit.measurements = [];
            }
            const today = getLocalDateStr(new Date());
            // Update or add measurement for today
            const existingIndex = habit.measurements.findIndex(m => m.date === today);
            if (existingIndex >= 0) {
                habit.measurements[existingIndex].value = numValue;
            } else {
                habit.measurements.push({ date: today, value: numValue });
            }
            // Also add to history for calendar display
            if (!habit.history.includes(today)) {
                habit.history.push(today);
            }
            saveToStorage();
            renderHabits();
            renderCalendar();
        } else {
            alert('Please enter a valid number');
        }
    }
}

// Render Functions
function renderHabits() {
    habitsList.innerHTML = '';

    habits.forEach((habit, index) => {
        const li = document.createElement('li');
        li.className = 'habit-item';
        li.style.borderLeftColor = habit.color;
        li.draggable = true;
        li.dataset.index = index;

        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        let infoHtml = '';
        let actionsHtml = '';

        if (habit.trackType === 'measurement') {
            // Measurement track - show last recorded value
            const lastEntry = getLastMeasurement(habit);
            const unitDisplay = habit.unit ? ` ${habit.unit}` : '';
            infoHtml = `
                <div class="habit-info">
                    <span>Last: ${lastEntry ? lastEntry.value + unitDisplay : 'No data'}</span>
                </div>
            `;
            actionsHtml = `
                <div class="habit-actions">
                    <button class="btn btn-small btn-done" onclick="openMeasurementInput('${habit.id}')">+ Record</button>
                    <button class="btn btn-small btn-edit" onclick="openModal('${habit.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteHabit('${habit.id}')">Delete</button>
                </div>
            `;
        } else {
            // Periodic track - show progress
            const { progress, target, label, isEveryday } = getPeriodicProgress(habit);
            const progressPercent = target > 0 ? Math.min((progress / target) * 100, 100) : 0;

            if (isEveryday) {
                // Everyday track - show simple done/not done status
                const isDone = progress === 1;
                infoHtml = `
                    <div class="habit-info">
                        <span class="everyday-status ${isDone ? 'done' : 'not-done'}">${isDone ? 'Done today' : 'Not done today'}</span>
                    </div>
                `;
            } else {
                infoHtml = `
                    <div class="habit-info">
                        <span>${progress}/${target} ${label}</span>
                        <div class="habit-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%; background: ${habit.color}"></div>
                            </div>
                        </div>
                    </div>
                `;
            }
            actionsHtml = `
                <div class="habit-actions">
                    <button class="btn btn-small btn-done" onclick="markHabitDone('${habit.id}')">Done Today</button>
                    <button class="btn btn-small btn-edit" onclick="openModal('${habit.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteHabit('${habit.id}')">Delete</button>
                </div>
            `;
        }

        li.innerHTML = `
            <div class="habit-header">
                <span class="drag-handle">⋮⋮</span>
                <span class="habit-name">${habit.name}</span>
                <div class="habit-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" ${habit.showInCalendar ? 'checked' : ''}
                               onchange="toggleHabitVisibility('${habit.id}')">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            ${infoHtml}
            ${actionsHtml}
        `;

        habitsList.appendChild(li);
    });
}

// Drag and Drop
let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetIndex = parseInt(this.dataset.index);

    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const draggedHabit = habits.splice(draggedIndex, 1)[0];
        habits.splice(targetIndex, 0, draggedHabit);
        saveToStorage();
        renderHabits();
        renderCalendar();
        renderTodo();
        renderMonthlyStats();
        renderHabitStats();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.habit-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedIndex = null;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    updateCalendarHeader();

    // If year view is active, render that instead
    if (calendarView === 'year') {
        renderYearView();
        return;
    }

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    // Adjust to start on Monday (0 = Monday, 6 = Sunday)
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - mondayOffset);

    const today = getLocalDateStr(new Date());

    calendarDays.innerHTML = '';

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = getLocalDateStr(date);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dateStr === today;

        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`;
        dayDiv.onclick = () => openDayDetail(dateStr);

        const habitsOnDay = habits
            .filter(h => h.showInCalendar && h.history.includes(dateStr));

        dayDiv.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            <div class="day-habits">
                ${habitsOnDay.map(h => `<div class="habit-color-bar" style="background: ${h.color}"></div>`).join('')}
            </div>
        `;

        calendarDays.appendChild(dayDiv);
    }
}

function openDayDetail(dateStr) {
    if (habits.length === 0) {
        alert('No habits to track. Add some habits first!');
        return;
    }

    selectedDate = dateStr;
    const date = new Date(dateStr + 'T00:00:00');
    dayModalTitle.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    renderDayHabits();
    dayModal.classList.remove('hidden');
}

function closeDayModal() {
    dayModal.classList.add('hidden');
    selectedDate = null;
}

function renderDayHabits() {
    dayHabitsList.innerHTML = '';

    habits.forEach(habit => {
        const isDone = habit.history.includes(selectedDate);

        const li = document.createElement('li');
        li.className = 'day-habit-item';
        li.style.borderLeftColor = habit.color;

        if (habit.trackType === 'measurement') {
            // Measurement track - show input field
            const measurement = getMeasurementForDate(habit, selectedDate);
            const unitDisplay = habit.unit ? ` ${habit.unit}` : '';
            li.innerHTML = `
                <div class="day-habit-info">
                    <span class="day-habit-name">${habit.name}</span>
                    <span class="day-habit-unit">${unitDisplay}</span>
                </div>
                <div class="day-measurement-input">
                    <input type="number" step="any" placeholder="Value"
                           value="${measurement !== null ? measurement : ''}"
                           onchange="saveMeasurementForDate('${habit.id}', this.value)"
                           class="measurement-input">
                </div>
            `;
        } else {
            // Periodic track - show toggle
            li.innerHTML = `
                <div class="day-habit-info">
                    <span class="day-habit-name">${habit.name}</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${isDone ? 'checked' : ''}
                           onchange="toggleHabitOnDateAndRefresh('${habit.id}')">
                    <span class="toggle-slider"></span>
                </label>
            `;
        }

        dayHabitsList.appendChild(li);
    });
}

function toggleHabitOnDateAndRefresh(habitId) {
    toggleHabitOnDate(habitId, selectedDate);
    renderDayHabits();
}

function changeMonth(delta) {
    if (calendarView === 'year') {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
        renderYearView();
    } else {
        currentDate.setMonth(currentDate.getMonth() + delta);
        renderCalendar();
    }
    updateCalendarHeader();
}

function switchCalendarView(view) {
    if (view === calendarView) return;

    calendarView = view;

    // Update toggle buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update toggle slider position
    document.querySelector('.view-toggle').dataset.view = view;

    // Show/hide views
    document.getElementById('monthView').classList.toggle('hidden', view === 'year');
    document.getElementById('yearView').classList.toggle('hidden', view === 'month');

    // Update header and render appropriate view
    updateCalendarHeader();
    if (view === 'year') {
        renderYearView();
    } else {
        renderCalendar();
    }
}

function updateCalendarHeader() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (calendarView === 'year') {
        currentMonth.textContent = year.toString();
    } else {
        currentMonth.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    }
}

function renderYearView() {
    const yearGrid = document.getElementById('yearGrid');
    const year = currentDate.getFullYear();
    const today = getLocalDateStr(new Date());

    yearGrid.innerHTML = '';

    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let month = 0; month < 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'year-month';

        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'short' });

        // Month header
        let monthHtml = `<div class="year-month-header">${monthName}</div>`;
        monthHtml += '<div class="year-month-grid">';

        // Day headers
        dayNames.forEach(day => {
            monthHtml += `<div class="year-day-header">${day}</div>`;
        });

        // Calculate first day and days in month
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOfWeek = firstDay.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Empty cells before first day
        for (let i = 0; i < mondayOffset; i++) {
            monthHtml += '<div class="year-day other-month"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;

            const habitsOnDay = habits.filter(h => h.showInCalendar && h.history.includes(dateStr));

            monthHtml += `<div class="year-day ${isToday ? 'today' : ''}" onclick="openDayDetail('${dateStr}')">`;
            monthHtml += `<div class="year-day-number">${day}</div>`;
            monthHtml += '<div class="year-day-habits">';
            habitsOnDay.forEach(h => {
                monthHtml += `<div class="year-habit-bar" style="background: ${h.color}"></div>`;
            });
            monthHtml += '</div></div>';
        }

        monthHtml += '</div>';
        monthDiv.innerHTML = monthHtml;
        yearGrid.appendChild(monthDiv);
    }
}

// Export/Import Functions
function exportData() {
    const data = JSON.stringify(habits, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-${getLocalDateStr(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedHabits = JSON.parse(event.target.result);
            if (Array.isArray(importedHabits)) {
                if (confirm('This will replace all current habits. Continue?')) {
                    habits = importedHabits;
                    saveToStorage();
                    renderHabits();
                    renderCalendar();
                    alert('Data imported successfully!');
                }
            } else {
                alert('Invalid file format');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Tab');
    });

    if (tabName === 'todo') {
        renderTodo();
    } else if (tabName === 'stats') {
        renderMonthlyStats();
        renderHabitStats();
    }
}

function switchSubtab(subtabName) {
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtabName);
    });

    document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.toggle('active', content.id === subtabName + 'Stats');
    });
}

function changeStatsMonth(delta) {
    statsDate.setMonth(statsDate.getMonth() + delta);
    renderMonthlyStats();
}

// Get week start and end dates
function getWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - mondayOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return { start: startOfWeek, end: endOfWeek };
}

// Render To Do Tab
function renderTodo() {
    const todoList = document.getElementById('todoList');
    const weekRange = document.getElementById('weekRange');
    const range = getWeekRange();

    weekRange.textContent = `${range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    todoList.innerHTML = '';

    // Only show periodic tracks (not measurements)
    const periodicHabits = habits.filter(h => h.showInCalendar && h.trackType !== 'measurement');

    periodicHabits.forEach(habit => {
        const li = document.createElement('li');
        li.style.borderLeftColor = habit.color;

        const { progress, target, label } = getPeriodicProgress(habit);
        const remaining = Math.max(0, target - progress);
        const progressPercent = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        const isComplete = progress >= target;
        li.className = `todo-item ${isComplete ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="todo-item-header">
                <span class="todo-item-name">${habit.name}</span>
                <span class="todo-item-count">${progress}/${target}</span>
            </div>
            <div class="todo-item-progress">
                <div class="todo-progress-bar">
                    <div class="todo-progress-fill" style="width: ${progressPercent}%; background: ${habit.color}"></div>
                </div>
                <span class="todo-remaining">${isComplete ? '✓ Complete' : `${remaining} left`}</span>
            </div>
        `;

        todoList.appendChild(li);
    });

    if (periodicHabits.length === 0) {
        todoList.innerHTML = '<li class="todo-item" style="text-align: center; color: #a1a1aa;">No active periodic tracks. Add some tracks to see goals!</li>';
    }
}

// Render Monthly Stats
function renderMonthlyStats() {
    const statsMonth = document.getElementById('statsMonth');
    const monthlyStats = document.getElementById('monthlyStats');

    const year = statsDate.getFullYear();
    const month = statsDate.getMonth();

    statsMonth.textContent = new Date(year, month).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    monthlyStats.innerHTML = '';

    const activeHabits = habits.filter(h => h.showInCalendar);

    activeHabits.forEach(habit => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let completedDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (habit.history.includes(dateStr)) {
                completedDays++;
            }
        }

        // Calculate expected days based on frequency (times per week * weeks in month)
        const weeksInMonth = daysInMonth / 7;
        const expectedDays = Math.round(habit.frequency * weeksInMonth);
        const completionRate = expectedDays > 0 ? Math.min((completedDays / expectedDays) * 100, 100) : 0;

        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.borderLeftColor = habit.color;

        card.innerHTML = `
            <div class="stat-card-header">
                <span class="stat-card-name">${habit.name}</span>
            </div>
            <div class="stat-card-value">${completedDays}</div>
            <div class="stat-card-label">days completed</div>
            <div class="stat-card-bar">
                <div class="stat-card-fill" style="width: ${completionRate}%; background: ${habit.color}"></div>
            </div>
        `;

        monthlyStats.appendChild(card);
    });

    if (activeHabits.length === 0) {
        monthlyStats.innerHTML = '<div class="stat-card" style="text-align: center; color: #a1a1aa; grid-column: 1 / -1;">No active tracks. Enable some tracks to see stats!</div>';
    }
}

// Render Per Habit Stats
function renderHabitStats() {
    const habitStats = document.getElementById('habitStats');
    habitStats.innerHTML = '';

    const activeHabits = habits.filter(h => h.showInCalendar);

    activeHabits.forEach(habit => {
        const item = document.createElement('div');
        item.className = 'habit-stat-item';
        item.style.borderLeftColor = habit.color;

        if (habit.trackType === 'measurement') {
            // Measurement stats
            const measurements = habit.measurements || [];
            const unitDisplay = habit.unit ? ` ${habit.unit}` : '';
            const avg = measurements.length > 0
                ? (measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length).toFixed(1)
                : 0;
            const min = measurements.length > 0
                ? Math.min(...measurements.map(m => m.value))
                : 0;
            const max = measurements.length > 0
                ? Math.max(...measurements.map(m => m.value))
                : 0;

            item.innerHTML = `
                <div class="habit-stat-header">
                    <span class="habit-stat-name">${habit.name}</span>
                    <span class="habit-stat-frequency">Measurement${habit.unit ? ` (${habit.unit})` : ''}</span>
                </div>
                <div class="habit-stat-metrics">
                    <div class="metric">
                        <div class="metric-value">${measurements.length}</div>
                        <div class="metric-label">Entries</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${avg}${unitDisplay}</div>
                        <div class="metric-label">Average</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${min}-${max}${unitDisplay}</div>
                        <div class="metric-label">Range</div>
                    </div>
                </div>
                <div class="habit-stat-actions">
                    <button class="view-graph-btn" onclick="openGraphModal('${habit.id}')">View Graph</button>
                </div>
            `;
        } else {
            // Periodic stats
            const totalCompletions = habit.history.length;

            // Calculate current streak
            let currentStreak = 0;
            const today = new Date();
            const checkDate = new Date(today);

            while (true) {
                const dateStr = getLocalDateStr(checkDate);
                if (habit.history.includes(dateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // Calculate longest streak
            let longestStreak = 0;
            let tempStreak = 0;
            const sortedHistory = [...habit.history].sort();

            for (let i = 0; i < sortedHistory.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const prevDate = new Date(sortedHistory[i - 1] + 'T00:00:00');
                    const currDate = new Date(sortedHistory[i] + 'T00:00:00');
                    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        tempStreak = 1;
                    }
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            }

            // Get frequency label
            const frequencyLabel = getFrequencyLabel(habit);

            item.innerHTML = `
                <div class="habit-stat-header">
                    <span class="habit-stat-name">${habit.name}</span>
                    <span class="habit-stat-frequency">${frequencyLabel}</span>
                </div>
                <div class="habit-stat-metrics">
                    <div class="metric">
                        <div class="metric-value">${totalCompletions}</div>
                        <div class="metric-label">Total Days</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${currentStreak}</div>
                        <div class="metric-label">Current Streak</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${longestStreak}</div>
                        <div class="metric-label">Longest Streak</div>
                    </div>
                </div>
            `;
        }

        habitStats.appendChild(item);
    });

    if (activeHabits.length === 0) {
        habitStats.innerHTML = '<div class="habit-stat-item" style="text-align: center; color: #a1a1aa;">No active tracks. Enable some tracks to see stats!</div>';
    }
}

// Get human readable frequency label
function getFrequencyLabel(habit) {
    const periodicType = habit.periodicType || 'perWeek';
    const frequencyX = habit.frequencyX || habit.frequency || 3;

    switch (periodicType) {
        case 'everyday':
            return 'Everyday';
        case 'perWeek':
            return `${frequencyX}x per week`;
        case 'perMonth':
            return `${frequencyX}x per month`;
        case 'everyXDays':
            return `Every ${frequencyX} days`;
        default:
            return `${frequencyX}x per week`;
    }
}

// Graph Functions
function openGraphModal(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || habit.trackType !== 'measurement') return;

    currentGraphHabit = habit;
    currentGraphRange = 'week';

    document.getElementById('graphModalTitle').textContent = `${habit.name} History`;

    // Reset active button
    document.querySelectorAll('.graph-time-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === 'week');
    });

    document.getElementById('graphModal').classList.remove('hidden');
    renderGraph();
}

function closeGraphModal() {
    document.getElementById('graphModal').classList.add('hidden');
    if (measurementChart) {
        measurementChart.destroy();
        measurementChart = null;
    }
    currentGraphHabit = null;
}

function changeGraphRange(range) {
    currentGraphRange = range;
    document.querySelectorAll('.graph-time-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === range);
    });
    renderGraph();
}

function getGraphDateRange(range) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = new Date();

    switch (range) {
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'ytd':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'all':
            startDate = new Date(2000, 0, 1); // Far enough back
            break;
        default:
            startDate.setDate(today.getDate() - 7);
    }

    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: today };
}

function renderGraph() {
    if (!currentGraphHabit) return;

    const measurements = currentGraphHabit.measurements || [];
    const { startDate, endDate } = getGraphDateRange(currentGraphRange);

    // Filter and sort measurements within range
    const filteredData = measurements
        .filter(m => {
            const date = new Date(m.date + 'T00:00:00');
            return date >= startDate && date <= endDate;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    const labels = filteredData.map(m => {
        const date = new Date(m.date + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = filteredData.map(m => m.value);

    const ctx = document.getElementById('measurementChart').getContext('2d');

    if (measurementChart) {
        measurementChart.destroy();
    }

    const unitDisplay = currentGraphHabit.unit ? ` (${currentGraphHabit.unit})` : '';

    measurementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentGraphHabit.name + unitDisplay,
                data: values,
                borderColor: currentGraphHabit.color,
                backgroundColor: currentGraphHabit.color + '33',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: currentGraphHabit.color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 50, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#a1a1aa',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a1a1aa',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a1a1aa',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Settings Menu Functions
function toggleSettingsMenu(e) {
    e.stopPropagation();
    const menu = document.querySelector('.settings-menu');
    menu.classList.toggle('hidden');
}

// Theme Functions
const THEME_KEY = 'damtrackTheme';

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Default is dark mode (no class), light mode adds 'light-mode' class
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('themeToggle').checked = true;
    }
}

function toggleTheme() {
    const isLightMode = document.getElementById('themeToggle').checked;

    if (isLightMode) {
        document.body.classList.add('light-mode');
        localStorage.setItem(THEME_KEY, 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem(THEME_KEY, 'dark');
    }
}

// iOS Setup Modal Functions
let currentSlide = 0;

function openIosSetupModal() {
    currentSlide = 0;
    updateCarousel();
    document.getElementById('iosSetupModal').classList.remove('hidden');
    document.querySelector('.settings-menu').classList.add('hidden');
}

function closeIosSetupModal() {
    document.getElementById('iosSetupModal').classList.add('hidden');
}

function updateCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });

    // Update prev/next button states
    document.querySelector('.carousel-prev').disabled = currentSlide === 0;
    document.querySelector('.carousel-next').disabled = currentSlide === slides.length - 1;
}

function nextSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateCarousel();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}
