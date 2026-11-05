import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Inisialisasi State Aplikasi (Versi 0 / Bersih dari awal)
let appState = {
    balance: 0,
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

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

let activeEditWalletId = null;
let activeEditCategoryId = null;
let activeEditDebtId = null;
let activeEditTargetId = null;
let activeEditTrxId = null;

let pendingConfirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initMonthSelector();
    initEventListeners();
    updateUI();
});

// Inisialisasi Dropdown Pemilih Bulan
function initMonthSelector() {
    const selectorBtn = document.getElementById('monthSelectorBtn');
    const dropdownMenu = document.getElementById('monthDropdownMenu');
    
    updateMonthLabel();

    if (!dropdownMenu) return;
    dropdownMenu.innerHTML = '';
    
    // Buat daftar pilihan bulan (misal rentang tahun saat ini dan tahun sebelumnya/sesudahnya)
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    years.forEach(year => {
        monthNames.forEach((month, index) => {
            const item = document.createElement('div');
            item.className = `dropdown-item ${index === appState.selectedMonth && year === appState.selectedYear ? 'active' : ''}`;
            item.textContent = `${month} ${year}`;
            item.addEventListener('click', () => {
                appState.selectedMonth = index;
                appState.selectedYear = year;
                updateMonthLabel();
                initMonthSelector();
                dropdownMenu.classList.remove('show');
                saveData();
                updateUI();
            });
            dropdownMenu.appendChild(item);
        });
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

// Filter transaksi berdasarkan bulan dan tahun yang sedang aktif
function getFilteredTransactions() {
    if (!appState.transactions) return [];
    return appState.transactions.filter(t => {
        const tDate = new Date(t.createdAt || t.id);
        return tDate.getMonth() === appState.selectedMonth && tDate.getFullYear() === appState.selectedYear;
    });
}

function initEventListeners() {
    const toggleBtn = document.getElementById('toggleBalance');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleBalanceVisibility);

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileinput = document.getElementById('importFileinput');

    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('show'));
    }
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('show');
        });
    }

    // Modal Pencarian
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
    if (closeSearchBtn && searchModal) closeSearchBtn.addEventListener('click', () => searchModal.classList.remove('show'));
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) searchModal.classList.remove('show');
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value.trim()));
    }

    // Reset Data
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

    // Ekspor Data
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            settingsModal.classList.remove('show');
            showIosAlert(
                "Ekspor Data",
                "Apakah Anda ingin membuat file cadangan data (JSON)?",
                "Unduh",
                async () => {
                    try {
                        const dataStr = JSON.stringify(appState, null, 2);
                        const fileName = `pocketsmart_backup_${Date.now()}.json`;

                        if (Capacitor.isNativePlatform()) {
                            const result = await Filesystem.writeFile({
                                path: fileName,
                                data: dataStr,
                                directory: Directory.Documents,
                                encoding: 'utf8'
                            });
                            await Share.share({
                                title: 'Cadangan PocketSmart',
                                text: 'File cadangan data keuangan PocketSmart',
                                url: result.uri,
                                dialogTitle: 'Simpan File Backup'
                            });
                            showIosNotice("Berhasil", "File backup berhasil dibuat.");
                        } else {
                            const blob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = fileName;
                            document.body.appendChild(anchor);
                            anchor.click();
                            document.body.removeChild(anchor);
                            URL.revokeObjectURL(url);
                            showIosNotice("Berhasil", "File cadangan berhasil diunduh!");
                        }
                    } catch (err) {
                        showIosNotice("Gagal Mengunduh", "Terjadi kesalahan: " + (err.message || "Gagal membuat backup."));
                    }
                }
            );
        });
    }

    // Pulihkan Data
    if (importDataBtn && importFileinput) {
        importDataBtn.addEventListener('click', () => importFileinput.click());
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
                            "File cadangan valid! Pulihkan data ini? Data saat ini akan ditimpa.",
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
                        showIosNotice("Format Salah", "File JSON tidak valid.");
                    }
                } catch (err) {
                    showIosNotice("Gagal Membaca", "Terjadi kesalahan saat membaca file.");
                }
                importFileinput.value = "";
            };
            reader.readAsText(file);
            settingsModal.classList.remove('show');
        });
    }

    // Modal Dompet
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
    if (closeWalletBtn && walletModal) closeWalletBtn.addEventListener('click', () => walletModal.classList.remove('show'));
    if (walletModal) {
        walletModal.addEventListener('click', (e) => {
            if (e.target === walletModal) walletModal.classList.remove('show');
        });
    }

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
            const parsedBal = Number(balanceInput.replace(/\D/g, '')) || 0;
            appState.wallets.push({ id: Date.now(), name: nameInput, balance: parsedBal });
            saveData();
            renderWalletList();
            updateUI();
            closeAddWalletModal();
        });
    }

    // Modal Kategori
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
    if (closeCategoryBtn && categoryModal) closeCategoryBtn.addEventListener('click', () => categoryModal.classList.remove('show'));
    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) categoryModal.classList.remove('show');
        });
    }
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openCategoryFormModal(null));

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
                appState.categories.push({ id: Date.now(), name: nameInput, type: typeInput });
            } else {
                const cat = appState.categories.find(c => c.id === activeEditCategoryId);
                if (cat) { cat.name = nameInput; cat.type = typeInput; }
            }
            saveData();
            renderCategoryList();
            closeCategoryFormModal();
        });
    }

    // Modal Utang
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
    if (closeDebtBtn && debtModal) closeDebtBtn.addEventListener('click', () => debtModal.classList.remove('show'));
    if (debtModal) {
        debtModal.addEventListener('click', (e) => {
            if (e.target === debtModal) debtModal.classList.remove('show');
        });
    }
    if (addDebtBtn) addDebtBtn.addEventListener('click', () => openDebtFormModal(null));

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
            const parsedAmt = Number(amountInput.replace(/\D/g, '')) || 0;

            if (activeEditDebtId === null) {
                appState.debts.push({ id: Date.now(), type: typeInput, person: personInput, amount: parsedAmt });
            } else {
                const debt = appState.debts.find(d => d.id === activeEditDebtId);
                if (debt) { debt.type = typeInput; debt.person = personInput; debt.amount = parsedAmt; }
            }
            saveData();
            renderDebtList();
            closeDebtFormModal();
        });
    }

    // Modal Target
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
    if (closeTargetBtn && targetModal) closeTargetBtn.addEventListener('click', () => targetModal.classList.remove('show'));
    if (targetModal) {
        targetModal.addEventListener('click', (e) => {
            if (e.target === targetModal) targetModal.classList.remove('show');
        });
    }
    if (addTargetBtn) addTargetBtn.addEventListener('click', () => openTargetFormModal(null));

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
            const parsedTarget = Number(targetAmountInput.replace(/\D/g, '')) || 0;
            const parsedCurrent = Number(currentAmountInput.replace(/\D/g, '')) || 0;

            if (activeEditTargetId === null) {
                appState.targets.push({ id: Date.now(), name: nameInput, targetAmount: parsedTarget, currentAmount: parsedCurrent });
            } else {
                const target = appState.targets.find(t => t.id === activeEditTargetId);
                if (target) { target.name = nameInput; target.targetAmount = parsedTarget; target.currentAmount = parsedCurrent; }
            }
            saveData();
            renderTargetList();
            closeTargetFormModal();
        });
    }

    // Modal Analisis
    const menuAnalytics = document.getElementById('menuAnalytics');
    const analyticsModal = document.getElementById('analyticsModal');
    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');

    if (menuAnalytics && analyticsModal) {
        menuAnalytics.addEventListener('click', () => {
            updateAnalyticsData();
            analyticsModal.classList.add('show');
        });
    }
    if (closeAnalyticsBtn && analyticsModal) closeAnalyticsBtn.addEventListener('click', () => analyticsModal.classList.remove('show'));
    if (analyticsModal) {
        analyticsModal.addEventListener('click', (e) => {
            if (e.target === analyticsModal) analyticsModal.classList.remove('show');
        });
    }

    // Action Sheet Dropdowns
    setupActionSheetDropdowns();

    // Form Transaksi
    const formTransactionModal = document.getElementById('formTransactionModal');
    const closeFormTrxBtn = document.getElementById('closeFormTrxBtn');
    const cancelFormTrxBtn = document.getElementById('cancelFormTrxBtn');
    const saveFormTrxBtn = document.getElementById('saveFormTrxBtn');

    if (closeFormTrxBtn) closeFormTrxBtn.addEventListener('click', closeTrxFormModal);
    if (cancelFormTrxBtn) cancelFormTrxBtn.addEventListener('click', closeTrxFormModal);
    if (formTransactionModal) {
        formTransactionModal.addEventListener('click', (e) => {
            if (e.target === formTransactionModal) closeTrxFormModal();
        });
    }

    if (saveFormTrxBtn) {
        saveFormTrxBtn.addEventListener('click', () => {
            const type = document.getElementById('trxTypeInput').value;
            const walletId = Number(document.getElementById('trxWalletInput').value);
            const categoryId = Number(document.getElementById('trxCategoryInput').value);
            const amountStr = document.getElementById('trxAmountInput').value.replace(/\D/g, '');
            const note = document.getElementById('trxNoteInput').value.trim();

            const amount = amountStr === '' ? 0 : Number(amountStr);
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

            const now = new Date();
            const formattedDateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            if (activeEditTrxId === null) {
                if (type === 'expense') {
                    if (wallet.balance < amount) {
                        showIosNotice("Saldo Tidak Cukup", `Saldo dompet "${wallet.name}" tidak mencukupi!`);
                        return;
                    }
                    wallet.balance -= amount;
                } else if (type === 'income') {
                    wallet.balance += amount;
                }

                const newTrx = {
                    id: Date.now(),
                    createdAt: now.getTime(),
                    type: type,
                    walletId: wallet.id,
                    walletName: wallet.name,
                    categoryName: categoryName,
                    amount: amount,
                    note: note === "" ? categoryName : note,
                    date: formattedDateStr
                };
                appState.transactions.unshift(newTrx);
            } else {
                const oldTrx = appState.transactions.find(t => t.id === activeEditTrxId);
                if (oldTrx) {
                    const oldWallet = appState.wallets.find(w => w.id === oldTrx.walletId);
                    if (oldWallet) {
                        if (oldTrx.type === 'expense') oldWallet.balance += oldTrx.amount;
                        else if (oldTrx.type === 'income') oldWallet.balance -= oldTrx.amount;
                    }

                    if (type === 'expense') {
                        if (wallet.balance < amount) {
                            showIosNotice("Saldo Tidak Cukup", `Saldo dompet "${wallet.name}" tidak mencukupi!`);
                            if (oldWallet) {
                                if (oldTrx.type === 'expense') oldWallet.balance -= oldTrx.amount;
                                else if (oldTrx.type === 'income') oldWallet.balance += oldTrx.amount;
                            }
                            return;
                        }
                        wallet.balance -= amount;
                    } else if (type === 'income') {
                        wallet.balance += amount;
                    }

                    oldTrx.type = type;
                    oldTrx.walletId = wallet.id;
                    oldTrx.walletName = wallet.name;
                    oldTrx.categoryName = categoryName;
                    oldTrx.amount = amount;
                    oldTrx.note = note === "" ? categoryName : note;
                }
            }

            saveData();
            updateUI();
            closeTrxFormModal();
        });
    }

    // Modal Semua Transaksi
    const transactionModal = document.getElementById('transactionModal');
    const closeTrxModalBtn = document.getElementById('closeTrxModalBtn');
    const seeAllTrxBtn = document.getElementById('seeAllTrxBtn');

    if (seeAllTrxBtn && transactionModal) {
        seeAllTrxBtn.addEventListener('click', () => {
            renderFullTransactions();
            transactionModal.classList.add('show');
        });
    }
    if (closeTrxModalBtn && transactionModal) closeTrxModalBtn.addEventListener('click', () => transactionModal.classList.remove('show'));
    if (transactionModal) {
        transactionModal.addEventListener('click', (e) => {
            if (e.target === transactionModal) transactionModal.classList.remove('show');
        });
    }

    // Kalkulator
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalculatorBtn = document.getElementById('closeCalculatorBtn');
    const calcDisplay = document.getElementById('calcDisplay');
    let calcExpression = "0";

    if (closeCalculatorBtn && calculatorModal) closeCalculatorBtn.addEventListener('click', () => calculatorModal.classList.remove('show'));
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
                if (calcExpression === "0" && val !== ".") calcExpression = val;
                else calcExpression += val;
            } else if (action === "clear") {
                calcExpression = "0";
            } else if (action === "back") {
                calcExpression = calcExpression.length > 1 ? calcExpression.slice(0, -1) : "0";
            } else if (action === "percent") {
                try { calcExpression = String(eval(calcExpression) / 100); } catch (e) { calcExpression = "Error"; }
            } else if (action === "op") {
                calcExpression += " " + val + " ";
            } else if (action === "equals") {
                try { calcExpression = String(eval(calcExpression)); } catch (e) { calcExpression = "Error"; }
            }
            if (calcDisplay) calcDisplay.textContent = calcExpression;
        });
    });

    // Navigasi Bawah & FAB
    const navHomeBtn = document.getElementById('navHomeBtn');
    const navTrxBtn = document.getElementById('navTrxBtn');
    const navCalcBtn = document.getElementById('navCalcBtn');
    const navSettingsBtn = document.getElementById('navSettingsBtn');
    const fabAddBtn = document.getElementById('fabAddBtn');

    const setActiveNavTab = (activeBtn) => {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
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
        fabAddBtn.addEventListener('click', () => openTrxFormModal(null));
    }

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
            const parsedBal = Number(balanceInput.replace(/\D/g, '')) || 0;
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
            if (pendingConfirmCallback) pendingConfirmCallback();
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

