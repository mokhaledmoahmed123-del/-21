
/* =========================================
   0. إعداد الاتصال بقاعدة بيانات Supabase
========================================= */

const SUPABASE_URL = "https://bhwimefnblywxfncmuua.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_wSxdwfqwS7I2PfGcL52s8g_3oizVHAa";

let supabaseClient = null;

let currentUser = null;

let cloudSyncChannel = null;

let isCloudReady = false;


/* =========================================
   تحميل مكتبة Supabase
========================================= */

function loadSupabaseLibrary() {

    return new Promise(function (resolve, reject) {

        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

        script.onload = resolve;

        script.onerror = function () {
            reject(
                new Error("تعذر تحميل مكتبة الاتصال بقاعدة البيانات.")
            );
        };

        document.head.appendChild(script);
    });
}


/* =========================================
   تهيئة الاتصال
========================================= */

async function initializeSupabase() {

    await loadSupabaseLibrary();

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    currentUser = data.session?.user || null;

    return currentUser;
}

/* =========================================
   1. إعدادات النظام والتخزين
========================================= */

const STORAGE_KEY = "makhzani_products_v1";

let products = loadProducts();

let productToDelete = null;


/* =========================================
   2. الوصول إلى عناصر الصفحة
========================================= */

const elements = {

    todayDate: document.getElementById("todayDate"),

    totalProducts: document.getElementById("totalProducts"),

    totalQuantity: document.getElementById("totalQuantity"),

    totalCost: document.getElementById("totalCost"),

    totalSales: document.getElementById("totalSales"),

    totalProfit: document.getElementById("totalProfit"),

    inventoryValue: document.getElementById("inventoryValue"),

    lowStockCount: document.getElementById("lowStockCount"),

    reportProducts: document.getElementById("reportProducts"),

    reportQuantity: document.getElementById("reportQuantity"),

    reportCost: document.getElementById("reportCost"),

    reportSales: document.getElementById("reportSales"),

    reportProfit: document.getElementById("reportProfit"),

    reportLowStock: document.getElementById("reportLowStock"),

    productsTableBody: document.getElementById("productsTableBody"),

    tableProductCount: document.getElementById("tableProductCount"),

    emptyState: document.getElementById("emptyState"),

    searchInput: document.getElementById("searchInput"),

    categoryFilter: document.getElementById("categoryFilter"),

    unitFilter: document.getElementById("unitFilter"),

    resetFiltersBtn: document.getElementById("resetFiltersBtn"),

    productModal: document.getElementById("productModal"),

    deleteModal: document.getElementById("deleteModal"),

    productForm: document.getElementById("productForm"),

    productId: document.getElementById("productId"),

    productName: document.getElementById("productName"),

    productCategory: document.getElementById("productCategory"),

    productUnit: document.getElementById("productUnit"),

    stockUnit: document.getElementById("stockUnit"),

    unitsPerPackage: document.getElementById("unitsPerPackage"),

    stockQuantity: document.getElementById("stockQuantity"),

    purchasePrice: document.getElementById("purchasePrice"),

    sellingPrice: document.getElementById("sellingPrice"),

    minimumStock: document.getElementById("minimumStock"),

    unitsPerPackageGroup: document.getElementById("unitsPerPackageGroup"),

    stockQuantityLabel: document.getElementById("stockQuantityLabel"),

    purchasePriceLabel: document.getElementById("purchasePriceLabel"),

    sellingPriceLabel: document.getElementById("sellingPriceLabel"),

    previewUnits: document.getElementById("previewUnits"),

    previewCost: document.getElementById("previewCost"),

    previewSales: document.getElementById("previewSales"),

    previewProfit: document.getElementById("previewProfit"),

    modalTitle: document.getElementById("modalTitle"),

    saveProductBtn: document.getElementById("saveProductBtn"),

    deleteMessage: document.getElementById("deleteMessage"),

    toastContainer: document.getElementById("toastContainer"),

    restoreInput: document.getElementById("restoreInput"),

    sidebar: document.getElementById("sidebar"),

    menuToggle: document.getElementById("menuToggle")

};


/* =========================================
   3. أدوات مساعدة
========================================= */

// تحويل القيمة إلى رقم آمن.
function toNumber(value) {

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;

}


// تنسيق الأرقام مع مراعاة الكسور.
function formatNumber(value) {

    return new Intl.NumberFormat("ar-EG", {

        maximumFractionDigits: 3

    }).format(toNumber(value));

}


// تنسيق الأموال بالجنيه المصري.
function formatMoney(value) {

    return new Intl.NumberFormat("ar-EG", {

        style: "currency",

        currency: "EGP",

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

    }).format(toNumber(value));

}


// إنشاء معرف فريد للمنتج.
function createId() {

    if (window.crypto && typeof window.crypto.randomUUID === "function") {

        return window.crypto.randomUUID();

    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2);

}


// حماية النصوص عند عرضها داخل HTML.
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (character) {

        const entities = {

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            '"': "&quot;",

            "'": "&#39;"

        };

        return entities[character];

    });

}


// تاريخ اليوم.
function updateDate() {

    elements.todayDate.textContent = new Intl.DateTimeFormat("ar-EG", {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    }).format(new Date());

}


/* =========================================
   4. تحميل البيانات وحفظها
========================================= */

// قراءة البيانات المحفوظة على الجهاز.
function loadProducts() {

    try {

        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {

            return [];

        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {

            return [];

        }

        return parsedData.filter(function (product) {

            return product && typeof product === "object";

        });

    } catch (error) {

        console.error("تعذر تحميل بيانات المخزون:", error);

        return [];

    }

}


// حفظ البيانات محليًا.
function saveProducts() {

    try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

        return true;

    } catch (error) {

        console.error("تعذر حفظ بيانات المخزون:", error);

        showToast(

            "تعذر حفظ البيانات. قد تكون مساحة التخزين ممتلئة.",

            "error"

        );

        return false;

    }

}


/* =========================================
   5. حسابات المنتج
========================================= */

// تحديد عدد وحدات البيع الموجودة في وحدة التخزين.
function getUnitsPerPackage(product) {

    return Math.max(1, toNumber(product.unitsPerPackage) || 1);

}


// إجمالي وحدات البيع الأساسية في المخزون.
function calculateUnits(product) {

    return toNumber(product.stockQuantity) *

        getUnitsPerPackage(product);

}


// إجمالي تكلفة المخزون.
function calculateCost(product) {

    return toNumber(product.stockQuantity) *

        toNumber(product.purchasePrice);

}


// إجمالي قيمة البيع المتوقعة.
function calculateSales(product) {

    return calculateUnits(product) *

        toNumber(product.sellingPrice);

}


// المكسب المتوقع من كامل المخزون.
function calculateProfit(product) {

    return calculateSales(product) -

        calculateCost(product);

}


// تكلفة وحدة البيع الأساسية.
function calculateUnitCost(product) {

    return toNumber(product.purchasePrice) /

        getUnitsPerPackage(product);

}


