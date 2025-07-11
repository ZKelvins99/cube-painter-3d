import * as THREE from 'three';
import { CubeGeometry } from './CubeGeometry';

export enum UnfoldMode {
    TYPE_141_CENTER = '141_center',     // 一四一型：上下居中
    TYPE_141_LEFT = '141_left',         // 一四一型：上下居左
    TYPE_141_RIGHT = '141_right',       // 一四一型：上下居右
    TYPE_231_A = '231_a',               // 二三一型：样式A
    TYPE_231_B = '231_b',               // 二三一型：样式B
    TYPE_231_C = '231_c',               // 二三一型：样式C
    TYPE_33 = '33',                     // 三三型
    TYPE_222 = '222'                    // 二二二型
}

interface FacePosition {
    x: number;
    y: number;
    rotation: number;
}

export class UnfoldAnimation {
    private cubeGeometry: CubeGeometry;
    private unfoldProgress: number = 0;
    private currentMode: UnfoldMode = UnfoldMode.TYPE_141_CENTER;
    private originalMesh: THREE.Mesh;
    private unfoldedMeshes: THREE.Mesh[] = [];
    private group: THREE.Group;
    private faceSize: number = 2;

    // 正方体面的标识：0-右，1-左，2-上，3-下，4-前，5-后
    private faceNames = ['右', '左', '上', '下', '前', '后'];

    constructor(cubeGeometry: CubeGeometry) {
        this.cubeGeometry = cubeGeometry;
        this.originalMesh = cubeGeometry.getMesh();
        this.group = new THREE.Group();
        this.initializeUnfoldedMeshes();
    }

    private initializeUnfoldedMeshes() {
        // 为每个面创建独立的平面几何体
        const planeGeometry = new THREE.PlaneGeometry(this.faceSize, this.faceSize);

        for (let i = 0; i < 6; i++) {
            const canvas = this.cubeGeometry.getCanvas(i);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: false,
                side: THREE.DoubleSide
            });

            const planeMesh = new THREE.Mesh(planeGeometry, material);
            planeMesh.userData = {
                faceIndex: i,
                faceName: this.faceNames[i]
            };