// Action Sheet Dropdowns
function setupActionSheetDropdowns() {
    const actionSheetModal = document.getElementById('iosActionSheetModal');
    const actionSheetContainer = document.getElementById('actionSheetOptionsContainer');
    const closeActionSheetBtn = document.getElementById('closeActionSheetBtn');

    if (closeActionSheetBtn && actionSheetModal) {
        closeActionSheetBtn.addEventListener('click', () => actionSheetModal.classList.remove('show'));
        actionSheetModal.addEventListener('click', (e) => {
            if (e.target === actionSheetModal) actionSheetModal.classList.remove('show');
        });
    }

    const selectTrxTypeBtn = document.getElementById('selectTrxTypeBtn');
    if (selectTrxTypeBtn) {
        selectTrxTypeBtn.addEventListener('click', () => {
            actionSheetContainer.innerHTML = '';
            const types = [
                { value: 'expense', label: 'Pengeluaran' },
                { value: 'income', label: 'Pemasukan' }
            ];
            types.forEach(t => {
                const item = document.createElement('button');
                item.className = 'ios-action-sheet-item';
                item.textContent = t.label;
                item.addEventListener('click', () => {
                    document.getElementById('trxTypeInput').value = t.value;
                    document.getElementById('selectedTrxTypeText').textContent = t.label;
                    populateTrxCategories(t.value);
                    actionSheetModal.classList.remove('show');
                });
                actionSheetContainer.appendChild(item);
            });
            actionSheetModal.classList.add('show');
        });
    }

    const selectTrxWalletBtn = document.getElementById('selectTrxWalletBtn');
    if (selectTrxWalletBtn) {
        selectTrxWalletBtn.addEventListener('click', () => {
            actionSheetContainer.innerHTML = '';
            if (appState.wallets.length === 0) {
                actionSheetContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--ios-sublabel);">Belum ada dompet</div>`;
            } else {
                appState.wallets.forEach(w => {
                    const item = document.createElement('button');
                    item.className = 'ios-action-sheet-item';
                    item.textContent = `${w.name} (Rp ${w.balance.toLocaleString('id-ID')})`;
                    item.addEventListener('click', () => {
                        document.getElementById('trxWalletInput').value = w.id;
                        document.getElementById('selectedTrxWalletText').textContent = w.name;
                        actionSheetModal.classList.remove('show');
                    });
                    actionSheetContainer.appendChild(item);
                });
            }
            actionSheetModal.classList.add('show');
        });
    }

    const selectTrxCategoryBtn = document.getElementById('selectTrxCategoryBtn');
    if (selectTrxCategoryBtn) {
        selectTrxCategoryBtn.addEventListener('click', () => {
            const currentType = document.getElementById('trxTypeInput').value;
            actionSheetContainer.innerHTML = '';
            let filtered = appState.categories.filter(c => c.type === currentType);
            if (filtered.length === 0) filtered = appState.categories;

            filtered.forEach(c => {
                const item = document.createElement('button');
                item.className = 'ios-action-sheet-item';
                item.textContent = c.name;
                item.addEventListener('click', () => {
                    document.getElementById('trxCategoryInput').value = c.id;
                    document.getElementById('selectedTrxCategoryText').textContent = c.name;
                    actionSheetModal.classList.remove('show');
                });
                actionSheetContainer.appendChild(item);
            });
            actionSheetModal.classList.add('show');
        });
    }
}

