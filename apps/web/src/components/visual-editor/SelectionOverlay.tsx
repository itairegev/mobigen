'use client';

import { useVisualEditor } from '../../hooks/useVisualEditor';

interface SelectionOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * Selection Overlay - renders visual indicators for selected/hovered elements
 */
export function SelectionOverlay({ containerRef }: SelectionOverlayProps) {
  const { selectedElement, hoveredElement, isDesignMode } = useVisualEditor();

  if (!isDesignMode) return null;

  const containerRect = containerRef.current?.getBoundingClientRect();

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Hovered element outline */}
      {hoveredElement && hoveredElement.id !== selectedElement?.id && containerRect && (
        <div
          className="absolute border-2 border-blue-400 border-dashed rounded transition-all duration-75"
          style={{
            left: hoveredElement.bounds.x - containerRect.left,
            top: hoveredElement.bounds.y - containerRect.top,
            width: hoveredElement.bounds.width,
            height: hoveredElement.bounds.height,
          }}
        >
          {/* Element type badge */}
          <div className="absolute -top-6 left-0 bg-blue-400 text-white text-xs px-2 py-0.5 rounded">
            {hoveredElement.type}
          </div>
        </div>
      )}

      {/* Selected element outline */}
      {selectedElement && containerRect && (
        <div
          className="absolute border-2 border-primary-500 rounded shadow-lg transition-all duration-75"
          style={{
            left: selectedElement.bounds.x - containerRect.left,
            top: selectedElement.bounds.y - containerRect.top,
            width: selectedElement.bounds.width,
            height: selectedElement.bounds.height,
          }}
        >
          {/* Element type badge */}
          <div className="absolute -top-6 left-0 bg-primary-500 text-white text-xs px-2 py-0.5 rounded font-medium">
            {selectedElement.type}
          </div>

          {/* Resize handles */}
          <ResizeHandle position="nw" />
          <ResizeHandle position="ne" />
          <ResizeHandle position="sw" />
          <ResizeHandle position="se" />
          <ResizeHandle position="n" />
          <ResizeHandle position="s" />
          <ResizeHandle position="e" />
          <ResizeHandle position="w" />
        </div>
      )}
    </div>
  );
}

interface ResizeHandleProps {
  position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
}

function ResizeHandle({ position }: ResizeHandleProps) {
  const positionStyles: Record<string, string> = {
    nw: '-left-1 -top-1 cursor-nw-resize',
    ne: '-right-1 -top-1 cursor-ne-resize',
    sw: '-left-1 -bottom-1 cursor-sw-resize',
    se: '-right-1 -bottom-1 cursor-se-resize',
    n: 'left-1/2 -translate-x-1/2 -top-1 cursor-n-resize',
    s: 'left-1/2 -translate-x-1/2 -bottom-1 cursor-s-resize',
    e: '-right-1 top-1/2 -translate-y-1/2 cursor-e-resize',
    w: '-left-1 top-1/2 -translate-y-1/2 cursor-w-resize',
  };

  return (
    <div
      className={`absolute w-2 h-2 bg-white border border-primary-500 rounded-sm pointer-events-auto ${positionStyles[position]}`}
    />
  );
}

export default SelectionOverlay;
