// Konfigurasi Firebase Realtime Database
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

// Inisialisasi Aplikasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let loggedInUser = "";
const mapelWajibDefault = ["Bahasa Indonesia", "Bahasa Sunda", "Bahasa Inggris", "Matematika", "Informatika", "Biologi", "Fisika", "Sejarah", "Ekonomi", "PKWU"];
let listMapelSistem = JSON.parse(localStorage.getItem('siassmansala_mapel')) || mapelWajibDefault;

// Daftarkan Handler Event setelah DOM dimuat penuh
document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
    muatDaftarMapelTab();

    // Event Handler Tombol Utama & Navigasi
    document.getElementById('tombol-masuk-sias').addEventListener('click', loginSistem);
    document.getElementById('btn-tab-input').addEventListener('click', (e) => bukaTab(e, 'sub-input'));
    document.getElementById('btn-tab-semua').addEventListener('click', (e) => { bukaTab(e, 'sub-seluruh-siswa'); muatSeluruhSiswa(); });
    document.getElementById('btn-tab-kelas').addEventListener('click', (e) => bukaTab(e, 'sub-setiap-kelas'));
    document.getElementById('btn-tab-mapel').addEventListener('click', (e) => bukaTab(e, 'sub-mata-pelajaran'));
    document.getElementById('btn-tab-stats').addEventListener('click', (e) => { bukaTab(e, 'sub-nilai-stats'); hitungStatistikNilai(); });
    document.getElementById('btn-tab-settings').addEventListener('click', (e) => bukaTab(e, 'sub-settings'));
    document.getElementById('btn-tab-logout').addEventListener('click', logoutSistem);

    // Event Handler Aksi Formulir
    document.getElementById('btn-simpan-cloud').addEventListener('click', simpanDataSistem);
    document.getElementById('btn-tambah-mapel').addEventListener('click', tambahMapelKustom);
    document.getElementById('btn-refresh-stats').addEventListener('click', hitungStatistikNilai);
    document.getElementById('btn-reset-mapel').addEventListener('click', clearMapelCache);
    document.getElementById('filter-kelas-dropdown').addEventListener('change', (e) => muatDataPerKelas(e.target.value));
});

function loginSistem() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;

    if (!u || !p) {
        Swal.fire('Peringatan', 'Username dan Password wajib diisi!', 'warning');
        return;
    }

    if (u === 'AdminSMANSALA#' && p === 'SIAS2026-27##') {
        loggedInUser = u;
        Swal.fire({ title: 'Akses Diterima', text: 'Membuka dashboard internal...', icon: 'success', timer: 1000, showConfirmButton: false })
        .then(() => {
            switchPanel('panel-menu');
            document.getElementById('menu-pengguna').value = loggedInUser;
        });
    } else {
        Swal.fire('Gagal Masuk', 'Kredensial salah atau tidak terdaftar!', 'error');
    }
}

function switchPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const container = document.getElementById('main-container');
    if (id === 'panel-menu') container.classList.add('wide');
    else container.classList.remove('wide');
}

