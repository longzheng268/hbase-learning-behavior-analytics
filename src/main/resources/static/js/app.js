// ============================================================
// 学习行为数据分析系统 - 前端逻辑
// ============================================================

const API = '';
const chartTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#8b8fa7' },
    axisLine: { lineStyle: { color: '#2d3148' } },
    splitLine: { lineStyle: { color: '#2d3148' } }
};

const colorPalette = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa','#f472b6','#60a5fa','#4ade80','#fbbf24','#fb923c'];

let allStudents = [], allCourses = [], allResources = [];
let behaviorCache = [];

// ============================================================
// Page Navigation
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('page-' + item.dataset.page).classList.add('active');
        loadPageData(item.dataset.page);
    });
});

function loadPageData(page) {
    switch(page) {
        case 'dashboard': loadDashboard(); break;
        case 'behaviors': loadBehaviors(); break;
        case 'query': loadQueryPage(); break;
        case 'students': loadStudentPage(); break;
        case 'statistics': loadStatistics(); break;
        case 'manage': loadManagePage(); break;
    }
}

// ============================================================
// API Helper
// ============================================================
async function api(path, options = {}) {
    const resp = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    return resp.json();
}

async function loadBaseData() {
    const [s, c, r] = await Promise.all([
        api('/api/base/students'), api('/api/base/courses'), api('/api/base/resources')
    ]);
    allStudents = s.data || [];
    allCourses = c.data || [];
    allResources = r.data || [];
}

function populateSelect(id, items, valueField, labelField, includeEmpty = true) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const first = sel.options[0];
    sel.innerHTML = '';
    if (includeEmpty && first) sel.appendChild(first);
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valueField];
        opt.textContent = item[valueField] + ' - ' + item[labelField];
        sel.appendChild(opt);
    });
}

function formatDate(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { hour12: false });
}

function behaviorBadge(type) {
    const map = {
        'LOGIN': 'login', 'COURSE_ACCESS': 'course', 'RESOURCE_BROWSE': 'resource',
        'VIDEO_WATCH': 'video', 'QUIZ_SUBMIT': 'quiz', 'HOMEWORK_SUBMIT': 'homework'
    };
    const nameMap = {
        'LOGIN': '登录', 'COURSE_ACCESS': '课程访问', 'RESOURCE_BROWSE': '资源浏览',
        'VIDEO_WATCH': '视频学习', 'QUIZ_SUBMIT': '练习提交', 'HOMEWORK_SUBMIT': '作业提交'
    };
    return `<span class="badge badge-${map[type] || 'login'}">${nameMap[type] || type}</span>`;
}

function getStudentName(id) {
    const s = allStudents.find(s => s.studentId === id);
    return s ? s.name : id;
}

function getCourseName(id) {
    const c = allCourses.find(c => c.courseId === id);
    return c ? c.courseName : id;
}

// ============================================================
// Init Data
// ============================================================
document.getElementById('btn-init').addEventListener('click', async () => {
    const status = document.getElementById('init-status');
    status.textContent = '正在初始化...';
    status.style.color = '#f59e0b';
    try {
        const resp = await api('/api/init?days=30', { method: 'POST' });
        if (resp.code === 200) {
            status.textContent = '✅ 初始化完成！';
            status.style.color = '#22c55e';
            await loadBaseData();
            loadDashboard();
        } else {
            status.textContent = '❌ ' + resp.message;
            status.style.color = '#ef4444';
        }
    } catch(e) {
        status.textContent = '❌ 连接失败，请检查后端服务';
        status.style.color = '#ef4444';
    }
});

// ============================================================
// Dashboard
// ============================================================
async function loadDashboard() {
    await loadBaseData();
    document.getElementById('stat-students').textContent = allStudents.length;
    document.getElementById('stat-courses').textContent = allCourses.length;
    document.getElementById('stat-resources').textContent = allResources.length;

    // Load behavior count
    try {
        const resp = await api('/api/behavior/search');
        const behaviors = resp.data || [];
        document.getElementById('stat-behaviors').textContent = behaviors.length;
    } catch(e) { document.getElementById('stat-behaviors').textContent = 'N/A'; }

    // Charts
    loadDailyTrend();
    loadHourlyDistribution();
    loadStudentRanking();
    loadCourseRanking();
}

