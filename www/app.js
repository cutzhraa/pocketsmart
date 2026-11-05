// Inisialisasi State Aplikasi (Versi 0 / Bersih dari awal)
let appState = {
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    isBalanceHidden: false,
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    transactions: [],
    wallets: [
        { id: 1, name: "Dompet Tunai", balance: 0 },
        { id: 2, name: "Rekening BCA", balance: 200000 }
    ],
    categories: [
        { id: 1, name: "Makanan & Minuman", type: "expense" },
        { id: 2, name: "Transportasi", type: "expense" },
        { id: 3, name: "Belanja & Lifestyle", type: "expense" },
        { id: 4, name: "Tagihan & Utilitas", type: "expense" },
        { id: 5, name: "Kesehatan", type: "expense" },
        { id: 6, name: "Cicilan & Utang", type: "expense" },
        { id: 7, name: "Gaji Utama", type: "income" },
        { id: 8, name: "Freelance / Sampingan", type: "income" },
        { id: 9, name: "Investasi", type: "income" },
        { id: 10, name: "Hadiah / Lainnya", type: "income" }
    ],
    debts: [
        { id: 1, person: "Budi", amount: 150000, type: "debt" },
        { id: 2, person: "Andi", amount: 50000, type: "receivable" }
    ],
    targets: [
        { id: 1, name: "Beli Laptop Second", targetAmount: 3500000, currentAmount: 1200000 },
        { id: 2, name: "Dana Darurat", targetAmount: 1000000, currentAmount: 400000 }
    ]
};

const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

let activeEditWalletId = null;
let activeEditCategoryId = null;
let activeEditDebtId = null;
let activeEditTargetId = null;

// Variabel penampung aksi konfirmasi pop-up ala iOS
let pendingConfirmCallback = null;

// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initMonthSelector();
    initEventListeners();
    updateUI();
});

// Inisialisasi Dropdown Pemilih Bulan (DIKUNCI MATI)
function initMonthSelector() {
    const selectorBtn = document.getElementById('monthSelectorBtn');
    const dropdownMenu = document.getElementById('monthDropdownMenu');
    
    updateMonthLabel();

    if (!dropdownMenu) return;
    dropdownMenu.innerHTML = '';
    monthNames.forEach((month, index) => {
        const item = document.createElement('div');
        item.className = `dropdown-item ${index === appState.selectedMonth ? 'active' : ''}`;
        item.textContent = `${month} ${appState.selectedYear}`;
        item.addEventListener('click', () => {
            appState.selectedMonth = index;
            updateMonthLabel();
            initMonthSelector();
            dropdownMenu.classList.remove('show');
            saveData();
            updateUI();
        });
        dropdownMenu.appendChild(item);
    });

    if (selectorBtn) {
        selectorBtn.onclick = (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        };
    }

    window.onclick = (e) => {
        if (!e.target.closest('.month-selector-container')) {
            dropdownMenu.classList.remove('show');
        }
    };
}

function updateMonthLabel() {
    const labelElement = document.getElementById('currentMonthLabel');
    if (labelElement) {
        labelElement.textContent = `${monthNames[appState.selectedMonth]} ${appState.selectedYear}`;
    }
}

