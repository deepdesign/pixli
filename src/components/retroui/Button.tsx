import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'font-head transition-all outline-hidden cursor-pointer duration-200 font-medium flex items-center rounded-[var(--radius-sm)]',
  {
    variants: {
      variant: {
        default:
          'shadow-md hover:shadow active:shadow-none bg-primary text-primary-foreground border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-primary-hover',
        secondary:
          'shadow-md hover:shadow active:shadow-none bg-secondary shadow-primary text-secondary-foreground border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-secondary-hover',
        outline:
          'shadow-md hover:shadow active:shadow-none bg-transparent border-2 border-border transition hover:translate-y-1 active:translate-y-2 active:translate-x-1',
        link: 'bg-transparent hover:underline',
      },
      size: {
        sm: 'px-3 py-1 text-sm shadow hover:shadow-none',
        md: 'px-4 py-1.5 text-base',
        lg: 'px-6 lg:px-8 py-2 lg:py-3 text-md lg:text-lg',
        icon: 'h-10 w-10 p-0 justify-center',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'


