var API = 'http://localhost:3001';

function showTab(tabName, clickedBtn) {
  var sections = document.querySelectorAll('.tab-section');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.remove('active');
  }
  var buttons = document.querySelectorAll('.tab-btn');
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove('active');
  }
  document.getElementById('tab-' + tabName).classList.add('active');
  clickedBtn.classList.add('active');
}

function formatDate(val) {
  if (val === null || val === undefined) return '—';
  return String(val);
}

function setMsg(id, msg) {
  document.getElementById(id).innerHTML =
    '<p style="color:#888;padding:16px;">' + msg + '</p>';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '—';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadFeed() {
  setMsg('feed-container', 'Loading…');
  fetch(API + '/api/feed')
    .then(function(res) { return res.json(); })
    .then(function(data) { renderFeed(data); })
    .catch(function() {
      setMsg('feed-container', '❌ Could not connect to server.');
    });
}

function renderFeed(data) {
  var container = document.getElementById('feed-container');
  container.innerHTML = '';
  if (!data.length) { setMsg('feed-container', 'No posts found.'); return; }
  for (var i = 0; i < data.length; i++) {
    var post = data[i];
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="card-username">@' + escapeHtml(post.Username) + '</div>' +
      '<div class="card-content">' + escapeHtml(post.Content) + '</div>' +
      '<div class="card-date">📅 ' + formatDate(post.Post_Date) + '</div>' +
      '<div class="card-footer">' +
        '<span>❤️ ' + (post.Likes || 0) + ' Likes</span>' +
        '<span>💬 ' + (post.Comments || 0) + ' Comments</span>' +
      '</div>';
    container.appendChild(card);
  }
}

function loadUsers() {
  var tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:#888;">Loading…</td></tr>';
  fetch(API + '/api/users')
    .then(function(res) { return res.json(); })
    .then(function(data) { renderUsers(data); })
    .catch(function() {
      tbody.innerHTML = '<tr><td colspan="5" style="color:red;">❌ Could not connect to server.</td></tr>';
    });
}

function renderUsers(data) {
  var tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';
  for (var i = 0; i < data.length; i++) {
    var u = data[i];
    var row = document.createElement('tr');
    row.innerHTML =
      '<td><strong>' + escapeHtml(u.Username) + '</strong></td>' +
      '<td>' + escapeHtml(u.Full_Name) + '</td>' +
      '<td>' + escapeHtml(u.Bio) + '</td>' +
      '<td>' + (u.Total_Posts || 0) + '</td>' +
      '<td>' + (u.Followers || 0) + '</td>';
    tbody.appendChild(row);
  }
}

function loadHashtags() {
  setMsg('hashtags-container', 'Loading…');
  fetch(API + '/api/hashtags')
    .then(function(res) { return res.json(); })
    .then(function(data) { renderHashtags(data); })
    .catch(function() {
      setMsg('hashtags-container', '❌ Could not connect to server.');
    });
}

function renderHashtags(data) {
  var container = document.getElementById('hashtags-container');
  container.innerHTML = '';
  for (var i = 0; i < data.length; i++) {
    var h = data[i];
    var badge = document.createElement('span');
    badge.className = 'hashtag-badge';
    badge.innerHTML = '#' + escapeHtml(h.Tag_Name) + '<span class="badge-count">' + (h.Post_Count || 0) + '</span>';
    container.appendChild(badge);
  }
}

function loadGroups() {
  setMsg('groups-container', 'Loading…');
  fetch(API + '/api/groups')
    .then(function(res) { return res.json(); })
    .then(function(data) { renderGroups(data); })
    .catch(function() {
      setMsg('groups-container', '❌ Could not connect to server.');
    });
}

function renderGroups(data) {
  var container = document.getElementById('groups-container');
  container.innerHTML = '';
  for (var i = 0; i < data.length; i++) {
    var g = data[i];
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="group-name">👥 ' + escapeHtml(g.Group_Name) + '</div>' +
      '<div class="group-desc">' + escapeHtml(g.Description) + '</div>' +
      '<div class="group-members">👤 ' + (g.Members || 0) + ' Members</div>';
    container.appendChild(card);
  }
}

function loadStats() {
  setMsg('stat-boxes', 'Loading…');
  fetch(API + '/api/stats')
    .then(function(res) { return res.json(); })
    .then(function(data) { renderStats(data); })
    .catch(function() {
      setMsg('stat-boxes', '❌ Could not connect to server.');
    });
}

function renderStats(d) {
  renderStatBoxes(d);
  renderChartOverview(d);
  renderChartUsers(d.activeUsers || []);
  renderChartHashtags();
  renderTableActiveUsers(d.activeUsers || []);
  renderTableCommentedPosts(d.commentedPosts || []);
  renderTablePosters(d.posters || []);
  renderTableView(d.viewRows || []);
}

function renderStatBoxes(d) {
  var container = document.getElementById('stat-boxes');
  container.innerHTML = '';
  var numBoxes = [
    { label: 'Total Users',    value: d.Total_Users    },
    { label: 'Total Posts',    value: d.Total_Posts    },
    { label: 'Total Comments', value: d.Total_Comments },
    { label: 'Total Messages', value: d.Total_Messages }
  ];
  for (var i = 0; i < numBoxes.length; i++) {
    var b = numBoxes[i];
    var box = document.createElement('div');
    box.className = 'stat-box';
    box.innerHTML = '<div class="stat-number">' + b.value + '</div><div class="stat-label">' + b.label + '</div>';
    container.appendChild(box);
  }
}

function drawBarChart(canvasId, labels, values, colors) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  || 600;
  canvas.height = canvas.height       || 220;
  var ctx    = canvas.getContext('2d');
  var W      = canvas.width;
  var H      = canvas.height;
  var PAD_L  = 40;
  var PAD_R  = 14;
  var PAD_T  = 20;
  var PAD_B  = 50;
  var chartW = W - PAD_L - PAD_R;
  var chartH = H - PAD_T - PAD_B;
  ctx.clearRect(0, 0, W, H);
  if (!values.length) return;
  var maxVal = Math.max.apply(null, values) || 1;
  var barCount = labels.length;
  var gap      = 8;
  var barW     = (chartW - gap * (barCount + 1)) / barCount;
  ctx.strokeStyle = '#e0e0e0';
  ctx.fillStyle   = '#888';
  ctx.font        = '11px Arial';
  ctx.textAlign   = 'right';
  for (var g = 0; g <= 4; g++) {
    var yVal  = Math.round((maxVal / 4) * g);
    var yPx   = PAD_T + chartH - (chartH * g / 4);
    ctx.beginPath(); ctx.moveTo(PAD_L, yPx); ctx.lineTo(PAD_L + chartW, yPx); ctx.stroke();
    ctx.fillText(yVal, PAD_L - 4, yPx + 4);
  }
  for (var i = 0; i < barCount; i++) {
    var barH    = (values[i] / maxVal) * chartH;
    var x       = PAD_L + gap + i * (barW + gap);
    var y       = PAD_T + chartH - barH;
    var color   = colors ? colors[i % colors.length] : '#2563eb';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle   = '#333';
    ctx.font        = '11px Arial';
    ctx.textAlign   = 'center';
    ctx.fillText(values[i], x + barW / 2, y - 4);
    ctx.fillStyle   = '#555';
    ctx.font        = '10px Arial';
    var lbl = String(labels[i]);
    if (lbl.length > 8) lbl = lbl.substring(0, 7) + '…';
    ctx.fillText(lbl, x + barW / 2, PAD_T + chartH + 16);
  }
}

