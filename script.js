// ======================================
// HISAAB - GROUP EXPENSE MANAGER
// ======================================


// ======================================
// DOM ELEMENTS
// ======================================

const groupSelect = document.getElementById("groupSelect");

const groupModal = document.getElementById("groupModal");
const memberModal = document.getElementById("memberModal");
const expenseModal = document.getElementById("expenseModal");

const groupForm = document.getElementById("groupForm");
const memberForm = document.getElementById("memberForm");
const expenseForm = document.getElementById("expenseForm");

const noGroupMessage = document.getElementById("noGroupMessage");

const sections = document.querySelectorAll(".page-section");
const navLinks = document.querySelectorAll(".nav-link");


// ======================================
// APPLICATION DATA
// ======================================

let groups = JSON.parse(localStorage.getItem("hisaab_groups")) || [];

let activeGroupId = localStorage.getItem("hisaab_active_group") || null;

let editingExpenseId = null;

let currency = localStorage.getItem("hisaab_currency") || "INR";

let profileName = localStorage.getItem("hisaab_profile_name") || "User";

let currentSection = "dashboard";


// ======================================
// PROFILE
// ======================================

// Clicking the profile area allows the user to update their name.

document.querySelector(".account").addEventListener("click", () => {

    const updatedName = prompt("Enter your name:", profileName);

    if (updatedName === null) return;

    const trimmedName = updatedName.trim();

    if (!trimmedName) {
        alert("Name cannot be empty.");
        return;
    }

    profileName = trimmedName;

    localStorage.setItem("hisaab_profile_name", profileName);

    document.getElementById("profileName").textContent = profileName;

});


// ======================================
// HELPER FUNCTIONS
// ======================================

function saveData() {

    localStorage.setItem("hisaab_groups", JSON.stringify(groups));

    localStorage.setItem("hisaab_active_group", activeGroupId);

}


function getActiveGroup() {

    return groups.find(group => String(group.id) === String(activeGroupId)) || null;

}


function formatMoney(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
    }).format(amount);

}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}


function todayDate() {

    const date = new Date();

    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];

}


function showModal(modal) {

    modal.classList.remove("hidden");

}


function closeModal(modal) {

    modal.classList.add("hidden");

}


// ======================================
// MODAL CLOSE BUTTONS
// ======================================

document.querySelectorAll("[data-close]").forEach(button => {

    button.addEventListener("click", () => {

        closeModal(document.getElementById(button.dataset.close));

    });

});


document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal(modal);
        }

    });

});


// ======================================
// NAVIGATION
// ======================================

navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        const section = this.dataset.section;

        const group = getActiveGroup();

        if (!group) {
            alert("Please create or select a group first.");
            return;
        }

        // Remember the currently selected section.
        currentSection = section;

        navLinks.forEach(nav => nav.classList.remove("active"));

        this.classList.add("active");

        sections.forEach(sec => sec.classList.add("hidden"));

        document.getElementById(section).classList.remove("hidden");

        document.getElementById("pageTitle").textContent =
            this.textContent.trim();

    });

});


// ======================================
// GROUP MANAGEMENT
// ======================================

document.getElementById("newGroupBtn").addEventListener("click", () => {

    groupForm.reset();

    showModal(groupModal);

});


document.getElementById("emptyCreateBtn").addEventListener("click", () => {

    groupForm.reset();

    showModal(groupModal);

});


groupForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("groupName").value.trim();

    if (!name) {
        alert("Please enter a group name.");
        return;
    }

    const duplicate = groups.some(group =>
        group.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        alert("A group with this name already exists.");
        return;
    }

    const newGroup = {

        id: Date.now(),

        name: name,

        members: [],

        expenses: []

    };

    groups.push(newGroup);

    activeGroupId = newGroup.id;

    saveData();

    closeModal(groupModal);

    this.reset();

    renderApp();

    alert("Group created successfully!");

});


// ======================================
// GROUP SELECTION
// ======================================

groupSelect.addEventListener("change", function() {

    activeGroupId = this.value || null;

    saveData();

    renderApp();

});


function renderGroups() {

    groupSelect.innerHTML = "";

    if (groups.length === 0) {

        groupSelect.innerHTML =
            `<option value="">No groups available</option>`;

        return;

    }

    groups.forEach(group => {

        const option = document.createElement("option");

        option.value = group.id;

        option.textContent = group.name;

        groupSelect.appendChild(option);

    });

    groupSelect.value = activeGroupId;

}


// ======================================
// MEMBER MANAGEMENT
// ======================================

document.getElementById("addMemberBtn").addEventListener("click", () => {

    const group = getActiveGroup();

    if (!group) return;

    memberForm.reset();

    showModal(memberModal);

});


memberForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const group = getActiveGroup();

    if (!group) return;

    const name = document.getElementById("memberName").value.trim();

    if (!name) {
        alert("Please enter a member name.");
        return;
    }

    const duplicate = group.members.some(member =>
        member.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        alert("This member already exists in the group.");
        return;
    }

    group.members.push({

        id: Date.now(),

        name: name

    });

    saveData();

    closeModal(memberModal);

    this.reset();

    // Keep the user on the Members page after adding a member.
    currentSection = "members";

    renderApp();

});


function deleteMember(memberId) {

    const group = getActiveGroup();

    if (!group) return;

    const used = group.expenses.some(expense =>

        String(expense.paidBy) === String(memberId) ||

        expense.splitAmong.some(id => String(id) === String(memberId))

    );

    if (used) {

        alert("This member is part of an existing expense. Delete or edit those expenses first.");

        return;

    }

    if (!confirm("Are you sure you want to delete this member?")) {
        return;
    }

    group.members = group.members.filter(member =>
        String(member.id) !== String(memberId)
    );

    saveData();

    renderApp();

}


function renderMembers() {

    const group = getActiveGroup();

    const container = document.getElementById("membersList");

    container.innerHTML = "";

    if (group.members.length === 0) {

        container.innerHTML =
            `<p class="muted">No members added yet.</p>`;

        return;

    }

    group.members.forEach(member => {

        const card = document.createElement("div");

        card.className = "member-card";

        card.innerHTML = `

            <div>
                <h3>
                    <i class="fa-solid fa-user"></i>
                    ${escapeHTML(member.name)}
                </h3>
            </div>

            <button class="delete-btn"
                onclick="deleteMember(${Number(member.id)})">

                <i class="fa-solid fa-trash"></i>

            </button>

        `;

        container.appendChild(card);

    });

}


// ======================================
// EXPENSE MANAGEMENT
// ======================================

document.getElementById("addExpenseBtn").addEventListener("click", () => {

    const group = getActiveGroup();

    if (!group) return;

    if (group.members.length < 2) {

        alert("Add at least two members before recording expenses.");

        return;

    }

    openExpenseModal();

});


function openExpenseModal(expense = null) {

    const group = getActiveGroup();

    if (!group) return;

    editingExpenseId = expense ? expense.id : null;

    expenseForm.reset();

    document.getElementById("expenseModalTitle").textContent =
        expense ? "Edit Expense" : "Add Expense";

    document.getElementById("expenseDescription").value =
        expense ? expense.description : "";

    document.getElementById("expenseAmount").value =
        expense ? expense.amount : "";

    document.getElementById("expenseCategory").value =
        expense ? expense.category : "Food";

    document.getElementById("expenseDate").value =
        expense ? expense.date : todayDate();


    // Populate payer dropdown

    const paidBy = document.getElementById("paidBy");

    paidBy.innerHTML = "";

    group.members.forEach(member => {

        const option = document.createElement("option");

        option.value = member.id;

        option.textContent = member.name;

        paidBy.appendChild(option);

    });


    // Select existing payer

    if (expense) {

        paidBy.value = expense.paidBy;

    }


    // Populate participants

    const participantList = document.getElementById("participantList");

    participantList.innerHTML = "";

    group.members.forEach(member => {

        const label = document.createElement("label");

        label.className = "participant-option";

        const checked = expense
            ? expense.splitAmong.some(id => String(id) === String(member.id))
            : true;

        label.innerHTML = `

            <input
                type="checkbox"
                name="participants"
                value="${member.id}"
                ${checked ? "checked" : ""}
            >

            ${escapeHTML(member.name)}

        `;

        participantList.appendChild(label);

    });


    showModal(expenseModal);

}


// ======================================
// SAVE EXPENSE
// ======================================

expenseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const group = getActiveGroup();

    if (!group) return;

    const description =
        document.getElementById("expenseDescription").value.trim();

    const amount =
        Number(document.getElementById("expenseAmount").value);

    const category =
        document.getElementById("expenseCategory").value;

    const paidBy =
        document.getElementById("paidBy").value;

    const date =
        document.getElementById("expenseDate").value;


    const participants = Array.from(

        document.querySelectorAll(
            'input[name="participants"]:checked'
        )

    ).map(input => input.value);


    if (!description || !amount || amount <= 0 || !date) {

        alert("Please enter valid expense details.");

        return;

    }

    if (participants.length === 0) {

        alert("Select at least one participant.");

        return;

    }

    if (!participants.some(id => String(id) === String(paidBy))) {

        alert("The person who paid must also be included among the participants.");

        return;

    }


    const expenseData = {

        id: editingExpenseId || Date.now(),

        description: description,

        amount: amount,

        category: category,

        paidBy: paidBy,

        date: date,

        splitAmong: participants

    };


    if (editingExpenseId) {

        const index = group.expenses.findIndex(expense =>
            String(expense.id) === String(editingExpenseId)
        );

        if (index !== -1) {

            group.expenses[index] = expenseData;

        }

    } else {

        group.expenses.push(expenseData);

    }


    saveData();

    closeModal(expenseModal);

    editingExpenseId = null;

    renderApp();

});


