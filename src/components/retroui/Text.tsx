import { type ElementType, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { cva, type VariantProps } from 'class-variance-authority'

const textVariants = cva('font-head', {
  variants: {
    as: {
      p: 'font-sans text-base leading-relaxed',
      li: 'font-sans text-base leading-relaxed',
      a: 'font-sans text-base leading-relaxed hover:underline underline-offset-2 decoration-primary',
      h1: 'text-4xl lg:text-5xl font-bold',
      h2: 'text-3xl lg:text-4xl font-semibold',
      h3: 'text-2xl font-medium',
      h4: 'text-xl font-normal',
      h5: 'text-lg font-normal',
      h6: 'text-base font-normal',
    },
  },
  defaultVariants: {
    as: 'p',
  },
})

interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className'>,
    VariantProps<typeof textVariants> {
  className?: string
}

export const Text = ({ className, as, ...otherProps }: TextProps) => {
  const Tag: ElementType = as ?? 'p'
  return <Tag className={cn(textVariants({ as }), className)} {...otherProps} />
}


