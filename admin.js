// ----------------------
// Supabase setup
// ----------------------
const SUPABASE_URL = "https://jlipdvlisaljkraswxku.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaXBkdmxpc2FsamtyYXN3eGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzMzNjAsImV4cCI6MjA3OTk0OTM2MH0.KK6bv8aqGJPkURYY6SOB29cclLn9aJiORdArwINGMhI"; 
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ----------------------
// Initialize Quill
// ----------------------
const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Write your post here...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['link', 'image'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['clean']
    ]
  }
});

// ----------------------
// ADMIN LOGIN
// ----------------------
async function adminLogin() {
  const email = document.getElementById('admin-email')?.value.trim();
  const password = document.getElementById('admin-pass')?.value;

  if (!email || !password) return alert("Email and password required");

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentUser = data.user;
    alert("Logged in as admin!");

    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('new-post-form').style.display = 'block';
  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

// ----------------------
// CREATE NEW POST
// ----------------------
async function newPost() {
  if (!currentUser) return alert("Admin login required!");

  const title = document.getElementById('post-title').value.trim();
  const content = quill.root.innerHTML.trim();

  if (!title || !content) return alert("Title and content are required");

  try {
    await db.from("posts").insert({ title, content });

    // Reset input & Quill
    document.getElementById('post-title').value = '';
    quill.setContents([]);

    // Change publish button
    const publishBtn = document.getElementById('publish-btn');
    publishBtn.textContent = 'Published!';
    publishBtn.classList.add('published');
  } catch (err) {
    console.error(err);
    alert("Failed to publish post");
  }
}

// ----------------------
// NEW POST BUTTON
// ----------------------
document.getElementById('new-post-btn')?.addEventListener('click', () => {
  document.getElementById('post-title').value = '';
  quill.setContents([]);

  const publishBtn = document.getElementById('publish-btn');
  publishBtn.textContent = 'Publish';
  publishBtn.classList.remove('published');
});

// ----------------------
// BUTTON EVENTS
// ----------------------
document.getElementById('login-btn')?.addEventListener('click', adminLogin);
document.getElementById('publish-btn')?.addEventListener('click', newPost);

// ----------------------
// Expose functions globally (optional)
// ----------------------
window.adminLogin = adminLogin;
window.newPost = newPost;
