
const API_URL = "/api/tasks";

let tasks = [];
let editingId = null;
let toastTimer = null;

const $ = id => document.getElementById(id);
const tableBody = $("taskTable");
const modal = $("modalBackdrop");
const form = $("taskForm");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function normalizedStatus(status) {
    const value = String(status || "OPEN")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

    if (["IN_PROGRESS", "INPROGRESS"].includes(value)) {
        return "IN_PROGRESS";
    }

    if (["COMPLETED", "COMPLETE", "DONE"].includes(value)) {
        return "COMPLETED";
    }

    return "OPEN";
}

function statusText(status) {
    return ({
        OPEN: "Open",
        IN_PROGRESS: "In progress",
        COMPLETED: "Completed"
    })[normalizedStatus(status)];
}

function statusCss(status) {
    return ({
        OPEN: "status-open",
        IN_PROGRESS: "status-progress",
        COMPLETED: "status-completed"
    })[normalizedStatus(status)];
}

function showToast(message, isError = false) {
    const element = $("toast");
    element.textContent = message;
    element.classList.toggle("error", isError);
    element.classList.remove("hidden");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        element.classList.add("hidden");
    }, 3600);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(
            `API request failed (${response.status})` +
            (detail ? `: ${detail.slice(0, 160)}` : "")
        );
    }

    if (response.status === 204) {
        return null;
    }

    const body = await response.text();
    return body ? JSON.parse(body) : null;
}

async function checkHealth() {
    try {
        const response = await fetch("/api/health");

        if (!response.ok) {
            throw new Error("Health check failed");
        }

        $("appHealth").textContent = "Healthy";
        $("appMeter").textContent = "OK";
        $("apiMeter").textContent = "OK";
        $("healthMessage").textContent =
            "Spring Boot health endpoint responded successfully.";
        $("apiStatusText").textContent =
            "Spring Boot is responding";
    } catch (error) {
        $("appHealth").textContent = "Offline";
        $("appMeter").textContent = "—";
        $("apiMeter").textContent = "—";
        $("healthMessage").textContent =
            "Cannot reach the backend. Start Spring Boot and refresh.";
        $("apiStatusText").textContent =
            "Backend is not reachable";
    }
}

