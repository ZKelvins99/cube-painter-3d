import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { CubeGeometry } from '../core/CubeGeometry';
import { DrawingSystem, DrawingTool } from '../core/DrawingSystem';
import { UnfoldAnimation, UnfoldMode } from '../core/UnfoldAnimation';
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
    const [unfoldMode, setUnfoldMode] = useState<UnfoldMode>(UnfoldMode.TYPE_141_CENTER);
    const [isDrawing, setIsDrawing] = useState(false);

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
        sceneRef.current.background = new THREE.Color(0xf5f5f5);

        // 设置相机（调整位置以适应展开图）
        cameraRef.current = new THREE.PerspectiveCamera(
            60,
            canvasRef.current!.clientWidth / canvasRef.current!.clientHeight,
            0.1,
            1000
        );
        cameraRef.current.position.set(0, 0, 12);

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
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;

        sceneRef.current.add(ambientLight);
        sceneRef.current.add(directionalLight);

        // 添加网格地面（适应展开图大小）
        const gridHelper = new THREE.GridHelper(16, 16, 0x888888, 0xcccccc);
        gridHelper.position.y = -0.1;
        sceneRef.current.add(gridHelper);

        // 初始化六面体
        cubeGeometryRef.current = new CubeGeometry();
        sceneRef.current.add(cubeGeometryRef.current.getMesh());

        // 初始化绘画系统
        drawingSystemRef.current = new DrawingSystem(cubeGeometryRef.current);

        // 初始化展开动画
        unfoldAnimationRef.current = new UnfoldAnimation(cubeGeometryRef.current);
        sceneRef.current.add(unfoldAnimationRef.current.getGroup());

        // 设置轨道控制
        controlsRef.current = new OrbitControls(
            cameraRef.current,
            rendererRef.current.domElement
        );
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.minDistance = 3;
        controlsRef.current.maxDistance = 30;

        // 限制垂直旋转角度
        controlsRef.current.maxPolarAngle = Math.PI * 0.8;
        controlsRef.current.minPolarAngle = Math.PI * 0.2;
    };

    const setupEventListeners = () => {
        const canvas = canvasRef.current!;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        window.addEventListener('resize', handleResize);
    };

    const handleMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        if (event.button === 0 && controlsRef.current) {
            controlsRef.current.enabled = false;
            setIsDrawing(true);
            drawingSystemRef.current?.startDrawing(
                event,
                cameraRef.current!,
                sceneRef.current!
            );
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
        }
        if (controlsRef.current) {
            controlsRef.current.enabled = true;
        }
    };

    const handleTouchStart = (event: TouchEvent) => {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            });
            handleMouseDown(mouseEvent);
        }
    };

    const handleTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        if (event.touches.length === 1 && isDrawing) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleMouseMove(mouseEvent);
        }
    };

    const handleTouchEnd = (event: TouchEvent) => {
        event.preventDefault();
        handleMouseUp();
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

    const handleUnfoldModeChange = (mode: UnfoldMode) => {
        setUnfoldMode(mode);
        unfoldAnimationRef.current?.setUnfoldMode(mode);
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
                unfoldMode={unfoldMode}
                onUnfoldModeChange={handleUnfoldModeChange}
            />
            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
                {isDrawing && (
                    <div className="drawing-indicator">
                        正在绘画...
                    </div>
                )}
                <div className="mode-indicator">
                    当前模式: {unfoldMode.replace('_', ' ').toUpperCase()}
                </div>
            </div>
            <UnfoldSlider
                progress={unfoldProgress}
                onProgressChange={handleUnfoldChange}
            />
        </div>
    );
};