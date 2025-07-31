const SUPABASE_URL = "https://yezofyfuitlebwjdffwb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllem9meWZ1aXRsZWJ3amRmZndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjA5MTksImV4cCI6MjA2NzE5NjkxOX0.tGcLT_avU8Ao19dqrdOfzV0pkbQlIxZQSiinW-5XRKk";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// index ----------------------------------------------------------------------------------

async function checkLoggedUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userArea = document.getElementById("user-area");
  const mobileUserArea = document.getElementById("mobile-user-area");

  if (!session || !session.user) return;

  const name = session.user.user_metadata?.full_name || "User";

  userArea.innerHTML = `
      <div class="user-dropdown" onclick="toggleDropdown()">
        <span class="user-name"> ${name} <i class="fa fa-caret-down"></i></span>
        <div id="dropdown-menu" class="dropdown-menu hidden">
          <a href="profile.html">Profile</a>
          <button onclick="logout()" style="color: red">Logout</button>
        </div>
      </div>
    `;

  mobileUserArea.innerHTML = `
      <div class="mobile-user-dropdown">
        <br>
        <span class="mobile-user-name"> ${name} </span>
        <div id="mobile-dropdown-menu" class="mobile-dropdown-menu">  
          <a href="profile.html">Profile</a>
          <button onclick="logout()" style="color: red">Logout</button>
        </div>
      </div>
    `;
}

function toggleDropdown() {
  const dropdown = document.getElementById("dropdown-menu");
  dropdown.classList.toggle("hidden");
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

async function handlePapersClick() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    window.location.href = "loginregister.html";
    return;
  }

  window.location.href = "profile.html?tab=mypapers";
}

// Register Login ----------------------------------------------------------------------------

async function register() {
  const fullName = document.getElementById("reg-fullname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!fullName || !email || !password) {
    alert("Please enter full name, email and password.");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert("Error registering: " + error.message);
    console.error(error);
    return;
  }

  const userId = data.user.id;

  // === QR CODE === //
  const qrContainer = document.createElement("div");
  const qr = new QRCode(qrContainer, {
    text: userId,
    width: 256,
    height: 256,
    colorDark: "#0049a1",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(async () => {
    const canvas = qrContainer.querySelector("canvas");
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      const filePath = `${userId}/qr.png`;

      const { error: uploadError } = await supabase.storage
        .from("qr-bucket")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadError) return;

      await fetch(
        "https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/apply-display-name",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            full_name: fullName,
            qr_path: filePath,
          }),
        }
      );

      // === ✅ ΑΠΟΣΤΟΛΗ EMAIL ΜΕ QR === // ========================================================================= thelei domain
      const qrUrl = `https://yezofyfuitlebwjdffwb.supabase.co/storage/v1/object/public/qr-bucket/${filePath}`;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          "https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/send-qr-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ qrUrl }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          console.error("❌ Email send error:", errData);
        } else {
          console.log("📧 QR email sent!");
        }
      } catch (e) {
        console.error("❌ Failed to send QR email:", e);
      }
    }, "image/png");
  }, 300);

  alert("Registration successful! Please check your email.");
}

async function login() {
  const email = document.getElementById("log-email").value.trim();
  const password = document.getElementById("log-password").value;

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error logging in: " + error.message);
    return;
  }

  const name = data.user.user_metadata?.full_name || "User";
  resultDiv.innerHTML = `<p>Welcome ${name}! Redirecting...</p>`;
  setTimeout(() => (window.location.href = "index.html"), 2000);
}

async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/index.html",
    },
  });

  if (error) {
    console.error("Google login error:", error.message);
    alert("Login failed");
  }

  document.getElementById(
    "result"
  ).innerHTML = `<p>Welcome! Redirecting...</p>`;
  setTimeout(() => (window.location.href = "index.html"), 2000);
}

