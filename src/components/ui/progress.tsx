
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Adding CircularProgress component
interface CircularProgressProps {
  value: number;
  className?: string;
  indicatorColor?: string;
  trackColor?: string;
}

const CircularProgress = ({
  value,
  className,
  indicatorColor = "bg-primary",
  trackColor = "bg-secondary",
}: CircularProgressProps) => {
  const circumference = 2 * Math.PI * 40; // 40 is the radius
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          className={trackColor}
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeWidth="8"
        />
        {/* Indicator */}
        <circle
          className={`${indicatorColor} transition-all duration-300 ease-in-out`}
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
};

export { Progress, CircularProgress }
