import { render, h } from "preact";
import { useMemo, useState } from "preact/hooks";
import htm from "htm";

const html = htm.bind(h);

type ModuleStatus = "not-started" | "in-progress" | "completed";

type Module = {
    id: string;
    name: string;
    icon: string;
    description: string;
    longDescription: string;
    highlights: string[];
    status: ModuleStatus;
};

type TimelineTrack = {
    id: string;
    label: string;
    description: string;
    accent: string;
};

type ShotEvent = {
    frame: number;
    label: string;
    track: string;
};

type Shot = {
    id: string;
    title: string;
    summary: string;
    duration: number;
    progress: number;
    keyframes: Record<string, number[]>;
    events: ShotEvent[];
    beatNotes: string[];
    aiSuggestions: string[];
};

type AssistantMessage = {
    role: "assistant" | "user";
    title: string;
    content: string;
    timestamp: string;
};

const navItems = [
    { id: "overview", label: "Tổng quan" },
    { id: "timeline", label: "Timeline" },
    { id: "assets", label: "Tài nguyên" },
    { id: "handoff", label: "Bàn giao" },
];

const modules: Module[] = [
    {
        id: "project-shell",
        name: "Khung dự án",
        icon: "fa-solid fa-diagram-project",
        description: "Thiết lập cấu trúc tập tin Moho và các preset cần thiết.",
        longDescription:
            "Tạo thư mục dự án chuẩn cùng template scene, bảng màu và naming convention thống nhất để mọi thành viên có thể bắt đầu làm việc ngay.",
        highlights: [
            "Sinh tự động cấu trúc thư mục và file .moho ban đầu",
            "Thêm các layer template: camera, nhân vật, ánh sáng",
            "Gợi ý preset render theo chuẩn nhóm",
        ],
        status: "completed",
    },
    {
        id: "story-blocking",
        name: "Story Blocking",
        icon: "fa-solid fa-film",
        description: "Phác thảo chuyển động chính và kiểm tra nhịp cảnh.",
        longDescription:
            "Ghi lại pose chính của nhân vật, đặt timing sơ bộ cho mỗi đoạn diễn và đồng bộ nhịp với lời thoại hoặc nhạc nền.",
        highlights: [
            "Timeline đánh dấu các pose trọng tâm",
            "Checklist tự động để xác nhận nhịp chuyển cảnh",
            "Đồng bộ voice-over hoặc nhạc nền để rà timing",
        ],
        status: "in-progress",
    },
    {
        id: "acting-pass",
        name: "Acting Pass",
        icon: "fa-solid fa-masks-theater",
        description: "Chi tiết biểu cảm và nhấn nhá chuyển động.",
        longDescription:
            "Đi sâu vào diễn xuất: biểu cảm khuôn mặt, mắt, tay và các hành vi phụ để nhân vật trở nên sống động.",
        highlights: [
            "Gợi ý biểu cảm dựa trên cảm xúc câu thoại",
            "So sánh trực quan trước/sau để kiểm tra độ mượt",
            "Nhắc việc giữ tính liên tục giữa các shot",
        ],
        status: "not-started",
    },
    {
        id: "camera-pass",
        name: "Camera Pass",
        icon: "fa-solid fa-video",
        description: "Thiết lập chuyển động và bố cục khung hình.",
        longDescription:
            "Kiểm tra đường đi camera, độ sâu trường ảnh và các điểm focus để đảm bảo người xem theo dõi đúng trọng tâm.",
        highlights: [
            "Đề xuất góc quay thay thế dựa trên moodboard",
            "Theo dõi độ mượt khi camera chuyển cảnh",
            "Nhắc tối ưu thời lượng pan/zoom theo chuẩn",
        ],
        status: "in-progress",
    },
];

const timelineTracks: TimelineTrack[] = [
    {
        id: "blocking",
        label: "Blocking",
        description: "Pose chính và bố cục chuyển động quan trọng.",
        accent: "var(--track-blocking)",
    },
    {
        id: "acting",
        label: "Acting",
        description: "Biểu cảm, timing và nhịp diễn chi tiết.",
        accent: "var(--track-acting)",
    },
    {
        id: "camera",
        label: "Camera",
        description: "Đường đi camera, tiêu cự và nhịp chuyển cảnh.",
        accent: "var(--track-camera)",
    },
    {
        id: "effects",
        label: "Hiệu ứng",
        description: "Những hiệu ứng hỗ trợ và nhấn nhá ánh sáng.",
        accent: "var(--track-effects)",
    },
];

