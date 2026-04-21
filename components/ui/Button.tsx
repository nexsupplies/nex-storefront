import Link from 'next/link'
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
type ButtonKind = 'icon' | 'icon-text' | 'text'
type IconPosition = 'left' | 'right'

type SharedProps = {
  variant?: ButtonVariant
  kind?: ButtonKind
  icon?: ReactNode
  iconPosition?: IconPosition
  fullWidth?: boolean
  className?: string
  children?: ReactNode
}

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

type ButtonAsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string
  }

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function renderContent(
  kind: ButtonKind,
  icon: ReactNode,
  iconPosition: IconPosition,
  children: ReactNode
) {
  if (kind === 'icon') {
    return <span className="btn-content">{icon}</span>
  }

  if (kind === 'icon-text') {
    return (
      <span className="btn-content">
        {iconPosition === 'left' ? icon : null}
        <span>{children}</span>
        {iconPosition === 'right' ? icon : null}
      </span>
    )
  }

  return <span className="btn-content">{children}</span>
}

export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    kind = 'text',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    children,
    ...rest
  } = props

  const disabled =
    'disabled' in props ? Boolean(props.disabled) : Boolean((props as ButtonAsLink)['aria-disabled'])

  const rootClassName = joinClasses(
    'group',
    'btn-base',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    variant === 'tertiary' && 'btn-tertiary',
    kind === 'text' && 'btn-kind-text',
    kind === 'icon-text' && 'btn-kind-icon-text',
    kind === 'icon' && 'btn-kind-icon',
    fullWidth && 'w-full',
    disabled && 'btn-disabled',
    className
  )

  const content = (
    <>
      <span className="btn-layer" aria-hidden="true" />
      <span className="btn-grid" aria-hidden="true" />
      {renderContent(kind, icon, iconPosition, children)}
    </>
  )

  if ('href' in props) {
    const { href, ...linkProps } = rest as Omit<ButtonAsLink, keyof SharedProps>

    if (disabled) {
      return (
        <span className={rootClassName} aria-disabled="true">
          {content}
        </span>
      )
    }

    return (
      <Link href={href} className={rootClassName} {...linkProps}>
        {content}
      </Link>
    )
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button
      className={rootClassName}
      type={buttonProps.type ?? 'button'}
      {...buttonProps}
    >
      {content}
    </button>
  )
}
