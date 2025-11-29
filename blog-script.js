// ----------------------
// Supabase setup
// ----------------------
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ----------------------
// ADMIN LOGIN
// ----------------------
async function adminLogin() {
  const email = prompt("Enter admin email:");
  const password = prompt("Enter admin password:");
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  currentUser = data.user;
  alert("Logged in!");
  showNewPostForm();
}

// ----------------------
// CREATE NEW POST
// ----------------------
async function newPost() {
  if (!currentUser) return alert("Admin login required!");
  const title = prompt("Post title:");
  const body = prompt("Post body:");
  if (!title || !body) return;

  await db.from("posts").insert({ title, content: body });
  loadPosts();
}

// ----------------------
// LOAD POSTS
// ----------------------
async function loadPosts() {
  const { data: posts } = await db.from("posts").select("*").order("created_at", { ascending: false });
  const container = document.querySelector(".posts");
  container.innerHTML = "";

  posts.forEach(post => {
    const wrapper = document.createElement("div");
    wrapper.className = "post";
    wrapper.id = `post-${post.id}`;
    wrapper.innerHTML = `
      <div class="post-meta">Posted • ${new Date(post.created_at).toLocaleString()}</div>
      <div class="post-title">${post.title}</div>
      <div class="post-body">${post.content}</div>

      <div class="controls">
        <button id="like-${post.id}" onclick="likePost('${post.id}')">♡ Like</button>
        <span id="like-count-${post.id}" class="like-count"></span>
        <button onclick="toggleCommentBox('${post.id}')">💬 Comment</button>
      </div>

      <div class="comment-box" id="comment-box-${post.id}" style="display:none;">
        <input id="cname-${post.id}" placeholder="Name">
        <textarea id="ctext-${post.id}" placeholder="Write a comment..."></textarea>
        <button onclick="addComment('${post.id}')">Post</button>
      </div>

      <div class="comments-list" id="comments-${post.id}"></div>
    `;
    container.appendChild(wrapper);

    loadLikes(post.id);
    loadComments(post.id);
  });
}

// ----------------------
// LIKE SYSTEM
// ----------------------
async function likePost(postId) {
  const userIp = await fetch("https://api64.ipify.org?format=json").then(r => r.json()).then(r => r.ip);
  await db.from("likes").insert({ post_id: postId, user_ip: userIp });
  loadLikes(postId);
}

async function loadLikes(postId) {
  const { count } = await db.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
  const btn = document.querySelector(`#like-${postId}`);
  const countEl = document.querySelector(`#like-count-${postId}`);
  if (btn) btn.textContent = "♡ Like";
  if (countEl) countEl.textContent = `${count} likes`;
}

// ----------------------
// COMMENT SYSTEM
// ----------------------
async function addComment(postId) {
  const name = document.querySelector(`#cname-${postId}`).value || "Anonymous";
  const comment = document.querySelector(`#ctext-${postId}`).value;
  if (!comment) return alert("Comment cannot be empty");

  await db.from("comments").insert({ post_id: postId, name, comment });
  document.querySelector(`#cname-${postId}`).value = "";
  document.querySelector(`#ctext-${postId}`).value = "";
  loadComments(postId);
}

async function loadComments(postId) {
  const { data } = await db.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  const container = document.querySelector(`#comments-${postId}`);
  container.innerHTML = data.map(c => `<p><strong>${c.name}</strong>: ${c.comment}</p>`).join('');
}

// ----------------------
// HELPERS
// ----------------------
function toggleCommentBox(postId) {
  const box = document.getElementById(`comment-box-${postId}`);
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// ----------------------
// INITIAL LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});
