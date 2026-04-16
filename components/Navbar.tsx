import Link from 'next/link'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/products' },
  { label: 'Order Hub', href: '/order-hub' },
  { label: 'Quote Hub', href: '/quote-list' },
  { label: 'Cart', href: '/cart' },
  { label: 'Account', href: '/account' },
]

export default function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          NEX Supplies
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-700 hover:text-black transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
