import React from 'react';
import { DrawingTool } from '../core/DrawingSystem';
import { UnfoldType } from '../core/CubeUnfoldAlgorithm';
import { CubeGeometry } from '../core/CubeGeometry';

interface ToolBarProps {
    currentTool: DrawingTool;
    onToolChange: (tool: DrawingTool) => void;
    unfoldType: UnfoldType;
    onUnfoldTypeChange: (type: UnfoldType) => void;
    cubeGeometry?: CubeGeometry;
    onFaceColorChange: (faceIndex: number, color: string) => void;
    showFaceLabels: boolean;
    onShowFaceLabelsChange: (show: boolean) => void;
    onClearFace: (faceIndex: number) => void;
    getUnfoldTypeName: (type: UnfoldType) => string;
}

export const ToolBar: React.FC<ToolBarProps> = ({
                                                    currentTool,
                                                    onToolChange,
                                                    unfoldType,
                                                    onUnfoldTypeChange,
                                                    cubeGeometry,
                                                    onFaceColorChange,
                                                    showFaceLabels,
                                                    onShowFaceLabelsChange,
                                                    onClearFace,
                                                    getUnfoldTypeName
                                                }) => {
    const handleColorChange = (color: string) => {
        onToolChange({ ...currentTool, color });
    };

    const handleSizeChange = (size: number) => {
        onToolChange({ ...currentTool, size });
    };

    const handleOpacityChange = (opacity: number) => {
        onToolChange({ ...currentTool, opacity });
    };

    const handleToolTypeChange = (type: DrawingTool['type']) => {
        onToolChange({ ...currentTool, type });
    };

    const clearAllFaces = () => {
        if (window.confirm('确定要清空所有面的绘画内容吗？')) {
            for (let i = 0; i < 6; i++) {
                onClearFace(i);
            }
        }
    };

    // 所有11种展开图类型
    const unfoldTypeOptions = [
        { value: UnfoldType.TYPE_141_A, label: getUnfoldTypeName(UnfoldType.TYPE_141_A) },
        { value: UnfoldType.TYPE_141_B, label: getUnfoldTypeName(UnfoldType.TYPE_141_B) },
        { value: UnfoldType.TYPE_141_C, label: getUnfoldTypeName(UnfoldType.TYPE_141_C) },
        { value: UnfoldType.TYPE_141_D, label: getUnfoldTypeName(UnfoldType.TYPE_141_D) },
        { value: UnfoldType.TYPE_141_E, label: getUnfoldTypeName(UnfoldType.TYPE_141_E) },
        { value: UnfoldType.TYPE_141_F, label: getUnfoldTypeName(UnfoldType.TYPE_141_F) },
        { value: UnfoldType.TYPE_231_A, label: getUnfoldTypeName(UnfoldType.TYPE_231_A) },
        { value: UnfoldType.TYPE_231_B, label: getUnfoldTypeName(UnfoldType.TYPE_231_B) },
        { value: UnfoldType.TYPE_231_C, label: getUnfoldTypeName(UnfoldType.TYPE_231_C) },
        { value: UnfoldType.TYPE_222, label: getUnfoldTypeName(UnfoldType.TYPE_222) },
        { value: UnfoldType.TYPE_33, label: getUnfoldTypeName(UnfoldType.TYPE_33) }
    ];

    const faceNames = cubeGeometry?.getFaceNames() || [];

    return (
        <div className="toolbar">
            <div className="tool-section">
                <div className="tool-group">
                    <label>绘画工具：</label>
                    <button
                        className={currentTool.type === 'brush' ? 'active' : ''}
                        onClick={() => handleToolTypeChange('brush')}
                    >
                        🖌️ 画笔
                    </button>
                    <button
                        className={currentTool.type === 'line' ? 'active' : ''}
                        onClick={() => handleToolTypeChange('line')}
                    >
                        📏 直线
                    </button>
                    <button
                        className={currentTool.type === 'eraser' ? 'active' : ''}
                        onClick={() => handleToolTypeChange('eraser')}
                    >
                        🧽 橡皮擦
                    </button>
                </div>

                <div className="tool-group">
                    <label>颜色：</label>
                    <input
                        type="color"
                        value={currentTool.color}
                        onChange={(e) => handleColorChange(e.target.value)}
                    />
                    <div className="preset-colors">
                        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(color => (
                            <button
                                key={color}
                                className={`color-preset ${currentTool.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color, border: color === '#FFFFFF' ? '2px solid #ccc' : 'none' }}
                                onClick={() => handleColorChange(color)}
                            />
                        ))}
                    </div>
                </div>

                <div className="tool-group">
                    <label>大小：</label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={currentTool.size}
                        onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                    />
                    <span>{currentTool.size}px</span>
                </div>

                <div className="tool-group">
                    <label>透明度：</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={currentTool.opacity}
                        onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    />
                    <span>{Math.round(currentTool.opacity * 100)}%</span>
                </div>
            </div>

            <div className="tool-section">
                <div className="tool-group expand-type-group">
                    <label>展开图类型：</label>
                    <select
                        value={unfoldType}
                        onChange={(e) => onUnfoldTypeChange(e.target.value as UnfoldType)}
                        className="unfold-type-select"
                    >
                        {unfoldTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="tool-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={showFaceLabels}
                            onChange={(e) => onShowFaceLabelsChange(e.target.checked)}
                        />
                        显示面标识
                    </label>
                </div>
            </div>

            <div className="tool-section">
                <div className="tool-group face-colors">
                    <label>面颜色设置：</label>
                    <div className="face-color-grid">
                        {faceNames.map((name, index) => (
                            <div key={index} className="face-color-item">
                                <label>{name}：</label>
                                <input
                                    type="color"
                                    value={cubeGeometry?.getFaceColor(index) || '#ffffff'}
                                    onChange={(e) => onFaceColorChange(index, e.target.value)}
                                />
                                <button
                                    className="clear-face-btn"
                                    onClick={() => onClearFace(index)}
                                    title={`清空${name}`}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tool-group">
                    <button onClick={clearAllFaces} className="clear-all-btn">
                        🗑️ 清空所有面
                    </button>
                </div>
            </div>
        </div>
    );
};