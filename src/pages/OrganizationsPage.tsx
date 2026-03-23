import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { listOrganizations, type Organization } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { PageLoader } from '@/components/ui/page-loader'

function OrganizationsPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const { organizations, setOrganizations, setCurrentOrg } = useOrgStore()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/')
      return
    }
    listOrganizations()
      .then((orgs) => {
        setOrganizations(orgs)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, setOrganizations, navigate])

  function handleSelectOrg(org: Organization) {
    setCurrentOrg(org.org_id)
    navigate('/org/settings')
  }

  const filtered = organizations.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Home
            </button>
            <div className="h-5 w-px bg-border" />
            <LiraLogo size="sm" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        {/* Title row */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">Organizations</h1>
          <button
            onClick={() => navigate('/onboarding')}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <PlusIcon className="h-4 w-4" />
            Add Organization
          </button>
        </div>

        {/* MagnifyingGlassIcon — only shown once orgs are loaded and there's at least one */}
        {!loading && organizations.length > 0 && (
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="MagnifyingGlassIcon organizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <PageLoader />
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BuildingOffice2Icon className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-foreground">No organizations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add one to give Lira context about your team.
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="mt-5 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              <PlusIcon className="h-4 w-4" />
              Add Organization
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((org) => (
              <button
                key={org.org_id}
                onClick={() => handleSelectOrg(org)}
                className="flex w-full items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <BuildingOffice2Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{org.name}</p>
                  {org.profile?.industry && (
                    <p className="truncate text-xs text-muted-foreground">{org.profile.industry}</p>
                  )}
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No organizations match &ldquo;{search}&rdquo;
          </p>
        )}
      </main>
    </div>
  )
}

export { OrganizationsPage }
