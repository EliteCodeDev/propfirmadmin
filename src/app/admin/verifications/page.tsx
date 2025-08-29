"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, Check, X, Search } from "lucide-react";
import { verificationApi } from "@/api/verification";
import { VerificationItem, VerificationStatus, DocumentType, VerificationListResponse, VerificationDetailsProps } from "@/types/verification";
import Image from "next/image";
import MainLayout from "@/components/layouts/MainLayout";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const documentTypeLabels = {
  dni: "DNI",
  passport: "Pasaporte",
  driver_license: "Licencia de Conducir",
  other: "Otro",
};

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | "all">("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const query = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(documentTypeFilter !== "all" && { documentType: documentTypeFilter }),
      };

      const response: VerificationListResponse = await verificationApi.getAll(query);
      setVerifications(response.data.data);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      console.error("Error loading verifications:", error);
      toast.error("Error al cargar las verificaciones");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, documentTypeFilter]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const handleApprove = async (verificationId: string) => {
    try {
      setActionLoading(true);
      await verificationApi.approve({
        verificationID: verificationId
      });
      toast.success("Verificación aprobada exitosamente");
      loadVerifications();
      setSelectedVerification(null);
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
        rejectionReason: rejectionReason.trim()
      });
      toast.success("Verificación rechazada exitosamente");
      loadVerifications();
      setSelectedVerification(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Error al rechazar la verificación");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadVerifications();
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
            <CardTitle className="text-2xl font-bold">Gestión de Verificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por usuario, email o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VerificationStatus | "all")}>
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
              <Select value={documentTypeFilter} onValueChange={(value) => setDocumentTypeFilter(value as DocumentType | "all")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                  <SelectItem value="license">Licencia</SelectItem>
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
                  {loading ? (
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
                            <div className="font-medium">{verification.user?.firstName} {verification.user?.lastName}</div>
                            <div className="text-sm text-gray-500">{verification.user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{verification.numDocument}</TableCell>
                        <TableCell>{documentTypeLabels[verification.documentType]}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[verification.status]}>
                            {verification.status === "pending" && "Pendiente"}
                            {verification.status === "approved" && "Aprobado"}
                            {verification.status === "rejected" && "Rechazado"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(verification.submittedAt)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVerification(verification)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${selectedImage ? 'hidden' : ''}`}>
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} verificaciones
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-2">
              <DialogHeader>
                <DialogTitle>Documento Ampliado</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-[70vh]">
                <Image
                  src={selectedImage}
                  alt="Documento ampliado"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
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
  return (
    <div className="space-y-6">
      {/* Información del usuario */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Información del Usuario</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Nombre:</strong> {verification.user?.firstName} {verification.user?.lastName}</p>
            <p><strong>Email:</strong> {verification.user?.email}</p>
            <p><strong>Usuario:</strong> {verification.user?.username}</p>
            <p><strong>Teléfono:</strong> {verification.user?.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Información del Documento</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Tipo:</strong> {documentTypeLabels[verification.documentType]}</p>
            <p><strong>Número:</strong> {verification.numDocument}</p>
            <p><strong>Estado:</strong>
              <Badge className={`ml-2 ${statusColors[verification.status]}`}>
                {verification.status === "pending" && "Pendiente"}
                {verification.status === "approved" && "Aprobado"}
                {verification.status === "rejected" && "Rechazado"}
              </Badge>
            </p>
            <p><strong>Enviado:</strong> {new Date(verification.submittedAt).toLocaleString("es-ES")}</p>
            {verification.approvedAt && (
              <p><strong>Aprobado:</strong> {new Date(verification.approvedAt).toLocaleString("es-ES")}</p>
            )}
            {verification.rejectedAt && (
              <p><strong>Rechazado:</strong> {new Date(verification.rejectedAt).toLocaleString("es-ES")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Razón de rechazo si existe */}
      {verification.rejectionReason && (
        <div>
          <h3 className="font-semibold mb-2 text-red-600">Razón del Rechazo</h3>
          <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
            {verification.rejectionReason}
          </p>
        </div>
      )}

      {/* Documentos */}
      <div>
        <h3 className="font-semibold mb-2">Documentos Adjuntos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verification.media?.map((media, index) => (
            <div key={media.mediaID} className="border rounded-lg p-2">
              <div 
                className="aspect-video relative mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(media.url)}
              >
                <Image
                  src={media.url}
                  alt={`Documento ${index + 1}`}
                  fill
                  className="object-contain rounded"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Subido: {new Date(media.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      {verification.status === "pending" && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Acciones</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => onApprove(verification.verificationID)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Razón del rechazo (requerido)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
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
      )}
    </div>
  );
}