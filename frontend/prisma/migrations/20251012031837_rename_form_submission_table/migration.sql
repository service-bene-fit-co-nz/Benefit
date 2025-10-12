-- Rename the table 'FormSubmission' to 'ClientNotes' to preserve data.
ALTER TABLE "public"."FormSubmission" RENAME TO "ClientNotes";

-- Optional: Update the Foreign Key Constraint name to reflect the new table name.
-- PostgreSQL will often automatically rename constraints, but it's safer to check or explicitly rename.
-- Assuming the old constraint name was "FormSubmission_clientId_fkey"
ALTER TABLE "public"."ClientNotes" RENAME CONSTRAINT "FormSubmission_clientId_fkey" TO "ClientNotes_clientId_fkey";