'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';

const menuItems = [
  { icon: 'material-symbols:dashboard', label: 'Dashboard', link: 'dashboard' },
  { icon: 'material-symbols:category', label: 'Category', link: 'category' },
  {
    icon: 'mdi:package-variant-closed',
    label: 'Product',
    submenu: [
      { icon: 'mdi:format-list-bulleted', label: 'Product List', link: 'product', dotColor: 'bg-green-500' },
      { icon: 'mdi:shape-outline', label: 'Variants', link: 'variants', dotColor: 'bg-blue-500' },
      { icon: 'mdi:trademark', label: 'Brand', link: 'brand', dotColor: 'bg-red-500' },
      { icon: 'mdi:upload', label: 'Bulk Upload', link: 'product/bulk_upload', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:filter-variant', label: 'Filter Group', link: 'filter_group', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:filter-outline', label: 'Filter', link: 'filter', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:plus-box-outline', label: 'New Product', link: 'newproduct', dotColor: 'bg-green-500' },
      { icon: 'material-symbols:reviews-rounded', label: 'Product Review', link: 'reviews', dotColor: 'bg-orange-500' }
    ]
  },
  { icon: 'mdi:storefront-outline', label: 'Unilet Products', link: 'unilet-products' },
  { icon: 'mdi:plus-box-multiple-outline', label: 'New Unilet Product', link: 'unilet-new-products' },
  {
    icon: 'mdi:cart-outline',
    label: 'Sales',
    submenu: [
      { icon: 'mdi:view-dashboard-outline', label: 'Dashboard', id: 'sales-dashboard', link: 'sales/dashboard', dotColor: 'bg-green-500' },
      { icon: 'mdi:clipboard-list-outline', label: 'All Orders', link: 'Allorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:home-import-outline', label: 'Home Delivery', link: 'homedelivery', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cart-off', label: 'Abandoned Order', link: 'abandonedorder', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cancel', label: 'Cancel Order', link: 'order/cancel-order', dotColor: 'bg-[#d72828]' },
      { icon: 'mdi:clipboard-check-outline', label: 'Place Orders', link: 'order/place-order', dotColor: 'bg-blue-500' },
      { icon: 'mdi:history', label: 'Order History', link: 'sathya-exist-order-history', dotColor: 'bg-yellow-500' },
    ]
  },
  {
    icon: 'mdi:archive-outline',
    label: 'Exist Sales',
    submenu: [
      { icon: 'mdi:clipboard-list-outline', label: 'Orders', id: 'exist-sales-orders', link: 'sathya-exist-orders', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:clipboard-list-outline', label: 'Order Details', id: 'exist-sales-order-details', link: 'sathya-exist-orders-details', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:credit-card-outline', label: 'Payments', id: 'exist-sales-payments', link: 'sathya-exist-payments', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:cancel', label: 'Cancel Orders', id: 'exist-sales-cancel-orders', link: 'sathya-exist-cancel-orders', dotColor: 'bg-yellow-500' },
    ]
  },
  // { icon: 'mdi:note-text-outline', label: 'Blog', link: 'blog' },
  {
    icon: 'mdi:post-outline',
    label: 'Blogs',
    submenu: [
      { icon: 'mdi:format-list-bulleted', label: 'Blog List', link: 'blogs', dotColor: 'bg-green-500' },
      { icon: 'mdi:frequently-asked-questions', label: 'Blog FAQ', link: 'blogs-faq', dotColor: 'bg-purple-500' },
    ]
  },

  {
    icon: 'mdi:store-marker-outline',
    label: 'Stores',
    submenu: [
      { icon: 'mdi:map-marker-radius-outline', label: 'Store Zones', link: 'store-zones', dotColor: 'bg-blue-500' },
      { icon: 'mdi:storefront-outline', label: 'Store Listings', link: 'store-listings', dotColor: 'bg-green-500' },
      { icon: 'mdi:account-tie-outline', label: 'Store Owners', link: 'store-owners', dotColor: 'bg-yellow-500' },
    ]
  },
  {
    icon: 'mdi:cog-outline',
    label: 'Settings',
    submenu: [
      { icon: 'mdi:home-outline', label: 'Home Settings', link: 'homesettings', dotColor: 'bg-green-500' },
      { icon: 'mdi:view-dashboard-edit-outline', label: 'Category Settings', link: 'category-pages', dotColor: 'bg-green-500' },
      { icon: 'mdi:tag-multiple-outline', label: 'Brand Settings', link: 'brand-pages', dotColor: 'bg-green-500' },
      { icon: 'mdi:store-outline', label: 'Store Settings', link: 'store', dotColor: 'bg-yellow-500' },
    ]
  },
  {
    icon: 'mdi:account-cog-outline',
    label: 'Users Settings',
    submenu: [
      { icon: 'mdi:account-outline', label: 'Users', link: 'user', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:account-tie-outline', label: 'System_Users', link: 'system_users', dotColor: 'bg-yellow-500' },
      { icon: 'mdi:shield-key-outline', label: 'Permissions', link: 'permissions', dotColor: 'bg-purple-500' },
      { icon: 'mdi:account-group-outline', label: 'Roles', link: 'roles', dotColor: 'bg-blue-500' },
      { icon: 'mdi:account-group-outline', label: 'Sathya Exist Users', link: 'exist_sathya_users', dotColor: 'bg-blue-500' },
      { icon: 'mdi:account-cancel-outline', label: 'Sathya Exist User Skipped', link: 'exist_sathya_user_skipped', dotColor: 'bg-orange-500' },
      { icon: 'mdi:card-account-details-outline', label: 'Sathya Exist User Details', link: 'exist_sathya_user_details', dotColor: 'bg-blue-500' },
    ]
  },
  {
    icon: "mdi:percent-outline",
    label: "Offer Module",
    submenu: [
      // { icon: "mdi:percent-outline", label: "Offer", link: "offer", dotColor: "bg-yellow-500" },
      { icon: "mdi:percent-outline", label: "Offers", link: "offers", permission: "offers", dotColor: "bg-yellow-500" },
      { icon: "mdi:credit-card-outline", label: "Payment Offers", link: "payment-offers", dotColor: "bg-emerald-500" },
      { icon: "mdi:swap-horizontal", label: "Exchange Offers", link: "exchange-offers-condition", dotColor: "bg-purple-500" },
      { icon: "mdi:tag-outline", label: "Offer Product", link: "offer-product", permission: "offer-product", dotColor: "bg-green-500" },
      { icon: "mdi:star-circle-outline", label: "Highlighted Products", link: "highlighted-products", permission: "highlighted-products", dotColor: "bg-blue-500" },
    ],
  },
  {
    icon: "mdi:palette-outline",
    label: "Design",
    submenu: [
      { icon: "mdi:timer-outline", label: "Offer Timer", link: "offer-timer", dotColor: "bg-yellow-500" },
      { icon: "mdi:sparkles", label: "Festival Effects", link: "festival-effects", dotColor: "bg-pink-500" },
      { icon: "mdi:rocket-launch-outline", label: "New Product Launch", link: "design/new-product-launch", dotColor: "bg-blue-500" },
    ],
  },
];

const UNILET_VIEW_MENUS = ['Dashboard', 'Category', 'Product', 'Unilet Products', 'New Unilet Product', 'Sales', 'Stores'];
const UNILET_ONLY_MENUS = ['Unilet Products', 'New Unilet Product'];

function visibleMenuItems(uniletView) {
  return uniletView
    ? menuItems.filter((item) => UNILET_VIEW_MENUS.includes(item.label))
    : menuItems.filter((item) => !UNILET_ONLY_MENUS.includes(item.label));
}
export default function AdminSider({ collapsed }) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [openMenus, setOpenMenus] = useState([]);
  const [uniletView, setUniletView] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUniletView(/(?:^|;\s*)session_store=unilet(?:;|$)/.test(document.cookie));
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes('/admin/unilet-products')) {
      setActiveMenu('Unilet Products');
      return;
    }
    // Check submenus first
    for (const item of menuItems) {
      if (item.submenu) {
        const sub = item.submenu.find((s) => pathname.includes(`/admin/${s.link}`));
        if (sub) {
          setActiveMenu(sub.id || sub.label);
          setOpenMenus((prev) => (prev.includes(item.label) ? prev : [...prev, item.label]));
          return;
        }
      }
    }
    // Then check top-level items
    for (const item of menuItems) {
      if (item.link && (pathname === `/admin/${item.link}` || pathname.startsWith(`/admin/${item.link}/`))) {
        setActiveMenu(item.label);
        return;
      }
    }
  }, [pathname]);

  useEffect(() => {
    const clickedMain = menuItems.find(item => item.label === activeMenu);
    if (clickedMain && !clickedMain.submenu) {
      setOpenMenus([]);
    }
  }, [activeMenu]);

  return (
    <aside
      id="admin-sidebar"
      className="col-start-1 row-start-2 z-30 flex h-full min-h-0 w-full flex-col overflow-y-auto border-r border-gray-200 bg-white scrollbar-hide"
    >
      <nav className="py-3">
        <ul className="space-y-1 px-3">
          {visibleMenuItems(uniletView).map((item) =>
            item.submenu ? (
              <SidebarItemWithDropdown
                key={item.label}
                item={item}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                collapsed={collapsed}
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
                router={router}
              />
            ) : (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                link={item.link}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                collapsed={collapsed}
                router={router}
              />
            )
          )}
        </ul>
      </nav>
    </aside>
  );
}