// Mengatur semua fungsi tombol (Event Listeners)
function initEventListeners() {
    const toggleBtn = document.getElementById('toggleBalance');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleBalanceVisibility);
    }

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileinput = document.getElementById('importFileinput');

    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });
    }

    // Logika Modal Pencarian Ganti Nama / Catatan
    const searchHeaderBtn = document.getElementById('searchHeaderBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchHeaderBtn && searchModal) {
        searchHeaderBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = "";
            renderSearchResults("");
            searchModal.classList.add('show');
            if (searchInput) searchInput.focus();
        });
    }

    if (closeSearchBtn && searchModal) {
        closeSearchBtn.addEventListener('click', () => {
            searchModal.classList.remove('show');
        });
    }

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) searchModal.classList.remove('show');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderSearchResults(e.target.value.trim());
        });
    }

    // Tombol Reset Data
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            showIosAlert(
                "Reset Semua Data",
                "Yakin ingin mereset seluruh data keuangan kembali ke Versi 0?",
                "Reset",
                () => {
                    localStorage.removeItem('pocketsmart_data');
                    appState = {
                        balance: 0,
                        totalIncome: 0,
                        totalExpense: 0,
                        isBalanceHidden: false,
                        selectedMonth: new Date().getMonth(),
                        selectedYear: new Date().getFullYear(),
                        transactions: [],
                        wallets: [
                            { id: 1, name: "Dompet Tunai", balance: 0 },
                            { id: 2, name: "Rekening BCA", balance: 200000 }
                        ],
                        categories: [
                            { id: 1, name: "Makanan & Minuman", type: "expense" },
                            { id: 2, name: "Transportasi", type: "expense" },
                            { id: 3, name: "Belanja & Lifestyle", type: "expense" },
                            { id: 4, name: "Tagihan & Utilitas", type: "expense" },
                            { id: 5, name: "Kesehatan", type: "expense" },
                            { id: 6, name: "Cicilan & Utang", type: "expense" },
                            { id: 7, name: "Gaji Utama", type: "income" },
                            { id: 8, name: "Freelance / Sampingan", type: "income" },
                            { id: 9, name: "Investasi", type: "income" },
                            { id: 10, name: "Hadiah / Lainnya", type: "income" }
                        ],
                        debts: [
                            { id: 1, person: "Budi", amount: 150000, type: "debt" },
                            { id: 2, person: "Andi", amount: 50000, type: "receivable" }
                        ],
                        targets: [
                            { id: 1, name: "Beli Laptop Second", targetAmount: 3500000, currentAmount: 1200000 },
                            { id: 2, name: "Dana Darurat", targetAmount: 1000000, currentAmount: 400000 }
                        ]
                    };
                    updateUI();
                    settingsModal.classList.remove('show');
                }
            );
        });
    }

    // Tombol Ekspor Data
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            showIosAlert(
                "Ekspor Data",
                "Apakah Anda ingin mengunduh file cadangan data (JSON) dari aplikasi ini?",
                "Unduh",
                () => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", "pocketsmart_backup.json");
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                }
            );
            settingsModal.classList.remove('show');
        });
    }

    // Tombol Pulihkan Data (Restore JSON)
    if (importDataBtn && importFileinput) {
        importDataBtn.addEventListener('click', () => {
            importFileinput.click();
        });

        importFileinput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const parsedData = JSON.parse(event.target.result);
                    if (parsedData && typeof parsedData === 'object' && parsedData.wallets) {
                        showIosAlert(
                            "Pulihkan Data",
                            "File cadangan valid! Apakah Anda ingin memulihkan data ini? Data saat ini akan ditimpa.",
                            "Pulihkan",
                            () => {
                                appState = parsedData;
                                saveData();
                                updateUI();
                                initMonthSelector();
                                showIosNotice("Berhasil", "Data keuangan berhasil dipulihkan!");
                            }
                        );
                    } else {
                        showIosNotice("Format Salah", "File JSON tidak valid atau bukan format cadangan PocketSmart.");
                    }
                } catch (err) {
                    showIosNotice("Gagal Membaca", "Terjadi kesalahan saat membaca file JSON.");
                }
                importFileinput.value = ""; // Reset input file
            };
            reader.readAsText(file);
            settingsModal.classList.remove('show');
        });
    }

    // Logika Modal Dompet
    const menuWallet = document.getElementById('menuWallet');
    const walletModal = document.getElementById('walletModal');
    const closeWalletBtn = document.getElementById('closeWalletBtn');
    const addWalletBtn = document.getElementById('addWalletBtn');

    if (menuWallet && walletModal) {
        menuWallet.addEventListener('click', () => {
            renderWalletList();
            walletModal.classList.add('show');
        });
    }

    if (closeWalletBtn && walletModal) {
        closeWalletBtn.addEventListener('click', () => {
            walletModal.classList.remove('show');
        });
    }

    if (walletModal) {
        walletModal.addEventListener('click', (e) => {
            if (e.target === walletModal) {
                walletModal.classList.remove('show');
            }
        });
    }

    // LOGIKA MODAL TAMBAH DOMPET GAYA IOS (Pengganti Prompt Bawaan)
    const addWalletModal = document.getElementById('addWalletModal');
    const closeAddWalletBtn = document.getElementById('closeAddWalletBtn');
    const cancelAddWalletBtn = document.getElementById('cancelAddWalletBtn');
    const saveAddWalletBtn = document.getElementById('saveAddWalletBtn');

    if (addWalletBtn && addWalletModal) {
        addWalletBtn.addEventListener('click', () => {
            document.getElementById('newWalletNameInput').value = "";
            document.getElementById('newWalletBalanceInput').value = "";
            addWalletModal.classList.add('show');
        });
    }

    if (closeAddWalletBtn) closeAddWalletBtn.addEventListener('click', closeAddWalletModal);
    if (cancelAddWalletBtn) cancelAddWalletBtn.addEventListener('click', closeAddWalletModal);
    if (addWalletModal) {
        addWalletModal.addEventListener('click', (e) => {
            if (e.target === addWalletModal) closeAddWalletModal();
        });
    }

    if (saveAddWalletBtn) {
        saveAddWalletBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('newWalletNameInput').value.trim();
            const balanceInput = document.getElementById('newWalletBalanceInput').value;

            if (nameInput === "") {
                showIosNotice("Peringatan", "Nama dompet tidak boleh kosong!");
                return;
            }

            const cleanBalStr = balanceInput.replace(/\D/g, '');
            const parsedBal = cleanBalStr === '' ? 0 : Number(cleanBalStr);

            const newWallet = {
                id: Date.now(),
                name: nameInput,
                balance: parsedBal
            };

            appState.wallets.push(newWallet);
            saveData();
            renderWalletList();
            updateUI();
            closeAddWalletModal();
        });
    }

    // Logika Modal Kategori
    const menuCategory = document.getElementById('menuCategory');
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryBtn = document.getElementById('closeCategoryBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    if (menuCategory && categoryModal) {
        menuCategory.addEventListener('click', () => {
            renderCategoryList();
            categoryModal.classList.add('show');
        });
    }

    if (closeCategoryBtn && categoryModal) {
        closeCategoryBtn.addEventListener('click', () => {
            categoryModal.classList.remove('show');
        });
    }

    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                categoryModal.classList.remove('show');
            }
        });
    }

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            openCategoryFormModal(null);
        });
    }

    // Logika Form Kategori Custom
    const formCategoryModal = document.getElementById('formCategoryModal');
    const closeFormCategoryBtn = document.getElementById('closeFormCategoryBtn');
    const cancelFormCategoryBtn = document.getElementById('cancelFormCategoryBtn');
    const saveFormCategoryBtn = document.getElementById('saveFormCategoryBtn');

    if (closeFormCategoryBtn) closeFormCategoryBtn.addEventListener('click', closeCategoryFormModal);
    if (cancelFormCategoryBtn) cancelFormCategoryBtn.addEventListener('click', closeCategoryFormModal);
    if (formCategoryModal) {
        formCategoryModal.addEventListener('click', (e) => {
            if (e.target === formCategoryModal) closeCategoryFormModal();
        });
    }

    if (saveFormCategoryBtn) {
        saveFormCategoryBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('categoryNameInput').value.trim();
            const typeInput = document.getElementById('categoryTypeInput').value;

            if (nameInput === "") {
                showIosNotice("Peringatan", "Nama kategori tidak boleh kosong!");
                return;
            }

            if (activeEditCategoryId === null) {
                const newCat = {
                    id: Date.now(),
                    name: nameInput,
                    type: typeInput
                };
                appState.categories.push(newCat);
            } else {
                const cat = appState.categories.find(c => c.id === activeEditCategoryId);
                if (cat) {
                    cat.name = nameInput;
                    cat.type = typeInput;
                }
            }

            saveData();
            renderCategoryList();
            closeCategoryFormModal();
        });
    }

    // Logika Modal Utang & Piutang
    const menuDebt = document.getElementById('menuDebt');
    const debtModal = document.getElementById('debtModal');
    const closeDebtBtn = document.getElementById('closeDebtBtn');
    const addDebtBtn = document.getElementById('addDebtBtn');

    if (menuDebt && debtModal) {
        menuDebt.addEventListener('click', () => {
            renderDebtList();
            debtModal.classList.add('show');
        });
    }

    if (closeDebtBtn && debtModal) {
        closeDebtBtn.addEventListener('click', () => {
            debtModal.classList.remove('show');
        });
    }

    if (debtModal) {
        debtModal.addEventListener('click', (e) => {
            if (e.target === debtModal) {
                debtModal.classList.remove('show');
            }
        });
    }

    if (addDebtBtn) {
        addDebtBtn.addEventListener('click', () => {
            openDebtFormModal(null);
        });
    }

    // Logika Form Utang Custom
    const formDebtModal = document.getElementById('formDebtModal');
    const closeFormDebtBtn = document.getElementById('closeFormDebtBtn');
    const cancelFormDebtBtn = document.getElementById('cancelFormDebtBtn');
    const saveFormDebtBtn = document.getElementById('saveFormDebtBtn');

    if (closeFormDebtBtn) closeFormDebtBtn.addEventListener('click', closeDebtFormModal);
    if (cancelFormDebtBtn) cancelFormDebtBtn.addEventListener('click', closeDebtFormModal);
    if (formDebtModal) {
        formDebtModal.addEventListener('click', (e) => {
            if (e.target === formDebtModal) closeDebtFormModal();
        });
    }

    if (saveFormDebtBtn) {
        saveFormDebtBtn.addEventListener('click', () => {
            const typeInput = document.getElementById('debtTypeInput').value;
            const personInput = document.getElementById('debtPersonInput').value.trim();
            const amountInput = document.getElementById('debtAmountInput').value;

            if (personInput === "") {
                showIosNotice("Peringatan", "Nama kontak tidak boleh kosong!");
                return;
            }

            const cleanAmtStr = amountInput.replace(/\D/g, '');
            const parsedAmt = cleanAmtStr === '' ? 0 : Number(cleanAmtStr);

            if (activeEditDebtId === null) {
                const newDebt = {
                    id: Date.now(),
                    type: typeInput,
                    person: personInput,
                    amount: parsedAmt
                };
                appState.debts.push(newDebt);
            } else {
                const debt = appState.debts.find(d => d.id === activeEditDebtId);
                if (debt) {
                    debt.type = typeInput;
                    debt.person = personInput;
                    debt.amount = parsedAmt;
                }
            }

            saveData();
            renderDebtList();
            closeDebtFormModal();
        });
    }

    // Logika Modal Target Menabung / Goals
    const menuTarget = document.getElementById('menuTarget');
    const targetModal = document.getElementById('targetModal');
    const closeTargetBtn = document.getElementById('closeTargetBtn');
    const addTargetBtn = document.getElementById('addTargetBtn');

    if (menuTarget && targetModal) {
        menuTarget.addEventListener('click', () => {
            renderTargetList();
            targetModal.classList.add('show');
        });
    }

    if (closeTargetBtn && targetModal) {
        closeTargetBtn.addEventListener('click', () => {
            targetModal.classList.remove('show');
        });
    }

    if (targetModal) {
        targetModal.addEventListener('click', (e) => {
            if (e.target === targetModal) {
                targetModal.classList.remove('show');
            }
        });
    }

    if (addTargetBtn) {
        addTargetBtn.addEventListener('click', () => {
            openTargetFormModal(null);
        });
    }

    // Logika Form Target Menabung Custom
    const formTargetModal = document.getElementById('formTargetModal');
    const closeFormTargetBtn = document.getElementById('closeFormTargetBtn');
    const cancelFormTargetBtn = document.getElementById('cancelFormTargetBtn');
    const saveFormTargetBtn = document.getElementById('saveFormTargetBtn');

    if (closeFormTargetBtn) closeFormTargetBtn.addEventListener('click', closeTargetFormModal);
    if (cancelFormTargetBtn) cancelFormTargetBtn.addEventListener('click', closeTargetFormModal);
    if (formTargetModal) {
        formTargetModal.addEventListener('click', (e) => {
            if (e.target === formTargetModal) closeTargetFormModal();
        });
    }

    if (saveFormTargetBtn) {
        saveFormTargetBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('targetNameInput').value.trim();
            const targetAmountInput = document.getElementById('targetAmountInput').value;
            const currentAmountInput = document.getElementById('targetCurrentInput').value;

            if (nameInput === "") {
                showIosNotice("Peringatan", "Nama target tidak boleh kosong!");
                return;
            }

            const cleanTargetStr = targetAmountInput.replace(/\D/g, '');
            const parsedTarget = cleanTargetStr === '' ? 0 : Number(cleanTargetStr);

            const cleanCurrentStr = currentAmountInput.replace(/\D/g, '');
            const parsedCurrent = cleanCurrentStr === '' ? 0 : Number(cleanCurrentStr);

            if (activeEditTargetId === null) {
                const newTarget = {
                    id: Date.now(),
                    name: nameInput,
                    targetAmount: parsedTarget,
                    currentAmount: parsedCurrent
                };
                appState.targets.push(newTarget);
            } else {
                const target = appState.targets.find(t => t.id === activeEditTargetId);
                if (target) {
                    target.name = nameInput;
                    target.targetAmount = parsedTarget;
                    target.currentAmount = parsedCurrent;
                }
            }

            saveData();
            renderTargetList();
            closeTargetFormModal();
        });
    }

    // Logika Modal Analisis & Statistik Keuangan
    const menuAnalytics = document.getElementById('menuAnalytics');
    const analyticsModal = document.getElementById('analyticsModal');
    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');

    if (menuAnalytics && analyticsModal) {
        menuAnalytics.addEventListener('click', () => {
            updateAnalyticsData();
            analyticsModal.classList.add('show');
        });
    }

    if (closeAnalyticsBtn && analyticsModal) {
        closeAnalyticsBtn.addEventListener('click', () => {
            analyticsModal.classList.remove('show');
        });
    }

    if (analyticsModal) {
        analyticsModal.addEventListener('click', (e) => {
            if (e.target === analyticsModal) {
                analyticsModal.classList.remove('show');
            }
        });
    }

    // ==========================================
    // LOGIKA FORM TRANSAKSI & SMART TRANSFER
    // ==========================================
    const formTransactionModal = document.getElementById('formTransactionModal');
    const closeFormTrxBtn = document.getElementById('closeFormTrxBtn');
    const cancelFormTrxBtn = document.getElementById('cancelFormTrxBtn');
    const saveFormTrxBtn = document.getElementById('saveFormTrxBtn');
    const trxTypeInput = document.getElementById('trxTypeInput');
    const trxAdminGroup = document.getElementById('trxAdminGroup');

    if (closeFormTrxBtn) closeFormTrxBtn.addEventListener('click', closeTrxFormModal);
    if (cancelFormTrxBtn) cancelFormTrxBtn.addEventListener('click', closeTrxFormModal);
    if (formTransactionModal) {
        formTransactionModal.addEventListener('click', (e) => {
            if (e.target === formTransactionModal) closeTrxFormModal();
        });
    }

    if (trxTypeInput) {
        trxTypeInput.addEventListener('change', (e) => {
            if (e.target.value === 'transfer') {
                if (trxAdminGroup) trxAdminGroup.style.display = 'block';
            } else {
                if (trxAdminGroup) trxAdminGroup.style.display = 'none';
            }
            populateTrxCategories(e.target.value);
        });
    }

    if (saveFormTrxBtn) {
        saveFormTrxBtn.addEventListener('click', () => {
            const type = trxTypeInput.value;
            const walletId = Number(document.getElementById('trxWalletInput').value);
            const categoryId = Number(document.getElementById('trxCategoryInput').value);
            const amountStr = document.getElementById('trxAmountInput').value.replace(/\D/g, '');
            const adminStr = document.getElementById('trxAdminInput').value.replace(/\D/g, '');
            const note = document.getElementById('trxNoteInput').value.trim();

            const amount = amountStr === '' ? 0 : Number(amountStr);
            const admin = adminStr === '' ? 0 : Number(adminStr);

            if (amount <= 0) {
                showIosNotice("Peringatan", "Jumlah nominal transaksi harus lebih dari 0!");
                return;
            }

            const wallet = appState.wallets.find(w => w.id === walletId);
            if (!wallet) {
                showIosNotice("Peringatan", "Pilih dompet sumber yang valid!");
                return;
            }

            const category = appState.categories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : "Umum";

            if (type === 'expense' || type === 'transfer') {
                const totalDeduction = type === 'transfer' ? (amount + admin) : amount;
                if (wallet.balance < totalDeduction) {
                    showIosNotice("Saldo Tidak Cukup", `Saldo dompet tidak cukup untuk nominal + biaya admin (Total: Rp ${totalDeduction.toLocaleString('id-ID')})!`);
                    return;
                }
                wallet.balance -= totalDeduction;
                appState.totalExpense += totalDeduction;

                if (categoryName.toLowerCase().includes('utang') || categoryName.toLowerCase().includes('cicilan') || type === 'transfer') {
                    appState.debts.push({
                        id: Date.now(),
                        person: note === "" ? "Pembayaran / Transfer" : note,
                        amount: amount,
                        type: "debt"
                    });
                }
            } else if (type === 'income') {
                wallet.balance += amount;
                appState.totalIncome += amount;
            }

            const newTrx = {
                id: Date.now(),
                type: type,
                walletName: wallet.name,
                categoryName: categoryName,
                amount: amount,
                admin: admin,
                note: note === "" ? categoryName : note,
                date: `${new Date().getDate()} ${monthNames[appState.selectedMonth]} ${appState.selectedYear}`
            };

            appState.transactions.unshift(newTrx);
            saveData();
            updateUI();
            closeTrxFormModal();
        });
    }

    // ==========================================
    // LOGIKA DAFTAR SEMUA TRANSAKSI
    // ==========================================
    const transactionModal = document.getElementById('transactionModal');
    const closeTrxModalBtn = document.getElementById('closeTrxModalBtn');
    const seeAllTrxBtn = document.getElementById('seeAllTrxBtn');

    if (seeAllTrxBtn && transactionModal) {
        seeAllTrxBtn.addEventListener('click', () => {
            renderFullTransactions();
            transactionModal.classList.add('show');
        });
    }
    if (closeTrxModalBtn && transactionModal) {
        closeTrxModalBtn.addEventListener('click', () => transactionModal.classList.remove('show'));
    }
    if (transactionModal) {
        transactionModal.addEventListener('click', (e) => {
            if (e.target === transactionModal) transactionModal.classList.remove('show');
        });
    }

    // ==========================================
    // LOGIKA KALKULATOR CEPAT (Gaya iOS Bulat)
    // ==========================================
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalculatorBtn = document.getElementById('closeCalculatorBtn');
    const calcDisplay = document.getElementById('calcDisplay');
    let calcExpression = "0";

    if (closeCalculatorBtn && calculatorModal) {
        closeCalculatorBtn.addEventListener('click', () => {
            calculatorModal.classList.remove('show');
        });
    }
    if (calculatorModal) {
        calculatorModal.addEventListener('click', (e) => {
            if (e.target === calculatorModal) calculatorModal.classList.remove('show');
        });
    }

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            const action = btn.getAttribute('data-action');

            if (val !== null) {
                if (calcExpression === "0" && val !== ".") {
                    calcExpression = val;
                } else {
                    calcExpression += val;
                }
            } else if (action === "clear") {
                calcExpression = "0";
            } else if (action === "back") {
                calcExpression = calcExpression.length > 1 ? calcExpression.slice(0, -1) : "0";
            } else if (action === "percent") {
                try {
                    let res = eval(calcExpression) / 100;
                    calcExpression = String(res);
                } catch (e) {
                    calcExpression = "Error";
                }
            } else if (action === "op") {
                calcExpression += " " + val + " ";
            } else if (action === "equals") {
                try {
                    let res = eval(calcExpression);
                    calcExpression = String(res);
                } catch (e) {
                    calcExpression = "Error";
                }
            }

            if (calcDisplay) calcDisplay.textContent = calcExpression;
        });
    });

    // ==========================================
    // AKTIFKAN TOMBOL BOTTOM NAVIGATION & FAB (+)
    // ==========================================
    const navHomeBtn = document.getElementById('navHomeBtn');
    const navTrxBtn = document.getElementById('navTrxBtn');
    const navCalcBtn = document.getElementById('navCalcBtn');
    const navSettingsBtn = document.getElementById('navSettingsBtn');
    const fabAddBtn = document.getElementById('fabAddBtn');

    const setActiveNavTab = (activeBtn) => {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    };

    if (navHomeBtn) {
        navHomeBtn.addEventListener('click', () => {
            setActiveNavTab(navHomeBtn);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (navTrxBtn) {
        navTrxBtn.addEventListener('click', () => {
            setActiveNavTab(navTrxBtn);
            renderFullTransactions();
            if (transactionModal) transactionModal.classList.add('show');
        });
    }

    if (navCalcBtn) {
        navCalcBtn.addEventListener('click', () => {
            setActiveNavTab(navCalcBtn);
            if (calculatorModal) calculatorModal.classList.add('show');
        });
    }

    if (navSettingsBtn) {
        navSettingsBtn.addEventListener('click', () => {
            setActiveNavTab(navSettingsBtn);
            if (settingsModal) settingsModal.classList.add('show');
        });
    }

    if (fabAddBtn) {
        fabAddBtn.addEventListener('click', () => {
            openTrxFormModal();
        });
    }

    // Logika Modal Edit Dompet Custom
    const editWalletModal = document.getElementById('editWalletModal');
    const closeEditWalletBtn = document.getElementById('closeEditWalletBtn');
    const cancelEditWalletBtn = document.getElementById('cancelEditWalletBtn');
    const saveEditWalletBtn = document.getElementById('saveEditWalletBtn');

    if (closeEditWalletBtn) closeEditWalletBtn.addEventListener('click', closeEditModal);
    if (cancelEditWalletBtn) cancelEditWalletBtn.addEventListener('click', closeEditModal);
    if (editWalletModal) {
        editWalletModal.addEventListener('click', (e) => {
            if (e.target === editWalletModal) closeEditModal();
        });
    }

    if (saveEditWalletBtn) {
        saveEditWalletBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('editWalletNameInput').value.trim();
            const balanceInput = document.getElementById('editWalletBalanceInput').value;

            if (nameInput === "") {
                showIosNotice("Peringatan", "Nama dompet tidak boleh kosong!");
                return;
            }

            const cleanBalStr = balanceInput.replace(/\D/g, '');
            const parsedBal = cleanBalStr === '' ? 0 : Number(cleanBalStr);

            const wallet = appState.wallets.find(w => w.id === activeEditWalletId);
            if (wallet) {
                wallet.name = nameInput;
                wallet.balance = parsedBal;
                saveData();
                renderWalletList();
                updateUI();
            }

            closeEditModal();
        });
    }

    // Logika Tombol Konfirmasi iOS Global
    const iosConfirmCancelBtn = document.getElementById('iosConfirmCancelBtn');
    const iosConfirmOkBtn = document.getElementById('iosConfirmOkBtn');
    const iosConfirmModal = document.getElementById('iosConfirmModal');

    if (iosConfirmCancelBtn) {
        iosConfirmCancelBtn.addEventListener('click', () => {
            iosConfirmModal.classList.remove('show');
            pendingConfirmCallback = null;
        });
    }

    if (iosConfirmOkBtn) {
        iosConfirmOkBtn.addEventListener('click', () => {
            if (pendingConfirmCallback) {
                pendingConfirmCallback();
            }
            iosConfirmModal.classList.remove('show');
            pendingConfirmCallback = null;
        });
    }

    if (iosConfirmModal) {
        iosConfirmModal.addEventListener('click', (e) => {
            if (e.target === iosConfirmModal) {
                iosConfirmModal.classList.remove('show');
                pendingConfirmCallback = null;
            }
        });
    }
}