function bukaTab(evt, tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function muatPilihanMapel() {
    const selectMapel = document.getElementById('menu-mapel');
    if (!selectMapel) return;
    selectMapel.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
    listMapelSistem.forEach(m => {
        let opt = document.createElement('option');
        opt.value = m; opt.textContent = m;
        selectMapel.appendChild(opt);
    });
}

function muatDaftarMapelTab() {
    const wrapper = document.getElementById('daftar-mapel-list');
    if (!wrapper) return;
    wrapper.innerHTML = "";
    listMapelSistem.forEach(m => {
        let li = document.createElement('li');
        li.className = "mapel-item-list";
        li.textContent = m;
        wrapper.appendChild(li);
    });
}

function tambahMapelKustom() {
    Swal.fire({
        title: 'Tambah Mapel',
        input: 'text',
        inputPlaceholder: 'Nama mata pelajaran baru...',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        inputValidator: (value) => {
            if (!value) return 'Tidak boleh kosong!';
            if (listMapelSistem.some(m => m.toLowerCase() === value.trim().toLowerCase())) return 'Mapel sudah ada!';
        }
    }).then((res) => {
        if (res.isConfirmed) {
            listMapelSistem.push(res.value.trim());
            localStorage.setItem('siassmansala_mapel', JSON.stringify(listMapelSistem));
            muatPilihanMapel();
            muatDaftarMapelTab();
            Swal.fire('Sukses', 'Mata pelajaran berhasil ditambahkan', 'success');
        }
    });
}

// Sinkronisasi Sinkron Data Real-time Node 'data_siswa'
function muatSeluruhSiswa() {
    const tbody = document.getElementById('tabel-semua-siswa');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Mengunduh basis data Firebase...</td></tr>';
    
    database.ref('data_siswa').on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Data siswa kosong.</td></tr>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            let s = childSnapshot.val();
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${s.nama_siswa}</b></td><td><span class="badge-kelas">${s.kelas}</span></td><td>${s.mata_pelajaran}</td><td><span class="nilai-text">${s.nilai_siswa}</span></td>`;
            tbody.insertBefore(tr, tbody.firstChild);
        });
    }, (error) => {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Gagal terhubung ke Firebase!</td></tr>';
    });
}

// Penyaringan Real-time Berdasarkan Cabang Parameter Kelas
function muatDataPerKelas(kelasPilihan) {
    const tbody = document.getElementById('tabel-per-kelas');
    if (!kelasPilihan) { 
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Silakan pilih kelas terlebih dahulu.</td></tr>'; 
        return; 
    }
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Menyaring data...</td></tr>';
    
    database.ref('data_siswa').orderByChild('kelas').equalTo(kelasPilihan).on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada record di kelas ${kelasPilihan}.</td></tr>`;
            return;
        }
        
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
        const maxEl = document.getElementById('stat-max');
        const minEl = document.getElementById('stat-min');
        const avgEl = document.getElementById('stat-avg');
        
        if (!snapshot.exists()) {
            maxEl.textContent = "-"; minEl.textContent = "-"; avgEl.textContent = "-";
            return;
        }
        
        let nilaiArray = [];
        snapshot.forEach((childSnapshot) => {
            nilaiArray.push(parseFloat(childSnapshot.val().nilai_siswa));
        });
        
        maxEl.textContent = Math.max(...nilaiArray);
        minEl.textContent = Math.min(...nilaiArray);
        avgEl.textContent = (nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length).toFixed(1);
    });
}

function simpanDataSistem() {
    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;

    if (!kelas || !nama || !mapel || !nilai) { 
        Swal.fire('Gagal', 'Lengkapi seluruh baris isian formulir!', 'warning'); 
        return; 
            }
            
    Swal.fire({ title: 'Mengunggah...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
    const siswaRef = database.ref('data_siswa');
    siswaRef.push({
        kelas: kelas,
        nama_siswa: nama,
        mata_pelajaran: mapel,
        nilai_siswa: parseFloat(nilai),
        pengguna_petugas: pengguna
    }, (error) => {
        Swal.close();
        if (error) {
            Swal.fire('Gagal Sinkronisasi', error.message, 'error');
        } else {
            Swal.fire('Berhasil', 'Record data terikat aman di Firebase.', 'success');
            document.getElementById('menu-nama').value = "";
            document.getElementById('menu-nilai').value = "";
        }
    });
}

function clearMapelCache() {
    localStorage.removeItem('siassmansala_mapel');
    listMapelSistem = mapelWajibDefault;
    muatPilihanMapel();
    muatDaftarMapelTab();
    Swal.fire('Reset', 'Kategori pelajaran kembali ke awal.', 'success');
}

function logoutSistem() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    switchPanel('panel-awal');
}