            // 添加边框
            const edges = new THREE.EdgesGeometry(planeGeometry);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 3
            });
            const edgeLines = new THREE.LineSegments(edges, lineMaterial);
            planeMesh.add(edgeLines);

            // 添加面标识文本（使用简单的Sprite方法）
            this.addFaceLabel(planeMesh, this.faceNames[i]);

            this.unfoldedMeshes.push(planeMesh);
            this.group.add(planeMesh);
        }

        this.updateUnfoldLayout();
    }

    private addFaceLabel(mesh: THREE.Mesh, label: string) {
        // 创建文本标签的Canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;

        if (context) {
            // 设置背景为半透明
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, 128, 128);

            // 绘制文本
            context.fillStyle = 'white';
            context.font = 'bold 36px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(label, 64, 64);
        }

        // 创建纹理和精灵
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.4, 0.4, 1);
        sprite.position.set(0, 0, 0.01);

        // 将精灵添加到网格中
        mesh.add(sprite);
    }

    public setUnfoldProgress(progress: number) {
        this.unfoldProgress = Math.max(0, Math.min(1, progress));
        this.updateAnimation();
    }

    public setUnfoldMode(mode: UnfoldMode) {
        this.currentMode = mode;
        this.updateUnfoldLayout();
        this.updateAnimation();
    }

    public getCurrentMode(): UnfoldMode {
        return this.currentMode;
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    private updateAnimation() {
        const easeProgress = this.easeInOutCubic(this.unfoldProgress);

        if (easeProgress === 0) {
            // 完全立体状态
            this.originalMesh.visible = true;
            this.group.visible = false;
            this.resetMaterialTransparency();
        } else if (easeProgress === 1) {
            // 完全展开状态
            this.originalMesh.visible = false;
            this.group.visible = true;
            this.resetMaterialTransparency();
            this.updateUnfoldedTextures();
        } else {
            // 过渡状态
            this.originalMesh.visible = true;
            this.group.visible = true;

            // 调整透明度
            this.updateMaterialTransparency(this.originalMesh.material, 1 - easeProgress);

            this.group.children.forEach((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    this.updateMaterialTransparency(child.material, easeProgress);
                }
            });

            // 动画展开过程
            this.animateUnfoldProcess(easeProgress);
        }
    }

    private animateUnfoldProcess(progress: number) {
        const layout = this.getUnfoldLayout();

        // 立体状态下的初始位置和旋转
        const initialPositions = [
            new THREE.Vector3(1, 0, 0),    // 右面
            new THREE.Vector3(-1, 0, 0),   // 左面
            new THREE.Vector3(0, 1, 0),    // 上面
            new THREE.Vector3(0, -1, 0),   // 下面
            new THREE.Vector3(0, 0, 1),    // 前面
            new THREE.Vector3(0, 0, -1)    // 后面
        ];

        const initialRotations = [
            new THREE.Euler(0, Math.PI/2, 0),    // 右面
            new THREE.Euler(0, -Math.PI/2, 0),   // 左面
            new THREE.Euler(-Math.PI/2, 0, 0),   // 上面
            new THREE.Euler(Math.PI/2, 0, 0),    // 下面
            new THREE.Euler(0, 0, 0),            // 前面
            new THREE.Euler(0, Math.PI, 0)       // 后面
        ];

        this.unfoldedMeshes.forEach((mesh, index) => {
            const faceLayout = layout[index];
            const initialPos = initialPositions[index];
            const initialRot = initialRotations[index];

            // 目标位置（展开后的位置）
            const targetPos = new THREE.Vector3(
                faceLayout.x * this.faceSize,
                faceLayout.y * this.faceSize,
                0
            );

            // 目标旋转（展开后都是0旋转）
            const targetRot = new THREE.Euler(0, 0, faceLayout.rotation);

            // 插值计算当前位置和旋转
            mesh.position.lerpVectors(initialPos, targetPos, progress);

            // 旋转插值
            const currentRot = new THREE.Euler();
            currentRot.x = initialRot.x * (1 - progress) + targetRot.x * progress;
            currentRot.y = initialRot.y * (1 - progress) + targetRot.y * progress;
            currentRot.z = initialRot.z * (1 - progress) + targetRot.z * progress;
            mesh.rotation.copy(currentRot);
        });
    }

    private updateUnfoldLayout() {
        const layout = this.getUnfoldLayout();

        this.unfoldedMeshes.forEach((mesh, index) => {
            const faceLayout = layout[index];
            mesh.position.set(
                faceLayout.x * this.faceSize,
                faceLayout.y * this.faceSize,
                0
            );
            mesh.rotation.set(0, 0, faceLayout.rotation);
        });
    }

    private getUnfoldLayout(): FacePosition[] {
        // 返回6个面的展开位置，按照面的索引：0-右，1-左，2-上，3-下，4-前，5-后
        switch (this.currentMode) {
            case UnfoldMode.TYPE_141_CENTER:
                // 一四一型：上下居中
                // 布局：    [上]
                //      [左][前][右][后]
                //          [下]
                return [
                    { x: 2, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 1, y: 1, rotation: 0 },   // 上面
                    { x: 1, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 0, rotation: 0 },   // 前面
                    { x: 3, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_141_LEFT:
                // 一四一型：上下居左
                // 布局：[上]
                //      [左][前][右][后]
                //      [下]
                return [
                    { x: 2, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 0, y: 1, rotation: 0 },   // 上面
                    { x: 0, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 0, rotation: 0 },   // 前面
                    { x: 3, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_141_RIGHT:
                // 一四一型：上下居右
                // 布局：         [上]
                //      [左][前][右][后]
                //               [下]
                return [
                    { x: 2, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 3, y: 1, rotation: 0 },   // 上面
                    { x: 3, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 0, rotation: 0 },   // 前面
                    { x: 3, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_231_A:
                // 二三一型：样式A
                // 布局：[上][前]
                //      [左][右][后]
                //        [下]
                return [
                    { x: 1, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 0, y: 1, rotation: 0 },   // 上面
                    { x: 1, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 1, rotation: 0 },   // 前面
                    { x: 2, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_231_B:
                // 二三一型：样式B
                // 布局：[左][上]
                //      [前][右][后]
                //        [下]
                return [
                    { x: 1, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 1, rotation: 0 },   // 左面
                    { x: 1, y: 1, rotation: 0 },   // 上面
                    { x: 1, y: -1, rotation: 0 },  // 下面
                    { x: 0, y: 0, rotation: 0 },   // 前面
                    { x: 2, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_231_C:
                // 二三一型：样式C
                // 布局：[后][右]
                //      [左][前][上]
                //        [下]
                return [
                    { x: 1, y: 1, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 2, y: 0, rotation: 0 },   // 上面
                    { x: 1, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 0, rotation: 0 },   // 前面
                    { x: 0, y: 1, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_33:
                // 三三型
                // 布局：[左][前][右]
                //        [上][下][后]
                return [
                    { x: 2, y: 1, rotation: 0 },   // 右面
                    { x: 0, y: 1, rotation: 0 },   // 左面
                    { x: 0, y: 0, rotation: 0 },   // 上面
                    { x: 1, y: 0, rotation: 0 },   // 下面
                    { x: 1, y: 1, rotation: 0 },   // 前面
                    { x: 2, y: 0, rotation: 0 }    // 后面
                ];

            case UnfoldMode.TYPE_222:
                // 二二二型
                // 布局：[上][前]
                //      [左][右]
                //        [下][后]
                return [
                    { x: 1, y: 0, rotation: 0 },   // 右面
                    { x: 0, y: 0, rotation: 0 },   // 左面
                    { x: 0, y: 1, rotation: 0 },   // 上面
                    { x: 0, y: -1, rotation: 0 },  // 下面
                    { x: 1, y: 1, rotation: 0 },   // 前面
                    { x: 1, y: -1, rotation: 0 }   // 后面
                ];

            default:
                return this.getUnfoldLayout();
        }
    }

    private updateMaterialTransparency(material: THREE.Material | THREE.Material[], opacity: number) {
        const materials = Array.isArray(material) ? material : [material];

        materials.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshLambertMaterial ||
                mat instanceof THREE.MeshBasicMaterial ||
                mat instanceof THREE.MeshPhongMaterial) {
                mat.transparent = true;
                mat.opacity = opacity;
                mat.needsUpdate = true;
            }
        });
    }

    private resetMaterialTransparency() {
        // 重置原始网格材质透明度
        this.updateMaterialTransparency(this.originalMesh.material, 1);
        const materials = Array.isArray(this.originalMesh.material) ? this.originalMesh.material : [this.originalMesh.material];
        materials.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshLambertMaterial ||
                mat instanceof THREE.MeshBasicMaterial ||
                mat instanceof THREE.MeshPhongMaterial) {
                mat.transparent = false;
                mat.needsUpdate = true;
            }
        });

        // 重置展开网格材质透明度
        this.group.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                this.updateMaterialTransparency(child.material, 1);
                const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
                childMaterials.forEach((mat: THREE.Material) => {
                    if (mat instanceof THREE.MeshLambertMaterial ||
                        mat instanceof THREE.MeshBasicMaterial ||
                        mat instanceof THREE.MeshPhongMaterial) {
                        mat.transparent = false;
                        mat.needsUpdate = true;
                    }
                });
            }
        });
    }

    private updateUnfoldedTextures() {
        this.unfoldedMeshes.forEach((mesh, index) => {
            const canvas = this.cubeGeometry.getCanvas(index);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            if (mesh.material instanceof THREE.MeshLambertMaterial) {
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
            }
        });
    }

    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}