function closeAddWalletModal() {
    const addWalletModal = document.getElementById('addWalletModal');
    if (addWalletModal) addWalletModal.classList.remove('show');
}

// Render Hasil Pencarian Real-Time di Modal Search
function renderSearchResults(keyword) {
    const container = document.getElementById('searchResultContainer');
    if (!container) return;

    if (!appState.transactions || appState.transactions.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Belum ada riwayat transaksi untuk dicari.</p>`;
        return;
    }

    const filtered = appState.transactions.filter(t => 
        t.note.toLowerCase().includes(keyword.toLowerCase()) || 
        t.categoryName.toLowerCase().includes(keyword.toLowerCase()) ||
        t.walletName.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keyword === "") {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Ketik kata kunci untuk mencari riwayat...</p>`;
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Tidak ada transaksi yang cocok dengan "${keyword}".</p>`;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(trx => {
        const isIncome = trx.type === 'income';
        const amountColor = isIncome ? 'var(--ios-green)' : 'var(--ios-red)';
        const sign = isIncome ? '+' : '-';

        const item = document.createElement('div');
        item.className = "trx-item-row";
        item.innerHTML = `
            <div>
                <h4 class="trx-item-title">${trx.note}</h4>
                <p class="trx-item-subtitle">${trx.walletName} • ${trx.categoryName} • ${trx.date}</p>
            </div>
            <div class="trx-item-amount" style="color: ${amountColor};">${sign}Rp ${trx.amount.toLocaleString('id-ID')}</div>
        `;
        container.appendChild(item);
    });
}

// Fungsi Buka Form Transaksi & Smart Transfer
function openTrxFormModal() {
    const walletSelect = document.getElementById('trxWalletInput');
    const typeSelect = document.getElementById('trxTypeInput');
    const amountInput = document.getElementById('trxAmountInput');
    const adminInput = document.getElementById('trxAdminInput');
    const noteInput = document.getElementById('trxNoteInput');

    if (!walletSelect) return;
    walletSelect.innerHTML = '';
    appState.wallets.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = `${w.name} (Rp ${w.balance.toLocaleString('id-ID')})`;
        walletSelect.appendChild(opt);
    });

    typeSelect.value = "expense";
    if (document.getElementById('trxAdminGroup')) document.getElementById('trxAdminGroup').style.display = 'none';
    populateTrxCategories("expense");

    if (amountInput) amountInput.value = "";
    if (adminInput) adminInput.value = "0";
    if (noteInput) noteInput.value = "";

    const modal = document.getElementById('formTransactionModal');
    if (modal) modal.classList.add('show');
}

function closeTrxFormModal() {
    const modal = document.getElementById('formTransactionModal');
    if (modal) modal.classList.remove('show');
}

function populateTrxCategories(type) {
    const catSelect = document.getElementById('trxCategoryInput');
    if (!catSelect) return;
    catSelect.innerHTML = '';
    
    let filtered = appState.categories.filter(c => type === 'transfer' ? true : c.type === type);
    if (filtered.length === 0) filtered = appState.categories;

    filtered.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
    });
}

// Render Daftar Semua Transaksi
function renderFullTransactions() {
    const container = document.getElementById('fullTransactionListContainer');
    if (!container) return;

    if (!appState.transactions || appState.transactions.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 20px 0;">Belum ada transaksi tercatat.</div>`;
        return;
    }

    container.innerHTML = '';
    appState.transactions.forEach(trx => {
        const isIncome = trx.type === 'income';
        const amountColor = isIncome ? 'var(--ios-green)' : 'var(--ios-red)';
        const sign = isIncome ? '+' : '-';

        const item = document.createElement('div');
        item.className = "trx-item-row";
        item.innerHTML = `
            <div>
                <h4 class="trx-item-title">${trx.note}</h4>
                <p class="trx-item-subtitle">${trx.walletName} • ${trx.categoryName} • ${trx.date}</p>
            </div>
            <div style="text-align: right;">
                <div class="trx-item-amount" style="color: ${amountColor};">${sign}Rp ${trx.amount.toLocaleString('id-ID')}</div>
                ${trx.admin > 0 ? `<div style="font-size: 10px; color: var(--ios-sublabel);">Admin: Rp ${trx.admin.toLocaleString('id-ID')}</div>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

// Fungsi Pemanggil Pop-up Konfirmasi iOS
function showIosAlert(title, message, okText, onOkCallback) {
    document.getElementById('iosConfirmTitle').textContent = title;
    document.getElementById('iosConfirmMessage').textContent = message;
    const okBtn = document.getElementById('iosConfirmOkBtn');
    okBtn.textContent = okText;
    okBtn.style.display = 'inline-block';
    pendingConfirmCallback = onOkCallback;
    document.getElementById('iosConfirmModal').classList.add('show');
}

function showIosNotice(title, message) {
    document.getElementById('iosConfirmTitle').textContent = title;
    document.getElementById('iosConfirmMessage').textContent = message;
    const okBtn = document.getElementById('iosConfirmOkBtn');
    okBtn.textContent = "OK";
    okBtn.style.display = 'none';
    pendingConfirmCallback = null;
    document.getElementById('iosConfirmModal').classList.add('show');
}

// Perbarui Data Tampilan Modal Analisis
function updateAnalyticsData() {
    const incomeEl = document.getElementById('analyticIncome');
    const expenseEl = document.getElementById('analyticExpense');
    const netEl = document.getElementById('analyticNet');
    const statusTextEl = document.getElementById('analyticStatusText');

    if (incomeEl) incomeEl.textContent = "+Rp " + appState.totalIncome.toLocaleString('id-ID');
    if (expenseEl) expenseEl.textContent = "-Rp " + appState.totalExpense.toLocaleString('id-ID');
    
    const net = appState.totalIncome - appState.totalExpense;
    if (netEl) {
        netEl.textContent = (net >= 0 ? "+Rp " : "-Rp ") + Math.abs(net).toLocaleString('id-ID');
        netEl.style.color = net >= 0 ? "var(--ios-green)" : "var(--ios-red)";
    }

    if (statusTextEl) {
        if (appState.totalIncome === 0 && appState.totalExpense === 0) {
            statusTextEl.textContent = "Belum ada transaksi tercatat di bulan ini. Yuk mulai catat pemasukan dan pengeluaranmu!";
        } else if (net > 0) {
            statusTextEl.textContent = "Kondisi keuanganmu sehat! Arus kas bulan ini surplus (pemasukan lebih besar dari pengeluaran).";
        } else if (net < 0) {
            statusTextEl.textContent = "Perhatian! Arus kas bulan ini defisit (pengeluaran lebih besar dari pemasukan). Coba kurangi pengeluaran yang kurang penting.";
        } else {
            statusTextEl.textContent = "Arus kas stabil (imbang antara pemasukan dan pengeluaran).";
        }
    }
}

// Fungsi Tutup Modal Edit Dompet
function closeEditModal() {
    const editModal = document.getElementById('editWalletModal');
    if (editModal) editModal.classList.remove('show');
    activeEditWalletId = null;
}

function openEditModal(id) {
    const wallet = appState.wallets.find(w => w.id === id);
    if (wallet) {
        activeEditWalletId = id;
        document.getElementById('editWalletNameInput').value = wallet.name;
        document.getElementById('editWalletBalanceInput').value = wallet.balance.toLocaleString('id-ID');
        document.getElementById('editWalletModal').classList.add('show');
    }
}

// Fungsi Kategori Form
function openCategoryFormModal(id) {
    activeEditCategoryId = id;
    const titleEl = document.getElementById('formCategoryTitle');
    const nameInput = document.getElementById('categoryNameInput');
    const typeInput = document.getElementById('categoryTypeInput');

    if (id === null) {
        titleEl.textContent = "Tambah Kategori";
        nameInput.value = "";
        typeInput.value = "expense";
    } else {
        titleEl.textContent = "Edit Kategori";
        const cat = appState.categories.find(c => c.id === id);
        if (cat) {
            nameInput.value = cat.name;
            typeInput.value = cat.type;
        }
    }
    document.getElementById('formCategoryModal').classList.add('show');
}

function closeCategoryFormModal() {
    document.getElementById('formCategoryModal').classList.remove('show');
    activeEditCategoryId = null;
}

// Fungsi Form Utang
function openDebtFormModal(id) {
    activeEditDebtId = id;
    const titleEl = document.getElementById('formDebtTitle');
    const typeInput = document.getElementById('debtTypeInput');
    const personInput = document.getElementById('debtPersonInput');
    const amountInput = document.getElementById('debtAmountInput');

    if (id === null) {
        titleEl.textContent = "Catat Utang / Piutang";
        typeInput.value = "debt";
        personInput.value = "";
        amountInput.value = "";
    } else {
        titleEl.textContent = "Edit Catatan";
        const debt = appState.debts.find(d => d.id === id);
        if (debt) {
            typeInput.value = debt.type;
            personInput.value = debt.person;
            amountInput.value = debt.amount.toLocaleString('id-ID');
        }
    }
    document.getElementById('formDebtModal').classList.add('show');
}

function closeDebtFormModal() {
    document.getElementById('formDebtModal').classList.remove('show');
    activeEditDebtId = null;
}

// Fungsi Form Target Menabung
function openTargetFormModal(id) {
    activeEditTargetId = id;
    const titleEl = document.getElementById('formTargetTitle');
    const nameInput = document.getElementById('targetNameInput');
    const targetAmountInput = document.getElementById('targetAmountInput');
    const currentAmountInput = document.getElementById('targetCurrentInput');

    if (id === null) {
        titleEl.textContent = "Tambah Target";
        nameInput.value = "";
        targetAmountInput.value = "";
        currentAmountInput.value = "";
    } else {
        titleEl.textContent = "Edit Target";
        const target = appState.targets.find(t => t.id === id);
        if (target) {
            nameInput.value = target.name;
            targetAmountInput.value = target.targetAmount.toLocaleString('id-ID');
            currentAmountInput.value = target.currentAmount.toLocaleString('id-ID');
        }
    }
    document.getElementById('formTargetModal').classList.add('show');
}

function closeTargetFormModal() {
    document.getElementById('formTargetModal').classList.remove('show');
    activeEditTargetId = null;
}

// Deteksi Ikon Dompet
function getWalletIcon(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cash') || lowerName.includes('tunai') || lowerName.includes('saku')) {
        return '💵';
    } else if (lowerName.includes('bca') || lowerName.includes('bni') || lowerName.includes('bri') || lowerName.includes('mandiri') || lowerName.includes('bank') || lowerName.includes('rekening')) {
        return '💳';
    } else if (lowerName.includes('dana') || lowerName.includes('gopay') || lowerName.includes('ovo') || lowerName.includes('qris') || lowerName.includes('shopeepay') || lowerName.includes('wallet')) {
        return '📱';
    } else if (lowerName.includes('emas') || lowerName.includes('gold') || lowerName.includes('invest')) {
        return '🪙';
    } else {
        return '👛';
    }
}

// Deteksi Ikon Kategori
function getCategoryIcon(name) {
    const lower = name.toLowerCase();
    if (lower.includes('makan') || lower.includes('minum') || lower.includes('kuliner')) return '🍔';
    if (lower.includes('transport') || lower.includes('bensin') || lower.includes('parkir')) return '🚗';
    if (lower.includes('gaji') || lower.includes('salary')) return '💰';
    if (lower.includes('freelance') || lower.includes('project')) return '💻';
    if (lower.includes('belanja') || lower.includes('shop') || lower.includes('lifestyle')) return '🛍️';
    if (lower.includes('tagihan') || lower.includes('listrik') || lower.includes('wifi') || lower.includes('utilitas')) return '⚡';
    if (lower.includes('sehat') || lower.includes('kesehatan') || lower.includes('obat')|| lower.includes('dokter')) return '💊';
    if (lower.includes('cicilan') || lower.includes('utang') || lower.includes('pinjam')) return '🧾';
    if (lower.includes('invest') || lower.includes('saham') || lower.includes('reksa')) return '📈';
    if (lower.includes('hadiah') || lower.includes('lain') || lower.includes('bonus')) return '🎁';
    return '🏷️';
}

// Render daftar dompet
function renderWalletList() {
    const container = document.getElementById('walletListContainer');
    if (!container) return;

    if (appState.wallets.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 10px 0;">Belum ada dompet terdaftar.</p>`;
        return;
    }

    container.innerHTML = '';
    appState.wallets.forEach(wallet => {
        const icon = getWalletIcon(wallet.name);
        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${wallet.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${wallet.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${wallet.id}">
                <div class="wallet-left">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info">
                        <h4>${wallet.name}</h4>
                    </div>
                </div>
                <div class="wallet-right">
                    <div class="wallet-balance">Rp ${wallet.balance.toLocaleString('id-ID')}</div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        card.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            let diff = endX - startX;

            container.querySelectorAll('.wallet-item-card').forEach(c => {
                c.classList.remove('swiped-right', 'swiped-left');
            });

            if (diff > 120) {
                openEditModal(id);
            } else if (diff < -120) {
                triggerDeleteWallet(id);
            } else if (diff > 40) {
                card.classList.add('swiped-right');
            } else if (diff < -40) {
                card.classList.add('swiped-left');
            }
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditModal(Number(e.currentTarget.getAttribute('data-id')));
        });
    });

    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerDeleteWallet(Number(e.currentTarget.getAttribute('data-id')));
        });
    });
}

