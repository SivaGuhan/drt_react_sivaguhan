import { BrowserRouter, Routes, Route } from "react-router-dom";
import AssetCreation from "./asset-creation";
import AssetCheckout from "./asset-checkout";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AssetCreation />} />
        <Route path="/checkout" element={<AssetCheckout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
