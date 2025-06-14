import { VirtualizedTable } from "../components"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient();

function App() {

  return (
    <main className="main-container">
      <h1 className="main-heading">Create My Asset list</h1>
      <section className="table-wrapper-container">
        <QueryClientProvider client={queryClient}>
          <VirtualizedTable />
        </QueryClientProvider>
      </section>
    </main>
  )
}

export default App