// المكسب المتوقع من وحدة التخزين الواحدة.
function calculatePackageProfit(product) {

    const packageSales = getUnitsPerPackage(product) *

        toNumber(product.sellingPrice);

    return packageSales - toNumber(product.purchasePrice);

}


// تحديد حالة المخزون.
function getStockStatus(product) {

    const quantity = toNumber(product.stockQuantity);

    const minimum = toNumber(product.minimumStock);

    if (quantity <= 0) {

        return {

            className: "empty",

            label: "نفد المخزون"

        };

    }

    if (quantity <= minimum) {

        return {

            className: "low",

            label: "مخزون منخفض"

        };

    }

    return {

        className: "normal",

        label: "متوفر"

    };

}


/* =========================================
   6. ملخص المخزون
========================================= */

// حساب الملخص المالي لجميع المنتجات.
function calculateSummary() {

    return products.reduce(function (summary, product) {

        summary.products += 1;

        summary.quantity += calculateUnits(product);

        summary.cost += calculateCost(product);

        summary.sales += calculateSales(product);

        summary.profit += calculateProfit(product);

        if (

            toNumber(product.stockQuantity) <=

            toNumber(product.minimumStock)

        ) {

            summary.lowStock += 1;

        }

        return summary;

    }, {

        products: 0,

        quantity: 0,

        cost: 0,

        sales: 0,

        profit: 0,

        lowStock: 0

    });

}


// تحديث بطاقات لوحة التحكم والتقرير.
function renderSummary() {

    const summary = calculateSummary();

    elements.totalProducts.textContent =

        formatNumber(summary.products);

    elements.totalQuantity.textContent =

        formatNumber(summary.quantity);

    elements.totalCost.textContent =

        formatMoney(summary.cost);

    elements.totalSales.textContent =

        formatMoney(summary.sales);

    elements.totalProfit.textContent =

        formatMoney(summary.profit);

    elements.inventoryValue.textContent =

        formatMoney(summary.cost);

    elements.lowStockCount.textContent =

        formatNumber(summary.lowStock);


    elements.reportProducts.textContent =

        formatNumber(summary.products);

    elements.reportQuantity.textContent =

        formatNumber(summary.quantity);

    elements.reportCost.textContent =

        formatMoney(summary.cost);

    elements.reportSales.textContent =

        formatMoney(summary.sales);

    elements.reportProfit.textContent =

        formatMoney(summary.profit);

    elements.reportLowStock.textContent =

        formatNumber(summary.lowStock);

}


/* =========================================
   7. تحديث خيارات الأقسام
========================================= */

function renderCategoryFilter() {

    const selectedCategory = elements.categoryFilter.value;

    const categories = [...new Set(

        products

            .map(function (product) {

                return String(product.category || "").trim();

            })

            .filter(Boolean)

    )].sort(function (a, b) {

        return a.localeCompare(b, "ar");

    });


    elements.categoryFilter.innerHTML =

        '<option value="">كل الأقسام</option>';


    categories.forEach(function (category) {

        const option = document.createElement("option");

        option.value = category;

        option.textContent = category;

        elements.categoryFilter.appendChild(option);

    });


    if (categories.includes(selectedCategory)) {

        elements.categoryFilter.value = selectedCategory;

    }

}


/* =========================================
   8. البحث وتصفية المنتجات
========================================= */

function getFilteredProducts() {

    const searchTerm = elements.searchInput.value

        .trim()

        .toLocaleLowerCase("ar");


    const selectedCategory = elements.categoryFilter.value;

    const selectedUnit = elements.unitFilter.value;


    return products.filter(function (product) {

        const name = String(product.name || "")

            .toLocaleLowerCase("ar");

        const category = String(product.category || "")

            .toLocaleLowerCase("ar");


        const matchesSearch =

            name.includes(searchTerm) ||

            category.includes(searchTerm);


        const matchesCategory =

            !selectedCategory ||

            product.category === selectedCategory;


        const matchesUnit =

            !selectedUnit ||

            product.unit === selectedUnit;


        return matchesSearch &&

            matchesCategory &&

            matchesUnit;

    });

}


/* =========================================
   9. عرض المنتجات داخل الجدول
========================================= */

function renderProducts() {

    const filteredProducts = getFilteredProducts();

    elements.productsTableBody.innerHTML = "";

    elements.tableProductCount.textContent =

        formatNumber(filteredProducts.length) + " منتج";


    elements.emptyState.classList.toggle(

        "show",

        filteredProducts.length === 0

    );


    filteredProducts.forEach(function (product) {

        const row = document.createElement("tr");

        const status = getStockStatus(product);

        const units = calculateUnits(product);

        const cost = calculateCost(product);

        const sales = calculateSales(product);

        const profit = calculateProfit(product);


        const profitClass = profit >= 0

            ? "profit-cell"

            : "loss-cell";


        row.innerHTML = `

            <td>

                <div class="product-cell">

                    <div class="product-avatar">

                        ${escapeHTML(

                            String(product.name || "?").trim().charAt(0)

                        )}

                    </div>

                    <div>

                        <div class="product-name">

                            ${escapeHTML(product.name)}

                        </div>

                        <div class="product-subtitle">

                            ${formatNumber(units)} ${escapeHTML(product.unit)}

                        </div>

                    </div>

                </div>

            </td>


            <td>

                ${escapeHTML(product.category)}

            </td>


            <td>

                <div class="table-number">

                    ${formatNumber(product.stockQuantity)}

                    ${escapeHTML(product.stockUnit)}

                </div>

                <div class="product-subtitle">

                    ${formatNumber(units)} ${escapeHTML(product.unit)}

                </div>

            </td>


            <td>

                <div class="table-number">

                    ${formatMoney(cost)}

                </div>

                <div class="product-subtitle">

                    ${formatMoney(product.purchasePrice)} / ${escapeHTML(product.stockUnit)}

                </div>

            </td>


            <td>

                <div class="table-number">

                    ${formatMoney(sales)}

                </div>

                <div class="product-subtitle">

                    ${formatMoney(product.sellingPrice)} / ${escapeHTML(product.unit)}

                </div>

            </td>


            <td>

                <span class="${profitClass}">

                    ${formatMoney(profit)}

                </span>

                <div class="product-subtitle">

                    ${formatMoney(calculatePackageProfit(product))} / ${escapeHTML(product.stockUnit)}

                </div>

            </td>


            <td>

                <span class="stock-badge ${status.className}">

                    ${escapeHTML(status.label)}

                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button

                        class="action-button"

                        data-action="edit"

                        data-id="${escapeHTML(product.id)}"

                        aria-label="تعديل المنتج"

                        title="تعديل المنتج"

                    >

                        ✎

                    </button>


                    <button

                        class="action-button delete"

                        data-action="delete"

                        data-id="${escapeHTML(product.id)}"

                        aria-label="حذف المنتج"

                        title="حذف المنتج"

                    >

                        ×

                    </button>

                </div>

            </td>

        `;


        elements.productsTableBody.appendChild(row);

    });

}


/* =========================================
   10. تحديث الواجهة كاملة
========================================= */