// Render daftar kategori
function renderCategoryList() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;

    if (!appState.categories || appState.categories.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 10px 0;">Belum ada kategori.</p>`;
        return;
    }

    container.innerHTML = '';
    appState.categories.forEach(cat => {
        const icon = getCategoryIcon(cat.name);
        const typeBadge = cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const badgeColor = cat.type === 'income' ? 'var(--ios-green)' : 'var(--ios-red)';

        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${cat.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${cat.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${cat.id}">
                <div class="wallet-left">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info">
                        <h4>${cat.name}</h4>
                    </div>
                </div>
                <div class="wallet-right">
                    <div style="font-size: 12px; font-weight: 600; color: ${badgeColor};">${typeBadge}</div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        card.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            let diff = endX - startX;

            container.querySelectorAll('.wallet-item-card').forEach(c => {
                c.classList.remove('swiped-right', 'swiped-left');
            });

            if (diff > 120) {
                openCategoryFormModal(id);
            } else if (diff < -120) {
                triggerDeleteCategory(id);
            } else if (diff > 40) {
                card.classList.add('swiped-right');
            } else if (diff < -40) {
                card.classList.add('swiped-left');
            }
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openCategoryFormModal(Number(e.currentTarget.getAttribute('data-id')));
        });
    });

    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerDeleteCategory(Number(e.currentTarget.getAttribute('data-id')));
        });
    });
}

