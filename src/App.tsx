import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Layout } from "./components/Layout";
import { PrivateRoute } from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route
                path="checkout"
                element={
                  <PrivateRoute>
                    <CheckoutPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <PrivateRoute>
                    <OrdersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="orders/:orderId"
                element={
                  <PrivateRoute>
                    <OrderDetailPage />
                  </PrivateRoute>
                }
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route
                path="me"
                element={
                  <PrivateRoute>
                    <MyPage />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
