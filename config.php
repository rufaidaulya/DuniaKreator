<?php
// Konfigurasi Firebase Anda
$firebaseConfig = [
    "apiKey" => "AIzaSyDbzU3hBrCjmB1k6SFJ7GEGAB3YLdEiuvU",
    "authDomain" => "duniakreator-42e66.firebaseapp.com",
    "projectId" => "duniakreator-42e66",
    "storageBucket" => "duniakreator-42e66.appspot.com",
    "messagingSenderId" => "623406959486",
    "appId" => "1:623406959486:web:44d18837acb2e9c253812f",
    "measurementId" => "G-7BXWW0L07X"
];

// Mengubah array PHP menjadi objek JSON untuk JavaScript
$firebaseConfigJson = json_encode($firebaseConfig);
?>

<script>
    // Menyimpan konfigurasi ke dalam variabel global window
    // agar bisa diakses oleh file script.js
    window.firebaseConfig = <?php echo $firebaseConfigJson; ?>;
</script>
