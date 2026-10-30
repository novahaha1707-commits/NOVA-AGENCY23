const users = {
    "fendi005": { name: "fendi005", role: "karyawan", pass: "fendi567" },
    "bagusadi456": { name: "bagusadi456", role: "karyawan", pass: "bagusbagus23" },
    "nandaspv45": { name: "Nanda (Supervisor)", role: "supervisor", pass: "nanda@23" },
    "irfan357": { name: "Irfan (Manager)", role: "manager", pass: "irfan_4" },
    "center1": { name: "Admin Pusat", role: "center", pass: "@@234pusat" }
};

let currentUser = null;
let globalLogs = JSON.parse(localStorage.getItem('globalLogs')) || [];
let globalRatings = JSON.parse(localStorage.getItem('globalRatings')) || [];
let empHistories = JSON.parse(localStorage.getItem('empHistories')) || {};
let attendanceStatus = JSON.parse(localStorage.getItem('attendanceStatus')) || {}; // Menyimpan status 1x klik per user per hari

function handleLogin() {
    const id = document.getElementById("loginId").value.trim();
    const pass = document.getElementById("loginPass").value.trim();
    const alertBox = document.getElementById("loginAlert");

    if (!users[id] || users[id].pass !== pass) {
        alertBox.innerText = "ID atau Password salah!";
        alertBox.classList.remove("hidden");
        return;
    }

    alertBox.classList.add("hidden");
    currentUser = { id, ...users[id] };
    
    // Sembunyikan semua halaman
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("employeeDashboard").classList.add("hidden");
    document.getElementById("spvDashboard").classList.add("hidden");
    document.getElementById("managerDashboard").classList.add("hidden");
    document.getElementById("centerDashboard").classList.add("hidden");

    // Tampilkan sesuai role
    if (currentUser.role === "karyawan") {
        document.getElementById("empWelcome").innerText = `Halo, ${currentUser.name}`;
        document.getElementById("employeeDashboard").classList.remove("hidden");
        updateEmpHistoryView();
        checkButtonStates();
    } else if (currentUser.role === "supervisor") {
        document.getElementById("spvWelcome").innerText = `Halo, ${currentUser.name}`;
        document.getElementById("spvDashboard").classList.remove("hidden");
        checkButtonStates();
    } else if (currentUser.role === "manager") {
        document.getElementById("mgrWelcome").innerText = `Halo, ${currentUser.name}`;
        document.getElementById("managerDashboard").classList.remove("hidden");
        updateLogsView();
        checkButtonStates();
    } else if (currentUser.role === "center" || currentUser.role === "pusat") {
        document.getElementById("centerWelcome").innerText = `Halo, ${currentUser.name}`;
        document.getElementById("centerDashboard").classList.remove("hidden");
        updateLogsView();
        updateRatingsView();
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById("loginId").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("employeeDashboard").classList.add("hidden");
    document.getElementById("spvDashboard").classList.add("hidden");
    document.getElementById("managerDashboard").classList.add("hidden");
    document.getElementById("centerDashboard").classList.add("hidden");
}

function showEmpAlert(msg, type = "success") {
    const el = document.getElementById("empAlert");
    if(!el) return;
    el.className = type === "success" ? "success" : "alert";
    el.innerText = msg;
    setTimeout(() => { el.innerText = ""; el.className = ""; }, 4000);
}

// Cek status tombol agar terkunci hijau jika sudah absen hari ini
function checkButtonStates() {
    if (!currentUser) return;
    const todayKey = new Date().toDateString();
    const userState = attendanceStatus[currentUser.id] || {};

    let inBtn = null;
    let outBtn = null;

    if (currentUser.role === "karyawan") {
        inBtn = document.getElementById("btnCheckIn");
        outBtn = document.getElementById("btnCheckOut");
    } else if (currentUser.role === "supervisor") {
        inBtn = document.getElementById("btnSpvCheckIn");
        outBtn = document.getElementById("btnSpvCheckOut");
    } else if (currentUser.role === "manager") {
        inBtn = document.getElementById("btnMgrCheckIn");
        outBtn = document.getElementById("btnMgrCheckOut");
    }

    if (inBtn && userState.date === todayKey && userState.checkedIn) {
        inBtn.className = "btn-action btn-clicked";
        inBtn.innerHTML = "🟢 Sudah Check-In (Selesai)";
        inBtn.disabled = true;
    }
    if (outBtn && userState.date === todayKey && userState.checkedOut) {
        outBtn.className = "btn-action btn-clicked";
        outBtn.innerHTML = "🟢 Sudah Check-Out (Selesai)";
        outBtn.disabled = true;
    }
}

function doCheckIn() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => processCheckInLogic(true),
            () => {
                alert("Mohon aktifkan GPS/Lokasi di perangkat Anda.");
                processCheckInLogic(true); // Tetap diproses untuk simulasi fleksibel
            },
            { timeout: 10000 }
        );
    } else {
        processCheckInLogic(true);
    }
}