// Render daftar utang & piutang
function renderDebtList() {
    const container = document.getElementById('debtListContainer');
    if (!container) return;

    if (!appState.debts || appState.debts.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 10px 0;">Belum ada catatan utang.</p>`;
        return;
    }

    container.innerHTML = '';
    appState.debts.forEach(debt => {
        const isDebt = debt.type === 'debt';
        const icon = isDebt ? '📤' : '📥';
        const typeBadge = isDebt ? 'Utang' : 'Piutang';
        const badgeColor = isDebt ? 'var(--ios-red)' : 'var(--ios-green)';

        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${debt.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${debt.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${debt.id}">
                <div class="wallet-left">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info">
                        <h4>${debt.person}</h4>
                        <p style="font-size: 11px; color: ${badgeColor}; font-weight: 600; margin-top: 2px;">${typeBadge}</p>
                    </div>
                </div>
                <div class="wallet-right">
                    <div class="wallet-balance" style="color: ${badgeColor};">Rp ${debt.amount.toLocaleString('id-ID')}</div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        card.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            let diff = endX - startX;

            container.querySelectorAll('.wallet-item-card').forEach(c => {
                c.classList.remove('swiped-right', 'swiped-left');
            });

            if (diff > 120) {
                openDebtFormModal(id);
            } else if (diff < -120) {
                triggerDeleteDebt(id);
            } else if (diff > 40) {
                card.classList.add('swiped-right');
            } else if (diff < -40) {
                card.classList.add('swiped-left');
            }
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openDebtFormModal(Number(e.currentTarget.getAttribute('data-id')));
        });
    });

    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerDeleteDebt(Number(e.currentTarget.getAttribute('data-id')));
        });
    });
}

