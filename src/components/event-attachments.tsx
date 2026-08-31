import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileImage, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "event-attachments";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);

type EventAttachment = {
  path: string;
  displayName: string;
  createdAt: string | null;
  size: number;
  mimeType: string;
  signedUrl: string | null;
};

function displayNameFromStoredName(name: string) {
  const separatorIndex = name.indexOf("__");
  return separatorIndex >= 0 ? name.slice(separatorIndex + 2) : name;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function fileIsAllowed(file: File) {
  return ACCEPTED_EXTENSIONS.has(extensionOf(file.name));
}

function formatFileSize(bytes: number) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function formatUploadDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function fetchAttachments(eventId: string): Promise<EventAttachment[]> {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(eventId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;

  const actualFiles = (files ?? []).filter((file) => Boolean(file.id));
  if (actualFiles.length === 0) return [];

  const paths = actualFiles.map((file) => `${eventId}/${file.name}`);
  const { data: signedFiles, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (signedError) throw signedError;

  const signedUrlByPath = new Map(
    (signedFiles ?? []).map((file) => [file.path, file.signedUrl ?? null]),
  );

  return actualFiles.map((file) => {
    const path = `${eventId}/${file.name}`;
    const metadata = file.metadata ?? {};
    return {
      path,
      displayName: displayNameFromStoredName(file.name),
      createdAt: file.created_at ?? null,
      size: typeof metadata.size === "number" ? metadata.size : Number(metadata.size ?? 0),
      mimeType: typeof metadata.mimetype === "string" ? metadata.mimetype : "",
      signedUrl: signedUrlByPath.get(path) ?? null,
    };
  });
}

export function EventAttachments({ eventId }: { eventId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery({
    queryKey: ["event-attachments", eventId],
    queryFn: () => fetchAttachments(eventId),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        if (!fileIsAllowed(file)) {
          throw new Error("unsupported_file");
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error("file_too_large");
        }
      }

      for (const file of files) {
        const safeName = file.name.replace(/[\\/]/g, "-");
        const path = `${eventId}/${crypto.randomUUID()}__${safeName}`;
        const options = {
          cacheControl: "3600",
          upsert: false,
          ...(file.type ? { contentType: file.type } : {}),
        };
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, options);
        if (error) throw error;
      }
    },
    onSuccess: async (_, files) => {
      await queryClient.invalidateQueries({ queryKey: ["event-attachments", eventId] });
      toast.success(files.length > 1 ? "Arquivos anexados" : "Arquivo anexado");
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "unsupported_file") {
        toast.error("Envie arquivos PDF ou imagens PNG, JPG ou WEBP.");
        return;
      }
      if (error instanceof Error && error.message === "file_too_large") {
        toast.error("Cada arquivo pode ter no máximo 15 MB.");
        return;
      }
      toast.error("Não foi possível anexar o arquivo.");
    },
  });

  const remove = useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-attachments", eventId] });
      toast.success("Anexo removido");
    },
    onError: () => toast.error("Não foi possível remover o anexo."),
  });

  const attachments = attachmentsQuery.data ?? [];

  return (
    <section>
      <div className="mb-5 flex items-center justify-between border-b border-foreground/10 pb-4">
        <div>
          <h2 className="font-display text-xl font-medium">Materiais e anexos</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            PDFs e imagens podem ser abertos em outra aba sem precisar baixar antes.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) upload.mutate(files);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {upload.isPending ? "Enviando..." : "Anexar arquivo"}
        </button>
      </div>

      {attachmentsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando anexos...</p>
      ) : attachmentsQuery.isError ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-4 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os anexos.</p>
          <button
            type="button"
            onClick={() => void attachmentsQuery.refetch()}
            className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : attachments.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-md border border-dashed border-border bg-foreground/[0.02] p-5 text-left transition-colors hover:bg-foreground/[0.04]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-muted">
            <Paperclip className="size-4 text-muted-foreground" />
          </span>
          <span>
            <span className="block text-sm font-medium">Nenhum material anexado</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Anexe, por exemplo, a apresentação de cotas ou o material do patrocinador.
            </span>
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const size = formatFileSize(attachment.size);
            const date = formatUploadDate(attachment.createdAt);
            const isImage = attachment.mimeType.startsWith("image/") ||
              ["png", "jpg", "jpeg", "webp"].includes(extensionOf(attachment.displayName));
            const FileIcon = isImage ? FileImage : FileText;

            return (
              <div
                key={attachment.path}
                className="flex items-center gap-3 rounded-lg border border-border bg-canvas p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileIcon className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={attachment.displayName}>
                    {attachment.displayName}
                  </p>
                  {size || date ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[size, date].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {attachment.signedUrl ? (
                    <a
                      href={attachment.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
                    >
                      <Eye className="size-3.5" /> Visualizar
                    </a>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Remover ${attachment.displayName}`}
                    title="Remover anexo"
                    onClick={() => {
                      if (window.confirm(`Remover o anexo “${attachment.displayName}”?`)) {
                        remove.mutate(attachment.path);
                      }
                    }}
                    disabled={remove.isPending}
                    className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
