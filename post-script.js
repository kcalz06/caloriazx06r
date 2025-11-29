// ----------------------
// Supabase setup
// ----------------------
const SUPABASE_URL = "https://jlipdvlisaljkraswxku.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaXBkdmxpc2FsamtyYXN3eGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzMzNjAsImV4cCI6MjA3OTk0OTM2MH0.KK6bv8aqGJPkURYY6SOB29cclLn9aJiORdArwINGMhI"; 
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------
// GET POST ID FROM URL
// ----------------------
function getPostId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// ----------------------
// LOAD SINGLE POST
// ----------------------
async function loadPost(postId) {
  try {
    const { data: posts } = await db
      .from("posts")
      .select("*")
      .eq("id", postId);

    if (!posts || posts.length === 0) {
      document.getElementById("post-container").innerHTML = "<p>Post not found.</p>";
      return;
    }

    const post = posts[0];
    const container = document.getElementById("post-container");

    container.innerHTML = `
      <div class="post-meta">${new Date(post.created_at).toLocaleString()}</div>
      <div class="post-title">${post.title}</div>
      <div class="post-body">${post.content}</div>

      <div class="controls">
        <button id="like-${post.id}">♡ Like</button>
        <span id="like-count-${post.id}" class="like-count"></span>
        <button id="comment-btn-${post.id}">💬 Comment</button>
      </div>

      <div class="comment-box" id="comment-box-${post.id}" style="display:none;">
        <input id="cname-${post.id}" placeholder="Name (optional)">
        <textarea id="ctext-${post.id}" placeholder="Write a comment..."></textarea>
        <button id="post-comment-${post.id}">Post</button>
      </div>

      <div class="comments-list" id="comments-${post.id}"></div>
    `;

    // ----------------------
    // Event listeners
    // ----------------------
    document.getElementById(`like-${post.id}`).addEventListener('click', async () => {
      try {
        const userIp = await fetch("https://api64.ipify.org?format=json")
          .then(r => r.json())
          .then(r => r.ip);

        await db.from("likes").insert({ post_id: post.id, user_ip: userIp });
        loadLikes(post.id);
      } catch (err) {
        console.error(err);
      }
    });

    document.getElementById(`comment-btn-${post.id}`).addEventListener('click', () => {
      const box = document.getElementById(`comment-box-${post.id}`);
      box.style.display = box.style.display === "none" ? "block" : "none";
    });

    document.getElementById(`post-comment-${post.id}`).addEventListener('click', async () => {
      const name = document.getElementById(`cname-${post.id}`).value || "Anonymous";
      const comment = document.getElementById(`ctext-${post.id}`).value.trim();
      if (!comment) return alert("Comment cannot be empty");

      try {
        await db.from("comments").insert({ post_id: post.id, name, comment });
        document.getElementById(`cname-${post.id}`).value = '';
        document.getElementById(`ctext-${post.id}`).value = '';
        loadComments(post.id);
      } catch (err) {
        console.error(err);
      }
    });

    loadLikes(post.id);
    loadComments(post.id);

  } catch (err) {
    console.error("Error loading post:", err);
  }
}

// ----------------------
// Load likes for a post
// ----------------------
async function loadLikes(postId) {
  const { count } = await db
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  const countEl = document.getElementById(`like-count-${postId}`);
  if (countEl) countEl.textContent = `${count} likes`;
}

// ----------------------
// Load comments for a post
// ----------------------
async function loadComments(postId) {
  const { data } = await db
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const container = document.getElementById(`comments-${postId}`);
  if (container) {
    container.innerHTML = data.map(c => `<p><strong>${c.name}</strong>: ${c.comment}</p>`).join('');
  }
}

// ----------------------
// INITIAL PAGE LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const postId = getPostId();
  if (postId) loadPost(postId);
  else document.getElementById("post-container").innerHTML = "<p>No post selected.</p>";
});
