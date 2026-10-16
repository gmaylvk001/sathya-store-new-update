import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import connectDB from "@/lib/db";
import Product from "@/models/product";
import Product_filter from "@/models/ecom_productfilter_info";
import fs from "fs";
import md5 from "md5";
export async function POST(req) {
  try {
    const formData = await req.formData();
    const productData = JSON.parse(formData.get("product"));
    const imageFiles = formData.getAll("images");
    const category   = formData.get("category");
    let variants = JSON.parse(formData.get("variant"));
    const Filters    = productData.filters;
    const item_code  = productData.item_code;
    const slug       = productData.slug;
    const overviewimageFiles = formData.getAll("overviewImages");
    let md5_cat_name = md5(slug);
    let existingProduct = await Product.findOne({ item_code });
      if (existingProduct) {
        return NextResponse.json({ error: "Product already exists" }, { status: 400 });
      }

      let existingProductname = await Product.findOne({ slug });
      if (existingProductname) {
        return NextResponse.json({ error: "Product name already exists" }, { status: 400 });
      }

    const savedImages = [];
    const OverviewSavedImages = [];
    if (!imageFiles.length) {
        return NextResponse.json({ error: "No images received" }, { status: 400 });
    }
    const savedVariantImages = [];

  if(productData.hasVariants){
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const variantImages = [];
      
      // Get all images for this variant
      let imgIndex = 0;
      while (true) {
        const imageKey = `variant_${i}_image_${imgIndex}`;
        const imageFile = formData.get(imageKey);
        console.log(imageFile);
        if (!imageFile) break;
        
        // Process and save the image
        const filename = `${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        const filePath = path.join(uploadDir, filename);
        
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await writeFile(filePath, buffer);
        
        variantImages.push(`${filename}`);
        imgIndex++;
      }
      
      variant.images = variantImages;
    }
  }
  console.log(".............................................");
    const uploadDir = path.join(process.cwd(), "public/uploads/products");
    if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
    }
    for (const file of imageFiles) {
      if (!file || typeof file.name !== "string") {
          console.error("Invalid file received:", file);
          continue;
      }
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      savedImages.push(`${filename}`);
    }

    for (const file of overviewimageFiles) {
      if (!file || typeof file.name !== "string") {
          console.error("Invalid file received:", file);
          continue;
      }
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      OverviewSavedImages.push(`${filename}`);
    }

    await connectDB();
    if(productData.quantity <= 0){
        productData.stock_status = "Out of Stock";
    }

    if(productData.slug != ""){
      productData.slug =slug;
    }
    if(md5_cat_name != ""){
      productData.md5_name =md5_cat_name;
    }

    if(!productData.hasVariants){
      variants = [];
    }
    productData.category = category;
    const newProduct = new Product({
      ...productData,
      images: savedImages,
      variants: variants,
      overview_image: OverviewSavedImages,
    });
    await newProduct.save();

    if(newProduct.id){
      const product_id = newProduct._id;
      for (const filter of Filters) {
      const newProductFilter = new Product_filter({
        filter_id: filter,
        product_id: product_id,
      });
      await newProductFilter.save();
      }
    }

    return NextResponse.json(
      { message: "Product created successfully", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
