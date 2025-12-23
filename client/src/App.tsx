import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import MapView from '@/components/MapView'

const queryClient = new QueryClient()

function App() {
  return (
    <div className="h-screen bg-black/95">
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <MapView />
      </QueryClientProvider>
    </div>
  )
}

export default App
