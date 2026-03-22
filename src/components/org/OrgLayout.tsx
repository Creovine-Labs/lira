import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'

function OrgLayout() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { organizations, currentOrgId } = useOrgStore()

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (organizations.length === 0 && currentOrgId === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
            <BuildingOffice2Icon className="h-6 w-6 text-violet-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">No organization yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create or join an organization to access this section.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Get started
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export { OrgLayout }
