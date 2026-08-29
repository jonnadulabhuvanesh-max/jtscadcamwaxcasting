const WA="919515861052";

// Initial / Fallback catalog items if Supabase is offline or empty
let rawCatalogItems = [];

let products = [];
let gallery = [];

let productCategories = ["All", ...new Set(products.map(p=>p[1]))];
let galleryCategories = ["All", ...new Set(gallery.map(g=>g[1]))];

const reviews=[
  ["M. Venkatrao","Sri Lakshmi Jewellers, Vijayawada","JTS CAD CAM Wax Casting has revolutionized our custom jewelry order fulfilment. The wax trees have zero shrinkage, and the gold casting output comes out mirror-smooth.","2 weeks ago"],
  ["K. Anusha","Bespoke Bridal Client","I submitted a rough sketch of my grandmother’s traditional temple necklace. Jagadeesh sir rendered an exact 3D CAD model within 24 hours!","1 month ago"],
  ["N. Rajesh Gupta","Gupta Gold Wholesalers, Guntur","Best CAD CAM wax printing facility in Andhra Pradesh. High DLP resolution, fast courier delivery, and fair rates for bulk wholesale casting trees.","3 weeks ago"],
  ["P. Subrahmanyam","Subrahmanyam Bullion & Works, Eluru","Their Advance Calculator is convenient. We use it in front of customers to quote CAD wax charges and advance gold rates transparently.","2 days ago"]
];

const faqs=[
  ["What is CAD/CAM Wax Casting in jewelry manufacturing?","CAD creates precise 3D digital models. CAM 3D-prints them using specialized castable wax resin. The wax model is placed inside an investment mold and removed in the lost-wax process before molten metal fills the cavity."],
  ["What is your average turnaround time for CAD design and Wax Tree printing?","Standard CAD designs are targeted for 12–24 hours. Once approved, 3D wax resin printing typically takes 3–6 hours. Same-day pickup is available in Vijayawada and express shipping is available across India."],
  ["Can retail clients order custom individual jewelry pieces through JTS?","Yes. JTS serves wholesale jewelers and direct-to-customer custom jewelry projects. Clients can submit a photo or sketch, approve the CAD model, and proceed to finished jewelry."],
  ["How should I interpret the estimated weight in the Jewellery Advance Calculator?","This is a planning estimate based on the weight and reference rate entered. Final cast weight and cost can vary with the approved CAD, sprue system, alloy, casting and finishing."],
  ["Can customer-provided gold or silver be used for casting?","Please contact JTS with your project details. Acceptance, testing and process requirements depend on the material and the specific job."],
  ["How should I handle confidential CAD designs?","Share sensitive designs only after confirming the project and confidentiality terms directly with JTS. The website does not claim that a public gallery is a secure client file repository."]
];

// Active User State
let currentUser = null;
let currentUserRole = null;
let currentUserProfile = null;
let workerList = [];

function money(n){return "₹"+Math.round(n).toLocaleString("en-IN")}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function runCadPrecheck(){
  const notes=(document.getElementById("customNotes")?.value||"").trim();
  const type=document.getElementById("customType")?.value||"Custom design";
  const checks=[];
  checks.push(type+" selected");
  checks.push(notes.length>=20?"Design description is detailed enough for an initial review":"Add dimensions, target weight, stone details or other specifications for a stronger brief");
  const file=document.getElementById("customFile")?.files?.[0];
  checks.push(file?"Reference file selected for upload":"No reference image selected");
  const out=document.getElementById("cadPrecheckResult");
  if(out)out.textContent=checks.join(" • ");
}

function populateFaqStructuredData(){
  const el=document.getElementById("faqStructuredData");
  if(!el)return;
  el.textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":faqs.map(f=>({"@type":"Question","name":f[0],"acceptedAnswer":{"@type":"Answer","text":f[1]}}))});
}

function openWhatsApp(msg){sendWA(msg||"Hello JTS CAD CAM Wax Casting, I would like to inquire about your jewelry CAD & wax printing services.")}
function sendWA(msg){
  msg=msg||document.getElementById("waCustom").value||"Hello JTS CAD CAM Wax Casting, I would like to inquire about your jewelry CAD & wax printing services.";
  window.open("https://wa.me/"+WA+"?text="+encodeURIComponent(msg),"_blank");
  const inp = document.getElementById("waCustom");
  if(inp) inp.value="";
  toggleWA(false);
}
function toggleWA(force){
  const p=document.getElementById("waPanel");
  if(!p) return;
  p.classList.toggle("hidden",force===false?p.classList.contains("hidden"):!p.classList.contains("hidden"));
}
function toggleMobile(){
  const menu=document.getElementById("mobileMenu"),button=document.getElementById("mobileToggle"),open=!menu.classList.contains("open");
  menu.classList.toggle("open",open);
  menu.setAttribute("aria-hidden",String(!open));
  if(button)button.setAttribute("aria-expanded",String(open));
}
function closeModal(id){
  if (id === "profileSetupModal" && currentUser) {
    const fullName = currentUserProfile?.full_name;
    if (!fullName || !fullName.trim()) {
      alert("Please complete your profile setup before continuing.");
      return;
    }
  }
  const el = document.getElementById(id);
  if(el) el.classList.add("hidden");
}
function openQuote(){document.getElementById("quoteModal").classList.remove("hidden")}

document.addEventListener("click",e=>{
  if(e.target.classList.contains("modal")) {
    if (e.target.id === "profileSetupModal" && currentUser) {
      const fullName = currentUserProfile?.full_name;
      if (!fullName || !fullName.trim()) return;
    }
    e.target.classList.add("hidden");
  }
});

