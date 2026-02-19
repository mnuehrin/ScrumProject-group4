"use client"

import * as React from "react"
import { Button as BaseButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GlassCustomization } from "@/lib/glass-utils"
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects"

export interface ButtonProps
  extends Omit<React.ComponentProps<typeof BaseButton>, "glass"> {
  effect?: HoverEffect
  glass?: GlassCustomization
}

/**
 * Glass UI Button - built on top of the base Button component.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, effect = "lift", variant = "glass", glass, ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        variant={variant}
        glass={glass}
        className={cn(
          "relative overflow-hidden",
          hoverEffects({ hover: effect }),
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
