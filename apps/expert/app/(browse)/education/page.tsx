import { getPackagesByAudience, getProvidersByAudience } from '@jisane/shared/service-package/queries'
import { EducationView } from './education-view'

export default async function EducationPage() {
  const [packages, providers] = await Promise.all([
    getPackagesByAudience('expert'),
    getProvidersByAudience('expert'),
  ])

  return <EducationView packages={packages} providers={providers} />
}