const workspaceShots: Shot[] = [
    {
        id: "S01",
        title: "Thiết lập bối cảnh",
        summary: "Cảnh mở đầu giới thiệu căn phòng nghiên cứu với chuyển động camera nhẹ.",
        duration: 24,
        progress: 0.45,
        keyframes: {
            blocking: [1, 8, 16, 24],
            acting: [6, 14, 22],
            camera: [1, 12, 24],
            effects: [10, 18],
        },
        events: [
            { frame: 1, track: "blocking", label: "Pose trung lập" },
            { frame: 8, track: "blocking", label: "Chạm vào bàn điều khiển" },
            { frame: 16, track: "blocking", label: "Quay sang màn hình" },
            { frame: 6, track: "acting", label: "Biểu cảm tò mò" },
            { frame: 14, track: "acting", label: "Ánh mắt theo dõi AI" },
            { frame: 22, track: "acting", label: "Mỉm cười nhẹ" },
            { frame: 12, track: "camera", label: "Camera dolly-in" },
            { frame: 24, track: "camera", label: "Giữ khung trung" },
            { frame: 10, track: "effects", label: "Glow màn hình" },
            { frame: 18, track: "effects", label: "Light sweep" },
        ],
        beatNotes: [
            "Giới thiệu nhân vật chính đang vận hành hệ thống AI Wan.",
            "Nhấn mạnh thiết bị hologram nổi giữa phòng.",
            "Tạo cảm giác kỳ diệu nhưng vẫn mang tính khoa học.",
        ],
        aiSuggestions: [
            "Giữ chuyển động camera chậm để người xem cảm nhận không gian.",
            "Tăng độ sáng của hologram vào frame 10 để làm điểm nhấn.",
        ],
    },
    {
        id: "S02",
        title: "Giao nhiệm vụ",
        summary: "AI Wan giao nhiệm vụ thông qua giao diện hologram nhiều lớp.",
        duration: 32,
        progress: 0.25,
        keyframes: {
            blocking: [1, 12, 20, 32],
            acting: [8, 16, 28],
            camera: [1, 16, 32],
            effects: [4, 18, 26],
        },
        events: [
            { frame: 12, track: "blocking", label: "Giơ tay tương tác" },
            { frame: 20, track: "blocking", label: "Thả cử chỉ chấp nhận" },
            { frame: 28, track: "acting", label: "Ánh mắt quyết tâm" },
            { frame: 16, track: "camera", label: "Cut sang góc cận" },
            { frame: 26, track: "effects", label: "UI flash" },
        ],
        beatNotes: [
            "Giới thiệu màn hình hologram phân tầng.",
            "Nhân vật tương tác trực tiếp với UI ảo.",
            "Chuyển cảnh kết thúc bằng ánh nhìn quyết tâm.",
        ],
        aiSuggestions: [
            "Thử thêm hiệu ứng parallax nhẹ ở UI để tạo chiều sâu.",
            "Kết hợp tiếng bíp nhỏ khi hologram chuyển trạng thái.",
        ],
    },
    {
        id: "S03",
        title: "Chuẩn bị triển khai",
        summary: "Cảnh cận nhân vật đeo kính và chuẩn bị thiết bị trước khi xuất phát.",
        duration: 28,
        progress: 0.1,
        keyframes: {
            blocking: [4, 14, 24],
            acting: [6, 18, 26],
            camera: [1, 18, 28],
            effects: [10, 22],
        },
        events: [
            { frame: 14, track: "blocking", label: "Đeo kính xong" },
            { frame: 6, track: "acting", label: "Thở sâu" },
            { frame: 22, track: "effects", label: "Glitch nhẹ" },
        ],
        beatNotes: [
            "Tập trung vào chi tiết thiết bị và ánh mắt nhân vật.",
            "Giữ chuyển động tay mượt để thể hiện sự chuyên nghiệp.",
        ],
        aiSuggestions: [
            "Có thể thêm ánh sáng phản chiếu từ kính để tăng cảm xúc.",
        ],
    },
];