function SidebarItem({ icon, label, link, activeMenu, setActiveMenu, collapsed, router }) {
  const active = activeMenu === label;
  const [isHovered, setIsHovered] = useState(false);
  const [badgeTop, setBadgeTop] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleMouseEnter = (e) => {
    if (collapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setBadgeTop(rect.top);
      setIsHovered(true);
    }
  };

  return (
    <li 
      className="relative" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => {
          setActiveMenu(label);
          router.push(`/admin/${link}`);
        }}
        className={`w-full flex items-center px-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          active 
            ? 'bg-brandRed text-white' 
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
        aria-label={label}
      >
        <Icon icon={icon} className="text-xl" />
        {!collapsed && <span>{label}</span>}
      </button>
      
      {collapsed && isHovered && mounted && createPortal(
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-brandRed shadow-lg transition-opacity duration-200"
          style={{
            left: '60px',
            top: `${badgeTop}px`,
          }}
        >
          {label}
        </span>,
        document.body
      )}
    </li>
  );
}

function SidebarItemWithDropdown({
  item,
  activeMenu,
  setActiveMenu,
  collapsed,
  openMenus,
  setOpenMenus,
  router
}) {
  const isOpen = openMenus.includes(item.label);
  const [isHovered, setIsHovered] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const [flyoutMaxHeight, setFlyoutMaxHeight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const handleLiMouseEnter = (event) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!collapsed) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Estimate the height of the flyout menu (header + items)
    const estimatedHeight = 45 + (item.submenu.length * 44);
    
    let topPosition = rect.top;
    
    // If the flyout would extend below the viewport, shift it up
    if (topPosition + estimatedHeight > window.innerHeight - 16) {
      topPosition = Math.max(16, window.innerHeight - estimatedHeight - 16);
    }
    
    setFlyoutTop(topPosition);
    setFlyoutMaxHeight(window.innerHeight - 32); // Max height to fit within window
    
    setIsHovered(true);
  };

  const handlePortalMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (collapsed) {
      timerRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 150);
    }
  };

  const toggleMenu = () => {
    if (isOpen) {
      setOpenMenus((prev) => prev.filter((menu) => menu !== item.label));
    } else {
      setOpenMenus((prev) => [...prev, item.label]);
    }
  };

  const isActive = item.submenu.some((sub) => (sub.id || sub.label) === activeMenu);

  return (
    <li 
      className="relative" 
      onMouseEnter={handleLiMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => {
          if (collapsed) return;
          toggleMenu();
        }}
        className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'bg-red-100 text-brandRed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        } ${collapsed ? 'justify-center' : 'space-x-3'}`}
        aria-label={item.label}
        aria-haspopup="true"
      >
        <Icon icon={item.icon} className={collapsed ? 'text-2xl' : 'text-xl'} />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && (
          <Icon
            icon={isOpen ? 'mdi:chevron-down' : 'mdi:chevron-right'}
            className="text-lg"
          />
        )}
      </button>

      {collapsed && isHovered && mounted && createPortal(
        <div
          className="fixed z-[99999]"
          style={{
            left: '70px',
            top: `${flyoutTop}px`,
          }}
          onMouseEnter={handlePortalMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="pl-2">
            <div 
              className="min-w-[210px] rounded-lg border border-gray-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
              style={{ maxHeight: `${flyoutMaxHeight}px` }}
            >
              <div className="shrink-0 bg-red-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-brandRed border-b border-gray-100">
                {item.label}
              </div>
              <ul className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-1 custom-scrollbar">
                {item.submenu.map((sub) => (
                  <li key={sub.label}>
                    <button
                      onClick={() => {
                        setActiveMenu(sub.id || sub.label);
                        setIsHovered(false);
                        router.push(`/admin/${sub.link}`);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        activeMenu === (sub.id || sub.label)
                          ? 'bg-brandRed text-white'
                          : 'text-gray-700 hover:bg-red-50 hover:text-brandRed'
                      }`}
                    >
                      <Icon icon={sub.icon} className="h-4 w-4 shrink-0 text-[16px]" />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}

      {!collapsed && isOpen && (
        <ul className="ml-2 mt-1 space-y-1">
          {item.submenu.map((sub) => (
            <li key={sub.label}>
              <button
                onClick={() => {
                  setActiveMenu(sub.id || sub.label);
                  router.push(`/admin/${sub.link}`);
                }}
                className={`w-full flex items-center px-3 py-2 rounded text-sm space-x-3 ${
                  activeMenu === (sub.id || sub.label)
                    ? 'bg-brandRed text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon icon={sub.icon} className="text-lg" />
                <span>{sub.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