async function loadDailyTrend() {
    const resp = await api('/api/stats/daily-trend');
    if (resp.code !== 200 || !resp.data) return;
    const dates = Object.keys(resp.data).sort();
    const values = dates.map(d => resp.data[d]);

    const chart = echarts.init(document.getElementById('chart-daily'));
    chart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value', ...chartTheme.splitLine },
        series: [{
            type: 'line', data: values, smooth: true,
            lineStyle: { color: '#6366f1', width: 2 },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(99,102,241,0.3)' },
                { offset: 1, color: 'rgba(99,102,241,0.02)' }
            ])},
            itemStyle: { color: '#6366f1' }
        }]
    });
    window.addEventListener('resize', () => chart.resize());
}

async function loadHourlyDistribution() {
    const resp = await api('/api/stats/hourly-distribution');
    if (resp.code !== 200 || !resp.data) return;
    const hours = Array.from({length: 24}, (_, i) => i + ':00');
    const values = hours.map((_, i) => resp.data[i] || 0);

    const chart = echarts.init(document.getElementById('chart-hourly'));
    chart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: hours },
        yAxis: { type: 'value' },
        series: [{
            type: 'bar', data: values,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#818cf8' },
                    { offset: 1, color: '#6366f1' }
                ]),
                borderRadius: [4, 4, 0, 0]
            }
        }]
    });
    window.addEventListener('resize', () => chart.resize());
}

async function loadStudentRanking() {
    const resp = await api('/api/stats/student-ranking');
    if (resp.code !== 200 || !resp.data) return;
    const top10 = resp.data.slice(0, 10);
    const names = top10.map(r => getStudentName(r.studentId));
    const values = top10.map(r => r.count);

    const chart = echarts.init(document.getElementById('chart-student-rank'));
    chart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: names.reverse(), axisLabel: { fontSize: 12 } },
        series: [{
            type: 'bar', data: values.reverse(),
            itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
            barWidth: 20
        }]
    });
    window.addEventListener('resize', () => chart.resize());
}

async function loadCourseRanking() {
    const resp = await api('/api/stats/course-ranking');
    if (resp.code !== 200 || !resp.data) return;
    const names = resp.data.map(r => getCourseName(r.courseId));
    const values = resp.data.map(r => r.count);

    const chart = echarts.init(document.getElementById('chart-course-rank'));
    chart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: ['35%', '65%'],
            data: names.map((n, i) => ({ name: n, value: values[i] })),
            label: { color: '#8b8fa7', fontSize: 12 },
            itemStyle: { borderRadius: 6, borderColor: '#222638', borderWidth: 2 },
            color: colorPalette
        }]
    });
    window.addEventListener('resize', () => chart.resize());
}

// ============================================================
// Behaviors Page
// ============================================================
const PAGE_SIZE = 20;
let currentBehaviorPage = 1;

async function loadBehaviors() {
    const resp = await api('/api/behavior/search');
    behaviorCache = resp.data || [];
    renderBehaviorTable(behaviorCache, currentBehaviorPage);
    populateBehaviorTypeFilter();
}

function renderBehaviorTable(data, page) {
    const tbody = document.querySelector('#table-behaviors tbody');
    const start = (page - 1) * PAGE_SIZE;
    const slice = data.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = slice.map(b => `
        <tr>
            <td title="${b.rowKey}">${b.rowKey.substring(0, 30)}...</td>
            <td>${getStudentName(b.studentId)}</td>
            <td>${getCourseName(b.courseId)}</td>
            <td>${behaviorBadge(b.behaviorType)}</td>
            <td>${formatDate(b.timestamp)}</td>
            <td>${b.device || '-'}</td>
            <td>${b.score != null ? '分数:'+b.score : ''}${b.duration != null ? '时长:'+b.duration+'s' : ''}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteBehavior('${b.rowKey}')">删除</button></td>
        </tr>
    `).join('');

    // Pager
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    const pager = document.getElementById('pager-behaviors');
    pager.innerHTML = '';
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm' + (i === page ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => { currentBehaviorPage = i; renderBehaviorTable(data, i); };
        pager.appendChild(btn);
    }
}

