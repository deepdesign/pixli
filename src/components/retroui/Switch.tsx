import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

import * as SwitchPrimitive from '@radix-ui/react-switch'

type SwitchProps = SwitchPrimitive.SwitchProps

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn('control-switch', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn('control-switch-thumb')} />
    </SwitchPrimitive.Root>
  ),
)
Switch.displayName = 'Switch'
