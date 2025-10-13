"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { readProgrammes } from "@/server-actions/programme/actions";
import { fetchClientsForTrainer } from "@/server-actions/trainer/clients/actions";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface FindClientProps {}

export const FindClient = ({}: FindClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("searchTerm") || ""
  );
  const [programmeId, setProgrammeId] = useState<string | undefined>(
    searchParams.get("programmeId") || undefined
  );
  const [selectedClient, setSelectedClient] = useState<string | undefined>(
    searchParams.get("selectedClient") || undefined
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set("searchTerm", searchTerm);
    } else {
      params.delete("searchTerm");
    }
    if (programmeId) {
      params.set("programmeId", programmeId);
    } else {
      params.delete("programmeId");
    }
    if (selectedClient) {
      params.set("selectedClient", selectedClient);
    } else {
      params.delete("selectedClient");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchTerm, programmeId, selectedClient, router, pathname, searchParams]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", searchTerm, programmeId],
    queryFn: () => fetchClientsForTrainer(searchTerm, programmeId),
  });

  const { data: programmes } = useQuery({
    queryKey: ["programmes"],
    queryFn: () => readProgrammes(),
  });

  const programmeOptions = [
    { value: "", label: "All Programmes" },
    ...(programmes && programmes.success ? programmes.data : [])
      .slice() // Create a shallow copy to avoid modifying the original array
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        const endDateA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const endDateB = b.endDate ? new Date(b.endDate).getTime() : 0;
        return endDateA - endDateB;
      })
      .map((p) => {
        const startDate = p.startDate
          ? new Date(p.startDate).toISOString().split("T")[0]
          : "";
        const endDate = p.endDate
          ? new Date(p.endDate).toISOString().split("T")[0]
          : "";
        const dateRange = startDate
          ? `(${startDate}${endDate ? ` to ${endDate}` : ""})`
          : "";
        return { value: p.id, label: `${p.name} ${dateRange}` };
      }),
  ];

  return (
    <Card className="">
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow md:w-1/2">
            <Input
              placeholder="Search for a client by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            {searchTerm && (
              <X
                className="absolute top-2.5 right-2 h-5 w-5 text-muted-foreground cursor-pointer"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
          <div className="md:w-1/2">
            <Combobox
              options={programmeOptions}
              value={programmeId}
              onValueChange={setProgrammeId}
              placeholder="Select programme..."
              searchPlaceholder="Search programmes..."
              noResultsText="No programmes found."
            />
          </div>
        </div>
        <div className="max-h-40 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                clients?.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => setSelectedClient(client.id)}
                    className={selectedClient === client.id ? "bg-accent" : ""}
                  >
                    <TableCell>{client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.phone}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
