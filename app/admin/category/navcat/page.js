// app/admin/category/navcat/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function sortByPosition(list) {
  return [...(list || [])].sort(
    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
  );
}

function extractCategoryArray(resJson) {
  if (Array.isArray(resJson)) return resJson;
  if (Array.isArray(resJson?.data)) return resJson.data;
  if (Array.isArray(resJson?.categories)) return resJson.categories;
  return [];
}

function CategoryDragList({ items, droppableId, onDragEnd }) {
  return (
    <div
      style={{
        margin: "20px 0",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ backgroundColor: "#f9f9f9" }}
            >
              {items.map((category, index) => (
                <Draggable
                  key={String(category._id)}
                  draggableId={String(category._id)}
                  index={index}
                >
                  {(providedDrag) => (
                    <div
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                      {...providedDrag.dragHandleProps}
                      style={{
                        padding: "15px",
                        background: "white",
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.2s",
                        ...providedDrag.draggableProps.style,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: "500" }}>
                          {category.category_name}
                        </span>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "0.8em",
                            fontWeight: "500",
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                          }}
                        >
                          Active
                        </span>
                      </div>
                      <div style={{ color: "#888", fontSize: "0.9em" }}>
                        Position: {category.position}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

function ActionButtons({
  saving,
  hasChanges,
  onSave,
  onReset,
  onRefresh,
}) {
  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
      <button
        onClick={onSave}
        disabled={saving || !hasChanges}
        style={{
          padding: "10px 15px",
          border: "none",
          borderRadius: "4px",
          cursor: saving || !hasChanges ? "not-allowed" : "pointer",
          fontWeight: "500",
          backgroundColor: saving || !hasChanges ? "#ccc" : "#4caf50",
          color: "white",
        }}
      >
        {saving ? "Saving..." : "Save Order"}
      </button>

      <button
        onClick={onReset}
        disabled={!hasChanges}
        style={{
          padding: "10px 15px",
          border: "none",
          borderRadius: "4px",
          cursor: !hasChanges ? "not-allowed" : "pointer",
          fontWeight: "500",
          backgroundColor: !hasChanges ? "#ccc" : "#ff9800",
          color: "white",
        }}
      >
        Reset
      </button>

      <button
        onClick={onRefresh}
        style={{
          padding: "10px 15px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "500",
          backgroundColor: "#2196f3",
          color: "white",
        }}
      >
        Refresh
      </button>
    </div>
  );
}

export default function CategoryNavPage() {
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [originalSubcategories, setOriginalSubcategories] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMain, setSavingMain] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [hasMainChanges, setHasMainChanges] = useState(false);
  const [hasSubChanges, setHasSubChanges] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // "main" | "sub" | null

  const parentOptions = useMemo(() => {
    const mains = sortByPosition(
      allCategories.filter(
        (cat) => cat.parentid === "none" && cat.status === "Active"
      )
    );

    return mains
      .map((main) => {
        const childCount = allCategories.filter(
          (c) =>
            String(c.parentid) === String(main._id) && c.status === "Active"
        ).length;
        return { ...main, childCount };
      })
      .filter((main) => main.childCount > 0);
  }, [allCategories]);

  const selectedParent = useMemo(
    () => allCategories.find((c) => String(c._id) === String(selectedParentId)),
    [allCategories, selectedParentId]
  );

  const loadChildrenForParent = (parentId, source = allCategories) => {
    if (!parentId) {
      setSubcategories([]);
      setOriginalSubcategories([]);
      setHasSubChanges(false);
      return;
    }
    const children = sortByPosition(
      source.filter(
        (cat) =>
          String(cat.parentid) === String(parentId) && cat.status === "Active"
      )
    );
    setSubcategories(children);
    setOriginalSubcategories(JSON.parse(JSON.stringify(children)));
    setHasSubChanges(false);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories/get");

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const resJson = await response.json();
      const data = extractCategoryArray(resJson);
      setAllCategories(data);

      const activeMainCategories = sortByPosition(
        data.filter(
          (cat) => cat.parentid === "none" && cat.status === "Active"
        )
      );

      setCategories(activeMainCategories);
      setOriginalCategories(JSON.parse(JSON.stringify(activeMainCategories)));
      setHasMainChanges(false);

      const nextParentId =
        selectedParentId &&
        data.some((c) => String(c._id) === String(selectedParentId))
          ? selectedParentId
          : "";

      if (!nextParentId) {
        setSelectedParentId("");
        setSubcategories([]);
        setOriginalSubcategories([]);
        setHasSubChanges(false);
      } else {
        loadChildrenForParent(nextParentId, data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMainDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setCategories(updatedItems);
    setHasMainChanges(true);
  };

  const handleSubDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(subcategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setSubcategories(updatedItems);
    setHasSubChanges(true);
  };

  const saveOrder = async (list, { setSaving, setOriginal, setHasChanges, label }) => {
    try {
      setSaving(true);
      setConfirmKind(null);

      const categoriesToUpdate = list.map((category, index) => ({
        _id: category._id,
        position: index,
      }));

      const response = await fetch("/api/categories/update-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: categoriesToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update ${label} positions`
        );
      }

      setOriginal(JSON.parse(JSON.stringify(list)));
      setHasChanges(false);
      await fetchCategories();
    } catch (error) {
      console.error(`Error saving ${label} order:`, error);
      alert(`Failed to save ${label} order: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  const onParentChange = (parentId) => {
    if (hasSubChanges) {
      const ok = window.confirm(
        "You have unsaved subcategory changes. Discard them and switch parent?"
      );
      if (!ok) return;
    }
    setSelectedParentId(parentId);
    loadChildrenForParent(parentId);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ color: "#333", marginBottom: "10px" }}>
          Category Navigation Management
        </h1>
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#333", marginBottom: "10px" }}>
        Category Navigation Management
      </h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Drag items to set the order shown in the storefront nav menu. Save each
        section separately.
      </p>

      {/* ── Main categories ── */}
      <h2 style={{ color: "#333", fontSize: "18px", marginBottom: "8px" }}>
        Main category order
      </h2>

      {categories.length === 0 ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          No active categories found. Please activate some categories first.
        </div>
      ) : (
        <>
          <CategoryDragList
            items={categories}
            droppableId="categories"
            onDragEnd={handleMainDragEnd}
          />
          <ActionButtons
            saving={savingMain}
            hasChanges={hasMainChanges}
            onSave={() => setConfirmKind("main")}
            onReset={() => {
              setCategories(JSON.parse(JSON.stringify(originalCategories)));
              setHasMainChanges(false);
            }}
            onRefresh={fetchCategories}
          />
          {hasMainChanges && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#fff8e1",
                border: "1px solid #ffd54f",
                borderRadius: "4px",
              }}
            >
              You have unsaved main category changes. Click &quot;Save Order&quot; to
              save them.
            </div>
          )}
        </>
      )}

      {/* ── Subcategories ── */}
      <hr style={{ margin: "36px 0 24px", border: 0, borderTop: "1px solid #e5e5e5" }} />

      <h2 style={{ color: "#333", fontSize: "18px", marginBottom: "8px" }}>
        Subcategory order
      </h2>
      <p style={{ color: "#666", marginBottom: "12px", fontSize: "14px" }}>
        Choose a main category, then drag its subcategories into the order you
        want in the mega menu and footer.
      </p>

      <label
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "#333",
          marginBottom: "6px",
        }}
      >
        Parent category
      </label>
      <select
        value={selectedParentId}
        onChange={(e) => onParentChange(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "10px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginBottom: "8px",
          background: "white",
        }}
      >
        <option value="">Select a main category…</option>
        {parentOptions.map((parent) => (
          <option key={parent._id} value={parent._id}>
            {parent.category_name} ({parent.childCount} subcategories)
          </option>
        ))}
      </select>

      {!selectedParentId ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        >
          Select a parent category to reorder its subcategories.
        </div>
      ) : subcategories.length === 0 ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        >
          No active subcategories under{" "}
          <strong>{selectedParent?.category_name || "this category"}</strong>.
        </div>
      ) : (
        <>
          <p style={{ color: "#555", fontSize: "14px", marginTop: "12px" }}>
            Ordering subcategories of{" "}
            <strong>{selectedParent?.category_name}</strong>
          </p>
          <CategoryDragList
            items={subcategories}
            droppableId="subcategories"
            onDragEnd={handleSubDragEnd}
          />
          <ActionButtons
            saving={savingSub}
            hasChanges={hasSubChanges}
            onSave={() => setConfirmKind("sub")}
            onReset={() => {
              setSubcategories(JSON.parse(JSON.stringify(originalSubcategories)));
              setHasSubChanges(false);
            }}
            onRefresh={fetchCategories}
          />
          {hasSubChanges && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#fff8e1",
                border: "1px solid #ffd54f",
                borderRadius: "4px",
              }}
            >
              You have unsaved subcategory changes. Click &quot;Save Order&quot; to
              save them.
            </div>
          )}
        </>
      )}

      {confirmKind && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Confirm Save</h3>
            <p style={{ margin: "0 0 20px 0", color: "#666" }}>
              Are you sure you want to save the{" "}
              {confirmKind === "main" ? "main category" : "subcategory"} order?
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setConfirmKind(null)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                No
              </button>
              <button
                onClick={() => {
                  if (confirmKind === "main") {
                    saveOrder(categories, {
                      setSaving: setSavingMain,
                      setOriginal: setOriginalCategories,
                      setHasChanges: setHasMainChanges,
                      label: "category",
                    });
                  } else {
                    saveOrder(subcategories, {
                      setSaving: setSavingSub,
                      setOriginal: setOriginalSubcategories,
                      setHasChanges: setHasSubChanges,
                      label: "subcategory",
                    });
                  }
                }}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#4caf50",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
