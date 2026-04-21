import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export const textStyles = {
  h1Hero: 'type-h1-hero',
  h2Section: 'type-h2-section',
  h3ProductTitle: 'type-h3-product-title',
  h4CardTitle: 'type-h4-card-title',
  bodyLg: 'type-body-lg',
  bodyMd: 'type-body-md',
  bodySm: 'type-body-sm',
  label: 'type-label',
  caption: 'type-caption',
  muted: 'type-muted',
  price: 'type-price',
  navLink: 'type-nav-link',
  buttonText: 'type-button-text',
} as const

export type TextVariant = keyof typeof textStyles

type TextProps<T extends ElementType> = {
  as?: T
  variant: TextVariant
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export default function Text<T extends ElementType = 'p'>({
  as,
  variant,
  className = '',
  children,
  ...props
}: TextProps<T>) {
  const Component = (as || 'p') as ElementType
  const variantClassName = textStyles[variant]
  const mergedClassName = `${variantClassName} ${className}`.trim()

  return (
    <Component className={mergedClassName} {...props}>
      {children}
    </Component>
  )
}