function renderAll() {

    renderSummary();

    renderCategoryFilter();

    renderProducts();

}


/* =========================================
   11. التحكم في وحدات التخزين والبيع
========================================= */

// عند اختيار نفس وحدة التخزين والبيع،
// يتم ضبط معامل التحويل إلى 1 تلقائيًا.
function updateUnitSettings() {

    const stockUnit = elements.stockUnit.value;

    const sellingUnit = elements.productUnit.value;

    const sameUnit = stockUnit === sellingUnit;


    elements.unitsPerPackageGroup.style.display =

        sameUnit ? "none" : "flex";


    if (sameUnit) {

        elements.unitsPerPackage.value = "1";

        elements.unitsPerPackage.readOnly = true;

    } else {

        elements.unitsPerPackage.readOnly = false;

        if (toNumber(elements.unitsPerPackage.value) < 1) {

            elements.unitsPerPackage.value = "1";

        }

    }


    elements.stockQuantityLabel.textContent =

        "كمية المخزون (" + stockUnit + ") *";


    elements.purchasePriceLabel.textContent =

        "سعر شراء " + stockUnit + " (جنيه) *";


    elements.sellingPriceLabel.textContent =

        "سعر بيع " + sellingUnit + " (جنيه) *";


    updatePreview();

}


/* =========================================
   12. معاينة الحسابات قبل الحفظ
========================================= */

function updatePreview() {

    const stockUnit = elements.stockUnit.value;

    const sellingUnit = elements.productUnit.value;


    let unitsPerPackage = toNumber(

        elements.unitsPerPackage.value

    );


    if (stockUnit === sellingUnit) {

        unitsPerPackage = 1;

    }


    const stockQuantity = toNumber(

        elements.stockQuantity.value

    );


    const purchasePrice = toNumber(

        elements.purchasePrice.value

    );


    const sellingPrice = toNumber(

        elements.sellingPrice.value

    );


    const totalUnits = stockQuantity * unitsPerPackage;

    const totalCost = stockQuantity * purchasePrice;

    const totalSales = totalUnits * sellingPrice;

    const totalProfit = totalSales - totalCost;


    elements.previewUnits.textContent =

        formatNumber(totalUnits) + " " + sellingUnit;


    elements.previewCost.textContent =

        formatMoney(totalCost);


    elements.previewSales.textContent =

        formatMoney(totalSales);


    elements.previewProfit.textContent =

        formatMoney(totalProfit);


    elements.previewProfit.style.color =

        totalProfit >= 0 ? "var(--green)" : "var(--red)";

}


/* =========================================
   13. فتح نافذة إضافة المنتج
========================================= */

function openAddModal() {

    elements.productForm.reset();

    elements.productId.value = "";

    elements.productUnit.value = "كيس";

    elements.stockUnit.value = "كرتونة";

    elements.unitsPerPackage.value = "12";

    elements.minimumStock.value = "5";

    elements.modalTitle.textContent = "إضافة منتج جديد";

    elements.saveProductBtn.textContent = "حفظ المنتج";


    updateUnitSettings();

    updatePreview();


    elements.productModal.classList.add("show");

    elements.productModal.setAttribute("aria-hidden", "false");


    document.body.style.overflow = "hidden";


    setTimeout(function () {

        elements.productName.focus();

    }, 100);

}


/* =========================================
   14. إغلاق نافذة المنتج
========================================= */

function closeProductModal() {

    elements.productModal.classList.remove("show");

    elements.productModal.setAttribute("aria-hidden", "true");


    document.body.style.overflow = "";

}


/* =========================================
   15. تعديل منتج موجود
========================================= */

function openEditModal(productId) {

    const product = products.find(function (item) {

        return item.id === productId;

    });


    if (!product) {

        showToast("المنتج غير موجود.", "error");

        return;

    }


    elements.productForm.reset();


    elements.productId.value = product.id;

    elements.productName.value = product.name;

    elements.productCategory.value = product.category;

    elements.productUnit.value = product.unit;

    elements.stockUnit.value = product.stockUnit;

    elements.unitsPerPackage.value = product.unitsPerPackage;

    elements.stockQuantity.value = product.stockQuantity;

    elements.purchasePrice.value = product.purchasePrice;

    elements.sellingPrice.value = product.sellingPrice;

    elements.minimumStock.value = product.minimumStock;


    elements.modalTitle.textContent = "تعديل بيانات المنتج";

    elements.saveProductBtn.textContent = "حفظ التعديلات";


    updateUnitSettings();

    updatePreview();


    elements.productModal.classList.add("show");

    elements.productModal.setAttribute("aria-hidden", "false");


    document.body.style.overflow = "hidden";

}


/* =========================================
   16. التحقق من بيانات المنتج
========================================= */

function validateProduct(data) {

    if (!data.name.trim()) {

        showToast("اكتب اسم المنتج أولًا.", "error");

        elements.productName.focus();

        return false;

    }


    if (!data.category.trim()) {

        showToast("اكتب القسم التابع له المنتج.", "error");

        elements.productCategory.focus();

        return false;

    }


    const numericFields = [

        {

            name: "كمية المخزون",

            value: data.stockQuantity

        },

        {

            name: "سعر الشراء",

            value: data.purchasePrice

        },

        {

            name: "سعر البيع",

            value: data.sellingPrice

        },

        {

            name: "الحد الأدنى",

            value: data.minimumStock

        },

        {

            name: "عدد الوحدات داخل العبوة",

            value: data.unitsPerPackage

        }

    ];


    for (const field of numericFields) {

        if (!Number.isFinite(field.value) || field.value < 0) {

            showToast(

                "تحقق من قيمة " + field.name + ".",

                "error"

            );

            return false;

        }

    }


    if (data.unitsPerPackage < 1) {

        showToast(

            "عدد الوحدات داخل وحدة التخزين يجب أن يكون 1 على الأقل.",

            "error"

        );

        return false;

    }


    if (

        data.stockUnit === data.unit &&

        data.unitsPerPackage !== 1

    ) {

        showToast(

            "عندما تتطابق وحدتا التخزين والبيع، يجب أن يكون معامل التحويل 1.",

            "error"

        );

        return false;

    }


    return true;

}


/* =========================================
   17. إضافة المنتج أو حفظ تعديلاته
========================================= */

function handleProductSubmit(event) {

    event.preventDefault();


    const stockUnit = elements.stockUnit.value;

    const sellingUnit = elements.productUnit.value;


    const unitsPerPackage = stockUnit === sellingUnit

        ? 1

        : toNumber(elements.unitsPerPackage.value);


    const productData = {

        id: elements.productId.value || createId(),

        name: elements.productName.value.trim(),

        category: elements.productCategory.value.trim(),

        unit: sellingUnit,

        stockUnit: stockUnit,

        unitsPerPackage: unitsPerPackage,

        stockQuantity: toNumber(elements.stockQuantity.value),

        purchasePrice: toNumber(elements.purchasePrice.value),

        sellingPrice: toNumber(elements.sellingPrice.value),

        minimumStock: toNumber(elements.minimumStock.value)

    };


    if (!validateProduct(productData)) {

        return;

    }


    const existingIndex = products.findIndex(function (product) {

        return product.id === productData.id;

    });


    if (existingIndex !== -1) {

        products[existingIndex] = productData;

    } else {

        products.push(productData);

    }


    if (!saveProducts()) {

        // إعادة تحميل آخر نسخة محفوظة إذا فشل الحفظ.
        products = loadProducts();

        renderAll();

        return;

    }


    closeProductModal();

    renderAll();


    showToast(

        existingIndex !== -1

            ? "تم تحديث بيانات المنتج بنجاح."

            : "تمت إضافة المنتج بنجاح.",

        "success"

    );

}


