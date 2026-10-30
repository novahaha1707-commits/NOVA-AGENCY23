const users = {
    "fendi005": { name: "Fendi", role: "karyawan", pass: "fendi567" },
    "bagusadi456": { name: "Bagus Adi", role: "karyawan", pass: "bagusbagus23" },
    "nandaspv45": { name: "Nanda (Supervisor)", role: "supervisor", pass: "nanda@23" },
    "irfan357": { name: "Irfan (Manager)", role: "manager", pass: "irfan_4" },
    "center1": { name: "Admin Pusat", role: "center", pass: "@@234pusat" }
};

let currentUser = null;
let globalLogs = JSON.parse(localStorage.getItem('globalLogs')) || [];
let globalRatings = JSON.parse(localStorage.getItem('globalRatings')) || [];
let empHistories = JSON.parse(localStorage.getItem('empHistories')) || {};
let attendanceStatus = JSON.parse(localStorage.getItem('attendanceStatus')) || {};

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
    
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("employeeDashboard").classList.add("hidden");
    document.getElementById("spvDashboard").classList.add("hidden");
    document.getElementById("managerDashboard").classList.add("hidden");
    document.getElementById("centerDashboard").classList.add("hidden");

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
    const todayKey = new Date().toDateString();
    if (!attendanceStatus[currentUser.id]) {
        attendanceStatus[currentUser.id] = { date: todayKey, checkedIn: false, checkedOut: false };
    }
    if (attendanceStatus[currentUser.id].checkedIn) {
        alert("Anda sudah melakukan Check-In hari ini!");
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    let roleBadge = `[${currentUser.role.toUpperCase()}]`;

    showEmpAlert(`Berhasil Check-In pada pukul ${formatTime(hours, minutes)}.`);
    addLog(`✅ ${roleBadge} ${currentUser.name} berhasil Check-In.`);
    addEmpHistory(`✅ Check-In pukul ${formatTime(hours, minutes)}`);
    
    attendanceStatus[currentUser.id].checkedIn = true;
    attendanceStatus[currentUser.id].date = todayKey;
    localStorage.setItem('attendanceStatus', JSON.stringify(attendanceStatus));
    checkButtonStates();
}

function doCheckOut() {
    const todayKey = new Date().toDateString();
    const userState = attendanceStatus[currentUser.id] || {};

    if (!userState.checkedIn) {
        alert("Anda harus melakukan Check-In terlebih dahulu!");
        return;
    }
    if (userState.checkedOut) {
        alert("Anda sudah melakukan Check-Out hari ini!");
        return;
    }

    const now = new Date();
    let roleBadge = `[${currentUser.role.toUpperCase()}]`;

    showEmpAlert(`Berhasil Check-Out pada pukul ${formatTime(now.getHours(), now.getMinutes())}.`);
    addLog(`✅ ${roleBadge} ${currentUser.name} melakukan Check-Out.`);
    addEmpHistory(`✅ Check-Out pukul ${formatTime(now.getHours(), now.getMinutes())}`);
    
    attendanceStatus[currentUser.id].checkedOut = true;
    localStorage.setItem('attendanceStatus', JSON.stringify(attendanceStatus));
    checkButtonStates();
}

function submitCuti() {
    const date = document.getElementById("cutiDate").value;
    const reason = document.getElementById("cutiReason").value;
    if (!date || !reason) {
        alert("Harap isi tanggal dan alasan cuti!");
        return;
    }
    showEmpAlert("Pengajuan cuti berhasil dikirim.");
    addLog(`📅 [CUTI] ${currentUser.name} mengajukan cuti tanggal ${date}. Alasan: "${reason}"`);
    addEmpHistory(`📅 Pengajuan Cuti (${date})`);
    document.getElementById("cutiReason").value = "";
    document.getElementById("cutiDate").value = "";
}

function bukaAbsenTelat() {
    const targetId = document.getElementById("targetKaryawanTelat").value;
    alert(`Akses absen untuk ID (${targetId}) telah dibuka.`);
    addLog(`🔓 [OVERRIDE SPV] Supervisor ${currentUser.name} membukakan absen untuk ${targetId}`);
}

