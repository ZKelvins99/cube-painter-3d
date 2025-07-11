import * as THREE from 'three';
import { CubeGeometry } from './CubeGeometry';

export interface DrawingTool {
    type: 'brush' | 'line' | 'eraser';
    color: string;
    size: number;
    opacity: number;
}

export class DrawingSystem {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private isDrawing: boolean = false;
    private currentTool: DrawingTool;
    private cubeGeometry: CubeGeometry;
    private lastPoint: THREE.Vector2 | null = null;

    constructor(cubeGeometry: CubeGeometry) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.cubeGeometry = cubeGeometry;
        this.currentTool = {
            type: 'brush',
            color: '#000000',
            size: 10,
            opacity: 1
        };
    }

    public startDrawing(event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene) {
        this.isDrawing = true;
        this.updateMousePosition(event, camera.parent || scene);
        this.lastPoint = null;
        this.draw(camera, scene);
    }

    public continueDrawing(event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene) {
        if (!this.isDrawing) return;
        this.updateMousePosition(event, camera.parent || scene);
        this.draw(camera, scene);
    }

    public stopDrawing() {
        this.isDrawing = false;
        this.lastPoint = null;
    }

    private updateMousePosition(event: MouseEvent, container: any) {
        let canvas: HTMLCanvasElement;

        if (event.target instanceof HTMLCanvasElement) {
            canvas = event.target;
        } else {
            // 如果事件目标不是canvas，尝试找到canvas
            const canvasElements = document.querySelectorAll('canvas');
            if (canvasElements.length > 0) {
                canvas = canvasElements[0] as HTMLCanvasElement;
            } else {
                return;
            }
        }

        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    private draw(camera: THREE.Camera, scene: THREE.Scene) {
        this.raycaster.setFromCamera(this.mouse, camera);
        const intersects = this.raycaster.intersectObjects([this.cubeGeometry.getMesh()], true);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const faceIndex = this.getFaceIndex(intersection.faceIndex);
            const uv = intersection.uv;

            if (uv && faceIndex !== -1) {
                const currentPoint = new THREE.Vector2(uv.x, uv.y);

                if (this.lastPoint && this.currentTool.type === 'brush') {
                    // 在两点之间绘制线条以确保连续性
                    this.drawLine(faceIndex, this.lastPoint, currentPoint);
                } else {
                    this.drawOnCanvas(faceIndex, currentPoint);
                }

                this.lastPoint = currentPoint.clone();
            }
        }
    }

    private getFaceIndex(faceIndex: number | undefined): number {
        if (faceIndex === undefined) return -1;
        // BoxGeometry有12个面（每个面2个三角形），转换为6个面
        return Math.floor(faceIndex / 2);
    }

    private drawOnCanvas(faceIndex: number, uv: THREE.Vector2) {
        const canvas = this.cubeGeometry.getCanvas(faceIndex);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = uv.x * canvas.width;
        const y = (1 - uv.y) * canvas.height;

        ctx.save();

        if (this.currentTool.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = this.currentTool.color;
        }

        ctx.globalAlpha = this.currentTool.opacity;
        ctx.beginPath();
        ctx.arc(x, y, this.currentTool.size / 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();

        this.cubeGeometry.updateTexture(faceIndex);
    }

    private drawLine(faceIndex: number, start: THREE.Vector2, end: THREE.Vector2) {
        const canvas = this.cubeGeometry.getCanvas(faceIndex);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const startX = start.x * canvas.width;
        const startY = (1 - start.y) * canvas.height;
        const endX = end.x * canvas.width;
        const endY = (1 - end.y) * canvas.height;

        ctx.save();

        if (this.currentTool.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = this.currentTool.color;
        }

        ctx.globalAlpha = this.currentTool.opacity;
        ctx.lineWidth = this.currentTool.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();

        this.cubeGeometry.updateTexture(faceIndex);
    }

    public setTool(tool: DrawingTool) {
        this.currentTool = tool;
    }
}