const users = {
    "fendi005": { name: "Fendi", role: "karyawan", pass: "fendi567" },
    "bagusadi456": { name: "Bagus Adi", role: "karyawan", pass: "bagusbagus23" },
    "nandaspv45": { name: "Nanda (Supervisor)", role: "supervisor", pass: "nanda@23" },
    "irfan357": { name: "Irfan (Manager)", role: "manager", pass: "irfan_4" },
    "center1": { name: "Admin Pusat", role: "pusat", pass: "@@234pusat" }
};

let currentUser = null;
let globalLogs = [];

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
    } else if (currentUser.role === "supervisor") {
        document.getElementById("spvWelcome").innerText = `Halo, ${currentUser.name}`;
        document.getElementById("spvDashboard").classList.remove("hidden");
    } else if (currentUser.role === "manager") {
        document.getElementById("mgrWelcome").innerText = `Halo, ${currentUser.name}`;
        updateLogsView();
        document.getElementById("managerDashboard").classList.remove("hidden");
    } else if (currentUser.role === "pusat") {
        document.getElementById("centerWelcome").innerText = `Halo, ${currentUser.name}`;
        updateLogsView();
        document.getElementById("centerDashboard").classList.remove("hidden");
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
    el.className = type === "success" ? "success" : "alert";
    el.innerText = msg;
    setTimeout(() => { el.innerText = ""; el.className = ""; }, 4000);
}

function doCheckIn() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const minTime = 7 * 60; 
    const maxTime = 7 * 60 + 20;

    if (totalMinutes < minTime) {
        showEmpAlert("Belum waktunya check-in! Mulai pukul 07:00.", "alert");
    } else if (totalMinutes > maxTime) {
        showEmpAlert("Anda TERLAMBAT (> 07:20)! Hubungi Supervisor untuk membuka absen.", "alert");
        addLog(`⚠️ [TELAT] Karyawan ${currentUser.name} (${currentUser.id}) mencoba check-in terlambat.`);
    } else {
        showEmpAlert(`Berhasil Check-In pada pukul ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')} (Lokasi Valid).`);
        addLog(`✅ [ABSEN] ${currentUser.name} berhasil Check-In tepat waktu.`);
    }
}

function doCheckOut() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const minCheckout = 17 * 60 + 10;

    if (totalMinutes < minCheckout) {
        showEmpAlert("Belum waktunya check-out! Minimal pukul 17:10.", "alert");
    } else {
        showEmpAlert(`Berhasil Check-Out pada pukul ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}. Hati-hati di jalan!`);
        addLog(`✅ [ABSEN] ${currentUser.name} melakukan Check-Out.`);
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
    document.getElementById("cutiReason").value = "";
}

function bukaAbsenTelat() {
    const targetId = document.getElementById("targetKaryawanTelat").value;
    alert(`Akses absen untuk ID (${targetId}) telah dibuka oleh Supervisor.`);
    addLog(`🔓 [OVERRIDE SPV] Supervisor ${currentUser.name} membukakan absen telat untuk Karyawan ID: ${targetId}`);
    updateLogsView();
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
    addLog(`⭐ [KPI RATING] Spv ${currentUser.name} menilai ${targetId} dengan rating ${bintang}. Catatan: "${alasan}"`);
    document.getElementById("rateAlasan").value = "";
    updateLogsView();
}

function addLog(text) {
    const timestamp = new Date().toLocaleTimeString();
    globalLogs.unshift(`[${timestamp}] ${text}`);
}

function updateLogsView() {
    const logHtml = globalLogs.length === 0 ? "<em>Belum ada aktivitas tercatat.</em>" : globalLogs.join("<br><br>");
    if(document.getElementById("centerLogBox")) document.getElementById("centerLogBox").innerHTML = logHtml;
    if(document.getElementById("managerLogBox")) document.getElementById("managerLogBox").innerHTML = logHtml;
      }
