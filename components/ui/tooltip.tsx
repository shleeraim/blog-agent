'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot     = TooltipPrimitive.Root;
export const TooltipTrigger  = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  side = 'top',
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        style={{
          background: '#1c2330',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          color: '#e6edf3',
          maxWidth: 260,
          lineHeight: 1.55,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,.4)',
        }}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow style={{ fill: '#30363d' }} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function Tooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipRoot delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  );
}
