import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { CubeGeometry } from '../core/CubeGeometry';
import { DrawingSystem, DrawingTool } from '../core/DrawingSystem';
import { UnfoldAnimation } from '../core/UnfoldAnimation';
import { UnfoldType } from '../core/CubeUnfoldAlgorithm';
import { ToolBar } from './ToolBar';
import { UnfoldSlider } from './UnfoldSlider';

export const CubePainter: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const cubeGeometryRef = useRef<CubeGeometry>();
    const drawingSystemRef = useRef<DrawingSystem>();
    const unfoldAnimationRef = useRef<UnfoldAnimation>();
    const controlsRef = useRef<OrbitControls>();
    const animationIdRef = useRef<number>();

    const [currentTool, setCurrentTool] = useState<DrawingTool>({
        type: 'brush',
        color: '#000000',
        size: 10,
        opacity: 1
    });
    const [unfoldProgress, setUnfoldProgress] = useState(0);
    const [unfoldType, setUnfoldType] = useState<UnfoldType>(UnfoldType.TYPE_141_A);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showFaceLabels, setShowFaceLabels] = useState(true);

    useEffect(() => {
        if (!canvasRef.current) return;

        initializeScene();
        setupEventListeners();
        animate();

        return () => {
            cleanup();
        };
    }, []);

    const initializeScene = () => {
        // 初始化Three.js场景
        sceneRef.current = new THREE.Scene();
        sceneRef.current.background = new THREE.Color(0xf8f9fa);

        // 设置相机
        cameraRef.current = new THREE.PerspectiveCamera(
            60,
            canvasRef.current!.clientWidth / canvasRef.current!.clientHeight,
            0.1,
            1000
        );
        cameraRef.current.position.set(6, 4, 8);

        // 设置渲染器
        rendererRef.current = new THREE.WebGLRenderer({
            canvas: canvasRef.current!,
            antialias: true
        });
        rendererRef.current.setSize(
            canvasRef.current!.clientWidth,
            canvasRef.current!.clientHeight
        );
        rendererRef.current.shadowMap.enabled = true;
        rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;

        // 添加填充光
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, -10, -5);

        sceneRef.current.add(ambientLight);
        sceneRef.current.add(directionalLight);
        sceneRef.current.add(fillLight);

        // 添加网格地面
        const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
        gridHelper.position.y = -0.1;
        sceneRef.current.add(gridHelper);

        // 初始化六面体
        cubeGeometryRef.current = new CubeGeometry();

        // 初始化绘画系统
        drawingSystemRef.current = new DrawingSystem(cubeGeometryRef.current);

        // 初始化展开动画
        unfoldAnimationRef.current = new UnfoldAnimation(cubeGeometryRef.current, 2);
        sceneRef.current.add(unfoldAnimationRef.current.getGroup());

        // 设置轨道控制
        controlsRef.current = new OrbitControls(
            cameraRef.current,
            rendererRef.current.domElement
        );
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.08;
        controlsRef.current.minDistance = 3;
        controlsRef.current.maxDistance = 30;

        // 设置鼠标控制
        controlsRef.current.mouseButtons = {
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        controlsRef.current.enableRotate = true;
        controlsRef.current.enablePan = true;
        controlsRef.current.enableZoom = true;

        // 设置相机目标
        controlsRef.current.target.set(0, 0, 0);
    };

    const setupEventListeners = () => {
        const canvas = canvasRef.current!;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        window.addEventListener('resize', handleResize);
    };

    const handleMouseDown = (event: MouseEvent) => {
        event.preventDefault();

        // 左键用于绘画
        if (event.button === 0) {
            if (controlsRef.current) {
                controlsRef.current.enabled = false;
            }

            setIsDrawing(true);
            drawingSystemRef.current?.startDrawing(
                event,
                cameraRef.current!,
                sceneRef.current!
            );
        }
        // 右键用于旋转视角
        else if (event.button === 2) {
            if (controlsRef.current) {
                controlsRef.current.enabled = true;
            }
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        event.preventDefault();
        if (isDrawing) {
            drawingSystemRef.current?.continueDrawing(
                event,
                cameraRef.current!,
                sceneRef.current!
            );
        }
    };

    const handleMouseUp = (event?: MouseEvent) => {
        if (event) event.preventDefault();

        if (isDrawing) {
            setIsDrawing(false);
            drawingSystemRef.current?.stopDrawing();

            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.mouseButtons = {
                    LEFT: undefined,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE
                };
            }
        }
    };

    const handleResize = () => {
        if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;

        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
    };

    const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);

        if (controlsRef.current) {
            controlsRef.current.update();
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };

    const handleToolChange = (tool: DrawingTool) => {
        setCurrentTool(tool);
        drawingSystemRef.current?.setTool(tool);
    };

    const handleUnfoldChange = (progress: number) => {
        setUnfoldProgress(progress);
        unfoldAnimationRef.current?.setUnfoldProgress(progress);
    };

    const handleUnfoldTypeChange = (type: UnfoldType) => {
        setUnfoldType(type);
        unfoldAnimationRef.current?.setUnfoldType(type);
    };

    const handleFaceColorChange = (faceIndex: number, color: string) => {
        cubeGeometryRef.current?.setFaceColor(faceIndex, color);
    };

    const handleShowFaceLabelsChange = (show: boolean) => {
        setShowFaceLabels(show);
        cubeGeometryRef.current?.setShowFaceLabels(show);
    };

    const clearFace = (faceIndex: number) => {
        cubeGeometryRef.current?.clearFace(faceIndex);
    };

    const getUnfoldTypeName = (type: UnfoldType): string => {
        return unfoldAnimationRef.current?.getUnfoldTypeName(type) || '';
    };

    const cleanup = () => {
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
        if (rendererRef.current) {
            rendererRef.current.dispose();
        }
    };

    return (
        <div className="cube-painter">
            <ToolBar
                currentTool={currentTool}
                onToolChange={handleToolChange}
                unfoldType={unfoldType}
                onUnfoldTypeChange={handleUnfoldTypeChange}
                cubeGeometry={cubeGeometryRef.current}
                onFaceColorChange={handleFaceColorChange}
                showFaceLabels={showFaceLabels}
                onShowFaceLabelsChange={handleShowFaceLabelsChange}
                onClearFace={clearFace}
                getUnfoldTypeName={getUnfoldTypeName}
            />
            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
                {isDrawing && (
                    <div className="drawing-indicator">
                        <div className="indicator-icon">🎨</div>
                        <div>正在绘画...</div>
                    </div>
                )}
                <div className="controls-info">
                    <div className="control-item">
                        <span className="control-icon">🖱️</span>
                        <span>左键：绘画</span>
                    </div>
                    <div className="control-item">
                        <span className="control-icon">🖱️</span>
                        <span>右键：旋转视角</span>
                    </div>
                    <div className="control-item">
                        <span className="control-icon">🔄</span>
                        <span>滚轮：缩放</span>
                    </div>
                </div>
                <div className="unfold-info">
                    <div className="info-title">展开状态</div>
                    <div className="info-item">
                        <span>进度：</span>
                        <span className="value">{Math.round(unfoldProgress * 100)}%</span>
                    </div>
                    <div className="info-item">
                        <span>模式：</span>
                        <span className="value">{getUnfoldTypeName(unfoldType)}</span>
                    </div>
                </div>
            </div>
            <UnfoldSlider
                progress={unfoldProgress}
                onProgressChange={handleUnfoldChange}
                label={`展开程度 (k=${(unfoldProgress * 100).toFixed(1)}%)`}
            />
        </div>
    );
};