function renderCategories(){
  const catEl = document.getElementById("categories");
  if(catEl) {
    catEl.innerHTML=productCategories.map((c,i)=>`<button type="button" class="${i===0?"active":""}" onclick="filterProducts('${c}',this)">${c}</button>`).join("");
  }
}
function filterProducts(cat,el){
  document.querySelectorAll("#categories button").forEach(x=>x.classList.remove("active"));
  if(el) el.classList.add("active");
  const grid = document.getElementById("productGrid");
  if(grid) {
    grid.innerHTML=products.filter(p=>cat==="All"||p[1]===cat).map(p=>productCard(p)).join("");
  }
}
function productCard(p){
  return `<article class="glass product"><img loading="lazy" decoding="async" src="${p[3]}" alt="Illustrative reference: ${p[0]}"><div class="product-body"><span class="tag">${p[1]}</span><h3>${p[0]}</h3><p>${p[2]}</p><div class="product-meta"><span>${p[4]}</span><span>${p[5]}</span></div><small class="image-note">Illustrative design reference — replace with your own JTS project photo when available.</small></div></article>`;
}
function renderProducts(){
  const grid = document.getElementById("productGrid");
  if(grid) grid.innerHTML=products.map(productCard).join("");
}

let galleryCat="All";
function renderFilters(){
  const filtEl = document.getElementById("galleryFilters");
  if(filtEl) {
    filtEl.innerHTML=galleryCategories.map((c,i)=>`<button type="button" class="${i===0?"active":""}" onclick="setGalleryCat('${c}',this)">${c}</button>`).join("");
  }
}
function setGalleryCat(c,el){
  galleryCat=c;
  document.querySelectorAll("#galleryFilters button").forEach(x=>x.classList.remove("active"));
  if(el) el.classList.add("active");
  renderGallery();
}
function renderGallery(){
  const searchInp = document.getElementById("gallerySearch");
  const q = searchInp ? searchInp.value.toLowerCase() : "";
  const arr = gallery.filter(g=>(galleryCat==="All"||g[1]===galleryCat)&&g.join(" ").toLowerCase().includes(q));
  const noGal = document.getElementById("noGallery");
  if(noGal) noGal.classList.toggle("hidden",arr.length>0);
  const grid = document.getElementById("galleryGrid");
  if(grid) {
    grid.innerHTML=arr.map(g=>`<button type="button" class="gallery-item" aria-label="Open ${g[0]}" onclick="openGallery(${gallery.indexOf(g)})"><img loading="lazy" decoding="async" src="${g[2]}" alt="Illustrative reference: ${g[0]}"><span><b>${g[1]} • ${g[3]}</b>${g[0]}</span></button>`).join("");
  }
}
function openGallery(i){
  const g=gallery[i];
  if(!g) return;
  document.getElementById("galleryModalImg").src=g[2];
  document.getElementById("galleryModalInfo").innerHTML=`<h3>${g[0]}</h3><p><b>CAD Code:</b> ${g[3]} &nbsp; • &nbsp; <b>Metal:</b> ${g[5]} &nbsp; • &nbsp; <b>Weight:</b> ${g[4]} &nbsp; • &nbsp; <b>Dimensions:</b> ${g[6]}</p><p>3D Resin Resolution: <b>25 Micron SLA</b></p>`;
  document.getElementById("galleryModal").classList.remove("hidden");
}