function populateBehaviorTypeFilter() {
    const sel = document.getElementById('filter-type');
    sel.innerHTML = '<option value="">全部类型</option>';
    ['LOGIN','COURSE_ACCESS','RESOURCE_BROWSE','VIDEO_WATCH','QUIZ_SUBMIT','HOMEWORK_SUBMIT'].forEach(t => {
        sel.innerHTML += `<option value="${t}">${t}</option>`;
    });
}

document.getElementById('filter-type').addEventListener('change', (e) => {
    const type = e.target.value;
    const filtered = type ? behaviorCache.filter(b => b.behaviorType === type) : behaviorCache;
    currentBehaviorPage = 1;
    renderBehaviorTable(filtered, 1);
});

document.getElementById('btn-refresh-behaviors').addEventListener('click', loadBehaviors);

async function deleteBehavior(rowKey) {
    if (!confirm('确定删除该记录？')) return;
    const resp = await api('/api/behavior/' + encodeURIComponent(rowKey), { method: 'DELETE' });
    if (resp.code === 200) loadBehaviors();
    else alert('删除失败: ' + resp.message);
}

// ============================================================
// Query Page
// ============================================================
async function loadQueryPage() {
    await loadBaseData();
    populateSelect('q-student', allStudents, 'studentId', 'name');
    populateSelect('q-course', allCourses, 'courseId', 'courseName');
    const typeSel = document.getElementById('q-type');
    typeSel.innerHTML = '<option value="">全部类型</option>';
    ['LOGIN','COURSE_ACCESS','RESOURCE_BROWSE','VIDEO_WATCH','QUIZ_SUBMIT','HOMEWORK_SUBMIT'].forEach(t => {
        typeSel.innerHTML += `<option value="${t}">${t}</option>`;
    });
}

document.getElementById('btn-search').addEventListener('click', async () => {
    const studentId = document.getElementById('q-student').value;
    const courseId = document.getElementById('q-course').value;
    const behaviorType = document.getElementById('q-type').value;
    const startInput = document.getElementById('q-start').value;
    const endInput = document.getElementById('q-end').value;

    let url = '/api/behavior/search?';
    const params = [];
    if (studentId) params.push('studentId=' + studentId);
    if (courseId) params.push('courseId=' + courseId);
    if (startInput) params.push('startTime=' + new Date(startInput).getTime());
    if (endInput) params.push('endTime=' + new Date(endInput).getTime());
    url += params.join('&');

    const resp = await api(url);
    let data = resp.data || [];

    // Client-side filter for behavior type (backend search doesn't have type filter)
    if (behaviorType) {
        data = data.filter(b => b.behaviorType === behaviorType);
    }

    const tbody = document.querySelector('#table-query tbody');
    tbody.innerHTML = data.map(b => `
        <tr>
            <td title="${b.rowKey}">${b.rowKey.substring(0, 28)}...</td>
            <td>${getStudentName(b.studentId)}</td>
            <td>${getCourseName(b.courseId)}</td>
            <td>${behaviorBadge(b.behaviorType)}</td>
            <td>${formatDate(b.timestamp)}</td>
            <td>${b.status || '-'} ${b.score != null ? '分数:'+b.score : ''} ${b.duration != null ? '时长:'+b.duration+'s' : ''}</td>
        </tr>
    `).join('');
});

document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('q-student').value = '';
    document.getElementById('q-course').value = '';
    document.getElementById('q-type').value = '';
    document.getElementById('q-start').value = '';
    document.getElementById('q-end').value = '';
    document.querySelector('#table-query tbody').innerHTML = '';
});

// ============================================================
// Student Profile Page
// ============================================================
async function loadStudentPage() {
    await loadBaseData();
    populateSelect('student-select', allStudents, 'studentId', 'name', false);
}