/* =========================================
   18. فتح نافذة تأكيد الحذف
========================================= */

function openDeleteModal(productId) {

    const product = products.find(function (item) {

        return item.id === productId;

    });


    if (!product) {

        showToast("المنتج غير موجود.", "error");

        return;

    }


    productToDelete = productId;


    elements.deleteMessage.textContent =

        'هل تريد حذف المنتج "' + product.name + '"؟';


    elements.deleteModal.classList.add("show");

    elements.deleteModal.setAttribute("aria-hidden", "false");


    document.body.style.overflow = "hidden";

}


/* =========================================
   19. إلغاء الحذف
========================================= */

function closeDeleteModal() {

    elements.deleteModal.classList.remove("show");

    elements.deleteModal.setAttribute("aria-hidden", "true");


    productToDelete = null;


    if (!elements.productModal.classList.contains("show")) {

        document.body.style.overflow = "";

    }

}


/* =========================================
   20. تنفيذ الحذف
========================================= */

function confirmDelete() {

    if (!productToDelete) {

        return;

    }


    const previousProducts = [...products];


    products = products.filter(function (product) {

        return product.id !== productToDelete;

    });


    if (!saveProducts()) {

        products = previousProducts;

        return;

    }


    closeDeleteModal();

    renderAll();


    showToast("تم حذف المنتج بنجاح.", "success");

}


/* =========================================
   21. رسائل التنبيه
========================================= */

function showToast(message, type = "success") {

    const toast = document.createElement("div");

    toast.className = "toast " + type;

    toast.textContent = message;


    elements.toastContainer.appendChild(toast);


    setTimeout(function () {

        toast.remove();

    }, 3500);

}


/* =========================================
   22. تصدير المنتجات إلى CSV
========================================= */

function exportCSV() {

    if (products.length === 0) {

        showToast("لا توجد منتجات لتصديرها.", "warning");

        return;

    }


    const headers = [

        "اسم المنتج",

        "القسم",

        "وحدة التخزين",

        "وحدة البيع",

        "عدد وحدات البيع داخل وحدة التخزين",

        "كمية المخزون",

        "إجمالي وحدات البيع",

        "سعر شراء وحدة التخزين",

        "تكلفة المخزون",

        "سعر بيع الوحدة الأساسية",

        "قيمة البيع المتوقعة",

        "المكسب المتوقع",

        "المكسب من وحدة التخزين",

        "الحد الأدنى للمخزون",

        "حالة المخزون"

    ];


    const rows = products.map(function (product) {

        return [

            product.name,

            product.category,

            product.stockUnit,

            product.unit,

            product.unitsPerPackage,

            product.stockQuantity,

            calculateUnits(product),

            product.purchasePrice,

            calculateCost(product),

            product.sellingPrice,

            calculateSales(product),

            calculateProfit(product),

            calculatePackageProfit(product),

            product.minimumStock,

            getStockStatus(product).label

        ];

    });


    function escapeCSV(value) {

        let text = String(value ?? "");


        // حماية البيانات النصية من تفسيرها كمعادلات في برامج الجداول.
        if (/^[\s]*[=+\-@]/.test(text)) {

            text = "'" + text;

        }


        return '"' + text.replace(/"/g, '""') + '"';

    }


    const csvContent =

        "\uFEFF" +

        [headers, ...rows]

            .map(function (row) {

                return row.map(escapeCSV).join(",");

            })

            .join("\r\n");


    downloadFile(

        csvContent,

        "makhzani-products.csv",

        "text/csv;charset=utf-8;"

    );


    showToast("تم تجهيز ملف CSV بنجاح.", "success");

}


/* =========================================
   23. النسخ الاحتياطي بصيغة JSON
========================================= */

function exportBackup() {

    const backupData = {

        application: "Makhzani",

        version: 1,

        exportedAt: new Date().toISOString(),

        products: products

    };


    const content = JSON.stringify(backupData, null, 2);


    downloadFile(

        content,

        "makhzani-backup.json",

        "application/json;charset=utf-8;"

    );


    showToast("تم تنزيل النسخة الاحتياطية.", "success");

}


/* =========================================
   24. تنزيل الملفات
========================================= */

function downloadFile(content, filename, mimeType) {

    const blob = new Blob(

        [content],

        { type: mimeType }

    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(function () {

        URL.revokeObjectURL(url);

    }, 1000);

}


/* =========================================
   25. التحقق من النسخة الاحتياطية
========================================= */

function validateBackupProducts(data) {

    if (!Array.isArray(data)) {

        throw new Error("ملف النسخة الاحتياطية غير صالح.");

    }


    if (data.length > 10000) {

        throw new Error("عدد المنتجات في الملف أكبر من الحد المسموح.");

    }


    const ids = new Set();


    return data.map(function (product) {

        if (!product || typeof product !== "object") {

            throw new Error("توجد بيانات منتج غير صالحة.");

        }


        const name = String(product.name || "").trim();

        const category = String(product.category || "").trim();

        const stockUnit = String(product.stockUnit || "").trim();

        const unit = String(product.unit || "").trim();


        if (!name || !category || !stockUnit || !unit) {

            throw new Error("توجد منتجات ينقصها الاسم أو القسم أو الوحدة.");

        }


        if (name.length > 100 || category.length > 60) {

            throw new Error("يوجد اسم منتج أو قسم أطول من الحد المسموح.");

        }


        const stockQuantity = Number(product.stockQuantity);

        const purchasePrice = Number(product.purchasePrice);

        const sellingPrice = Number(product.sellingPrice);

        const minimumStock = Number(product.minimumStock);

        const unitsPerPackage = Number(product.unitsPerPackage);


        const numbers = [

            stockQuantity,

            purchasePrice,

            sellingPrice,

            minimumStock,

            unitsPerPackage

        ];


        if (

            numbers.some(function (number) {

                return !Number.isFinite(number) || number < 0;

            })

        ) {

            throw new Error("توجد كميات أو أسعار غير صالحة.");

        }


        if (unitsPerPackage < 1) {

            throw new Error("معامل التحويل يجب أن يكون 1 على الأقل.");

        }


        if (stockUnit === unit && unitsPerPackage !== 1) {

            throw new Error("معامل التحويل غير متوافق مع وحدات المنتج.");

        }


        const id = String(product.id || createId());


        if (ids.has(id)) {

            throw new Error("يوجد أكثر من منتج بنفس المعرف.");

        }


        ids.add(id);


        return {

            id: id,

            name: name,

            category: category,

            stockUnit: stockUnit,

            unit: unit,

            unitsPerPackage: unitsPerPackage,

            stockQuantity: stockQuantity,

            purchasePrice: purchasePrice,

            sellingPrice: sellingPrice,

            minimumStock: minimumStock

        };

    });

}


/* =========================================
   26. استعادة النسخة الاحتياطية
========================================= */

async function restoreBackup(file) {

    if (!file) {

        return;

    }


    try {

        if (file.size > 10 * 1024 * 1024) {

            throw new Error("حجم الملف أكبر من 10 ميجابايت.");

        }


        const textContent = await file.text();

        const parsed = JSON.parse(textContent);


        const backupProducts = Array.isArray(parsed)

            ? parsed

            : parsed.products;


        const restoredProducts = validateBackupProducts(backupProducts);


        const confirmed = window.confirm(

            "استعادة النسخة الاحتياطية ستستبدل قائمة المنتجات الحالية بالكامل. هل تريد المتابعة؟"

        );


        if (!confirmed) {

            return;

        }


        const previousProducts = products;


        products = restoredProducts;


        if (!saveProducts()) {

            products = previousProducts;

            return;

        }


        renderAll();


        showToast("تمت استعادة البيانات بنجاح.", "success");


    } catch (error) {

        console.error("خطأ في استعادة البيانات:", error);


        showToast(

            error.message || "تعذر قراءة النسخة الاحتياطية.",

            "error"

        );

    } finally {

        elements.restoreInput.value = "";

    }

}


/* =========================================
   27. القائمة الجانبية للموبايل
========================================= */

function toggleSidebar() {

    elements.sidebar.classList.toggle("open");

}


function closeSidebar() {

    elements.sidebar.classList.remove("open");

}


/* =========================================
   28. ربط الأزرار بالأحداث
========================================= */

// أزرار إضافة المنتجات.
document.getElementById("addProductBtn")

    .addEventListener("click", openAddModal);


document.getElementById("bannerAddBtn")

    .addEventListener("click", openAddModal);


document.getElementById("emptyAddBtn")

    .addEventListener("click", openAddModal);


// أزرار إغلاق نافذة المنتج.
document.getElementById("closeModalBtn")

    .addEventListener("click", closeProductModal);


document.getElementById("cancelModalBtn")

    .addEventListener("click", closeProductModal);


// حفظ المنتج.
elements.productForm.addEventListener(

    "submit",

    handleProductSubmit

);


// تحديث المعاينة عند تغيير البيانات.
[

    elements.productUnit,

    elements.stockUnit,

    elements.unitsPerPackage,

    elements.stockQuantity,

    elements.purchasePrice,

    elements.sellingPrice

].forEach(function (element) {

    element.addEventListener("input", updatePreview);

    element.addEventListener("change", updatePreview);

});


// تحديث الوحدات عند تغييرها.
elements.productUnit.addEventListener(

    "change",

    updateUnitSettings

);


elements.stockUnit.addEventListener(

    "change",

    updateUnitSettings

);


// البحث.
elements.searchInput.addEventListener(

    "input",

    renderProducts

);


// تصفية القسم والوحدة.
elements.categoryFilter.addEventListener(

    "change",

    renderProducts

);


elements.unitFilter.addEventListener(

    "change",

    renderProducts

);


// إعادة ضبط البحث والفلاتر.
elements.resetFiltersBtn.addEventListener("click", function () {

    elements.searchInput.value = "";

    elements.categoryFilter.value = "";

    elements.unitFilter.value = "";


    renderProducts();

});


// تعديل وحذف المنتجات باستخدام تفويض الأحداث.
elements.productsTableBody.addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");


    if (!button) {

        return;

    }


    const action = button.dataset.action;

    const productId = button.dataset.id;


    if (action === "edit") {

        openEditModal(productId);

    }


    if (action === "delete") {

        openDeleteModal(productId);

    }

});