async function initGoogleQR() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const userId = user.id;
  const email = user.email;
  const fullName = user.user_metadata?.full_name || email.split("@")[0];

  if (user.user_metadata?.qr_path) return;

  const qrContainer = document.createElement("div");
  new QRCode(qrContainer, {
    text: userId,
    width: 256,
    height: 256,
    colorDark: "#0049a1",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const canvas = qrContainer.querySelector("canvas");
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      const filePath = `${userId}/qr.png`;

      const { error: uploadError } = await supabase.storage
        .from("qr-bucket")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      await fetch(
        "https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/apply-display-name",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            full_name: fullName,
            qr_path: filePath,
          }),
        }
      );

      // ΑΠΟΣΤΟΛΗ EMAIL ΜΕ ΤΟ QR
      const qrUrl = `https://yezofyfuitlebwjdffwb.supabase.co/storage/v1/object/public/qr-bucket/${filePath}`;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          "https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/send-qr-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ qrUrl }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          console.error("❌ Email send error:", errData);
        } else {
          console.log("📧 QR email sent!");
        }
      } catch (e) {
        console.error("❌ Failed to send qr email:", e);
      }
    }, "image/png");
  }, 300);
}

function showResetForm() {
  document.getElementById("resetForm").style.display = "block";
}

async function sendResetLink() {
  const email = document.getElementById("resetEmail").value.trim();
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset.html",
  });

  if (error) {
    console.error("Reset email error:", error);
    alert("Failed to send reset link.");
    return;
  }

  alert("Reset email sent! Check your inbox.");
}

// profile | My papers------------------------------------------------------------------------------------------

let currentUserId = null;

async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    alert("Please log in.");
    window.location.href = "loginregister.html";
    return;
  }
  currentUserId = session.user.id;
  loadDocs();
}

