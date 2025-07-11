import React from 'react';
import { DrawingTool } from '../core/DrawingSystem';
import { UnfoldMode } from '../core/UnfoldAnimation';

interface ToolBarProps {
    currentTool: DrawingTool;
    onToolChange: (tool: DrawingTool) => void;
    unfoldMode: UnfoldMode;
    onUnfoldModeChange: (mode: UnfoldMode) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
                                                    currentTool,
                                                    onToolChange,
                                                    unfoldMode,
                                                    onUnfoldModeChange
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

    const clearCanvas = () => {
        // 清空画布功能
        if (window.confirm('确定要清空所有绘画内容吗？')) {
            window.location.reload();
        }
    };

    const unfoldModeOptions = [
        { value: UnfoldMode.TYPE_141_CENTER, label: '一四一型 - 居中' },
        { value: UnfoldMode.TYPE_141_LEFT, label: '一四一型 - 居左' },
        { value: UnfoldMode.TYPE_141_RIGHT, label: '一四一型 - 居右' },
        { value: UnfoldMode.TYPE_231_A, label: '二三一型 - 样式A' },
        { value: UnfoldMode.TYPE_231_B, label: '二三一型 - 样式B' },
        { value: UnfoldMode.TYPE_231_C, label: '二三一型 - 样式C' },
        { value: UnfoldMode.TYPE_33, label: '三三型' },
        { value: UnfoldMode.TYPE_222, label: '二二二型' }
    ];

    return (
        <div className="toolbar">
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

            <div className="tool-group">
                <label>展开样式：</label>
                <select
                    value={unfoldMode}
                    onChange={(e) => onUnfoldModeChange(e.target.value as UnfoldMode)}
                    className="unfold-mode-select"
                >
                    {unfoldModeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="tool-group">
                <button onClick={clearCanvas} className="clear-btn">
                    🗑️ 清空画布
                </button>
            </div>
        </div>
    );
};