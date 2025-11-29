/* Persistent JS for single-author blog: likes + comments saved in localStorage */

// ----------------------
// LIKE SYSTEM (Persistent)
// ----------------------
function toggleLike(postId) {
  const key = `likes-${postId}`;
  let count = parseInt(localStorage.getItem(key) || "0");
  const userKey = `liked-${postId}`;
  const liked = localStorage.getItem(userKey) === "true";

  if (liked) {
    count--;
    localStorage.setItem(userKey, "false");
  } else {
    count++;
    localStorage.setItem(userKey, "true");
  }

  localStorage.setItem(key, count);
  renderLikes(postId);
}

function renderLikes(postId) {
  const count = localStorage.getItem(`likes-${postId}`) || 0;
  const liked = localStorage.getItem(`liked-${postId}`) === "true";

  const btn = document.querySelector(`#like-${postId}`);
  const countEl = document.querySelector(`#like-count-${postId}`);

  if (btn) btn.textContent = liked ? "♥ Liked" : "♡ Like";
  if (countEl) countEl.textContent = `${count} likes`;
}

// --------------------------------
// COMMENT SYSTEM (Persistent)
// --------------------------------
function loadComments(postId) {
  return JSON.parse(localStorage.getItem(`comments-${postId}`) || "[]");
}

function saveComments(postId, arr) {
  localStorage.setItem(`comments-${postId}`, JSON.stringify(arr));
}

function renderComments(postId) {
  const container = document.querySelector(`#comments-${postId}`);
  if (!container) return;

  const comments = loadComments(postId);
  container.innerHTML = "";

  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "comment";
    div.setAttribute("data-comment-id", c.id);

    div.innerHTML = `
      <div class="comment-text">${c.text}</div>
      <div class="comment-meta">${c.date}</div>
      <button onclick="editComment(${postId}, ${c.id})">Edit</button>
    `;

    container.appendChild(div);
  });
}

function submitComment(postId) {
  const textarea = document.querySelector(`#comment-input-${postId}`);
  const text = textarea.value.trim();
  if (!text) return;

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

  const newComment = {
    id: Date.now(),
    text,
    date: `Posted on ${dateStr}`
  };

  const comments = loadComments(postId);
  comments.push(newComment);
  saveComments(postId, comments);

  textarea.value = "";
  renderComments(postId);
}

function editComment(postId, commentId) {
  const comments = loadComments(postId);
  const c = comments.find(x => x.id === commentId);
  if (!c) return;

  const updated = prompt("Edit your comment:", c.text);
  if (!updated) return;

  c.text = updated;

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  c.date = `Edited on ${dateStr}`;

  saveComments(postId, comments);
  renderComments(postId);
}

// ----------------------
// ADMIN NEW POST
// ----------------------
function newPost() {
  const pass = prompt("Enter admin password:");
  if (pass !== "letmein") return alert("Incorrect password");

  const title = prompt("Post title:");
  const body = prompt("Post body:");
  if (!title || !body) return;

  const container = document.querySelector(".posts");
  const id = Date.now();

  const wrapper = document.createElement("div");
  wrapper.className = "post";
  wrapper.id = `post-${id}`;

  wrapper.innerHTML = `
    <div class="post-meta">Posted by You • Just now</div>
    <div class="post-title">${title}</div>
    <div class="post-body">${body}</div>

    <div class="controls">
      <button id="like-${id}" data-like-id="${id}" onclick="toggleLike(${id})">♡ Like</button>
      <span id="like-count-${id}" class="like-count"></span>
      <button onclick="document.querySelector('#comment-box-${id}').style.display='block'">💬 Comment</button>
    </div>

    <div class="comment-box" id="comment-box-${id}" style="display:none;">
      <textarea id="comment-input-${id}" placeholder="Write a comment..."></textarea>
      <button onclick="submitComment(${id})">Post</button>
    </div>

    <div class="comments-list" id="comments-${id}"></div>
  `;

  container.prepend(wrapper);

  renderLikes(id);
  renderComments(id);
}

// ----------------------
// INITIAL PAGE LOAD
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-like-id]").forEach(btn => {
    const id = btn.getAttribute("data-like-id");
    renderLikes(id);
    renderComments(id);
  });
});