async function uploadDoc() {
  const file = document.getElementById("fileInput").files[0];
  const title = document.getElementById("titleInput").value.trim();
  const description = document.getElementById("descInput").value.trim();

  if (!file || !currentUserId) {
    alert("Please fill all fields.");
    return;
  }

  const allowedExtensions = ["pdf", "ppt", "pptx"];
  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    alert("Please upload a PDF, PPT or PPTX file.");
    return;
  }

  const { data: oldDoc, error: fetchError } = await supabase
    .from("docs")
    .select("file_path")
    .eq("userid", currentUserId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking old doc:", fetchError);
    alert("Something went wrong while checking old file.");
    return;
  }

  if (oldDoc?.file_path) {
    await supabase.storage.from("docs-bucket").remove([oldDoc.file_path]);
  }

  const filePath = `${currentUserId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("docs-bucket")
    .upload(filePath, file);

  if (uploadError) {
    alert("Failed to upload file.");
    console.error(uploadError);
    return;
  }

  const { error: upsertError } = await supabase.from("docs").upsert(
    {
      userid: currentUserId, // UID auth
      title,
      description,
      file_path: filePath,
    },
    { onConflict: "userid" }
  );

  if (upsertError) {
    alert("Failed to save document.");
    console.error(upsertError);
    return;
  }

  alert("✅ Your document was uploaded and replaced the old one!");
  document.getElementById("fileInput").value = "";
  document.getElementById("titleInput").value = "";
  document.getElementById("descInput").value = "";

  loadDocs();
}

async function loadDocs() {
  const { data, error } = await supabase
    .from("docs")
    .select("id, created_at, title, description, file_path")
    .eq("userid", currentUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching docs:", error);
    return;
  }

  const list = document.getElementById("docList");
  list.innerHTML = "";

  for (const doc of data) {
    const li = document.createElement("li");
    li.innerHTML = `
          <h4>${doc.title || "Untitled"}</h4>
          <p><em>${doc.description || ""}</em></p>
          <p><small>${new Date(doc.created_at).toLocaleString()}</small></p>
          <button class="paper-btn" onclick="toggleView(this, '${
            doc.file_path
          }')">Preview</button>
          <div class="preview-container" style="display:none; margin-top:10px;"></div>
        `;
    list.appendChild(li);
  }
}

async function toggleView(button, filePath) {
  const container = button.parentElement.querySelector(".preview-container");

  if (container.style.display === "none") {
    const { data, error } = await supabase.storage
      .from("docs-bucket")
      .createSignedUrl(filePath, 300);

    if (error) {
      console.error("URL Error:", error);
      return;
    }

    const url = data.signedUrl;
    const ext = filePath.split(".").pop().toLowerCase();

    let html = "";
    if (ext === "pdf") {
      html = `<embed src="${url}" type="application/pdf" width="680px" height="380px" style="border:1px solid #ccc;" />`;
    } else {
      html = `<a href="${url}" target="_blank">Download File</a>`;
    }

    container.innerHTML = html;
    container.style.display = "block";
    button.textContent = "Hide";
  } else {
    container.style.display = "none";
    button.textContent = "Preview";
  }
}

async function deleteDoc(filePath, docId) {
  const { error: storageError } = await supabase.storage
    .from("docs-bucket")
    .remove([filePath]);

  if (storageError) {
    alert("Failed to delete file.");
    return;
  }

  const { error: deleteError } = await supabase
    .from("docs")
    .delete()
    .eq("id", docId);

  if (deleteError) {
    alert("Failed to delete paper");
    return;
  }

  alert("Paper deleted successfully.");
  loadDocs();
}

function openTab(tabId, tabElement) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  tabElement.classList.add("active");

  const indicator = document.querySelector(".tab-indicator");
  const tabRect = tabElement.getBoundingClientRect();
  const containerRect = tabElement.parentElement.getBoundingClientRect();
  const offsetLeft = tabRect.left - containerRect.left;

  indicator.style.transform = `translateX(${offsetLeft}px)`;
  indicator.style.width = `${tabRect.width}px`;

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  const target = document.getElementById(tabId);
  setTimeout(() => {
    target.classList.add("active");
  }, 50);

  if (tabId === "mypapers") {
    loadDocs();
  }
}

// Profile | pr--------------------------------------------------------------------------------------------------

async function loadProfileQR(userId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const qrPath = user.user_metadata?.qr_path;
  if (!qrPath) return;

  const { data: qrData } = supabase.storage
    .from("qr-bucket")
    .getPublicUrl(qrPath);

  const qrDiv = document.getElementById("qrcode");
  qrDiv.innerHTML = `<img src="${qrData.publicUrl}" width="150" alt="QR Code" />`;
}

async function deleteUserAccount() {
  if (!confirm("Are you sure you want to delete your account?")) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session.user.id;
  const user = session.user;

  const qrPath = user.user_metadata?.qr_path;

  const { data: docs } = await supabase
    .from("docs")
    .select("file_path")
    .eq("userid", userId);
  const docPaths = docs.map((doc) => doc.file_path);

  if (docPaths.length > 0)
    await supabase.storage.from("docs-bucket").remove(docPaths);

  if (qrPath) await supabase.storage.from("qr-bucket").remove([qrPath]);

  await supabase.from("docs").delete().eq("userid", userId);

  await supabase.from("profiles").delete().eq("id", userId);

  await fetch(
    "https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/quick-endpoint",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }
  );

  alert("Your account has been deleted.");
  await logout();
  window.location.href = "loginregister.html";
}

function downloadQR() {
  const img = document.querySelector("#qrcode img");
  if (!img) return;
  const link = document.createElement("a");
  link.href = img.src;
  link.download = "Hellenic_DefTech_qr.png";
  link.click();
}

// LOGS

function logPageVisit(pageName = window.location.pathname.split("/").pop()) {
  fetch("https://yezofyfuitlebwjdffwb.supabase.co/functions/v1/log-visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: pageName }),
  }).catch((err) => console.error("Log error:", err));
}