function closeAddWalletModal() {
    const addWalletModal = document.getElementById('addWalletModal');
    if (addWalletModal) addWalletModal.classList.remove('show');
}

function renderSearchResults(keyword) {
    const container = document.getElementById('searchResultContainer');
    if (!container) return;

    if (!appState.transactions || appState.transactions.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Belum ada riwayat transaksi.</p>`;
        return;
    }

    const filtered = appState.transactions.filter(t => 
        t.note.toLowerCase().includes(keyword.toLowerCase()) || 
        t.categoryName.toLowerCase().includes(keyword.toLowerCase()) ||
        t.walletName.toLowerCase().includes(keyword.toLowerCase())
    );

    if (keyword === "") {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Ketik kata kunci untuk mencari...</p>`;
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 15px 0;">Tidak ada transaksi yang cocok.</p>`;
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

function openTrxFormModal(trxId = null) {
    activeEditTrxId = trxId;
    const titleEl = document.getElementById('formTrxTitle');
    const typeInput = document.getElementById('trxTypeInput');
    const typeText = document.getElementById('selectedTrxTypeText');
    const walletInput = document.getElementById('trxWalletInput');
    const walletText = document.getElementById('selectedTrxWalletText');
    const catInput = document.getElementById('trxCategoryInput');
    const catText = document.getElementById('selectedTrxCategoryText');
    const amountInput = document.getElementById('trxAmountInput');
    const noteInput = document.getElementById('trxNoteInput');

    if (appState.wallets.length === 0) {
        showIosNotice("Peringatan", "Buat dompet terlebih dahulu sebelum mencatat transaksi!");
        return;
    }

    if (trxId === null) {
        titleEl.textContent = "Tambah Transaksi";
        typeInput.value = "expense";
        typeText.textContent = "Pengeluaran";
        
        const defaultWallet = appState.wallets[0];
        walletInput.value = defaultWallet.id;
        walletText.textContent = defaultWallet.name;

        populateTrxCategories("expense");
        const defaultCat = appState.categories.find(c => c.type === "expense");
        if (defaultCat) {
            catInput.value = defaultCat.id;
            catText.textContent = defaultCat.name;
        }

        if (amountInput) amountInput.value = "";
        if (noteInput) noteInput.value = "";
    } else {
        titleEl.textContent = "Edit Transaksi";
        const trx = appState.transactions.find(t => t.id === trxId);
        if (trx) {
            typeInput.value = trx.type;
            typeText.textContent = trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

            const w = appState.wallets.find(item => item.id === trx.walletId) || appState.wallets[0];
            walletInput.value = w.id;
            walletText.textContent = w.name;

            populateTrxCategories(trx.type);
            const c = appState.categories.find(item => item.name === trx.categoryName) || appState.categories[0];
            catInput.value = c.id;
            catText.textContent = c.name;

            amountInput.value = trx.amount.toLocaleString('id-ID');
            noteInput.value = trx.note;
        }
    }

    const modal = document.getElementById('formTransactionModal');
    if (modal) modal.classList.add('show');
}

function closeTrxFormModal() {
    const modal = document.getElementById('formTransactionModal');
    if (modal) modal.classList.remove('show');
    activeEditTrxId = null;
}

function populateTrxCategories(type) {
    const catInput = document.getElementById('trxCategoryInput');
    const catText = document.getElementById('selectedTrxCategoryText');
    if (!catInput) return;

    let filtered = appState.categories.filter(c => c.type === type);
    if (filtered.length === 0) filtered = appState.categories;

    catInput.value = filtered[0].id;
    catText.textContent = filtered[0].name;
}

// Render Semua Transaksi Berdasarkan Bulan Aktif dengan Gestur Swipe
function renderFullTransactions() {
    const container = document.getElementById('fullTransactionListContainer');
    if (!container) return;

    const currentFilteredTrx = getFilteredTransactions();

    if (!currentFilteredTrx || currentFilteredTrx.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--ios-sublabel); font-size: 13px; padding: 20px 0;">Belum ada transaksi di bulan ini.</div>`;
        return;
    }

    container.innerHTML = '';
    currentFilteredTrx.forEach(trx => {
        const isIncome = trx.type === 'income';
        const amountColor = isIncome ? 'var(--ios-green)' : 'var(--ios-red)';
        const sign = isIncome ? '+' : '-';

        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${trx.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${trx.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${trx.id}" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 class="trx-item-title" style="font-size: 14px; font-weight: 500;">${trx.note}</h4>
                    <p class="trx-item-subtitle" style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">${trx.walletName} • ${trx.categoryName}</p>
                    <p style="font-size: 10px; color: var(--ios-sublabel); margin-top: 1px;">🕒 ${trx.date}</p>
                </div>
                <div class="trx-item-amount" style="font-size: 14px; font-weight: 600; color: ${amountColor};">${sign}Rp ${trx.amount.toLocaleString('id-ID')}</div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));

        card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            let diff = endX - startX;

            container.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));

            if (diff > 120) {
                document.getElementById('transactionModal').classList.remove('show');
                openTrxFormModal(id);
            } else if (diff < -120) {
                triggerDeleteTransaction(id);
            } else if (diff > 40) {
                card.classList.add('swiped-right');
            } else if (diff < -40) {
                card.classList.add('swiped-left');
            }
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.getAttribute('data-id'));
            document.getElementById('transactionModal').classList.remove('show');
            openTrxFormModal(id);
        });
    });

    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerDeleteTransaction(Number(e.currentTarget.getAttribute('data-id')));
        });
    });
}

