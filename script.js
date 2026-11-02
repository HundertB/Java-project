const STORAGE_KEY = "drivehire_renting_app_v1";

const defaultState = {
    profile: {
        name: "Alex Morgan",
        phone: "+91 98765-43210",
        email: "alex.morgan@drivehire.in",
        payment: "UPI (PhonePe / GPay)"
    },
    fleet: [
        { id: 1, model: "Hyundai Creta SX", category: "SUV", reg: "KA-01-MJ-4412", tariff: 2800, status: "Available" },
        { id: 2, model: "Honda City VX", category: "Self-Drive Car", reg: "KA-03-EC-8819", tariff: 2200, status: "Available" },
        { id: 3, model: "Tata Nexon EV", category: "Self-Drive Car", reg: "KA-05-EV-1002", tariff: 2500, status: "Rented" },
        { id: 4, model: "Tata Ace Gold Van", category: "Delivery Van", reg: "KA-04-DV-3392", tariff: 1900, status: "Available" },
        { id: 5, model: "Royal Enfield Classic 350", category: "Motorcycle", reg: "KA-02-RE-7711", tariff: 900, status: "Available" },
        { id: 6, model: "Ather 450X EV", category: "EV Scooter", reg: "KA-01-ES-5520", tariff: 650, status: "Available" },
        { id: 7, model: "Toyota Innova Hycross", category: "SUV", reg: "KA-51-Z-9099", tariff: 4200, status: "Rented" },
        { id: 8, model: "Ashok Leyland Dost Van", category: "Delivery Van", reg: "KA-04-AL-8821", tariff: 2400, status: "Available" }
    ],
    partners: [
        { id: 1, name: "Apex Fleet Solutions", vehicles: 4, rating: 4.9, earnings: 42500 },
        { id: 2, name: "Metro Self-Drive Hub", vehicles: 3, rating: 4.8, earnings: 31200 },
        { id: 3, name: "GreenWheels EV Rentals", vehicles: 2, rating: 5.0, earnings: 19800 }
    ],
    rentals: [
        { id: "DH-RENT-9012", vehicle: "Tata Nexon EV", renter: "Alex Morgan", package: "2 Days (Daily)", cost: 5000, status: "Active" },
        { id: "DH-RENT-8841", vehicle: "Toyota Innova Hycross", renter: "Priya Nair", package: "3 Days (Daily)", cost: 12600, status: "Active" }
    ],
    rentalMode: "daily" // 'daily' or 'hourly'
};

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    updateMetrics();
}

window.addEventListener('DOMContentLoaded', () => {
    loadProfileToUI();
    renderRentalDropdown();
    renderRentalInventoryCards();
    renderFleetTable();
    renderPartnersGrid();
    renderActivityTable();
    updateRentalCalculation();
    updateMetrics();
});

// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`section-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('aside nav button').forEach(btn => {
        btn.className = "nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition text-zinc-400 hover:text-white hover:bg-zinc-800/60";
    });
    const activeDesktopBtn = document.getElementById(`side-nav-${tabId}`);
    if (activeDesktopBtn) {
        activeDesktopBtn.className = "nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition text-white bg-blue-600 shadow-lg shadow-blue-600/20";
    }

    document.querySelectorAll('nav.md\\:hidden button').forEach(btn => {
        btn.className = "flex flex-col items-center py-1 px-3 text-zinc-400";
    });
    const activeMobileBtn = document.getElementById(`mob-nav-${tabId}`);
    if (activeMobileBtn) {
        activeMobileBtn.className = "flex flex-col items-center py-1 px-3 text-blue-500";
    }
}

function updateMetrics() {
    const totalFleet = appState.fleet.length;
    const availableCount = appState.fleet.filter(f => f.status === 'Available').length;
    const activeRentals = appState.rentals.filter(r => r.status === 'Active').length;
    const totalRev = appState.rentals.reduce((acc, curr) => acc + curr.cost, 0);

    document.getElementById('stat-total-fleet').innerText = totalFleet;
    document.getElementById('stat-available').innerText = availableCount;
    document.getElementById('stat-rentals').innerText = activeRentals;
    document.getElementById('stat-revenue').innerText = '₹' + totalRev.toLocaleString('en-IN');
}

