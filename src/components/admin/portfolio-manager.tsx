"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import {
  Upload,
  Trash2,
  Edit2,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import type { Tables, PortfolioCategory } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createPortfolioItemAction,
  updatePortfolioItemAction,
  togglePortfolioVisibilityAction,
  deletePortfolioItemAction,
  reorderPortfolioAction,
} from "@/app/admin/(dashboard)/portfolio/actions";

type PortfolioRow = Tables<"portfolio_items">;

const CATEGORIES: PortfolioCategory[] = [
  "Haircuts",
  "Coloring",
  "Styling",
  "Other",
];

interface PortfolioManagerProps {
  businessId: string;
  initialItems: PortfolioRow[];
  initialNewModalOpen?: boolean;
}

export function PortfolioManager({
  businessId,
  initialItems,
  initialNewModalOpen = false,
}: PortfolioManagerProps) {
  const [items, setItems] = React.useState<PortfolioRow[]>(initialItems);

  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const [isUploadOpen, setIsUploadOpen] = React.useState(initialNewModalOpen);
  const [editingItem, setEditingItem] = React.useState<PortfolioRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PortfolioRow | null>(null);

  // Form State
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [titleEn, setTitleEn] = React.useState("");
  const [titleHu, setTitleHu] = React.useState("");
  const [category, setCategory] = React.useState<PortfolioCategory>("Haircuts");
  const [isVisible, setIsVisible] = React.useState(true);

  const [uploading, setUploading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setTitleEn("");
    setTitleHu("");
    setCategory("Haircuts");
    setIsVisible(true);
    setEditingItem(null);
    setErrorMsg(null);
  };

  const handleOpenUpload = () => {
    resetForm();
    setIsUploadOpen(true);
  };

  const handleOpenEdit = (item: PortfolioRow) => {
    setEditingItem(item);
    setTitleEn(item.title_en ?? "");
    setTitleHu(item.title_hu ?? "");
    setCategory((item.category as PortfolioCategory) ?? "Haircuts");
    setIsVisible(item.is_visible);
    setErrorMsg(null);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (JPEG, PNG, WEBP, GIF).");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setErrorMsg(null);

    try {
      if (editingItem) {
        // Edit existing metadata
        const res = await updatePortfolioItemAction(editingItem.id, {
          title_en: titleEn,
          title_hu: titleHu,
          category,
          is_visible: isVisible,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setIsUploadOpen(false);
          resetForm();
        }
      } else {
        // Upload new image
        if (!file) {
          setErrorMsg("Please select an image file to upload.");
          setUploading(false);
          return;
        }

        const supabase = createClient();
        const fileExt = file.name.split(".").pop();
        const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const storagePath = `businesses/${businessId}/portfolio/${cleanName}`;

        const { error: storageErr } = await supabase.storage
          .from("portfolio")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (storageErr) {
          setErrorMsg(`Upload failed: ${storageErr.message}`);
          setUploading(false);
          return;
        }

        const res = await createPortfolioItemAction({
          title_en: titleEn,
          title_hu: titleHu,
          image_path: storagePath,
          category,
          is_visible: isVisible,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setIsUploadOpen(false);
          resetForm();
        }
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisible = async (item: PortfolioRow) => {
    const nextVal = !item.is_visible;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_visible: nextVal } : i))
    );
    const res = await togglePortfolioVisibilityAction(item.id, nextVal);
    if (res.error) {
      setItems(initialItems);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setUploading(true);
    const res = await deletePortfolioItemAction(
      deleteTarget.id,
      deleteTarget.image_path
    );
    setUploading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setDeleteTarget(null);
    }
  };

  const handleMove = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setItems(newItems);
    await reorderPortfolioAction(newItems.map((i) => i.id));
  };

  const getPublicUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  };

  const filteredItems = React.useMemo(() => {
    if (categoryFilter === "all") return items;
    return items.filter((i) => i.category === categoryFilter);
  }, [items, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your barbershop showcase images using Supabase Storage.
          </p>
        </div>
        <Button onClick={handleOpenUpload} className="gap-2 shrink-0">
          <Upload className="size-4" />
          <span>Upload Image</span>
        </Button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          size="xs"
          onClick={() => setCategoryFilter("all")}
        >
          All ({items.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="xs"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat} ({count})
            </Button>
          );
        })}
      </div>

      {/* Portfolio Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <ImageIcon className="size-10 text-muted-foreground mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">
            No portfolio images
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Upload images of haircuts, styling, or coloring to display in your portfolio.
          </p>
          <Button onClick={handleOpenUpload} variant="outline" className="mt-4 gap-2">
            <Upload className="size-4" />
            <span>Upload First Image</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => {
            const publicUrl = getPublicUrl(item.image_path);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:shadow-md"
              >
                {/* Image preview */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                  <img
                    src={publicUrl}
                    alt={item.title_en || "Portfolio image"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {item.category && <Badge variant="secondary">{item.category}</Badge>}
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(item)}
                      className="rounded-full bg-black/60 p-1.5 text-white backdrop-blur-xs hover:bg-black/80 transition-colors"
                      title={item.is_visible ? "Visible" : "Hidden"}
                    >
                      {item.is_visible ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5 opacity-60" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer info & actions */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                      {item.title_en || "Untitled Image"}
                    </h4>
                    {item.title_hu && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        HU: {item.title_hu}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "left")}
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move left"
                      >
                        <ArrowLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === filteredItems.length - 1}
                        onClick={() => handleMove(index, "right")}
                        className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move right"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit title & category"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Edit Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogHeader onClose={() => setIsUploadOpen(false)}>
          <DialogTitle>
            {editingItem ? "Edit Portfolio Image" : "Upload Portfolio Image"}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? "Update image titles or category."
              : "Upload a photo to your portfolio storage."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive mb-4">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingItem && (
            <div className="space-y-1.5">
              <Label htmlFor="image_file">Select Image File *</Label>
              <Input
                id="image_file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                required={!editingItem}
              />
              {previewUrl && (
                <div className="mt-2 relative aspect-16/9 w-full overflow-hidden rounded-lg border border-border">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p_title_en">Title (English)</Label>
              <Input
                id="p_title_en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Skin Fade Haircut"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p_title_hu">Title (Hungarian)</Label>
              <Input
                id="p_title_hu"
                value={titleHu}
                onChange={(e) => setTitleHu(e.target.value)}
                placeholder="e.g. Átmenetes Hajvágás"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p_category">Category</Label>
            <Select
              id="p_category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PortfolioCategory)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="p_visible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="p_visible" className="cursor-pointer text-xs">
              Make image visible on public website
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading
                ? "Processing..."
                : editingItem
                ? "Save Changes"
                : "Upload Image"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader onClose={() => setDeleteTarget(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this portfolio photo? It will be permanently removed from storage and database.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={uploading}>
            {uploading ? "Deleting..." : "Delete Photo"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
