import { NextResponse } from 'next/server';
import { join } from 'path';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import { format } from 'date-fns';
import { writeFile } from 'fs/promises';
import Product from "@/models/product";
import Category from  "@/models/ecom_category_info";;
import Brand  from "@/models/ecom_brand_info";
import md5 from "md5";
import mongoose from 'mongoose';
// import { json } from 'stream/consumers';


export const config = {
    api: {
      bodyParser: false, // Disable default body parsing for file uploads
    },
  };
export async function POST(req) {
  try {
    // Parse the form data from the request
    const formData = await req.formData();

    // Retrieve the uploaded files
    const excelFile = formData.get('excel');
    const imagesZip = formData.get('images');
    const overviewZip = formData.get('overview');

    // Check if required files are uploaded
    if (!excelFile || !imagesZip) {
      return NextResponse.json(
        { error: 'Missing required files: Excel and Images ZIP are mandatory.' },
        { status: 400 }
      );
    }

    const allowedExtensions = [".xlsx", ".csv"];
    const fileName = excelFile.name.toLowerCase();
    if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
      return NextResponse.json(
        { error: "Invalid file type. Only .xlsx and .csv files are allowed." },
        { status: 400 }
      );
    }

    // Define the upload directory
    const uploadDir = join(process.cwd(), 'public/uploads');

    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Process Excel file
    const excelBuffer = Buffer.from(await excelFile.arrayBuffer());
    const workbook = XLSX.read(excelBuffer);
    const products = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }); // Get as array of rows

    
    // Save the Excel file for reference
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');

    await writeFile(join(uploadDir, `uploaded-products_${timestamp}.xlsx`), excelBuffer);
    console.log(products);
    // Extract Images ZIP
    const imagesBuffer = Buffer.from(await imagesZip.arrayBuffer());
    const imagesZipInstance = new AdmZip(imagesBuffer);
    const imagesPath = join(uploadDir, 'products');
    imagesZipInstance.extractAllTo(imagesPath, true);

    // // Extract Overview ZIP if it exists
    if (overviewZip) {
      const overviewBuffer = Buffer.from(await overviewZip.arrayBuffer());
      const overviewZipInstance = new AdmZip(overviewBuffer);
      const overviewPath = join(uploadDir, 'overview-images');
      overviewZipInstance.extractAllTo(overviewPath, true);
    }

    // Process the products and save them to the database
    if (!products || products.length === 0) {
        return NextResponse.json(
          { error: "No products found in the uploaded Excel file." },
          { status: 400 }
        );
      }
    
        // Process each product row (skip the first row if it's a header)
        for (let i = 1; i < products.length; i++) {
            const row = products[i];
            
            const images = [
                row[9], 
                row[10],
                row[11]
            ];
            if (!mongoose.connection.readyState) {
              await mongoose.connect(process.env.MONGODB_URI, { / ... / });
            }
            
            const category = await Category.findOne({ category_name: row[3] }).select("_id");
            const brand = await Brand.findOne({ brand_name: row[4] }).select("_id");
            
            const category_id = category ? category._id.toString() : null;
            const brand_id = brand ? brand._id.toString() : null;
            
            let overviewImage = [];

            if(row[12] !== "" && row[12] != null){
              overviewImage = row[12].split(" ");
            }
            let variants = [];
if (row[14] && row[14].trim() !== "") {
  try {
    variants = JSON.parse(row[14].trim()); // Parse JSON string
    // Validate structure
    if (!Array.isArray(variants)) {
      throw new Error("Variants data is not an array.");
    }
  } catch (error) {
    console.error(`Error parsing variants at row ${i + 1}: ${error.message}`);
    variants = []; // Reset to empty array on failure
  }
}
                 

            const productData = {
                item_code: row[0], // "Item No."
                name: row[1], // "Product Name"
                quantity: row[2], // "StockQty"
                category: category_id, // "Category"
                brand: brand_id, // "Brand"
                price: row[5], // "MRP PRICE"
                special_price: row[6], // "Special Price"
                description: row[7], // "Description"
                key_specifications:row[8],
                images :images,  // images
                overview_image: overviewImage, // "Overview Image"
                overview_description :row[13],
                // hasVariants: row[14] !== "" && row[14] != null ? true : false, // "Variants"
                hasVariants: variants.length > 0 ? true : false,
                variants: variants,
                status: row[15], // "Status"

            };
        
            // Check if the product already exists (based on item_code or name)
            const existingProduct = await Product.findOne({
                $or: [
                { item_code: productData.item_code },
                { name: productData.name },
                ],
            });
        
            if (!existingProduct) {
                // Generate slug from the product name
                const productSlug = productData.name.toLowerCase().replace(/\s+/g, '-');
                const slugHash = md5(productSlug);
        
                // Add the slug to the product data
                productData.slug = slugHash;
        
                // Create and save the new product
                const newProduct = new Product(productData);
                await newProduct.save();
            } else {
                // Update the existing product
                await Product.updateOne(
                { _id: existingProduct._id },
                {
                    item_code: productData.item_code,
                    name: productData.name,
                    quantity: productData.quantity,
                    category: productData.category,
                    stock_status : productData.quantity > 0 ? "In Stock" : "Out of Stock",
                    brand: productData.brand,
                    price: productData.price,
                    special_price: productData.special_price,
                    description: productData.description,
                    key_specifications:productData.key_specifications,
                    images : productData.images,
                    overview_image: productData.overview_image,
                    overview_description :productData.overview_description,
                    hasVariants: productData.hasVariants,
                    variants: productData.variants,
                    status: productData.status,
                }
                );
            }
        }
    return NextResponse.json({
      message: `Successfully processed ${products.length} products.`,
      productCount: products.length,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process the upload due to an internal error.' },
      { status: 500 }
    );
  }
}