function drawHBarChart(canvasId, labels, values, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth || 460;
  canvas.height = canvas.height      || 260;
  var ctx   = canvas.getContext('2d');
  var W     = canvas.width;
  var H     = canvas.height;
  var PAD_L = 90;
  var PAD_R = 40;
  var PAD_T = 16;
  var PAD_B = 16;
  var chartW = W - PAD_L - PAD_R;
  var chartH = H - PAD_T - PAD_B;
  ctx.clearRect(0, 0, W, H);
  if (!values.length) return;
  var maxVal  = Math.max.apply(null, values) || 1;
  var count   = labels.length;
  var barH    = Math.floor((chartH - (count + 1) * 6) / count);
  if (barH < 8)  barH = 8;
  if (barH > 32) barH = 32;
  for (var i = 0; i < count; i++) {
    var y   = PAD_T + i * (barH + 6);
    var bW  = (values[i] / maxVal) * chartW;
    ctx.fillStyle  = '#333';
    ctx.textAlign  = 'right';
    ctx.font      = '11px Arial';
    var lbl = String(labels[i]);
    if (lbl.length > 12) lbl = lbl.substring(0, 11) + '…';
    ctx.fillText(lbl, PAD_L - 6, y + barH / 2 + 4);
    ctx.fillStyle = color || '#2563eb';
    ctx.fillRect(PAD_L, y, bW, barH);
    ctx.fillStyle  = '#333';
    ctx.textAlign  = 'left';
    ctx.fillText(values[i], PAD_L + bW + 4, y + barH / 2 + 4);
  }
}

