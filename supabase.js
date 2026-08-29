/**
 * JTS CAD CAM WAX CASTING - SUPABASE CLIENT HELPER
 * 
 * Replace the SUPABASE_URL and SUPABASE_ANON_KEY values below with your actual credentials
 * from your Supabase Project Settings -> API.
 */

const SUPABASE_URL = "https://qigttukglcpeewxibqcf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8X4fPcYHtw96jHlBqxp-KQ_1heTTF4v";

let supabaseClient = null;

/**
 * Checks if real Supabase credentials have been configured.
 */
function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_ID") &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY") &&
    typeof window.supabase !== "undefined"
  );
}

/**
 * Returns or initializes the global Supabase client instance.
 */
function getSupabase() {
  if (!supabaseClient && isSupabaseConfigured()) {
    const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");
    supabaseClient = window.supabase.createClient(cleanUrl, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * Authenticates staff user via Email & Password.
 */
async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) {
    throw new Error("Supabase credentials not configured. Please update SUPABASE_URL and SUPABASE_ANON_KEY in supabase.js.");
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Signs out current active user session.
 */
async function signOut() {
  const sb = getSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
}

/**
 * Gets currently logged in user session.
 */
async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Fetches complete user profile from user_roles table (role, full_name, user_id, email).
 * Returns null if no staff role is found in user_roles table.
 */
async function getUserProfile(userId, email) {
  const sb = getSupabase();
  if (!sb || !userId) return null;

  try {
    const { data, error } = await sb
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data && data.role) return data;

    // Fallback: check by email
    if (email) {
      const { data: emailData } = await sb
        .from("user_roles")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (emailData && emailData.role) return emailData;
    }
  } catch (e) {
    console.warn("Could not fetch user_roles table:", e);
  }

  return null;
}

/**
 * Fetches user role from user_roles table. Returns null if not assigned.
 */
async function getUserRole(userId, email) {
  const profile = await getUserProfile(userId, email);
  return profile ? profile.role : null;
}

/**
 * Updates full_name for a given user in user_roles table.
 */
async function updateUserProfile(userId, fullName) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured.");

  const { data, error } = await sb
    .from("user_roles")
    .update({ full_name: fullName })
    .eq("user_id", userId)
    .select();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches all users from user_roles table where role is 'Worker'.
 */
async function fetchWorkerUsers() {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("user_roles")
      .select("*")
      .eq("role", "Worker");

    console.log('Fetched Workers:', data, error);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn("Failed to fetch worker users:", e);
    return [];
  }
}

/**
 * Logs an action to the activity_logs table in Supabase.
 */
async function logActivity(userId, email, action, details) {
  const sb = getSupabase();
  if (!sb) return;

  try {
    await sb.from("activity_logs").insert([
      {
        user_id: userId || null,
        user_email: email || "unknown",
        action: action,
        details: typeof details === "object" ? JSON.stringify(details) : details,
        timestamp: new Date().toISOString()
      }
    ]);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

/**
 * Fetches all catalog items from catalog_items table.
 */
async function fetchCatalogItems() {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("catalog_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetches a paginated range of catalog items.
 * @param {number} from - Start index (0-based, inclusive).
 * @param {number} to   - End index (0-based, inclusive).
 * @returns {Array} Array of catalog item rows.
 */
async function fetchCatalogItemsPaginated(from, to) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("catalog_items")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data || [];
}

/**
 * Updates the status field on a given table row.
 * @param {string} table  - 'catalog_items' or 'custom_requests'
 * @param {string} id     - Row ID (uuid)
 * @param {string} status - New status: 'Pending', 'In Progress', or 'Completed'
 */
async function updateItemStatus(table, id, status) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { data, error } = await sb
    .from(table)
    .update({ status })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data ? data[0] : null;
}

/**
 * Uploads a photo file to Supabase Storage 'jewelry-images' bucket.
 */
async function uploadJewelryImage(file) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `catalog/${fileName}`;

  const { data, error } = await sb.storage
    .from("jewelry-images")
    .upload(filePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = sb.storage
    .from("jewelry-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Inserts a new item into catalog_items.
 */
async function createCatalogItem(itemData, file) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  let imageUrl = itemData.image_url || "img/logo.png";
  if (file) {
    imageUrl = await uploadJewelryImage(file);
  }

  const payload = {
    ...itemData,
    image_url: imageUrl,
    created_at: new Date().toISOString()
  };

  const { data, error } = await sb.from("catalog_items").insert([payload]).select();
  if (error) throw error;
  return data[0];
}

/**
 * Updates an existing item in catalog_items.
 */
async function updateCatalogItem(id, itemData, file) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const payload = { ...itemData };
  if (file) {
    payload.image_url = await uploadJewelryImage(file);
  }

  const { data, error } = await sb
    .from("catalog_items")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Deletes an item from catalog_items.
 */
async function deleteCatalogItem(id) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { error } = await sb.from("catalog_items").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Uploads a photo file to Supabase Storage 'client-uploads' bucket.
 */
async function uploadClientImage(file) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await sb.storage
    .from("client-uploads")
    .upload(filePath, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = sb.storage
    .from("client-uploads")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Inserts a new custom request into custom_requests table.
 */
async function createCustomRequest(requestData) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const payload = {
    ...requestData,
    created_at: new Date().toISOString()
  };

  const { data, error } = await sb.from("custom_requests").insert([payload]);
  if (error) throw error;
  return payload;
}

/**
 * Fetches all custom requests ordered by created_at descending.
 */
async function fetchCustomRequests() {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("custom_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Updates assigned_worker_id for a custom request.
 */
async function updateCustomRequestWorker(id, workerId) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured.");

  const { data, error } = await sb
    .from("custom_requests")
    .update({ assigned_worker_id: workerId })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Fetches custom requests assigned to a specific worker.
 */
async function fetchWorkerCustomRequests(workerId) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("custom_requests")
    .select("*")
    .eq("assigned_worker_id", workerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetches items assigned to a specific worker.
 */
async function fetchWorkerTasks(workerId) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("catalog_items")
    .select("*")
    .eq("assigned_worker_id", workerId)
    .order("deadline", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetches audit logs from activity_logs table.
 */
async function fetchActivityLogs() {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}
