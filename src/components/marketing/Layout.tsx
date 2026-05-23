import { MarketingNavbar } from './Navbar'
import { MarketingFooter } from './Footer'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fbfaf6] font-sans antialiased text-gray-950">
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  )
}