function renderChartOverview(d) {
  var labels = ['Users', 'Posts', 'Comments', 'Messages'];
  var values = [Number(d.Total_Users||0), Number(d.Total_Posts||0), Number(d.Total_Comments||0), Number(d.Total_Messages||0)];
  var colors = ['#1e2a45', '#2563eb', '#16a34a', '#dc2626'];
  drawBarChart('chart-overview', labels, values, colors);
}

function renderChartUsers(activeUsers) {
  var top  = activeUsers.slice(0, 8);
  var labels = []; var values = [];
  for (var i = 0; i < top.length; i++) {
    labels.push(top[i].Username);
    values.push(Number(top[i].Total_Posts || 0));
  }
  drawHBarChart('chart-users', labels, values, '#1e2a45');
}

function renderChartHashtags() {
  fetch(API + '/api/hashtags')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var top    = data.slice(0, 8);
      var labels = []; var values = [];
      for (var i = 0; i < top.length; i++) {
        labels.push('#' + top[i].Tag_Name);
        values.push(Number(top[i].Post_Count || 0));
      }
      var colors = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#854d0e','#1e2a45'];
      drawBarChart('chart-hashtags', labels, values, colors);
    });
}

function renderTableActiveUsers(au) {
  var tbody = document.getElementById('tbody-active-users');
  tbody.innerHTML = '';
  for (var j = 0; j < au.length; j++) {
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(au[j].Username) + '</td><td>' + au[j].Total_Posts + '</td>';
    tbody.appendChild(row);
  }
}

function renderTableCommentedPosts(cp) {
  var tbody = document.getElementById('tbody-commented-posts');
  tbody.innerHTML = '';
  for (var k = 0; k < cp.length; k++) {
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(cp[k].Content) + '</td><td>' + cp[k].Post_Date + '</td>';
    tbody.appendChild(row);
  }
}

function renderTablePosters(pr) {
  var tbody = document.getElementById('tbody-posters');
  tbody.innerHTML = '';
  for (var m = 0; m < pr.length; m++) {
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(pr[m].Username) + '</td>';
    tbody.appendChild(row);
  }
}

function renderTableView(vr) {
  var tbody = document.getElementById('tbody-view');
  tbody.innerHTML = '';
  for (var n = 0; n < vr.length; n++) {
    var v = vr[n];
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + escapeHtml(v.Username) + '</td><td>' + escapeHtml(v.Content) + '</td><td>' + v.Post_Date + '</td><td>' + v.Likes + '</td>';
    tbody.appendChild(row);
  }
}

loadFeed();
loadUsers();
loadHashtags();
loadGroups();
loadStats();