// Profile Management
function toggleProfileModal() {
    const modal = document.getElementById('modal-profile');
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) {
        document.getElementById('prof-name').value = appState.profile.name;
        document.getElementById('prof-phone').value = appState.profile.phone;
        document.getElementById('prof-email').value = appState.profile.email;
        document.getElementById('prof-payment').value = appState.profile.payment;
    }
}

function autoSaveProfileFields() {
    appState.profile.name = document.getElementById('prof-name').value;
    appState.profile.phone = document.getElementById('prof-phone').value;
    appState.profile.email = document.getElementById('prof-email').value;
    appState.profile.payment = document.getElementById('prof-payment').value;
    saveState();
    loadProfileToUI();
}

function handleSaveProfile(e) {
    e.preventDefault();
    autoSaveProfileFields();
    toggleProfileModal();
    showToast("Renter profile auto-saved successfully!");
}

function loadProfileToUI() {
    const namePhone = `${appState.profile.name} (${appState.profile.phone})`;
    document.getElementById('header-user-name').innerText = appState.profile.name;
    document.getElementById('rent-autofill-name').innerText = namePhone;
}

// RENTING MODULE LOGIC
function setRentalMode(mode) {
    appState.rentalMode = mode;
    const dailyBtn = document.getElementById('mode-daily');
    const hourlyBtn = document.getElementById('mode-hourly');
    const datesBox = document.getElementById('container-dates');
    const hoursBox = document.getElementById('container-hours');

    if(mode === 'daily') {
        dailyBtn.className = "py-2 rounded-xl border border-blue-500 bg-blue-600/10 text-white font-semibold text-xs transition";
        hourlyBtn.className = "py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 font-semibold text-xs transition";
        datesBox.classList.remove('hidden');
        hoursBox.classList.add('hidden');
    } else {
        hourlyBtn.className = "py-2 rounded-xl border border-blue-500 bg-blue-600/10 text-white font-semibold text-xs transition";
        dailyBtn.className = "py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 font-semibold text-xs transition";
        datesBox.classList.add('hidden');
        hoursBox.classList.remove('hidden');
    }
    updateRentalCalculation();
}

function renderRentalDropdown() {
    const select = document.getElementById('rent-vehicle-select');
    if(!select) return;
    const availableFleet = appState.fleet.filter(f => f.status === 'Available');
    select.innerHTML = availableFleet.map(f => `
        <option value="${f.id}" data-tariff="${f.tariff}">${f.model} (${f.category}) - ₹${f.tariff}/day [${f.reg}]</option>
    `).join('');

    // Set default date range
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');
    if(startInput && !startInput.value) startInput.value = today;
    if(endInput && !endInput.value) endInput.value = nextWeek;
}

function renderRentalInventoryCards() {
    const grid = document.getElementById('rental-inventory-grid');
    if(!grid) return;
    grid.innerHTML = appState.fleet.map(c => `
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">${c.category}</span>
                    <h3 class="font-bold text-white text-sm mt-1.5">${c.model}</h3>
                </div>
                <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${c.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${c.status}
                </span>
            </div>
            <div class="flex justify-between items-end text-xs pt-1 border-t border-zinc-800/80">
                <div>
                    <p class="text-zinc-500 text-[10px]">REGISTRATION</p>
                    <p class="font-mono text-zinc-300">${c.reg}</p>
                </div>
                <div class="text-right">
                    <p class="text-zinc-500 text-[10px]">RENTAL TARIFF</p>
                    <p class="font-mono text-blue-400 font-bold text-sm">₹${c.tariff.toLocaleString('en-IN')} <span class="text-zinc-500 text-[10px] font-normal">/day</span></p>
                </div>
            </div>
        </div>
    `).join('');

    const availableCount = appState.fleet.filter(f => f.status === 'Available').length;
    document.getElementById('inventory-count-label').innerText = `${availableCount} vehicles available`;
}

