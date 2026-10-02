import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dithering, DitheringProps } from '@paper-design/shaders-react';

// Context for timing
export interface ShaderTimingContextValue {
  time: number;
}

export const ShaderTimingContext = createContext<ShaderTimingContextValue>({
  time: 0,
});

export const useShaderFrame = () => useContext(ShaderTimingContext);

// ShaderLayout container
export interface ShaderLayoutProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ShaderLayout: React.FC<ShaderLayoutProps> = ({
  children,
  className = '',
  style,
}) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const updateTime = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      setTime((timestamp - startTime) / 1000);
      animationFrameId = requestAnimationFrame(updateTime);
    };

    animationFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <ShaderTimingContext.Provider value={{ time }}>
      <div className={`relative overflow-hidden ${className}`} style={style}>
        {children}
      </div>
    </ShaderTimingContext.Provider>
  );
};

// ShaderCanvas wrapper
export interface ShaderCanvasProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      {children}
    </div>
  );
};

// ShaderDitheringProps interface combining DitheringProps and custom container props
export interface ShaderDitheringProps extends Omit<Partial<DitheringProps>, 'shape' | 'type'> {
  className?: string;
  style?: React.CSSProperties;
  colorBack?: string;
  colorFront?: string;
  shape?: any;
  type?: any;
  size?: number;
  width?: number;
  height?: number;
}

// ShaderDithering Scene
export const ShaderDitheringScene: React.FC<ShaderDitheringProps> = ({
  className = '',
  style,
  colorBack = '#0b1020',
  colorFront = '#3949ab',
  shape = 'wave',
  type = '4x4',
  size = 2,
  ...props
}) => {
  return (
    <Dithering
      colorBack={colorBack}
      colorFront={colorFront}
      shape={shape as any}
      type={type as any}
      size={size}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
      className={className}
      {...props}
    />
  );
};

// Core ShaderDithering component
export const ShaderDithering: React.FC<ShaderDitheringProps> = (props) => {
  return <ShaderDitheringScene {...props} />;
};

// ShaderDitheringWithLayout helper
export const ShaderDitheringWithLayout: React.FC<ShaderDitheringProps> = (props) => {
  return (
    <ShaderLayout className="w-full h-full">
      <ShaderCanvas>
        <ShaderDithering {...props} />
      </ShaderCanvas>
    </ShaderLayout>
  );
};

export default ShaderDithering;
