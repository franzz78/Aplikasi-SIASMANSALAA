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
let hardwareBiometricSupport = false;

document.addEventListener("DOMContentLoaded", () => {
    muatPilihanMapel();
    muatDaftarMapelTab();
    periksaDukunganBiometrik();

    // Event Login & Navigasi Utama
    document.getElementById('tombol-masuk-sias').addEventListener('click', loginSistem);
    document.getElementById('btn-login-fingerprint').addEventListener('click', loginDenganSidikJari);
    document.getElementById('btn-kembali-menu').addEventListener('click', kembaliKeMenuInput);
    
    // Manajemen Perpindahan Tab Atas
    document.getElementById('btn-tab-input').addEventListener('click', (e) => bukaTab(e, 'sub-input', 'Dashboard Utama', false));
    document.getElementById('btn-tab-semua').addEventListener('click', (e) => { bukaTab(e, 'sub-seluruh-siswa', 'Seluruh Siswa', true); muatSeluruhSiswa(); });
    document.getElementById('btn-tab-kelas').addEventListener('click', (e) => bukaTab(e, 'sub-setiap-kelas', 'Filter Kelas', true));
    document.getElementById('btn-tab-mapel').addEventListener('click', (e) => bukaTab(e, 'sub-mata-pelajaran', 'Atur Mapel', true));
    document.getElementById('btn-tab-biometric').addEventListener('click', (e) => { bukaTab(e, 'sub-biometric', 'Sensor Biometrik', true); muatRiwayatBiometrik(); });
    document.getElementById('btn-tab-stats').addEventListener('click', (e) => { bukaTab(e, 'sub-nilai-stats', 'Analisis Statistik', true); hitungStatistikNilai(); });
    document.getElementById('btn-tab-settings').addEventListener('click', (e) => bukaTab(e, 'sub-settings', 'Pengaturan', true));
    document.getElementById('btn-tab-logout').addEventListener('click', logoutSistem);

    // Event Aksi Form Kerja
    document.getElementById('btn-simpan-cloud').addEventListener('click', simpanDataSistem);
    document.getElementById('btn-tambah-mapel').addEventListener('click', tambahMapelKustom);
    document.getElementById('btn-registrasi-sidikjari').addEventListener('click', daftarkanKredensialSidikJari);
    document.getElementById('btn-refresh-stats').addEventListener('click', hitungStatistikNilai);
    document.getElementById('btn-reset-mapel').addEventListener('click', clearMapelCache);
    document.getElementById('filter-kelas-dropdown').addEventListener('change', (e) => muatDataPerKelas(e.target.value));
});

// MEMERIKSA APAKAH SENSOR PERANGKAT AKTIF & COCOK
async function periksaDukunganBiometrik() {
    const statusBox = document.getElementById('hardware-status-box');
    const btnLoginFinger = document.getElementById('btn-login-fingerprint');
    const btnRegisFinger = document.getElementById('btn-registrasi-sidikjari');

    if (window.PublicKeyCredential) {
        hardwareBiometricSupport = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }

    if (hardwareBiometricSupport) {
        statusBox.innerHTML = "✅ Perangkat Mendukung Sensor Sidik Jari / FaceID";
        statusBox.className = "status-hardware-badge support";
        btnLoginFinger.style.display = "block";
        if(btnRegisFinger) btnRegisFinger.disabled = false;
    } else {
        statusBox.innerHTML = "❌ Sensor Biometrik Tidak Ditemukan / Tidak Didukung Perangkat Ini";
        statusBox.className = "status-hardware-badge no-support";
        btnLoginFinger.style.display = "none";
        if(btnRegisFinger) {
            btnRegisFinger.disabled = true;
            btnRegisFinger.style.background = "#94a3b8";
            btnRegisFinger.innerText = "Fitur Dikunci (Hardware Tidak Support)";
        }
    }
}

// DAFTARKAN SIDIK JARI NYATA PERANGKAT & WAJIB INPUT NAMA KREDENSIAL
async function daftarkanKredensialSidikJari() {
    if (!hardwareBiometricSupport) return;

    try {
        // 1. Trigger Pemicu Sensor Sidik Jari Bawaan Device Secara Nyata (WebAuthn API Standard)
        const opsiTantanganMekanik = {
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { name: "SIASSMANSALA System" },
                user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "admin_smansala", displayName: "Admin SMANSALA" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000
            }
        };

        Swal.fire({
            title: 'Pindai Sidik Jari',
            text: 'Silakan sentuh atau tempel jari Anda pada area sensor perangkat untuk memindai...',
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/2610/2610419.png',
            imageWidth: 60, imageHeight: 60,
            allowOutsideClick: false,
            showCancelButton: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Panggil sensor enkripsi lokal device
                const kredensialNyata = await navigator.credentials.create(opsiTantanganMekanik);
                
                if (kredensialNyata) {
                    // 2. Tampilkan Input Pesan Penamaan Setelah Sukses Memindai
                    Swal.fire({
                        title: 'Beri Nama Sidik Jari',
                        text: 'Pemberian label identitas sidik jari wajib diisi agar tersimpan di database!',
                        input: 'text',
                        inputPlaceholder: 'Contoh: Jari Telunjuk Kanan Aa / HP Ibu...',
                        allowOutsideClick: false,
                        inputValidator: (value) => {
                            if (!value || !value.trim()) {
                                return 'Nama tidak boleh kosong! Harus diberi nama.';
                            }
                        }
                    }).then((inputRes) => {
                        const namaSidikJari = inputRes.value.trim();
                        localStorage.setItem('siassmansala_fingerprint_registered', 'true');
                        localStorage.setItem('siassmansala_fingerprint_label', namaSidikJari);
                        
                        // Kirim Log Ke Firebase
                        catatLogBiometrik(`Registrasi Sidik Jari: "${namaSidikJari}"`, "BERHASIL");
                        Swal.fire('Tersimpan', `Sidik jari "${namaSidikJari}" aktif mengikat sistem lokal.`, 'success');
                    });
                }
            } else {
                catatLogBiometrik("Registrasi Kredensial Baru", "DIBATALKAN");
            }
        });

    } catch (err) {
        catatLogBiometrik("Registrasi Kredensial Baru", "GAGAL / DEVICE REJECTED");
        Swal.fire('Gagal Scan', 'Sensor dibatalkan atau tidak mendeteksi sidik jari terdaftar di device Anda.', 'error');
    }
}

