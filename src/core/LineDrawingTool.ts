import * as THREE from 'three';

export class LineDrawingTool {
    private startPoint: THREE.Vector2 | null = null;
    private previewLine: HTMLCanvasElement | null = null;

    public startLine(canvas: HTMLCanvasElement, point: THREE.Vector2): void {
        this.startPoint = point.clone();

        // 创建预览线
        this.previewLine = canvas;
    }

    public updateLine(canvas: HTMLCanvasElement, currentPoint: THREE.Vector2, tool: any): void {
        if (!this.startPoint) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 绘制预览线（使用临时canvas或者直接在主canvas上绘制并在下次更新时清除）
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = tool.color;
        ctx.lineWidth = tool.size;
        ctx.lineCap = 'round';
        ctx.globalAlpha = tool.opacity;

        ctx.beginPath();
        ctx.moveTo(this.startPoint.x * canvas.width, (1 - this.startPoint.y) * canvas.height);
        ctx.lineTo(currentPoint.x * canvas.width, (1 - currentPoint.y) * canvas.height);
        ctx.stroke();

        ctx.restore();
    }

    public finishLine(canvas: HTMLCanvasElement, endPoint: THREE.Vector2, tool: any): void {
        if (!this.startPoint) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = tool.color;
        ctx.lineWidth = tool.size;
        ctx.lineCap = 'round';
        ctx.globalAlpha = tool.opacity;

        ctx.beginPath();
        ctx.moveTo(this.startPoint.x * canvas.width, (1 - this.startPoint.y) * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, (1 - endPoint.y) * canvas.height);
        ctx.stroke();

        ctx.restore();

        this.startPoint = null;
        this.previewLine = null;
    }

    public cancelLine(): void {
        this.startPoint = null;
        this.previewLine = null;
    }
}