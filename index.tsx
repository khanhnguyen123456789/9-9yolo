
import { render, h } from "preact";
import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import htm from "htm";
import { GoogleGenAI, Type } from "@google/genai";

const html = htm.bind(h);

// --- Timeline Configuration ---
const timelineTracks = [
    { id: 'group_bone_move', label: 'Xương Di Chuyển', isGroup: true, icon: 'fa-solid fa-arrows-up-down-left-right' },
    { id: 'bone_move_head', label: 'Head', parent: 'group_bone_move', icon: 'fa-solid fa-user' },
    { id: 'bone_move_shoulder', label: 'Shoulder', parent: 'group_bone_move', icon: 'fa-solid fa-diagram-project' },
    { id: 'bone_move_elbow', label: 'Elbow', parent: 'group_bone_move', icon: 'fa-solid fa-circle' },
    { id: 'bone_move_knee', label: 'Knee', parent: 'group_bone_move', icon: 'fa-solid fa-circle' },

    { id: 'group_bone_rot', label: 'Xương Xoay', isGroup: true, icon: 'fa-solid fa-rotate' },
    { id: 'bone_rot_head', label: 'Head Rotation', parent: 'group_bone_rot', icon: 'fa-solid fa-user' },
    { id: 'bone_rot_shoulder', label: 'Shoulder Rotation', parent: 'group_bone_rot', icon: 'fa-solid fa-diagram-project' },
    
    { id: 'group_bone_stretch', label: 'Xương Co Giãn', isGroup: true, icon: 'fa-solid fa-arrows-left-right-to-line' },
    { id: 'bone_stretch_arms', label: 'Arms', parent: 'group_bone_stretch', icon: 'fa-solid fa-hand-fist' },
    { id: 'bone_stretch_legs', label: 'Legs', parent: 'group_bone_stretch', icon: 'fa-solid fa-shoe-prints' },

    { id: 'group_camera', label: 'Camera', isGroup: true, icon: 'fa-solid fa-camera-retro' },
    { id: 'camera_pan', label: 'Di chuyển Camera', parent: 'group_camera', icon: 'fa-solid fa-up-down-left-right' },
    { id: 'camera_zoom', label: 'Zoom Camera', parent: 'group_camera', icon: 'fa-solid fa-magnifying-glass-plus' },
    { id: 'camera_rotate', label: 'Xoay Camera', parent: 'group_camera', icon: 'fa-solid fa-camera-rotate' },
    { id: 'camera_tilt', label: 'Nghiêng Camera', parent: 'group_camera', icon: 'fa-solid fa-compass' },
];


