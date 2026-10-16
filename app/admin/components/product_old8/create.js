"use client";
import { React, useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { FaPlus, FaMinus, FaArrowLeft, FaArrowRight } from "react-icons/fa";
const Select = dynamic(() => import('react-select'), { ssr: false });
import { combinations } from '@/utils/combinations';
import { ToastContainer, toast } from 'react-toastify';

const steps = [
  { title: "Basic Information" },
  { title: "Images & Description" },

  { title: "Variants & Filters" },
  { title: "Status" },
];

export default function AddProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    item_code: "",
    price: "",
    special_price: "",
    quantity: "",
    brand: "",
    category: "",
    stock_status: "In Stock",
    description: "",
    related_products: [],
    images: [
    '','','',''  
    ],
    key_specifications: "",
    featured: false,
    tags: [],
    meta_title: "",
    status: "Active",
    variant_attribute: { name: "", options: [] },
    variants: [],
    filters: [],
    hasVariants: false,
    variantAttributes: [],
    files:[],
    overviewdescription : "",
    overviewImage: [null],
    overviewImageFile: [null]
  });

    const [variant, setVariant] = useState([{
      variant_attribute_name: "",
      options: "",
      item_code: "",
      price: "",
      special_price: "",
      quantity: "",
      stock_status: "In Stock",
      images: [],
      status: "Active"
    }]);

    const [variantImages, setVariantImages] = useState([{
      images: []
    }]);

  const [tagsOptions, setTagsOptions] = useState([
    { value: "New", label: "New" },
    { value: "Best Seller", label: "Best Seller" },
    { value: "Limited Edition", label: "Limited Edition" },
  ]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [brand, setBrand] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationError, setValidationError] = useState(null);
  const [Filter, setFilter] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories/get");
      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.categories)
              ? result.categories
              : [];
        setCategories(buildCategoryTree(list));
      }
    } catch (error) {
      toast.error(error);
    } finally {
    }
  };

  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        const data = result.data;
        console.log(data);
        const brandOptions = data.map((cat) => ({
          value: cat._id,
          label: cat.brand_name,
        }));
        setBrand(brandOptions);
      }
    } catch (error) {
      toast.error(error);
    } finally {
    }
  };

  const fetchFilter = async () => {
    try {
      const response = await fetch("/api/filter");
      const result = await response.json();
      const data = result.data;
      console.log(data);
      const filterOptions = data.map((cat) => ({
        value: cat._id,
        label: cat.filter_name,
      }));
      setFilter(filterOptions);
    } catch (error) {
      toast.error(error);
    }
  };
  useEffect(() => {
    fetchCategories();
    fetchFilter();
    fetchBrand();
  }, []);

    const handleVariantFieldChange1 = (index, field, value) => {
      const updatedVariants = [...variant];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      setVariant(updatedVariants);
    };
  
    // const handleImageChange1 = (index, filez) => {
    //   if (filez.length <= 4) {
    //     const files = Array.from(filez);
    //     const updatedVariants = [...variant];
    //     const updatedvariantImages = [...variantImages];
    //     updatedvariantImages[index].images = files;
    //     // Store File objects directly in the variant
    //     updatedVariants[index].images = Array.from(filez).map(file => URL.createObjectURL(file));
    //     setVariant(updatedVariants);
    //     setVariantImages(updatedvariantImages);
    //   } else {
    //     toast.error("You can only upload up to 4 images.");
    //   }
    // if (filez.length <= 4) {
    //   // const updatedVariants = [...variant];
    //   // updatedVariants[index].images = Array.from(files).map(file => URL.createObjectURL(file));
    //   // setVariant(updatedVariants);
    //   const files = Array.from(filez);
    //   const updatedVariants = [...variant];
      
    //   // Store File objects directly in the variant
    //   updatedVariants[index].images = files;
    //   setVariant(updatedVariants);
    // } else {
    //   toast.error("You can only upload up to 4 images.");
    // }
    // };
    const handleImageChange1 = (index, files) => {
      if (files.length > 4) {
        toast.error("You can only upload up to 4 images.");
        return;
      }
    
      const fileArray = Array.from(files);
      const updatedVariantImages = [...variantImages];
      const updatedVariants = [...variant];
    
      // Update the images in the state
      updatedVariantImages[index].images = Array.from(files); // Store File objects
      updatedVariants[index].images = Array.from(files).map(file => URL.createObjectURL(file)); // Store URLs
    
      setVariantImages(updatedVariantImages);
      setVariant(updatedVariants);
    };
    const handleVariantImageChange = (variantIndex, imgIndex, files) => {
      if (files.length === 0) return;
      const file = files[0];
    
      const updatedVariants = [...variant];
      const updatedVariantImages = [...variantImages];
    
      updatedVariantImages[variantIndex].images[imgIndex] = file;
      updatedVariants[variantIndex].images[imgIndex] = URL.createObjectURL(file);
    
      setVariantImages(updatedVariantImages);
      setVariant(updatedVariants);
    };
    
    const handleRemoveVariantImage = (variantIndex, imgIndex) => {
      const updatedVariants = [...variant];
      const updatedVariantImages = [...variantImages];
    
      updatedVariants[variantIndex].images[imgIndex] = null;
      updatedVariantImages[variantIndex].images[imgIndex] = null;
    
      setVariant(updatedVariants);
      setVariantImages(updatedVariantImages);
    };
    // const handleImageChange = (e) => { 
    //   const files = Array.from(e.target.files);
    //   if (files.length + product.images.length > 4) {
    //       alert("You can only upload up to 4 images.");
    //       return;
    //   }
    //   setProduct((prev) => ({
    //       ...prev,
    //       files: [...(prev.files || []), ...files], 
    //       images: [...prev.images, ...files.map((file) => URL.createObjectURL(file))],
    //   }));
    // };
  

    const handleImageChange = (index, e) => {
      const file = e.target.files[0];
      if (!file) return;
    
      const newImages = [...product.images];
      const newFiles = [...product.files];
    
      // Create preview URL
      newImages[index] = URL.createObjectURL(file);
      newFiles[index] = file;
    
      setProduct(prev => ({
        ...prev,
        images: newImages,
        files: newFiles
      }));
    };
    
    const handleRemoveImage1 = (index) => {
      const newImages = [...product.images];
      const newFiles = [...product.files];
    
      newImages[index] = null;
      newFiles[index] = null;
    
      setProduct(prev => ({
        ...prev,
        images: newImages,
        files: newFiles
      }));

       if (product.images.length > 4)
        setProduct(prev => {
          
          newImages.splice(index, 1);
          newFiles.splice(index, 1);
    
          return {
            ...prev,
            images: newImages,
            files: newFiles
          };
        });
         return;
    };

    // const handleOverviewImageChange = (e) => {
    //   const file = e.target.files[0];
    //   if (!file) return;
    
    //   setProduct(prev => ({
    //     ...prev,
    //     overviewImage: URL.createObjectURL(file),
    //     overviewImageFile: file
    //   }));
    // };

    // const handleOverviewImageChange = (index, files) => {
    //   const file = files[0];
    //   if (!file) return;
  
    //   setProduct(prev => {
    //     const newImages = [...prev.overviewImage];
    //     const newFiles = [...prev.overviewImageFile];
        
    //     newImages[index] = URL.createObjectURL(file);
    //     newFiles[index] = file;
  
    //     return {
    //       ...prev,
    //       overviewImage: newImages,
    //       overviewImageFile: newFiles
    //     };
    //   });
    // };
  
    // const handleAddOverviewImage = () => {
    //   setProduct(prev => ({
    //     ...prev,
    //     overviewImage: [...prev.overviewImage, null],
    //     overviewImageFile: [...prev.overviewImageFile, null]
    //   }));
    // };
  
    // const handleRemoveOverviewImage = (index) => {
    //   setProduct(prev => {
    //     const newImages = [...prev.overviewImage];
    //     const newFiles = [...prev.overviewImageFile];
        
    //     newImages.splice(index, 1);
    //     newFiles.splice(index, 1);
  
    //     return {
    //       ...prev,
    //       overviewImage: newImages,
    //       overviewImageFile: newFiles
    //     };
    //   });
    // };
  

    const handleOverviewImageChange = (index, files) => {
      const file = files[0];
      if (!file) return;
  
      setProduct(prev => {
        const newImages = [...prev.overviewImage];
        const newFiles = [...prev.overviewImageFile];
        
        newImages[index] = URL.createObjectURL(file);
        newFiles[index] = file;
  
        return {
          ...prev,
          overviewImage: newImages,
          overviewImageFile: newFiles
        };
      });
    };

    const AddproductImage=()=>{
      setProduct(prev => ({
        ...prev,
        images: [...prev.images, null],
        files: [...prev.files, null]
      }));
    }
  
    const handleAddOverviewImage = () => {
      setProduct(prev => ({
        ...prev,
        overviewImage: [...prev.overviewImage, null],
        overviewImageFile: [...prev.overviewImageFile, null]
      }));
    };
  
    const handleRemoveOverviewImage = (index) => {
      // Don't remove if it's the last one
      if (product.overviewImage.length <= 1){
        const newImages = [...product.overviewImage];
        const newFiles = [...product.overviewImageFile];
      
        newImages[index] = null;
        newFiles[index] = null;
      
        setProduct(prev => ({
          ...prev,
          overviewImage: newImages,
          overviewImageFile: newFiles
        }));
        return;
      }
      
      setProduct(prev => {
        const newImages = [...prev.overviewImage];
        const newFiles = [...prev.overviewImageFile];
        
        newImages.splice(index, 1);
        newFiles.splice(index, 1);
  
        return {
          ...prev,
          overviewImage: newImages,
          overviewImageFile: newFiles
        };
      });
    };
    const handleRemoveImage = (variantIndex, imgIndex) => {
      const updatedVariants = [...variant];
      updatedVariants[variantIndex].images.splice(imgIndex, 1);
      setVariant(updatedVariants);
    };

    const handleAddVariant1 = () => {
      setVariant(prev => [
        ...prev,
        {
          variant_attribute_name: "",
          options: "",
          item_code: "",
          price: "",
          special_price: "",
          quantity: "",
          stock_status: "In Stock",
          images: [],
          status: "Active"
        }
      ]);
      setVariantImages(prev => [...prev, { images: [] }]);
    };

  const buildCategoryTree = (categories, parentId = "none") => {
    return categories
      .filter((category) => category.parentid === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(categories, category._id),
      }));
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCategoryChange = (category, isChecked) => {
    console.log(category,isChecked);
    const updatedSelection = new Set(selectedCategories);

    const toggleChildren = (children, select) => {
      children.forEach((child) => {
        if (select) {
          updatedSelection.add(child._id);
        } else {
          updatedSelection.delete(child._id);
        }
        if (child.children.length > 0) {
          toggleChildren(child.children, select);
        }
      });
    };

    if (isChecked) {
      updatedSelection.add(category._id);
      toggleChildren(category.children, true);
    } else {
      updatedSelection.delete(category._id);
      toggleChildren(category.children, false);
    }

    const toggleParents = (parentId) => {
      if (!parentId || parentId === "none") return;
      const parent = findCategoryById(categories, parentId);
      if (parent) {
        const allChildrenSelected = parent.children.every((child) =>
          updatedSelection.has(child._id)
        );
        if (allChildrenSelected) {
          updatedSelection.add(parent._id);
        } else {
          updatedSelection.delete(parent._id);
        }
        toggleParents(parent.parentid);
      }
    };

    //toggleParents(category.parentid);
    setSelectedCategories(updatedSelection);
    console.log(updatedSelection);
  };

  const findCategoryById = (categories, id) => {
    for (const category of categories) {
      if (category._id === id) return category;
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
    return null;
  };

  const renderCategoryTree = (categories, level = 0) => {
    console.log(categories);
    return categories.map((category) => (
      <div key={category._id} style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center cursor-pointer p-2  text-sm font-medium text-gray-700">
          {category.children.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category._id);
              }}
              className="mr-2 text-[#d72828]"
            >
              {expandedCategories[category._id] ? <FaMinus /> : <FaPlus />}
            </button>
          )}
          {category.children.length == 0 && (
          <input
            type="checkbox"
            value={category._id}
            checked={selectedCategories.has(category._id)}
            onChange={(e) => handleCategoryChange(category, e.target.checked)}
            className="mr-2"
          />
          )}
          <span
            className={`font-medium ${
              selectedCategories.has(category._id) ? "text-[#d72828]" : "text-gray-700"
            }`}
          >
            {category.category_name}
          </span>
        </div>
        {expandedCategories[category._id] && renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };
  // useEffect(() => {
  //   if (product.hasVariants && product.variantAttributes.length > 0) {
  //     const validAttributes = product.variantAttributes.filter(
  //       attr => attr.name && attr.options.length > 0
  //     );

  //     if (validAttributes.length === 0) return;
  //     console.log(validAttributes);
  //     const optionsArrays = validAttributes.map(attr =>
  //       attr.options.map(opt => ({ [attr.name]: opt }))
  //     );
  //     console.log(optionsArrays);
  //     const allCombinations = combinations(...optionsArrays);
      
  //     const newVariants = allCombinations.map(combination => {
  //       const existingVariant = product.variants.find(variant =>
  //         combination.every(c =>
  //           variant.attributes.some(attr => 
  //             attr.name === Object.keys(c)[0] &&
  //             attr.value === Object.values(c)[0]
  //           )
  //         )
  //       );

  //       return existingVariant || {
  //         attributes: combination.map(c => ({
  //           name: Object.keys(c)[0],
  //           value: Object.values(c)[0],
  //           item_code: "",
  //           price: "",
  //           special_price: "",
  //           quantity: "",
  //           images: [],
  //         }))
  //       };
  //     });

  //     setProduct(prev => ({
  //       ...prev,
  //       variants: newVariants.filter((v, index, self) =>
  //         index === self.findIndex(t => (
  //           t.attributes.every(attr => 
  //             v.attributes.some(a => 
  //               a.name === attr.name && a.value === attr.value
  //             )
  //           )
  //         ))
  //       )
  //     }));
  //   }
  // }, [product.variantAttributes, product.hasVariants]);
  
  useEffect(() => {
    if (product.hasVariants && product.variantAttributes.length > 0) {
      const validAttributes = product.variantAttributes.filter(
        (attr) => attr.name && attr.options.length > 0
      );
  
      if (validAttributes.length === 0) return;
  
      const optionsArrays = validAttributes.map((attr) =>
        attr.options.map((opt) => ({ [attr.name]: opt }))
      );
  
      const allCombinations = combinations(...optionsArrays);
  
      const newVariants = allCombinations.map((combination) => {
        // Find an existing variant that matches the current combination
        const existingVariant = product.variants.find((variant) =>
          combination.every((c) =>
            variant.attributes.some(
              (attr) =>
                attr.name === Object.keys(c)[0] &&
                attr.value === Object.values(c)[0]
            )
          )
        );
  
        // Return the existing variant if it exists, otherwise create a new one
        return (
          existingVariant || {
            attributes: combination.map((c) => ({
              name: Object.keys(c)[0],
              value: Object.values(c)[0],
            })),
            item_code: "",
            price: "",
            special_price: "",
            quantity: "",
            images: [],
          }
        );
      });
  
      setProduct((prev) => ({
        ...prev,
        variants: newVariants.filter(
          (v, index, self) =>
            index ===
            self.findIndex((t) =>
              t.attributes.every((attr) =>
                v.attributes.some(
                  (a) => a.name === attr.name && a.value === attr.value
                )
              )
            )
        ),
      }));
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
      const formData = new FormData();
      const uniqueFileName = generateUniqueFileName(file.name);
  
      formData.append("image", file);
      
      try {
        // Send the file to the server
        const response = await fetch("/api/product/upload", {
          method: "POST",
          body: formData,
        });
  
        if (response.ok) {
          const { savedImages } = await response.json();
          uploadedFilePaths.push(savedImages);
        } else {
          toast.error(response.statusText);
        }
      } catch (error) {
        toast.error(error);
      }
    }
  
    return uploadedFilePaths;
  };

  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "name" 
        ? value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") : prev.slug,
    }));
  };

  const handleTagsChange = (selectedOptions) => {
    
    setProduct((prev) => ({
      ...prev,
      tags: selectedOptions.map((option) => option.value),
    }));
  };
  const handleBrandChange = (selectedOptions) => {
    console.log(selectedOptions);
    setProduct((prev) => ({
      ...prev,
      brand: selectedOptions.value,
    }));
  };
  const handleFilterChange = (selectedOptions) => {
    setProduct((prev) => ({
      ...prev,
      filters: selectedOptions.map((option) => option.value),
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
      formData.append("category", Array.from(selectedCategories)[0]);
      console.log(product,selectedCategories);
      variantImages.forEach((variantz, index) => {
        variantz.images.forEach((imageFile, imgIndex) => {
          formData.append(`variant_${index}_image_${imgIndex}`, imageFile);
        });
      });
      formData.append("variant", JSON.stringify(variant.map(v => ({
        ...v,
        images: []
      }))));
      if(product.overviewImageFile && product.overviewImageFile.length > 0){
        product.overviewImageFile.forEach((file) => formData.append("overviewImages", file));
      }else{
        formData.append("overviewImages", []);
      }
      const response = await fetch("/api/product/add", {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();
      if (response.ok) {
        toast.success("Product added successfully");
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
          related_products: [],
          images: [],
          key_specifications: "",
          featured: false,
          tags: [],
          meta_title: "",
          status: "Active",
          variant_attribute: { name: "", options: [] },
          variants: [],
          filters: [],
          hasVariants: false,
          variantAttributes: [],
         });

         setVariant([{
          variant_attribute_name: "",
          options: "",
          item_code: "",
          price: "",
          special_price: "",
          quantity: "",
          stock_status: "In Stock",
          images: [],
          status: "Active"
        }]);
      } else {
        toast.error(responseData.error || "Something went wrong");
      }
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred"); 
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

  const nextStep = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
    } else {
      if (currentStep < steps.length) setCurrentStep(prev => prev + 1);
    }
  };

  const closeModal = () => {
    setValidationError(null);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const StepNavigation = () => (
    <div className="flex justify-between mt-6">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-200 px-4 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> Previous
        </button>
      )}
      {currentStep < steps.length ? (
        <button
          type="button"
          onClick={nextStep}
          className="bg-[#d72828] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          Next <FaArrowRight />
        </button>
      ) : (
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Publish Product
        </button>
      )}
    </div>
  );

  const ProgressStepper = () => (
    <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex justify-between space-x-4">
            {steps.map((tab, index) => (
              <button
              type="button"
                key={index}
                // onClick={() => setCurrentStep(index- 1)}
                className={`py-2 px-4 text-sm font-medium focus:outline-none ${
                  currentStep-1 === index
                    ? "border-b-2 border-[#d72828] text-[#d72828]"
                    : "text-gray-600 hover:text-[#d72828]"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </nav>
        </div>
      {/* <div className="flex items-center justify-between relative">
     
        <div className="absolute  left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2">
          <div
            className="bg-[#d72828] h-full transition-all duration-300"
            style={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
            }}
          ></div>
        </div>
  
        {steps.map((step, index) => {
          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 1;
          
          return (
            <div 
              key={step.title}
              className="relative z-10 flex flex-col items-center"
            >
           
              <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${isCompleted ? 'bg-[#d72828]' : isActive ? 'bg-[#d72828]' : 'bg-gray-200'}
                transition-colors duration-300`}>
                
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
  
           
              <span className={`text-xs mt-2 text-center ${
                isActive ? 'text-[#d72828] font-medium' : 'text-gray-600'
              }`}>
              </span>
            </div>
          );
        })}
      </div> */}
    </div>
  );

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!product.name || !product.item_code || !product.price || !product.special_price || !product.quantity || !(selectedCategories.size) || !brand) {
          return "Please fill in all required fields: Product Name, Item Code, ,Category,Price,Special Price and brand.";
        }
        break;
      case 2:
        if (!product.images.some(img => img) || !product.description) {
          return "Please fill in all required fields: Images and Description.";
        }
        break;
      case 3:
        if (product.hasVariants && product.variantAttributes.some(attr => !attr.name || !attr.options.length)) {
          return "Please fill in all variant attributes and options.";
        }
        break;
      case 4:
        if (!product.meta_title || !product.description) {
          return "Please fill in all required fields: Meta Title and Meta Description.";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const ValidationModal = ({ message, onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-red-500">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-[#d72828] text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
  return (
    <div className="mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-200" >
    
      <h2 className="text-2xl font-bold mb-4">Add Product</h2>
      <ProgressStepper />
      <ToastContainer />
      {validationError && <ValidationModal message={validationError} onClose={closeModal} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
           <div className="space-y-4">
           {/* <h3 className="text-xl font-semibold mb-4">Product Information</h3> */}
           <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
        
              <div>
              <label className="block text-sm font-medium text-gray-700">Item Code</label>
                <input type="text" name="item_code" value={product.item_code} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="border p-2 rounded-md mb-2">
              <label className="block text-sm font-medium text-gray-700">Categories</label>
              {renderCategoryTree(categories)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <Select
                options={brand}
                onChange={handleBrandChange}
                placeholder="Select brand..."
               
              />
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">MRP Price</label>
                <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                <input type="number" name="special_price" value={product.special_price} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input type="number" name="quantity" value={product.quantity} onChange={handleChange} className="w-full border p-2 rounded" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Status</label>
              <select
                name="stock_status"
                value={product.stock_status}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            </div>

         </div>
        )}

        {/* Step 2: Pricing & Stock */}
        {currentStep === 2 && (
              <div className="space-y-4">
              {/* <h3 className="text-xl font-semibold mb-4">Pricing & Stock </h3> */}

              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
                <div className="flex items-center">
                  <label className="w-1/4 text-sm font-medium text-gray-700">Images (679×679)</label>
                  
                  <div className="w-3/4 pl-4">
                    <div className="overflow-x-auto">
                      <div className="min-w-full divide-y divide-gray-200">
                        <div className="bg-gray-50">
                          <div className="grid grid-cols-12 gap-4 py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="col-span-5">Image upload</div>
                            <div className="col-span-5">Image</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                        </div>
                        
                        <div className="divide-y divide-gray-200">
                          {/* {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center py-4 px-4">
                              <div className="col-span-5">
                                <input
                                  type="file"
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-red-50 file:text-[#d72828]
                                    hover:file:bg-red-100"
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(index, e)}
                                  required={index === 0}
                                  key={`file-${index}-${product.images[index] ? 'filled' : 'empty'}`}
                                />
                              </div>
                              
                              <div className="col-span-5">
                                <img
                                  className="w-20 h-20 object-cover rounded border border-gray-200"
                                  alt={`Preview ${index + 1}`}
                                  src={product.images[index] || '/img/no-image.jpg'}
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage1(index)}
                                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))} */}
                          {product.images.map((_, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center py-4 px-4">
                              <div className="col-span-5">
                                <input
                                  type="file"
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-red-50 file:text-[#d72828]
                                    hover:file:bg-red-100"
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(index, e)}
                                  required={index === 0}
                                  key={`file-${index}-${product.images[index] ? 'filled' : 'empty'}`}
                                />
                              </div>
                              
                              <div className="col-span-5">
                                <img
                                  className="w-20 h-20 object-cover rounded border border-gray-200"
                                  alt={`Preview ${index + 1}`}
                                  src={product.images[index] || '/img/no-image.jpg'}
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <button type="button" onClick={AddproductImage} className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5zm9 9h-3v3h-2v-3H6v-2h3V9h2v3h3v2z"/>
                                      </svg>
                                    </button>
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage1(index)}
                                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* <button type="button" onClick={AddproductImage} className="px-3 py-1.5 bg-[#d72828] text-white text-sm rounded hover:bg-[#d72828] transition-colors">Add Image</button> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        
              <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={product.description} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
              </div>
            <div className="space-y-6">
              {/* Overview Image */}
              <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-lg shadow-md">
                <div className="w-full md:w-1/4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overview Images (416×416)
                  </label>
                </div>
                
                <div className="w-full md:w-3/4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Image</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {product.overviewImage.map((image, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex flex-col space-y-2">
                                <input
                                  type="file"
                                  // name="overview_image[]"
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-sm file:font-medium
                                    file:bg-red-50 file:text-[#d72828]
                                    hover:file:bg-red-100"
                                  accept="image/*"
                                  onChange={(e) => handleOverviewImageChange(index, e.target.files)}
                                  required={index === 0}
                                  key={`overviewimagefile-${index}-${product.overviewImage[index] ? 'filled' : 'empty'}`}
                                 
                                />
                                {image && (
                                  <div className="mt-2 flex items-center space-x-4">
                                    <img
                                      src={image}
                                      alt={`Preview ${index}`}
                                      className="w-20 h-20 object-cover border rounded"
                                    />
                                    <span className="text-xs text-gray-500">Preview</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 space-x-2">

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <button type="button" onClick={handleAddOverviewImage} className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5zm9 9h-3v3h-2v-3H6v-2h3V9h2v3h3v2z"/>
                                      </svg>
                                    </button>
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOverviewImage(index)}
                                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                
                                </div>
                         
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Product Description Editor */}
              <div className="flex flex-col gap-4">
                <label className="block text-sm font-medium text-gray-700">
                Overview Description
                </label>
                  <textarea name="overviewdescription" value={product.overviewdescription} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
              </div>
            </div>
             
            </div>
        )}

        {/* Step 3: Variants & Filters */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Variants & Filters</h3>
    
            {/* <div className="border p-4 rounded">
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
                              
                                    <tr key={`${variantIndex}-${attrIndex}-${attr.name}-${attr.value}`}>
                                    <td className="p-2 border-b">
                                      <div  className="mb-2">
                                        {attr.name}: {attr.value}
                                      </div>
                                    </td>
                                    <td className="p-2 border-b">
                                      <input
                                        type="text"
                                        value={attr.item_code || ""}
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
                                  {attr.images && attr.images.map((img, imgIndex) => (
                                    <img key={imgIndex} src={img} alt={`Variant ${imgIndex}`} className="w-12 h-12 object-cover rounded border" />
                                  ))}
                                </div>
                              </td>
    
                                    <td className="p-2 border-b">
                                      <input
                                        type="number"
                                        value={attr.price|| ""}
                                        onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'price', e.target.value)}
                                        className="w-full border p-1 rounded"
                                      />
                                    </td>
                                    <td className="p-2 border-b">
                                      <input
                                        type="number"
                                        value={attr.special_price|| ""}
                                        onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'special_price', e.target.value)}
                                        className="w-full border p-1 rounded"
                                      />
                                    </td>
                                    <td className="p-2 border-b">
                                      <input
                                        type="number"
                                        value={attr.quantity|| ""}
                                        onChange={(e) => handleVariantFieldChange(variantIndex, attrIndex, 'quantity', e.target.value)}
                                        className="w-full border p-1 rounded"
                                      />
                                    </td>
                                    </tr>
                                  
                                ))
                          
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div> */}
            <div className="border p-4 rounded">
              <div className="flex items-center space-x-2 mb-4">
                <input type="checkbox" checked={product.hasVariants} onChange={(e) => setProduct(prev => ({ ...prev, hasVariants: e.target.checked }))} />
                <label className="block text-sm font-medium text-gray-700">This product has variants</label>
              </div>

              {product.hasVariants && (
                <>
                  {variant.map((varItem, index) => (
                    <div key={index} className="border p-4 rounded mb-4">
                      <div className="flex gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="Attribute name"
                          value={varItem.variant_attribute_name}
                          onChange={(e) => handleVariantFieldChange1(index, 'variant_attribute_name', e.target.value)}
                          className="border p-2 rounded flex-1"
                        />
                        <button type="button" onClick={() => setVariant(prev => prev.filter((_, i) => i !== index))} className="bg-red-500 text-white px-4 py-2 rounded">Remove</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Option"
                        value={varItem.options}
                        onChange={(e) => handleVariantFieldChange1(index, 'options', e.target.value)}
                        className="w-full border p-2 rounded mb-2"
                      />
                      <input
                        type="text"
                        placeholder="Item Code"
                        value={varItem.item_code}
                        onChange={(e) => handleVariantFieldChange1(index, 'item_code', e.target.value)}
                        className="w-full border p-2 rounded mb-2"
                      />
                      <div className="flex gap-4 mb-2">
                        <input
                          type="number"
                          placeholder="Price"
                          value={varItem.price}
                          onChange={(e) => handleVariantFieldChange1(index, 'price', e.target.value)}
                          className="w-full border p-2 rounded mb-2"
                        />
                        <input
                          type="number"
                          placeholder="Special Price"
                          value={varItem.special_price}
                          onChange={(e) => handleVariantFieldChange1(index, 'special_price', e.target.value)}
                          className="w-full border p-2 rounded mb-2"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={varItem.quantity}
                        onChange={(e) => handleVariantFieldChange1(index, 'quantity', e.target.value)}
                        className="w-full border p-2 rounded mb-2"
                      />

                      {/* <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageChange1(index, e.target.files)}
                        className="w-full border p-2 rounded mb-2"
                      />
                      <div className="flex gap-2">
                        {varItem.images && varItem.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img src={img} alt={`Variant Image ${imgIndex}`} className="w-12 h-12 object-cover rounded border" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                              onClick={() => handleRemoveImage(index, imgIndex)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div> */}
                      <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md mt-4">
                        <div className="flex items-center">
                          <label className="w-1/4 text-sm font-medium text-gray-700">Variant Images (679×679)</label>
                          <div className="w-3/4 pl-4">
                            <div className="overflow-x-auto">
                              <div className="min-w-full divide-y divide-gray-200">
                                <div className="bg-gray-50">
                                  <div className="grid grid-cols-12 gap-4 py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-5">Image upload</div>
                                    <div className="col-span-5">Image</div>
                                    <div className="col-span-2"></div>
                                  </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                  {[0, 1, 2, 3].map((imgIndex) => (
                                    <div key={imgIndex} className="grid grid-cols-12 gap-4 items-center py-4 px-4">
                                      <div className="col-span-5">
                                        <input
                                          type="file"
                                          className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-red-50 file:text-[#d72828]
                                            hover:file:bg-red-100"
                                          accept="image/*"
                                          onChange={(e) => handleVariantImageChange(index, imgIndex, e.target.files)}
                                          required={imgIndex === 0}
                                          key={`variant-${index}-img-${imgIndex}-${varItem.images[imgIndex] ? 'filled' : 'empty'}`}
                                        />
                                      </div>
                                      <div className="col-span-5">
                                        <img
                                          className="w-20 h-20 object-cover rounded border border-gray-200"
                                          alt={`Variant Preview ${imgIndex + 1}`}
                                          src={varItem.images[imgIndex] || '/img/no-image.jpg'}
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveVariantImage(index, imgIndex)}
                                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                          <svg
                                            className="h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddVariant1}
                    className="bg-red-200 px-4 py-2 rounded"
                  >
                    Add Variant
                  </button>
                </>
              )}
            </div>
            <div className="border p-4 rounded">
            <label className="block text-sm font-medium text-gray-700">Filter</label>
              <Select
                options={Filter}
                isMulti
                onChange={handleFilterChange}
                placeholder="Select filters..."
              />
            </div>
          </div>
        )}


        {/* Step 3: status */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700">Meta Title</label>
              <input
                type="text"
                name="meta_title"
                value={product.meta_title}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Key Specifications</label>
              <textarea name="key_specifications" value={product.key_specifications} onChange={handleChange} className="w-full border p-2 rounded" rows="3"></textarea>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <Select
                options={tagsOptions}
                isMulti
                onChange={handleTagsChange}
                placeholder="Select tags..."
              />
            </div> */}
            <div>
                 <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={product.status}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
          </div>
        )}
        <StepNavigation />
      </form>
    </div>
  );
}