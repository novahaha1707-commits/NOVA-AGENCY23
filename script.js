const akunDatabase = {
    'fendi005': { pass: 'fendi567', role: 'Karyawan', nama: 'Fendi' },
    'bagusadi456': { pass: 'bagusbagus23', role: 'Karyawan', nama: 'Bagus Adi' },
    'nandaspv45': { pass: 'nanda@23', role: 'Supervisor', nama: 'Nanda (SPV)' },
    'irfan357': { pass: 'irfan_4', role: 'Manager', nama: 'Irfan (Manager)' },
    'center1': { pass: '@@234pusat', role: 'Pusat', nama: 'Pusat Administrator' }
};

window.onload = function() {
    const userAktif = localStorage.getItem('currentUser');
    const roleAktif = localStorage.getItem('currentRole');
    
    if (userAktif && roleAktif) {
        tampilkanDashboard(roleAktif, userAktif);
    }
};

function prosesLogin() {
    const idInput = document.getElementById('userId').value.trim();
    const passInput = document.getElementById('password').value.trim();
    const alertBox = document.getElementById('loginAlert');

    if (!akunDatabase[idInput] || akunDatabase[idInput].pass !== passInput) {
        alertBox.classList.remove('hidden');
        return;
    }

    alertBox.classList.add('hidden');
    localStorage.setItem('currentUser', idInput);
    localStorage.setItem('currentRole', akunDatabase[idInput].role);

    tampilkanDashboard(akunDatabase[idInput].role, idInput);
}

function tampilkanDashboard(role, userId) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('karyawanDashboard').classList.add('hidden');
    document.getElementById('centerDashboard').classList.add('hidden');

    if (role === 'Karyawan' || role === 'Supervisor' || role === 'Manager') {
        document.getElementById('karyawanDashboard').classList.remove('hidden');
        document.getElementById('welcomeUserKaryawan').innerText = `Halo, ${userId}`;
        document.getElementById('subtitleRole').innerText = `Portal ${role}`;
        muatDashboardKaryawan(userId);
    } else if (role === 'Pusat') {
        document.getElementById('centerDashboard').classList.remove('hidden');
        muatDataCutiPusat();
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
    location.reload();
}

function getDatabase() {
    return {
        absen: JSON.parse(localStorage.getItem('db_absen')) || [],
        cuti: JSON.parse(localStorage.getItem('db_cuti')) || []
    };
}

function prosesCheckIn() {
    const userAktif = localStorage.getItem('currentUser');
    if (!userAktif) return;
    
    const db = getDatabase();
    const hariIni = new Date().toISOString().split('T')[0];
    const jamIni = new Date().toLocaleTimeString();

    const sudahAbsen = db.absen.find(item => item.id === userAktif && item.tanggal === hariIni);
    if (sudahAbsen) {
        alert("Kamu sudah melakukan Check-In hari ini!");
        return;
    }

    db.absen.push({ id: userAktif, tanggal: hariIni, jamCheckIn: jamIni, jamCheckOut: '-' });
    localStorage.setItem('db_absen', JSON.stringify(db));

    alert("Check-In Berhasil!");
    muatDashboardKaryawan(userAktif);
}

function prosesCheckOut() {
    const userAktif = localStorage.getItem('currentUser');
    if (!userAktif) return;

    const db = getDatabase();
    const hariIni = new Date().toISOString().split('T')[0];
    const jamIni = new Date().toLocaleTimeString();

    const dataAbsen = db.absen.find(item => item.id === userAktif && item.tanggal === hariIni);
    if (!dataAbsen) {
        alert("Kamu belum melakukan Check-In hari ini!");
        return;
    }

    dataAbsen.jamCheckOut = jamIni;
    localStorage.setItem('db_absen', JSON.stringify(db));

    alert("Check-Out Berhasil dicatat!");
    muatDashboardKaryawan(userAktif);
}

function muatDashboardKaryawan(userId) {
    const db = getDatabase();
    const absenUser = db.absen.filter(item => item.id === userId);
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

    const cutiUser = db.cuti.filter(item => item.id === userId);
    const statusCutiEl = document.getElementById('statusCutiKaryawan');
    if (cutiUser.length > 0 && statusCutiEl) {
        const terakhir = cutiUser[cutiUser.length - 1];
        statusCutiEl.innerText = `Tanggal: ${terakhir.tanggal} | Status: ${terakhir.status.toUpperCase()}`;
        if (terakhir.status === 'Disetujui') statusCutiEl.style.background = '#dcfce7';
        else if (terakhir.status === 'Tidak Disetujui') statusCutiEl.style.background = '#fee2e2';
        else statusCutiEl.style.background = '#fef3c7';
    } else if (statusCutiEl) {
        statusCutiEl.innerText = "Belum ada pengajuan";
        statusCutiEl.style.background = "#f1f5f9";
    }
}

function submitCuti() {
    const userAktif = localStorage.getItem('currentUser');
    const tanggal = document.getElementById('tanggalCuti').value;
    const alasan = document.getElementById('alasanCuti').value;

    if (!tanggal || !alasan) {
        alert("Harap isi tanggal dan alasan cuti!");
        return;
    }

    const db = getDatabase();
    db.cuti.push({ id: userAktif, tanggal, alasan, status: 'Sedang ditinjau Pusat' });
    localStorage.setItem('db_absen', JSON.stringify(db)); // Perbaikan sinkronisasi database
    localStorage.setItem('db_cuti', JSON.stringify(db));

    alert("Pengajuan cuti berhasil dikirim!");
    document.getElementById('tanggalCuti').value = '';
    document.getElementById('alasanCuti').value = '';
    muatDashboardKaryawan(userAktif);
}

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
    let daftarID = [];
    if (role === 'Karyawan') daftarID = ['fendi005', 'bagusadi456'];
    else if (role === 'Supervisor') daftarID = ['nandaspv45'];
    else if (role === 'Manager') daftarID = ['irfan357'];

    container.innerHTML = `<strong>Pilih ID (${role}):</strong><br>`;
    daftarID.forEach(id => {
        container.innerHTML += `<button type="button" class="nav-tab-btn" style="background:#2563eb; color:white; margin:4px 0; padding:4px 8px; border:none; border-radius:4px;" onclick="lihatDetailAbsenID('${id}')">${id}</button> `;
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
    if (!container) return;

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
                Status: <b>${c.status}</b><br><br>
                <button type="button" class="nav-tab-btn" style="background:green; color:white; width:48%; display:inline-block; padding:6px; border:none; border-radius:4px;" onclick="ubahStatusCuti(${index}, 'Disetujui')">Setuju</button>
                <button type="button" class="nav-tab-btn" style="background:red; color:white; width:48%; display:inline-block; margin-left:4%; padding:6px; border:none; border-radius:4px;" onclick="ubahStatusCuti(${index}, 'Tidak Disetujui')">Tidak</button>
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
