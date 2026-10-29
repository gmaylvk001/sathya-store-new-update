"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import CustomHeader from "@/components/Headernew";
import CustomFooter from "@/components/Footer";
import GlobalModals from "@/components/GlobalModals";
import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { HeaderProvider } from "@/context/HeaderContext";
import { RegionProvider } from "@/context/RegionContext";
import { CompareProvider } from "@/context/CompareContext";
import CompareBar from "@/components/CompareBar";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import AuthSessionSync from "@/components/AuthSessionSync";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <RegionProvider>
      <HeaderProvider>
        <ModalProvider>
          <WishlistProvider>
            <CartProvider>
              <AuthProvider>
                {/* CompareProvider lives inside AuthProvider so syncOnLogin()
                    can access the token set by login() */}
                <CompareProvider>
                  <AuthSessionSync />
                  <div className="flex flex-col min-h-screen">
                    {!isAdmin && <CustomHeader />}
                    <main className="relative flex-grow min-h-[calc(100vh-280px)]">{children}</main>
                    {!isAdmin && <CustomFooter />}
                    {!isAdmin && <GlobalModals />}
                    {/* CompareBar: floating bottom bar — hidden on admin pages */}
                    {!isAdmin && <CompareBar />}
                    {/* WhatsApp floating widget — hidden on admin pages */}
                    {!isAdmin && <WhatsAppWidget />}
                  </div>
                </CompareProvider>
              </AuthProvider>
            </CartProvider>
          </WishlistProvider>
        </ModalProvider>
      </HeaderProvider>
    </RegionProvider>
  );
}
