import { isValid, parse } from "date-fns";
import { z } from "zod";

// Add Entry Schema

export const addEntrySchema = z
  .object({
    description: z.string(),
    dollars: z.number().min(0).max(999999),
    cents: z.number().min(0).max(99),
    month: z.number(),
    day: z.number(),
    year: z.number(),
  })
  .refine((schema) => {
    return schema.dollars + schema.cents !== 0;
  }, "Amount must be greater than 0")
  .refine((schema) => {
    const date = parse(schema.year + "-" + schema.month + "-" + schema.day, "yyyy-M-d", new Date());
    return isValid(date);
  }, "Invalid date");

export type AddEntrySchema = typeof addEntrySchema;

// Delete Entry Schema

export const deleteEntryFormSchema = z.object({
  id: z.string(),
});

export type DeleteEntryFormSchema = typeof deleteEntryFormSchema;

// Sign Up Schema

export const signUpSchema = z.object({
  username: z
    .string()
    .min(1, "Username must be at least 3 characters long")
    .max(16, "Username must be 16 characters or less")
    .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores "_"'),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
});

export type SignUpSchema = typeof signUpSchema;

// Sign In Schema

export const signInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type SignInSchema = typeof signInSchema;
