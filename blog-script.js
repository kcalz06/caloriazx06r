/* Basic JS for single-author blog: likes, comments, simple admin posting */

// Like buttons
function toggleLike(id) {
  const key = `like-${id}`;
  const liked = localStorage.getItem(key) === "true";
  localStorage.setItem(key, !liked);
  document.querySelector(`#like-${id}`).textContent = !liked ? "♥ Liked" : "♡ Like";
}

// Restore like states on load
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-like-id]").forEach(btn => {
    const id = btn.getAttribute("data-like-id");
    const liked = localStorage.getItem(`like-${id}`) === "true";
    btn.textContent = liked ? "♥ Liked" : "♡ Like";
  });
});

// Comments with timestamps + editing
function submitComment(postId) {
  const textarea = document.querySelector(`#comment-input-${postId}`);
  const text = textarea.value.trim();
  if (!text) return;

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

  const list = document.querySelector(`#comments-${postId}`);
  const div = document.createElement("div");
  div.className = "comment";

  const id = Date.now();

  div.setAttribute("data-comment-id", id);
  div.innerHTML = `
    <div class="comment-text">${text}</div>
    <div class="comment-meta">Posted on ${dateStr}</div>
    <button onclick="editComment(${postId}, ${id})">Edit</button>
  `;

  list.appendChild(div);
  textarea.value = "";
}

function editComment(postId, commentId) {
  const div = document.querySelector(`[data-comment-id='${commentId}']`);
  const textEl = div.querySelector('.comment-text');
  const metaEl = div.querySelector('.comment-meta');

  const current = textEl.textContent;
  const updated = prompt("Edit your comment:", current);
  if (!updated) return;

  textEl.textContent = updated;

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  metaEl.textContent = `Edited on ${dateStr}`;
}

// Simple admin posting (client-side only)
function newPost() {
  const pass = prompt("Enter admin password:");
  if (pass !== "letmein") return alert("Incorrect password");

  const title = prompt("Post title:");
  const body = prompt("Post body:");
  if (!title || !body) return;

  const container = document.querySelector(".posts");

  const wrapper = document.createElement("div");
  wrapper.className = "post";
  const id = Date.now();

  wrapper.innerHTML = `
    <div class="post-meta">Posted by You • Just now</div>
    <div class="post-title">${title}</div>
    <div class="post-body">${body}</div>

    <div class="controls">
      <button id="like-${id}" data-like-id="${id}" onclick="toggleLike(${id})">♡ Like</button>
      <button onclick="document.querySelector('#comment-box-${id}').style.display='block'">💬 Comment</button>
    </div>

    <div class="comment-box" id="comment-box-${id}" style="display:none;">
      <textarea id="comment-input-${id}" placeholder="Write a comment..."></textarea>
      <button onclick="submitComment(${id})">Post</button>
    </div>
    <div class="comments-list" id="comments-${id}"></div>
  `;

  container.prepend(wrapper);
}
