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
let manageData = [];
let managePage = 1;
const MANAGE_PAGE_SIZE = 30;

async function loadManagePage() {
    await loadBaseData();
    populateSelect('add-student', allStudents, 'studentId', 'name', false);
    populateSelect('add-course', allCourses, 'courseId', 'courseName', false);
    populateSelect('m-filter-student', allStudents, 'studentId', 'name');
    populateSelect('m-filter-course', allCourses, 'courseId', 'courseName');

    const typeSel = document.getElementById('add-type');
    typeSel.innerHTML = '';
    ['LOGIN','COURSE_ACCESS','RESOURCE_BROWSE','VIDEO_WATCH','QUIZ_SUBMIT','HOMEWORK_SUBMIT'].forEach(t => {
        typeSel.innerHTML += `<option value="${t}">${t}</option>`;
    });
    const resSel = document.getElementById('add-resource');
    resSel.innerHTML = '<option value="">无</option>';
    allResources.forEach(r => {
        resSel.innerHTML += `<option value="${r.resourceId}">${r.resourceId} - ${r.resourceName}</option>`;
    });

    const mTypeSel = document.getElementById('m-filter-type');
    mTypeSel.innerHTML = '<option value="">全部类型</option>';
    ['LOGIN','COURSE_ACCESS','RESOURCE_BROWSE','VIDEO_WATCH','QUIZ_SUBMIT','HOMEWORK_SUBMIT'].forEach(t => {
        mTypeSel.innerHTML += `<option value="${t}">${t}</option>`;
    });

    try {
        const resp = await api('/api/behavior/table-name');
        if (resp.data) document.getElementById('hbase-table-name').textContent = resp.data;
    } catch(e) {}

    loadManageData();
    renderStudentTable();
    renderCourseTable();
}

async function loadManageData() {
    const resp = await api('/api/behavior/search');
    manageData = resp.data || [];
    applyManageFilter();
}

function applyManageFilter() {
    const sid = document.getElementById('m-filter-student').value;
    const cid = document.getElementById('m-filter-course').value;
    const type = document.getElementById('m-filter-type').value;
    let filtered = manageData;
    if (sid) filtered = filtered.filter(b => b.studentId === sid);
    if (cid) filtered = filtered.filter(b => b.courseId === cid);
    if (type) filtered = filtered.filter(b => b.behaviorType === type);
    document.getElementById('m-count').textContent = '共 ' + filtered.length + ' 条';
    renderExcelTable(filtered, 1);
}

function renderExcelTable(data, page) {
    managePage = page;
    const tbody = document.querySelector('#excel-table tbody');
    const start = (page - 1) * MANAGE_PAGE_SIZE;
    const slice = data.slice(start, start + MANAGE_PAGE_SIZE);

    tbody.innerHTML = slice.map((b, i) => {
        const idx = start + i + 1;
        const dt = b.timestamp ? new Date(b.timestamp).toLocaleString('zh-CN', {hour12:false}) : '-';
        return `<tr data-rk="${b.rowKey}">
            <td class="rowidx">${idx}</td>
            <td class="rowkey-cell" title="${b.rowKey}">${b.rowKey.substring(0,35)}...</td>
            <td class="editable" data-field="student_id" data-val="${b.studentId}">${getStudentName(b.studentId)}</td>
            <td class="editable" data-field="course_id" data-val="${b.courseId}">${getCourseName(b.courseId)}</td>
            <td class="editable" data-field="behavior_type" data-val="${b.behaviorType}">${behaviorBadge(b.behaviorType)}</td>
            <td>${dt}</td>
            <td class="editable" data-field="device" data-val="${b.device||''}">${b.device||'-'}</td>
            <td class="editable" data-field="status" data-val="${b.status||''}">${b.status||'-'}</td>
            <td class="editable" data-field="score" data-val="${b.score!=null?b.score:''}">${b.score!=null?b.score:'-'}</td>
            <td class="editable" data-field="duration" data-val="${b.duration!=null?b.duration:''}">${b.duration!=null?b.duration+'s':'-'}</td>
            <td>
                <button class="btn btn-sm" onclick="editRow(this)">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRow(this)">删除</button>
            </td>
        </tr>`;
    }).join('');

    // Pager
    const totalPages = Math.ceil(data.length / MANAGE_PAGE_SIZE);
    const pager = document.getElementById('pager-manage');
    pager.innerHTML = '';
    for (let i = 1; i <= Math.min(totalPages, 15); i++) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm' + (i === page ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => renderExcelTable(data, i);
        pager.appendChild(btn);
    }

    // Cell click to edit
    tbody.querySelectorAll('td.editable').forEach(td => {
        td.addEventListener('dblclick', () => startCellEdit(td));
    });
}

