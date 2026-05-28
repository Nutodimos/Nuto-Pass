import { getOrgMetadata, getOrganizationById } from "@/lib/super-admin-actions";
import { notFound } from "next/navigation";
import CustomizeForm from "./CustomizeForm";
import type { InstitutionType, OrgMetadata } from "@/types/organization";

export default async function CustomizePage({
  params,
}: {
  params: { id: string };
}) {
  const [org, metaData] = await Promise.all([
    getOrganizationById(params.id),
    getOrgMetadata(params.id),
  ]);

  if (!org) {
    notFound();
  }

  return (
    <CustomizeForm
      orgId={org.id}
      orgName={org.name}
      initialInstitutionType={(metaData?.institutionType as InstitutionType) || "UNIVERSITY_DEPARTMENT"}
      initialMetadata={(metaData?.metadata as Partial<OrgMetadata>) || null}
    />
  );
}
