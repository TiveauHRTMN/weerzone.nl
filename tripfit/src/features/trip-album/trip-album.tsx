"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AlbumPhoto = {
  name: string;
  url: string;
};

type StorageListItem = {
  id?: string | null;
  name: string;
};

const BUCKET = "trip-media";

async function fetchAlbumPhotos(folder: string): Promise<
  { photos: AlbumPhoto[]; status: string }
> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return { photos: [], status: "Foto-opslag is nog niet geconfigureerd." };
  }

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) {
    return { photos: [], status: "Het reisalbum kon niet worden geladen." };
  }

  const signed = await Promise.all(
    data
      .filter((item: StorageListItem) => item.name && item.id)
      .map(async (item: StorageListItem) => {
        const path = `${folder}/${item.name}`;
        const { data: signedUrl } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        return signedUrl ? { name: item.name, url: signedUrl.signedUrl } : null;
      }),
  );
  const photos = signed.filter((photo): photo is AlbumPhoto => photo !== null);
  return {
    photos,
    status: photos.length === 0 ? "Nog geen foto’s voor deze reis." : "",
  };
}

export function TripAlbum({ tripId, userId }: { tripId: string; userId: string }) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [status, setStatus] = useState("Foto’s laden…");
  const [busy, setBusy] = useState(false);
  const folder = `${userId}/${tripId}`;

  useEffect(() => {
    let active = true;
    void fetchAlbumPhotos(folder).then((result) => {
      if (!active) return;
      setPhotos(result.photos);
      setStatus(result.status);
    });
    return () => {
      active = false;
    };
  }, [folder]);

  async function refreshPhotos() {
    const result = await fetchAlbumPhotos(folder);
    setPhotos(result.photos);
    setStatus(result.status);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setStatus("Foto’s uploaden…");
    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) continue;
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${extension}`;
      await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
    }
    event.target.value = "";
    await refreshPhotos();
    setBusy(false);
  }

  async function remove(name: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.storage.from(BUCKET).remove([`${folder}/${name}`]);
    if (error) setStatus("De foto kon niet worden verwijderd.");
    await refreshPhotos();
    setBusy(false);
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-muted">
          Privé opgeslagen in je Calor-reis. Maximaal 10 MB per foto.
        </p>
        <label className="primary-button cursor-pointer">
          {busy ? "Bezig…" : "Foto’s toevoegen"}
          <input
            className="sr-only"
            accept="image/*"
            disabled={busy}
            multiple
            type="file"
            onChange={upload}
          />
        </label>
      </div>
      {status && <p className="mt-8 rounded-2xl bg-surface p-6 text-sm text-muted">{status}</p>}
      {photos.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-surface" key={photo.name}>
              {/* Signed Storage URLs are short-lived and not eligible for Next image optimization. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="size-full object-cover" alt="" src={photo.url} />
              <button
                aria-label="Foto verwijderen"
                className="absolute right-2 top-2 rounded-full bg-black/75 px-3 py-2 text-xs font-bold text-white"
                disabled={busy}
                onClick={() => remove(photo.name)}
              >
                Verwijder
              </button>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
