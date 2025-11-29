// ----------------------
// Supabase setup
// ----------------------
const SUPABASE_URL = "https://jlipdvlisaljkraswxku.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ----------------------
// SESSION CHECK (persist login)
// ----------------------
async function initSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    document.getElementById('new-post-form')?.style.display = 'block';
    document.getElementById('admin-login')?.style.display = 'none';
  }
}

// Listen for auth changes
db.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    currentUser = session.user;
    document.getElementById('new-post-form')?.style.display = 'block';
    document.getElementById('admin-login')?.style.display = 'none';
  } else {
    currentUser = null;
    document.getElementById('new-post-form')?.style.display = 'none';
    document.getElementById('admin-login')?.style.display = 'block';
  }
});

// ----------------------
// UTILITY
// ----------------------
function toggleCommentBox(postId) {
  const box = document.getElementById(`comment-box-${postId}`);
  if (!box) return;
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// ----------------------
// LOAD POSTS
// ----------------------
async function loadPosts(limit = null) {
  try {
    let query = db.from("posts").select("*").order("created_at", { ascending: false });
    if (limit) query = query.limit(limit);

    const { data: posts, error } = await query;
    if (error) throw error;

    const container = document.getElementById("posts");
    if (!container) return;
    container.innerHTML = '';

    posts.forEach(post => {
      const wrapper = document.createElement("div");
      wrapper.className = "post";
      wrapper.id = `post-${post.id}`;

      wrapper.innerHTML = `
        <div class="post-meta">${new Date(post.created_at).toLocaleString()}</div>

        <!-- Make title clickable -->
        <div class="post-title">
          <a href="post.html?id=${post.id}">${post.title}</a>
        </div>

        <div class="post-body">${post.content}</div>

        <div class="controls">
          <button id="like-${post.id}" onclick="likePost('${post.id}')">♡ Like</button>
          <span id="like-count-${post.id}" class="like-count"></span>
          <button onclick="toggleCommentBox('${post.id}')">💬 Comment</button>
        </div>

        <div class="comment-box" id="comment-box-${post.id}" style="display:none;">
          <input id="cname-${post.id}" placeholder="Name (optional)">
          <textarea id="ctext-${post.id}" placeholder="Write a comment..."></textarea>
          <button onclick="addComment('${post.id}')">Post</button>
        </div>

        <div class="comments-list" id="comments-${post.id}"></div>
      `;

      container.appendChild(wrapper);

      loadLikes(post.id);
      loadComments(post.id);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}


// ----------------------
// LIKE SYSTEM
// ----------------------
async function likePost(postId) {
  try {
    const userIp = await fetch("https://api64.ipify.org?format=json")
      .then(r => r.json())
      .then(r => r.ip);

    const { error } = await db.from("likes").insert({ post_id: postId, user_ip: userIp });
    if (error) throw error;

    loadLikes(postId);
  } catch (err) {
    console.error(err);
  }
}

async function loadLikes(postId) {
  try {
    const { count, error } = await db.from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) throw error;

    const countEl = document.getElementById(`like-count-${postId}`);
    if (countEl) countEl.textContent = `${count || 0} likes`;
  } catch (err) {
    console.error(err);
  }
}

// ----------------------
// COMMENT SYSTEM
// ----------------------
async function addComment(postId) {
  try {
    const name = document.getElementById(`cname-${postId}`)?.value || "Anonymous";
    const comment = document.getElementById(`ctext-${postId}`)?.value.trim();
    if (!comment) return alert("Comment cannot be empty");

    const { error } = await db.from("comments").insert({ post_id: postId, name, comment });
    if (error) throw error;

    document.getElementById(`cname-${postId}`).value = '';
    document.getElementById(`ctext-${postId}`).value = '';

    loadComments(postId);
  } catch (err) {
    console.error(err);
  }
}

async function loadComments(postId) {
  try {
    const { data, error } = await db.from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const container = document.getElementById(`comments-${postId}`);
    container.innerHTML = (data || []).map(c => `<p><strong>${c.name}</strong>: ${c.comment}</p>`).join('');
  } catch (err) {
    console.error(err);
  }
}

// ----------------------
// ADMIN LOGIN
// ----------------------
async function adminLogin() {
  const email = document.getElementById('admin-email')?.value;
  const password = document.getElementById('admin-pass')?.value;

  if (!email || !password) return alert("Email and password required");

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;

    currentUser = data.user;
    alert("Logged in as admin!");

    document.getElementById('new-post-form')?.style.display = 'block';
    document.getElementById('admin-login')?.style.display = 'none';

    // Immediately refresh posts
    loadPosts();
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

  const title = document.getElementById('post-title')?.value.trim();
  const content = document.getElementById('post-content')?.value.trim();

  if (!title || !content) return alert("Title and content are required");

  try {
    const { data, error } = await db.from("posts").insert({ title, content });
    if (error) throw error;

    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';

    // Refresh posts immediately
    loadPosts();
  } catch (err) {
    console.error(err);
  }
}

// ----------------------
// GLOBAL FUNCTIONS
// ----------------------
window.adminLogin = adminLogin;
window.newPost = newPost;
window.loadPosts = loadPosts;
window.likePost = likePost;
window.addComment = addComment;
window.toggleCommentBox = toggleCommentBox;

// ----------------------
// INITIAL PAGE LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  await initSession(); // check for saved admin session
  loadPosts();         // load posts for everyone
});
