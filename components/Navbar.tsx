import Link from 'next/link'
import CartNavLink from './CartNavLink'
import { textStyles } from './ui/Typography'

const navItems = [
  { label: 'Catalog', href: '/products' },
  { label: 'Order Hub', href: '/order-hub' },
  { label: 'Quote List', href: '/quote-list' },
]

function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-[18px] w-[18px]"
    >
      <path
        d="M10 10a3.333 3.333 0 1 0 0-6.667A3.333 3.333 0 0 0 10 10ZM4.167 16.667c0-2.762 2.611-5 5.833-5s5.833 2.238 5.833 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/30 bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col gap-3 px-6 py-3 lg:grid lg:h-16 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)] lg:gap-0 lg:p-0">
        <div className="flex items-center lg:pl-16 lg:pr-10">
          <Link href="/" className="block">
            <img
              src="/nex-supplies-logo.png"
              alt="NEX Supplies"
              className="h-9 w-auto lg:h-10"
            />
          </Link>
        </div>

        <div className="hidden lg:block lg:border-l lg:border-black/50" />

        <div className="flex items-center lg:border-l lg:border-black/50 lg:pl-8 lg:pr-16">
          <nav className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-700 lg:justify-end">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={textStyles.navLink}
              >
                {item.label}
              </Link>
            ))}
            <CartNavLink />
            <Link
              href="/account"
              aria-label="Account"
              className={`${textStyles.navLink} inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-transparent transition hover:border-black/20`}
            >
              <AccountIcon />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