function updateRentalCalculation() {
    const select = document.getElementById('rent-vehicle-select');
    if(!select || select.options.length === 0) return;
    const selectedOpt = select.options[select.selectedIndex];
    const dailyTariff = parseFloat(selectedOpt.getAttribute('data-tariff')) || 2500;
    const promo = document.getElementById('rent-promo').value.trim().toUpperCase();

    let baseRateText = '';
    let durationText = '';
    let totalCost = 0;

    if(appState.rentalMode === 'daily') {
        baseRateText = `₹${dailyTariff.toLocaleString('en-IN')} / day`;
        const start = new Date(document.getElementById('rent-start-date').value);
        const end = new Date(document.getElementById('rent-end-date').value);
        let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if(isNaN(days) || days < 1) days = 1;

        durationText = `${days} Day${days > 1 ? 's' : ''}`;
        totalCost = dailyTariff * days;
    } else {
        const hourlyRate = Math.round(dailyTariff / 8);
        baseRateText = `₹${hourlyRate} / hour`;
        const hours = parseInt(document.getElementById('rent-hours-count').value) || 6;
        durationText = `${hours} Hour${hours > 1 ? 's' : ''}`;
        totalCost = hourlyRate * hours;
    }

    let discount = 0;
    if(promo === 'RENT10' || promo === 'RENT') {
        discount = totalCost * 0.12;
    }

    let finalFee = Math.max(200, totalCost - discount);

    document.getElementById('rent-base-rate').innerText = baseRateText;
    document.getElementById('rent-duration-label').innerText = durationText;
    document.getElementById('rent-discount').innerText = '₹' + discount.toFixed(2);
    document.getElementById('rent-total-fee').innerText = '₹' + Math.round(finalFee).toLocaleString('en-IN');
}

function confirmRentalCheckout() {
    const select = document.getElementById('rent-vehicle-select');
    if(!select || select.options.length === 0) {
        showToast("No available vehicles selected for renting.");
        return;
    }
    const vehicleName = select.options[select.selectedIndex].text.split(' - ')[0];
    const totalStr = document.getElementById('rent-total-fee').innerText.replace('₹', '').replace(/,/g, '');
    const totalCost = parseFloat(totalStr) || 2500;
    const durationLabel = document.getElementById('rent-duration-label').innerText;
    const packageDesc = `${durationLabel} (${appState.rentalMode === 'daily' ? 'Daily' : 'Hourly'})`;

    const newId = 'DH-RENT-' + Math.floor(1000 + Math.random() * 9000);
    appState.rentals.unshift({
        id: newId,
        vehicle: vehicleName,
        renter: appState.profile.name,
        package: packageDesc,
        cost: Math.round(totalCost),
        status: 'Active'
    });

    // Mark vehicle as rented
    const vehicleId = parseInt(select.value);
    const vehObj = appState.fleet.find(f => f.id === vehicleId);
    if(vehObj) vehObj.status = 'Rented';

    saveState();
    renderRentalDropdown();
    renderRentalInventoryCards();
    renderFleetTable();
    renderActivityTable();
    showToast(`Rental Confirmed! ID: ${newId} booked successfully.`);
    switchTab('activity');
}