// تأكيد الحذف أو إلغاؤه.
document.getElementById("confirmDeleteBtn")

    .addEventListener("click", confirmDelete);


document.getElementById("cancelDeleteBtn")

    .addEventListener("click", closeDeleteModal);


// إغلاق النوافذ بالنقر على الخلفية.
elements.productModal.addEventListener("click", function (event) {

    if (event.target === elements.productModal) {

        closeProductModal();

    }

});


elements.deleteModal.addEventListener("click", function (event) {

    if (event.target === elements.deleteModal) {

        closeDeleteModal();

    }

});


// إغلاق النافذة بمفتاح Escape.
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeProductModal();

        closeDeleteModal();

        closeSidebar();

    }

});


// تصدير CSV.
document.getElementById("exportCsvBtn")

    .addEventListener("click", exportCSV);


document.getElementById("backupCsvBtn")

    .addEventListener("click", exportCSV);


// النسخ الاحتياطي.
document.getElementById("backupBtn")

    .addEventListener("click", exportBackup);


// الاستعادة.
document.getElementById("restoreBtn")

    .addEventListener("click", function () {

        elements.restoreInput.click();

    });


elements.restoreInput.addEventListener("change", function (event) {

    const file = event.target.files[0];

    restoreBackup(file);

});


// القائمة الجانبية.
elements.menuToggle.addEventListener("click", toggleSidebar);


// إغلاق القائمة بعد اختيار قسم على الموبايل.
document.querySelectorAll(".nav-link").forEach(function (link) {

    link.addEventListener("click", function () {

        closeSidebar();


        document.querySelectorAll(".nav-link").forEach(function (item) {

            item.classList.remove("active");

        });


        link.classList.add("active");

    });

});


/* =========================================
   29. تشغيل الموقع عند الفتح
========================================= */

function initializeApp() {

    updateDate();

    renderAll();

    updateUnitSettings();

    updatePreview();

}


initializeApp();
/* =========================================
   30. الاتصال السحابي بنظام مخزني
========================================= */

const CLOUD_CONFIG = {
    url: "https://bhwimefnblywxfncmuua.supabase.co",

    key: "sb_publishable_wSxdwfqwS7I2PfGcL52s8g_3oizVHAa"
};

let cloudClient = null;

let cloudUser = null;

let cloudReady = false;

let cloudSaveTimer = null;

let cloudSaving = false;

let cloudChannel = null;


/* =========================================
   31. تجهيز شاشة تسجيل الدخول
========================================= */

