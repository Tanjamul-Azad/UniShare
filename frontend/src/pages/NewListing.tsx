import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Upload,
  ArrowLeft,
  BookOpen,
  PenTool,
  Monitor,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  createMarketplaceListing,
  getMarketplaceItemById,
  updateMarketplaceItem,
  type CreateMarketplaceListingInput,
  type MarketplaceItem,
} from "../lib/api";
import { emitToast } from "../lib/toastBus";
import { newListingSchema } from "../lib/validation";
import Modal from "../components/Modal";
import VerificationModal from "../components/VerificationModal";
import { useAuth } from "../context/AuthContext";
import { useApiQuery } from "../hooks/useApiQuery";
import QueryErrorState from "../components/QueryErrorState";

type ListingFieldErrors = Partial<
  Record<
    "title" | "condition" | "description" | "price" | "exchangeFor",
    string
  >
>;

export default function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);
  const [listingType, setListingType] = useState<"sell" | "share" | "barter">("sell");
  const [category, setCategory] = useState("Books");
  const [fieldErrors, setFieldErrors] = useState<ListingFieldErrors>({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [formKey, setFormKey] = useState(0);

  const isVerified = user?.verificationStatus === "verified" || user?.isVerified;

  if (user?.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Admin accounts cannot create listings</h2>
        <p className="text-gray-500 text-sm">Administrators are not permitted to list items for sale, sharing, or trade.</p>
      </div>
    );
  }

  const {
    data: editItem,
    isLoading: isEditLoading,
    isError: isEditError,
  } = useApiQuery<MarketplaceItem | undefined>({
    queryKey: ["marketplace-item", editId],
    queryFn: () =>
      editId ? getMarketplaceItemById(editId) : Promise.resolve(undefined),
    enabled: isEditing,
    errorMessage: "Could not load listing details.",
  });

  useEffect(() => {
    if (!editItem) {
      return;
    }
    setListingType(editItem.type);
    setCategory(editItem.category);
    setImageUrl(editItem.image || "");
    setImageFileName(editItem.image ? "Current image" : "");
    setFormKey((prev) => prev + 1);
  }, [editItem]);

  const createListingMutation = useMutation({
    mutationFn: createMarketplaceListing,
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: ["marketplace-items"] });
      await queryClient.invalidateQueries({
        queryKey: ["seller-profile", "u-current"],
      });
      emitToast("Listing published successfully.", "success");
      navigate(`/marketplace/${item.id}`);
    },
    onError: (error: any) => {
      console.error("Publishing error:", error);
      emitToast(
        error?.message || "Unable to publish listing. Please try again.",
        "error",
      );
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateMarketplaceListingInput>;
    }) => updateMarketplaceItem(id, data),
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: ["marketplace-items"] });
      await queryClient.invalidateQueries({
        queryKey: ["marketplace-item", item.id],
      });
      emitToast("Listing updated successfully.", "success");
      navigate(`/marketplace/${item.id}`);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      emitToast(
        error?.message || "Unable to update listing. Please try again.",
        "error",
      );
    },
  });

  const handleImageUpload = (file?: File) => {
    if (!file) {
      setImageUrl("");
      setImageFileName("");
      return;
    }
    // Check size limit: 5MB = 5 * 1024 * 1024 bytes
    if (file.size > 5 * 1024 * 1024) {
      emitToast("Image size must be less than 5MB", "error");
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const condition = String(formData.get("condition") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priceRaw = String(formData.get("price") || "0");
    const exchangeFor = String(formData.get("exchangeFor") || "").trim();

    const parsed = newListingSchema.safeParse({
      title,
      category,
      listingType,
      condition,
      description,
      price: Number(priceRaw),
      exchangeFor,
      imageUrl: imageUrl || undefined,
    });

    if (!parsed.success) {
      const nextErrors: ListingFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in nextErrors)) {
          nextErrors[key as keyof ListingFieldErrors] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      emitToast("Please fix the highlighted fields.", "error");
      return;
    }

    setFieldErrors({});

    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }

    if (isEditing && editId) {
      updateListingMutation.mutate({ id: editId, data: parsed.data });
      return;
    }

    createListingMutation.mutate(parsed.data);
  };

  if (isEditing && isEditLoading) {
    return (
      <Modal
        isOpen={true}
        onClose={() => navigate(-1)}
        title="Edit Listing"
        description="Loading listing details."
      >
        <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
      </Modal>
    );
  }

  if (isEditing && isEditError) {
    return (
      <Modal
        isOpen={true}
        onClose={() => navigate(-1)}
        title="Edit Listing"
        description="We could not load this listing."
      >
        <QueryErrorState
          title="Listing unavailable"
          message="Please try again later."
          onRetry={() => window.location.reload()}
        />
      </Modal>
    );
  }

  if (isEditing && editItem && editItem.sellerId !== user?.id) {
    return (
      <Modal
        isOpen={true}
        onClose={() => navigate(-1)}
        title="Edit Listing"
        description="You can only edit your own listings."
      >
        <div className="py-10 text-center text-sm text-gray-500">
          Access denied.
        </div>
      </Modal>
    );
  }

  return (
    <>
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />

      <Modal
        isOpen={true}
        onClose={() => navigate(-1)}
        title={isEditing ? "Edit Listing" : "List an Item"}
        description={
          isEditing
            ? "Update your listing details."
            : "Share, sell, or barter your stationary, books, and electronics."
        }
      >
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Listing Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(["sell", "share", "barter"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium transition-all duration-200 capitalize",
                    listingType === type
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "Books", icon: BookOpen },
                { id: "Stationary", icon: PenTool },
                { id: "Electronics", icon: Monitor },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    category === cat.id
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.id}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Product Image{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div
              className={cn(
                "w-full flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors group cursor-pointer",
                isDragging
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20"
                  : "border-gray-300 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-2 text-center pointer-events-none">
                <Upload
                  className={cn(
                    "mx-auto h-8 w-8 transition-colors",
                    isDragging
                      ? "text-indigo-500"
                      : "text-gray-400 group-hover:text-indigo-500",
                  )}
                />
                <div className="flex text-sm text-gray-600 justify-center pointer-events-auto">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                  >
                    <span>
                      {imageFileName ? "Replace file" : "Upload a file"}
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                  </label>
                  <p className="pl-1">
                    {imageFileName ? "" : "or drag and drop"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 pointer-events-auto">
                  {imageFileName ? (
                    <span className="font-semibold text-indigo-600 truncate max-w-xs inline-block align-bottom">
                      {imageFileName}
                    </span>
                  ) : (
                    "PNG, JPG, GIF up to 5MB"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              name="title"
              type="text"
              required
              defaultValue={editItem?.title || ""}
              placeholder="e.g. Introduction to Algorithms, 3rd Edition"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 transition-all font-medium"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {listingType === "sell" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (৳)
                </label>
                <input
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={editItem?.price?.toString() || ""}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 transition-all font-medium"
                />
                {fieldErrors.price && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.price}
                  </p>
                )}
              </motion.div>
            )}
            {listingType === "barter" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="sm:col-span-2"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you looking for in exchange?
                </label>
                <input
                  name="exchangeFor"
                  type="text"
                  required
                  defaultValue={editItem?.exchangeFor || ""}
                  placeholder="e.g. A good condition calculus textbook"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 transition-all font-medium"
                />
                {fieldErrors.exchangeFor && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.exchangeFor}
                  </p>
                )}
              </motion.div>
            )}
            <div
              className={cn(
                listingType !== "sell" && listingType !== "barter"
                  ? "sm:col-span-2"
                  : "",
              )}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                name="condition"
                defaultValue={editItem?.condition || "New"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-gray-900 transition-all appearance-none font-medium bg-white"
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
              {fieldErrors.condition && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.condition}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={4}
              defaultValue={editItem?.description || ""}
              placeholder="Describe the item's condition, edition, any highlights or markings..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none text-gray-900 transition-all font-medium"
            ></textarea>
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {listingType === "share" && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 items-start">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">
                <strong>Sharing is caring!</strong> You are listing this item
                for free. Other users will be able to request it from you.
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={
                createListingMutation.isPending ||
                updateListingMutation.isPending
              }
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm"
            >
              {createListingMutation.isPending ||
              updateListingMutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Publish Listing"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-white text-gray-700 border border-gray-200 py-3.5 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
