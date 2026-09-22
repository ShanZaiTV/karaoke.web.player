let player = null;
let currentVideo = null;
let queue = JSON.parse(localStorage.getItem("karaokeQueue") || "[]");

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function saveQueue() {
  localStorage.setItem("karaokeQueue", JSON.stringify(queue));
  renderQueue();
}

function renderQueue() {
  const el = $("queue");
  if (!queue.length) {
    el.innerHTML = '<div class="empty">Your queue is empty.</div>';
    return;
  }
  el.innerHTML = queue.map((item, i) => `
    <div class="queue-item">
      <span title="${escapeHtml(item.title)}">${i + 1}. ${escapeHtml(item.title)}</span>
      <button class="remove" onclick="removeFromQueue(${i})">×</button>
    </div>
  `).join("");
}

window.removeFromQueue = function(index) {
  queue.splice(index, 1);
  saveQueue();
};

function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player("player", {
    videoId: "",
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => $("apiStatus").textContent = "YouTube player ready",
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerStateChange(event) {
  // Automatically play the next queued song when the current video ends.
  if (event.data === YT.PlayerState.ENDED && queue.length) {
    const next = queue.shift();
    saveQueue();
    playVideo(next);
  }
}

function playVideo(item) {
  currentVideo = item;
  if (!player) return;
  player.loadVideoById(item.id);
  $("nowTitle").textContent = item.title;
  $("nowChannel").textContent = item.channel;
  $("addCurrentBtn").disabled = false;
}

$("addCurrentBtn").addEventListener("click", () => {
  if (!currentVideo) return;
  if (!queue.some(x => x.id === currentVideo.id)) {
    queue.push(currentVideo);
    saveQueue();
  }
});

$("clearQueueBtn").addEventListener("click", () => {
  queue = [];
  saveQueue();
});

$("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("searchInput").value.trim();
  if (!q) return;

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY") {
    $("results").innerHTML =
      '<div class="empty">Add your YouTube Data API v3 key in config.js first.</div>';
    return;
  }

  $("results").innerHTML = '<div class="empty">Searching YouTube…</div>';

  const params = new URLSearchParams({
    part: "snippet",
    q: q + " karaoke",
    type: "video",
    maxResults: "12",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    regionCode: "PH",
    key: YOUTUBE_API_KEY
  });

  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/search?" + params.toString()
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "YouTube API request failed.");
    }

    $("resultCount").textContent = `${data.items?.length || 0} results`;

    if (!data.items?.length) {
      $("results").innerHTML = '<div class="empty">No karaoke videos found.</div>';
      return;
    }

    $("results").innerHTML = data.items.map(item => {
      const video = {
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url ||
                   item.snippet.thumbnails?.default?.url
      };

      return `
        <article class="result" data-video='${JSON.stringify(video).replace(/'/g, "&#39;")}'>
          <img class="thumb" src="${escapeHtml(video.thumbnail)}" alt="">
          <div class="result-info">
            <div class="result-title">${escapeHtml(video.title)}</div>
            <div class="result-channel">${escapeHtml(video.channel)}</div>
            <div class="result-actions">
              <button class="play-btn">▶ Play</button>
              <button class="small-btn queue-btn">＋ Queue</button>
            </div>
          </div>
        </article>`;
    }).join("");

    document.querySelectorAll(".result").forEach(card => {
      const video = JSON.parse(card.dataset.video);
      card.querySelector(".play-btn").addEventListener("click", e => {
        e.stopPropagation();
        playVideo(video);
        window.scrollTo({top: 0, behavior: "smooth"});
      });
      card.querySelector(".queue-btn").addEventListener("click", e => {
        e.stopPropagation();
        if (!queue.some(x => x.id === video.id)) {
          queue.push(video);
          saveQueue();
        }
      });
      card.addEventListener("click", () => {
        playVideo(video);
        window.scrollTo({top: 0, behavior: "smooth"});
      });
    });
  } catch (err) {
    console.error(err);
    $("results").innerHTML =
      `<div class="empty">Error: ${escapeHtml(err.message)}</div>`;
  }
});

renderQueue();
loadYouTubeAPI();
