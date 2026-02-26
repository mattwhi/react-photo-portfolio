import { createBlogPageAction } from "../actions";
import { redirect } from "next/navigation";

export default function NewBlogPage() {
  async function action(formData: FormData) {
    "use server";
    const res = await createBlogPageAction(formData);
    redirect(`/admin/pages/${res.id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add new page</h1>

      <form
        action={action}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <div className="grid gap-2">
          <label className="text-sm text-white/70">Title</label>
          <input
            name="title"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Slug</label>
          <input
            name="slug"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            placeholder="auto from title"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Meta title</label>
          <input
            name="metaTitle"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Meta description</label>
          <textarea
            name="metaDescription"
            className="min-h-22.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
          />
        </div>

        <button className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/15">
          Create page
        </button>
      </form>
    </div>
  );
}
