import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VirtualizedTable } from "../../components";

const queryClient = new QueryClient();

function AssetCreation() {

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

export default AssetCreation;
