"use client";

import MainLayout from "@/components/layouts/MainLayout";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Search } from "lucide-react";
import { verificationApi } from "@/api/verification";
import {
  VerificationItem,
  VerificationStatus,
  DocumentType,
  VerificationListResponse,
} from "@/types/verification";
import {
  VerificationDetails,
  documentTypeLabels,
  statusColors,
} from "@/components/verifications/VerificationDetails";
import CardImage from "@/components/verifications/CardImage";
import { apiBaseUrl } from "@/config";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Construir la URL de la API con filtros
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
    });

    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (documentTypeFilter !== "all")
      params.append("documentType", documentTypeFilter);

    return `${apiBaseUrl}/verification?${params.toString()}`;
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    documentTypeFilter,
  ]);

  // Usar SWR para obtener los datos
  const { data, error, isLoading, mutate } = useSWR<VerificationListResponse>(
    session?.accessToken ? apiUrl : null,
    fetchVerifications,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const verifications: VerificationItem[] = Array.isArray(data?.data)
    ? data!.data
    : [];
  const pagination = {
    page: data?.page ?? currentPage,
    limit: data?.limit ?? pageSize,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
  };

  const handleSearch = useCallback(() => {
    // Force debounce update immediately and reset to page 1
    setDebouncedSearch(searchTerm.trim());
    setCurrentPage(1);
  }, [searchTerm]);

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

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-2xl font-bold">
                Gestión de Verificaciones
              </CardTitle>
              <span className="text-sm text-gray-500">
                {isLoading ? "Cargando..." : `Total: ${pagination.total}`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                Error al cargar verificaciones
              </div>
            )}
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por usuario, email o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSearch}
                    variant="outline"
                    title="Buscar"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearch("");
                      setStatusFilter("all");
                      setDocumentTypeFilter("all");
                      setCurrentPage(1);
                    }}
                    title="Restablecer filtros"
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as VerificationStatus | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                  <SelectItem value="driver_license">Licencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando verificaciones...
                      </TableCell>
                    </TableRow>
                  ) : verifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No se encontraron verificaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    verifications.map((verification) => (
                      <TableRow key={verification.verificationID}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {verification.user?.firstName}{" "}
                              {verification.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{verification.numDocument}</TableCell>
                        <TableCell>
                          {documentTypeLabels[verification.documentType]}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              statusColors[verification.status]
                            }`}
                          >
                            {verification.status === "pending" && "pendiente"}
                            {verification.status === "approved" && "aceptado"}
                            {verification.status === "rejected" && "rechazado"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(verification.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedVerification(verification)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
                                selectedImage ? "hidden" : ""
                              }`}
                            >
                              <DialogHeader>
                                <DialogTitle>
                                  Detalles de Verificación
                                </DialogTitle>
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  de {pagination.total} verificaciones
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para imagen ampliada */}
        {selectedImage && (
          <CardImage
            selectedImage={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default function VerificationsPage() {
  return <VerificationsPageContent />;
}
