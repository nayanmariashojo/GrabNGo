import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import AppRoutes from "./AppRoutes";

/**
 * App — root component.
 * Wraps everything in Auth + Cart providers and sets up routing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}


