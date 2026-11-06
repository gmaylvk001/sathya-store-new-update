"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBannerConfigForm from "@/app/admin/components/category-pages/TopBannerConfigForm";

/**
 * Same Home Settings Top Banner form.
 * Saves through /api/home-topbanner. Does not touch other home components.
 */
export default function TopBannerEditor({ pageId }) {
  const router = useRouter();
  const backToList = () => router.push("/admin/design/top-banner");

  return (
    <div className="w-full py-4">
      <div className="mb-4">
        <Link
          href="/admin/design/top-banner"
          className="text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          ← Top Banner
        </Link>
      </div>
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <TopBannerConfigForm
          categoryId={pageId}
          pageType="home"
          categoryName="Home Page"
          apiBase="/api/home-topbanner"
          ownerIdKey="pageId"
          onCancel={backToList}
          onSaved={backToList}
        />
      </div>
    </div>
  );
}
