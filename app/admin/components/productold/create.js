"use client";
import { React,useState, useEffect } from "react";
import Select from "react-select";
import { combinations } from '@/utils/combinations';
export default function AddProductPage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    item_code: "",
    price: "",
    special_price: "",
    quantity: "",
    description: "",
    brand: "",
    category: "",
    stock_status: "In Stock",
    variant_options: [],
    related_products: [],
    images: [],
    key_specifications: "",
    featured: false,
    tags: [],
    meta_title: "",
    meta_description: "",
    status: "Active",
    variant_attribute: { name: "", options: [] },
    variants: [],
    filters: [],
    hasVariants: false,
    variantAttributes: [],
  });

  const [categories, setCategories] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([
    { value: "New", label: "New" },
    { value: "Best Seller", label: "Best Seller" },
    { value: "Limited Edition", label: "Limited Edition" },
  ]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const categoryOptions = data.map((cat) => ({
          value: cat._id,
          label: cat.category_name,
        }));
        setCategories(categoryOptions);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);


  useEffect(() => {
    if (product.hasVariants && product.variantAttributes.length > 0) {
      const optionsArrays = product.variantAttributes
        .filter(attr => attr.name && attr.options.length > 0)
        .map(attr =>
          attr.options.map(opt => ({ [attr.name]: opt }))
        );

      if (optionsArrays.length === 0) return;

      const allCombinations = combinations(...optionsArrays);
      
      const newVariants = allCombinations.map(combination => {
        return {
          attributes: combination.map(c => ({
            name: Object.keys(c)[0],
            value: Object.values(c)[0],
            item_code: "",
            price: "",
            special_price: "",
            quantity: "",
            images : [],
          }))
        };
      });

      setProduct(prev => ({ ...prev, variants: newVariants }));
    }
  }, [product.variantAttributes, product.hasVariants]);

  const handleVariantFieldChange = async (variantIndex, attrIndex, field, value) => {
    let uploadedImagePaths = [];
  
    if (field === 'images' && value.length > 0) {
      uploadedImagePaths = await uploadImages(value);
    }
  
    const updatedVariants = product.variants.map((variant, i) => {
      if (i === variantIndex) {
        const updatedAttributes = variant.attributes.map((attr, j) => {
          if (j === attrIndex) {
            return { 
              ...attr, 
              [field]: field === "images" 
                ? [...(attr.images || []), ...uploadedImagePaths] 
                : value 
            };
          }
          return attr;
        });
        return { ...variant, attributes: updatedAttributes };
      }
      return variant;
    });
  
    setProduct(prev => ({ ...prev, variants: updatedVariants }));
  };

  const generateUniqueFileName = (originalFileName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${randomString}-${originalFileName}`;
  };

  const uploadImages = async (files) => {
    const uploadedFilePaths = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = `/uploads/products/${uniqueFileName}`;
      uploadedFilePaths.push(filePath);
      const fileUrl = URL.createObjectURL(file);
      console.log('Image URL:', fileUrl);
    }
    return uploadedFilePaths;
  };
  

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "name" ? value.toLowerCase().replace(/\s+/g, "-") : prev.slug,
    }));
  };

  const handleTagsChange = (selectedOptions) => {
    setProduct((prev) => ({
      ...prev,
      tags: selectedOptions.map((option) => option.value),
    }));
  };

  const handleImageChange = (e) => { 
    const files = Array.from(e.target.files);
    if (files.length + product.images.length > 4) {
        alert("You can only upload up to 4 images.");
        return;
    }
    setProduct((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...files], 
        images: [...prev.images, ...files.map((file) => URL.createObjectURL(file))],
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(product));
      if( product.files && product.files.length > 0){
        product.files.forEach((file) => formData.append("images", file));
      }else{
        formData.append("images", []);
      }
      const response = await fetch("/api/product/add", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("Product added successfully!");
        setProduct({ 
          name: "",
          slug: "",
          item_code: "",
          price: "",
          special_price: "",
          quantity: "",
          description: "",
          brand: "",
          category: "",
          stock_status: "In Stock",
          variant_options: [],
          related_products: [],
          images: [],
          key_specifications: "",
          featured: false,
          tags: [],
          meta_title: "",
          meta_description: "",
          status: "Active",
          variant_attribute: { name: "", options: [] },
          variants: [],
          filters: [],
          hasVariants: false,
          variantAttributes: [],
         });
      } else {
        console.log(response);
        alert("Error adding product");
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const handleAddVariantAttribute = () => {
    setProduct(prev => ({
      ...prev,
      variantAttributes: [
        ...prev.variantAttributes,
        { 
          name: ``, 
          options: [] 
        }
      ]
    }));
  };
  const handleVariantAttributeChange = (index, field, value) => {
    const updatedAttributes = product.variantAttributes.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    );
    
    setProduct(prev => ({
      ...prev,
      variantAttributes: updatedAttributes
    }));
  };

  const handleVariantOptionChange = (index, value) => {
    const options = value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
    if (options.length === 0) return;
    handleVariantAttributeChange(index, 'options', options);
  };


  
  const handleFilterChange = (index, field, value) => {
    const newFilters = product.filters.map((filter, i) =>
      i === index ? { ...filter, [field]: value } : filter
    );
    setProduct(prev => ({ ...prev, filters: newFilters }));
  };

  const handleAddFilter = () => {
    setProduct(prev => ({
      ...prev,
      filters: [...prev.filters, { name: "", value: "" }]
    }));
  };

  const handleRemoveFilter = (index) => {
    const newFilters = product.filters.filter((_, i) => i !== index);
    setProduct(prev => ({ ...prev, filters: newFilters }));
  };

  return (
    
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-200">
       <>
      <h2 className="text-2xl font-bold mb-4">Add Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input type="text" name="name" value={product.name} onChange={handleChange} className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block font-medium">Item Code</label>
          <input type="text" name="item_code" value={product.item_code} onChange={handleChange} className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block font-medium">Images (Max 4)</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border p-2 rounded" />
          <div className="flex gap-2 mt-2">
            {product.images.map((img, index) => (
              <img key={index} src={img} alt={`Product ${index}`} className="w-20 h-20 object-cover rounded border" />
            ))}
          </div>
        </div>
        

        <div>
          <label className="block font-medium">Category</label>
          <Select
            options={categories}
            onChange={(selectedOption) => setProduct((prev) => ({ ...prev, category: selectedOption.value }))}
            placeholder="Select category..."
          />
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Price</label>
            <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block font-medium">Special Price</label>
            <input type="number" name="special_price" value={product.special_price} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block font-medium">Quantity</label>
          <input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full border p-2 rounded" required />
        </div>

        <div>
          <label className="block font-medium">Key Specifications</label>
          <textarea name="key_specifications" value={product.key_specifications} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
        </div>

        <div>
          <label className="block font-medium">Tags</label>
          <Select options={tagsOptions} isMulti onChange={handleTagsChange} placeholder="Select tags..." />
        </div>

        <div className="flex items-center space-x-2">
          <input type="checkbox" name="featured" checked={product.featured} onChange={handleChange} />
          <label className="font-medium">Featured Product</label>
        </div>

        <div>
          <label className="block font-medium">Meta Title</label>
          <input type="text" name="meta_title" value={product.meta_title} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium">Meta Description</label>
          <textarea name="meta_description" value={product.meta_description} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
        </div>

        {/* Variant Section */}

         <div className="border p-4 rounded">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={product.hasVariants}
                onChange={(e) => setProduct(prev => ({
                  ...prev,
                  hasVariants: e.target.checked,
                  variants: e.target.checked ? prev.variants : []
                }))}
              />
              <label className="font-medium">This product has variants</label>
            </div>

          {product.hasVariants && (
            <>
              <div className="space-y-4 mb-4">
              {product.variantAttributes.map((attr, index) => (
                  <div  className="border p-4 rounded" key={index}>
                    <div className="flex gap-4 mb-2">
                      <input
                        type="text"
                        placeholder="Attribute name"
                        value={attr.name}
                        onChange={(e) => handleVariantAttributeChange(index, 'name', e.target.value)}
                        className="border p-2 rounded flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setProduct(prev => ({
                          ...prev,
                          variantAttributes: prev.variantAttributes.filter((_, i) => i !== index)
                        }))}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Option"
                      value={attr.options.join(',')}
                      onChange={(e) => handleVariantOptionChange(index, e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddVariantAttribute}
                  className="bg-red-200 px-4 py-2 rounded"
                >
                  Add Variant Attribute
                </button>
              </div>

              {product.variants.length > 0 && (
                <div className="border p-4 rounded" >
                  <h3 className="font-medium mb-4">Variants</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2 border-b">Attribute</th>
                          <th className="text-left p-2 border-b">Item Code</th>
                          <th className="text-left p-2 border-b">Images</th>
                          <th className="text-left p-2 border-b">Price</th>
                          <th className="text-left p-2 border-b">Special Price</th>
                          <th className="text-left p-2 border-b">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant, variantIndex) => (
                            variant.attributes.map((attr, attrIndex) => (
                                <>
                                 <tr key={`${variantIndex}-${attrIndex}`}>
                                <td className="p-2 border-b">
                                  <div  className="mb-2">
                                    {attr.name}: {attr.value}
                                  </div>
                                </td>
                                <td className="p-2 border-b">
                                  <input
                                    type="text"
                                    value={attr.item_code}
                                    onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'item_code', e.target.value)}
                                    className="w-full border p-1 rounded"
                                  />
                                </td>
                                <td className="p-2 border-b">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'images', e.target.files)}
                              className="w-full border p-1 rounded"
                            />
                            <div className="flex gap-2 mt-2">
                              {attr.images && attr.images.map((img, index) => (
                                <img key={index} src={img} alt={`Variant ${index}`} className="w-12 h-12 object-cover rounded border" />
                              ))}
                            </div>
                          </td>

                                <td className="p-2 border-b">
                                  <input
                                    type="number"
                                    value={attr.price}
                                    onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'price', e.target.value)}
                                    className="w-full border p-1 rounded"
                                  />
                                </td>
                                <td className="p-2 border-b">
                                  <input
                                    type="number"
                                    value={attr.special_price}
                                    onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'special_price', e.target.value)}
                                    className="w-full border p-1 rounded"
                                  />
                                </td>
                                <td className="p-2 border-b">
                                  <input
                                    type="number"
                                    value={attr.quantity}
                                    onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'quantity', e.target.value)}
                                    className="w-full border p-1 rounded"
                                  />
                                </td>
                                </tr>
                                </>
                            ))
                      
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        {/* Filter Options Section */}
        <div className="border p-4 rounded">
          <label className="block font-medium mb-2">Filter Options</label>
          <button
            type="button"
            onClick={handleAddFilter}
            className="bg-red-200 px-4 py-2 rounded mb-4"
          >
            Add Filter
          </button>

          {product.filters.map((filter, index) => (
            <div key={index} className="flex gap-4 mb-2">
              <input
                type="text"
                placeholder="Filter name (e.g., Brand)"
                value={filter.name}
                onChange={(e) => handleFilterChange(index, 'name', e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <input
                type="text"
                placeholder="Filter value (e.g., Samsung)"
                value={filter.value}
                onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveFilter(index)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      

        <div>
          <label className="block font-medium">Status</label>
          <select name="status" value={product.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button type="submit" className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]">
          Add Product
        </button>
      </form>
      </>
    </div>
    
  );
}