function createCloudLoginScreen() {

    if (document.getElementById("cloudLoginScreen")) {
        return;
    }

    const style = document.createElement("style");

    style.textContent = `
        #cloudLoginScreen {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
                radial-gradient(
                    circle at top right,
                    rgba(34, 197, 94, .15),
                    transparent 35%
                ),
                #0b0f0c;
            font-family: 'Cairo', sans-serif;
        }

        #cloudLoginScreen * {
            box-sizing: border-box;
        }

        .cloud-login-card {
            width: 100%;
            max-width: 430px;
            padding: 32px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 24px;
            background: rgba(20, 26, 22, .96);
            box-shadow: 0 25px 80px rgba(0,0,0,.4);
            color: #fff;
        }

        .cloud-login-logo {
            display: grid;
            place-items: center;
            width: 68px;
            height: 68px;
            margin: 0 auto 18px;
            border-radius: 20px;
            background: linear-gradient(135deg, #22c55e, #15803d);
            color: #fff;
            font-size: 32px;
            font-weight: 800;
        }

        .cloud-login-card h2 {
            margin: 0 0 8px;
            text-align: center;
            font-size: 25px;
        }

        .cloud-login-description {
            margin: 0 0 25px;
            color: #a9b5ad;
            text-align: center;
            font-size: 13px;
            line-height: 1.9;
        }

        .cloud-login-group {
            margin-bottom: 17px;
        }

        .cloud-login-group label {
            display: block;
            margin-bottom: 8px;
            color: #e4e9e5;
            font-size: 13px;
        }

        .cloud-login-group input {
            width: 100%;
            min-height: 48px;
            padding: 12px;
            border: 1px solid rgba(255,255,255,.13);
            border-radius: 12px;
            outline: none;
            background: #111713;
            color: #fff;
            font: inherit;
            font-size: 14px;
        }

        .cloud-login-group input:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 3px rgba(34,197,94,.12);
        }

        .cloud-login-button {
            width: 100%;
            min-height: 49px;
            margin-top: 8px;
            border: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, #22c55e, #15803d);
            color: #fff;
            font: inherit;
            font-weight: 800;
            cursor: pointer;
        }

        .cloud-login-button:disabled {
            opacity: .6;
            cursor: wait;
        }

        .cloud-login-error {
            display: none;
            margin-top: 15px;
            padding: 11px;
            border-radius: 10px;
            background: rgba(239,68,68,.12);
            color: #fca5a5;
            font-size: 12px;
            line-height: 1.8;
            overflow-wrap: anywhere;
        }

        .cloud-login-footer {
            margin-top: 18px;
            color: #89968d;
            text-align: center;
            font-size: 11px;
            line-height: 1.8;
        }

        #cloudAccountBar {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin: 0 0 16px;
            padding: 10px 14px;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 12px;
            background: rgba(34,197,94,.06);
            color: #d1fae5;
            font-size: 12px;
        }

        #cloudAccountBar .cloud-account-email {
            flex: 1;
            overflow-wrap: anywhere;
        }

        #cloudLogoutButton {
            padding: 7px 12px;
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 8px;
            background: transparent;
            color: #fff;
            font: inherit;
            cursor: pointer;
        }

        @media (max-width: 480px) {
            .cloud-login-card {
                padding: 24px 19px;
            }
        }
    `;

    document.head.appendChild(style);

    const screen = document.createElement("div");

    screen.id = "cloudLoginScreen";

    screen.innerHTML = `
        <div class="cloud-login-card">

            <div class="cloud-login-logo">M</div>

            <h2>مخزني</h2>

            <p class="cloud-login-description">
                سوبر ماركت أبو خالد<br>
                سجّل الدخول للوصول إلى مخزونك ومزامنة بياناتك بين أجهزتك.
            </p>

            <form id="cloudLoginForm">

                <div class="cloud-login-group">
                    <label for="cloudEmail">البريد الإلكتروني</label>

                    <input
                        type="email"
                        id="cloudEmail"
                        autocomplete="username"
                        placeholder="name@example.com"
                        required
                    >
                </div>

                <div class="cloud-login-group">
                    <label for="cloudPassword">كلمة المرور</label>

                    <input
                        type="password"
                        id="cloudPassword"
                        autocomplete="current-password"
                        minlength="6"
                        placeholder="أدخل كلمة المرور"
                        required
                    >
                </div>

                <button
                    type="submit"
                    class="cloud-login-button"
                    id="cloudLoginButton"
                >
                    تسجيل الدخول
                </button>

                <div
                    id="cloudLoginError"
                    class="cloud-login-error"
                    role="alert"
                ></div>

            </form>

            <div class="cloud-login-footer">
                بياناتك محفوظة في قاعدة بيانات سحابية
                ومخصصة لحسابك.
            </div>

        </div>
    `;

    document.body.appendChild(screen);

    document.getElementById("cloudLoginForm")
        .addEventListener("submit", handleCloudLogin);

}


/* =========================================
   32. رسائل تسجيل الدخول
========================================= */

function showCloudLoginError(message) {

    const errorBox = document.getElementById("cloudLoginError");

    if (!errorBox) {
        return;
    }

    errorBox.textContent = message;

    errorBox.style.display = "block";
}


function hideCloudLoginScreen() {

    const screen = document.getElementById("cloudLoginScreen");

    if (screen) {
        screen.remove();
    }

}


function showCloudLoginScreen() {

    createCloudLoginScreen();

    const screen = document.getElementById("cloudLoginScreen");

    if (screen) {
        screen.style.display = "flex";
    }

}
/* =========================================
   33. تسجيل الدخول بالحساب الموجود
========================================= */

async function handleCloudLogin(event) {

    event.preventDefault();

    // جلب بيانات تسجيل الدخول
    const emailInput = document.getElementById("cloudEmail");
    const passwordInput = document.getElementById("cloudPassword");
    const button = document.getElementById("cloudLoginButton");

    if (!emailInput || !passwordInput || !button) {
        console.error("تعذر العثور على حقول تسجيل الدخول.");

        showToast(
            "حدث خطأ في واجهة تسجيل الدخول.",
            "error"
        );

        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // التأكد من إدخال البيانات
    if (!email || !password) {

        showCloudLoginError("اكتب البريد الإلكتروني وكلمة المرور.");

        return;
    }

    // تعطيل الزر أثناء تسجيل الدخول
    button.disabled = true;
    button.textContent = "جارٍ تسجيل الدخول...";

    showCloudLoginError("");

    try {

        // تسجيل الدخول باستخدام Supabase
        const { data, error } = await cloudClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("لم يتم العثور على بيانات الحساب.");
        }

        // حفظ بيانات الحساب الحالي
        cloudUser = data.user;

        // تحميل منتجات الحساب من السحابة
        await loadCloudProducts();

        // إخفاء شاشة تسجيل الدخول
        hideCloudLoginScreen();

        // إظهار البريد الإلكتروني وزر تسجيل الخروج
        setupCloudAccountBar();

        // تشغيل المزامنة اللحظية
        setupCloudRealtime();

        // تحديث حالة الاتصال
        updateCloudStatus(
            "متصل — المزامنة السحابية مفعّلة"
        );

        // رسالة نجاح
        showToast(
            "تم تسجيل الدخول بنجاح.",
            "success"
        );

    } catch (error) {

        console.error("خطأ تسجيل الدخول:", error);

        // عرض رسالة الخطأ
        showCloudLoginError(
            getCloudErrorMessage(error)
        );

    } finally {

        // إعادة الزر إلى حالته الطبيعية
        const currentButton =
            document.getElementById("cloudLoginButton");

        if (currentButton) {

            currentButton.disabled = false;

            currentButton.textContent = "تسجيل الدخول";

        }

    }

}