document.getElementById('student-select').addEventListener('change', async (e) => {
    const sid = e.target.value;
    if (!sid) return;
    const student = allStudents.find(s => s.studentId === sid);
    const resp = await api('/api/behavior/student/' + sid);
    const behaviors = resp.data || [];

    document.getElementById('student-profile').style.display = 'block';
    document.getElementById('sp-name').textContent = student ? student.name : sid;
    document.getElementById('sp-detail').textContent = student ?
        `${student.studentId} | ${student.major} | ${student.className}` : sid;
    document.getElementById('sp-total').textContent = behaviors.length;
    document.getElementById('sp-login').textContent = behaviors.filter(b => b.behaviorType === 'LOGIN').length;
    document.getElementById('sp-video').textContent = behaviors.filter(b => b.behaviorType === 'VIDEO_WATCH').length;

    // Behavior type pie
    const typeCounts = {};
    behaviors.forEach(b => { typeCounts[b.behaviorType] = (typeCounts[b.behaviorType] || 0) + 1; });
    const typeChart = echarts.init(document.getElementById('chart-stu-types'));
    typeChart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: '60%',
            data: Object.entries(typeCounts).map(([k, v]) => ({ name: k, value: v })),
            label: { color: '#8b8fa7' },
            color: colorPalette,
            itemStyle: { borderRadius: 4 }
        }]
    });

    // Daily trend line
    const dayCounts = {};
    const sdf = d => new Date(d).toLocaleDateString('zh-CN');
    behaviors.forEach(b => { const d = sdf(b.timestamp); dayCounts[d] = (dayCounts[d] || 0) + 1; });
    const dates = Object.keys(dayCounts).sort();
    const trendChart = echarts.init(document.getElementById('chart-stu-trend'));
    trendChart.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value' },
        series: [{
            type: 'line', data: dates.map(d => dayCounts[d]),
            smooth: true, lineStyle: { color: '#22c55e' },
            areaStyle: { color: 'rgba(34,197,94,0.1)' },
            itemStyle: { color: '#22c55e' }
        }]
    });

    window.addEventListener('resize', () => { typeChart.resize(); trendChart.resize(); });
});