const MAKING_CHARGE_RATE=0.03;
const rates={"Gold 22K":6850,"Gold 24K":7480,"Gold 18K":5610,"Silver 925":92,"Platinum":3250};
function setRate(){
  const metalSelect = document.getElementById("calcMetal");
  if(metalSelect && rates[metalSelect.value]) {
    document.getElementById("calcRate").value=rates[metalSelect.value];
  }
  calculate();
}
function calculate() {
  const weightInput = document.getElementById("calcWeight")?.value;
  const rateInput = document.getElementById("calcRate")?.value;
  const metalVal = document.getElementById("calcMetal")?.value || "Gold 22K";
  
  const w = parseFloat(weightInput) || 0;
  const r = parseFloat(rateInput) || 0;

  // If either box is actually empty or 0, reset everything to ₹0
  if (w === 0 || r === 0) {
    if(document.getElementById("outWeight")) document.getElementById("outWeight").textContent = `${w} grams (${metalVal})`;
    if(document.getElementById("outMetal")) document.getElementById("outMetal").textContent = "₹0";
    if(document.getElementById("outMaking")) document.getElementById("outMaking").textContent = "₹0";
    if(document.getElementById("outAdvance")) document.getElementById("outAdvance").textContent = "₹0";
    if(document.getElementById("outTotal")) document.getElementById("outTotal").textContent = "₹0";
    return; // Stop the calculation here
  }

  // Otherwise, do the math!
  const metal = w * r;
  const making = metal * MAKING_CHARGE_RATE;
  const adv = metal * 0.3;
  const total = metal + making;

  if(document.getElementById("outWeight")) document.getElementById("outWeight").textContent = `${w} grams (${metalVal})`;
  if(document.getElementById("outMetal")) document.getElementById("outMetal").textContent = money(metal);
  if(document.getElementById("outMaking")) document.getElementById("outMaking").textContent = money(making);
  if(document.getElementById("outAdvance")) document.getElementById("outAdvance").textContent = money(adv);
  if(document.getElementById("outTotal")) document.getElementById("outTotal").textContent = money(total);
}
function syncRates(){
  setRate();
  alert("Reference rate restored. This is not a live market feed; confirm the current rate with JTS before booking.");
}
function quoteFromCalc(){
  const t = document.getElementById("calcType")?.value || "Engagement Ring";
  const m = document.getElementById("calcMetal")?.value || "Gold 22K";
  const w = document.getElementById("calcWeight")?.value || "10";
  const r = document.getElementById("calcRate")?.value || rates[m] || "6850";
  sendWA(`Hello JTS CAD CAM, I need an exact quote for ${t} in ${m}, estimated weight ${w}g. Rate applied: ₹${r}/g. Please include the 3% making charge and provide separate hallmark charges and taxes.`);
}
async function submitCustom(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector("button[type='submit']") || form.querySelector("button");
  const successEl = document.getElementById("customSuccess");
  const fileInput = document.getElementById("customFile");
  const file = fileInput?.files?.[0];

  if (!file) {
    alert("Please select a sketch or photo to upload before submitting.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading Image & Submitting...";
  }
  if (successEl) successEl.classList.add("hidden");

  try {
    const publicUrl = await uploadClientImage(file);
    const payload = {
      name: document.getElementById("customName").value.trim(),
      phone: document.getElementById("customPhone").value.trim(),
      category: document.getElementById("customType").value,
      description: document.getElementById("customNotes").value.trim(),
      image_url: publicUrl
    };

    await createCustomRequest(payload);

    if (successEl) {
      successEl.textContent = "✓ Your custom CAD request has been submitted successfully! We will review your design and contact you soon.";
      successEl.classList.remove("hidden");
    }
    form.reset();
  } catch (err) {
    console.error("Custom CAD submission failed:", err);
    alert(`Failed to submit custom CAD request: ${err.message || err}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Custom CAD Request";
    }
  }
}
function submitContact(e){
  e.preventDefault();
  const n=document.getElementById("contactName").value.trim(),p=document.getElementById("contactPhone").value.trim(),em=document.getElementById("contactEmail").value.trim(),m=document.getElementById("contactMsg").value.trim();
  document.getElementById("contactSuccess").classList.remove("hidden");
  sendWA(`Hello JTS CAD CAM, I have an inquiry. Name: ${n}. Phone: ${p}. Email: ${em||"Not provided"}. Message: ${m||"No message provided."}`);
}
function submitQuote(e){
  e.preventDefault();
  const n=document.getElementById("quoteName").value.trim(),p=document.getElementById("quotePhone").value.trim(),m=document.getElementById("quoteMetal").value,w=document.getElementById("quoteWeight").value,notes=document.getElementById("quoteNotes").value.trim();
  document.getElementById("quoteSuccess").classList.remove("hidden");
  sendWA(`Hello JTS CAD CAM, I want an express quote. Name: ${n}. WhatsApp: ${p}. Metal: ${m}. Estimated weight: ${w}g. Requirements: ${notes||"None."}. Please include 3% making charges and quote hallmark charges and taxes separately.`);
}
function quoteWhatsApp(){
  const n=document.getElementById("quoteName").value,m=document.getElementById("quoteMetal").value,w=document.getElementById("quoteWeight").value,p=document.getElementById("quotePhone").value;
  sendWA(`Hello JTS CAD CAM, I requested an express quote. Name: ${n}. WhatsApp: ${p}. Metal: ${m}. Estimated weight: ${w}g. Please include 3% making charges and quote hallmark charges and taxes separately.`);
}
function renderReviews(){
  const grid = document.getElementById("reviewsGrid");
  if(grid) grid.innerHTML=reviews.map(r=>`<article class="glass review"><div class="stars">★★★★★</div><p>“${r[2]}”</p><b>${r[0]}</b><small> • ${r[1]} • ${r[3]}</small></article>`).join("");
}
function renderFaq(){
  const list = document.getElementById("faqList");
  if(list) list.innerHTML=faqs.map((f,i)=>`<div class="faq"><button onclick="this.parentElement.classList.toggle('open')">${f[0]} <span>＋</span></button><p>${f[1]}</p></div>`).join("");
}

/* ============================================================
   SUPABASE LIVE CATALOG & AUTHENTICATION INTEGRATION
   ============================================================ */

/**
 * Asynchronously fetches all available items from catalog_items table in Supabase,
 * resolves Supabase storage public URLs for image sources, and dynamically populates
 * the public-facing 'Gallery' and 'Catalog' (products) sections of the website.
 */
async function loadPublicCatalog() {
  const sb = typeof getSupabase === "function" ? getSupabase() : null;
  if (!sb && typeof isSupabaseConfigured === "function" && !isSupabaseConfigured()) {
    console.log("Supabase not fully configured yet — catalog remains empty.");
    return;
  }

  try {
    let dbItems = null;
    if (typeof fetchCatalogItems === "function") {
      dbItems = await fetchCatalogItems();
    } else if (sb) {
      const { data, error } = await sb
        .from("catalog_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      dbItems = data;
    }

    if (dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
      rawCatalogItems = dbItems;
      
      // Map products array: [name, category, description, image_url, code, metal_and_weight]
      products = dbItems.map(item => {
        let imgUrl = item.image_url || "img/logo.png";
        if (item.image_path && sb) {
          const { data: publicUrlData } = sb.storage.from("jewelry-images").getPublicUrl(item.image_path);
          if (publicUrlData && publicUrlData.publicUrl) {
            imgUrl = publicUrlData.publicUrl;
          }
        }
        return [
          item.item_name || "Jewelry Item",
          item.category || "Temple",
          item.description || "High-precision CAD model.",
          imgUrl,
          item.code || `JTS-${item.id}`,
          `${item.est_weight || '10g'} • ${item.metal || 'Gold 22K'}`
        ];
      });

      // Map gallery array: [name, category, image_url, code, est_weight, metal, dimensions]
      gallery = dbItems.map(item => {
        let imgUrl = item.image_url || "img/logo.png";
        if (item.image_path && sb) {
          const { data: publicUrlData } = sb.storage.from("jewelry-images").getPublicUrl(item.image_path);
          if (publicUrlData && publicUrlData.publicUrl) {
            imgUrl = publicUrlData.publicUrl;
          }
        }
        return [
          item.item_name || "Jewelry Model",
          item.category || "Temple",
          imgUrl,
          item.code || `JTS-${item.id}`,
          item.est_weight || "10–15g",
          item.metal || "Gold 22K",
          item.size || "Standard"
        ];
      });

      // Update category lists dynamically
      productCategories = ["All", ...new Set(products.map(p => p[1]))];
      galleryCategories = ["All", ...new Set(gallery.map(g => g[1]))];

      // Re-render UI components
      renderCategories();
      renderProducts();
      renderFilters();
      renderGallery();
    }
  } catch (err) {
    console.warn("Failed to load public catalog from Supabase:", err);
  }
}

/**
 * Initializes catalog data from Supabase (alias for loadPublicCatalog).
 */
async function syncSupabaseCatalog() {
  await loadPublicCatalog();
}

/**
 * Staff Login Modal Toggle & Form Handler
 */
/**
 * Routing logic after authentication or session restore:
 * Checks if full_name is present in user_roles. If missing, prompts Profile Setup modal.
 */
function checkProfileAndRoute() {
  if (!currentUser) return;
  const fullName = currentUserProfile?.full_name;
  if (!fullName || !fullName.trim()) {
    // Show profile setup modal for first-time onboarding
    const nameInp = document.getElementById("profileFullName");
    if (nameInp) nameInp.value = "";
    const errBanner = document.getElementById("profileSetupError");
    if (errBanner) errBanner.classList.add("hidden");
    const setupModal = document.getElementById("profileSetupModal");
    if (setupModal) setupModal.classList.remove("hidden");
    return;
  }

  // Profile complete, route to respective dashboard
  if (currentUserRole === "Admin") {
    openAdminDashboard();
  } else {
    openWorkerPortal();
  }
}

/**
 * Handles Profile Setup form submission (saves full_name back to user_roles table).
 */
async function handleProfileSetupSubmit(event) {
  event.preventDefault();
  const nameInp = document.getElementById("profileFullName");
  const errBanner = document.getElementById("profileSetupError");
  const btn = document.getElementById("profileSetupSubmitBtn");
  const fullName = nameInp ? nameInp.value.trim() : "";

  if (!fullName) {
    if (errBanner) {
      errBanner.textContent = "Full Name is required.";
      errBanner.classList.remove("hidden");
    }
    return;
  }

  if (errBanner) errBanner.classList.add("hidden");
  btn.disabled = true;
  btn.textContent = "Saving Profile...";

  try {
    await updateUserProfile(currentUser.id, fullName);
    if (!currentUserProfile) currentUserProfile = {};
    currentUserProfile.full_name = fullName;

    await logActivity(currentUser.id, currentUser.email, "Profile Setup", { full_name: fullName });

    // Hide profile modal
    document.getElementById("profileSetupModal").classList.add("hidden");

    checkProfileAndRoute();
  } catch (err) {
    if (errBanner) {
      errBanner.textContent = err.message || "Failed to save profile. Please try again.";
      errBanner.classList.remove("hidden");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Profile & Continue";
  }
}

/**
 * Asynchronously fetches all rows from user_roles where role equals 'Worker'
 * and populates the worker dropdown menus in the Admin Dashboard.
 */
async function populateWorkerDropdowns() {
  const sb = getSupabase();
  if (!sb) {
    console.warn("Supabase credentials not available.");
    return;
  }

  try {
    const { data, error } = await sb
      .from('user_roles')
      .select('*')
      .eq('role', 'Worker');

    console.log('Fetched Workers:', data, error);

    if (error) {
      console.error("Error fetching workers:", error);
      return;
    }

    workerList = data || [];

    const selectElements = [
      document.getElementById("newItemWorker"),
      document.getElementById("editItemWorker")
    ];

    selectElements.forEach(select => {
      if (!select) return;

      const currentVal = select.value;

      // Clear existing options
      select.innerHTML = "";

      // Default empty/unassigned option
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "None (Completed Work / Public Gallery Only)";
      select.appendChild(defaultOpt);

      // Iterate through fetched data and dynamically create HTML <option> elements
      if (data && Array.isArray(data)) {
        data.forEach(worker => {
          const opt = document.createElement("option");
          opt.value = worker.user_id;
          opt.textContent = worker.full_name || worker.email || worker.user_id;
          select.appendChild(opt);
        });
      }

      if (currentVal) {
        select.value = currentVal;
      }
    });
  } catch (err) {
    console.error("Failed to populate worker dropdowns:", err);
  }
}

/**
 * Staff Login Modal Toggle & Form Handler
 */
function openStaffLogin() {
  if (currentUser) {
    if (!currentUserRole || (currentUserRole !== "Admin" && currentUserRole !== "Worker")) {
      alert("Access Denied: No staff role assigned");
      handleLogout();
      return;
    }
    checkProfileAndRoute();
    return;
  }
  document.getElementById("loginError").classList.add("hidden");
  document.getElementById("loginModal").classList.remove("hidden");
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInp = document.getElementById("loginEmail");
  const passInp = document.getElementById("loginPassword");
  const errBanner = document.getElementById("loginError");
  const btn = document.getElementById("loginSubmitBtn");

  errBanner.classList.add("hidden");
  btn.disabled = true;
  btn.textContent = "Authenticating...";

  try {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured yet. Please edit supabase.js with your project credentials.");
    }

    const authData = await signIn(emailInp.value.trim(), passInp.value);

    // Extract user ID directly from data.session.user.id (or fallback to authData.user.id)
    const userId = (authData && authData.session && authData.session.user && authData.session.user.id) 
      || (authData && authData.user && authData.user.id);

    if (!userId) {
      throw new Error("User ID not found in session authentication response.");
    }

    currentUser = (authData && authData.session && authData.session.user) || authData.user;

    const sb = getSupabase();
    // Query user_roles directly by user_id
    const { data, error } = await sb
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Role check result:', data, error);

    if (error || !data || !data.role) {
      await signOut();
      currentUser = null;
      currentUserProfile = null;
      currentUserRole = null;
      updateNavForLoggedInUser();
      throw new Error("Access Denied: No staff role assigned");
    }

    currentUserProfile = data;
    const roleVal = data.role;

    if (roleVal === "Admin") {
      currentUserRole = "Admin";
    } else if (roleVal === "Worker") {
      currentUserRole = "Worker";
    } else {
      await signOut();
      currentUser = null;
      currentUserProfile = null;
      currentUserRole = null;
      updateNavForLoggedInUser();
      throw new Error("Access Denied: No staff role assigned");
    }

    // Audit log entry for authorized staff login
    await logActivity(currentUser.id, currentUser.email, "Staff Login", { role: currentUserRole });

    updateNavForLoggedInUser();
    closeModal("loginModal");

    checkProfileAndRoute();
  } catch (err) {
    errBanner.textContent = err.message || "Invalid credentials or login failed.";
    errBanner.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In to Dashboard";
  }
}

function updateNavForLoggedInUser() {
  const staffBtn = document.getElementById("staffLoginNavBtn");
  const mobileBtn = document.getElementById("mobileStaffLoginBtn");
  if (currentUser) {
    const label = `Dashboard (${currentUserRole})`;
    if (staffBtn) staffBtn.textContent = label;
    if (mobileBtn) mobileBtn.textContent = label;
  } else {
    if (staffBtn) staffBtn.textContent = "Staff Login";
    if (mobileBtn) mobileBtn.textContent = "Staff Login";
  }
}

async function handleLogout() {
  if (currentUser) {
    await logActivity(currentUser.id, currentUser.email, "Staff Logout", {});
    await signOut();
  }
  currentUser = null;
  currentUserRole = null;
  currentUserProfile = null;
  updateNavForLoggedInUser();
  closeModal("adminModal");
  closeModal("workerModal");
  const profileModal = document.getElementById("profileSetupModal");
  if (profileModal) profileModal.classList.add("hidden");
  alert("You have logged out successfully.");
}

/**
 * Admin Dashboard Management Panel Logic
 */
async function openAdminDashboard() {
  if (!currentUser || currentUserRole !== "Admin") {
    alert("Access restricted to Admin users.");
    openStaffLogin();
    return;
  }

  const adminGreeting = (currentUserProfile && currentUserProfile.full_name && currentUserProfile.full_name.trim())
    ? currentUserProfile.full_name.trim()
    : currentUser.email;

  document.getElementById("adminUserEmail").textContent = `${adminGreeting} (Admin)`;
  document.getElementById("adminModal").classList.remove("hidden");
  
  await populateWorkerDropdowns();
  await renderAdminCatalogTable();
  await renderAdminClientRequestsTable();
  await renderActivityLogs();
}

function switchAdminTab(tab) {
  const catalogBtn = document.getElementById("tabCatalogBtn");
  const clientRequestsBtn = document.getElementById("tabClientRequestsBtn");
  const auditBtn = document.getElementById("tabAuditBtn");
  const catalogTab = document.getElementById("adminCatalogTab");
  const clientRequestsTab = document.getElementById("adminClientRequestsTab");
  const auditTab = document.getElementById("adminAuditTab");

  if (catalogBtn) catalogBtn.classList.remove("active");
  if (clientRequestsBtn) clientRequestsBtn.classList.remove("active");
  if (auditBtn) auditBtn.classList.remove("active");

  if (catalogTab) catalogTab.classList.add("hidden");
  if (clientRequestsTab) clientRequestsTab.classList.add("hidden");
  if (auditTab) auditTab.classList.add("hidden");

  if (tab === 'catalog') {
    if (catalogBtn) catalogBtn.classList.add("active");
    if (catalogTab) catalogTab.classList.remove("hidden");
  } else if (tab === 'clientRequests') {
    if (clientRequestsBtn) clientRequestsBtn.classList.add("active");
    if (clientRequestsTab) clientRequestsTab.classList.remove("hidden");
    renderAdminClientRequestsTable();
  } else {
    if (auditBtn) auditBtn.classList.add("active");
    if (auditTab) auditTab.classList.remove("hidden");
    renderActivityLogs();
  }
}

async function renderAdminClientRequestsTable() {
  const tbody = document.getElementById("adminClientRequestsTableBody");
  const countEl = document.getElementById("adminClientRequestsCount");
  if (!tbody) return;

  if (!workerList || workerList.length === 0) {
    await populateWorkerDropdowns();
  }

  tbody.innerHTML = `<tr><td colspan="6" class="empty">Fetching client requests from database...</td></tr>`;

  let requests = [];
  try {
    requests = await fetchCustomRequests();
  } catch (e) {
    console.error("Error loading custom requests table:", e);
  }

  if (countEl) countEl.textContent = requests.length;

  if (!requests || requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">No custom CAD client requests found yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(req => {
    const id = req.id || '';
    const rawImgUrl = req.image_url || 'img/logo.png';
    const safeImgUrl = rawImgUrl.replace(/'/g, "%27");
    const name = escapeHtml(req.name || 'Anonymous Client');
    const phone = escapeHtml(req.phone || 'N/A');
    const category = escapeHtml(req.category || 'Custom CAD');
    const notes = escapeHtml(req.description || 'No notes provided.');
    const currentWorker = req.assigned_worker_id || '';

    let workerOptions = `<option value="">Unassigned</option>`;
    if (workerList && Array.isArray(workerList)) {
      workerList.forEach(w => {
        const wName = escapeHtml((w.full_name && w.full_name.trim()) ? w.full_name.trim() : (w.email || w.user_id));
        const selected = (String(w.user_id) === String(currentWorker)) ? 'selected' : '';
        workerOptions += `<option value="${escapeHtml(w.user_id)}" ${selected}>${wName}</option>`;
      });
    }

    const safeId = String(id).replace(/'/g, "\\'");

    return `
      <tr>
        <td><a href="${safeImgUrl}" target="_blank" title="View Full Image"><img src="${safeImgUrl}" class="table-thumb" alt="${name}"></a></td>
        <td><b>${name}</b></td>
        <td><a href="tel:${phone}">${phone}</a></td>
        <td><span class="tag">${category}</span></td>
        <td style="max-width:250px; font-size:13px; line-height:1.4;">${notes}</td>
        <td>
          <select class="admin-select" style="padding:6px; font-size:13px;" onchange="handleAssignWorkerCustomRequest('${safeId}', this.value)">
            ${workerOptions}
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

async function handleAssignWorkerCustomRequest(requestId, workerId) {
  try {
    const assignedId = workerId && workerId.trim() !== "" ? workerId.trim() : null;
    await updateCustomRequestWorker(requestId, assignedId);
    if (currentUser) {
      await logActivity(currentUser.id, currentUser.email, "Assign Worker to Custom Request", { requestId, assignedWorkerId: assignedId });
    }
  } catch (err) {
    alert(`Failed to assign worker: ${err.message}`);
    await renderAdminClientRequestsTable();
  }
}

async function renderAdminCatalogTable() {
  const tbody = document.getElementById("adminCatalogTableBody");
  const countEl = document.getElementById("adminCatalogCount");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="empty">Fetching items from database...</td></tr>`;

  let dbItems = [];
  try {
    dbItems = await fetchCatalogItems();
  } catch(e) {
    console.error("Error loading admin table items:", e);
  }

  // Fallback to raw items if dbItems is empty or null
  const itemsToRender = (dbItems && dbItems.length > 0) ? dbItems : rawCatalogItems;
  countEl.textContent = itemsToRender.length;

  if (itemsToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No catalog items found. Use the form above to upload a new item.</td></tr>`;
    return;
  }

  tbody.innerHTML = itemsToRender.map(item => {
    const id = item.id || '';
    const imgUrl = item.image_url || 'img/logo.png';
    const name = item.item_name || item[0] || 'Jewelry Item';
    const cat = item.category || item[1] || 'Temple';
    const code = item.code || item[4] || 'JTS-CAD-000';
    const metal = item.metal || 'Gold 22K';
    const weight = item.est_weight || item[5] || '10g';
    let worker = '<span class="muted-text">Unassigned</span>';
    if (item.assigned_worker_id) {
      const match = workerList.find(w => w.user_id === item.assigned_worker_id);
      if (match) {
        const wName = (match.full_name && match.full_name.trim()) ? match.full_name.trim() : (match.email || match.user_id);
        worker = `<span class="tag">${wName}</span>`;
      } else {
        worker = `<code class="tiny-code">${item.assigned_worker_id}</code>`;
      }
    }
    const deadline = item.deadline ? item.deadline : 'None';

    return `
      <tr>
        <td><img src="${imgUrl}" class="table-thumb" alt="${name}"></td>
        <td><b>${name}</b><br><small class="tag">${code}</small></td>
        <td><span class="tag">${cat}</span></td>
        <td>${metal}<br><small>${weight}</small></td>
        <td>${worker}</td>
        <td>${deadline}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-outline btn-xs" onclick="openEditItemModal('${id}')">Edit</button>
            <button class="btn btn-ghost btn-xs delete-btn" onclick="handleDeleteItem('${id}', '${name.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterAdminCatalogTable() {
  const query = document.getElementById("adminSearchInput")?.value.toLowerCase() || "";
  const rows = document.querySelectorAll("#adminCatalogTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

async function handleCreateItemSubmit(event) {
  event.preventDefault();
  const btn = document.getElementById("createItemBtn");
  const status = document.getElementById("createItemStatus");

  btn.disabled = true;
  btn.textContent = "Uploading & Saving...";
  status.classList.add("hidden");

  try {
    const photoFile = document.getElementById("newItemPhoto")?.files?.[0];
    const directUrl = document.getElementById("newItemImageUrl")?.value.trim();
    const workerVal = document.getElementById("newItemWorker")?.value?.trim();

    const itemData = {
      item_name: document.getElementById("newItemName").value.trim(),
      category: document.getElementById("newItemCategory").value,
      code: document.getElementById("newItemCode").value.trim() || `JTS-${Date.now().toString().slice(-4)}`,
      metal: document.getElementById("newItemMetal").value,
      est_weight: document.getElementById("newItemWeight").value.trim(),
      size: document.getElementById("newItemSize").value.trim(),
      assigned_worker_id: (workerVal && workerVal !== "") ? workerVal : null,
      assigned_date: document.getElementById("newItemAssignedDate").value || null,
      deadline: document.getElementById("newItemDeadline").value || null,
      description: document.getElementById("newItemDescription").value.trim(),
      image_url: directUrl || null
    };

    const newItem = await createCatalogItem(itemData, photoFile);
    await logActivity(currentUser.id, currentUser.email, "Create Catalog Item", { id: newItem.id, name: newItem.item_name });

    status.textContent = `✓ Item "${newItem.item_name}" published successfully!`;
    status.classList.remove("hidden");
    document.getElementById("createCatalogForm").reset();

    await syncSupabaseCatalog();
    await renderAdminCatalogTable();
  } catch (err) {
    alert(`Failed to create item: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload Photo & Publish Item";
  }
}

async function openEditItemModal(id) {
  const item = rawCatalogItems.find(x => String(x.id) === String(id));
  if (!item) {
    alert("Item details not found. Please refresh catalog.");
    return;
  }

  await populateWorkerDropdowns();

  document.getElementById("editItemId").value = item.id;
  document.getElementById("editItemName").value = item.item_name || "";
  document.getElementById("editItemCategory").value = item.category || "Temple";
  document.getElementById("editItemCode").value = item.code || "";
  document.getElementById("editItemMetal").value = item.metal || "Gold 22K";
  document.getElementById("editItemWeight").value = item.est_weight || "";
  document.getElementById("editItemSize").value = item.size || "";
  document.getElementById("editItemWorker").value = item.assigned_worker_id || "";
  document.getElementById("editItemAssignedDate").value = item.assigned_date || "";
  document.getElementById("editItemDeadline").value = item.deadline || "";
  document.getElementById("editItemDescription").value = item.description || "";

  document.getElementById("editCatalogModal").classList.remove("hidden");
}

async function handleEditItemSubmit(event) {
  event.preventDefault();
  const id = document.getElementById("editItemId").value;
  const photoFile = document.getElementById("editItemPhoto")?.files?.[0];
  const workerVal = document.getElementById("editItemWorker")?.value?.trim();

  const itemData = {
    item_name: document.getElementById("editItemName").value.trim(),
    category: document.getElementById("editItemCategory").value,
    code: document.getElementById("editItemCode").value.trim(),
    metal: document.getElementById("editItemMetal").value,
    est_weight: document.getElementById("editItemWeight").value.trim(),
    size: document.getElementById("editItemSize").value.trim(),
    assigned_worker_id: (workerVal && workerVal !== "") ? workerVal : null,
    assigned_date: document.getElementById("editItemAssignedDate").value || null,
    deadline: document.getElementById("editItemDeadline").value || null,
    description: document.getElementById("editItemDescription").value.trim()
  };

  try {
    const updated = await updateCatalogItem(id, itemData, photoFile);
    await logActivity(currentUser.id, currentUser.email, "Update Catalog Item", { id, name: updated.item_name });
    closeModal("editCatalogModal");
    await syncSupabaseCatalog();
    await renderAdminCatalogTable();
    alert(`Item "${updated.item_name}" updated successfully.`);
  } catch (err) {
    alert(`Failed to update item: ${err.message}`);
  }
}

async function handleDeleteItem(id, itemName) {
  if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) return;

  try {
    await deleteCatalogItem(id);
    await logActivity(currentUser.id, currentUser.email, "Delete Catalog Item", { id, name: itemName });
    await syncSupabaseCatalog();
    await renderAdminCatalogTable();
    alert(`Item deleted successfully.`);
  } catch (err) {
    alert(`Failed to delete item: ${err.message}`);
  }
}

async function renderActivityLogs() {
  const tbody = document.getElementById("adminAuditTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="empty">Loading activity audit logs...</td></tr>`;

  try {
    const logs = await fetchActivityLogs();
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty">No activity logs recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => `
      <tr>
        <td><small class="muted-text">${new Date(log.timestamp).toLocaleString()}</small></td>
        <td><b>${log.user_email || 'System'}</b></td>
        <td><span class="status">${log.action}</span></td>
        <td><code class="tiny-code">${typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}</code></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Could not load activity logs: ${err.message}</td></tr>`;
  }
}

/**
 * Worker Task Portal Logic
 */
async function openWorkerPortal() {
  if (!currentUser) {
    openStaffLogin();
    return;
  }

  const workerGreeting = (currentUserProfile && currentUserProfile.full_name && currentUserProfile.full_name.trim())
    ? currentUserProfile.full_name.trim()
    : currentUser.email;

  document.getElementById("workerUserEmail").textContent = `${workerGreeting} (Worker)`;
  document.getElementById("workerUidDisplay").textContent = currentUser.id;
  document.getElementById("workerModal").classList.remove("hidden");

  await renderWorkerPortal();
}

async function renderWorkerPortal() {
  const grid = document.getElementById("workerTaskGrid");
  const taskCountEl = document.getElementById("workerTaskCount");
  if (!grid) return;

  grid.innerHTML = `<div class="empty">Fetching worker assigned items...</div>`;

  let catalogTasks = [];
  let customTasks = [];

  try {
    catalogTasks = await fetchWorkerTasks(currentUser.id);
  } catch (err) {
    console.error("Failed to load worker catalog tasks:", err);
  }

  try {
    customTasks = await fetchWorkerCustomRequests(currentUser.id);
  } catch (err) {
    console.error("Failed to load worker custom requests:", err);
  }

  // Fallback if no catalog tasks found in DB: check rawCatalogItems
  if ((!catalogTasks || catalogTasks.length === 0) && (!customTasks || customTasks.length === 0)) {
    catalogTasks = rawCatalogItems.filter(item => item.assigned_worker_id === currentUser.id);
  }

  const sb = typeof getSupabase === "function" ? getSupabase() : null;

  const mappedCatalog = (catalogTasks || []).map(task => {
    let downloadUrl = task.image_url || 'img/logo.png';
    if (task.image_path && sb) {
      const { data: publicUrlData } = sb.storage.from('jewelry-images').getPublicUrl(task.image_path);
      if (publicUrlData && publicUrlData.publicUrl) downloadUrl = publicUrlData.publicUrl;
    } else if (downloadUrl && sb && !downloadUrl.startsWith('http') && !downloadUrl.startsWith('img/')) {
      const { data: publicUrlData } = sb.storage.from('jewelry-images').getPublicUrl(downloadUrl);
      if (publicUrlData && publicUrlData.publicUrl) downloadUrl = publicUrlData.publicUrl;
    }

    const name = escapeHtml(task.item_name || 'Assigned Jewelry Item');
    const category = escapeHtml(task.category || 'Temple');
    const size = escapeHtml(task.size || 'Standard');
    const weight = escapeHtml(task.est_weight || '10g');
    const assignedDate = escapeHtml(task.assigned_date || 'Today');
    const deadline = escapeHtml(task.deadline || 'Pending');
    const filename = `${(task.item_name || 'catalog_item').replace(/[^a-z0-9]/gi, '_')}_catalog.jpg`;

    return {
      id: task.id,
      name,
      categoryTag: `<span class="tag">${category}</span>`,
      meta1: `<b>Dimensions:</b> ${size} | <b>Est Weight:</b> ${weight}`,
      meta2: `<b>Assigned Date:</b> ${assignedDate}`,
      badge: `Deadline: ${deadline}`,
      description: escapeHtml(task.description || 'No special notes.'),
      downloadUrl,
      filename
    };
  });

  const mappedCustom = (customTasks || []).map(req => {
    const downloadUrl = req.image_url || 'img/logo.png';
    const clientName = escapeHtml(req.name || 'Client');
    const name = `Client Request: ${clientName}`;
    const category = escapeHtml(req.category || 'Custom Bespoke CAD');
    const phone = escapeHtml(req.phone || 'N/A');
    const submittedDate = req.created_at ? escapeHtml(new Date(req.created_at).toLocaleDateString()) : 'Today';
    const filename = `${(req.name || 'client_request').replace(/[^a-z0-9]/gi, '_')}_custom_request.jpg`;

    return {
      id: req.id,
      name,
      categoryTag: `<span class="tag" style="background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:var(--text);">${category} • Client Request</span>`,
      meta1: `<b>Client Phone:</b> <a href="tel:${phone}">${phone}</a>`,
      meta2: `<b>Submitted Date:</b> ${submittedDate}`,
      badge: `Client Submission`,
      description: escapeHtml(req.description || 'No notes provided by client.'),
      downloadUrl,
      filename
    };
  });

  const allTasks = [...mappedCatalog, ...mappedCustom];

  taskCountEl.textContent = allTasks.length;

  if (allTasks.length === 0) {
    grid.innerHTML = `
      <div class="empty-card glass">
        <h3>✦ No Assigned Tasks Pending</h3>
        <p>You currently have no jewelry casting assignments linked to Worker ID <code>${escapeHtml(currentUser.id)}</code>.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = allTasks.map(task => {
    const safeUrl = String(task.downloadUrl).replace(/'/g, "\\'");
    const safeFilename = String(task.filename).replace(/'/g, "\\'");

    return `
      <article class="glass worker-task-card">
        <div class="task-image-wrap">
          <img src="${safeUrl}" alt="${task.name}">
          <span class="deadline-badge">${task.badge}</span>
        </div>
        <div class="task-body">
          ${task.categoryTag}
          <h3>${task.name}</h3>
          <p class="task-meta-line">${task.meta1}</p>
          <p class="task-meta-line">${task.meta2}</p>
          <p class="task-desc">${task.description}</p>
          <button type="button" onclick="downloadImage('${safeUrl}', '${safeFilename}')" class="btn btn-gold btn-block">
            ⬇ Download High-Res Image
          </button>
        </div>
      </article>
    `;
  }).join("");
}

/**
 * Downloads a high-resolution reference file directly in browser (fallback helper).
 */
async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "jewelry_reference.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    // Direct link fallback
    window.open(url, "_blank");
  }
}

/**
 * Check existing Supabase session on DOM Content Loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  renderCategories();
  renderProducts();
  renderFilters();
  renderGallery();
  renderReviews();
  renderFaq();
  populateFaqStructuredData();
  calculate();
  setRate(); // This forces the box to visually fill with the 6850 rate immediately

  // Automatically load live public catalog from Supabase on page load
  await loadPublicCatalog();

  // Check if session active (unobtrusively update nav bar state without opening modals)
  if (typeof getCurrentUser === "function") {
    try {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id, user.email);
        if (profile && (profile.role === "Admin" || profile.role === "Worker")) {
          currentUser = user;
          currentUserProfile = profile;
          currentUserRole = profile.role;
          updateNavForLoggedInUser();
        } else {
          // Unassigned user, reset session state quietly
          await signOut();
          currentUser = null;
          currentUserProfile = null;
          currentUserRole = null;
          updateNavForLoggedInUser();
        }
      }
    } catch (e) {
      console.warn("Session check failed:", e);
    }
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach(m => {
      if (m.id === "profileSetupModal" && currentUser) {
        const fullName = currentUserProfile?.full_name;
        if (!fullName || !fullName.trim()) return;
      }
      m.classList.add("hidden");
    });
  }
});