function triggerDeleteTransaction(id) {
    showIosAlert(
        "Hapus Transaksi",
        "Yakin ingin menghapus transaksi ini? Saldo dompet akan disesuaikan kembali.",
        "Hapus",
        () => {
            const trx = appState.transactions.find(t => t.id === id);
            if (trx) {
                const wallet = appState.wallets.find(w => w.id === trx.walletId);
                if (wallet) {
                    if (trx.type === 'expense') wallet.balance += trx.amount;
                    else if (trx.type === 'income') wallet.balance -= trx.amount;
                }

                appState.transactions = appState.transactions.filter(t => t.id !== id);
                saveData();
                renderFullTransactions();
                updateUI();
            }
        }
    );
}

function showIosAlert(title, message, okText, onOkCallback) {
    document.getElementById('iosConfirmTitle').textContent = title;
    document.getElementById('iosConfirmMessage').textContent = message;
    const okBtn = document.getElementById('iosConfirmOkBtn');
    okBtn.textContent = okText;
    okBtn.style.display = 'inline-block';
    pendingConfirmCallback = onOkCallback;
    const cancelBtnAlert = document.getElementById('iosConfirmCancelBtn');
    if (cancelBtnAlert) cancelBtnAlert.style.display = 'inline-block';
    document.getElementById('iosConfirmModal').classList.add('show');
}

