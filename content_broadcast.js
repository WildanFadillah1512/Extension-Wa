// =======================================================
// SCRIPT BROADCAST V42 (HYBRID ENGINE)
// Jalur 1: Scan Kontak -> Pakai Logic Search V41 (Strict)
// Jalur 2: Import CSV  -> Pakai Logic Direct Link (No Search)
// =======================================================

(function() {
    // --- KONFIGURASI ---
    const TIMEOUT_DETIK = 15;

    // --- 1. UI SETUP (TABS SYSTEM) ---
    function createUI() {
        const oldIds = ["panel-wa-v41", "btn-wa-v41", "panel-wa-v42", "btn-wa-v42"];
        oldIds.forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });

        const btn = document.createElement("button");
        btn.id = "btn-wa-v42";
        btn.innerHTML = "📢 BROADCAST V42";
        btn.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:999999; background:#00a884; color:white; padding:15px 25px; border-radius:50px; font-weight:bold; border:2px solid #FFF; box-shadow:0 4px 15px rgba(0,0,0,0.3); cursor:pointer; font-family: -apple-system, sans-serif;";
        
        btn.onclick = showPanel;
        document.body.appendChild(btn);
    }

    function showPanel() {
        if(document.getElementById("panel-wa-v42")) return;
        
        const overlay = document.createElement("div");
        overlay.id = "panel-wa-v42";
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999998; display:flex; justify-content:center; align-items:center; backdrop-filter: blur(4px);";

        const box = document.createElement("div");
        box.style.cssText = "position:relative; z-index:999999; background:#ffffff; color:#111b21; padding:0; border-radius:15px; width:500px; max-width:90%; font-family:sans-serif; display:flex; flex-direction:column; box-shadow: 0 20px 50px rgba(0,0,0,0.5); overflow:hidden;";
        
        box.innerHTML = `
            <div style="padding:15px; background:#00a884; color:white; border-bottom:1px solid #ddd;">
                <h3 style="margin:0; font-size:18px;">📢 Broadcast V42 Hybrid</h3>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button id="tab-scan" style="flex:1; padding:6px; border:none; background:white; color:#00a884; font-weight:bold; border-radius:4px; cursor:pointer;">1. Scan Kontak (Sidebar)</button>
                    <button id="tab-import" style="flex:1; padding:6px; border:none; background:rgba(0,0,0,0.2); color:white; font-weight:bold; border-radius:4px; cursor:pointer;">2. Import Excel/CSV</button>
                </div>
            </div>

            <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
                
                <div id="view-scan" style="display:block;">
                    <div style="background:#e9f7fe; padding:10px; border-radius:5px; font-size:12px; color:#007bff; margin-bottom:10px;">
                        ℹ️ <b>Mode V41 (Strict):</b> Menggunakan nama kontak dari sidebar. Aman untuk kontak tersimpan.
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <label>Pilih Kontak:</label>
                        <a id="select-all-scan" style="color:#00a884; cursor:pointer; font-size:12px; font-weight:bold;">Pilih Semua</a>
                    </div>
                    <div id="contact-list-v42" style="height:150px; overflow-y:auto; border:1px solid #ddd; border-radius:8px; background:#f9f9f9; padding:5px;"></div>
                </div>

                <div id="view-import" style="display:none;">
                    <div style="background:#fff3cd; padding:10px; border-radius:5px; font-size:12px; color:#856404; margin-bottom:10px;">
                        ℹ️ <b>Mode Direct:</b> Menggunakan nomor HP. Bisa kirim ke kontak yang belum disave.
                    </div>
                    <textarea id="input-raw" placeholder="Format: NAMA, NOMOR&#10;Contoh:&#10;Budi, 0812345678&#10;Siti, 628999999" style="width:100%; height:120px; padding:10px; box-sizing:border-box; border:1px solid #ccc; border-radius:8px; font-family:monospace; font-size:12px;"></textarea>
                    <div style="text-align:right; margin-top:5px;">
                        <span id="import-status" style="font-size:12px; color:green; font-weight:bold;"></span>
                        <button id="btn-process-import" style="padding:5px 10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">🔄 Proses Data</button>
                    </div>
                </div>

                <div>
                    <label style="font-weight:600; font-size:14px;">Pesan:</label>
                    <textarea id="msg-input-v42" style="width:100%; height:80px; padding:10px; box-sizing:border-box; border:1px solid #ccc; border-radius:8px; font-family:inherit; resize:vertical;" placeholder="Halo {nama}, ini broadcast..."></textarea>
                </div>

                <div id="status-log" style="font-size:12px; color:#54656f; padding:8px; background:#f0f2f5; border-radius:5px; text-align:center;">Siap.</div>

                <div style="display:flex; gap:10px;">
                    <button id="btn-cancel" style="flex:1; padding:12px; border:1px solid #ddd; background:white; border-radius:8px; cursor:pointer; font-weight:600;">Tutup</button>
                    <button id="btn-run" style="flex:1; padding:12px; background:#00a884; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🚀 MULAI KIRIM</button>
                </div>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // --- UI LOGIC ---
        let activeMode = "scan"; 
        let parsedImportData = [];

        // Tab Switching
        const btnScan = document.getElementById("tab-scan");
        const btnImport = document.getElementById("tab-import");
        const viewScan = document.getElementById("view-scan");
        const viewImport = document.getElementById("view-import");

        btnScan.onclick = () => {
            activeMode = "scan";
            viewScan.style.display = "block"; viewImport.style.display = "none";
            btnScan.style.background = "white"; btnScan.style.color = "#00a884";
            btnImport.style.background = "rgba(0,0,0,0.2)"; btnImport.style.color = "white";
        };

        btnImport.onclick = () => {
            activeMode = "import";
            viewScan.style.display = "none"; viewImport.style.display = "block";
            btnImport.style.background = "white"; btnImport.style.color = "#00a884";
            btnScan.style.background = "rgba(0,0,0,0.2)"; btnScan.style.color = "white";
        };

        // Load Sidebar Contacts
        loadContacts(document.getElementById("contact-list-v42"));

        // Select All Scan
        document.getElementById("select-all-scan").onclick = () => {
             const checkboxes = document.querySelectorAll(".contact-chk");
             const allChecked = Array.from(checkboxes).every(c => c.checked);
             checkboxes.forEach(c => c.checked = !allChecked);
        };

        // Process Import
        document.getElementById("btn-process-import").onclick = () => {
            const raw = document.getElementById("input-raw").value;
            parsedImportData = parseData(raw);
            document.getElementById("import-status").innerText = `✅ ${parsedImportData.length} Valid`;
        };

        // Close
        document.getElementById("btn-cancel").onclick = () => overlay.remove();

        // Run Logic
        document.getElementById("btn-run").onclick = async () => {
            const msgTemplate = document.getElementById("msg-input-v42").value;
            if(!msgTemplate) return alert("Pesan kosong!");

            let queue = [];
            if(activeMode === "scan") {
                const checks = document.querySelectorAll(".contact-chk:checked");
                if(checks.length === 0) return alert("Pilih kontak dulu!");
                // Format Queue Scan: { type: 'name', value: 'Budi' }
                queue = Array.from(checks).map(c => ({ type: 'name', value: c.dataset.name, name: c.dataset.name }));
            } else {
                if(parsedImportData.length === 0) return alert("Data import kosong!");
                // Format Queue Import: { type: 'phone', value: '628xxx', name: 'Budi' }
                queue = parsedImportData;
            }

            if(!confirm(`Kirim ke ${queue.length} kontak (${activeMode === 'scan' ? 'Mode Nama' : 'Mode Nomor'})?`)) return;

            const btnRun = document.getElementById("btn-run");
            btnRun.innerText = "Sedang Jalan...";
            btnRun.disabled = true;

            await runMainEngine(queue, msgTemplate);

            alert("Selesai!");
            btnRun.innerText = "🚀 MULAI KIRIM";
            btnRun.disabled = false;
        };
    }

    // --- 2. DATA PARSING (EXCEL/CSV) ---
    function parseData(text) {
        // Support Comma, Tab, Pipe
        return text.split("\n").map(line => {
            let parts = line.split(/,|;|\t|\|/);
            if(parts.length < 2) return null;
            let name = parts[0].trim();
            let rawPhone = parts[1].trim().replace(/\D/g, '');
            // Standarisasi 08 -> 628
            if(rawPhone.startsWith('0')) rawPhone = '62' + rawPhone.substring(1);
            if(rawPhone.length < 5) return null;
            
            return { type: 'phone', value: rawPhone, name: name };
        }).filter(x => x !== null);
    }

    function loadContacts(container) {
        const rows = document.querySelectorAll('div[role="row"]');
        let html = "";
        rows.forEach((row) => {
            let name = row.innerText.split("\n")[0];
            if(name && name.length > 1) {
                html += `<div style="padding:8px; border-bottom:1px solid #eee; display:flex; align-items:center; background:white;">
                    <label style="cursor:pointer; display:flex; align-items:center; width:100%; font-size:13px;">
                        <input type="checkbox" class="contact-chk" data-name="${name}" style="margin-right:10px;"> ${name}
                    </label>
                </div>`;
            }
        });
        container.innerHTML = html || "<div style='padding:10px;'>Scroll sidebar WA dulu.</div>";
    }

    // --- 3. MAIN ENGINE (CONTROLLER) ---
    async function runMainEngine(queue, template) {
        const log = document.getElementById("status-log");
        let i = 1;

        for(let item of queue) {
            log.innerHTML = `⚙️ <b>(${i}/${queue.length})</b> Processing: ${item.name}`;

            try {
                if(item.type === 'name') {
                    // JALUR 1: LOGIC V41 STRICT (Scan Sidebar)
                    await processByNameStrict(item.value, template);
                } else {
                    // JALUR 2: LOGIC IMPORT (Phone Injection)
                    await processByPhoneDirect(item.value, item.name, template);
                }
            } catch (err) {
                console.error(err);
                log.innerHTML = `❌ Gagal: ${item.name}`;
                await clearSidebar(); // Safety cleanup
            }

            const jeda = Math.floor(Math.random() * 2000) + 2000;
            await sleep(jeda);
            i++;
        }
        log.innerHTML = "✅ Selesai Semua.";
    }

    // ==========================================================
    // LOGIC A: BY NAME (V41 STRICT - Code Asli Kamu)
    // ==========================================================
    async function processByNameStrict(name, template) {
        // 1. Reset
        await clearSidebar();

        // 2. Search
        const searchBox = await waitForElement('div[contenteditable="true"][data-tab="3"]', 5000) || 
                          await waitForElement('#side div[contenteditable="true"]', 5000);
        if (!searchBox) throw "Search bar missing";
        
        searchBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        await sleep(200);
        document.execCommand('insertText', false, name);
        await sleep(1500); 
        simulateKey(searchBox, 'Enter');

        // 3. Validasi Chat Terbuka
        const chatInput = await waitForElement('footer div[contenteditable="true"][data-tab="10"]', 10000);
        if (!chatInput) throw "Chat timeout";

        // 4. Kirim Pesan
        await typeAndSend(chatInput, template, name);
        
        // 5. Reset
        await clearSidebar();
    }

    // ==========================================================
    // LOGIC B: BY PHONE (DIRECT LINK INJECTION)
    // ==========================================================
    async function processByPhoneDirect(phone, name, template) {
        // 1. Force Open Chat via Link (Tanpa Search Bar)
        // Teknik ini mem-bypass search bar dan langsung menyuruh WA Web membuka chat ID
        const link = document.createElement('a');
        link.href = `https://web.whatsapp.com/send?phone=${phone}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click(); // Klik virtual
        document.body.removeChild(link);

        // 2. Tunggu Chat Terbuka (ATAU Popup Invalid Number)
        // Kita menunggu elemen Footer Chat. 
        // Note: WA Web butuh waktu loading chat history
        await sleep(2000); 

        const chatInput = await waitForElement('footer div[contenteditable="true"][data-tab="10"]', 15000);
        
        // Cek jika muncul popup "Nomor tidak valid"
        const invalidPopup = document.querySelector('div[data-animate-modal-popup="true"]');
        if(invalidPopup && invalidPopup.innerText.includes("url")) {
            // Tutup popup
            const btnOk = invalidPopup.querySelector('button');
            if(btnOk) btnOk.click();
            throw "Nomor Tidak Valid (Tidak ada WA)";
        }

        if (!chatInput) throw "Timeout loading chat number";

        // 3. Kirim Pesan (Gunakan fungsi yang sama dengan V41 agar konsisten)
        await typeAndSend(chatInput, template, name);
    }

    // --- SHARED SENDER FUNCTION (Digunakan Logic A & B) ---
    async function typeAndSend(inputEl, template, name) {
        inputEl.focus();
        await sleep(500);

        const msg = template.replace(/{nama}/gi, name).replace(/{kontak}/gi, name);
        
        document.execCommand('insertText', false, msg);
        await sleep(500);
        
        inputEl.dispatchEvent(new Event('input', {bubbles:true})); 
        await sleep(500);

        const sendBtn = document.querySelector('button[aria-label="Send"]') || 
                        document.querySelector('button[aria-label="Kirim"]') ||
                        document.querySelector('span[data-icon="send"]')?.closest('button');

        if (sendBtn) {
            simulateClick(sendBtn);
        } else {
            simulateKey(inputEl, 'Enter');
        }
        
        // Update Log UI
        document.getElementById("status-log").innerHTML = `✅ Terkirim: ${name}`;
        await sleep(1000);
    }

    // --- HELPER FUNCTIONS ---
    async function clearSidebar() {
        const backBtn = document.querySelector('button[aria-label="Cancel search"]') || 
                        document.querySelector('span[data-icon="x-alt"]')?.closest('div[role="button"]') ||
                        document.querySelector('span[data-icon="back"]')?.closest('div[role="button"]');
        if (backBtn) { simulateClick(backBtn); await sleep(800); }
    }

    function waitForElement(selector, timeout = 10000) {
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

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    createUI();
})();