const App = () => {
  // Connection State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Sẵn sàng");
  
  // UI State
  const [activeTab, setActiveTab] = useState('retargeting');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationIntervalRef = useRef(null);


  // Data State
  const [timelineData, setTimelineData] = useState({});
  const [timelineDuration, setTimelineDuration] = useState(240); // Total frames
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    latency: 0,
    confidence: 0,
    cpu: 0,
    gpu: 0,
    ram: 0,
  });
  
  // Refinement State
  const [refinementValues, setRefinementValues] = useState({
    smoothing: 30,
    jitterReduction: 20,
    motionAmplification: 100,
  });

  // Gemini AI is not used in this UI structure but kept for potential future use
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    let statsInterval;
    if (isAnalyzing || isConnected) {
        statsInterval = setInterval(() => {
            setPerformanceStats({
                fps: Number((Math.random() * 5 + 28).toFixed(1)),
                latency: Math.floor(Math.random() * 15 + 15),
                confidence: Math.floor(Math.random() * 8 + 90),
                cpu: Math.floor(Math.random() * 25 + 50),
                gpu: Math.floor(Math.random() * 30 + 65),
                ram: Math.floor(Math.random() * 20 + 45),
            });
        }, 1000);
    } else {
        setPerformanceStats({ fps: 0, latency: 0, confidence: 0, cpu: 0, gpu: 0, ram: 0 });
    }
    return () => clearInterval(statsInterval);
  }, [isAnalyzing, isConnected]);
  
  // Timeline playback effect
  useEffect(() => {
    if (isPlaying) {
      animationIntervalRef.current = setInterval(() => {
        setCurrentFrame(f => (f + 1) % (timelineDuration + 1));
      }, 1000 / 30); // 30 FPS playback
    } else {
      clearInterval(animationIntervalRef.current);
    }
    return () => clearInterval(animationIntervalRef.current);
  }, [isPlaying, timelineDuration]);


  const handleConnect = useCallback(() => {
    setIsConnecting(true);
    setStatusMessage("Đang kết nối tới WebSocket...");
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setStatusMessage("Đã thiết lập kết nối WebSocket.");
    }, 1500);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setStatusMessage("Đã đóng kết nối WebSocket.");
  }, []);
  
  const handleRefinementChange = (slider, value) => {
    setRefinementValues(prev => ({ ...prev, [slider]: value }));
  };

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setTimelineData({});
    setStatusMessage(`Đang phân tích & Tạo Keyframe...`);

    const analysisDuration = 4000;
    const interval = setInterval(() => {
       setAnalysisProgress(p => {
           const nextP = p + (100 / (analysisDuration / 30));
           if (nextP >= 100) {
                clearInterval(interval);
                setIsAnalyzing(false);
                setStatusMessage("Phân tích hoàn tất.");
                generateMockData();
                return 100;
           }
           return nextP;
       });
    }, 30);
  }, []);

  const generateMockData = () => {
      const newData = {};
      timelineTracks.forEach(track => {
          if (!track.isGroup) {
              newData[track.id] = [];
              for (let i = 0; i <= timelineDuration; i++) {
                  if (Math.random() > 0.92) { // less frequent keyframes
                      newData[track.id].push(i);
                  }
              }
          }
      });
      setTimelineData(newData);
  };
  
  const handleResizeMouseDown = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startY = mouseDownEvent.clientY;
    const startHeight = timelineHeight;

    const handleMouseMove = (mouseMoveEvent) => {
        const deltaY = startY - mouseMoveEvent.clientY;
        const newHeight = startHeight + deltaY;
        const minHeight = 120;
        const maxHeight = 500;
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            setTimelineHeight(newHeight);
        }
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [timelineHeight]);


  const AppHeader = () => html`
    <header class="app-header">
      <h1 class="app-header-title">YOLOv8Moho 2.0</h1>
      <div class="app-header-controls">
          <i class="fa-solid fa-window-minimize" title="Minimize"></i>
      </div>
    </header>
  `;

  const VideoInputPanel = () => html`
    <div class="panel video-input-panel">
      <div class="panel-header">
        <h2 class="panel-title">Nguồn Video</h2>
      </div>
      <div class="video-placeholder">
        <i class="fa-solid fa-video"></i>
        <span>Video gốc hiển thị ở đây</span>
      </div>
      <div class="video-controls">
        <button class="icon-btn" title="Play"><i class="fa-solid fa-play"></i></button>
        <button class="icon-btn" title="Pause"><i class="fa-solid fa-pause"></i></button>
        <button class="icon-btn" title="Stop"><i class="fa-solid fa-stop"></i></button>
        <div class="seeker-bar"></div>
      </div>
      <div class="control-group">
        <button onClick=${() => document.getElementById('video-input')?.click()} disabled=${isAnalyzing}>
          <i class="fa-solid fa-upload"></i> Tải lên file video
        </button>
        <input type="file" id="video-input" hidden accept="video/*" />
        <button class="secondary" disabled=${isAnalyzing}>
          <i class="fa-solid fa-camera"></i> Sử dụng Webcam
        </button>
      </div>
    </div>
  `;

  const AnimationPreviewPanel = () => html`
    <div class="panel animation-preview-panel">
       <div class="panel-header">
        <h2 class="panel-title">Xem trước Diễn hoạt</h2>
        <div class="toggle-switch">
          <input type="checkbox" id="skeleton-toggle" checked=${showSkeleton} onChange=${() => setShowSkeleton(!showSkeleton)} />
          <label for="skeleton-toggle">Hiển thị Bộ xương</label>
        </div>
      </div>
      <div class="animation-placeholder">
         <i class="fa-solid fa-robot"></i>
         <span>Nhân vật 2D của bạn sẽ diễn hoạt ở đây</span>
         ${showSkeleton && html`<div class="skeleton-overlay-mock"></div>`}
      </div>
    </div>
  `;

  const RightControlPanel = () => {
    const TabButton = ({ id, title }) => html`
      <button 
        class=${`tab-button ${activeTab === id ? 'active' : ''}`}
        onClick=${() => setActiveTab(id)}
      >
        ${title}
      </button>
    `;

    return html`
      <div class="panel right-control-panel">
        <div class="main-actions-group">
            <button><i class="fa-solid fa-file-import"></i> Tải lên file .moho</button>
            <button class="primary-action" onClick=${runAnalysis} disabled=${isAnalyzing}>
                ${isAnalyzing ? html`<i class="fa-solid fa-spinner fa-spin"></i>` : html`<i class="fa-solid fa-cogs"></i>`}
                ${isAnalyzing ? 'Đang xử lý...' : 'Phân tích & Tạo Keyframe'}
            </button>
            ${isAnalyzing && html`
                <div class="progress-bar-container">
                    <div class="progress-bar" style=${{ width: `${analysisProgress}%` }}></div>
                </div>
            `}
        </div>

        <nav class="tabs-nav">
          <${TabButton} id="retargeting" title="Ánh xạ xương" />
          <${TabButton} id="refinement" title="Tinh chỉnh" />
        </nav>
        
        <div class="tab-content">
          ${activeTab === 'retargeting' && html`<${BoneRetargetingTab} />`}
          ${activeTab === 'refinement' && html`<${RefinementTab} />`}
        </div>

        <${ConnectionPanel} />
        <${PerformanceDashboard} stats=${performanceStats} />
      </div>
    `;
  };

  const BoneRetargetingTab = () => {
      const yoloJoints = ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"];
      const mohoBones = ["Chưa chọn", "XuongVaiTrai", "XuongVaiPhai", "KhuyuTayTrai", "KhuyuTayPhai", "CoTayTrai", "CoTayPhai", "HongTrai", "HongPhai", "DauGoiTrai"];

      return html`
        <div class="tab-pane">
            <h3 class="panel-subtitle">Ánh xạ khớp YOLOv8 tới xương Moho</h3>
            <div class="bone-mapping-list">
                ${yoloJoints.map(joint => html`
                    <div class="mapping-item">
                        <label>${joint}</label>
                        <select>
                            ${mohoBones.map(bone => html`<option value=${bone}>${bone}</option>`)}
                        </select>
                    </div>
                `)}
            </div>
            <button class="secondary small" style=${{marginTop: '1rem'}}><i class="fa-solid fa-magic"></i> Tự động nhận diện</button>
        </div>
      `;
  };

  const RefinementTab = () => html`
    <div class="tab-pane">
        <h3 class="panel-subtitle">Làm mượt và Tinh chỉnh Chuyển động</h3>
        <div class="refinement-sliders">
            <div class="slider-group">
                <label>Làm mượt (Smoothing)</label>
                <input type="range" min="0" max="100" value=${refinementValues.smoothing} onInput=${e => handleRefinementChange('smoothing', e.target.value)} />
                <span>${refinementValues.smoothing}</span>
            </div>
            <div class="slider-group">
                <label>Giảm thiểu rung lắc (Jitter Reduction)</label>
                <input type="range" min="0" max="100" value=${refinementValues.jitterReduction} onInput=${e => handleRefinementChange('jitterReduction', e.target.value)} />
                <span>${refinementValues.jitterReduction}</span>
            </div>
            <div class="slider-group">
                <label>Khuếch đại chuyển động (Motion Amplification)</label>
                <input type="range" min="50" max="200" value=${refinementValues.motionAmplification} onInput=${e => handleRefinementChange('motionAmplification', e.target.value)} />
                <span>${refinementValues.motionAmplification}%</span>
            </div>
        </div>
    </div>
  `;

  const TimelinePanel = ({ data, duration }) => html`
    <div class="panel timeline-panel">
      <div class="panel-header">
        <div class="timeline-controls-left">
            <h2 class="panel-title">Dòng thời gian</h2>
            <button class="icon-btn small" title="Play/Pause" onClick=${() => setIsPlaying(!isPlaying)}>
                <i class=${`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
             <button class="icon-btn small" title="Stop" onClick=${() => {setIsPlaying(false); setCurrentFrame(0);}}>
                <i class="fa-solid fa-stop"></i>
            </button>
        </div>
        <div class="timeline-controls-right">
           <button class="icon-btn small secondary" title="Add Keyframe" disabled=${Object.keys(data).length === 0}><i class="fa-solid fa-plus"></i></button>
           <button class="icon-btn small secondary" title="Remove Keyframe" disabled=${Object.keys(data).length === 0}><i class="fa-solid fa-trash-can"></i></button>
           <button class="secondary small" disabled=${Object.keys(data).length === 0}><i class="fa-solid fa-fire"></i> Nướng (Bake Animation)</button>
        </div>
      </div>
      <div class="timeline-content">
        <div class="timeline-sidebar">
            ${timelineTracks.map(track => html`
                <div class=${`timeline-track-label ${track.isGroup ? 'group-label' : ''}`}>
                    <i class=${`${track.icon} fa-fw`}></i>
                    <span>${track.label}</span>
                </div>
            `)}
        </div>
        <div class="timeline-main">
            <div class="timeline-ruler">
                ${Array.from({ length: duration / 10 + 1 }).map((_, i) => html`
                    <div class="ruler-tick" style=${{left: `${i*10/duration*100}%`}} data-frame=${i*10}></div>
                `)}
            </div>
            <div class="playhead" style=${{ left: `${currentFrame / duration * 100}%` }}></div>
            <div class="tracks-area">
                ${timelineTracks.map(track => html`
                    <div class=${`timeline-track ${track.isGroup ? 'group-track' : ''}`}>
                        ${!track.isGroup && data[track.id]?.map(frame => html`
                            <div class="keyframe" style=${{ left: `${frame / duration * 100}%` }} title=${`Frame ${frame}`}></div>
                        `)}
                    </div>
                `)}
            </div>
        </div>
      </div>
    </div>
  `;

  const ConnectionPanel = () => html`
    <div class="panel-section">
       <h3 class="panel-subtitle">Kết nối</h3>
        <div class="control-group-row">
            <button onClick=${handleConnect} disabled=${isConnected || isConnecting || isAnalyzing}>
              ${isConnecting ? html`<i class="fa-solid fa-spinner fa-spin"></i>` : html`<i class="fa-solid fa-link"></i>`}
              ${isConnecting ? 'Đang kết nối...' : 'Kết nối'}
            </button>
            <button class="secondary" onClick=${handleDisconnect} disabled=${!isConnected || isAnalyzing}>
              <i class="fa-solid fa-link-slash"></i> Ngắt kết nối
            </button>
        </div>
    </div>
  `;

  const PerformanceDashboard = ({ stats }) => html`
    <div class="panel-section">
      <h3 class="panel-subtitle">Bảng Thống Kê Hiệu Suất (Thời gian thực)</h3>
      <div class="stats-grid">
        <div class="stat-item">
            <i class="fa-solid fa-forward-fast stat-icon"></i>
            <div class="stat-value">${stats.fps}</div>
            <div class="stat-label">AI FPS</div>
        </div>
        <div class="stat-item">
            <i class="fa-solid fa-stopwatch stat-icon"></i>
            <div class="stat-value">${stats.latency}</div>
            <div class="stat-label">Độ trễ</div>
        </div>
        <div class="stat-item">
            <i class="fa-solid fa-microchip stat-icon"></i>
            <div class="stat-value">${stats.cpu}%</div>
            <div class="stat-label">Tải CPU</div>
        </div>
        <div class="stat-item">
            <i class="fa-solid fa-gamepad stat-icon"></i>
            <div class="stat-value">${stats.gpu}%</div>
            <div class="stat-label">Tải GPU</div>
        </div>
      </div>
    </div>
  `;

  const StatusBar = () => html`
    <div class="status-bar">
      <div class="status-indicator">
        <div class=${`status-light ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>${statusMessage}</span>
      </div>
      <span>v2.2.0</span>
    </div>
  `;

  return html`
    <div class="app-container">
      <${AppHeader} />
      <div class="main-content">
        <div class="panels-container">
          <${VideoInputPanel} />
          <${AnimationPreviewPanel} />
          <${RightControlPanel} />
        </div>
        <div class="timeline-resizer" onMouseDown=${handleResizeMouseDown}></div>
        <div class="timeline-panel-wrapper" style=${{ height: `${timelineHeight}px` }}>
          <${TimelinePanel} data=${timelineData} duration=${timelineDuration} />
        </div>
      </div>
      <${StatusBar} />
    </div>
  `;
};

render(html`<${App} />`, document.getElementById("root"));
