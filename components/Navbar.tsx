import Link from 'next/link'
import CartNavLink from './CartNavLink'
import { textStyles } from './ui/Typography'

const navItems = [
  { label: 'Catalog', href: '/products' },
  { label: 'Order Hub', href: '/order-hub' },
  { label: 'Quote List', href: '/quote-list' },
  { label: 'Account', href: '/account' },
]

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
          </nav>
        </div>
      </div>
    </header>
  )
}
