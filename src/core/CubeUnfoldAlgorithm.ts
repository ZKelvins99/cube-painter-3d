import * as THREE from 'three';

export enum CubeFace {
    FRONT = 0,   // 前面 (Z+)
    BACK = 1,    // 后面 (Z-)
    LEFT = 2,    // 左面 (X-)
    RIGHT = 3,   // 右面 (X+)
    TOP = 4,     // 上面 (Y+)
    BOTTOM = 5   // 下面 (Y-)
}

export enum UnfoldType {
    TYPE_141_A = 'a1',  // 141型 - 上下居中
    TYPE_141_B = 'a2',  // 141型 - 上居左下居右
    TYPE_141_C = 'a3',  // 141型 - 上居右下居左
    TYPE_141_D = 'a4',  // 141型 - 上下居左
    TYPE_141_E = 'a5',  // 141型 - 上下居右
    TYPE_141_F = 'a6',  // 141型 - 上右下左错位
    TYPE_231_A = 'a7',  // 231型 - 样式A
    TYPE_231_B = 'a8',  // 231型 - 样式B
    TYPE_231_C = 'a9',  // 231型 - 样式C
    TYPE_222   = 'a10', // 222型
    TYPE_33    = 'a11'  // 33型
}

// 铰链连接信息
export interface HingeConnection {
    face1: CubeFace;
    face2: CubeFace;
    edge: string;
    axis: THREE.Vector3;    // 旋转轴方向
    pivot: THREE.Vector3;   // 旋转轴位置
}

// 面的展开信息
export interface FaceUnfoldInfo {
    face: CubeFace;
    isFixed: boolean;           // 是否为固定面
    parentFace: CubeFace | null;// 父面
    hingeConnection: HingeConnection | null; // 铰链连接
    unfoldAngle: number;        // 展开角度（弧度）
    unfoldOrder: number;        // 展开顺序
    finalPosition: THREE.Vector3; // 最终位置（仅用于验证）
}

export class CubeUnfoldAlgorithm {
    private faceSize: number;

    constructor(faceSize: number = 2) {
        this.faceSize = faceSize;
    }

    // 获取指定类型的展开信息
    public getUnfoldPattern(type: UnfoldType): FaceUnfoldInfo[] {
        switch (type) {
            case UnfoldType.TYPE_141_A: return this.getPattern141A();
            case UnfoldType.TYPE_141_B: return this.getPattern141B();
            case UnfoldType.TYPE_141_C: return this.getPattern141C();
            case UnfoldType.TYPE_141_D: return this.getPattern141D();
            case UnfoldType.TYPE_141_E: return this.getPattern141E();
            case UnfoldType.TYPE_141_F: return this.getPattern141F();
            case UnfoldType.TYPE_231_A: return this.getPattern231A();
            case UnfoldType.TYPE_231_B: return this.getPattern231B();
            case UnfoldType.TYPE_231_C: return this.getPattern231C();
            case UnfoldType.TYPE_222: return this.getPattern222();
            case UnfoldType.TYPE_33: return this.getPattern33();
            default: return this.getPattern141A();
        }
    }

    // 计算展开状态下每个面的变换矩阵
    public calculateUnfoldTransforms(type: UnfoldType, progress: number): Map<CubeFace, THREE.Matrix4> {
        const pattern = this.getUnfoldPattern(type);
        const transforms = new Map<CubeFace, THREE.Matrix4>();

        // 按展开顺序处理每个面
        const sortedFaces = pattern.sort((a, b) => a.unfoldOrder - b.unfoldOrder);

        // 先设置固定面的变换
        const fixedFace = sortedFaces.find(f => f.isFixed);
        if (fixedFace) {
            transforms.set(fixedFace.face, this.getInitialTransform(fixedFace.face));
        }

        // 递归计算其他面的变换
        sortedFaces.forEach(faceInfo => {
            if (!faceInfo.isFixed) {
                const transform = this.calculateFaceTransform(faceInfo, progress, transforms);
                transforms.set(faceInfo.face, transform);
            }
        });

        return transforms;
    }

