import * as THREE from 'three';

export class CubeGeometry {
    private geometry: THREE.BoxGeometry;
    private materials: THREE.MeshBasicMaterial[];
    private mesh: THREE.Mesh;
    private canvases: HTMLCanvasElement[];
    private edges: THREE.LineSegments;

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
        // 为每个面创建Canvas纹理，每个面使用不同的背景色以便区分
        const faceColors = [
            '#FFE5E5', // 右面 - 淡红色
            '#E5F5FF', // 左面 - 淡蓝色
            '#E5FFE5', // 上面 - 淡绿色
            '#FFFFE5', // 下面 - 淡黄色
            '#F5E5FF', // 前面 - 淡紫色
            '#FFE5F5'  // 后面 - 淡粉色
        ];

        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;

            // 初始化canvas背景为不同颜色
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = faceColors[i];
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 添加面标识
                ctx.fillStyle = '#000000';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`面${i + 1}`, canvas.width / 2, canvas.height / 2);
            }

            this.canvases.push(canvas);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: false
            });
            this.materials.push(material);
        }

        this.mesh = new THREE.Mesh(this.geometry, this.materials);
    }

    private createEdges() {
        // 创建边线以便更好地区分面
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
}