function showIosNotice(title, message) {
    document.getElementById('iosConfirmTitle').textContent = title;
    document.getElementById('iosConfirmMessage').textContent = message;
    const okBtn = document.getElementById('iosConfirmOkBtn');
    okBtn.textContent = "OK";
    okBtn.style.display = 'inline-block';
    okBtn.style.background = 'var(--ios-blue)';
    const cancelBtnNotice = document.getElementById('iosConfirmCancelBtn');
    if (cancelBtnNotice) cancelBtnNotice.style.display = 'none';
    document.getElementById('iosConfirmModal').classList.add('show');
}

// Analisis Berdasarkan Bulan Aktif
function updateAnalyticsData() {
    const incomeEl = document.getElementById('analyticIncome');
    const expenseEl = document.getElementById('analyticExpense');
    const netEl = document.getElementById('analyticNet');
    const statusTextEl = document.getElementById('analyticStatusText');

    const filteredTrx = getFilteredTransactions();
    let monthIncome = 0;
    let monthExpense = 0;

    filteredTrx.forEach(t => {
        if (t.type === 'income') monthIncome += t.amount;
        else if (t.type === 'expense') monthExpense += t.amount;
    });

    if (incomeEl) incomeEl.textContent = "+Rp " + monthIncome.toLocaleString('id-ID');
    if (expenseEl) expenseEl.textContent = "-Rp " + monthExpense.toLocaleString('id-ID');
    
    const net = monthIncome - monthExpense;
    if (netEl) {
        netEl.textContent = (net >= 0 ? "+Rp " : "-Rp ") + Math.abs(net).toLocaleString('id-ID');
        netEl.style.color = net >= 0 ? "var(--ios-green)" : "var(--ios-red)";
    }

    if (statusTextEl) {
        if (monthIncome === 0 && monthExpense === 0) {
            statusTextEl.textContent = `Belum ada transaksi tercatat di ${monthNames[appState.selectedMonth]} ${appState.selectedYear}.`;
        } else if (net > 0) {
            statusTextEl.textContent = `Kondisi keuanganmu sehat di bulan ini! Arus kas surplus.`;
        } else if (net < 0) {
            statusTextEl.textContent = `Perhatian! Arus kas bulan ini defisit (pengeluaran lebih besar dari pemasukan).`;
        } else {
            statusTextEl.textContent = `Arus kas stabil.`;
        }
    }
}

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
        if (cat) { nameInput.value = cat.name; typeInput.value = cat.type; }
    }
    document.getElementById('formCategoryModal').classList.add('show');
}

