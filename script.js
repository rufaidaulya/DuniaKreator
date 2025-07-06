// Import fungsi dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Konfigurasi Firebase diambil dari variabel global yang dibuat oleh config.php
// Pastikan file config.php dimuat SEBELUM script.js di file HTML Anda
const firebaseConfig = window.firebaseConfig;

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ELEMEN DOM ---
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const togglePassword = document.getElementById('togglePassword');
const loginButton = document.getElementById('loginButton');
const loginText = document.getElementById('loginText');
const loginSpinner = document.getElementById('loginSpinner');
const dashboardEmail = document.getElementById('dashboardEmail');
const dashboardNamaInput = document.getElementById('dashboardNama');
const dashboardNoWaInput = document.getElementById('dashboardNoWa');
const dashboardPackageSelect = document.getElementById('dashboardPackage');
const dashboardMasaAktif = document.getElementById('dashboardMasaAktif');
const dashboardMasaBerakhir = document.getElementById('dashboardMasaBerakhir');
const editProfileButton = document.getElementById('editProfileButton');
const saveProfileButton = document.getElementById('saveProfileButton');
const logoutButton = document.getElementById('logoutButton');
const buatKontenButton = document.getElementById('buatKontenButton');
const overlay = document.getElementById('overlay');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageTitle = document.getElementById('messageTitle');
const messageIcon = document.getElementById('messageIcon');
const closeMessageBox = document.getElementById('closeMessageBox');

const buatKontenLink = "https://duniakreatorv3.netlify.app/";
buatKontenButton.href = buatKontenLink;

// --- FUNGSI ---

// Fungsi untuk menampilkan modal pesan
function showMessageBox(message, type = 'info') {
    let iconHtml = '';
    let title = '';
    switch (type) {
        case 'success':
            iconHtml = '<i class="fa-solid fa-check text-2xl text-green-600"></i>';
            title = 'Berhasil';
            break;
        case 'error':
            iconHtml = '<i class="fa-solid fa-xmark text-2xl text-red-600"></i>';
            title = 'Gagal';
            break;
        default:
            iconHtml = '<i class="fa-solid fa-info text-2xl text-indigo-600"></i>';
            title = 'Pemberitahuan';
    }
    messageIcon.innerHTML = iconHtml;
    messageTitle.textContent = title;
    messageText.textContent = message;
    
    overlay.classList.remove('hidden');
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('opacity-100');
        messageBox.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

// Fungsi untuk menyembunyikan modal pesan
function hideMessageBox() {
    overlay.classList.remove('opacity-100');
    messageBox.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        overlay.classList.add('hidden');
        messageBox.classList.add('hidden');
    }, 300);
}

// Fungsi untuk toggle visibilitas password
togglePassword.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = loginPasswordInput.type === 'password';
    loginPasswordInput.type = isPassword ? 'text' : 'password';
    togglePassword.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

// Fungsi untuk mengatur mode edit di dashboard
function setDashboardEditable(isEditable) {
    const inputs = [dashboardNamaInput, dashboardNoWaInput];
    if (isEditable) {
        inputs.forEach(input => {
            input.disabled = false;
            input.classList.add('bg-slate-100', 'p-2', 'rounded-lg', 'focus:ring-2', 'focus:ring-indigo-500');
        });
        editProfileButton.classList.add('hidden');
        saveProfileButton.classList.remove('hidden');
        // Paket tetap tidak bisa diedit oleh user
        dashboardPackageSelect.disabled = true;
    } else {
        inputs.forEach(input => {
            input.disabled = true;
            input.classList.remove('bg-slate-100', 'p-2', 'rounded-lg', 'focus:ring-2', 'ring-indigo-500');
        });
        editProfileButton.classList.remove('hidden');
        saveProfileButton.classList.add('hidden');
        dashboardPackageSelect.disabled = true;
    }
}

// Fungsi untuk mengisi data dashboard
async function populateDashboard(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            dashboardEmail.textContent = user.email;
            dashboardNamaInput.value = userData.nama || '';
            dashboardNoWaInput.value = userData.noWa || '';
            
            if (userData.langganan) {
                dashboardPackageSelect.value = userData.langganan.paket || '1bulan';
                const formatDate = (date) => date ? date.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
                dashboardMasaAktif.textContent = formatDate(userData.langganan.mulai);
                dashboardMasaBerakhir.textContent = formatDate(userData.langganan.berakhir);
            } else {
                dashboardMasaAktif.textContent = 'Tidak Aktif';
                dashboardMasaBerakhir.textContent = 'Tidak Aktif';
            }
        } else {
            showMessageBox("Data profil tidak ditemukan. Hubungi admin.", 'error');
            dashboardEmail.textContent = user.email;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        showMessageBox(`Gagal memuat data profil: ${error.message}`, 'error');
    }
}

// --- EVENT LISTENERS ---

// Listener status otentikasi
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        await populateDashboard(user);
        setDashboardEditable(false);
    } else {
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
    }
});

// Listener tombol login
loginButton.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showMessageBox('Email dan password harus diisi.', 'error');
        return;
    }

    loginText.classList.add('hidden');
    loginSpinner.classList.remove('hidden');
    loginButton.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state listener akan menangani sisanya
    } catch (error) {
        console.error("Login error:", error.code);
        let errorMessage = "Terjadi kesalahan saat login.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Email atau password yang Anda masukkan salah.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Format email tidak valid.";
        }
        showMessageBox(errorMessage, 'error');
    } finally {
        loginText.classList.remove('hidden');
        loginSpinner.classList.add('hidden');
        loginButton.disabled = false;
    }
});

// Listener tombol edit profil
editProfileButton.addEventListener('click', () => {
    setDashboardEditable(true);
    showMessageBox('Anda sekarang dapat mengedit Nama dan No. WhatsApp.', 'info');
});

// Listener tombol simpan profil
saveProfileButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessageBox("Sesi Anda berakhir, silakan login kembali.", 'error');
        return;
    }

    saveProfileButton.disabled = true;
    saveProfileButton.innerHTML = '<span class="spinner"></span><span class="ml-2">Menyimpan...</span>';

    const updatedData = {
        nama: dashboardNamaInput.value.trim(),
        noWa: dashboardNoWaInput.value.trim(),
    };

    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, updatedData, { merge: true });
        showMessageBox('Profil berhasil diperbarui!', 'success');
        setDashboardEditable(false);
    } catch (error) {
        console.error("Update error:", error);
        showMessageBox(`Gagal menyimpan profil: ${error.message}`, 'error');
    } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.innerHTML = '<i class="fa-solid fa-save mr-2"></i>Simpan';
    }
});

// Listener tombol logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessageBox('Anda telah berhasil keluar.', 'success');
    } catch (error) {
        console.error("Logout error:", error);
        showMessageBox(`Gagal keluar: ${error.message}`, 'error');
    }
});

// Listener untuk menutup modal
closeMessageBox.addEventListener('click', hideMessageBox);
overlay.addEventListener('click', hideMessageBox);
