// ----------------------
// Supabase setup
// ----------------------
const SUPABASE_URL = "https://jlipdvlisaljkraswxku.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaXBkdmxpc2FsamtyYXN3eGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzMzNjAsImV4cCI6MjA3OTk0OTM2MH0.KK6bv8aqGJPkURYY6SOB29cclLn9aJiORdArwINGMhI";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ----------------------
// INITIAL LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  loadPosts(); // always load posts, public
  document.getElementById('new-post-form').style.display = 'none'; // hide new post form initially
});

// ----------------------
// ADMIN LOGIN
// ----------------------
async function adminLogin() {
  const email = prompt("Enter admin email:");
  const password = prompt("Enter admin password:");

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  currentUser = data.user;
  alert("Logged in as admin!");
  
  // Show new post link/form
  document.getElementById('new-post-form').style.display = 'block';
  document.querySelector("a[href='#'][onclick='showNewPostForm()']").style.display = 'inline';
}

// ----------------------
// SHOW NEW POST FORM (Optional click)
function showNewPostForm() {
  if (!currentUser) return alert("Login first!");
  document.getElementById('new-post-form').style.display = 'block';
}

// ----------------------
// CREATE NEW POST
// ----------------------
async function newPost() {
  if (!currentUser) return alert("Admin login required!");

  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();

  if (!title || !content) return alert("Title and content required!");

  await db.from("posts").insert({ title, content });

  // Clear input
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';

  loadPosts(); // reload posts
}

// ----------------------
// LOAD POSTS
// ----------------------
async function loadPosts() {
  const { data: posts } = await db.from("posts").select("*").order("created_at", { ascending: false });
  const container = document.querySelector(".posts");
  container.innerHTML = '';

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
  const countEl = document.querySelector(`#like-count-${postId}`);
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
  document.querySelector(`#cname-${postId}`).value = '';
  document.querySelector(`#ctext-${postId}`).value = '';
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