// ======================================
// EDIT EXPENSE
// ======================================

function editExpense(expenseId) {

    const group = getActiveGroup();

    if (!group) return;

    const expense = group.expenses.find(item =>
        String(item.id) === String(expenseId)
    );

    if (!expense) return;

    openExpenseModal(expense);

}


// ======================================
// DELETE EXPENSE
// ======================================

function deleteExpense(expenseId) {

    const group = getActiveGroup();

    if (!group) return;

    if (!confirm("Delete this expense?")) return;

    group.expenses = group.expenses.filter(expense =>
        String(expense.id) !== String(expenseId)
    );

    saveData();

    renderApp();

}


// ======================================
// RENDER EXPENSES
// ======================================

function renderExpenses() {

    const group = getActiveGroup();

    const container = document.getElementById("expensesList");

    container.innerHTML = "";

    if (group.expenses.length === 0) {

        container.innerHTML =
            `<p class="muted">No expenses recorded yet.</p>`;

        return;

    }

    const sortedExpenses = [...group.expenses].sort((a, b) =>
        b.date.localeCompare(a.date)
    );

    sortedExpenses.forEach(expense => {

        const payer = group.members.find(member =>
            String(member.id) === String(expense.paidBy)
        );

        const item = document.createElement("div");

        item.className = "expense-item";

        item.innerHTML = `

            <div>

                <h3>${escapeHTML(expense.description)}</h3>

                <p>
                    ${escapeHTML(expense.category)}
                    • Paid by ${escapeHTML(payer ? payer.name : "Unknown")}
                    • ${escapeHTML(expense.date)}
                </p>

                <div class="expense-actions">

                    <button class="edit-btn"
                        onclick="editExpense(${Number(expense.id)})">

                        <i class="fa-solid fa-pen"></i> Edit

                    </button>

                    <button class="delete-btn"
                        onclick="deleteExpense(${Number(expense.id)})">

                        <i class="fa-solid fa-trash"></i> Delete

                    </button>

                </div>

            </div>

            <div class="expense-amount">
                ${formatMoney(expense.amount)}
            </div>

        `;

        container.appendChild(item);

    });

}


// ======================================
// SETTLEMENT CALCULATION
// ======================================

function calculateSettlements() {

    const group = getActiveGroup();

    if (!group) return [];

    const balances = {};

    group.members.forEach(member => {

        balances[member.id] = 0;

    });


    group.expenses.forEach(expense => {

        const participants = expense.splitAmong || [];

        if (participants.length === 0) return;

        const share = expense.amount / participants.length;

        // Person who paid gets credited

        balances[expense.paidBy] += expense.amount;

        // Every participant is charged their share

        participants.forEach(memberId => {

            balances[memberId] -= share;

        });

    });


    const debtors = [];

    const creditors = [];


    Object.entries(balances).forEach(([id, balance]) => {

        if (balance < -0.01) {

            debtors.push({

                id: id,

                amount: -balance

            });

        }

        else if (balance > 0.01) {

            creditors.push({

                id: id,

                amount: balance

            });

        }

    });


    const settlements = [];

    let i = 0;

    let j = 0;


    while (i < debtors.length && j < creditors.length) {

        const amount = Math.min(

            debtors[i].amount,

            creditors[j].amount

        );


        if (amount > 0.01) {

            settlements.push({

                from: debtors[i].id,

                to: creditors[j].id,

                amount: amount

            });

        }


        debtors[i].amount -= amount;

        creditors[j].amount -= amount;


        if (debtors[i].amount < 0.01) i++;

        if (creditors[j].amount < 0.01) j++;

    }


    return settlements;

}


// ======================================
// DISPLAY SETTLEMENTS
// ======================================