function submitRating() {
    const targetId = document.getElementById("rateKaryawan").value;
    const bintang = document.getElementById("rateBintang").value;
    const alasan = document.getElementById("rateAlasan").value;
    if (!alasan) {
        alert("Harap isi alasan penilaian!");
        return;
    }
    alert("Penilaian berhasil dikirim!");
    addLog(`⭐ [KPI] Spv ${currentUser.name} menilai ${targetId} (${bintang}): "${alasan}"`);
    globalRatings.unshift(`[${new Date().toLocaleTimeString()}] Penilaian untuk ${targetId}: ${bintang} - "${alasan}"`);
    localStorage.setItem('globalRatings', JSON.stringify(globalRatings));
    document.getElementById("rateAlasan").value = "";
    updateRatingsView();
}

function formatTime(h, m) {
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

function addLog(text) {
    globalLogs.unshift(`[${new Date().toLocaleTimeString()}] ${text}`);
    localStorage.setItem('globalLogs', JSON.stringify(globalLogs));
    updateLogsView();
}

function addEmpHistory(text) {
    if (!empHistories[currentUser.id]) empHistories[currentUser.id] = [];
    empHistories[currentUser.id].unshift(`[${new Date().toLocaleTimeString()}] ${text}`);
    localStorage.setItem('empHistories', JSON.stringify(empHistories));
    updateEmpHistoryView();
}

function updateEmpHistoryView() {
    const box = document.getElementById("empHistoryBox");
    if (!box || !currentUser) return;
    const history = empHistories[currentUser.id];
    box.innerHTML = (!history || history.length === 0) ? "<em>Belum ada catatan aktivitas.</em>" : history.join("<br>");
}

function updateLogsView() {
    const logHtml = globalLogs.length === 0 ? "<em>Belum ada aktivitas.</em>" : globalLogs.join("<br><br>");
    if(document.getElementById("centerLogBox")) document.getElementById("centerLogBox").innerHTML = logHtml;
    if(document.getElementById("managerLogBox")) document.getElementById("managerLogBox").innerHTML = logHtml;
}

function updateRatingsView() {
    const rateHtml = globalRatings.length === 0 ? "<em>Belum ada penilaian.</em>" : globalRatings.join("<br><br>");
    if(document.getElementById("centerRatingBox")) document.getElementById("centerRatingBox").innerHTML = rateHtml;
}

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
// --- PR ATURAN CHECK-IN & CHECK-OUT 24 JAM ---
function aturWaktuAbsen() {
    const sekarang = new Date();
    const jam = sekarang.getHours(); // Format 24 jam (0 - 23)
    const menit = sekarang.getMinutes();
    const waktuSekarang = jam + (menit / 60);

    const btnCheckIn = document.getElementById('btnCheckIn');
    const btnCheckOut = document.getElementById('btnCheckOut');

    // Contoh: Check-In aktif mulai pukul 07.00 pagi sampai sebelum pukul 17.00 sore
    if (btnCheckIn) {
        if (waktuSekarang >= 7.0 && waktuSekarang < 17.0) {
            btnCheckIn.disabled = false;
            btnCheckIn.innerText = "CHECK-IN SEKARANG";
        } else {
            btnCheckIn.disabled = true;
            btnCheckIn.innerText = "CHECK-IN DIBUKA JAM 07.00";
        }
    }

    // Aturan 24 Jam / Reset Check-Out setelah pukul 17.00 atau lewat batas
    if (btnCheckOut) {
        // Misal check-out bisa ditekan setelah jam 15.00 hingga lewat tengah malam
        if (waktuSekarang >= 15.0 || waktuSekarang < 7.0) {
            btnCheckOut.disabled = false;
        } else {
            btnCheckOut.disabled = true;
        }
    }
}

// Jalankan fungsi saat halaman selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
    aturWaktuAbsen();
    // Cek ulang setiap 1 menit otomatis
    setInterval(aturWaktuAbsen, 60000);
});
// --- SIMULASI & PENYIMPANAN DATA LOCALSTORAGE ---
function getDatabase() {
    return {
        absen: JSON.parse(localStorage.getItem('db_absen')) || [],
        cuti: JSON.parse(localStorage.getItem('db_cuti')) || []
    };
}

