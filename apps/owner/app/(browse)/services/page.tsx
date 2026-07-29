import { getPackagesByAudience, getProvidersByAudience } from '@jisane/shared/service-package/queries'
import { ServicesView } from './services-view'

export default async function ServicesPage() {
  const [packages, providers] = await Promise.all([
    getPackagesByAudience('owner'),
    getProvidersByAudience('owner'),
  ])

  return <ServicesView packages={packages} providers={providers} />
}
