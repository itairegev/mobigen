import React from 'react';
import { DeviceType, DEVICE_SPECS } from '../types';
import { cn } from '../../utils/cn';

export interface DeviceFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  showStatusBar?: boolean;
  showHomeIndicator?: boolean;
  scale?: number;
  className?: string;
  time?: string;
}

function StatusBar({ device, time }: { device: DeviceType; time?: string }) {
  const spec = DEVICE_SPECS[device];
  const currentTime = time || new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      className="status-bar flex items-center justify-between px-6 text-white"
      style={{ height: `${spec.statusBarHeight}px` }}
      role="presentation"
      aria-hidden="true"
    >
      <span className="text-sm font-semibold">{currentTime}</span>
      <div className="flex items-center gap-1.5">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2" width="3" height="10" rx="1" />
          <rect x="15" y="0" width="2" height="12" rx="1" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div className="home-indicator flex items-center justify-center py-2" role="presentation" aria-hidden="true">
      <div className="w-32 h-1 bg-white bg-opacity-30 rounded-full" />
    </div>
  );
}

function DynamicIsland() {
  return (
    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-9 bg-black rounded-3xl" />
  );
}

function Notch() {
  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-52 h-8 bg-black rounded-b-3xl" />
  );
}

function PunchHole() {
  return (
    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full" />
  );
}

export function DeviceFrame({
  device,
  children,
  showStatusBar = true,
  showHomeIndicator = true,
  scale = 1,
  className = '',
  time,
}: DeviceFrameProps) {
  const spec = DEVICE_SPECS[device];
  const hasHomeIndicator = showHomeIndicator && spec.homeIndicatorHeight > 0;

  const renderCutout = () => {
    switch (spec.notchType) {
      case 'dynamic-island':
        return <DynamicIsland />;
      case 'notch':
        return <Notch />;
      case 'punch-hole':
        return <PunchHole />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn('device-frame relative inline-flex flex-col transition-transform', className)}
      style={{
        width: `${spec.width * scale}px`,
        height: `${spec.height * scale}px`,
        transformOrigin: 'top left',
      }}
      role="presentation"
      aria-label={`${device} device frame`}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundColor: spec.frameColor,
          borderRadius: `${spec.cornerRadius * scale}px`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
        }}
      >
        <div
          className="device-screen absolute inset-2 bg-white overflow-hidden flex flex-col"
          style={{ borderRadius: `${(spec.cornerRadius - 8) * scale}px` }}
        >
          {renderCutout()}
          {showStatusBar && <StatusBar device={device} time={time} />}
          <div className="screen-content flex-1 overflow-hidden relative bg-gray-50">
            {children}
          </div>
          {hasHomeIndicator && <HomeIndicator />}
        </div>
      </div>
    </div>
  );
}