// Render daftar target menabung
function renderTargetList() {
    const container = document.getElementById('targetListContainer');
    if (!container) return;

    if (!appState.targets || appState.targets.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 10px 0;">Belum ada target menabung.</p>`;
        return;
    }

    container.innerHTML = '';
    appState.targets.forEach(target => {
        const percent = target.targetAmount > 0 ? Math.min(100, Math.round((target.currentAmount / target.targetAmount) * 100)) : 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${target.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${target.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${target.id}" style="flex-direction: column; align-items: stretch; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="wallet-icon-box" style="margin-bottom: 0;">🎯</div>
                        <div>
                            <h4 style="font-size: 14px; font-weight: 600; color: #ffffff; line-height: 1.2;">${target.name}</h4>
                            <p style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">Terkumpul: Rp ${target.currentAmount.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--ios-blue);">Rp ${target.targetAmount.toLocaleString('id-ID')}</div>
                        <div style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">${percent}%</div>
                    </div>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden; margin-top: 4px;">
                    <div style="width: ${percent}%; height: 100%; background: var(--ios-blue); border-radius: 3px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        card.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            let diff = endX - startX;

            container.querySelectorAll('.wallet-item-card').forEach(c => {
                c.classList.remove('swiped-right', 'swiped-left');
            });

            if (diff > 120) {
                openTargetFormModal(id);
            } else if (diff < -120) {
                triggerDeleteTarget(id);
            } else if (diff > 40) {
                card.classList.add('swiped-right');
            } else if (diff < -40) {
                card.classList.add('swiped-left');
            }
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openTargetFormModal(Number(e.currentTarget.getAttribute('data-id')));
        });
    });

    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerDeleteTarget(Number(e.currentTarget.getAttribute('data-id')));
        });
    });
}

