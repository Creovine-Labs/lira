import { MarketingNavbar } from './Navbar'
import { MarketingFooter } from './Footer'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: '#ebebeb' }}>
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  )
}
