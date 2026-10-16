import { NextResponse } from 'next/server';
import { join } from 'path';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import { format } from 'date-fns';
import { writeFile } from 'fs/promises';
import Product from "@/models/product";
import Category from  "@/models/ecom_category_info";
import Brand  from "@/models/ecom_brand_info";
import formidable from 'formidable';
import md5 from "md5";
import mongoose from 'mongoose';
import FilterGroup from '@/models/ecom_filter_group_infos';
import Filter from "@/models/ecom_filter_infos";
import ProductFilter from "@/models/ecom_productfilter_info";
import GroupInfo from '@/models/ecom_group_name_info';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req) {
    try {

        const formData  = await req.formData();
        const file      = formData.get('excel');

        if (!file) {
            return NextResponse.json(
                { error: 'Excel or CSV file is required.' },
                { status: 400 }
            );
        }

        const escapeRegex = (text) => {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const makeSlug = (text = '') => {
            return text
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^\w\s.-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
        };

        const fileName  = file.name.toLowerCase();
        const buffer    = Buffer.from(await file.arrayBuffer());
        let rows        = [];

        if (fileName.endsWith('.csv')) {
            const csvText   = buffer.toString('utf-8');
            const workbook  = XLSX.read(csvText, { type: 'string' });
            rows            = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        } else {
            const workbook  = XLSX.read(buffer);
            rows            = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        }

        const errors        = [];
        let addedCount      = 0;
        let updateCount     = 0;

        // In-memory caches to speed up large uploads (e.g. 6000+ rows)
        const productCache = new Map();
        const categoryCache = new Map();
        const groupInfoCache = new Map();
        const filterGroupCache = new Map();
        const filterCache = new Map();
        const groupFilterIdsCache = new Map();

        for (let [index, row] of rows.entries()) {
            try {
                const item_code = (
                    row.item_code ??
                    row.ItemCode ??
                    row.itemno ??
                    row.item_no ??
                    row.itemcode ??
                    ''
                ).toString().trim();

                let filter_group_name = (
                    row.filter_group_name ??
                    row.filter_group ??
                    row.FilterGroup ??
                    row['Filter Group'] ??
                    row.group_name ??
                    ''
                ).toString().trim();

                const filter_name = (
                    row.filter_name ??
                    row.filter_value ??
                    row.FilterName ??
                    row['Filter Name'] ??
                    row.value ??
                    ''
                ).toString().trim();

                if (!item_code || !filter_group_name || !filter_name) {
                    errors.push({
                        row: index + 2,
                        error: `Missing required fields (item_code: "${item_code}", filter_group: "${filter_group_name}", filter_name: "${filter_name}")`,
                    });
                    continue;
                }

                // 1. Resolve Product by item_code
                let product = productCache.get(item_code);
                if (!product) {
                    product = await Product.findOne({ item_code }).select('_id category sub_category');
                    if (product) productCache.set(item_code, product);
                }

                if (!product) {
                    errors.push({
                        row: index + 2,
                        error: `Product not found for item_code: ${item_code}`,
                    });
                    continue;
                }

                // 2. Special group mapping for "size" filter group
                if (filter_group_name.toLowerCase() === "size") {
                    const cat_id_str = product.sub_category?.toString().trim() || product.category?.toString().trim();

                    if (cat_id_str && mongoose.Types.ObjectId.isValid(cat_id_str)) {
                        let category = categoryCache.get(cat_id_str);
                        if (!category) {
                            category = await Category.findById(cat_id_str).select('category_slug');
                            if (category) categoryCache.set(cat_id_str, category);
                        }

                        if (category) {
                            let groupInfo = groupInfoCache.get(category.category_slug);
                            if (!groupInfo) {
                                groupInfo = await GroupInfo.findOne({ category_slug: category.category_slug });
                                if (groupInfo) groupInfoCache.set(category.category_slug, groupInfo);
                            }

                            if (groupInfo && groupInfo.group_name) {
                                filter_group_name = groupInfo.group_name.trim();
                            }
                        }
                    }
                }

                // 3. Resolve or insert FilterGroup (Type)
                const groupSlug = makeSlug(filter_group_name);
                let filterGroup = filterGroupCache.get(groupSlug);
                if (!filterGroup) {
                    filterGroup = await FilterGroup.findOne({
                        $or: [
                            { filtergroup_slug: groupSlug },
                            { filtergroup_name: new RegExp(`^${escapeRegex(filter_group_name)}$`, 'i') }
                        ]
                    });

                    if (!filterGroup) {
                        filterGroup = await FilterGroup.create({
                            filtergroup_name: filter_group_name,
                            filtergroup_slug: groupSlug,
                            status: "Active"
                        });
                        console.log(`[Filter Upload] Created new Filter Group (Type): "${filter_group_name}"`);
                    }
                    filterGroupCache.set(groupSlug, filterGroup);
                }

                const filterGroupIdStr = filterGroup._id.toString();

                // 4. Resolve or insert Filter (Value)
                const filterSlug = makeSlug(filter_name);
                const filterCacheKey = `${filterGroupIdStr}___${filterSlug}`;
                let existingFilter = filterCache.get(filterCacheKey);

                if (!existingFilter) {
                    existingFilter = await Filter.findOne({
                        filter_group: filterGroupIdStr,
                        $or: [
                            { filter_slug: filterSlug },
                            { filter_name: new RegExp(`^${escapeRegex(filter_name)}$`, 'i') }
                        ]
                    });

                    if (!existingFilter) {
                        existingFilter = await Filter.create({
                            filter_name: filter_name,
                            filter_slug: filterSlug,
                            filter_group: filterGroupIdStr,
                            status: "Active"
                        });
                        console.log(`[Filter Upload] Created new Filter Value: "${filter_name}" under Group: "${filter_group_name}"`);
                    }
                    filterCache.set(filterCacheKey, existingFilter);
                    groupFilterIdsCache.delete(filterGroupIdStr);
                }

                // 5. Retrieve all filter IDs in this group
                let groupFilterIds = groupFilterIdsCache.get(filterGroupIdStr);
                if (!groupFilterIds) {
                    const groupFilters = await Filter.find({
                        filter_group: filterGroupIdStr,
                    }).select('_id');
                    groupFilterIds = groupFilters.map(f => f._id.toString());
                    groupFilterIdsCache.set(filterGroupIdStr, groupFilterIds);
                }

                const productIdStr = product._id.toString();
                const existingFilterIdStr = existingFilter._id.toString();

                // 6. Check if this product already has a filter of this type (group)
                const existingProductFilter = await ProductFilter.findOne({
                    product_id: productIdStr,
                    filter_id: { $in: groupFilterIds }
                });

                if (existingProductFilter) {
                    // Product already has this type of filter -> UPDATE THE VALUE
                    updateCount++;
                    console.log(`update ${updateCount}: Product ${item_code} has type "${filter_group_name}", updating value to "${filter_name}" (Row ${index + 2})`);

                    // Delete old filter(s) from this same group for this product
                    await ProductFilter.deleteMany({
                        product_id: productIdStr,
                        filter_id: { $in: groupFilterIds },
                    });

                    // Insert the updated filter value
                    await ProductFilter.create({
                        product_id: productIdStr,
                        filter_id: existingFilterIdStr,
                    });
                } else {
                    // Product does NOT have this type of filter -> INSERT TYPE AND VALUE
                    addedCount++;
                    console.log(`insert ${addedCount}: Product ${item_code} does not have type "${filter_group_name}", inserting value "${filter_name}" (Row ${index + 2})`);

                    await ProductFilter.create({
                        product_id: productIdStr,
                        filter_id: existingFilterIdStr,
                    });
                }
            } catch (rowError) {
                console.error(`[Filter Upload] ❌ Row ${index + 2} error:`, rowError.message || rowError);
                errors.push({
                    row: index + 2,
                    error: rowError.message || String(rowError),
                });
            }
        }

        console.log(`[Filter Upload] Completed. Inserted: ${addedCount}, Updated: ${updateCount}, Errors: ${errors.length}`);

        return NextResponse.json(
            {
                message: `Upload completed: ${addedCount} inserted, ${updateCount} updated.`,
                addedCount,
                updateCount,
                details: errors,
            },
            { status: errors.length && (addedCount === 0 && updateCount === 0) ? 400 : 200 }
        );

    } catch(error) {
        console.error('Bulk update error:', error);
        return NextResponse.json(
            { error: 'Bulk update error: ' + error.message },
            { status: 500 }
        )
    }
}

