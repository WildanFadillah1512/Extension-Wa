// =======================================================
// SCRIPT REMINDER V2.5 (STRICT ENGINE FIX)
// Fitur: Logic Broadcast V42 (Search -> Enter -> Type)
// Anti salah kirim ke kontak lain.
// =======================================================

(function() {
    'use strict';

    // --- 1. CONFIG ---
    const STORAGE_KEY = 'wa_reminders_data_v2';
    const CHECK_INTERVAL = 60000; 
    let reminders = [];
    let alarmAudio = null;

    // Inject CSS (Sama seperti sebelumnya)
    const style = document.createElement('style');
    style.innerHTML = `
        .wr-btn-float { position: fixed; bottom: 200px; right: 20px; z-index: 99999; background: #6f42c1; color: white; width: 45px; height: 45px; border-radius: 50%; border: 2px solid #FFF; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 3px 10px rgba(0,0,0,0.2); transition: transform 0.2s; will-change: transform; }
        .wr-btn-float:hover { transform: scale(1.1); }
        .wr-badge { position: absolute; top: -5px; right: -5px; background: #fa5252; color: white; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 10px; border: 1px solid white; display: none; }
        .wr-panel { position: fixed; bottom: 200px; right: 80px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 5px 25px rgba(0,0,0,0.15); z-index: 99999; font-family: sans-serif; display: none; border: 1px solid #eee; }
        .wr-header { background: #6f42c1; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
        .wr-list { max-height: 250px; overflow-y: auto; background: #f8f9fa; }
        .wr-item { padding: 10px; border-bottom: 1px solid #eee; background: white; }
        .wr-item.due { background: #fff0f0; border-left: 3px solid #fa5252; }
        .wr-actions { display: flex; justify-content: flex-end; gap: 5px; margin-top: 5px; }
        .wr-btn-small { padding: 3px 8px; border-radius: 4px; border: none; font-size: 10px; cursor: pointer; font-weight: bold; }
        .wr-btn-open { background: #00a884; color: white; }
        .wr-btn-del { background: #e9ecef; color: #333; }
        .wr-form { padding: 12px; border-top: 1px solid #eee; background: white; border-radius: 0 0 8px 8px; }
        .wr-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; box-sizing: border-box; font-size: 12px; display: block; }
        .wr-textarea { height: 60px; resize: none; font-family: sans-serif; }
        .wr-btn-add { width: 100%; padding: 8px; background: #6f42c1; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .wr-label { font-size: 11px; color: #666; font-weight: bold; margin-bottom: 3px; display: block; }
    `;
    document.head.appendChild(style);

    // --- 2. UI SETUP ---
    const btn = document.createElement('div');
    btn.className = 'wr-btn-float';
    btn.innerHTML = `⏰ <span id="wr-badge-count" class="wr-badge">0</span>`;
    
    const panel = document.createElement('div');
    panel.className = 'wr-panel';
    
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    let isOpen = false;
    let isRendered = false;

    try { reminders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e) { reminders = []; }

    // --- 3. HELPER FUNCTIONS (Diambil dari Broadcast V42) ---
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function waitForElement(selector, timeout = 10000) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
        });
    }

    function simulateKey(el, key) {
        const eventObj = { key: key, bubbles: true, keyCode: 13, which: 13 };
        el.dispatchEvent(new KeyboardEvent('keydown', eventObj));
        el.dispatchEvent(new KeyboardEvent('keypress', eventObj));
        el.dispatchEvent(new KeyboardEvent('keyup', eventObj));
    }

    function simulateClick(el) {
        ['mousedown', 'click', 'mouseup'].forEach(evt => 
            el.dispatchEvent(new MouseEvent(evt, {bubbles: true, cancelable: true, view: window}))
        );
    }

    async function clearSidebar() {
        const backBtn = document.querySelector('button[aria-label="Cancel search"]') || 
                        document.querySelector('span[data-icon="x-alt"]')?.closest('div[role="button"]') ||
                        document.querySelector('span[data-icon="back"]')?.closest('div[role="button"]');
        if (backBtn) { simulateClick(backBtn); await sleep(800); }
    }

    // --- 4. ENGINE UTAMA (ADAPTASI DARI BROADCAST V42) ---
    async function openChatAndSend(targetName, autoMessage) {
        window.focus();
        if(isOpen) { isOpen = false; panel.style.display = 'none'; }

        console.log(`[WR] Memulai proses untuk: ${targetName}`);

        try {
            // A. Bersihkan Sidebar (Takut ada sisa search sebelumnya)
            await clearSidebar();

            // B. Cari Kotak Search
            const searchBox = await waitForElement('#side div[contenteditable="true"]', 5000);
            if (!searchBox) {
                alert("Error: Kotak pencarian tidak ditemukan. Reload WA.");
                return;
            }

            // C. Ketik Nama & Enter
            searchBox.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
            await sleep(200);
            
            // Masukkan nama
            document.execCommand('insertText', false, targetName);
            await sleep(1500); // Tunggu WA loading hasil search
            
            // Tekan Enter (Memaksa WA membuka hasil paling atas)
            simulateKey(searchBox, 'Enter');

            // D. VERIFIKASI: Apakah Chat Sudah Terbuka?
            // Kita tunggu elemen footer chat muncul. Ini kuncinya agar tidak salah kirim.
            console.log("[WR] Menunggu chat terbuka...");
            const chatInput = await waitForElement('footer div[contenteditable="true"]', 8000);
            
            if (!chatInput) {
                console.error("[WR] Timeout: Chat tidak terbuka.");
                alert(`Gagal membuka chat: ${targetName}. Mungkin nama tidak ditemukan?`);
                await clearSidebar();
                return;
            }

            // E. Kirim Pesan (Jika ada)
            if (autoMessage && autoMessage.trim() !== "") {
                console.log("[WR] Chat terbuka. Mengirim pesan...");
                await typeAndSend(chatInput, autoMessage);
            } else {
                console.log("[WR] Hanya membuka chat.");
            }

            // F. Bersihkan search bar agar rapi
            // await clearSidebar(); // Opsional: Matikan ini jika ingin melihat chatnya tetap tersorot di sidebar

        } catch (error) {
            console.error("[WR] Error:", error);
        }
    }

    // Logic Mengetik & Kirim (Persis Broadcast V42)
    async function typeAndSend(inputEl, msg) {
        inputEl.focus();
        await sleep(500);

        // Paste Text
        document.execCommand('insertText', false, msg);
        await sleep(500);
        
        // Trigger Input Event (Agar tombol kirim aktif)
        inputEl.dispatchEvent(new Event('input', {bubbles:true})); 
        await sleep(500);

        // Cari Tombol Kirim atau Enter
        const sendBtn = document.querySelector('button[aria-label="Send"]') || 
                        document.querySelector('button[aria-label="Kirim"]') ||
                        document.querySelector('span[data-icon="send"]')?.closest('button');

        if (sendBtn) {
            simulateClick(sendBtn);
        } else {
            simulateKey(inputEl, 'Enter');
        }
        console.log("[WR] Pesan terkirim.");
    }

    // --- 5. UI & EVENT HANDLERS (Sama seperti V2.4) ---
    function playSound() {
        if (!alarmAudio) {
            alarmAudio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            alarmAudio.volume = 1.0;
        }
        alarmAudio.play().catch(() => {});
    }

    function renderPanel() {
        if (isRendered) return;
        panel.innerHTML = `
            <div class="wr-header">
                <span style="font-weight:bold; font-size:13px;">📅 Auto Reminder V2.5 (Strict)</span>
                <span style="cursor:pointer; font-size:16px;" id="wr-close">×</span>
            </div>
            <div id="wr-list-container" class="wr-list"></div>
            <div class="wr-form">
                <span class="wr-label">Waktu Alarm:</span>
                <input type="datetime-local" id="wr-input-time" class="wr-input">
                
                <span class="wr-label">Catatan (Hanya untuk Anda):</span>
                <input type="text" id="wr-input-note" class="wr-input" placeholder="Contoh: Tagih utang...">

                <span class="wr-label">Pesan Otomatis (Akan dikirim ke target):</span>
                <textarea id="wr-input-msg" class="wr-input wr-textarea" placeholder="Tulis pesan di sini (Opsional)..."></textarea>
                
                <button id="wr-btn-save" class="wr-btn-add">Set Alarm & Pesan</button>
            </div>
        `;
        document.getElementById('wr-close').onclick = () => { isOpen = false; panel.style.display = 'none'; };
        document.getElementById('wr-btn-save').onclick = addReminder;
        isRendered = true;
    }

    btn.onclick = () => {
        isOpen = !isOpen;
        if(isOpen && !isRendered) renderPanel();
        panel.style.display = isOpen ? 'block' : 'none';
        if(isOpen) renderList();
    };

    function addReminder() {
        const headerTitle = document.querySelector("header span[dir='auto']");
        const nama = headerTitle ? headerTitle.innerText : "Unknown";
        const timeVal = document.getElementById('wr-input-time').value;
        const noteVal = document.getElementById('wr-input-note').value;
        const msgVal = document.getElementById('wr-input-msg').value;

        if(nama === "Unknown") return alert("Silakan buka chat kontak target terlebih dahulu!");
        if(!timeVal) return alert("Pilih waktu alarm!");

        reminders.push({ 
            id: Date.now(), 
            name: nama, 
            time: timeVal, 
            note: noteVal || "Reminder", 
            message: msgVal || "", 
            notified: false 
        });
        saveData();
        renderList();
        
        document.getElementById('wr-input-time').value = "";
        document.getElementById('wr-input-note').value = "";
        document.getElementById('wr-input-msg').value = "";
        
        alert(`Alarm diset untuk: ${nama}`);
    }

    function renderList() {
        const container = document.getElementById('wr-list-container');
        if(!container) return;
        
        container.innerHTML = "";
        reminders.sort((a, b) => new Date(a.time) - new Date(b.time));

        if(reminders.length === 0) {
            container.innerHTML = `<div style="padding:15px; text-align:center; color:#999; font-size:12px;">Belum ada reminder.</div>`;
            return;
        }

        const now = new Date();
        const fragment = document.createDocumentFragment();

        reminders.forEach(item => {
            const itemTime = new Date(item.time);
            const isDue = itemTime <= now;
            const hasMsg = item.message && item.message.trim() !== "";
            
            const div = document.createElement('div');
            div.className = `wr-item ${isDue ? 'due' : ''}`;
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;">${item.name}</strong>
                    <span style="color:#888; font-size:10px;">${itemTime.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', day:'numeric'})}</span>
                </div>
                <div style="font-size:11px; color:#555; margin:3px 0;">${item.note}</div>
                ${hasMsg ? `<div style="font-size:10px; color:#00a884; font-style:italic;">✉️ "${item.message.substring(0, 20)}..."</div>` : ''}
                <div class="wr-actions">
                    <button class="wr-btn-small wr-btn-del" data-id="${item.id}">Hapus</button>
                    <button class="wr-btn-small wr-btn-open" data-name="${item.name}" data-msg="${encodeURIComponent(item.message)}">Buka & Kirim</button>
                </div>
            `;
            fragment.appendChild(div);
        });
        container.appendChild(fragment);

        container.onclick = (e) => {
            if(e.target.classList.contains('wr-btn-del')) {
                reminders = reminders.filter(r => r.id !== Number(e.target.dataset.id));
                saveData();
                renderList();
            }
            if(e.target.classList.contains('wr-btn-open')) {
                const msg = decodeURIComponent(e.target.dataset.msg);
                openChatAndSend(e.target.dataset.name, msg);
            }
        };
        updateBadge();
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
        updateBadge();
    }

    function updateBadge() {
        const now = new Date();
        const dueCount = reminders.filter(r => new Date(r.time) <= now).length;
        const badge = document.getElementById('wr-badge-count');
        if(badge) {
            badge.style.display = dueCount > 0 ? 'block' : 'none';
            badge.innerText = dueCount;
        }
    }

    // --- 6. BACKGROUND CHECKER ---
    function checkReminders() {
        const now = new Date();
        let needSave = false;
        
        for (let i = 0; i < reminders.length; i++) {
            let item = reminders[i];
            if (new Date(item.time) <= now && !item.notified) {
                
                if (Notification.permission === "granted") {
                    playSound();
                    const notif = new Notification(`⏰ REMINDER: ${item.name}`, {
                        body: item.message ? `Pesan Auto: "${item.message}"` : item.note,
                        icon: 'https://web.whatsapp.com/favicon.ico',
                        requireInteraction: true
                    });
                    
                    notif.onclick = function() {
                        window.parent.focus();
                        window.focus();
                        setTimeout(() => { openChatAndSend(item.name, item.message); }, 500);
                        this.close();
                    };
                    
                    item.notified = true;
                    needSave = true;
                }
            }
        }

        if (needSave) {
            saveData();
            if (isOpen) renderList();
        }
        updateBadge();
    }

    setInterval(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => checkReminders(), { timeout: 1000 });
        } else {
            checkReminders();
        }
    }, CHECK_INTERVAL);

    if (Notification.permission !== "granted") Notification.requestPermission();
    setTimeout(updateBadge, 3000);

})();