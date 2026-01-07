// =======================================================
// BACKGROUND SERVICE WORKER (Jembatan Penghubung)
// =======================================================

// URL Google Apps Script Anda (SUDAH DISESUAIKAN)
const API_URL = "https://script.google.com/macros/s/AKfycbx3fhySswW0tw5-kPsMcBiFW0kCgY8W4jJtc41twC-p6EdIUuF70V69Rn-1A8ph0byc/exec";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Action: Menerima data dari content script
    if (request.action === "kirim_data") {
        console.log("Menerima data dari WA, mengirim ke Google Script...");

        fetch(API_URL, {
            method: "POST",
            mode: 'cors', // Penting untuk Google Script
            headers: {
                "Content-Type": "application/json" // Google Script butuh ini agar dianggap POST valid
            },
            body: JSON.stringify(request.payload) // Data dikirim sebagai string JSON
        })
        .then(response => {
            return response.json(); // Mengubah balasan server jadi objek
        })
        .then(data => {
            console.log("Sukses:", data);
            sendResponse(data); // Kirim balasan balik ke tombol WA
        })
        .catch(error => {
            console.error("Gagal:", error);
            sendResponse({ 
                status: "GAGAL", 
                error: "Koneksi Error: " + error.message 
            });
        });

        return true; // Wajib: menjaga channel komunikasi tetap terbuka (async)
    }
});