// 1. Fitur Check-In & Hitung Target 25 Hari
function prosesCheckIn() {
    const userAktif = localStorage.getItem('currentUser') || 'fendi005';
    const db = getDatabase();
    const hariIni = new Date().toISOString().split('T')[0];
    const jamIni = new Date().toLocaleTimeString();

    // Cek apakah sudah absen hari ini
    const sudahAbsen = db.absen.find(item => item.id === userAktif && item.tanggal === hariIni);
    if (sudahAbsen) {
        alert("Anda sudah melakukan Check-In hari ini!");
        return;
    }

    // Masukkan data absen baru
    db.absen.push({ id: userAktif, role: 'Karyawan', tanggal: hariIni, jamCheckIn: jamIni, jamCheckOut: '-' });
    localStorage.setItem('db_absen', JSON.stringify(db));

    alert("Check-In Berhasil!");
    muatDashboardKaryawan();
}

function prosesCheckOut() {
    const userAktif = localStorage.getItem('currentUser') || 'fendi005';
    const db = getDatabase();
    const hariIni = new Date().toISOString().split('T')[0];
    const jamIni = new Date().toLocaleTimeString();

    const dataAbsenHariIni = db.absen.find(item => item.id === userAktif && item.tanggal === hariIni);
    if (!dataAbsenHariIni) {
        alert("Anda belum melakukan Check-In hari ini!");
        return;
    }

    dataAbsenHariIni.jamCheckOut = jamIni;
    localStorage.setItem('db_absen', JSON.stringify(db));

    alert("Check-Out Berhasil dicatat (Masa aktif 24 jam dimulai)!");
    muatDashboardKaryawan();
}

function muatDashboardKaryawan() {
    const userAktif = localStorage.getItem('currentUser') || 'fendi005';
    const db = getDatabase();
    
    // Hitung total hari masuk (target minimal 25 hari)
    const absenUser = db.absen.filter(item => item.id === userAktif);
    const totalHari = absenUser.length;
    const target = 25;

    const infoTarget = document.getElementById('infoTargetAbsen');
    if (infoTarget) {
        if (totalHari >= target) {
            infoTarget.innerHTML = `✅ Total Masuk: <b>${totalHari} hari</b>. <span style="color:green;">Target 25 hari tercapai!</span>`;
        } else {
            infoTarget.innerHTML = `⚠️ Total Masuk: <b>${totalHari} / ${target} hari</b>. Kurang ${target - totalHari} hari lagi untuk capai target bulanan.`;
        }
    }

    // Tampilkan Status Cuti Terakhir
    const cutiUser = db.cuti.filter(item => item.id === userAktif);
    const statusCutiEl = document.getElementById('statusCutiKaryawan');
    if (cutiUser.length > 0 && statusCutiEl) {
        const terakhir = cutiUser[cutiUser.length - 1];
        statusCutiEl.innerText = `Tanggal: ${terakhir.tanggal} | Status: ${terakhir.status.toUpperCase()}`;
        if (terakhir.status === 'Disetujui') statusCutiEl.style.background = '#dcfce7';
        else if (terakhir.status === 'Tidak Disetujui') statusCutiEl.style.background = '#fee2e2';
    }
}


// 2. Fitur Pengajuan Cuti oleh Karyawan
function submitCuti() {
    const userAktif = localStorage.getItem('currentUser') || 'fendi005';
    const tanggal = document.getElementById('tanggalCuti').value;
    const alasan = document.getElementById('alasanCuti').value;

    if (!tanggal || !alasan) {
        alert("Harap isi tanggal dan alasan cuti!");
        return;
    }

    const db = getDatabase();
    db.cuti.push({ id: userAktif, tanggal, alasan, status: 'Sedang ditinjau Pusat' });
    localStorage.setItem('db_cuti', JSON.stringify(db));

    alert("Pengajuan cuti berhasil dikirim dan sedang ditinjau Pusat.");
    muatDashboardKaryawan();
}


