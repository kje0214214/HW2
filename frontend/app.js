const API_BASE = "/api/diary"; // 백엔드/프론트엔드 통합 라우팅을 위한 상대 경로

// State
let currentDate = new Date(); // 현재 캘린더 구동용
let selectedDateStr = null; // 상세 화면용 날짜 문자열 (YYYY-MM-DD)

// Elements
const appContainer = document.getElementById('app-container');
const calendarView = document.getElementById('calendar-view');
const detailView = document.getElementById('detail-view');
const backBtn = document.getElementById('back-btn');
const headerTitle = document.getElementById('header-title');

const currentMonthYearEl = document.getElementById('current-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const statPositive = document.getElementById('stat-positive');
const statNeutral = document.getElementById('stat-neutral');
const statNegative = document.getElementById('stat-negative');

const detailDateEl = document.getElementById('detail-date');
const emotionEmojiEl = document.getElementById('emotion-emoji');
const diaryContent = document.getElementById('diary-content');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const toastMessage = document.getElementById('toast-message');

// Utility Functions
const padZero = (num) => num.toString().padStart(2, '0');
const formatDateStr = (year, month, day) => `${year}-${padZero(month)}-${padZero(day)}`;
const formatYearMonthStr = (year, month) => `${year}-${padZero(month)}`;

const showToast = (msg) => {
    toastMessage.textContent = msg;
    toastMessage.classList.remove('opacity-0');
    setTimeout(() => toastMessage.classList.add('opacity-0'), 3000);
};

// API Calls
async function fetchMonthlyData(year, month) {
    try {
        const response = await fetch(`${API_BASE}/monthly/${formatYearMonthStr(year, month)}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error("통신 오류", e);
        return [];
    }
}

async function fetchDiary(dateStr) {
    try {
        const response = await fetch(`${API_BASE}/${dateStr}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("로드 실패");
        return await response.json();
    } catch (e) {
        console.error("일기 조회 오류", e);
        return null;
    }
}

async function saveDiary(dateStr, content) {
    try {
        const response = await fetch(`${API_BASE}/${dateStr}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error("저장 실패");
        return await response.json();
    } catch (e) {
        console.error("일기 저장 오류", e);
        throw e;
    }
}

async function deleteDiary(dateStr) {
    try {
        const response = await fetch(`${API_BASE}/${dateStr}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("삭제 실패");
        return true;
    } catch (e) {
        console.error("일기 삭제 오류", e);
        throw e;
    }
}

// Background & Emoji Logic
function applyBackgroundColor(emotion) {
    appContainer.classList.remove('bg-emotion-positive', 'bg-emotion-negative', 'bg-emotion-neutral', 'bg-gray-100');
    
    if (emotion === 'positive') appContainer.classList.add('bg-emotion-positive');
    else if (emotion === 'negative') appContainer.classList.add('bg-emotion-negative');
    else if (emotion === 'neutral') appContainer.classList.add('bg-emotion-neutral');
    else appContainer.classList.add('bg-gray-100');
}

function getEmoji(emotion) {
    if (emotion === 'positive') return '😊';
    if (emotion === 'negative') return '😢';
    if (emotion === 'neutral') return '😐';
    return ''; // none
}

// Calendar Render
async function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    currentMonthYearEl.textContent = `${year}년 ${month}월`;

    // Fetch data
    const diaries = await fetchMonthlyData(year, month);
    
    // Calculate stats
    let pos = 0, neg = 0, neu = 0;
    const diaryMap = {}; // date_string -> emotion
    diaries.forEach(d => {
        diaryMap[d.date] = d.emotion;
        if(d.emotion === 'positive') pos++;
        else if(d.emotion === 'negative') neg++;
        else neu++;
    });

    statPositive.textContent = pos;
    statNegative.textContent = neg;
    statNeutral.textContent = neu;

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Fill empty slots
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        calendarGrid.appendChild(div);
    }

    // Fill days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = formatDateStr(year, month, i);
        const emotion = diaryMap[dateStr];
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day flex flex-col items-center justify-center h-14 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition gap-1';
        
        // 일요일 빨간색, 토요일 파란색
        const curDow = new Date(year, month - 1, i).getDay();
        let colorClass = 'text-gray-700';
        if (curDow === 0) colorClass = 'text-red-500';
        if (curDow === 6) colorClass = 'text-blue-500';

        const numberSpan = document.createElement('span');
        numberSpan.className = `text-sm font-semibold ${colorClass}`;
        numberSpan.textContent = i;
        
        if(year === today.getFullYear() && month === today.getMonth() + 1 && i === today.getDate()) {
            numberSpan.classList.add('bg-purple-500', 'text-white', 'w-6', 'h-6', 'rounded-full', 'flex', 'items-center', 'justify-center');
            numberSpan.classList.remove('text-gray-700', 'text-red-500', 'text-blue-500');
        }

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'text-xs';
        emojiSpan.textContent = getEmoji(emotion) || '・';
        if(!emotion) emojiSpan.classList.add('text-transparent'); // keep layout

        dayDiv.appendChild(numberSpan);
        dayDiv.appendChild(emojiSpan);

        dayDiv.addEventListener('click', () => openDetailView(year, month, i, curDow));

        calendarGrid.appendChild(dayDiv);
    }
}

