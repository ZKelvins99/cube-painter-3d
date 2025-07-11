import React from 'react';

interface UnfoldSliderProps {
    progress: number;
    onProgressChange: (progress: number) => void;
    label?: string;
}

export const UnfoldSlider: React.FC<UnfoldSliderProps> = ({
                                                              progress,
                                                              onProgressChange,
                                                              label = "展开程度"
                                                          }) => {
    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(event.target.value) / 100;
        onProgressChange(newProgress);
    };

    const handlePresetClick = (value: number) => {
        onProgressChange(value);
    };

    return (
        <div className="unfold-slider">
            <div className="slider-section">
                <label>{label}</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress * 100}
                    onChange={handleSliderChange}
                    className="progress-slider"
                />
                <span className="progress-value">{Math.round(progress * 100)}%</span>
            </div>

            <div className="preset-buttons">
                <button
                    className={progress === 0 ? 'active' : ''}
                    onClick={() => handlePresetClick(0)}
                    title="完全立体状态"
                >
                    立体 (0%)
                </button>
                <button
                    className={Math.abs(progress - 0.25) < 0.01 ? 'active' : ''}
                    onClick={() => handlePresetClick(0.25)}
                    title="部分展开"
                >
                    25%
                </button>
                <button
                    className={Math.abs(progress - 0.5) < 0.01 ? 'active' : ''}
                    onClick={() => handlePresetClick(0.5)}
                    title="半展开状态"
                >
                    50%
                </button>
                <button
                    className={Math.abs(progress - 0.75) < 0.01 ? 'active' : ''}
                    onClick={() => handlePresetClick(0.75)}
                    title="大部分展开"
                >
                    75%
                </button>
                <button
                    className={progress === 1 ? 'active' : ''}
                    onClick={() => handlePresetClick(1)}
                    title="完全展开状态"
                >
                    展开 (100%)
                </button>
            </div>

            <div className="animation-controls">
                <button
                    onClick={() => {
                        // 自动展开动画
                        let currentProgress = progress;
                        const targetProgress = currentProgress < 0.5 ? 1 : 0;
                        const step = (targetProgress - currentProgress) / 60; // 60帧动画

                        const animate = () => {
                            currentProgress += step;
                            if ((step > 0 && currentProgress >= targetProgress) ||
                                (step < 0 && currentProgress <= targetProgress)) {
                                currentProgress = targetProgress;
                                onProgressChange(currentProgress);
                                return;
                            }
                            onProgressChange(currentProgress);
                            requestAnimationFrame(animate);
                        };
                        animate();
                    }}
                    className="auto-animate-btn"
                >
                    🎬 自动展开/收起
                </button>
            </div>
        </div>
    );
};