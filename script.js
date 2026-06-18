const firebaseConfig = {
    apiKey: "AIzaSyD9BmV4XKXuMWa4PZHpb7Bbt-rHs61m3lE",
    authDomain: "absensi-polri.firebaseapp.com",
    databaseURL: "https://absensi-polri-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "absensi-polri",
    storageBucket: "absensi-polri.firebasestorage.app",
    messagingSenderId: "19006760644",
    appId: "1:19006760644:web:b7dac0410e47877ded4b91",
    measurementId: "G-82KHRYZBN0"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let loggedInUser = "";
const mapelWajibDefault = ["Bahasa Indonesia", "Bahasa Sunda", "Bahasa Inggris", "Matematika", "Informatika", "Biologi", "Fisika", "Sejarah", "Ekonomi", "PKWU"];
let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelWajibDefault;
let statusAksesGlobal = "OPEN"; // Default awal

document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
    muatDaftarMapelTab();
    dengarkanStatusAksesRealtime();

    // Kontrol Event Navigasi Utama
    document.getElementById('tombol-masuk-sias').addEventListener('click', loginSistem);
    document.getElementById('btn-kembali-menu').addEventListener('click', kembaliKeMenuInput);
    
    // Manajemen Perpindahan Tab Menu Atas
    document.getElementById('btn-tab-input').addEventListener('click', (e) => bukaTab(e, 'sub-input', 'Dashboard Utama', false));
    document.getElementById('btn-tab-semua').addEventListener('click', (e) => { bukaTab(e, 'sub-seluruh-siswa', 'Seluruh Siswa', true); muatSeluruhSiswa(); });
    document.getElementById('btn-tab-kelas').addEventListener('click', (e) => bukaTab(e, 'sub-setiap-kelas', 'Filter Kelas', true));
    document.getElementById('btn-tab-mapel').addEventListener('click', (e) => bukaTab(e, 'sub-mata-pelajaran', 'Atur Mapel', true));
    document.getElementById('btn-tab-akses').addEventListener('click', (e) => bukaTab(e, 'sub-akses-portal', 'Kendali Akses', true));
    document.getElementById('btn-tab-stats').addEventListener('click', (e) => { bukaTab(e, 'sub-nilai-stats', 'Analisis Statistik', true); hitungStatistikNilai(); });
    document.getElementById('btn-tab-settings').addEventListener('click', (e) => bukaTab(e, 'sub-settings', 'Pengaturan', true));
    document.getElementById('btn-tab-logout').addEventListener('click', logoutSistem);

    // Event Manajemen Kendali Akses Portal
    document.getElementById('btn-open-akses').addEventListener('click', () => ubahStatusAksesSistem("OPEN"));
    document.getElementById('btn-close-akses').addEventListener('click', () => ubahStatusAksesSistem("CLOSE"));

    // Event Modul Input Formulir Kerja
    document.getElementById('btn-simpan-cloud').addEventListener('click', simpanDataSistem);
    document.getElementById('btn-tambah-mapel').addEventListener('click', tambahMapelKustom);
    document.getElementById('btn-refresh-stats').addEventListener('click', hitungStatistikNilai);
    document.getElementById('btn-reset-mapel').addEventListener('click', clearMapelCache);
    document.getElementById('filter-kelas-dropdown').addEventListener('change', (e) => muatDataPerKelas(e.target.value));
});

// 1. DENGARKAN STATUS AKSES SECARA REAL-TIME DARI FIREBASE
function dengarkanStatusAksesRealtime() {
    database.ref('konfigurasi_akses/status').on('value', (snapshot) => {
        if (snapshot.exists()) {
            statusAksesGlobal = snapshot.val();
        } else {
            statusAksesGlobal = "OPEN";
        }
        terapkanKunciAksesUI();
    });
}