/* =========================================
   34. ترجمة أخطاء الاتصال
========================================= */

function getCloudErrorMessage(error) {

    const message = String(error?.message || "");

    if (
        message.toLowerCase().includes("invalid login credentials")
    ) {
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }

    if (
        message.toLowerCase().includes("email not confirmed")
    ) {
        return "يجب تأكيد البريد الإلكتروني أولًا من رسالة التأكيد.";
    }

    if (
        message.toLowerCase().includes("failed to fetch")
    ) {
        return "تعذر الاتصال بالإنترنت أو بقاعدة البيانات. حاول مرة أخرى.";
    }

    if (
        message.toLowerCase().includes("row-level security") ||
        message.toLowerCase().includes("permission denied")
    ) {
        return "تم الاتصال، لكن صلاحيات قاعدة البيانات تحتاج إلى مراجعة.";
    }

    return "تعذر إتمام العملية. راجع بيانات الدخول واتصال قاعدة البيانات.";
}


/* =========================================
   35. تحويل بيانات المنتج إلى صيغة قاعدة البيانات
========================================= */

function productToCloudRow(product) {

    return {

        id: String(product.id),

        user_id: cloudUser.id,

        name: String(product.name || ""),

        category: String(product.category || ""),

        unit: String(product.unit || ""),

        stock_unit: String(product.stockUnit || ""),

        units_per_package: toNumber(product.unitsPerPackage) || 1,

        stock_quantity: toNumber(product.stockQuantity),

        purchase_price: toNumber(product.purchasePrice),

        selling_price: toNumber(product.sellingPrice),

        minimum_stock: toNumber(product.minimumStock),

        updated_at: new Date().toISOString()

    };

}


/* =========================================
   36. تحويل بيانات قاعدة البيانات إلى المنتج
========================================= */

function cloudRowToProduct(row) {

    return {

        id: String(row.id),

        name: String(row.name || ""),

        category: String(row.category || ""),

        unit: String(row.unit || ""),

        stockUnit: String(row.stock_unit || ""),

        unitsPerPackage: toNumber(row.units_per_package) || 1,

        stockQuantity: toNumber(row.stock_quantity),

        purchasePrice: toNumber(row.purchase_price),

        sellingPrice: toNumber(row.selling_price),

        minimumStock: toNumber(row.minimum_stock)

    };

}


/* =========================================
   37. تحميل المنتجات من قاعدة البيانات
========================================= */

async function loadCloudProducts() {

    if (!cloudClient || !cloudUser) {

        throw new Error("لم يتم تسجيل الدخول.");

    }

    const { data, error } = await cloudClient

        .from("products")

        .select(
            "id,user_id,name,category,unit,stock_unit,units_per_package,stock_quantity,purchase_price,selling_price,minimum_stock,updated_at"
        )

        .eq("user_id", cloudUser.id);

    if (error) {
        throw error;
    }

    const cloudProducts = (data || []).map(cloudRowToProduct);

    const localProducts = loadProducts();

    /*
       إذا كانت قاعدة البيانات فارغة وكان الجهاز يحتوي على منتجات،
       ننقل المنتجات المحلية إلى الحساب الحالي.
    */

    if (cloudProducts.length === 0 && localProducts.length > 0) {

        products = localProducts;

        await saveAllProductsToCloud();

    } else {

        /*
           إذا كانت هناك بيانات سحابية، فهي النسخة المعتمدة.
           لا نخلط بيانات جهاز قديم ببيانات الحساب.
        */

        products = cloudProducts;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

    }

    cloudReady = true;

    renderAll();

}


/* =========================================
   38. حفظ المنتجات في السحابة
========================================= */

async function saveAllProductsToCloud() {

    if (!cloudReady || !cloudClient || !cloudUser) {
        return;
    }

    if (cloudSaving) {
        return;
    }

    cloudSaving = true;

    try {

        if (products.length > 0) {

            const rows = products.map(productToCloudRow);

            const { error } = await cloudClient

                .from("products")

                .upsert(rows, {
                    onConflict: "id"
                });

            if (error) {
                throw error;
            }

        }

        updateCloudStatus("متصل — المزامنة السحابية مفعّلة");

    } catch (error) {

        console.error("تعذر حفظ المنتجات سحابيًا:", error);

        updateCloudStatus("تعذر حفظ التغييرات السحابية");

        showToast(
            getCloudErrorMessage(error),
            "error"
        );

    } finally {

        cloudSaving = false;

    }

}


/* =========================================
   39. جدولة المزامنة بعد الحفظ المحلي
========================================= */

function scheduleCloudSave() {

    if (!cloudReady || !cloudUser) {
        return;
    }

    clearTimeout(cloudSaveTimer);

    cloudSaveTimer = setTimeout(function () {

        saveAllProductsToCloud();

    }, 400);

}


/* =========================================
   40. حفظ البيانات محليًا وسحابيًا
========================================= */

function saveProducts() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        scheduleCloudSave();

        return true;

    } catch (error) {

        console.error("تعذر حفظ البيانات:", error);

        showToast(
            "تعذر حفظ البيانات على هذا الجهاز.",
            "error"
        );

        return false;

    }

}


/* =========================================
   41. حذف المنتج من السحابة
========================================= */

async function deleteCloudProduct(productId) {

    if (!cloudReady || !cloudUser) {
        return;
    }

    const { error } = await cloudClient

        .from("products")

        .delete()

        .eq("id", String(productId))

        .eq("user_id", cloudUser.id);

    if (error) {
        throw error;
    }

}


/* =========================================
   42. حالة الاتصال السحابي
========================================= */

function updateCloudStatus(message) {

    const footer = document.querySelector(".sidebar-footer");

    if (footer) {

        footer.innerHTML = `
            <span class="status-dot"></span>
            <span>${escapeHTML(message)}</span>
        `;

    }

}


/* =========================================
   43. إظهار الحساب الحالي وزر الخروج
========================================= */

function setupCloudAccountBar() {

    const topbar = document.querySelector(".topbar");

    if (!topbar || document.getElementById("cloudAccountBar")) {
        return;
    }

    const bar = document.createElement("div");

    bar.id = "cloudAccountBar";

    bar.innerHTML = `
        <span>☁</span>

        <span class="cloud-account-email"></span>

        <button id="cloudLogoutButton" type="button">
            تسجيل الخروج
        </button>
    `;

    topbar.insertAdjacentElement("afterend", bar);

    document.querySelector(".cloud-account-email").textContent =
        cloudUser?.email || "";

    document.getElementById("cloudLogoutButton")
        .addEventListener("click", async function () {

            const confirmed = window.confirm(
                "هل تريد تسجيل الخروج من حساب مخزني؟"
            );

            if (!confirmed) {
                return;
            }

            try {

                const { error } = await cloudClient.auth.signOut();

                if (error) {
                    throw error;
                }

                cloudReady = false;

                cloudUser = null;

                products = [];

                renderAll();

                showCloudLoginScreen();

                updateCloudStatus("تم تسجيل الخروج");

            } catch (error) {

                console.error(error);

                showToast(
                    "تعذر تسجيل الخروج. حاول مرة أخرى.",
                    "error"
                );

            }

        });

}


