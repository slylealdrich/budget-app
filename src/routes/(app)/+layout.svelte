<script lang="ts">
  import { enhance } from "$app/forms";
</script>

<div class="min-h-[100dvh] lg:mx-[25%] bg-emerald-950 shadow-[0_0_10px] shadow-black/50">
  <div class="w-full h-12 px-2 grid grid-cols-3 justify-between items-center bg-emerald-900">
    <h1 class="col-start-2 text-center text-3xl font-bold text-emerald-200">savem</h1>
    <div class="flex justify-end">
      <form
        method="post"
        use:enhance
        action="?/signOut"
        class="w-20 h-8 flex justify-center items-center bg-emerald-800 text-emerald-200 rounded-md"
      >
        <button type="submit">Sign Out</button>
      </form>
    </div>
  </div>

  <slot />
</div>
