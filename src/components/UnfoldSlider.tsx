import React from 'react';

interface UnfoldSliderProps {
    progress: number;
    onProgressChange: (progress: number) => void;
}

export const UnfoldSlider: React.FC<UnfoldSliderProps> = ({ progress, onProgressChange }) => {
    return (
        <div className="unfold-slider">
            <label>展开程度：</label>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={progress}
                onChange={(e) => onProgressChange(parseFloat(e.target.value))}
            />
            <span>{Math.round(progress * 100)}%</span>
        </div>
    );
};