function startCellEdit(td) {
    if (td.querySelector('input, select')) return;
    const field = td.dataset.field;
    const val = td.dataset.val;
    const rowKey = td.closest('tr').dataset.rk;

    let html;
    if (field === 'student_id') {
        html = `<select class="cell-select" onchange="saveCell(this,'${rowKey}','${field}')">
            ${allStudents.map(s => `<option value="${s.studentId}" ${val===s.studentId?'selected':''}>${s.studentId} - ${s.name}</option>`).join('')}
        </select>`;
    } else if (field === 'course_id') {
        html = `<select class="cell-select" onchange="saveCell(this,'${rowKey}','${field}')">
            ${allCourses.map(c => `<option value="${c.courseId}" ${val===c.courseId?'selected':''}>${c.courseId} - ${c.courseName}</option>`).join('')}
        </select>`;
    } else if (field === 'device') {
        html = `<select class="cell-select" onchange="saveCell(this,'${rowKey}','${field}')">
            <option ${val==='PC-Chrome'?'selected':''}>PC-Chrome</option>
            <option ${val==='PC-Firefox'?'selected':''}>PC-Firefox</option>
            <option ${val==='Android'?'selected':''}>Android</option>
            <option ${val==='iOS'?'selected':''}>iOS</option>
            <option ${val==='iPad'?'selected':''}>iPad</option>
        </select>`;
    } else if (field === 'status') {
        html = `<select class="cell-select" onchange="saveCell(this,'${rowKey}','${field}')">
            <option ${val==='completed'?'selected':''}>completed</option>
            <option ${val==='success'?'selected':''}>success</option>
            <option ${val==='submitted'?'selected':''}>submitted</option>
            <option ${val==='start'?'selected':''}>start</option>
            <option ${val==='end'?'selected':''}>end</option>
            <option ${val==='enter'?'selected':''}>enter</option>
            <option ${val==='leave'?'selected':''}>leave</option>
            <option ${val==='viewed'?'selected':''}>viewed</option>
        </select>`;
    } else if (field === 'behavior_type') {
        html = `<select class="cell-select" onchange="saveCell(this,'${rowKey}','${field}')">
            <option ${val==='LOGIN'?'selected':''}>LOGIN</option>
            <option ${val==='COURSE_ACCESS'?'selected':''}>COURSE_ACCESS</option>
            <option ${val==='RESOURCE_BROWSE'?'selected':''}>RESOURCE_BROWSE</option>
            <option ${val==='VIDEO_WATCH'?'selected':''}>VIDEO_WATCH</option>
            <option ${val==='QUIZ_SUBMIT'?'selected':''}>QUIZ_SUBMIT</option>
            <option ${val==='HOMEWORK_SUBMIT'?'selected':''}>HOMEWORK_SUBMIT</option>
        </select>`;
    } else if (field === 'score' || field === 'duration') {
        html = `<input class="cell-input" type="number" value="${val}" onblur="saveCell(this,'${rowKey}','${field}')" onkeydown="if(event.key==='Enter')saveCell(this,'${rowKey}','${field}')">`;
    } else {
        html = `<input class="cell-input" value="${val||''}" onblur="saveCell(this,'${rowKey}','${field}')" onkeydown="if(event.key==='Enter')saveCell(this,'${rowKey}','${field}')">`;
    }
    td.innerHTML = html;
    td.querySelector('input,select').focus();
}

async function saveCell(el, rowKey, field) {
    let value = el.value;
    if (field === 'score' && value) value = parseFloat(value).toString();
    if (field === 'duration' && value) value = parseInt(value).toString();
    const resp = await api('/api/behavior/' + encodeURIComponent(rowKey), {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
    });
    if (resp.code === 200) {
        applyManageFilter();
    } else {
        alert('更新失败: ' + resp.message);
        applyManageFilter();
    }
}

function editRow(btn) {
    const td = btn.closest('tr').querySelector('td.editable');
    if (td) startCellEdit(td);
}

