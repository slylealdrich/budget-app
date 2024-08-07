import prisma from "$lib/prisma.js";
import type { Entry } from "@prisma/client";
import { fail, type Actions } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types.js";
import { addEntrySchema, deleteEntryFormSchema } from "$lib/schemas.js";
import { lucia } from "$lib/auth.js";

export const load: PageServerLoad = async ({ locals }) => {
  const today = new Date();
  const addEntryFormSeed = {
    description: "",
    month: today.getMonth() + 1,
    day: today.getDate(),
    year: today.getFullYear(),
  };

  const addEntryForm = await superValidate(addEntryFormSeed, zod(addEntrySchema));
  const deleteEntryForm = await superValidate(zod(deleteEntryFormSchema));

  const entries: Entry[] = await prisma.entry.findMany({
    where: {
      userId: locals.user?.id,
    },
    orderBy: {
      date: "desc",
    },
  });

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const aggregations = await prisma.entry.aggregate({
    _sum: {
      cents: true,
    },
    where: {
      userId: locals.user?.id,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  const monthTotal = aggregations._sum.cents || BigInt(0);

  return {
    addEntryForm: addEntryForm,
    deleteEntryForm: deleteEntryForm,
    entries: entries,
    monthTotal: monthTotal,
  };
};

export const actions: Actions = {
  signOut: async ({ locals, cookies }) => {
    if (!locals.session) return fail(401);

    await lucia.invalidateSession(locals.session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });
  },
  addEntry: async ({ request, locals }) => {
    const form = await superValidate(request, zod(addEntrySchema));

    if (!form.valid) return fail(400, { form });

    await prisma.entry.create({
      data: {
        user: {
          connect: {
            id: locals.user?.id,
          },
        },
        description: form.data.description,
        cents: form.data.dollars * 100 + form.data.cents,
        date: new Date(form.data.year, form.data.month - 1, form.data.day),
      },
    });
    return message(form, "success");
  },
  deleteEntry: async ({ request }) => {
    const form = await superValidate(request, zod(deleteEntryFormSchema));

    if (!form.valid) return fail(400, { form });

    await prisma.entry.delete({
      where: {
        id: form.data.id,
      },
    });

    return message(form, "success");
  },
};
