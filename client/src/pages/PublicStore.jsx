// src/pages/PublicStore.jsx
// Thin route wrapper — reads :slug, wraps providers, applies .store-theme CSS.
// This page is fully public — no login required.

import { useParams, Navigate } from 'react-router-dom';
import '../storefront/store-theme.css';

import { ShopProvider }     from '../storefront/context/ShopContext.jsx';
import { CartProvider }     from '../storefront/context/CartContext.jsx';
import { CustomerProvider } from '../storefront/context/CustomerContext.jsx';
import StoreFront           from '../storefront/pages/StoreFront.jsx';

export default function PublicStore() {
  const { slug } = useParams();

  if (!slug) return <Navigate to="/" replace />;

  return (
    <ShopProvider slug={slug}>
      <CartProvider slug={slug}>
        <CustomerProvider slug={slug}>
          <StoreFront />
        </CustomerProvider>
      </CartProvider>
    </ShopProvider>
  );
}