async function deleteRow(btn) {
    const rowKey = btn.closest('tr').dataset.rk;
    if (!confirm('确定删除该记录？')) return;
    const resp = await api('/api/behavior/' + encodeURIComponent(rowKey), { method: 'DELETE' });
    if (resp.code === 200) applyManageFilter();
    else alert('删除失败: ' + resp.message);
}

document.getElementById('m-btn-search').addEventListener('click', applyManageFilter);
document.getElementById('m-btn-refresh').addEventListener('click', loadManageData);
document.getElementById('m-filter-student').addEventListener('change', applyManageFilter);
document.getElementById('m-filter-course').addEventListener('change', applyManageFilter);
document.getElementById('m-filter-type').addEventListener('change', applyManageFilter);

document.getElementById('m-btn-stu-refresh').addEventListener('click', renderStudentTable);
document.getElementById('m-btn-crs-refresh').addEventListener('click', renderCourseTable);

async function renderStudentTable() {
    await loadBaseData();
    const tbody = document.querySelector('#excel-students tbody');
    tbody.innerHTML = allStudents.map((s, i) => `
        <tr data-id="${s.studentId}">
            <td class="rowidx">${i+1}</td>
            <td class="cell-locked" title="${s.studentId}">${s.studentId}</td>
            <td class="editable" data-field="name" data-val="${s.name}">${s.name}</td>
            <td class="editable" data-field="major" data-val="${s.major}">${s.major}</td>
            <td class="editable" data-field="className" data-val="${s.className}">${s.className}</td>
            <td class="editable" data-field="email" data-val="${s.email}">${s.email||'-'}</td>
            <td class="editable" data-field="enrollmentYear" data-val="${s.enrollmentYear}">${s.enrollmentYear||'-'}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.studentId}')">删除</button></td>
        </tr>
    `).join('');

    tbody.querySelectorAll('td.editable').forEach(td => {
        td.addEventListener('dblclick', () => startStudentEdit(td));
    });
}

function startStudentEdit(td) {
    if (td.querySelector('input')) return;
    const field = td.dataset.field;
    const val = td.dataset.val || '';
    const rowId = td.closest('tr').dataset.id;

    let html;
    if (field === 'major') {
        html = `<select class="cell-select" onchange="saveStudentCell(this,'${rowId}','${field}')">
            <option ${val==='计算机科学'?'selected':''}>计算机科学</option>
            <option ${val==='软件工程'?'selected':''}>软件工程</option>
            <option ${val==='数据科学'?'selected':''}>数据科学</option>
            <option ${val==='人工智能'?'selected':''}>人工智能</option>
            <option ${val==='网络安全'?'selected':''}>网络安全</option>
        </select>`;
    } else if (field === 'className') {
        html = `<select class="cell-select" onchange="saveStudentCell(this,'${rowId}','${field}')">
            <option ${val==='2023级1班'?'selected':''}>2023级1班</option>
            <option ${val==='2023级2班'?'selected':''}>2023级2班</option>
            <option ${val==='2024级1班'?'selected':''}>2024级1班</option>
            <option ${val==='2024级2班'?'selected':''}>2024级2班</option>
        </select>`;
    } else if (field === 'enrollmentYear') {
        html = `<select class="cell-select" onchange="saveStudentCell(this,'${rowId}','${field}')">
            <option ${val==='2023'?'selected':''}>2023</option>
            <option ${val==='2024'?'selected':''}>2024</option>
            <option ${val==='2025'?'selected':''}>2025</option>
        </select>`;
    } else {
        html = `<input class="cell-input" value="${val}" onblur="saveStudentCell(this,'${rowId}','${field}')" onkeydown="if(event.key==='Enter')saveStudentCell(this,'${rowId}','${field}')">`;
    }
    td.innerHTML = html;
    td.querySelector('input,select').focus();
}

async function saveStudentCell(el, id, field) {
    const val = el.value;
    const s = allStudents.find(s => s.studentId === id);
    if (!s) return;
    s[field] = val;
    const resp = await api('/api/base/students/' + id, {
        method: 'PUT', body: JSON.stringify(s)
    });
    if (resp.code === 200) renderStudentTable();
    else alert('更新失败: ' + resp.message);
}

async function deleteStudent(id) {
    if (!confirm('确定删除学生 ' + id + '？')) return;
    const resp = await api('/api/base/students/' + id, { method: 'DELETE' });
    if (resp.code === 200) renderStudentTable();
    else alert('删除失败: ' + resp.message);
}

