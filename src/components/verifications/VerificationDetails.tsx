import { VerificationDetailsProps } from "@/types";
import { Check, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export const documentTypeLabels = {
  dni: "DNI",
  passport: "Pasaporte",
  driver_license: "Licencia de Conducir",
  other: "Otro",
};


export const statusColors = {
  pending: "text-yellow-700 dark:text-yellow-400",
  approved: "text-green-700 dark:text-green-400",
  rejected: "text-red-700 dark:text-red-400",
};

export function VerificationDetails({
  verification,
  onApprove,
  onReject,
  rejectionReason,
  setRejectionReason,
  actionLoading,
  selectedImage,
  setSelectedImage,
}: VerificationDetailsProps & {
  selectedImage: string | null;
  setSelectedImage: (url: string | null) => void;
}) {
  const fmt = (d: string | number | Date | undefined | null) =>
    d ? new Date(d).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "-";
  return (
    <div className="space-y-8 text-[13px] md:text-sm">
      {/* Información del usuario */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 p-4 md:p-5">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-3">Información del usuario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Nombre</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{verification.user?.firstName} {verification.user?.lastName}</span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span className="font-medium break-all text-gray-900 dark:text-gray-100">{verification.user?.email ?? '-'}</span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Usuario</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{verification.user?.username ?? '-'}</span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Teléfono</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{verification.user?.phone ?? '-'}</span>
          </div>
        </div>
      </section>

      {/* Información del documento */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 p-4 md:p-5">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-3">Información del documento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Tipo</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{documentTypeLabels[verification.documentType]}</span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Número</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{verification.numDocument}</span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Estado</span>
            <span className={`font-medium ${statusColors[verification.status]}`}>
              {verification.status === 'pending' && 'pendiente'}
              {verification.status === 'approved' && 'aceptado'}
              {verification.status === 'rejected' && 'rechazado'}
            </span>
          </div>
          <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
            <span className="text-gray-500 dark:text-gray-400">Enviado</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(verification.submittedAt)}</span>
          </div>
          {verification.approvedAt && (
            <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
              <span className="text-gray-500 dark:text-gray-400">Aprobado</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(verification.approvedAt)}</span>
            </div>
          )}
          {verification.rejectedAt && (
            <div className="grid grid-cols-[7rem,1fr] gap-2 items-center">
              <span className="text-gray-500 dark:text-gray-400">Rechazado</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(verification.rejectedAt)}</span>
            </div>
          )}
        </div>
        {verification.rejectionReason && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <h4 className="text-xs font-semibold text-red-700 mb-1">Razón del rechazo</h4>
            <p className="text-[13px] md:text-sm text-red-800">{verification.rejectionReason}</p>
          </div>
        )}
      </section>

      {/* Documentos */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Documentos adjuntos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verification.media?.map((media, index) => (
            <div key={media.mediaID} className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                className="aspect-video relative w-full group"
                onClick={() => setSelectedImage(media.url)}
                aria-label={`Ver documento ${index + 1}`}
              >
                <Image
                  src={media.url}
                  alt={`Documento ${index + 1}`}
                  fill
                  className="object-contain bg-gray-50 dark:bg-zinc-800 cursor-pointer"
                />
              </button>
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 text-center">Subido: {new Date(media.createdAt).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      {verification.status === 'pending' && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => onApprove(verification.verificationID)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
            </div>
            <div className="grid gap-2">
              <label htmlFor="rejection-reason" className="text-xs text-gray-600 dark:text-gray-400">Razón del rechazo</label>
              <Textarea
                id="rejection-reason"
                placeholder="Escribe la razón del rechazo"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div>
                <Button
                  onClick={() => onReject(verification.verificationID)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}