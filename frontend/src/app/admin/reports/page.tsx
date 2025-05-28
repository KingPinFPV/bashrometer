import PriceReportsManagement from '@/components/PriceReportsManagement'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">דוחות מחירים</h1>
        <PriceReportsManagement />
      </div>
    </ErrorBoundary>
  )
}