    // 计算单个面的变换
    private calculateFaceTransform(
        faceInfo: FaceUnfoldInfo,
        progress: number,
        existingTransforms: Map<CubeFace, THREE.Matrix4>
    ): THREE.Matrix4 {
        if (faceInfo.isFixed) {
            return this.getInitialTransform(faceInfo.face);
        }

        // 获取父面的变换
        const parentTransform = faceInfo.parentFace !== null
            ? existingTransforms.get(faceInfo.parentFace)
            : new THREE.Matrix4();

        if (!parentTransform || !faceInfo.hingeConnection) {
            return this.getInitialTransform(faceInfo.face);
        }

        // 计算展开进度（考虑顺序延迟）
        const adjustedProgress = this.calculateOrderedProgress(progress, faceInfo.unfoldOrder);

        // 计算旋转角度
        const currentAngle = faceInfo.unfoldAngle * adjustedProgress;

        // 创建铰链旋转
        const hingeRotation = new THREE.Matrix4().makeRotationAxis(
            faceInfo.hingeConnection.axis.normalize(),
            currentAngle
        );

        // 创建平移到铰链轴
        const toPivot = new THREE.Matrix4().makeTranslation(
            -faceInfo.hingeConnection.pivot.x,
            -faceInfo.hingeConnection.pivot.y,
            -faceInfo.hingeConnection.pivot.z
        );

        // 创建从铰链轴平移回来
        const fromPivot = new THREE.Matrix4().makeTranslation(
            faceInfo.hingeConnection.pivot.x,
            faceInfo.hingeConnection.pivot.y,
            faceInfo.hingeConnection.pivot.z
        );

        // 组合变换：移到轴 -> 旋转 -> 移回来 -> 父面变换
        const localTransform = new THREE.Matrix4()
            .multiplyMatrices(fromPivot, hingeRotation)
            .multiply(toPivot)
            .multiply(this.getInitialTransform(faceInfo.face));

        return new THREE.Matrix4().multiplyMatrices(parentTransform, localTransform);
    }

    // 计算有序展开进度
    private calculateOrderedProgress(globalProgress: number, order: number): number {
        const maxOrder = 3;
        const delay = 0.15; // 每个顺序的延迟

        const startTime = (order / maxOrder) * delay;
        const duration = 1 - delay;

        if (globalProgress <= startTime) return 0;
        if (globalProgress >= startTime + duration) return 1;

        return (globalProgress - startTime) / duration;
    }

    // 获取初始变换（立体状态）
    private getInitialTransform(face: CubeFace): THREE.Matrix4 {
        const matrix = new THREE.Matrix4();
        const position = this.getInitialPosition(face);
        const rotation = this.getInitialRotation(face);

        matrix.makeRotationFromEuler(rotation);
        matrix.setPosition(position);

        return matrix;
    }

    private getInitialPosition(face: CubeFace): THREE.Vector3 {
        const offset = this.faceSize / 2;

        switch (face) {
            case CubeFace.FRONT: return new THREE.Vector3(0, 0, offset);
            case CubeFace.BACK: return new THREE.Vector3(0, 0, -offset);
            case CubeFace.LEFT: return new THREE.Vector3(-offset, 0, 0);
            case CubeFace.RIGHT: return new THREE.Vector3(offset, 0, 0);
            case CubeFace.TOP: return new THREE.Vector3(0, offset, 0);
            case CubeFace.BOTTOM: return new THREE.Vector3(0, -offset, 0);
            default: return new THREE.Vector3(0, 0, 0);
        }
    }

    private getInitialRotation(face: CubeFace): THREE.Euler {
        switch (face) {
            case CubeFace.FRONT: return new THREE.Euler(0, 0, 0);
            case CubeFace.BACK: return new THREE.Euler(0, Math.PI, 0);
            case CubeFace.LEFT: return new THREE.Euler(0, -Math.PI/2, 0);
            case CubeFace.RIGHT: return new THREE.Euler(0, Math.PI/2, 0);
            case CubeFace.TOP: return new THREE.Euler(-Math.PI/2, 0, 0);
            case CubeFace.BOTTOM: return new THREE.Euler(Math.PI/2, 0, 0);
            default: return new THREE.Euler(0, 0, 0);
        }
    }