document.getElementById('m-btn-stu-add').addEventListener('click', async () => {
    const id = prompt('请输入学生编号（如 S0022）：');
    if (!id) return;
    const name = prompt('请输入姓名：');
    if (!name) return;
    const resp = await api('/api/base/students', {
        method: 'POST',
        body: JSON.stringify({ studentId: id, name: name, major: '计算机科学', className: '2024级1班', email: id.toLowerCase()+'@edu.cn', enrollmentYear: '2024' })
    });
    if (resp.code === 200) renderStudentTable();
    else alert('新增失败: ' + resp.message);
});

// ==================== Course Excel ====================

async function renderCourseTable() {
    await loadBaseData();
    const tbody = document.querySelector('#excel-courses tbody');
    tbody.innerHTML = allCourses.map((c, i) => `
        <tr data-id="${c.courseId}">
            <td class="rowidx">${i+1}</td>
            <td class="cell-locked" title="${c.courseId}">${c.courseId}</td>
            <td class="editable" data-field="courseName" data-val="${c.courseName}">${c.courseName}</td>
            <td class="editable" data-field="teacher" data-val="${c.teacher}">${c.teacher}</td>
            <td class="editable" data-field="department" data-val="${c.department}">${c.department}</td>
            <td class="editable" data-field="credit" data-val="${c.credit}">${c.credit}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteCourse('${c.courseId}')">删除</button></td>
        </tr>
    `).join('');

    tbody.querySelectorAll('td.editable').forEach(td => {
        td.addEventListener('dblclick', () => startCourseEdit(td));
    });
}

function startCourseEdit(td) {
    if (td.querySelector('input, select')) return;
    const field = td.dataset.field;
    const val = td.dataset.val || '';
    const rowId = td.closest('tr').dataset.id;

    let html;
    if (field === 'department') {
        html = `<select class="cell-select" onchange="saveCourseCell(this,'${rowId}','${field}')">
            <option ${val==='计算机学院'?'selected':''}>计算机学院</option>
            <option ${val==='信息学院'?'selected':''}>信息学院</option>
            <option ${val==='数学学院'?'selected':''}>数学学院</option>
        </select>`;
    } else if (field === 'credit') {
        html = `<select class="cell-select" onchange="saveCourseCell(this,'${rowId}','${field}')">
            <option ${val==1?'selected':''}>1</option>
            <option ${val==2?'selected':''}>2</option>
            <option ${val==3?'selected':''}>3</option>
            <option ${val==4?'selected':''}>4</option>
            <option ${val==5?'selected':''}>5</option>
        </select>`;
    } else {
        html = `<input class="cell-input" value="${val}" onblur="saveCourseCell(this,'${rowId}','${field}')" onkeydown="if(event.key==='Enter')saveCourseCell(this,'${rowId}','${field}')">`;
    }
    td.innerHTML = html;
    td.querySelector('input,select').focus();
}

async function saveCourseCell(el, id, field) {
    const val = el.value;
    const c = allCourses.find(c => c.courseId === id);
    if (!c) return;
    if (field === 'credit') c[field] = parseInt(val);
    else c[field] = val;
    const resp = await api('/api/base/courses/' + id, {
        method: 'PUT', body: JSON.stringify(c)
    });
    if (resp.code === 200) renderCourseTable();
    else alert('更新失败: ' + resp.message);
}

async function deleteCourse(id) {
    if (!confirm('确定删除课程 ' + id + '？')) return;
    const resp = await api('/api/base/courses/' + id, { method: 'DELETE' });
    if (resp.code === 200) renderCourseTable();
    else alert('删除失败: ' + resp.message);
}

document.getElementById('m-btn-crs-add').addEventListener('click', async () => {
    const id = prompt('请输入课程号（如 C006）：');
    if (!id) return;
    const name = prompt('请输入课程名：');
    if (!name) return;
    const resp = await api('/api/base/courses', {
        method: 'POST',
        body: JSON.stringify({ courseId: id, courseName: name, teacher: '待分配', department: '计算机学院', credit: 3 })
    });
    if (resp.code === 200) renderCourseTable();
    else alert('新增失败: ' + resp.message);
});

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
    if (resp.code === 200) {
        alert('写入成功！RowKey: ' + resp.data);
        loadManageData();
    } else alert('写入失败: ' + resp.message);
});

// ============================================================
// Initial Load
// ============================================================
(async () => {
    await loadBaseData();
    loadDashboard();
})();