// 2. UBAH STATUS AKSES KE DATABASE FIREBASE
function ubahStatusAksesSistem(statusBaru) {
    database.ref('konfigurasi_akses').set({ status: statusBaru }, (err) => {
        if (!err) {
            Swal.fire({
                title: 'Status Diperbarui',
                text: `Sistem portal berhasil diubah menjadi: ${statusBaru} AKSES`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// 3. LOGIKA UNTUK LOCK / UNLOCK UI SECARA OTOMATIS
function terapkanKunciAksesUI() {
    const bannerAlert = document.getElementById('alert-akses-tertutup');
    const btnSimpan = document.getElementById('btn-simpan-cloud');
    const inputsForm = document.querySelectorAll('#wrapper-form-input .input-field');
    const badgeStatus = document.getElementById('badge-status-akses');

    if (statusAksesGlobal === "CLOSE") {
        // Blokir Form Input Depan
        if(bannerAlert) bannerAlert.style.display = "block";
        if(btnSimpan) { btnSimpan.disabled = true; btnSimpan.style.background = "#94a3b8"; btnSimpan.innerText = "AKSES DIKUNCI"; }
        inputsForm.forEach(input => input.disabled = true);
        
        // Update Tampilan Tab Kendali
        if(badgeStatus) {
            badgeStatus.innerText = "CLOSE AKSES (TERKUNCI)";
            badgeStatus.className = "status-hardware-badge no-support";
        }
    } else {
        // Buka Form Input Depan
        if(bannerAlert) bannerAlert.style.display = "none";
        if(btnSimpan) { btnSimpan.disabled = false; btnSimpan.style.background = "#2563eb"; btnSimpan.innerText = "SIMPAN DATA"; }
        inputsForm.forEach(input => input.disabled = false);
        
        // Update Tampilan Tab Kendali
        if(badgeStatus) {
            badgeStatus.innerText = "OPEN AKSES (TERBUKA)";
            badgeStatus.className = "status-hardware-badge support";
        }
    }
}

// 4. LOGIKA PERPINDAHAN TAB & NAVIGATION CONTROL
function bukaTab(evt, tabId, judulHalaman, tampilkanTombolKembali) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (evt) evt.currentTarget.classList.add('active');

    document.getElementById('judul-halaman-aktif').innerText = judulHalaman;
    const btnKembali = document.getElementById('btn-kembali-menu');
    
    if (tampilkanTombolKembali) {
        btnKembali.style.display = "block";
    } else {
        btnKembali.style.display = "none";
    }
}

function kembaliKeMenuInput() {
    const tombolTabInput = document.getElementById('btn-tab-input');
    bukaTab({ currentTarget: tombolTabInput }, 'sub-input', 'Dashboard Utama', false);
}

// 5. ATURAN INPUT LOGIN MANUAL SIAS
function loginSistem() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;
    if (u === 'AdminSMANSALA#' && p === 'SIAS2026-27##') {
        loggedInUser = u;
        switchPanel('panel-menu');
        document.getElementById('menu-pengguna').value = loggedInUser;
        kembaliKeMenuInput();
    } else {
        Swal.fire('Gagal Masuk', 'Kredensial salah!', 'error');
    }
}

function switchPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// 6. MANAJEMEN PENYIMPANAN DATA UTAMA KE DATABASE SISWA
function simpanDataSistem() {
    if (statusAksesGlobal === "CLOSE") {
        Swal.fire('Ditolak', 'Tidak dapat menyimpan data, status portal sedang CLOSE AKSES!', 'error');
        return;
    }

    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;
    
    if (!kelas || !nama || !mapel || !nilai) { Swal.fire('Gagal', 'Lengkapi data!', 'warning'); return; }
    
    database.ref('data_siswa').push({ kelas, nama_siswa: nama, mata_pelajaran: mapel, nilai_siswa: parseFloat(nilai), pengguna_petugas: pengguna }, (err) => {
        if (!err) { 
            document.getElementById('menu-nama').value = ""; 
            document.getElementById('menu-nilai').value = ""; 
            Swal.fire('Berhasil', 'Data berhasil disinkronisasi ke Cloud!', 'success'); 
        }
    });
}

// 7. AMBIL & OLAH KUMPULAN DATA SEOLAH LOKAL/GLOBAL REKURENS
function muatPilihanMapel() {
    const selectMapel = document.getElementById('menu-mapel');
    if (!selectMapel) return;
    selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
    listMapelSistem.forEach(m => {
        let opt = document.createElement('option'); opt.value = m; opt.textContent = m; selectMapel.appendChild(opt);
    });
}

function muatDaftarMapelTab() {
    const wrapper = document.getElementById('daftar-mapel-list');
    if (!wrapper) return; wrapper.innerHTML = "";
    listMapelSistem.forEach(m => {
        let li = document.createElement('li'); li.className = "mapel-item-list"; li.textContent = m; wrapper.appendChild(li);
    });
}

function tambahMapelKustom() {
    Swal.fire({ title: 'Tambah Mapel', input: 'text', inputPlaceholder: 'Nama mapel...', showCancelButton: true }).then((res) => {
        if (res.isConfirmed && res.value.trim()) {
            listMapelSistem.push(res.value.trim());
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            muatPilihanMapel(); muatDaftarMapelTab();
        }
    });
}

function muatSeluruhSiswa() {
    const tbody = document.getElementById('tabel-semua-siswa');
    database.ref('data_siswa').on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) { tbody.innerHTML = '<tr><td colspan="4">Data kosong.</td></tr>'; return; }
        snapshot.forEach((childSnapshot) => {
            let s = childSnapshot.val();
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td><span class="badge-kelas">${s.kelas}</span></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
            tbody.insertBefore(tr, tbody.firstChild);
        });
    });
}

function muatDataPerKelas(kelasPilihan) {
    const tbody = document.getElementById('tabel-per-kelas');
    if (!kelasPilihan) return;
    database.ref('data_siswa').orderByChild('kelas').equalTo(kelasPilihan).on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) { tbody.innerHTML = '<tr><td colspan="3">Data kosong.</td></tr>'; return; }
        snapshot.forEach((childSnapshot) => {
            let s = childSnapshot.val();
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
            tbody.appendChild(tr);
        });
    });
}

function hitungStatistikNilai() {
    database.ref('data_siswa').once('value', (snapshot) => {
        if (!snapshot.exists()) return;
        let arr = []; snapshot.forEach((cs) => { arr.push(parseFloat(cs.val().nilai_siswa)); });
        document.getElementById('stat-max').textContent = Math.max(...arr);
        document.getElementById('stat-min').textContent = Math.min(...arr);
        document.getElementById('stat-avg').textContent = (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
    });
}

function clearMapelCache() { localStorage.removeItem('siassmansala_mapel'); listMapelSistem = mapelWajibDefault; muatPilihanMapel(); muatDaftarMapelTab(); }
function logoutSistem() { switchPanel('panel-awal'); }
