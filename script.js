document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. LOGIKA UNTUK HALAMAN AWAL / LOGIN (index.html)
    // ==========================================================================
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    // Fitur Intip Sandi (Toggle Eye Icon)
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            // Cek tipe input saat ini
            const isPassword = passwordInput.type === 'password';
            // Tukar tipe antara text dan password
            passwordInput.type = isPassword ? 'text' : 'password';
            // Tukar ikon mata terbuka dan tertutup
            togglePassword.querySelector('i').className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        });
    }

    // Penanganan saat tombol LOGIN ditekan
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Mencegah browser reload halaman
            
            const username = document.getElementById('username').value.trim();
            const password = passwordInput.value.trim();
            const btnLogin = document.querySelector('.btn-login');

            // Jalankan Animasi Memuat (Loading) pada tombol
            btnLogin.disabled = true;
            btnLogin.querySelector('span').innerText = "Memverifikasi...";
            btnLogin.querySelector('i').className = "fa-solid fa-spinner fa-spin";

            // Simulasi pengecekan database selama 1 detik
            setTimeout(() => {
                // Kombinasi Akun Bypass Masuk Sistem
                if (username === "admin" && password === "admin123") {
                    // Simpan nama pengguna ke memori browser untuk dashboard
                    localStorage.setItem('siasmansalaa_user', username); 
                    
                    // Alihkan halaman ke dashboard mobile baru
                    window.location.href = "dashboard.html";
                } else {
                    // Jika password atau username salah
                    alert("Akses Ditolak! Username atau Password salah.");
                    passwordInput.value = "";
                    passwordInput.focus();
                    
                    // Kembalikan tombol login ke status normal
                    btnLogin.disabled = false;
                    btnLogin.querySelector('span').innerText = "LOGIN";
                    btnLogin.querySelector('i').className = "fa-solid fa-arrow-right";
                }
            }, 1000);
        });
    }

    // ==========================================================================
    // 2. LOGIKA UNTUK HALAMAN DASHBOARD MOBILE (dashboard.html)
    // ==========================================================================
    const userDisplay = document.getElementById('user-display');

    // Jika user sedang berada di halaman dashboard
    if (userDisplay) {
        // Ambil nama dari memori browser, jika kosong berikan default 'Administrator'
        const savedUser = localStorage.getItem('siasmansalaa_user') || 'Administrator';
        
        // Ubah teks salam di header sesuai nama yang login
        userDisplay.innerText = savedUser;
    }
});
