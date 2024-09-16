import prisma, { type EntryWithTag } from "$lib/prisma.js";
import type { Tag } from "@prisma/client";
import { fail, type Actions } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types.js";
import {
  createEntrySchema,
  createTagSchema,
  deleteEntrySchema,
  updateEntrySchema,
  updateTagSchema,
} from "$lib/schemas.js";
import { lucia } from "$lib/auth.js";

export const load: PageServerLoad = async ({ locals }) => {
  const today = new Date();
  const createEntryFormSeed = {
    description: "",
    month: today.getMonth() + 1,
    day: today.getDate(),
    year: today.getFullYear(),
  };

  const createEntryForm = await superValidate(createEntryFormSeed, zod(createEntrySchema));
  const updateEntryForm = await superValidate(zod(updateEntrySchema));
  const deleteEntryForm = await superValidate(zod(deleteEntrySchema));

  const createTagForm = await superValidate(zod(createTagSchema));
  const updateTagForm = await superValidate(zod(updateTagSchema));

  const entries: EntryWithTag[] = await prisma.entry.findMany({
    where: {
      userId: locals.user?.id,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      tag: true,
    },
  });

  const tags: Tag[] = await prisma.tag.findMany({
    where: {
      userId: locals.user?.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  return {
    entries: entries,
    tags: tags,
    createEntryForm: createEntryForm,
    updateEntryForm: updateEntryForm,
    deleteEntryForm: deleteEntryForm,
    createTagForm: createTagForm,
    updateTagForm: updateTagForm,
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
  createEntry: async ({ request, locals }) => {
    const form = await superValidate(request, zod(createEntrySchema));

    if (!form.valid) return fail(400, { form });

    const utcDate = new Date(Date.UTC(form.data.year, form.data.month - 1, form.data.day));

    if (form.data.tag === "") {
      await prisma.entry.create({
        data: {
          user: {
            connect: {
              id: locals.user?.id,
            },
          },
          description: form.data.description,
          cents: form.data.dollars * 100 + form.data.cents,
          date: utcDate,
        },
      });
    } else {
      await prisma.entry.create({
        data: {
          user: {
            connect: {
              id: locals.user?.id,
            },
          },
          tag: {
            connect: {
              id: form.data.tag,
            },
          },
          description: form.data.description,
          cents: form.data.dollars * 100 + form.data.cents,
          date: utcDate,
        },
      });
    }

    return message(form, "success");
  },
  updateEntry: async ({ request }) => {
    const form = await superValidate(request, zod(updateEntrySchema));

    if (!form.valid) return fail(400, { form });

    const utcDate = new Date(Date.UTC(form.data.year, form.data.month - 1, form.data.day));

    if (form.data.tagId === "") {
      await prisma.entry.update({
        where: {
          id: form.data.id,
        },
        data: {
          description: form.data.description,
          cents: form.data.dollars * 100 + form.data.cents,
          date: utcDate,
          tag: {
            disconnect: true,
          },
        },
      });
    } else {
      await prisma.entry.update({
        where: {
          id: form.data.id,
        },
        data: {
          description: form.data.description,
          cents: form.data.dollars * 100 + form.data.cents,
          date: utcDate,
          tag: {
            connect: {
              id: form.data.tagId,
            },
          },
        },
      });
    }

    return message(form, "success");
  },
  deleteEntry: async ({ request }) => {
    const form = await superValidate(request, zod(deleteEntrySchema));

    if (!form.valid) return fail(400, { form });

    await prisma.entry.delete({
      where: {
        id: form.data.id,
      },
    });

    return message(form, "success");
  },
  createTag: async ({ request, locals }) => {
    const form = await superValidate(request, zod(createTagSchema));

    if (!form.valid) return fail(400, { form });

    await prisma.tag.create({
      data: {
        user: {
          connect: {
            id: locals.user?.id,
          },
        },
        name: form.data.name,
        color: form.data.color,
      },
    });
    return message(form, "success");
  },
  updateTag: async ({ request }) => {
    const form = await superValidate(request, zod(updateTagSchema));

    if (!form.valid) return fail(400, { form });

    await prisma.tag.update({
      where: {
        id: form.data.id,
      },
      data: {
        name: form.data.name,
        color: form.data.color,
      },
    });
  },
};
