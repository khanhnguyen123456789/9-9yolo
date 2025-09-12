import { render, h } from "preact";
import { useState, useCallback, useEffect, useRef, useMemo } from "preact/hooks";
import htm from "htm";
import { GoogleGenAI, Type } from "@google/genai";

const html = htm.bind(h);

// --- Constants ---
const FPS = 30;
const RULER_TICK_INTERVAL_FRAMES = 30; // Show label every 30 frames (1 second)
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 10;
const FRAME_WIDTH_PX = 20;


// --- Timeline Configuration ---
const timelineTracks = [
    { id: 'group_bone_move', label: 'Xương Di Chuyển', isGroup: true, icon: 'fa-solid fa-arrows-up-down-left-right', type: 'bone' },
    { id: 'bone_move_head', label: 'Head', parent: 'group_bone_move', icon: 'fa-solid fa-user', type: 'bone' },
    { id: 'bone_move_shoulder', label: 'Shoulder', parent: 'group_bone_move', icon: 'fa-solid fa-diagram-project', type: 'bone' },
    { id: 'bone_move_elbow', label: 'Elbow', parent: 'group_bone_move', icon: 'fa-solid fa-circle', type: 'bone' },
    { id: 'bone_move_knee', label: 'Knee', parent: 'group_bone_move', icon: 'fa-solid fa-shoe-prints', type: 'bone' },

    { id: 'group_bone_rotate', label: 'Xương Xoay', isGroup: true, icon: 'fa-solid fa-rotate', type: 'bone' },
    { id: 'bone_rotate_head', label: 'Head', parent: 'group_bone_rotate', icon: 'fa-solid fa-user', type: 'bone' },
    { id: 'bone_rotate_shoulder', label: 'Shoulder', parent: 'group_bone_rotate', icon: 'fa-solid fa-diagram-project', type: 'bone' },

    { id: 'group_bone_stretch', label: 'Xương Giãn', isGroup: true, icon: 'fa-solid fa-up-right-and-down-left-from-center', type: 'bone' },
    { id: 'bone_stretch_head', label: 'Head', parent: 'group_bone_stretch', icon: 'fa-solid fa-user', type: 'bone' },
    { id: 'bone_stretch_shoulder', label: 'Shoulder', parent: 'group_bone_stretch', icon: 'fa-solid fa-diagram-project', type: 'bone' },

    { id: 'group_camera', label: 'Camera', isGroup: true, icon: 'fa-solid fa-camera', type: 'camera' },
    { id: 'camera_pan', label: 'Pan', parent: 'group_camera', icon: 'fa-solid fa-arrows-left-right-to-line', type: 'camera' },
    { id: 'camera_zoom', label: 'Zoom', parent: 'group_camera', icon: 'fa-solid fa-magnifying-glass', type: 'camera' },
    { id: 'camera_rotate', label: 'Rotate', parent: 'group_camera', icon: 'fa-solid fa-camera-rotate', type: 'camera' },
];

