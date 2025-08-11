"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const passwordChanges = [
  {
    oldPassword: "old_password_1",
    newPassword: "new_password_1",
    token: "token_1",
    createdAt: "2023-01-01T12:00:00Z",
  },
  {
    oldPassword: "old_password_2",
    newPassword: "new_password_2",
    token: "token_2",
    createdAt: "2023-02-15T15:30:00Z",
  },
  {
    oldPassword: "old_password_3",
    newPassword: "new_password_3",
    token: "token_3",
    createdAt: "2023-03-20T10:00:00Z",
  },
];

export default function PasswordHistoryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Historial de Cambios de Contraseña</CardTitle>
          <CardDescription>
            Esta es una tabla de demostración de los cambios de contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contraseña Antigua</TableHead>
                <TableHead>Contraseña Nueva</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Fecha de Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passwordChanges.map((change, index) => (
                <TableRow key={index}>
                  <TableCell>{change.oldPassword}</TableCell>
                  <TableCell>{change.newPassword}</TableCell>
                  <TableCell>{change.token}</TableCell>
                  <TableCell>
                    {new Date(change.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