// Fungsi Hapus Target Menabung
function triggerDeleteTarget(id) {
    showIosAlert(
        "Hapus Target",
        "Yakin ingin menghapus target menabung ini?",
        "Hapus",
        () => {
            appState.targets = appState.targets.filter(t => t.id !== id);
            saveData();
            renderTargetList();
        }
    );
}

// Fungsi Hapus Utang
function triggerDeleteDebt(id) {
    showIosAlert(
        "Hapus Catatan",
        "Yakin ingin menghapus catatan utang/piutang ini?",
        "Hapus",
        () => {
            appState.debts = appState.debts.filter(d => d.id !== id);
            saveData();
            renderDebtList();
        }
    );
}

// Fungsi Hapus Kategori
function triggerDeleteCategory(id) {
    if (appState.categories.length <= 1) {
        showIosNotice("Peringatan", "Minimal harus ada 1 kategori aktif!");
        return;
    }
    showIosAlert(
        "Hapus Kategori",
        "Yakin ingin menghapus kategori ini?",
        "Hapus",
        () => {
            appState.categories = appState.categories.filter(c => c.id !== id);
            saveData();
            renderCategoryList();
        }
    );
}

// Fungsi Hapus Dompet
function triggerDeleteWallet(id) {
    if (appState.wallets.length <= 1) {
        showIosNotice("Peringatan", "Minimal harus ada 1 dompet aktif di dalam aplikasi!");
        return;
    }
    showIosAlert(
        "Hapus Dompet",
        "Yakin ingin menghapus dompet ini?",
        "Hapus",
        () => {
            appState.wallets = appState.wallets.filter(w => w.id !== id);
            saveData();
            renderWalletList();
            updateUI();
        }
    );
}

