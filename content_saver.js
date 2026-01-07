// =======================================================
// SCRIPT SAVER V30 (AUTO-FILL DATA & TAG MANAGER)
// =======================================================

(function() {
    // 1. CEK DUPLIKASI
    if (document.getElementById("wa-saver-panel")) return;

    // 2. INJECT CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .ws-font { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        #wa-saver-panel { position: fixed; bottom: 80px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
        .ws-btn-float { padding: 12px 20px; border-radius: 50px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; }
        .ws-btn-float:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .ws-btn-select { background: #f59f00; }
        .ws-btn-save { background: #00a884; }
        .ws-btn-cancel { background: #fa5252; }
        .wa-saver-chk { width: 20px; height: 20px; margin-right: 12px; cursor: pointer; accent-color: #00a884; z-index: 1000; }
        #saver-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(11, 20, 26, 0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
        .ws-card { background: #ffffff; width: 420px; max-width: 90%; border-radius: 18px; padding: 0; box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
        .ws-header { background: #00a884; color: white; padding: 20px; display: flex; flex-direction: column; gap: 5px; }
        .ws-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
        .ws-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: #fff; }
        .ws-form-group { display: flex; flex-direction: column; gap: 6px; }
        .ws-label { font-size: 12px; font-weight: 700; color: #54656f; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
        .ws-input, .ws-select { padding: 12px; border: 1px solid #e9edef; border-radius: 8px; font-size: 14px; background-color: #ffffff !important; color: #111b21 !important; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
        .ws-select option { background-color: white; color: black; }
        .ws-input:focus, .ws-select:focus { border-color: #00a884; box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.2); }
        .ws-input[readonly] { background-color: #f0f2f5 !important; color: #54656f !important; cursor: default; }
        .ws-manage-link { font-size: 11px; color: #00a884; cursor: pointer; text-decoration: none; font-weight: 600; }
        .ws-manage-link:hover { text-decoration: underline; }
        .ws-manager-panel { background: #f0f2f5; padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #e9edef; }
        .ws-tags-container { display: flex; flex-wrap: wrap; gap: 6px; max-height: 100px; overflow-y: auto; }
        .ws-chip { background: #fff; border: 1px solid #ddd; padding: 4px 10px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 6px; color: #333; }
        .ws-chip-del { color: #ff4d4d; cursor: pointer; font-weight: bold; font-size: 14px; }
        .ws-add-group { display: flex; gap: 5px; }
        .ws-input-small { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 13px; background: white !important; color: black !important; }
        .ws-btn-small { padding: 6px 12px; background: #00a884; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; }
        .ws-btn-done { width: 100%; background: #e9edef; color: #54656f; border: none; padding: 5px; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: bold; margin-top: 5px; }
        .ws-footer { padding: 15px 20px; border-top: 1px solid #e9edef; background: #fff; display: flex; gap: 10px; }
        .ws-btn-action { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s; }
        .ws-btn-secondary { background: #e9edef; color: #54656f; }
        .ws-btn-primary { background: #00a884; color: white; }
        .ws-noti-recall { background: #d1fae5; color: #065f46; padding: 10px; font-size: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    `;
    document.head.appendChild(style);

    // --- 3. BUILD UI TOMBOL FLOATING ---
    const container = document.createElement("div");
    container.id = "wa-saver-panel";
    document.body.appendChild(container);

    const btnSelect = document.createElement("button");
    btnSelect.className = "ws-btn-float ws-btn-select ws-font";
    btnSelect.innerHTML = "<span>📝</span> Pilih Chat";
    btnSelect.onclick = toggleSelectionMode;
    container.appendChild(btnSelect);

    const btnSave = document.createElement("button");
    btnSave.className = "ws-btn-float ws-btn-save ws-font";
    btnSave.innerHTML = "<span>💾</span> Input Data";
    btnSave.onclick = preSaveCheck;
    container.appendChild(btnSave);

    // --- 4. GLOBAL VARS ---
    let tempData = null;
    let isSelectionMode = false;

    // --- 5. LOGIC SELECTION & CLEANER ---
    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        if (isSelectionMode) {
            btnSelect.innerHTML = "<span>❌</span> Selesai";
            btnSelect.className = "ws-btn-float ws-btn-cancel ws-font";
            showCheckboxes();
        } else {
            btnSelect.innerHTML = "<span>📝</span> Pilih Chat";
            btnSelect.className = "ws-btn-float ws-btn-select ws-font";
            removeCheckboxes();
        }
    }

    function showCheckboxes() {
        let msgs = document.querySelectorAll("div[data-pre-plain-text]");
        msgs.forEach((msg) => {
            if (!msg.parentElement.querySelector(".wa-saver-chk")) {
                let chk = document.createElement("input");
                chk.type = "checkbox";
                chk.className = "wa-saver-chk";
                msg.parentElement.style.display = "flex"; 
                msg.parentElement.style.flexDirection = "row";
                msg.parentElement.insertBefore(chk, msg);
            }
        });
    }

    function removeCheckboxes() {
        document.querySelectorAll(".wa-saver-chk").forEach(chk => chk.remove());
    }

    function getCleanText(msgElement) {
        if (!msgElement) return "";
        let clone = msgElement.cloneNode(true);
        let quote = clone.querySelector('div[aria-label="Quoted message"]');
        if (quote) quote.remove();
        let readMore = clone.querySelector('span[role="button"]');
        if (readMore && (readMore.innerText === "Read more" || readMore.innerText === "Baca selengkapnya")) {
            readMore.remove();
        }
        let text = clone.innerText;
        text = text.replace(/[\s\u00A0]*\d{1,2}:\d{2}\s?(?:AM|PM)?[\s\u00A0]*$/i, "");
        return text.replace(/[\r\n]+/g, " ").trim();
    }

    // --- 6. LOGIC SCRAPING ---
    function preSaveCheck() {
        let nomor = "Unknown";
        let sidebar = document.querySelector("section") || document.querySelector("div._aou8") || document.querySelector("div[data-testid='contact-info-drawer']");
        
        if (sidebar) {
            let lines = sidebar.innerText.split('\n');
            for (let line of lines) {
                let clean = line.replace(/[\s\-\+]/g, '');
                if (!isNaN(clean) && clean.length > 9 && !line.includes(":")) {
                    if (!line.toLowerCase().includes("seen") && !line.toLowerCase().includes("last")) {
                        nomor = line; 
                        break;
                    }
                }
            }
        }

        let nama = "Tanpa Nama";
        try {
            let headerTitle = document.querySelector("header span[dir='auto']");
            if(headerTitle) nama = headerTitle.innerText;
        } catch (e) {}

        let isiChat = "";
        let checkedBoxes = document.querySelectorAll(".wa-saver-chk:checked");
        
        if (checkedBoxes.length > 0) {
            isiChat = Array.from(checkedBoxes).map(chk => {
                let msgEl = chk.nextElementSibling; 
                let info = msgEl ? (msgEl.getAttribute("data-pre-plain-text") || "") : "";
                let text = getCleanText(msgEl);
                return `${info} ${text}`; 
            }).join("\n"); 
        } else {
            let messageElements = document.querySelectorAll("div[data-pre-plain-text]");
            isiChat = Array.from(messageElements).slice(-15).map(el => {
                let info = el.getAttribute("data-pre-plain-text");
                let text = getCleanText(el);
                return `${info} ${text}`;
            }).join("\n");
        }

        if (nomor === "Unknown") return alert("⚠️ Buka Sidebar Info Kontak dahulu.");
        if (isiChat === "") return alert("⚠️ Tidak ada pesan terdeteksi.");

        tempData = { nama: nama, nomor: "'" + nomor, link: `https://wa.me/${nomor.replace(/\D/g,'')}`, chat: isiChat };
        showInputForm();
    }

    // --- 7. FORM INPUT WITH MEMORY RECALL ---
    function showInputForm() {
        if(document.getElementById("saver-modal")) return;

        const overlay = document.createElement("div");
        overlay.id = "saver-modal";
        overlay.className = "ws-font";

        const card = document.createElement("div");
        card.className = "ws-card";

        card.innerHTML = `<div class="ws-header"><h3>💾 Simpan Leads</h3><small>Target: ${tempData.nama} (${tempData.nomor})</small></div>`;

        const body = document.createElement("div");
        body.className = "ws-body";

        // --- CEK MEMORY (AUTO-RECALL) ---
        const cacheKey = "ws_cache_" + tempData.nomor.replace(/\D/g, ''); // Kunci unik berdasarkan nomor
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        
        if (cachedData) {
            const noti = document.createElement("div");
            noti.className = "ws-noti-recall";
            noti.innerHTML = "✨ Data otomatis diisi dari input terakhir untuk nomor ini.";
            body.appendChild(noti);
        }

        // 1. HARI (Auto)
        const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        body.appendChild(createField("📅 Hari/Tanggal", "input", { value: hariIni, readonly: true }));

        // 2. DOMISILI (Load from Cache)
        body.appendChild(createField("🏠 Domisili", "input", { 
            placeholder: "Contoh: Jakarta Selatan...",
            value: cachedData ? cachedData.domisili : "" 
        }));

        // 3. LAYANAN (Load from Cache)
        body.appendChild(createDynamicSelect("🛍️ Layanan", "opt_layanan", ["Servis Ringan", "Servis Berat", "Konsultasi"], cachedData ? cachedData.layanan : ""));

        // 4. SOURCE (Load from Cache)
        body.appendChild(createDynamicSelect("📢 Source", "opt_source", ["Ads FB", "Ads IG", "Organic WA", "TikTok"], cachedData ? cachedData.source : ""));

        // 5. LEVEL (Load from Cache)
        body.appendChild(createDynamicSelect("⭐ Level", "opt_level", ["Cold", "Warm", "Hot", "VIP"], cachedData ? cachedData.level : ""));

        // 6. STATUS (Fixed)
        const statusDiv = document.createElement("div");
        statusDiv.className = "ws-form-group";
        statusDiv.innerHTML = `<label class="ws-label">✅ Status</label>`;
        const selStatus = document.createElement("select");
        selStatus.id = "inp_status";
        selStatus.className = "ws-select";
        selStatus.innerHTML = `<option value="Valid">Valid</option><option value="Invalid">Invalid</option>`;
        if(cachedData && cachedData.status) selStatus.value = cachedData.status;
        statusDiv.appendChild(selStatus);
        body.appendChild(statusDiv);

        card.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "ws-footer";
        
        const btnCancel = document.createElement("button");
        btnCancel.className = "ws-btn-action ws-btn-secondary";
        btnCancel.innerText = "Batal";
        btnCancel.onclick = () => overlay.remove();

        const btnSubmit = document.createElement("button");
        btnSubmit.className = "ws-btn-action ws-btn-primary";
        btnSubmit.innerHTML = "🚀 Kirim Data";
        btnSubmit.onclick = () => submitFinalData(btnSubmit, overlay);

        footer.appendChild(btnCancel);
        footer.appendChild(btnSubmit);
        card.appendChild(footer);

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    }

    // --- 8. HELPER UI COMPONENTS ---
    function createField(label, type, opts = {}) {
        const div = document.createElement("div");
        div.className = "ws-form-group";
        div.innerHTML = `<label class="ws-label">${label}</label>`;
        const input = document.createElement("input");
        input.type = "text";
        input.id = "inp_" + label.split(" ")[1].toLowerCase().replace("/",""); 
        input.className = "ws-input";
        if(opts.value) input.value = opts.value;
        if(opts.readonly) input.readOnly = true;
        if(opts.placeholder) input.placeholder = opts.placeholder;
        div.appendChild(input);
        return div;
    }

    function createDynamicSelect(label, storageKey, defaults, selectedValue = "") {
        const div = document.createElement("div");
        div.className = "ws-form-group";
        const idBase = label.split(" ")[1].toLowerCase();
        
        div.innerHTML = `
            <label class="ws-label">
                ${label}
                <span class="ws-manage-link" id="toggle_${idBase}">+ Atur Opsi</span>
            </label>
        `;

        const selectView = document.createElement("select");
        selectView.id = "inp_" + idBase;
        selectView.className = "ws-select";

        const managerView = document.createElement("div");
        managerView.className = "ws-manager-panel";
        managerView.style.display = "none";
        
        const chipsContainer = document.createElement("div");
        chipsContainer.className = "ws-tags-container";
        
        const addGroup = document.createElement("div");
        addGroup.className = "ws-add-group";
        const inputNew = document.createElement("input");
        inputNew.className = "ws-input-small";
        inputNew.placeholder = "Tambah baru...";
        const btnAdd = document.createElement("button");
        btnAdd.className = "ws-btn-small";
        btnAdd.innerText = "Tambah";
        addGroup.appendChild(inputNew);
        addGroup.appendChild(btnAdd);

        const btnDone = document.createElement("button");
        btnDone.className = "ws-btn-done";
        btnDone.innerText = "✅ Selesai Mengatur";

        managerView.appendChild(chipsContainer);
        managerView.appendChild(addGroup);
        managerView.appendChild(btnDone);

        let savedOpts = JSON.parse(localStorage.getItem(storageKey));
        if(!savedOpts || savedOpts.length === 0) {
            savedOpts = defaults;
            localStorage.setItem(storageKey, JSON.stringify(savedOpts));
        }

        function renderAll() {
            selectView.innerHTML = "";
            let found = false;
            savedOpts.forEach(opt => {
                let op = document.createElement("option");
                op.value = opt;
                op.innerText = opt;
                selectView.appendChild(op);
                if(opt === selectedValue) found = true;
            });
            // Jika ada nilai recall yang cocok, pilih itu
            if(found) selectView.value = selectedValue;

            chipsContainer.innerHTML = "";
            savedOpts.forEach(opt => {
                let chip = document.createElement("div");
                chip.className = "ws-chip";
                chip.innerHTML = `${opt} <span class="ws-chip-del" title="Hapus">×</span>`;
                chip.querySelector(".ws-chip-del").onclick = () => {
                    if(confirm(`Hapus opsi "${opt}"?`)) {
                        savedOpts = savedOpts.filter(o => o !== opt);
                        saveAndRefresh();
                    }
                };
                chipsContainer.appendChild(chip);
            });
        }

        function saveAndRefresh() {
            localStorage.setItem(storageKey, JSON.stringify(savedOpts));
            renderAll();
        }

        btnAdd.onclick = (e) => {
            e.preventDefault();
            const newVal = inputNew.value.trim();
            if(newVal && !savedOpts.includes(newVal)) {
                savedOpts.push(newVal);
                saveAndRefresh();
                inputNew.value = "";
                selectView.value = newVal;
            }
        };

        const toggler = div.querySelector(`#toggle_${idBase}`);
        toggler.onclick = () => {
            if (managerView.style.display === "none") {
                selectView.style.display = "none";
                managerView.style.display = "flex";
                toggler.innerText = "Batal";
                toggler.style.color = "#888";
            } else {
                selectView.style.display = "block";
                managerView.style.display = "none";
                toggler.innerText = "+ Atur Opsi";
                toggler.style.color = "#00a884";
            }
        };

        btnDone.onclick = (e) => {
            e.preventDefault();
            selectView.style.display = "block";
            managerView.style.display = "none";
            toggler.innerText = "+ Atur Opsi";
            toggler.style.color = "#00a884";
        };

        renderAll();

        div.appendChild(selectView);
        div.appendChild(managerView);
        return div;
    }

    // --- 9. SUBMIT FUNCTION & SAVE TO MEMORY ---
    function submitFinalData(btn, overlay) {
        const hari = document.getElementById("inp_haritanggal").value;
        const domisili = document.getElementById("inp_domisili").value || "-";
        const layanan = document.getElementById("inp_layanan").value;
        const source = document.getElementById("inp_source").value;
        const level = document.getElementById("inp_level").value;
        const status = document.getElementById("inp_status").value;

        // --- SAVE TO CACHE (MEMORY) ---
        // Simpan data ini agar nanti kalau buka nomor ini lagi, datanya sudah terisi
        const cacheData = {
            domisili: domisili,
            layanan: layanan,
            source: source,
            level: level,
            status: status
        };
        const cacheKey = "ws_cache_" + tempData.nomor.replace(/\D/g, '');
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

        const finalPayload = {
            data: {
                ...tempData,
                "hari": hari,
                "domisili": domisili,
                "layanan": layanan,
                "source": source,
                "level": level,
                "status": status,
                "waktu": "'" + new Date().toLocaleTimeString("id-ID")
            }
        };

        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Mengirim...";
        btn.disabled = true;

        chrome.runtime.sendMessage({ action: "kirim_data", payload: finalPayload }, (response) => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (response && response.status === "BERHASIL") {
                alert("✅ Data Berhasil Disimpan & Detail diingat!");
                overlay.remove();
                if (isSelectionMode) toggleSelectionMode();
            } else {
                alert("❌ Gagal: " + (response ? response.error : "Koneksi Error"));
            }
        });
    }

})();