async function loadTasks() {
    $("apiHealth").textContent = "Checking";
    $("apiStatusText").textContent = "Loading tasks from API…";

    try {
        const result = await apiRequest(API_URL);

        if (!Array.isArray(result)) {
            throw new Error(
                "Expected the tasks API to return a JSON array."
            );
        }

        tasks = result;
        $("apiHealth").textContent = "Connected";
        $("apiStatusText").textContent = "Connected to /api/tasks";

        renderDashboard();
    } catch (error) {
        $("apiHealth").textContent = "Unavailable";

        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    Could not load tasks.<br>
                    ${escapeHtml(error.message)}<br><br>
                    Check that Spring Boot is running on port 8080.
                </td>
            </tr>`;

        [
            "totalCount",
            "completedCount",
            "progressCount",
            "openCount",
            "donutTotal"
        ].forEach(id => $(id).textContent = "—");

        $("resultCount").textContent = "API unavailable";
        $("legendCompleted").textContent = "—";
        $("legendProgress").textContent = "—";
        $("legendOpen").textContent = "—";

        console.error("OpsTrack task API:", error);
    }
}

function renderDashboard() {
    const counts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0
    };

    tasks.forEach(task => {
        counts[normalizedStatus(task.status)]++;
    });

    const total = tasks.length;

    $("totalCount").textContent = total;
    $("completedCount").textContent = counts.COMPLETED;
    $("progressCount").textContent = counts.IN_PROGRESS;
    $("openCount").textContent = counts.OPEN;
    $("donutTotal").textContent = total;

    $("legendCompleted").textContent =
        `${counts.COMPLETED} · ${
            total ? Math.round(counts.COMPLETED / total * 100) : 0
        }%`;

    $("legendProgress").textContent =
        `${counts.IN_PROGRESS} · ${
            total ? Math.round(counts.IN_PROGRESS / total * 100) : 0
        }%`;

    $("legendOpen").textContent =
        `${counts.OPEN} · ${
            total ? Math.round(counts.OPEN / total * 100) : 0
        }%`;

    // Calculate the donut chart from actual task counts.
    const greenAngle = total
        ? counts.COMPLETED / total * 360
        : 0;

    const amberAngle = total
        ? counts.IN_PROGRESS / total * 360
        : 0;

    $("taskDonut").style.background = total
        ? `conic-gradient(
            var(--green) 0deg ${greenAngle}deg,
            var(--amber) ${greenAngle}deg ${greenAngle + amberAngle}deg,
            var(--red) ${greenAngle + amberAngle}deg 360deg
        )`
        : "conic-gradient(#18304d 0deg 360deg)";

    // Scale the status bars relative to the largest status count.
    const maxCount = Math.max(
        1,
        counts.OPEN,
        counts.IN_PROGRESS,
        counts.COMPLETED
    );

    [
        ["Completed", counts.COMPLETED],
        ["Progress", counts.IN_PROGRESS],
        ["Open", counts.OPEN]
    ].forEach(([name, count]) => {
        $(`chart${name}`).textContent = count;
        $(`bar${name}`).style.height =
            `${count ? Math.max(7, count / maxCount * 100) : 0}%`;
    });

    // Apply search and status filters.
    const search = $("searchInput").value.trim().toLowerCase();
    const statusFilter = $("statusFilter").value;

    const filtered = tasks.filter(task => {
        const searchable = [
            task.id,
            task.title,
            task.description,
            task.status
        ].join(" ").toLowerCase();

        return searchable.includes(search) &&
            (!statusFilter ||
                normalizedStatus(task.status) === statusFilter);
    });

    $("resultCount").textContent =
        `Showing ${filtered.length} of ${total} task${total === 1 ? "" : "s"}`;

    if (!filtered.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    ${total
                        ? "No tasks match your current search or filter."
                        : "No tasks yet. Select Create task to add your first task."}
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(task => `
        <tr>
            <td class="task-id">#${escapeHtml(task.id)}</td>
            <td>
                <div class="task-title">
                    ${escapeHtml(task.title)}
                </div>
                <div class="task-description">
                    ${escapeHtml(task.description || "No description provided")}
                </div>
            </td>
            <td>
                <span class="status-pill ${statusCss(task.status)}">
                    ${statusText(task.status)}
                </span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="row-action"
                        data-action="edit"
                        data-id="${escapeHtml(task.id)}">Edit</button>
                    <button class="row-action delete"
                        data-action="delete"
                        data-id="${escapeHtml(task.id)}">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openCreateModal() {
    editingId = null;
    form.reset();

    $("taskStatus").value = "OPEN";
    $("modalTitle").textContent = "Create a task";
    $("modalDescription").textContent =
        "Add a task to your OpsTrack workspace.";
    $("saveTaskBtn").textContent = "Create task";

    modal.classList.remove("hidden");
    $("taskTitle").focus();
}

function openEditModal(task) {
    editingId = task.id;

    $("taskTitle").value = task.title || "";
    $("taskDescription").value = task.description || "";
    $("taskStatus").value = normalizedStatus(task.status);

    $("modalTitle").textContent = "Edit task";
    $("modalDescription").textContent = `Update task #${task.id}.`;
    $("saveTaskBtn").textContent = "Save changes";

    modal.classList.remove("hidden");
    $("taskTitle").focus();
}

function closeModal() {
    modal.classList.add("hidden");
    editingId = null;
}

async function saveTask(event) {
    event.preventDefault();

    const task = {
        title: $("taskTitle").value.trim(),
        description: $("taskDescription").value.trim(),
        status: $("taskStatus").value
    };

    if (!task.title) {
        showToast("Please enter a task title.", true);
        return;
    }

    const button = $("saveTaskBtn");
    const wasEditing = editingId !== null;
    const targetId = editingId;

    button.disabled = true;
    button.textContent = "Saving…";

    try {
        if (wasEditing) {
            await apiRequest(
                `${API_URL}/${encodeURIComponent(targetId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(task)
                }
            );

            showToast("Task updated successfully.");
        } else {
            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(task)
            });

            showToast("Task created successfully.");
        }

        closeModal();
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    } finally {
        button.disabled = false;
        button.textContent = wasEditing
            ? "Save changes"
            : "Create task";
    }
}

async function deleteTask(id) {
    const task = tasks.find(
        item => String(item.id) === String(id)
    );

    if (!task) return;

    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) {
        return;
    }

    try {
        await apiRequest(
            `${API_URL}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        showToast("Task deleted successfully.");
        await loadTasks();
    } catch (error) {
        showToast(error.message, true);
    }
}

// Dashboard event handlers.
$("addTaskBtn").addEventListener("click", openCreateModal);
$("quickCreate").addEventListener("click", openCreateModal);

async function refreshDashboard() {
    await checkHealth();
    await loadTasks();
}

$("refreshBtn").addEventListener("click", refreshDashboard);
$("quickRefresh").addEventListener("click", refreshDashboard);

$("cancelModal").addEventListener("click", closeModal);
$("closeModal").addEventListener("click", closeModal);

$("searchInput").addEventListener("input", renderDashboard);
$("statusFilter").addEventListener("change", renderDashboard);
form.addEventListener("submit", saveTask);

tableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const task = tasks.find(
        item => String(item.id) === String(button.dataset.id)
    );

    if (button.dataset.action === "edit" && task) {
        openEditModal(task);
    }

    if (button.dataset.action === "delete") {
        deleteTask(button.dataset.id);
    }
});

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("searchInput").focus();
    }
});

// Load real data when the page opens.
checkHealth();
loadTasks();
