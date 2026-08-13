import { getPackagesByAudience, getProvidersByAudience } from '@jisane/shared/service-package/queries'
import { ServicesView } from './services-view'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string }>
}) {
  const [{ pillar }, packages, providers] = await Promise.all([
    searchParams,
    getPackagesByAudience('owner'),
    getProvidersByAudience('owner'),
  ])

  return <ServicesView packages={packages} providers={providers} initialPillar={pillar} />
}
