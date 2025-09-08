"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import PaginatedCardTable from "@/components/common/PaginatedCardTable";
import type { ColumnConfig } from "@/types";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, Check, X, Search } from "lucide-react";
import { verificationApi } from "@/api/verification/index";
import {
  VerificationItem,
  VerificationStatus,
  DocumentType,
  VerificationListResponse,
  VerificationDetailsProps,
} from "@/types/verification";
import Image from "next/image";
import { apiBaseUrl } from "@/config";

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const documentTypeLabels = {
  dni: "DNI",
  passport: "Pasaporte",
  driver_license: "Licencia de Conducir",
  other: "Otro",
};

// Función para obtener las verificaciones
const fetchVerifications = async (url: string) => {
  // Extraer parámetros de la URL
  const urlObj = new URL(url);
  const params: any = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return verificationApi.getAll(params);
};

function VerificationsPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">(
    "all"
  );
  const [documentTypeFilter, setDocumentTypeFilter] = useState<
    DocumentType | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Construir la URL de la API con filtros
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
    });

    if (searchTerm) params.append("search", searchTerm);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (documentTypeFilter !== "all")
      params.append("documentType", documentTypeFilter);

    return `${apiBaseUrl}/verification?${params.toString()}`;
  }, [currentPage, pageSize, searchTerm, statusFilter, documentTypeFilter]);

  // Usar SWR para obtener los datos
  const { data, error, isLoading, mutate } = useSWR<VerificationListResponse>(
    session?.accessToken ? apiUrl : null,
    fetchVerifications,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const handleApprove = async (verificationId: string) => {
    try {
      setActionLoading(true);
      await verificationApi.approve({
        verificationID: verificationId,
      });
      toast.success("Verificación aprobada exitosamente");
      mutate();
      setSelectedVerification(null);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Error al aprobar la verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Debe proporcionar una razón para el rechazo");
      return;
    }

    try {
      setActionLoading(true);
      await verificationApi.reject({
        verificationID: verificationId,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Verificación rechazada exitosamente");
      mutate();
      setSelectedVerification(null);
      setIsDetailsOpen(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Error al rechazar la verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Configuración de columnas para la tabla
  const columns: ColumnConfig[] = [
    {
      key: "verificationID",
      label: "ID",
      type: "normal",
    },
    {
      key: "user.firstName",
      label: "Usuario",
      type: "normal",
      render: (value: unknown, row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.user
              ? `${row.user.firstName || ""} ${
                  row.user.lastName || ""
                }`.trim() || "N/A"
              : "N/A"}
          </span>
          <span className="text-sm text-gray-500">
            {row.user?.email || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "documentType",
      label: "Tipo de Documento",
      type: "normal",
      render: (value: unknown) =>
        (documentTypeLabels[value as DocumentType] || value) as React.ReactNode,
    },
    {
      key: "status",
      label: "Estado",
      type: "badge",
      render: (value: unknown) => (
        <Badge
          className={`${statusColors[value as VerificationStatus]} border-0`}
        >
          {value === "pending"
            ? "Pendiente"
            : value === "approved"
            ? "Aprobado"
            : "Rechazado"}
        </Badge>
      ),
    },
    {
      key: "submittedAt",
      label: "Fecha de Envío",
      type: "normal",
      render: (value: unknown) =>
        formatDate(value as string) as React.ReactNode,
    },
  ];

  // Datos para la tabla
  const tableData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((verification: VerificationItem) => ({
      verificationID: verification.verificationID,
      documentType: verification.documentType,
      status: verification.status,
      submittedAt: verification.submittedAt,
      user: {
        firstName: verification.user?.firstName,
        lastName: verification.user?.lastName,
        email: verification.user?.email,
      },
      media: verification.media,
    })) as Record<string, unknown>[];
  }, [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  // Filtros personalizados
  const customFilters = (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as VerificationStatus | "all")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={documentTypeFilter}
          onValueChange={(value) =>
            setDocumentTypeFilter(value as DocumentType | "all")
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="dni">DNI</SelectItem>
            <SelectItem value="passport">Pasaporte</SelectItem>
            <SelectItem value="driver_license">Licencia de Conducir</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6">
        <ManagerHeader
          title="Verificaciones"
          description="Gestiona las verificaciones de documentos de los usuarios"
          totalCount={totalItems}
          showTotalCount={true}
        />

        {customFilters}

        <PaginatedCardTable
          columns={columns}
          rows={tableData}
          isLoading={isLoading}
          emptyText="No hay verificaciones disponibles"
          actionsHeader="Acciones"
          renderActions={(row) => {
            const verification = data?.data?.find(
              (v: VerificationItem) => v.verificationID === row.verificationID
            );
            return (
              <button
                onClick={() =>
                  verification && setSelectedVerification(verification)
                }
                className="text-blue-600 hover:text-blue-800"
              >
                Ver detalles
              </button>
            );
          }}
          pagination={{
            currentPage: currentPage,
            totalPages,
            totalItems,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: setPageSize,
          }}
        />

        {/* Modal de detalles */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Verificación</DialogTitle>
            </DialogHeader>
            {selectedVerification && (
              <VerificationDetails
                verification={selectedVerification}
                onApprove={handleApprove}
                onReject={handleReject}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                actionLoading={actionLoading}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de imagen ampliada */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Imagen del Documento</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="flex justify-center">
                <Image
                  src={selectedImage}
                  alt="Documento ampliado"
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function VerificationDetails({
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Información del usuario */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Información del Usuario</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Nombre:
            </span>
            <p className="font-medium">
              {verification.user?.username || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Email:
            </span>
            <p className="font-medium">{verification.user?.email || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Detalles de la verificación */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Detalles de la Verificación</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Tipo de Documento:
            </span>
            <p className="font-medium">
              {documentTypeLabels[verification.documentType] ||
                verification.documentType}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Estado:
            </span>
            <Badge
              className={`${statusColors[verification.status]} border-0 ml-2`}
            >
              {verification.status === "pending"
                ? "Pendiente"
                : verification.status === "approved"
                ? "Aprobado"
                : "Rechazado"}
            </Badge>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Fecha de Creación:
            </span>
            <p className="font-medium">
              {formatDate(verification.submittedAt)}
            </p>
          </div>
          {verification.approvedAt ||
            (verification.submittedAt && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Última Actualización:
                </span>
                <p className="font-medium">
                  {formatDate(
                    verification.approvedAt || verification.submittedAt
                  )}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Documentos adjuntos */}
      {verification.media && verification.media.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Documentos Adjuntos</h3>
          <div className="grid grid-cols-2 gap-4">
            {verification.media.map((doc, index) => (
              <div key={index} className="border rounded-lg p-2">
                <Image
                  src={doc.url}
                  alt={`Documento ${index + 1}`}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(doc.url)}
                />
                <p className="text-sm text-center mt-2">
                  {doc.type || `Documento ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Razón de rechazo si existe */}
      {verification.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">
            Razón de Rechazo
          </h3>
          <p className="text-red-700 dark:text-red-300">
            {verification.rejectionReason}
          </p>
        </div>
      )}

      {/* Acciones */}
      {verification.status === "pending" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Comentarios (opcional para aprobación, requerido para rechazo):
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ingrese comentarios sobre la verificación..."
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => onApprove(verification.verificationID)}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {actionLoading ? "Procesando..." : "Aprobar"}
            </Button>
            <Button
              onClick={() => onReject(verification.verificationID)}
              disabled={actionLoading}
              variant="destructive"
            >
              <X className="h-4 w-4 mr-2" />
              {actionLoading ? "Procesando..." : "Rechazar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerificationsPage() {
  return (
    <SessionProvider>
      <VerificationsPageContent />
    </SessionProvider>
  );
}
