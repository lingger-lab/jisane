import { getPackagesByAudience } from '@jisane/shared/service-package/queries'
import { ServicesView } from './services-view'

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string }>
}) {
  const [{ pillar }, packages] = await Promise.all([
    searchParams,
    getPackagesByAudience('owner'),
  ])

  return <ServicesView packages={packages} initialPillar={pillar} />
}