/* =========================================
   44. مزامنة التغييرات القادمة من جهاز آخر
========================================= */

function setupCloudRealtime() {

    if (!cloudClient || !cloudUser) {
        return;
    }

    if (cloudChannel) {

        cloudClient.removeChannel(cloudChannel);

        cloudChannel = null;

    }

    cloudChannel = cloudClient

        .channel("makhzani-products-" + cloudUser.id)

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products",
                filter: "user_id=eq." + cloudUser.id
            },
            async function () {

                /*
                   نؤخر القراءة قليلًا حتى تكتمل عملية الكتابة.
                */

                setTimeout(async function () {

                    if (!cloudReady || !cloudUser || cloudSaving) {
                        return;
                    }

                    try {

                        const { data, error } = await cloudClient

                            .from("products")

                            .select(
                                "id,user_id,name,category,unit,stock_unit,units_per_package,stock_quantity,purchase_price,selling_price,minimum_stock,updated_at"
                            )

                            .eq("user_id", cloudUser.id);

                        if (error) {
                            throw error;
                        }

                        products = (data || []).map(cloudRowToProduct);

                        localStorage.setItem(
                            STORAGE_KEY,
                            JSON.stringify(products)
                        );

                        renderAll();

                    } catch (error) {

                        console.error(
                            "تعذر تحديث البيانات من الجهاز الآخر:",
                            error
                        );

                    }

                }, 500);

            }
        )

        .subscribe(function (status) {

            if (status === "SUBSCRIBED") {

                updateCloudStatus(
                    "متصل — المزامنة السحابية مفعّلة"
                );

            }

        });

}


/* =========================================
   45. إعادة تعريف حذف المنتج مع المزامنة
========================================= */

async function confirmDelete() {

    if (!productToDelete) {
        return;
    }

    const deletedId = productToDelete;

    const previousProducts = [...products];

    products = products.filter(function (product) {

        return String(product.id) !== String(deletedId);

    });

    if (!saveProducts()) {

        products = previousProducts;

        return;

    }

    closeDeleteModal();

    renderAll();

    try {

        await deleteCloudProduct(deletedId);

        showToast(
            "تم حذف المنتج من المخزون والأجهزة المتزامنة.",
            "success"
        );

    } catch (error) {

        console.error("تعذر حذف المنتج سحابيًا:", error);

        products = previousProducts;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        renderAll();

        showToast(
            "تعذر تأكيد الحذف على السحابة. تمت استعادة القائمة المحلية.",
            "error"
        );

    }

}


/* =========================================
   46. استعادة النسخة الاحتياطية إلى السحابة
========================================= */

async function restoreBackup(file) {

    if (!file) {
        return;
    }

    try {

        if (file.size > 10 * 1024 * 1024) {

            throw new Error("حجم الملف أكبر من 10 ميجابايت.");

        }

        const textContent = await file.text();

        const parsed = JSON.parse(textContent);

        const backupProducts = Array.isArray(parsed)
            ? parsed
            : parsed.products;

        const restoredProducts =
            validateBackupProducts(backupProducts);

        const confirmed = window.confirm(
            "استعادة النسخة الاحتياطية ستستبدل جميع منتجات حسابك الحالي. هل تريد المتابعة؟"
        );

        if (!confirmed) {
            return;
        }

        const previousProducts = [...products];

        /*
           نحفظ النسخة الجديدة محليًا أولًا.
        */

        products = restoredProducts;

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        renderAll();

        /*
           عند تسجيل الدخول، نستبدل بيانات الحساب بالنسخة المستعادة.
        */

        if (cloudReady && cloudUser) {

            const { error: deleteError } = await cloudClient

                .from("products")

                .delete()

                .eq("user_id", cloudUser.id);

            if (deleteError) {
                throw deleteError;
            }

            if (products.length > 0) {

                const rows = products.map(productToCloudRow);

                const { error: insertError } = await cloudClient

                    .from("products")

                    .upsert(rows, {
                        onConflict: "id"
                    });

                if (insertError) {
                    throw insertError;
                }

            }

        }

        showToast(
            "تمت استعادة النسخة الاحتياطية.",
            "success"
        );

    } catch (error) {

        console.error("خطأ في استعادة البيانات:", error);

        showToast(
            error.message || "تعذرت استعادة النسخة الاحتياطية.",
            "error"
        );

    } finally {

        elements.restoreInput.value = "";

    }

}


/* =========================================
   47. تشغيل الاتصال السحابي
========================================= */

async function startCloudSystem() {

    createCloudLoginScreen();

    updateCloudStatus("جارٍ الاتصال بقاعدة البيانات...");

    try {

        /*
           تحميل مكتبة Supabase عند الحاجة.
        */

        if (!window.supabase) {

            await new Promise(function (resolve, reject) {

                const script = document.createElement("script");

                script.src =
                    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

                script.onload = resolve;

                script.onerror = function () {

                    reject(
                        new Error("تعذر تحميل مكتبة الاتصال.")
                    );

                };

                document.head.appendChild(script);

            });

        }

        cloudClient = window.supabase.createClient(
            CLOUD_CONFIG.url,
            CLOUD_CONFIG.key,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        const { data, error } = await cloudClient.auth.getSession();

        if (error) {
            throw error;
        }

        cloudUser = data.session?.user || null;

        if (cloudUser) {

            await loadCloudProducts();

            hideCloudLoginScreen();

            setupCloudAccountBar();

            setupCloudRealtime();

            updateCloudStatus(
                "متصل — المزامنة السحابية مفعّلة"
            );

        } else {

            showCloudLoginScreen();

            updateCloudStatus("في انتظار تسجيل الدخول");

        }

        /*
           تحديث الواجهة عند تغير حالة تسجيل الدخول.
        */

        cloudClient.auth.onAuthStateChange(
            async function (event, session) {

                if (event === "SIGNED_OUT") {

                    cloudReady = false;

                    cloudUser = null;

                    products = [];

                    renderAll();

                    showCloudLoginScreen();

                    return;

                }

                if (
                    session?.user &&
                    session.user.id !== cloudUser?.id
                ) {

                    cloudUser = session.user;

                    try {

                        await loadCloudProducts();

                        hideCloudLoginScreen();

                        setupCloudAccountBar();

                        setupCloudRealtime();

                    } catch (error) {

                        console.error(error);

                        showCloudLoginScreen();

                        showCloudLoginError(
                            getCloudErrorMessage(error)
                        );

                    }

                }

            }
        );

    } catch (error) {

        console.error("خطأ تشغيل النظام السحابي:", error);

        updateCloudStatus("تعذر الاتصال بقاعدة البيانات");

        showCloudLoginError(
            getCloudErrorMessage(error)
        );

    }

}


/* =========================================
   48. تشغيل النظام السحابي
========================================= */

startCloudSystem();