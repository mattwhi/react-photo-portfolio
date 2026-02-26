"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { BlogPage, BlogSection } from "@prisma/client";
import {
  addSectionAction,
  deleteSectionAction,
  moveSectionAction,
  updateBlogPageAction,
  updateSectionAction,
  reorderSectionsAction,
} from "../actions";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useRouter } from "next/navigation";
import { MediaPicker, type PickedPhoto } from "@/components/media/MediaPicker";

// Optional drag & drop (safe even if you don't use it yet)
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PageWithSections = BlogPage & { sections: BlogSection[] };

type StoredImage = {
  photoId: string;
  key: string;
  url: string;
  alt?: string;
  title?: string;
} | null;

export function PageBuilderClient({ page }: { page: PageWithSections }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [local, setLocal] = useState(page);
  useEffect(() => setLocal(page), [page]);

  // Meta warnings (live counters)
  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription ?? ""
  );
  useEffect(() => setMetaTitle(page.metaTitle ?? ""), [page.metaTitle]);
  useEffect(
    () => setMetaDescription(page.metaDescription ?? ""),
    [page.metaDescription]
  );

  const metaTitleWarn = metaTitle.length > 60;
  const metaDescWarn = metaDescription.length > 160;

  // Hero/Feature images stored as Json on BlogPage (heroImage, featureImage)
  const [heroImage, setHeroImage] = useState<StoredImage>(
    (page as any).heroImage ?? null
  );
  const [featureImage, setFeatureImage] = useState<StoredImage>(
    (page as any).featureImage ?? null
  );

  useEffect(() => setHeroImage((page as any).heroImage ?? null), [page]);
  useEffect(() => setFeatureImage((page as any).featureImage ?? null), [page]);

  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const [featurePickerOpen, setFeaturePickerOpen] = useState(false);

  // Toggle: enable drag & drop reorder
  const [dragEnabled, setDragEnabled] = useState(true);

  const sectionTypes = useMemo(
    () => [
      { type: "H1", label: "H1 title" },
      { type: "RICH_TEXT", label: "Text (full editor)" },
      { type: "TWO_COL_IMAGE_TEXT", label: "2 col image/text" },
      { type: "IMAGE", label: "Image" },
      { type: "DIVIDER", label: "Divider" },
      { type: "SPACER", label: "Spacer" },
    ],
    []
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = local.sections.findIndex((s) => s.id === active.id);
    const newIndex = local.sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(local.sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      sortOrder: i + 1,
    }));

    // Optimistic UI
    setLocal((prev) => ({ ...prev, sections: next }));

    startTransition(async () => {
      await reorderSectionsAction(
        local.id,
        next.map((s) => s.id)
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Page meta + hero/feature */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-semibold">Edit page</h1>

        <form
          action={(fd) =>
            startTransition(async () => {
              fd.set("id", local.id);

              // store images as Json strings (actions.ts parses these)
              fd.set("heroImageJson", JSON.stringify(heroImage ?? null));
              fd.set("featureImageJson", JSON.stringify(featureImage ?? null));

              await updateBlogPageAction(fd);
              router.refresh();
            })
          }
          className="mt-4 grid gap-4"
        >
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Title</label>
            <input
              name="title"
              defaultValue={local.title}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">Slug</label>
            <input
              name="slug"
              defaultValue={local.slug}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              required
            />
            <div className="text-xs text-white/50">
              Preview:{" "}
              <a
                className="text-white/70 underline"
                href={`/blog/preview/${local.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                /blog/preview/{local.slug}
              </a>
            </div>
          </div>

          {/* Hero + Feature images */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-white/80">Hero image</div>
                <button
                  type="button"
                  onClick={() => setHeroPickerOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Pick image
                </button>
              </div>

              <div className="mt-3">
                {heroImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage.url}
                    alt={heroImage.alt || ""}
                    className="h-40 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                    No hero image selected
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHeroImage(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-white/80">Feature image</div>
                <button
                  type="button"
                  onClick={() => setFeaturePickerOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Pick image
                </button>
              </div>

              <div className="mt-3">
                {featureImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featureImage.url}
                    alt={featureImage.alt || ""}
                    className="h-40 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                    No feature image selected
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFeatureImage(heroImage)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Use hero as feature
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureImage(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">Meta title</label>
            <input
              name="metaTitle"
              defaultValue={local.metaTitle ?? ""}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            />
            <div
              className={`text-xs ${
                metaTitleWarn ? "text-amber-300" : "text-white/50"
              }`}
            >
              {metaTitle.length}/60 {metaTitleWarn ? "— may be truncated" : ""}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">Meta description</label>
            <textarea
              name="metaDescription"
              defaultValue={local.metaDescription ?? ""}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="min-h-22.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            />
            <div
              className={`text-xs ${
                metaDescWarn ? "text-amber-300" : "text-white/50"
              }`}
            >
              {metaDescription.length}/160{" "}
              {metaDescWarn ? "— may be truncated" : ""}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-white/70">Status</label>
            <select
              name="status"
              defaultValue={local.status}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>

            <button
              disabled={pending}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-60"
            >
              Save page
            </button>
          </div>
        </form>
      </div>
      {/* Tag and Author info */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-5 mt-5">
        <div className="grid gap-2">
          <label className="text-sm text-white/70">Author</label>
          <input
            name="authorName"
            defaultValue={(local as any).authorName ?? ""}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            placeholder="e.g. Matt White"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Category</label>
          <input
            name="category"
            defaultValue={(local as any).category ?? ""}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            placeholder="e.g. SEO, Portfolio, Photography"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">
            Tags (comma separated)
          </label>
          <input
            name="tags"
            defaultValue={
              Array.isArray((local as any).tags)
                ? (local as any).tags.join(", ")
                : ""
            }
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            placeholder="e.g. seo, local seo, halifax"
          />
        </div>
      </div>
      {/* Section builder */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Section builder</h2>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={dragEnabled}
                onChange={(e) => setDragEnabled(e.target.checked)}
              />
              Drag reorder
            </label>

            <div className="flex flex-wrap gap-2">
              {sectionTypes.map((s) => (
                <button
                  type="button"
                  key={s.type}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await addSectionAction(local.id, s.type);
                      router.refresh(); // ✅ show new section immediately
                    })
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {local.sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-white/70">
              No sections yet. Use the + buttons to add content.
            </div>
          ) : dragEnabled ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={local.sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {local.sections.map((section) => (
                    <SortableSectionCard
                      key={section.id}
                      pageId={local.id}
                      section={section}
                      pending={pending}
                      onMove={(dir: "up" | "down") =>
                        startTransition(async () => {
                          await moveSectionAction(section.id, local.id, dir);
                          router.refresh();
                        })
                      }
                      onDelete={() =>
                        startTransition(async () => {
                          await deleteSectionAction(section.id, local.id);
                          router.refresh();
                        })
                      }
                      onSave={(fd: FormData) =>
                        startTransition(async () => {
                          fd.set("id", section.id);
                          fd.set("pageId", local.id);
                          fd.set("type", section.type);
                          await updateSectionAction(fd);
                          router.refresh();
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-4">
              {local.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  pageId={local.id}
                  section={section}
                  pending={pending}
                  onMove={(dir) =>
                    startTransition(async () => {
                      await moveSectionAction(section.id, local.id, dir);
                      router.refresh();
                    })
                  }
                  onDelete={() =>
                    startTransition(async () => {
                      await deleteSectionAction(section.id, local.id);
                      router.refresh();
                    })
                  }
                  onSave={(fd) =>
                    startTransition(async () => {
                      fd.set("id", section.id);
                      fd.set("pageId", local.id);
                      fd.set("type", section.type);
                      await updateSectionAction(fd);
                      router.refresh();
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pickers */}
      <MediaPicker
        open={heroPickerOpen}
        title="Pick hero image"
        onClose={() => setHeroPickerOpen(false)}
        onPick={(p: PickedPhoto) => {
          setHeroImage({
            photoId: p.id,
            key: p.key ?? "",
            url: p.url,
            alt: p.alt || "",
            title: p.title || "",
          });
          setHeroPickerOpen(false);
        }}
      />
      <MediaPicker
        open={featurePickerOpen}
        title="Pick feature image"
        onClose={() => setFeaturePickerOpen(false)}
        onPick={(p: PickedPhoto) => {
          setFeatureImage({
            photoId: p.id,
            key: p.key ?? "",
            url: p.url,
            alt: p.alt || "",
            title: p.title || "",
          });
          setFeaturePickerOpen(false);
        }}
      />
    </div>
  );
}

function SortableSectionCard(props: any) {
  const { section } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionCard
        {...props}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10 active:cursor-grabbing"
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
        }
      />
    </div>
  );
}

function SectionCard({
  pageId,
  section,
  pending,
  onMove,
  onDelete,
  onSave,
  dragHandle,
}: {
  pageId: string;
  section: any;
  pending: boolean;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
  onSave: (fd: FormData) => void;
  dragHandle?: React.ReactNode;
}) {
  const typeLabel = section.type.replaceAll("_", " ");

  // Rich text state
  const [html, setHtml] = useState(section.data?.html ?? "");
  useEffect(() => setHtml(section.data?.html ?? ""), [section.id]);

  // Image state for IMAGE / TWO_COL
  const [img, setImg] = useState<any>(() => {
    if (section.type === "IMAGE") return section.data ?? {};
    if (section.type === "TWO_COL_IMAGE_TEXT") return section.data?.image ?? {};
    return {};
  });
  useEffect(() => {
    if (section.type === "IMAGE") setImg(section.data ?? {});
    if (section.type === "TWO_COL_IMAGE_TEXT")
      setImg(section.data?.image ?? {});
  }, [section.id, section.type]);

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {dragHandle}
          <div className="text-sm font-medium text-white/80">{typeLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMove("up")}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-sm hover:bg-red-500/15"
          >
            Delete
          </button>
        </div>
      </div>

      <form action={onSave} className="space-y-3">
        {section.type === "H1" && (
          <div className="grid gap-2">
            <label className="text-sm text-white/70">H1 text</label>
            <input
              name="text"
              defaultValue={section.data?.text ?? ""}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            />
          </div>
        )}

        {section.type === "RICH_TEXT" && (
          <>
            <input type="hidden" name="html" value={html} />
            <RichTextEditor value={html} onChange={setHtml} />
          </>
        )}

        {section.type === "TWO_COL_IMAGE_TEXT" && (
          <>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Alignment</label>
              <select
                name="align"
                defaultValue={section.data?.align ?? "imageLeft"}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <option value="imageLeft">Image Left / Text Right</option>
                <option value="imageRight">Image Right / Text Left</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white/80">
                  Block image
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Pick image
                </button>
              </div>

              <div className="mt-3">
                {img?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="h-40 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                    No image selected
                  </div>
                )}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/70">Alt</label>
                  <input
                    name="imageAlt"
                    value={img?.alt ?? ""}
                    onChange={(e) =>
                      setImg((p: any) => ({ ...p, alt: e.target.value }))
                    }
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/70">Title</label>
                  <input
                    name="imageTitle"
                    value={img?.title ?? ""}
                    onChange={(e) =>
                      setImg((p: any) => ({ ...p, title: e.target.value }))
                    }
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  />
                </div>
              </div>

              <input
                type="hidden"
                name="imagePhotoId"
                value={img?.photoId ?? ""}
              />
              <input type="hidden" name="imageKey" value={img?.key ?? ""} />
              <input type="hidden" name="imageUrl" value={img?.url ?? ""} />

              <MediaPicker
                open={pickerOpen}
                title="Pick block image"
                onClose={() => setPickerOpen(false)}
                onPick={(p) => {
                  setImg({
                    photoId: p.id,
                    key: p.key,
                    url: p.url,
                    alt: p.alt || "",
                    title: p.title || "",
                  });
                  setPickerOpen(false);
                }}
              />
            </div>

            <input type="hidden" name="html" value={html} />
            <RichTextEditor value={html} onChange={setHtml} />
          </>
        )}

        {section.type === "IMAGE" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-white/80">Image</div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
              >
                Pick image
              </button>
            </div>

            <div className="mt-3">
              {img?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.alt || ""}
                  className="h-48 w-full rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                  No image selected
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Alt</label>
                <input
                  name="alt"
                  value={img?.alt ?? ""}
                  onChange={(e) =>
                    setImg((p: any) => ({ ...p, alt: e.target.value }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Title</label>
                <input
                  name="title"
                  value={img?.title ?? ""}
                  onChange={(e) =>
                    setImg((p: any) => ({ ...p, title: e.target.value }))
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm text-white/70">Caption</label>
                <input
                  name="caption"
                  defaultValue={section.data?.caption ?? ""}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                />
              </div>
            </div>

            <input type="hidden" name="photoId" value={img?.photoId ?? ""} />
            <input type="hidden" name="key" value={img?.key ?? ""} />
            <input type="hidden" name="url" value={img?.url ?? ""} />

            <MediaPicker
              open={pickerOpen}
              title="Pick image"
              onClose={() => setPickerOpen(false)}
              onPick={(p) => {
                setImg({
                  photoId: p.id,
                  key: p.key,
                  url: p.url,
                  alt: p.alt || "",
                  title: p.title || "",
                });
                setPickerOpen(false);
              }}
            />
          </div>
        )}

        {section.type === "DIVIDER" && (
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Divider style</label>
            <select
              name="style"
              defaultValue={section.data?.style ?? "line"}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <option value="line">Line</option>
              <option value="space">Space</option>
            </select>
          </div>
        )}

        {section.type === "SPACER" && (
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Spacer height (px)</label>
            <input
              name="height"
              type="number"
              min={0}
              max={500}
              defaultValue={section.data?.height ?? 24}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            />
          </div>
        )}

        <button
          disabled={pending}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15 disabled:opacity-60"
        >
          Save section
        </button>
      </form>
    </div>
  );
}