const assistantMessages: AssistantMessage[] = [
    {
        role: "assistant",
        title: "AI Wan",
        content: "Chào mừng bạn quay lại! Mình đã chuẩn bị template dự án mới với timeline rỗng để chúng ta bắt đầu từ con số 0.",
        timestamp: "09:12",
    },
    {
        role: "user",
        title: "Bạn",
        content: "Mình muốn dựng phần mở đầu trong hôm nay, ưu tiên blocking và camera nhé.",
        timestamp: "09:15",
    },
    {
        role: "assistant",
        title: "AI Wan",
        content: "Đã ghi chú. Mình sẽ gợi ý keyframe cho shot S01 và chuẩn bị checklist kiểm tra nhịp.",
        timestamp: "09:16",
    },
];

const quickActions = [
    {
        icon: "fa-solid fa-wand-magic-sparkles",
        label: "Tạo scene Moho mới",
        description: "Sinh file .moho với layer camera, nhân vật và ánh sáng chuẩn.",
    },
    {
        icon: "fa-solid fa-clapperboard",
        label: "Xuất bảng phân cảnh",
        description: "Kết hợp shot list với thumbnail để gửi đạo diễn duyệt.",
    },
    {
        icon: "fa-solid fa-microphone-lines",
        label: "Đồng bộ thoại",
        description: "Gắn track thoại làm tham chiếu timing cho từng shot.",
    },
];

const statusLabel: Record<ModuleStatus, string> = {
    "not-started": "Chưa bắt đầu",
    "in-progress": "Đang thực hiện",
    completed: "Hoàn thành",
};