// 3. Logika Tab & Interaksi Panel Pusat
function gantiTabPusat(tab) {
    const panelAtt = document.getElementById('panelAttendance');
    const panelLibur = document.getElementById('panelLibur');
    const tabs = document.querySelectorAll('.center-nav-tabs .nav-tab-btn');

    tabs.forEach(t => t.classList.remove('active-tab'));

    if (tab === 'attendance') {
        panelAtt.classList.remove('hidden');
        panelLibur.classList.add('hidden');
        tabs[0].classList.add('active-tab');
    } else {
        panelAtt.classList.add('hidden');
        panelLibur.classList.remove('hidden');
        tabs[1].classList.add('active-tab');
        muatDataCutiPusat();
    }
}

function filterRoleAttendance(role) {
    const container = document.getElementById('listUserAttendance');
    // Contoh daftar ID berdasarkan role
    let daftarID = [];
    if (role === 'Karyawan') daftarID = ['fendi005', 'bagusadi456'];
    else if (role === 'Supervisor') daftarID = ['nandaspv45'];
    else if (role === 'Manager') daftarID = ['irfan357'];

    container.innerHTML = `<strong>Pilih ID (${role}):</strong><br>`;
    daftarID.forEach(id => {
        container.innerHTML += `<button class="nav-tab-btn" style="background:#2563eb; color:white; margin:4px 0;" onclick="lihatDetailAbsenID('${id}')">${id}</button>`;
    });
}

function lihatDetailAbsenID(idTarget) {
    const db = getDatabase();
    const data = db.absen.filter(item => item.id === idTarget);
    const detailEl = document.getElementById('textDetailAbsen');

    if (data.length === 0) {
        detailEl.innerHTML = `ID <b>${idTarget}</b> belum memiliki catatan riwayat absensi.`;
        return;
    }

    let html = `<b>ID: ${idTarget}</b> | Total Absen: <b>${data.length} kali</b><br><ul>`;
    data.forEach(d => {
        html += `<li>Tgl: ${d.tanggal} | In: ${d.jamCheckIn} | Out: ${d.jamCheckOut}</li>`;
    });
    html += `</ul>`;
    detailEl.innerHTML = html;
}

function muatDataCutiPusat() {
    const db = getDatabase();
    const container = document.getElementById('listPengajuanCuti');

    if (db.cuti.length === 0) {
        container.innerHTML = `<p style="color:#64748b;">Belum ada pengajuan cuti masuk.</p>`;
        return;
    }

    container.innerHTML = "";
    db.cuti.forEach((c, index) => {
        container.innerHTML += `
            <div style="border-bottom:1px solid #cbd5e1; padding-bottom:8px; margin-bottom:8px;">
                <b>ID: ${c.id}</b> | Tgl: ${c.tanggal}<br>
                Alasan: ${c.alasan}<br>
                Status: <b>${c.status}</b><br>
                <button class="nav-tab-btn" style="background:green; color:white; width:48%; display:inline-block;" onclick="ubahStatusCuti(${index}, 'Disetujui')">Setuju</button>
                <button class="nav-tab-btn" style="background:red; color:white; width:48%; display:inline-block; margin-left:4%;" onclick="ubahStatusCuti(${index}, 'Tidak Disetujui')">Tidak</button>
            </div>
        `;
    });
}

function ubahStatusCuti(index, statusBaru) {
    const db = getDatabase();
    db.cuti[index].status = statusBaru;
    localStorage.setItem('db_cuti', JSON.stringify(db));
    alert(`Pengajuan berhasil diubah menjadi: ${statusBaru}`);
    muatDataCutiPusat();
}
