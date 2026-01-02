import { useEffect, useRef } from 'react';
import { usePlayer } from './usePlayer';

/**
 * Hook to manage playback progress updates
 */
export function usePlayback() {
  const { isPlaying, position, updatePosition } = usePlayer();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      // Update position every second while playing
      intervalRef.current = setInterval(() => {
        updatePosition(position + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, position, updatePosition]);

  return usePlayer();
}