// ============================================================
// Statistics Page
// ============================================================
async function loadStatistics() {
    await loadBaseData();

    // Login count bar
    const loginResp = await api('/api/stats/login-count');
    if (loginResp.code === 200 && loginResp.data) {
        const entries = Object.entries(loginResp.data).sort((a,b) => b[1]-a[1]);
        const chart = echarts.init(document.getElementById('chart-login'));
        chart.setOption({
            ...chartTheme,
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: entries.map(e => getStudentName(e[0])) },
            yAxis: { type: 'value' },
            series: [{
                type: 'bar', data: entries.map(e => e[1]),
                itemStyle: { color: '#6366f1', borderRadius: [4,4,0,0] }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    // Video duration
    const videoResp = await api('/api/stats/video-duration');
    if (videoResp.code === 200 && videoResp.data) {
        const entries = Object.entries(videoResp.data);
        const chart = echarts.init(document.getElementById('chart-video'));
        chart.setOption({
            ...chartTheme,
            tooltip: { trigger: 'item', formatter: p => p.name + ': ' + Math.round(p.value/60) + ' 分钟' },
            series: [{
                type: 'pie', radius: ['35%', '65%'],
                data: entries.map(e => ({ name: getCourseName(e[0]), value: e[1] })),
                label: { color: '#8b8fa7', formatter: '{b}\n{d}%' },
                color: colorPalette,
                itemStyle: { borderRadius: 6, borderColor: '#222638', borderWidth: 2 }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    // Resource browse
    const resResp = await api('/api/stats/resource-browse');
    if (resResp.code === 200 && resResp.data) {
        const entries = Object.entries(resResp.data).sort((a,b) => b[1]-a[1]).slice(0, 10);
        const resNames = entries.map(e => {
            const r = allResources.find(r => r.resourceId === e[0]);
            return r ? r.resourceName : e[0];
        });
        const chart = echarts.init(document.getElementById('chart-resource'));
        chart.setOption({
            ...chartTheme,
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: resNames.reverse(), axisLabel: { fontSize: 11 } },
            series: [{
                type: 'bar', data: entries.map(e => e[1]).reverse(),
                itemStyle: { color: '#f59e0b', borderRadius: [0,4,4,0] },
                barWidth: 18
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    // Submit count
    const subResp = await api('/api/stats/submit-count');
    if (subResp.code === 200 && subResp.data) {
        const nameMap = { 'QUIZ_SUBMIT': '练习提交', 'HOMEWORK_SUBMIT': '作业提交' };
        const entries = Object.entries(subResp.data);
        const chart = echarts.init(document.getElementById('chart-submit'));
        chart.setOption({
            ...chartTheme,
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie', radius: '60%',
                data: entries.map(e => ({ name: nameMap[e[0]] || e[0], value: e[1] })),
                label: { color: '#8b8fa7' },
                color: ['#60a5fa', '#a78bfa'],
                itemStyle: { borderRadius: 4 }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    // Inactive students
    const inactResp = await api('/api/stats/inactive-students?days=7');
    const container = document.getElementById('inactive-list');
    if (inactResp.code === 200 && inactResp.data && inactResp.data.length > 0) {
        container.innerHTML = inactResp.data.map(id =>
            `<span class="tag">${getStudentName(id)} (${id})</span>`
        ).join('');
    } else {
        container.innerHTML = '<p class="no-warning">✅ 所有学生最近7天内均有学习活动</p>';
    }
}

// ============================================================
// Manage Page
// ============================================================
async function loadManagePage() {
    await loadBaseData();
    populateSelect('add-student', allStudents, 'studentId', 'name', false);
    populateSelect('add-course', allCourses, 'courseId', 'courseName', false);
    const typeSel = document.getElementById('add-type');
    typeSel.innerHTML = '';
    ['LOGIN','COURSE_ACCESS','RESOURCE_BROWSE','VIDEO_WATCH','QUIZ_SUBMIT','HOMEWORK_SUBMIT'].forEach(t => {
        typeSel.innerHTML += `<option value="${t}">${t}</option>`;
    });
    try {
        const resp = await api('/api/behavior/table-name');
        if (resp.data) document.getElementById('hbase-table-name').textContent = resp.data;
    } catch(e) {}
}

// Add behavior form
document.getElementById('form-add-behavior').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('add-student').value;
    const courseId = document.getElementById('add-course').value;
    const type = document.getElementById('add-type').value;
    const resourceId = document.getElementById('add-resource').value || null;
    const device = document.getElementById('add-device').value || 'PC';
    const val = document.getElementById('add-value').value;
    const status = document.getElementById('add-status').value;

    const behavior = {
        studentId, courseId, behaviorType: type,
        timestamp: Date.now(), device, status, resourceId
    };
    if (type === 'VIDEO_WATCH' && val) behavior.duration = parseInt(val);
    if ((type === 'QUIZ_SUBMIT' || type === 'HOMEWORK_SUBMIT') && val) behavior.score = parseFloat(val);

    const resp = await api('/api/behavior', { method: 'POST', body: JSON.stringify(behavior) });
    if (resp.code === 200) alert('✅ 行为记录已写入 HBase！\nRowKey: ' + resp.data);
    else alert('❌ 写入失败: ' + resp.message);
});

// Delete form
document.getElementById('form-delete').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rowKey = document.getElementById('del-rowkey').value;
    if (!confirm('确定删除 RowKey: ' + rowKey + ' ?')) return;
    const resp = await api('/api/behavior/' + encodeURIComponent(rowKey), { method: 'DELETE' });
    if (resp.code === 200) { alert('✅ 已删除'); document.getElementById('del-rowkey').value = ''; }
    else alert('❌ 删除失败: ' + resp.message);
});

// Update form
document.getElementById('form-update').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rowKey = document.getElementById('upd-rowkey').value;
    const field = document.getElementById('upd-field').value;
    const value = document.getElementById('upd-value').value;
    const resp = await api('/api/behavior/' + encodeURIComponent(rowKey), {
        method: 'PUT', body: JSON.stringify({ [field]: value })
    });
    if (resp.code === 200) alert('✅ 更新成功');
    else alert('❌ 更新失败: ' + resp.message);
});

// ============================================================
// Initial Load
// ============================================================
(async () => {
    await loadBaseData();
    loadDashboard();
})();