// FLEET INVENTORY MANAGEMENT
function renderFleetTable() {
    const tbody = document.getElementById('fleet-table-body');
    if(!tbody) return;
    tbody.innerHTML = appState.fleet.map(f => `
        <tr class="hover:bg-zinc-900/50 transition">
            <td class="p-4 font-semibold text-white">${f.model}</td>
            <td class="p-4"><span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px]">${f.category}</span></td>
            <td class="p-4 font-mono text-zinc-400">${f.reg}</td>
            <td class="p-4 font-mono text-white">₹${f.tariff.toLocaleString('en-IN')}</td>
            <td class="p-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${f.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${f.status}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="toggleVehicleStatus(${f.id})" class="text-blue-400 hover:text-blue-300 font-medium">Toggle Status</button>
                <button onclick="deleteVehicle(${f.id})" class="text-red-400 hover:text-red-300"><i class="ph-bold ph-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if(show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function handleAddVehicle(e) {
    e.preventDefault();
    const model = document.getElementById('new-veh-model').value;
    const category = document.getElementById('new-veh-cat').value;
    const reg = document.getElementById('new-veh-reg').value.toUpperCase();
    const tariff = parseFloat(document.getElementById('new-veh-tariff').value) || 2200;

    appState.fleet.push({
        id: Date.now(),
        model, category, reg, tariff, status: 'Available'
    });

    saveState();
    renderFleetTable();
    renderRentalDropdown();
    renderRentalInventoryCards();
    toggleModal('modal-add-vehicle', false);
    showToast("Rental vehicle added to inventory!");
}

function toggleVehicleStatus(id) {
    const veh = appState.fleet.find(f => f.id === id);
    if(veh) {
        veh.status = veh.status === 'Available' ? 'Rented' : 'Available';
        saveState();
        renderFleetTable();
        renderRentalDropdown();
        renderRentalInventoryCards();
        showToast(`Vehicle status updated to ${veh.status}`);
    }
}

function deleteVehicle(id) {
    appState.fleet = appState.fleet.filter(f => f.id !== id);
    saveState();
    renderFleetTable();
    renderRentalDropdown();
    renderRentalInventoryCards();
    showToast("Vehicle removed from inventory.");
}

// FLEET PARTNERS
function renderPartnersGrid() {
    const grid = document.getElementById('partners-grid');
    if(!grid) return;
    grid.innerHTML = appState.partners.map(p => `
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
                        ${p.name.charAt(0)}
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-sm">${p.name}</h3>
                        <p class="text-xs text-zinc-400">${p.vehicles} Fleet Units Listed</p>
                    </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Partner
                </span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-xs">
                <div>
                    <p class="text-zinc-500 text-[10px]">RATING</p>
                    <p class="font-bold text-amber-400 font-mono">★ ${p.rating}</p>
                </div>
                <div>
                    <p class="text-zinc-500 text-[10px]">TOTAL EARNINGS</p>
                    <p class="font-bold text-emerald-400 font-mono">₹${p.earnings.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div class="flex justify-end pt-1">
                <button onclick="deletePartner(${p.id})" class="text-xs text-red-400 hover:text-red-300">Remove Partner</button>
            </div>
        </div>
    `).join('');
}

function handleAddPartner(e) {
    e.preventDefault();
    const name = document.getElementById('new-part-name').value;
    const vehicles = parseInt(document.getElementById('new-part-vehicles').value) || 2;
    const rating = parseFloat(document.getElementById('new-part-rating').value) || 4.9;

    appState.partners.push({
        id: Date.now(),
        name, vehicles, rating, earnings: 12000
    });

    saveState();
    renderPartnersGrid();
    toggleModal('modal-add-partner', false);
    showToast("Fleet partner registered successfully!");
}

function deletePartner(id) {
    appState.partners = appState.partners.filter(p => p.id !== id);
    saveState();
    renderPartnersGrid();
    showToast("Fleet partner removed.");
}

// RENTAL ACTIVITY LOG
function renderActivityTable() {
    const tbody = document.getElementById('activity-table-body');
    if(!tbody) return;
    tbody.innerHTML = appState.rentals.map(r => `
        <tr class="hover:bg-zinc-900/50 transition">
            <td class="p-4 font-mono font-bold text-blue-400">${r.id}</td>
            <td class="p-4 font-semibold text-white">${r.vehicle}</td>
            <td class="p-4 text-zinc-300">${r.renter}</td>
            <td class="p-4 text-zinc-400">${r.package}</td>
            <td class="p-4 font-mono text-white">₹${r.cost.toLocaleString('en-IN')}</td>
            <td class="p-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${r.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                    ${r.status}
                </span>
            </td>
            <td class="p-4 text-right">
                ${r.status === 'Active' ? `<button onclick="completeRental('${r.id}')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg transition">Complete & Return</button>` : `<span class="text-xs text-zinc-500">Returned</span>`}
            </td>
        </tr>
    `).join('');
}

function completeRental(id) {
    const rent = appState.rentals.find(r => r.id === id);
    if(rent) {
        rent.status = 'Completed';
        const veh = appState.fleet.find(f => f.model === rent.vehicle);
        if(veh) veh.status = 'Available';

        saveState();
        renderRentalDropdown();
        renderRentalInventoryCards();
        renderFleetTable();
        renderActivityTable();
        showToast(`Rental ${id} completed and vehicle returned!`);
    }
}

function exportActivityCSV() {
    let csv = 'Rental ID,Vehicle,Renter,Package,Cost (INR),Status\n';
    appState.rentals.forEach(r => {
        csv += `"${r.id}","${r.vehicle}","${r.renter}","${r.package}","${r.cost}","${r.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'DriveHire_Rental_History.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report exported successfully!");
}

// Custom Toast Notification
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-zinc-900 border border-zinc-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition transform translate-y-2 opacity-0";
    toast.innerHTML = `<i class="ph-bold ph-check-circle text-emerald-400 text-base"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