function renderSettlements() {

    const group = getActiveGroup();

    const container = document.getElementById("settlementsList");

    container.innerHTML = "";

    if (group.expenses.length === 0) {

        container.innerHTML =
            `<p class="muted">Add expenses to calculate settlements.</p>`;

        return;

    }

    const settlements = calculateSettlements();

    if (settlements.length === 0) {

        container.innerHTML = `
            <p class="muted">
                All members are settled up!
            </p>
        `;

        return;

    }


    settlements.forEach(item => {

        const from = group.members.find(member =>
            String(member.id) === String(item.from)
        );

        const to = group.members.find(member =>
            String(member.id) === String(item.to)
        );


        const card = document.createElement("div");

        card.className = "settlement-item";

        card.innerHTML = `

            <p>

                <strong>${escapeHTML(from ? from.name : "Unknown")}</strong>

                pays

                <strong>${escapeHTML(to ? to.name : "Unknown")}</strong>

            </p>

            <strong>${formatMoney(item.amount)}</strong>

        `;

        container.appendChild(card);

    });

}


// ======================================
// DASHBOARD
// ======================================

function renderDashboard() {

    const group = getActiveGroup();

    const totalSpending = group.expenses.reduce((total, expense) => {

        return total + expense.amount;

    }, 0);


    document.getElementById("totalSpending").textContent =
        formatMoney(totalSpending);

    document.getElementById("totalMembers").textContent =
        group.members.length;

    document.getElementById("totalExpenses").textContent =
        group.expenses.length;


    renderCategoryChart();

    renderRecentExpenses();

}


// ======================================
// CATEGORY BREAKDOWN
// ======================================

function renderCategoryChart() {

    const group = getActiveGroup();

    const container = document.getElementById("expenseChart");

    const categories = {};


    group.expenses.forEach(expense => {

        categories[expense.category] =
            (categories[expense.category] || 0) + expense.amount;

    });


    container.innerHTML = "";

    const total = group.expenses.reduce(
        (sum, expense) => sum + expense.amount, 0
    );

    if (total === 0) {

        container.innerHTML =
            `<p class="muted">No expenses recorded yet.</p>`;

        return;

    }


    Object.entries(categories).forEach(([category, amount]) => {

        const percentage = (amount / total) * 100;

        const item = document.createElement("div");

        item.className = "category-item";

        item.innerHTML = `

            <div class="category-info">

                <span>${escapeHTML(category)}</span>

                <span>${formatMoney(amount)}</span>

            </div>

            <div class="progress-bg">

                <div class="progress-bar"
                    style="width:${percentage}%">
                </div>

            </div>

        `;

        container.appendChild(item);

    });

}


// ======================================
// RECENT EXPENSES
// ======================================

function renderRecentExpenses() {

    const group = getActiveGroup();

    const container = document.getElementById("recentExpenses");

    container.innerHTML = "";

    const recent = [...group.expenses]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    if (recent.length === 0) {

        container.innerHTML =
            `<p class="muted">No expenses recorded yet.</p>`;

        return;

    }

    recent.forEach(expense => {

        const item = document.createElement("div");

        item.className = "expense-item";

        item.innerHTML = `

            <div>

                <h3>${escapeHTML(expense.description)}</h3>

                <p>${escapeHTML(expense.category)} • ${escapeHTML(expense.date)}</p>

            </div>

            <div class="expense-amount">
                ${formatMoney(expense.amount)}
            </div>

        `;

        container.appendChild(item);

    });

}


// ======================================
// APPLICATION RENDERING
// ======================================

function renderApp() {

    renderGroups();

    const group = getActiveGroup();

    if (!group) {

        noGroupMessage.classList.remove("hidden");

        sections.forEach(section => section.classList.add("hidden"));

        document.getElementById("groupSubtitle").textContent =
            "Create a group to start tracking expenses.";

        return;

    }


    noGroupMessage.classList.add("hidden");

    groupSelect.value = activeGroupId;

    document.getElementById("groupSubtitle").textContent =
        "Current group: " + group.name;

    document.getElementById("profileName").textContent =
        profileName;


    renderDashboard();

    renderMembers();

    renderExpenses();

    renderSettlements();


    // Keep the currently selected page visible after re-rendering.

    const validSections = ["dashboard", "members", "expenses", "settlements"];

    if (!validSections.includes(currentSection)) {
        currentSection = "dashboard";
    }

    sections.forEach(section => section.classList.add("hidden"));

    document.getElementById(currentSection).classList.remove("hidden");

    navLinks.forEach(link => link.classList.remove("active"));

    const activeLink = document.querySelector(`[data-section="${currentSection}"]`);

    if (activeLink) {
        activeLink.classList.add("active");
        document.getElementById("pageTitle").textContent = activeLink.textContent.trim();
    }

}


// ======================================
// INITIALIZE APPLICATION
// ======================================

if (!groups.some(group => String(group.id) === String(activeGroupId))) {

    activeGroupId = groups.length > 0 ? groups[0].id : null;

}

renderApp();