function closeCategoryFormModal() {
    document.getElementById('formCategoryModal').classList.remove('show');
    activeEditCategoryId = null;
}

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
        if (debt) { typeInput.value = debt.type; personInput.value = debt.person; amountInput.value = debt.amount.toLocaleString('id-ID'); }
    }
    document.getElementById('formDebtModal').classList.add('show');
}

function closeDebtFormModal() {
    document.getElementById('formDebtModal').classList.remove('show');
    activeEditDebtId = null;
}

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

function getWalletIcon(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cash') || lowerName.includes('tunai') || lowerName.includes('saku')) return '💵';
    if (lowerName.includes('bca') || lowerName.includes('bni') || lowerName.includes('bri') || lowerName.includes('mandiri') || lowerName.includes('bank') || lowerName.includes('rekening')) return '💳';
    if (lowerName.includes('dana') || lowerName.includes('gopay') || lowerName.includes('ovo') || lowerName.includes('qris') || lowerName.includes('shopeepay') || lowerName.includes('wallet')) return '📱';
    return '👛';
}

function getCategoryIcon(name) {
    const lower = name.toLowerCase();
    if (lower.includes('makan') || lower.includes('minum')) return '🍔';
    if (lower.includes('transport') || lower.includes('bensin')) return '🚗';
    if (lower.includes('gaji')) return '💰';
    if (lower.includes('freelance')) return '💻';
    if (lower.includes('belanja')) return '🛍️';
    if (lower.includes('tagihan')) return '⚡';
    if (lower.includes('sehat')) return '💊';
    if (lower.includes('cicilan') || lower.includes('utang')) return '🧾';
    return '🏷️';
}