// LOG IN MENGGUNAKAN VERIFIKASI BIOMETRIK SIDIK JARI
function loginDenganSidikJari() {
    const isRegistered = localStorage.getItem('siassmansala_fingerprint_registered');
    const labelSidikJari = localStorage.getItem('siassmansala_fingerprint_label') || "Sidik Jari Lokal";
    
    if (!isRegistered) {
        Swal.fire('Akses Ditolak', 'Sidik jari belum terdaftar! Masuk menggunakan password dulu, lalu daftarkan di menu Biometrik.', 'warning');
        return;
    }

    Swal.fire({
        title: 'Verifikasi Keamanan',
        text: `Sentuh sensor sidik jari untuk mengonfirmasi akses perangkat ("${labelSidikJari}")`,
        imageUrl: 'https://cdn-icons-png.flaticon.com/512/2610/2610419.png',
        imageWidth: 60, imageHeight: 60,
        showCancelButton: true,
        allowOutsideClick: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Panggil modul otentikasi biometrik bawaan OS
                const opsiVerifikasi = { publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), timeout: 60000, userVerification: "required" } };
                await navigator.credentials.get(opsiVerifikasi);
                
                loggedInUser = "AdminSMANSALA#";
                catatLogBiometrik(`Login via Sidik Jari ("${labelSidikJari}")`, "BERHASIL");
                
                Swal.fire({ title: 'Akses Diterima', text: 'Membuka dashboard...', icon: 'success', timer: 1000, showConfirmButton: false })
                .then(() => {
                    switchPanel('panel-menu');
                    document.getElementById('menu-pengguna').value = loggedInUser;
                    kembaliKeMenuInput(); // Atur agar awal masuk membuka tab input data utama
                });
            } catch(e) {
                catatLogBiometrik(`Login via Sidik Jari ("${labelSidikJari}")`, "GAGAL VERIFIKASI");
                Swal.fire('Gagal Otentikasi', 'Sidik jari tidak cocok dengan database perangkat ini!', 'error');
            }
        }
    });
}

// PENGATURAN KENDALI INTERAKSI NAVIGASI TAB DAN TOMBOL KEMBALI
function bukaTab(evt, tabId, judulHalaman, tampilkanTombolKembali) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (evt) evt.currentTarget.classList.add('active');

    // Update Bar Navigasi Atas Dinamis
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
    // Paksa aktifkan kembali tab input utama secara otomatis
    bukaTab({ currentTarget: tombolTabInput }, 'sub-input', 'Dashboard Utama', false);
}

// LOGIKA SINKRONISASI DASAR KREATIF FIREBASE
function catatLogBiometrik(aktivitas, status) {
    const waktuWIB = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    database.ref('riwayat_biometrik').push({ waktu: waktuWIB, aktivitas: aktivitas, status: status });
}

function muatRiwayatBiometrik() {
    const tbody = document.getElementById('tabel-log-biometrik');
    if(!tbody) return;
    database.ref('riwayat_biometrik').on('value', (snapshot) => {
        tbody.innerHTML = "";
        if (!snapshot.exists()) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat.</td></tr>'; return; }
        snapshot.forEach((childSnapshot) => {
            let data = childSnapshot.val();
            let tr = document.createElement('tr');
            let colorStatus = data.status === "BERHASIL" ? "green" : "red";
            tr.innerHTML = `<td>${data.waktu}</td><td><b>${data.aktivitas}</b></td><td style="color:${colorStatus}; font-weight:bold;">${data.status}</td>`;
            tbody.insertBefore(tr, tbody.firstChild);
        });
    });
}

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

function simpanDataSistem() {
    const kelas = document.getElementById('menu-kelas').value;
    const nama = document.getElementById('menu-nama').value.trim();
    const mapel = document.getElementById('menu-mapel').value;
    const nilai = document.getElementById('menu-nilai').value.trim();
    const pengguna = document.getElementById('menu-pengguna').value;
    if (!kelas || !nama || !mapel || !nilai) { Swal.fire('Gagal', 'Lengkapi data!', 'warning'); return; }
    database.ref('data_siswa').push({ kelas, nama_siswa: nama, mata_pelajaran: mapel, nilai_siswa: parseFloat(nilai), pengguna_petugas: pengguna }, (err) => {
        if (!err) { document.getElementById('menu-nama').value = ""; document.getElementById('menu-nilai').value = ""; Swal.fire('Berhasil', 'Data disimpan', 'success'); }
    });
}

function clearMapelCache() { localStorage.removeItem('siassmansala_mapel'); listMapelSistem = mapelWajibDefault; muatPilihanMapel(); muatDaftarMapelTab(); }
function logoutSistem() { switchPanel('panel-awal'); }
                        
