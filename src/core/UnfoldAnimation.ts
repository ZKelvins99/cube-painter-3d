import * as THREE from 'three';
import { CubeGeometry } from './CubeGeometry';
import { CubeUnfoldAlgorithm, UnfoldType, CubeFace, FaceUnfoldInfo, HingeConnection } from './CubeUnfoldAlgorithm';

export class UnfoldAnimation {
    private cubeGeometry: CubeGeometry;
    private unfoldProgress: number = 0;
    private currentType: UnfoldType = UnfoldType.TYPE_141_A;
    private faceMeshes: THREE.Mesh[] = [];
    private hingeLines: THREE.Line[] = [];
    private group: THREE.Group;
    private algorithm: CubeUnfoldAlgorithm;
    private faceSize: number = 2;

    constructor(cubeGeometry: CubeGeometry, faceSize: number = 2) {
        this.cubeGeometry = cubeGeometry;
        this.faceSize = faceSize;
        this.algorithm = new CubeUnfoldAlgorithm(faceSize);
        this.group = new THREE.Group();

        this.initializeFaceMeshes();
        this.updateHingeLines();
    }

    private initializeFaceMeshes() {
        const planeGeometry = new THREE.PlaneGeometry(this.faceSize, this.faceSize);

        // 创建6个独立的面网格
        for (let i = 0; i < 6; i++) {
            const canvas = this.cubeGeometry.getCanvas(i);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(planeGeometry, material);
            mesh.userData = {
                faceIndex: i,
                cubeFace: i as CubeFace
            };

            // 添加面边框
            const edges = new THREE.EdgesGeometry(planeGeometry);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x333333,
                linewidth: 2
            });
            const edgeLines = new THREE.LineSegments(edges, lineMaterial);
            mesh.add(edgeLines);

            this.faceMeshes.push(mesh);
            this.group.add(mesh);
        }

        // 设置初始变换
        this.updateFaceTransforms();
    }

    public setUnfoldProgress(progress: number) {
        this.unfoldProgress = Math.max(0, Math.min(1, progress));
        this.updateFaceTransforms();
        this.updateHingeVisibility();
    }

    public setUnfoldType(type: UnfoldType) {
        this.currentType = type;
        this.updateHingeLines();
        this.updateFaceTransforms();
    }

    public getCurrentType(): UnfoldType {
        return this.currentType;
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    private updateFaceTransforms() {
        const transforms = this.algorithm.calculateUnfoldTransforms(this.currentType, this.unfoldProgress);

        this.faceMeshes.forEach((mesh, index) => {
            const cubeFace = index as CubeFace;
            const transform = transforms.get(cubeFace);

            if (transform) {
                mesh.matrix.copy(transform);
                mesh.matrixAutoUpdate = false;
            }
        });

        // 更新纹理
        this.updateTextures();
    }

    private updateTextures() {
        this.faceMeshes.forEach((mesh, index) => {
            const canvas = this.cubeGeometry.getCanvas(index);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            if (mesh.material instanceof THREE.MeshLambertMaterial) {
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
            }
        });
    }

    private updateHingeLines() {
        // 清除现有铰链线
        this.hingeLines.forEach(line => {
            this.group.remove(line);
        });
        this.hingeLines = [];

        const pattern = this.algorithm.getUnfoldPattern(this.currentType);

        // 为每个铰链连接创建指示线
        pattern.forEach(faceInfo => {
            if (faceInfo.hingeConnection) {
                const line = this.createHingeLine(faceInfo.hingeConnection);
                this.hingeLines.push(line);
                this.group.add(line);
            }
        });
    }

    private createHingeLine(hinge: HingeConnection): THREE.Line {
        // 计算铰链线的端点
        const halfSize = this.faceSize / 2;
        const start = hinge.pivot.clone().add(hinge.axis.clone().multiplyScalar(-halfSize));
        const end = hinge.pivot.clone().add(hinge.axis.clone().multiplyScalar(halfSize));

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xff4444,
            linewidth: 4,
            transparent: true,
            opacity: 0
        });

        return new THREE.Line(geometry, material);
    }

    private updateHingeVisibility() {
        const opacity = this.unfoldProgress > 0.1 && this.unfoldProgress < 0.9 ? 0.8 : 0;

        this.hingeLines.forEach(line => {
            if (line.material instanceof THREE.LineBasicMaterial) {
                line.material.opacity = opacity;
                line.material.needsUpdate = true;
            }
        });
    }

    public getAllUnfoldTypes(): UnfoldType[] {
        return [
            UnfoldType.TYPE_141_A,
            UnfoldType.TYPE_141_B,
            UnfoldType.TYPE_141_C,
            UnfoldType.TYPE_141_D,
            UnfoldType.TYPE_141_E,
            UnfoldType.TYPE_141_F,
            UnfoldType.TYPE_231_A,
            UnfoldType.TYPE_231_B,
            UnfoldType.TYPE_231_C,
            UnfoldType.TYPE_222,
            UnfoldType.TYPE_33
        ];
    }

    public getUnfoldTypeName(type: UnfoldType): string {
        return this.algorithm.getUnfoldTypeName(type);
    }
}