const VirtualCameraOverlay = ({ camera, setCamera, appContainerRef }) => {
    const cameraRef = useRef(null);
    const resizerRef = useRef(null);
    const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startW: 0, startH: 0, offsetX: 0, offsetY: 0 });

    const handleMouseDown = useCallback((e) => {
        if (!appContainerRef.current || !cameraRef.current) return;
        const appRect = appContainerRef.current.getBoundingClientRect();

        if (e.target === resizerRef.current) {
            // FIX: Add missing offsetX and offsetY properties to match the ref's type.
            dragInfo.current = {
                isResizing: true,
                isDragging: false,
                startX: e.clientX,
                startY: e.clientY,
                startW: camera.width,
                startH: camera.height,
                offsetX: 0,
                offsetY: 0,
            };
        } else {
            // FIX: Add missing startW and startH properties to match the ref's type.
             dragInfo.current = {
                isDragging: true,
                isResizing: false,
                startX: e.clientX,
                startY: e.clientY,
                offsetX: e.clientX - appRect.left - camera.x,
                offsetY: e.clientY - appRect.top - camera.y,
                startW: 0,
                startH: 0,
            };
        }

        e.preventDefault();
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [camera, appContainerRef]);

    const handleMouseMove = useCallback((e) => {
        if (!appContainerRef.current) return;
        const appRect = appContainerRef.current.getBoundingClientRect();
        const { isDragging, isResizing, startX, startY, startW, startH, offsetX, offsetY } = dragInfo.current;
        
        if (isDragging) {
            let newX = e.clientX - appRect.left - offsetX;
            let newY = e.clientY - appRect.top - offsetY;
            
            newX = Math.max(0, Math.min(newX, appRect.width - camera.width));
            newY = Math.max(0, Math.min(newY, appRect.height - camera.height));

            setCamera(c => ({ ...c, x: newX, y: newY }));
        } else if (isResizing) {
            let newW = startW + (e.clientX - startX);
            let newH = startH + (e.clientY - startY);
            
            newW = Math.max(50, Math.min(newW, appRect.width - camera.x));
            newH = Math.max(50, Math.min(newH, appRect.height - camera.y));

            setCamera(c => ({ ...c, width: newW, height: newH }));
        }
    }, [camera, setCamera, appContainerRef]);

    const handleMouseUp = useCallback(() => {
        // FIX: Ensure all properties of the dragInfo ref object are reset.
        dragInfo.current = { isDragging: false, isResizing: false, startX: 0, startY: 0, startW: 0, startH: 0, offsetX: 0, offsetY: 0 };
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    return html`
        <div 
            ref=${cameraRef}
            className="virtual-camera-overlay"
            style=${{ 
                left: `${camera.x}px`, 
                top: `${camera.y}px`, 
                width: `${camera.width}px`, 
                height: `${camera.height}px`,
                backgroundColor: `rgba(20, 20, 20, ${0.1 + (camera.opacity - 0.1) * 0.5})`, // Link background to opacity
                transition: 'background-color 0.2s'
            }}
        >
            <div className="virtual-camera-header" onMouseDown=${handleMouseDown}>
                <div className="virtual-camera-title">
                    <i className="fa-solid fa-camera-movie"></i> Camera Ảo
                </div>
                <div className="virtual-camera-controls">
                    <label htmlFor="opacity-slider">Opacity</label>
                    <input 
                        id="opacity-slider"
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.05" 
                        value=${camera.opacity} 
                        onInput=${(e) => setCamera(c => ({...c, opacity: parseFloat(e.target.value)}))}
                        onMouseDown=${e => e.stopPropagation()}
                    />
                </div>
            </div>
            <div ref=${resizerRef} className="virtual-camera-resizer" onMouseDown=${handleMouseDown}></div>
        </div>
    `;
};

const TimelinePanel = ({ keyframes, currentFrame, totalFrames, onFrameChange, visibleTracks, filter, onFilterChange, zoom, pan, onZoom, onPan }) => {
    const timelineMainRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isPanning: false, startX: 0, startPan: 0 });

    const handlePan = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isPanning) return;
        const dx = e.clientX - dragInfo.current.startX;
        const newPan = dragInfo.current.startPan + dx;
        onPan(newPan);
    }, [onPan]);

    const handlePanEnd = useCallback(() => {
        dragInfo.current.isPanning = false;
        if(timelineMainRef.current) timelineMainRef.current.classList.remove('panning');
        window.removeEventListener('mousemove', handlePan);
        window.removeEventListener('mouseup', handlePanEnd);
    }, [handlePan]);

    const handlePanStart = useCallback((e: MouseEvent) => {
        e.preventDefault();
        dragInfo.current = {
            isPanning: true,
            startX: e.clientX,
            startPan: pan,
        };
        if(timelineMainRef.current) timelineMainRef.current.classList.add('panning');
        window.addEventListener('mousemove', handlePan);
        window.addEventListener('mouseup', handlePanEnd);
    }, [pan, handlePan, handlePanEnd]);

    const handleZoom = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const timelineRect = timelineMainRef.current.getBoundingClientRect();
        const pointerX = e.clientX - timelineRect.left;
        const pointerFrame = (pointerX - pan) / (FRAME_WIDTH_PX * zoom);

        let newZoom = zoom - e.deltaY * 0.001 * zoom;
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        
        const newPan = pointerX - (pointerFrame * FRAME_WIDTH_PX * newZoom);

        onZoom(newZoom);
        onPan(newPan);
    }, [zoom, pan, onZoom, onPan]);

    useEffect(() => {
        const mainEl = timelineMainRef.current;
        if (mainEl) {
            mainEl.addEventListener('wheel', handleZoom, { passive: false });
            return () => mainEl.removeEventListener('wheel', handleZoom);
        }
    }, [handleZoom]);

    const canvasWidth = totalFrames * FRAME_WIDTH_PX * zoom;

    const rulerTicks = useMemo(() => {
        const ticks = [];
        for (let frame = 0; frame <= totalFrames; frame += RULER_TICK_INTERVAL_FRAMES) {
            ticks.push(frame);
        }
        return ticks;
    }, [totalFrames]);
    
    return html`
        <div class="panel timeline-panel">
            <div class="panel-header">
                <div class="timeline-controls-left">
                     <button class="small icon-btn"><i class="fa-solid fa-backward-step"></i></button>
                    <button class="small icon-btn"><i class="fa-solid fa-play"></i></button>
                    <button class="small icon-btn"><i class="fa-solid fa-forward-step"></i></button>
                </div>
                <div class="timeline-filter-group">
                    <button onClick=${() => onFilterChange('all')} className=${filter === 'all' ? 'active' : ''}>Tất cả</button>
                    <button onClick=${() => onFilterChange('bone')} className=${filter === 'bone' ? 'active' : ''}>Xương</button>
                    <button onClick=${() => onFilterChange('camera')} className=${filter === 'camera' ? 'active' : ''}>Camera</button>
                </div>
                <div class="timeline-controls-right">
                    <span>${currentFrame} / ${totalFrames}</span>
                </div>
            </div>
            <div class="timeline-content">
                <div class="timeline-sidebar">
                    ${visibleTracks.map(track => html`
                        <div key=${track.id} className="timeline-track-label ${track.isGroup ? 'group-label' : ''}" style=${{ paddingLeft: track.parent ? '2rem' : '1rem' }}>
                           <i className=${track.icon}></i> ${track.label}
                        </div>
                    `)}
                </div>
                <div ref=${timelineMainRef} class="timeline-main" onMouseDown=${handlePanStart}>
                   <div class="timeline-canvas" style=${{ width: `${canvasWidth}px`, transform: `translateX(${pan}px)` }}>
                       <div class="timeline-ruler">
                           ${rulerTicks.map(frame => html`
                               <div key=${frame} class="ruler-tick" data-frame=${frame} style=${{ left: `${frame * FRAME_WIDTH_PX * zoom}px` }}></div>
                           `)}
                       </div>
                       <div class="tracks-area">
                           ${visibleTracks.map(track => html`
                               <div key=${track.id} className="timeline-track ${track.isGroup ? 'group-track' : ''}">
                                   ${!track.isGroup && keyframes[track.id]?.map(frame => html`
                                       <div 
                                         key=${`${track.id}-${frame}`}
                                         className="keyframe"
                                         style=${{ left: `${frame * FRAME_WIDTH_PX * zoom}px` }}
                                         onClick=${(e) => { e.stopPropagation(); onFrameChange(frame); }}
                                       ></div>
                                   `)}
                               </div>
                           `)}
                       </div>
                       <div class="playhead" style=${{ left: `${currentFrame * FRAME_WIDTH_PX * zoom}px` }}></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const App = () => {
    const [keyframes, setKeyframes] = useState({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [totalFrames, setTotalFrames] = useState(300); // Default: 10 seconds at 30fps
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState('mapping');
    const [timelineFilter, setTimelineFilter] = useState('all');
    
    // Timeline view state
    const [timelineZoom, setTimelineZoom] = useState(1);
    const [timelinePan, setTimelinePan] = useState(0);
    
    // Video state
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    
    // Virtual Camera State
    const [camera, setCamera] = useState({ x: 50, y: 50, width: 300, height: 200, opacity: 0.8 });

    // REFS
    const playheadIntervalRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const appContainerRef = useRef<HTMLDivElement>(null);


    // MEMOIZED VALUES
    const visibleTracks = useMemo(() => {
        if (timelineFilter === 'all') return timelineTracks;
        
        const filtered = timelineTracks.filter(track => {
             // Include the track if its type matches the filter
            if (track.type === timelineFilter) return true;
            // Include a group if any of its children match the filter
            if (track.isGroup) {
                return timelineTracks.some(child => child.parent === track.id && child.type === timelineFilter);
            }
            return false;
        });

        // Ensure parent groups are included for visible children
        const finalTracks = [];
        const includedGroups = new Set();
        filtered.forEach(track => {
            if(track.parent && !includedGroups.has(track.parent)){
                const group = timelineTracks.find(t => t.id === track.parent);
                if(group){
                    finalTracks.push(group);
                    includedGroups.add(group.id);
                }
            }
            if(!finalTracks.some(t => t.id === track.id)){
               finalTracks.push(track);
            }
        });

        return finalTracks;

    }, [timelineFilter]);


    // HANDLERS
    const handleFileChange = useCallback((event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        // Reset previous state and revoke old URL if it exists
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
        }
        setVideoSrc(null);
        setVideoError(null);

        const videoElement = document.createElement('video');
        const url = URL.createObjectURL(file);

        videoElement.addEventListener('loadedmetadata', () => {
            if (videoElement.duration > 60) {
                setVideoError('Lỗi: Video phải từ 60 giây trở xuống.');
                setVideoSrc(null);
                setTotalFrames(300); // Reset to default
                URL.revokeObjectURL(url); // Clean up immediately since it's invalid
            } else {
                setVideoError(null);
                setVideoSrc(url); // URL is now in use by the component
                setTotalFrames(Math.floor(videoElement.duration * FPS));
                setCurrentFrame(0); // Reset playhead
            }
        });

        videoElement.addEventListener('error', () => {
            setVideoError('Lỗi: Không thể tải tệp video.');
            setVideoSrc(null);
            URL.revokeObjectURL(url); // Clean up on error
        });

        videoElement.src = url;
    }, [videoSrc]);

    const handleAnalyze = useCallback(async () => {
        if (!videoSrc) return;
        setIsAnalyzing(true);
        setProgress(0);
        
        // Mock analysis
        const analysisDuration = 2000;
        const interval = setInterval(() => {
            setProgress(p => {
                const newProgress = p + (100 / (analysisDuration / 100));
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                    // Mock keyframe generation
                    const newKeyframes = {};
                    timelineTracks.forEach(track => {
                        if (!track.isGroup) {
                            newKeyframes[track.id] = [];
                            for (let i = 0; i < 5; i++) {
                                newKeyframes[track.id].push(Math.floor(Math.random() * totalFrames));
                            }
                        }
                    });
                    setKeyframes(newKeyframes);
                    return 100;
                }
                return newProgress;
            });
        }, 100);
    }, [videoSrc, totalFrames]);

    // Cleanup for video object URL when component unmounts or videoSrc changes
    useEffect(() => {
      return () => {
        if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
        }
      };
    }, [videoSrc]);
    

    return html`
        <div ref=${appContainerRef} className="app-container">
            <header className="app-header">
                <h1 className="app-header-title">YOLOv8 to Moho Keyframe Assistant</h1>
            </header>

            <main className="main-content">
                <div className="panels-container middle-panel-group">
                    
                    <div className="panel video-input-panel">
                        <div className="panel-header">
                            <h2 className="panel-title">Nguồn Video</h2>
                        </div>
                        <div className="video-placeholder">
                             ${videoSrc ? html`
                                <video src=${videoSrc} controls className="video-preview" />
                            ` : html`
                                <>
                                    <i className="fa-solid fa-video"></i>
                                    <span>Chọn video (tối đa 60s)</span>
                                </>
                            `}
                        </div>
                        ${videoError && html`<div class="video-error-message">${videoError}</div>`}
                        <div className="video-controls">
                            <input
                                type="file"
                                ref=${fileInputRef}
                                onChange=${handleFileChange}
                                accept="video/*"
                                style=${{ display: 'none' }}
                                id="video-upload"
                            />
                            <button className="secondary" onClick=${() => fileInputRef.current?.click()}>
                                <i className="fa-solid fa-folder-open"></i>
                                Chọn Video
                            </button>
                        </div>
                    </div>
                    
                    <div className="panel retargeting-studio-panel">
                         <div className="panel-header">
                            <h2 className="panel-title">Retargeting Studio</h2>
                        </div>
                        <h3 className="panel-subtitle">Keypoint Visualizer</h3>
                         <div className="visualizer-placeholder">
                            <!-- Mock nodes for visualization -->
                            <div class="node-mock" style="top: 20%; left: 50%;"></div>
                            <div class="node-mock" style="top: 40%; left: 40%;"></div>
                            <div class="node-mock" style="top: 40%; left: 60%;"></div>
                            <div class="node-mock" style="top: 60%; left: 30%;"></div>
                            <div class="node-mock" style="top: 60%; left: 70%;"></div>
                        </div>
                    </div>
                    
                    <div className="panel right-control-panel">
                        <div className="tabs-nav">
                           <button className=${`tab-button ${activeTab === 'mapping' ? 'active' : ''}`} onClick=${() => setActiveTab('mapping')}>Bone Mapping</button>
                           <button className=${`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick=${() => setActiveTab('settings')}>Cài đặt</button>
                        </div>
                        <div className="main-actions-group">
                            <button
                                className="primary-action"
                                onClick=${handleAnalyze}
                                disabled=${!videoSrc || isAnalyzing}
                            >
                                ${isAnalyzing ? 'Đang xử lý...' : html`
                                    <>
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        Phân tích & Tạo Keyframe
                                    </>
                                `}
                            </button>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style=${{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="timeline-resizer"></div>
                <div className="timeline-panel-wrapper" style=${{ height: '350px' }}>
                     <${TimelinePanel} 
                        keyframes=${keyframes}
                        currentFrame=${currentFrame}
                        totalFrames=${totalFrames}
                        onFrameChange=${setCurrentFrame}
                        visibleTracks=${visibleTracks}
                        filter=${timelineFilter}
                        onFilterChange=${setTimelineFilter}
                        zoom=${timelineZoom}
                        pan=${timelinePan}
                        onZoom=${setTimelineZoom}
                        onPan=${setTimelinePan}
                     />
                </div>
            </main>
            
            <${VirtualCameraOverlay} camera=${camera} setCamera=${setCamera} appContainerRef=${appContainerRef} />

            <div className="status-bar">
                <span>Ready</span>
                <span>Frames: ${totalFrames}</span>
            </div>
        </div>
    `;
};

render(html`<${App} />`, document.getElementById('root'));