function toggleBalanceVisibility() {
    appState.isBalanceHidden = !appState.isBalanceHidden;
    
    const toggleBtn = document.getElementById('toggleBalance');
    if (appState.isBalanceHidden) {
        toggleBtn.innerHTML = `
            <svg class="ios-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        toggleBtn.innerHTML = `
            <svg class="ios-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
    
    updateUI();
}

function updateUI() {
    let totalBal = 0;
    if (appState.wallets && appState.wallets.length > 0) {
        totalBal = appState.wallets.reduce((sum, w) => sum + w.balance, 0);
    }
    appState.balance = totalBal;

    const balanceElement = document.querySelector('.balance-amount');
    const incomeElement = document.getElementById('incomeAmount');
    const expenseElement = document.getElementById('expenseAmount');
    const transactionListContainer = document.getElementById('transactionList');

    if (balanceElement) {
        balanceElement.textContent = appState.isBalanceHidden ? "Rp •••••••" : "Rp " + appState.balance.toLocaleString('id-ID');
    }

    if (incomeElement) {
        incomeElement.textContent = appState.isBalanceHidden ? "+Rp •••••••" : "+Rp " + appState.totalIncome.toLocaleString('id-ID');
    }

    if (expenseElement) {
        expenseElement.textContent = appState.isBalanceHidden ? "-Rp •••••••" : "-Rp " + appState.totalExpense.toLocaleString('id-ID');
    }

    if (transactionListContainer) {
        if (appState.transactions.length === 0) {
            transactionListContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 25px 0; color: #8e8e93; font-size: 13px;">
                    Belum ada transaksi tercatat
                </div>
            `;
        } else {
            transactionListContainer.innerHTML = '';
            const recentTrx = appState.transactions.slice(0, 3);
            recentTrx.forEach(trx => {
                const isIncome = trx.type === 'income';
                const amountColor = isIncome ? 'var(--ios-green)' : 'var(--ios-red)';
                const sign = isIncome ? '+' : '-';

                const item = document.createElement('div');
                item.className = "trx-item-row";
                item.innerHTML = `
                    <div>
                        <h4 class="trx-item-title">${trx.note}</h4>
                        <p class="trx-item-subtitle">${trx.walletName} • ${trx.categoryName}</p>
                    </div>
                    <div class="trx-item-amount" style="color: ${amountColor};">${sign}Rp ${trx.amount.toLocaleString('id-ID')}</div>
                `;
                transactionListContainer.appendChild(item);
            });
        }
    }
}

function saveData() {
    localStorage.setItem('pocketsmart_data', JSON.stringify(appState));
}

function loadData() {
    const saved = localStorage.getItem('pocketsmart_data');
    if (saved) {
        appState = JSON.parse(saved);
        if (!appState.wallets) {
            appState.wallets = [
                { id: 1, name: "Dompet Tunai", balance: 0 },
                { id: 2, name: "Rekening BCA", balance: 200000 }
            ];
        }
        if (!appState.categories || appState.categories.length <= 4) {
            appState.categories = [
                { id: 1, name: "Makanan & Minuman", type: "expense" },
                { id: 2, name: "Transportasi", type: "expense" },
                { id: 3, name: "Belanja & Lifestyle", type: "expense" },
                { id: 4, name: "Tagihan & Utilitas", type: "expense" },
                { id: 5, name: "Kesehatan", type: "expense" },
                { id: 6, name: "Cicilan & Utang", type: "expense" },
                { id: 7, name: "Gaji Utama", type: "income" },
                { id: 8, name: "Freelance / Sampingan", type: "income" },
                { id: 9, name: "Investasi", type: "income" },
                { id: 10, name: "Hadiah / Lainnya", type: "income" }
            ];
        }
        if (!appState.debts) {
            appState.debts = [
                { id: 1, person: "Budi", amount: 150000, type: "debt" },
                { id: 2, person: "Andi", amount: 50000, type: "receivable" }
            ];
        }
        if (!appState.targets) {
            appState.targets = [
                { id: 1, name: "Beli Laptop Second", targetAmount: 3500000, currentAmount: 1200000 },
                { id: 2, name: "Dana Darurat", targetAmount: 1000000, currentAmount: 400000 }
            ];
        }
    }
}