    // 141型展开图 - A型（上下居中）
    // 展开图布局：
    //     [上]
    // [左][前][右][后]
    //     [下]
    private getPattern141A(): FaceUnfoldInfo[] {
        const s = this.faceSize;

        return [
            {
                face: CubeFace.FRONT,
                isFixed: true,
                parentFace: null,
                hingeConnection: null,
                unfoldAngle: 0,
                unfoldOrder: 0,
                finalPosition: new THREE.Vector3(0, 0, 0)
            },
            {
                face: CubeFace.LEFT,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.LEFT,
                    edge: 'front-left',
                    axis: new THREE.Vector3(0, 1, 0), // Y轴旋转
                    pivot: new THREE.Vector3(-s/2, 0, s/2) // 前面左边缘
                },
                unfoldAngle: Math.PI/2, // 90度展开
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(-s, 0, 0)
            },
            {
                face: CubeFace.RIGHT,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.RIGHT,
                    edge: 'front-right',
                    axis: new THREE.Vector3(0, 1, 0),
                    pivot: new THREE.Vector3(s/2, 0, s/2) // 前面右边缘
                },
                unfoldAngle: -Math.PI/2, // -90度展开
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(s, 0, 0)
            },
            {
                face: CubeFace.BACK,
                isFixed: false,
                parentFace: CubeFace.RIGHT,
                hingeConnection: {
                    face1: CubeFace.RIGHT,
                    face2: CubeFace.BACK,
                    edge: 'right-back',
                    axis: new THREE.Vector3(0, 1, 0),
                    pivot: new THREE.Vector3(s, 0, s/2) // 右面右边缘
                },
                unfoldAngle: -Math.PI/2,
                unfoldOrder: 2,
                finalPosition: new THREE.Vector3(s*2, 0, 0)
            },
            {
                face: CubeFace.TOP,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.TOP,
                    edge: 'front-top',
                    axis: new THREE.Vector3(1, 0, 0), // X轴旋转
                    pivot: new THREE.Vector3(0, s/2, s/2) // 前面上边缘
                },
                unfoldAngle: Math.PI/2,
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(0, s, 0)
            },
            {
                face: CubeFace.BOTTOM,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.BOTTOM,
                    edge: 'front-bottom',
                    axis: new THREE.Vector3(1, 0, 0),
                    pivot: new THREE.Vector3(0, -s/2, s/2) // 前面下边缘
                },
                unfoldAngle: -Math.PI/2,
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(0, -s, 0)
            }
        ];
    }

    // 141型展开图 - B型（上居左下居右）
    private getPattern141B(): FaceUnfoldInfo[] {
        const s = this.faceSize;

        return [
            {
                face: CubeFace.FRONT,
                isFixed: true,
                parentFace: null,
                hingeConnection: null,
                unfoldAngle: 0,
                unfoldOrder: 0,
                finalPosition: new THREE.Vector3(0, 0, 0)
            },
            {
                face: CubeFace.LEFT,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.LEFT,
                    edge: 'front-left',
                    axis: new THREE.Vector3(0, 1, 0),
                    pivot: new THREE.Vector3(-s/2, 0, s/2)
                },
                unfoldAngle: Math.PI/2,
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(-s, 0, 0)
            },
            {
                face: CubeFace.RIGHT,
                isFixed: false,
                parentFace: CubeFace.FRONT,
                hingeConnection: {
                    face1: CubeFace.FRONT,
                    face2: CubeFace.RIGHT,
                    edge: 'front-right',
                    axis: new THREE.Vector3(0, 1, 0),
                    pivot: new THREE.Vector3(s/2, 0, s/2)
                },
                unfoldAngle: -Math.PI/2,
                unfoldOrder: 1,
                finalPosition: new THREE.Vector3(s, 0, 0)
            },
            {
                face: CubeFace.BACK,
                isFixed: false,
                parentFace: CubeFace.RIGHT,
                hingeConnection: {
                    face1: CubeFace.RIGHT,
                    face2: CubeFace.BACK,
                    edge: 'right-back',
                    axis: new THREE.Vector3(0, 1, 0),
                    pivot: new THREE.Vector3(s, 0, s/2)
                },
                unfoldAngle: -Math.PI/2,
                unfoldOrder: 2,
                finalPosition: new THREE.Vector3(s*2, 0, 0)
            },
            {
                face: CubeFace.TOP,
                isFixed: false,
                parentFace: CubeFace.LEFT,
                hingeConnection: {
                    face1: CubeFace.LEFT,
                    face2: CubeFace.TOP,
                    edge: 'left-top',
                    axis: new THREE.Vector3(1, 0, 0),
                    pivot: new THREE.Vector3(-s, s/2, s/2)
                },
                unfoldAngle: Math.PI/2,
                unfoldOrder: 2,
                finalPosition: new THREE.Vector3(-s, s, 0)
            },
            {
                face: CubeFace.BOTTOM,
                isFixed: false,
                parentFace: CubeFace.RIGHT,
                hingeConnection: {
                    face1: CubeFace.RIGHT,
                    face2: CubeFace.BOTTOM,
                    edge: 'right-bottom',
                    axis: new THREE.Vector3(1, 0, 0),
                    pivot: new THREE.Vector3(s, -s/2, s/2)
                },
                unfoldAngle: -Math.PI/2,
                unfoldOrder: 2,
                finalPosition: new THREE.Vector3(s, -s, 0)
            }
        ];
    }

    // 其他展开模式（简化版本，实际项目中需要完整实现）
    private getPattern141C(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern141D(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern141E(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern141F(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern231A(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern231B(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern231C(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern222(): FaceUnfoldInfo[] { return this.getPattern141A(); }
    private getPattern33(): FaceUnfoldInfo[] { return this.getPattern141A(); }

    // 获取展开图类型的显示名称
    public getUnfoldTypeName(type: UnfoldType): string {
        const names: Record<UnfoldType, string> = {
            [UnfoldType.TYPE_141_A]: '141型-A (上下居中)',
            [UnfoldType.TYPE_141_B]: '141型-B (上左下右)',
            [UnfoldType.TYPE_141_C]: '141型-C (上右下左)',
            [UnfoldType.TYPE_141_D]: '141型-D (上下居左)',
            [UnfoldType.TYPE_141_E]: '141型-E (上下居右)',
            [UnfoldType.TYPE_141_F]: '141型-F (错位型)',
            [UnfoldType.TYPE_231_A]: '231型-A',
            [UnfoldType.TYPE_231_B]: '231型-B',
            [UnfoldType.TYPE_231_C]: '231型-C',
            [UnfoldType.TYPE_222]: '222型',
            [UnfoldType.TYPE_33]: '33型'
        };
        return names[type];
    }
}