function processCheckInLogic(isGpsValid) {
    if (!isGpsValid) return;

    const todayKey = new Date().toDateString();
    if (!attendanceStatus[currentUser.id]) {
        attendanceStatus[currentUser.id] = { date: todayKey, checkedIn: false, checkedOut: false };
    }

    if (attendanceStatus[currentUser.id].date !== todayKey) {
        attendanceStatus[currentUser.id] = { date: todayKey, checkedIn: false, checkedOut: false };
    }

    if (attendanceStatus[currentUser.id].checkedIn) {
        alert("Anda sudah melakukan Check-In hari ini!");
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const minTime = 7 * 60; 
    const maxTime = 7 * 60 + 20;

    let roleBadge = `[${currentUser.role.toUpperCase()}]`;

    if (totalMinutes < minTime) {
        showEmpAlert("Belum waktunya check-in! Mulai pukul 07:00.", "alert");
    } else if (totalMinutes > maxTime) {
        showEmpAlert("Anda TERLAMBAT (> 07:20)! Tercatat di pusat.", "alert");
        addLog(`⚠️ ${roleBadge} ${currentUser.name} Check-In TERLAMBAT pukul ${formatTime(hours, minutes)}`);
        addEmpHistory(`⚠️ Check-In Terlambat pukul ${formatTime(hours, minutes)}`);
        markCheckedInSuccess();
    } else {
        showEmpAlert(`Berhasil Check-In Tepat Waktu pukul ${formatTime(hours, minutes)}.`);
        addLog(`✅ ${roleBadge} ${currentUser.name} berhasil Check-In Tepat Waktu.`);
        addEmpHistory(`✅ Check-In Tepat Waktu pukul ${formatTime(hours, minutes)}`);
        markCheckedInSuccess();
    }
}

function markCheckedInSuccess() {
    const todayKey = new Date().toDateString();
    attendanceStatus[currentUser.id].checkedIn = true;
    attendanceStatus[currentUser.id].date = todayKey;
    localStorage.setItem('attendanceStatus', JSON.stringify(attendanceStatus));
    checkButtonStates();
}

function doCheckOut() {
    const todayKey = new Date().toDateString();
    const userState = attendanceStatus[currentUser.id] || {};

    if (!userState.checkedIn) {
        alert("Anda harus melakukan Check-In terlebih dahulu sebelum Check-Out!");
        return;
    }

    if (userState.checkedOut) {
        alert("Anda sudah melakukan Check-Out hari ini!");
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const minCheckout = 17 * 60 + 10;
    let roleBadge = `[${currentUser.role.toUpperCase()}]`;

    if (totalMinutes < minCheckout) {
        showEmpAlert("Belum waktunya check-out! Minimal pukul 17:10.", "alert");
    } else {
        showEmpAlert(`Berhasil Check-Out pada pukul ${formatTime(hours, minutes)}. Hati-hati di jalan!`);
        addLog(`✅ ${roleBadge} ${currentUser.name} melakukan Check-Out Pulang.`);
        addEmpHistory(`✅ Check-Out Pulang pukul ${formatTime(hours, minutes)}`);
        
        attendanceStatus[currentUser.id].checkedOut = true;
        localStorage.setItem('attendanceStatus', JSON.stringify(attendanceStatus));
        checkButtonStates();
    }
}

function submitCuti() {
    const date = document.getElementById("cutiDate").value;
    const reason = document.getElementById("cutiReason").value;
    if (!date || !reason) {
        alert("Harap isi tanggal dan alasan cuti!");
        return;
    }
    showEmpAlert("Pengajuan cuti berhasil dikirim ke Supervisor & Pusat.");
    addLog(`📅 [CUTI] ${currentUser.name} mengajukan cuti pada tanggal ${date}. Alasan: "${reason}"`);
    addEmpHistory(`📅 Pengajuan Cuti (${date}): "${reason}"`);
    document.getElementById("cutiReason").value = "";
    document.getElementById("cutiDate").value = "";
}

function bukaAbsenTelat() {
    const targetId = document.getElementById("targetKaryawanTelat").value;
    alert(`Akses absen untuk ID (${targetId}) telah dibuka oleh Supervisor.`);
    addLog(`🔓 [OVERRIDE SPV] Supervisor ${currentUser.name} membukakan absen telat untuk Karyawan ID: ${targetId}`);
}

function submitRating() {
    const targetId = document.getElementById("rateKaryawan").value;
    const bintang = document.getElementById("rateBintang").value;
    const alasan = document.getElementById("rateAlasan").value;

    if (!alasan) {
        alert("Harap isi alasan/kritik penilaian!");
        return;
    }

    alert("Penilaian berhasil dikirim ke Pusat!");
    const logText = `⭐ [KPI RATING] Spv ${currentUser.name} menilai ${targetId} dengan rating ${bintang}. Catatan: "${alasan}"`;
    addLog(logText);
    
    globalRatings.unshift(`[${new Date().toLocaleTimeString()}] Penilaian untuk ${targetId} oleh ${currentUser.name}: ${bintang} - "${alasan}"`);
    localStorage.setItem('globalRatings', JSON.stringify(globalRatings));
    document.getElementById("rateAlasan").value = "";
    updateRatingsView();
}

function formatTime(h, m) {
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

function addLog(text) {
    const timestamp = new Date().toLocaleTimeString();
    globalLogs.unshift(`[${timestamp}] ${text}`);
    localStorage.setItem('globalLogs', JSON.stringify(globalLogs));
    updateLogsView();
}

function addEmpHistory(text) {
    if (!empHistories[currentUser.id]) {
        empHistories[currentUser.id] = [];
    }
    const timestamp = new Date().toLocaleTimeString();
    empHistories[currentUser.id].unshift(`[${timestamp}] ${text}`);
    localStorage.setItem('empHistories', JSON.stringify(empHistories));
    updateEmpHistoryView();
}

function updateEmpHistoryView() {
    const box = document.getElementById("empHistoryBox");
    if (!box || !currentUser) return;
    const history = empHistories[currentUser.id];
    if (!history || history.length === 0) {
        box.innerHTML = "<em>Belum ada catatan aktivitas hari ini.</em>";
    } else {
        box.innerHTML = history.join("<br>");
    }
}

function updateLogsView() {
    const logHtml = globalLogs.length === 0 ? "<em>Belum ada aktivitas tercatat.</em>" : globalLogs.join("<br><br>");
    if(document.getElementById("centerLogBox")) document.getElementById("centerLogBox").innerHTML = logHtml;
    if(document.getElementById("managerLogBox")) document.getElementById("managerLogBox").innerHTML = logHtml;
}

function updateRatingsView() {
    const rateHtml = globalRatings.length === 0 ? "<em>Belum ada penilaian kinerja yang masuk.</em>" : globalRatings.join("<br><br>");
    if(document.getElementById("centerRatingBox")) document.getElementById("centerRatingBox").innerHTML = rateHtml;
}

// Navigasi Tab Menu Beranda di Dashboard Pusat
function switchCenterTab(tabName) {
    document.getElementById("centerSectionAbsensi").classList.add("hidden");
    document.getElementById("centerSectionJadwal").classList.add("hidden");
    document.getElementById("centerSectionPenilaian").classList.add("hidden");

    document.getElementById("tabAbsensi").classList.remove("active-tab");
    document.getElementById("tabJadwal").classList.remove("active-tab");
    document.getElementById("tabPenilaian").classList.remove("active-tab");

    if (tabName === 'absensi') {
        document.getElementById("centerSectionAbsensi").classList.remove("hidden");
        document.getElementById("tabAbsensi").classList.add("active-tab");
    } else if (tabName === 'jadwal') {
        document.getElementById("centerSectionJadwal").classList.remove("hidden");
        document.getElementById("tabJadwal").classList.add("active-tab");
    } else if (tabName === 'penilaian') {
        document.getElementById("centerSectionPenilaian").classList.remove("hidden");
        document.getElementById("tabPenilaian").classList.add("active-tab");
        updateRatingsView();
    }
}

window.onload = function() {
    updateLogsView();
    updateRatingsView();
};
