"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: rawData.customerId,
    amount: rawData.amount,
    status: rawData.status,
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  console.log({ customerId, amount, status, amountInCents, date });

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: rawData.customerId,
    amount: rawData.amount,
    status: rawData.status,
  });

  console.log("updating invoice", { id, customerId, amount, status });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  console.log("deleting invoice", id);
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