const App = () => {
    const [activeNav, setActiveNav] = useState(navItems[0].id);
    const [selectedModuleId, setSelectedModuleId] = useState(modules[0].id);
    const [selectedShotIndex, setSelectedShotIndex] = useState(0);
    const [activeTrackId, setActiveTrackId] = useState(timelineTracks[0].id);

    const selectedModule = useMemo(
        () => modules.find((module) => module.id === selectedModuleId) ?? modules[0],
        [selectedModuleId]
    );

    const selectedShot = useMemo(
        () => workspaceShots[selectedShotIndex] ?? workspaceShots[0],
        [selectedShotIndex]
    );

    const activeTrack = useMemo(
        () => timelineTracks.find((track) => track.id === activeTrackId) ?? timelineTracks[0],
        [activeTrackId]
    );

    const keyframeSet = useMemo(() => {
        return new Set(selectedShot.keyframes[activeTrack.id] ?? []);
    }, [selectedShot, activeTrack]);

    const frameEvents = useMemo(() => {
        const map = new Map<number, ShotEvent>();
        selectedShot.events
            .filter((event) => event.track === activeTrack.id)
            .forEach((event) => {
                map.set(event.frame, event);
            });
        return map;
    }, [selectedShot, activeTrack]);

    const frames = useMemo(() => {
        return Array.from({ length: selectedShot.duration }, (_, index) => {
            const frameNumber = index + 1;
            return {
                frameNumber,
                hasKeyframe: keyframeSet.has(frameNumber),
                event: frameEvents.get(frameNumber) ?? null,
            };
        });
    }, [selectedShot, keyframeSet, frameEvents]);

    const completionRate = useMemo(() => {
        const sum = workspaceShots.reduce((acc, shot) => acc + shot.progress, 0);
        return Math.round((sum / workspaceShots.length) * 100);
    }, []);

    return html`
        <div className="app-shell">
            <header className="topbar">
                <div className="topbar-left">
                    <div className="brand">
                        <div className="brand-icon"><i className="fa-solid fa-cube"></i></div>
                        <div>
                            <div className="brand-name">Moho AI Wan</div>
                            <div className="brand-tagline">Khởi tạo pipeline hoạt hình từ con số 0</div>
                        </div>
                    </div>
                    <nav className="main-nav">
                        ${navItems.map(
                            (item) => html`
                                <button
                                    key=${item.id}
                                    className=${`nav-item ${item.id === activeNav ? "is-active" : ""}`}
                                    onClick=${() => setActiveNav(item.id)}
                                >
                                    ${item.label}
                                </button>
                            `
                        )}
                    </nav>
                </div>
                <div className="topbar-right">
                    <div className="status-pill">
                        <span className="status-indicator"></span>
                        <span>Bản nháp 0.1</span>
                    </div>
                    <button className="primary-button small">
                        <i className="fa-regular fa-floppy-disk"></i>
                        Lưu snapshot
                    </button>
                </div>
            </header>

            <main className="main-area">
                <section className="hero-section">
                    <div className="hero-content">
                        <span className="hero-badge">Sprint hiện tại · Block 01</span>
                        <h1>Bắt đầu hành trình Moho AI Wan của bạn</h1>
                        <p>
                            Thiết lập nền tảng dự án hoạt hình với timeline, shot list và trợ lý AI Wan đồng hành. Hãy bắt đầu bằng
                            việc hoàn thiện khung dự án và xác định các shot quan trọng.
                        </p>
                        <div className="hero-actions">
                            <button className="primary-button">
                                <i className="fa-solid fa-play"></i>
                                Khởi tạo dự án mới
                            </button>
                            <button className="ghost-button">
                                <i className="fa-regular fa-compass"></i>
                                Xem hướng dẫn 5 bước
                            </button>
                        </div>
                        <div className="hero-metrics">
                            <div className="metric-card">
                                <span className="metric-label">Storyboard đã duyệt</span>
                                <span className="metric-value">${completionRate}%</span>
                                <span className="metric-footnote">Tiến độ trung bình các shot</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Shot cần blocking</span>
                                <span className="metric-value">${workspaceShots.length}</span>
                                <span className="metric-footnote">Sẵn sàng cho vòng dựng đầu</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-label">Preset Moho</span>
                                <span className="metric-value">05</span>
                                <span className="metric-footnote">Đã cấu hình tự động</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-preview">
                        <div className="hero-card">
                            <h3>Checklist khởi động</h3>
                            <ul>
                                <li><i className="fa-solid fa-check"></i> Tạo project shell rỗng</li>
                                <li><i className="fa-solid fa-check"></i> Thiết lập timeline 24fps</li>
                                <li><i className="fa-solid fa-circle"></i> Đồng bộ thư viện asset</li>
                                <li><i className="fa-solid fa-circle"></i> Chuẩn bị ghi chú đạo diễn</li>
                            </ul>
                        </div>
                        <div className="hero-card">
                            <h3>Nhịp làm việc đề xuất</h3>
                            <ol>
                                <li>Blocking từng shot</li>
                                <li>Rà camera pass</li>
                                <li>Chi tiết acting</li>
                                <li>Hoàn thiện hiệu ứng</li>
                            </ol>
                            <p className="hero-note">AI Wan sẽ nhắc tự động khi mỗi giai đoạn hoàn thành.</p>
                        </div>
                    </div>
                </section>

                <section className="workspace-section">
                    <div className="workspace-grid">
                        <div className="panel module-panel">
                            <div className="panel-header">
                                <div>
                                    <h2>Mô-đun pipeline</h2>
                                    <p>Chọn hạng mục để xem hướng dẫn chi tiết và checklist.</p>
                                </div>
                            </div>
                            <div className="module-list">
                                ${modules.map(
                                    (module) => html`
                                        <button
                                            key=${module.id}
                                            className=${`module-item ${module.id === selectedModuleId ? "is-active" : ""}`}
                                            onClick=${() => setSelectedModuleId(module.id)}
                                        >
                                            <span className="module-icon">
                                                <i className=${module.icon}></i>
                                            </span>
                                            <div className="module-body">
                                                <div className="module-title">${module.name}</div>
                                                <p className="module-description">${module.description}</p>
                                                <span className=${`module-status status-${module.status}`}>
                                                    ${statusLabel[module.status]}
                                                </span>
                                            </div>
                                        </button>
                                    `
                                )}
                            </div>
                            <div className="module-detail">
                                <h3>${selectedModule.name}</h3>
                                <p>${selectedModule.longDescription}</p>
                                <ul>
                                    ${selectedModule.highlights.map(
                                        (item) => html`<li><i className="fa-regular fa-circle-check"></i>${item}</li>`
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="panel timeline-panel">
                            <div className="panel-header">
                                <div>
                                    <h2>Timeline dựng cảnh</h2>
                                    <p>Chọn shot và track để xem đề xuất keyframe từ AI Wan.</p>
                                </div>
                                <button className="ghost-button small">
                                    <i className="fa-solid fa-arrow-trend-up"></i>
                                    So sánh phiên bản
                                </button>
                            </div>

                            <div className="shot-list">
                                ${workspaceShots.map(
                                    (shot, index) => html`
                                        <button
                                            key=${shot.id}
                                            className=${`shot-card ${index === selectedShotIndex ? "is-active" : ""}`}
                                            onClick=${() => setSelectedShotIndex(index)}
                                        >
                                            <div className="shot-card-top">
                                                <span className="shot-id">${shot.id}</span>
                                                <span className="shot-title">${shot.title}</span>
                                            </div>
                                            <div className="shot-progress">
                                                <div
                                                    className="shot-progress-bar"
                                                    style=${{ width: `${Math.round(shot.progress * 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="shot-meta">
                                                <span><i className="fa-regular fa-clock"></i>${shot.duration}f</span>
                                                <span><i className="fa-solid fa-bullseye"></i>${Math.round(shot.progress * 100)}%</span>
                                            </div>
                                        </button>
                                    `
                                )}
                            </div>

                            <div className="track-toggle">
                                ${timelineTracks.map(
                                    (track) => html`
                                        <button
                                            key=${track.id}
                                            className=${`track-button ${track.id === activeTrackId ? "is-active" : ""}`}
                                            onClick=${() => setActiveTrackId(track.id)}
                                        >
                                            <span className="track-swatch" style=${{ background: track.accent }}></span>
                                            ${track.label}
                                        </button>
                                    `
                                )}
                            </div>

                            <div className="track-description">${activeTrack.description}</div>

                            <div className="timeline-frames">
                                ${frames.map(
                                    (frame) => html`
                                        <div
                                            key=${frame.frameNumber}
                                            className=${`timeline-frame ${frame.hasKeyframe ? "has-keyframe" : ""}`}
                                        >
                                            <span className="frame-number">F${frame.frameNumber}</span>
                                            ${frame.event
                                                ? html`<span className="frame-event">
                                                      <i className="fa-solid fa-sparkles"></i>
                                                      ${frame.event.label}
                                                  </span>`
                                                : null}
                                        </div>
                                    `
                                )}
                            </div>

                            <div className="shot-notes">
                                <div>
                                    <h4>Beat chính</h4>
                                    <ul>
                                        ${selectedShot.beatNotes.map((note, index) => html`<li key=${index}>${note}</li>`)}
                                    </ul>
                                </div>
                                <div>
                                    <h4>Gợi ý từ AI Wan</h4>
                                    <ul>
                                        ${selectedShot.aiSuggestions.map((note, index) => html`<li key=${index}>${note}</li>`)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="panel assistant-panel">
                            <div className="panel-header">
                                <div>
                                    <h2>Trợ lý AI Wan</h2>
                                    <p>Theo dõi hội thoại và thực hiện hành động nhanh.</p>
                                </div>
                                <button className="ghost-button small">
                                    <i className="fa-solid fa-plus"></i>
                                    Giao nhiệm vụ
                                </button>
                            </div>

                            <div className="assistant-conversation">
                                ${assistantMessages.map(
                                    (message) => html`
                                        <div className=${`assistant-message ${message.role}`} key=${message.timestamp}>
                                            <div className="message-header">
                                                <span className="message-author">${message.title}</span>
                                                <span className="message-time">${message.timestamp}</span>
                                            </div>
                                            <p>${message.content}</p>
                                        </div>
                                    `
                                )}
                            </div>

                            <div className="quick-actions">
                                <h3>Hành động nhanh</h3>
                                <ul>
                                    ${quickActions.map(
                                        (action) => html`
                                            <li key=${action.label}>
                                                <button className="quick-action-button">
                                                    <i className=${action.icon}></i>
                                                    <span>${action.label}</span>
                                                </button>
                                                <p>${action.description}</p>
                                            </li>
                                        `
                                    )}
                                </ul>
                            </div>

                            <div className="assistant-footer">
                                <button className="primary-button full">
                                    <i className="fa-solid fa-message"></i>
                                    Bắt đầu phiên brainstorm
                                </button>
                                <p className="assistant-note">
                                    AI Wan sẽ lưu lại toàn bộ lịch sử để bạn xem lại bất cứ lúc nào.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="app-footer">
                <span>© 2025 Moho AI Wan · Pipeline hoạt hình thông minh</span>
                <span className="footer-links">
                    <a href="#">Tài liệu</a>
                    <a href="#">Nhật ký thay đổi</a>
                    <a href="#">Hỗ trợ</a>
                </span>
            </footer>
        </div>
    `;
};

render(html`<${App} />`, document.getElementById("root"));
