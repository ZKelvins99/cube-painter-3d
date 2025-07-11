import * as THREE from 'three';

export class CubeGeometry {
    private geometry: THREE.BoxGeometry;
    private materials: THREE.MeshLambertMaterial[];
    private mesh: THREE.Mesh;
    private canvases: HTMLCanvasElement[];
    private edges: THREE.LineSegments;
    private showFaceLabels: boolean = true;
    private faceColors: string[] = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];

    // 面的标识：0-右，1-左，2-上，3-下，4-前，5-后
    private faceNames = ['面1(右)', '面2(左)', '面3(上)', '面4(下)', '面5(前)', '面6(后)'];

    constructor() {
        this.geometry = new THREE.BoxGeometry(2, 2, 2);
        this.canvases = [];
        this.materials = [];
        this.mesh = new THREE.Mesh();
        this.edges = new THREE.LineSegments();
        this.initializeFaces();
        this.createEdges();
    }

    private initializeFaces() {
        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;

            // 初始化为纯白色背景
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = this.faceColors[i];
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 可选显示面标识
                if (this.showFaceLabels) {
                    this.drawFaceLabel(ctx, this.faceNames[i]);
                }
            }

            this.canvases.push(canvas);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: false,
                side: THREE.DoubleSide
            });
            this.materials.push(material);
        }

        this.mesh = new THREE.Mesh(this.geometry, this.materials);
    }

    private drawFaceLabel(ctx: CanvasRenderingContext2D, label: string) {
        // 绘制半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(10, 10, 150, 50);

        // 绘制文本
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 20, 35);
    }

    private createEdges() {
        // 创建边线
        const edges = new THREE.EdgesGeometry(this.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2
        });
        this.edges = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(this.edges);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public getCanvas(faceIndex: number): HTMLCanvasElement {
        return this.canvases[faceIndex];
    }

    public updateTexture(faceIndex: number) {
        if (this.materials[faceIndex] && this.materials[faceIndex].map) {
            (this.materials[faceIndex].map as THREE.CanvasTexture).needsUpdate = true;
        }
    }

    public setFaceColor(faceIndex: number, color: string) {
        if (faceIndex >= 0 && faceIndex < 6) {
            this.faceColors[faceIndex] = color;
            const canvas = this.canvases[faceIndex];
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 保存当前绘画内容
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // 重新绘制背景
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 恢复绘画内容（仅非白色像素）
                this.restoreDrawing(ctx, imageData);

                // 重新绘制面标识
                if (this.showFaceLabels) {
                    this.drawFaceLabel(ctx, this.faceNames[faceIndex]);
                }

                this.updateTexture(faceIndex);
            }
        }
    }

    private restoreDrawing(ctx: CanvasRenderingContext2D, imageData: ImageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // 如果不是白色背景，则保留
            if (!(r > 250 && g > 250 && b > 250)) {
                const x = (i / 4) % imageData.width;
                const y = Math.floor((i / 4) / imageData.width);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    public getFaceColor(faceIndex: number): string {
        return this.faceColors[faceIndex] || '#ffffff';
    }

    public setShowFaceLabels(show: boolean) {
        this.showFaceLabels = show;
        // 重新绘制所有面
        for (let i = 0; i < 6; i++) {
            this.setFaceColor(i, this.faceColors[i]);
        }
    }

    public getFaceNames(): string[] {
        return this.faceNames;
    }

    public clearFace(faceIndex: number) {
        if (faceIndex >= 0 && faceIndex < 6) {
            const canvas = this.canvases[faceIndex];
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = this.faceColors[faceIndex];
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                if (this.showFaceLabels) {
                    this.drawFaceLabel(ctx, this.faceNames[faceIndex]);
                }

                this.updateTexture(faceIndex);
            }
        }
    }
}