// Navigation
function openDetailView(year, month, day, dayOfWeek) {
    selectedDateStr = formatDateStr(year, month, day);
    const dows = ['일', '월', '화', '수', '목', '금', '토'];
    
    // UI 초기화
    detailDateEl.textContent = `${year}년 ${month}월 ${day}일 ${dows[dayOfWeek]}요일`;
    diaryContent.value = '';
    emotionEmojiEl.textContent = '';
    emotionEmojiEl.classList.remove('animate-emoji');
    deleteBtn.classList.add('hidden');
    appContainer.classList.remove('bg-emotion-positive', 'bg-emotion-negative', 'bg-emotion-neutral', 'bg-gray-100');
    appContainer.classList.add('bg-gray-100'); // 기본값
    
    loadDiaryDetail();

    // 화면 전환
    calendarView.classList.add('hidden');
    detailView.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    headerTitle.textContent = "일기 쓰기";
}

function closeDetailView() {
    selectedDateStr = null;
    calendarView.classList.remove('hidden');
    detailView.classList.add('hidden');
    backBtn.classList.add('hidden');
    headerTitle.textContent = "나의 감정 일기";
    
    applyBackgroundColor(null); // 메인 화면색은 기본값
    renderCalendar(); // 달력 재렌더링
}

// Detail View Actions
async function loadDiaryDetail() {
    diaryContent.disabled = true; // 로딩중 블록
    const diary = await fetchDiary(selectedDateStr);
    diaryContent.disabled = false;
    
    if (diary) {
        diaryContent.value = diary.content;
        emotionEmojiEl.textContent = getEmoji(diary.emotion);
        applyBackgroundColor(diary.emotion);
        deleteBtn.classList.remove('hidden');
    } else {
        // 일기 없음
        applyBackgroundColor(null);
    }
}

async function handleSave() {
    const text = diaryContent.value.trim();
    if(!text) {
        showToast("내용을 입력해주세요.");
        return;
    }

    loadingIndicator.classList.remove('hidden');
    try {
        const saved = await saveDiary(selectedDateStr, text);
        
        // 결과 UI 업데이트
        applyBackgroundColor(saved.emotion);
        
        emotionEmojiEl.textContent = getEmoji(saved.emotion);
        // 애니메이션 초기화 후 다시 적용
        emotionEmojiEl.classList.remove('animate-emoji');
        void emotionEmojiEl.offsetWidth; // 돔 리플로우
        emotionEmojiEl.classList.add('animate-emoji');
        
        deleteBtn.classList.remove('hidden');
        showToast("저장되었습니다.");
    } catch (e) {
        showToast("저장 중 오류가 발생했습니다.");
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

async function handleDelete() {
    if(!confirm("정말 이 날짜의 일기를 삭제하시겠습니까?")) return;
    
    try {
        await deleteDiary(selectedDateStr);
        diaryContent.value = '';
        emotionEmojiEl.textContent = '';
        applyBackgroundColor(null);
        deleteBtn.classList.add('hidden');
        showToast("삭제되었습니다.");
    } catch (e) {
        showToast("삭제 중 오류가 발생했습니다.");
    }
}

// Event Listeners
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

backBtn.addEventListener('click', closeDetailView);
saveBtn.addEventListener('click', handleSave);
deleteBtn.addEventListener('click', handleDelete);

// Init
window.addEventListener('DOMContentLoaded', () => {
    applyBackgroundColor(null); // 초기 배경색 설정
    renderCalendar();
});