function renderWalletList() {
    const container = document.getElementById('walletListContainer');
    if (!container) return;

    container.innerHTML = '';
    appState.wallets.forEach(wallet => {
        const icon = getWalletIcon(wallet.name);
        const wrapper = document.createElement('div');
        wrapper.className = 'wallet-swipe-wrapper';
        wrapper.innerHTML = `
            <div class="wallet-swipe-action-left" data-id="${wallet.id}">✏️</div>
            <div class="wallet-swipe-action-right" data-id="${wallet.id}">🗑️</div>
            <div class="wallet-item-card" data-id="${wallet.id}" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="wallet-left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info"><h4>${wallet.name}</h4></div>
                </div>
                <div class="wallet-balance" style="color: var(--ios-green);">Rp ${wallet.balance.toLocaleString('id-ID')}</div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));
        card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', (e) => {
            let diff = e.changedTouches[0].clientX - startX;
            container.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));
            if (diff > 120) openEditModal(id);
            else if (diff < -120) triggerDeleteWallet(id);
            else if (diff > 40) card.classList.add('swiped-right');
            else if (diff < -40) card.classList.add('swiped-left');
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => triggerDeleteWallet(Number(e.currentTarget.getAttribute('data-id'))));
    });
}

function renderCategoryList() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;

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
            <div class="wallet-item-card" data-id="${cat.id}" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="wallet-left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info"><h4>${cat.name}</h4></div>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: ${badgeColor};">${typeBadge}</div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));
        card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', (e) => {
            let diff = e.changedTouches[0].clientX - startX;
            container.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));
            if (diff > 120) openCategoryFormModal(id);
            else if (diff < -120) triggerDeleteCategory(id);
            else if (diff > 40) card.classList.add('swiped-right');
            else if (diff < -40) card.classList.add('swiped-left');
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => openCategoryFormModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => triggerDeleteCategory(Number(e.currentTarget.getAttribute('data-id'))));
    });
}

function renderDebtList() {
    const container = document.getElementById('debtListContainer');
    if (!container) return;

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
            <div class="wallet-item-card" data-id="${debt.id}" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="wallet-left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="wallet-icon-box">${icon}</div>
                    <div class="wallet-info">
                        <h4>${debt.person}</h4>
                        <p style="font-size: 11px; color: ${badgeColor}; font-weight: 600; margin-top: 2px;">${typeBadge}</p>
                    </div>
                </div>
                <div class="wallet-balance" style="color: ${badgeColor};">Rp ${debt.amount.toLocaleString('id-ID')}</div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));
        card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', (e) => {
            let diff = e.changedTouches[0].clientX - startX;
            container.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));
            if (diff > 120) openDebtFormModal(id);
            else if (diff < -120) triggerDeleteDebt(id);
            else if (diff > 40) card.classList.add('swiped-right');
            else if (diff < -40) card.classList.add('swiped-left');
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => openDebtFormModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => triggerDeleteDebt(Number(e.currentTarget.getAttribute('data-id'))));
    });
}

function renderTargetList() {
    const container = document.getElementById('targetListContainer');
    if (!container) return;

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
                            <h4 style="font-size: 14px; font-weight: 600; color: #ffffff;">${target.name}</h4>
                            <p style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">Terkumpul: Rp ${target.currentAmount.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--ios-blue);">Rp ${target.targetAmount.toLocaleString('id-ID')}</div>
                        <div style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">${percent}%</div>
                    </div>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden; margin-top: 4px;">
                    <div style="width: ${percent}%; height: 100%; background: var(--ios-blue); border-radius: 3px;"></div>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
    });

    container.querySelectorAll('.wallet-item-card').forEach(card => {
        let startX = 0;
        const id = Number(card.getAttribute('data-id'));
        card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        card.addEventListener('touchend', (e) => {
            let diff = e.changedTouches[0].clientX - startX;
            container.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));
            if (diff > 120) openTargetFormModal(id);
            else if (diff < -120) triggerDeleteTarget(id);
            else if (diff > 40) card.classList.add('swiped-right');
            else if (diff < -40) card.classList.add('swiped-left');
        });
    });

    container.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
        btn.addEventListener('click', (e) => openTargetFormModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    container.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
        btn.addEventListener('click', (e) => triggerDeleteTarget(Number(e.currentTarget.getAttribute('data-id'))));
    });
}

function triggerDeleteTarget(id) {
    showIosAlert("Hapus Target", "Yakin ingin menghapus target ini?", "Hapus", () => {
        appState.targets = appState.targets.filter(t => t.id !== id);
        saveData();
        renderTargetList();
    });
}

function triggerDeleteDebt(id) {
    showIosAlert("Hapus Catatan", "Yakin ingin menghapus catatan utang ini?", "Hapus", () => {
        appState.debts = appState.debts.filter(d => d.id !== id);
        saveData();
        renderDebtList();
    });
}

function triggerDeleteCategory(id) {
    if (appState.categories.length <= 1) {
        showIosNotice("Peringatan", "Minimal harus ada 1 kategori aktif!");
        return;
    }
    showIosAlert("Hapus Kategori", "Yakin ingin menghapus kategori ini?", "Hapus", () => {
        appState.categories = appState.categories.filter(c => c.id !== id);
        saveData();
        renderCategoryList();
    });
}

function triggerDeleteWallet(id) {
    if (appState.wallets.length <= 1) {
        showIosNotice("Peringatan", "Minimal harus ada 1 dompet aktif!");
        return;
    }
    showIosAlert("Hapus Dompet", "Yakin ingin menghapus dompet ini?", "Hapus", () => {
        appState.wallets = appState.wallets.filter(w => w.id !== id);
        saveData();
        renderWalletList();
        updateUI();
    });
}

function toggleBalanceVisibility() {
    appState.isBalanceHidden = !appState.isBalanceHidden;
    const toggleBtn = document.getElementById('toggleBalance');
    if (appState.isBalanceHidden) {
        toggleBtn.innerHTML = `<svg class="ios-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
        toggleBtn.innerHTML = `<svg class="ios-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
    updateUI();
}

// Update UI Utama & Halaman Home Sesuai Bulan Aktif
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

    const filteredTrx = getFilteredTransactions();
    let monthIncome = 0;
    let monthExpense = 0;

    filteredTrx.forEach(t => {
        if (t.type === 'income') monthIncome += t.amount;
        else if (t.type === 'expense') monthExpense += t.amount;
    });

    if (balanceElement) balanceElement.textContent = appState.isBalanceHidden ? "Rp •••••••" : "Rp " + appState.balance.toLocaleString('id-ID');
    if (incomeElement) incomeElement.textContent = appState.isBalanceHidden ? "+Rp •••••••" : "+Rp " + monthIncome.toLocaleString('id-ID');
    if (expenseElement) expenseElement.textContent = appState.isBalanceHidden ? "-Rp •••••••" : "-Rp " + monthExpense.toLocaleString('id-ID');

    if (transactionListContainer) {
        if (filteredTrx.length === 0) {
            transactionListContainer.innerHTML = `<div class="empty-state" style="text-align: center; padding: 25px 0; color: #8e8e93; font-size: 13px;">Belum ada transaksi di bulan ini</div>`;
        } else {
            transactionListContainer.innerHTML = '';
            const recentTrx = filteredTrx.slice(0, 3);
            
            recentTrx.forEach(trx => {
                const isIncome = trx.type === 'income';
                const amountColor = isIncome ? 'var(--ios-green)' : 'var(--ios-red)';
                const sign = isIncome ? '+' : '-';

                const wrapper = document.createElement('div');
                wrapper.className = 'wallet-swipe-wrapper';
                wrapper.innerHTML = `
                    <div class="wallet-swipe-action-left" data-id="${trx.id}">✏️</div>
                    <div class="wallet-swipe-action-right" data-id="${trx.id}">🗑️</div>
                    <div class="wallet-item-card" data-id="${trx.id}" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 class="trx-item-title" style="font-size: 14px; font-weight: 500;">${trx.note}</h4>
                            <p class="trx-item-subtitle" style="font-size: 11px; color: var(--ios-sublabel); margin-top: 2px;">${trx.walletName} • ${trx.categoryName}</p>
                            <p style="font-size: 10px; color: var(--ios-sublabel); margin-top: 1px;">🕒 ${trx.date}</p>
                        </div>
                        <div class="trx-item-amount" style="font-size: 14px; font-weight: 600; color: ${amountColor};">${sign}Rp ${trx.amount.toLocaleString('id-ID')}</div>
                    </div>
                `;
                transactionListContainer.appendChild(wrapper);
            });

            transactionListContainer.querySelectorAll('.wallet-item-card').forEach(card => {
                let startX = 0;
                const id = Number(card.getAttribute('data-id'));

                card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
                card.addEventListener('touchend', (e) => {
                    let endX = e.changedTouches[0].clientX;
                    let diff = endX - startX;

                    transactionListContainer.querySelectorAll('.wallet-item-card').forEach(c => c.classList.remove('swiped-right', 'swiped-left'));

                    if (diff > 120) {
                        openTrxFormModal(id);
                    } else if (diff < -120) {
                        triggerDeleteTransaction(id);
                    } else if (diff > 40) {
                        card.classList.add('swiped-right');
                    } else if (diff < -40) {
                        card.classList.add('swiped-left');
                    }
                });
            });

            transactionListContainer.querySelectorAll('.wallet-swipe-action-left').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    openTrxFormModal(Number(e.currentTarget.getAttribute('data-id')));
                });
            });

            transactionListContainer.querySelectorAll('.wallet-swipe-action-right').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    triggerDeleteTransaction(Number(e.currentTarget.getAttribute('data-id')));
                });
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
        if (!appState.wallets) appState.wallets = [{ id: 1, name: "Dompet Tunai", balance: 0 }, { id: 2, name: "Rekening BCA", balance: 200000 }];
        if (!appState.categories) appState.categories = [{ id: 1, name: "Makanan & Minuman", type: "expense" }, { id: 7, name: "Gaji Utama", type: "income" }];
        if (!appState.debts) appState.debts = [];
        if (!appState.targets) appState.targets = [];
    }
}