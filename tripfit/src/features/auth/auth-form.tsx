"use client";

import { useActionState } from "react";

import { signInWithGoogle, signInWithMagicLink, type AuthActionState } from "@/app/auth/actions";

export function AuthForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(signInWithMagicLink, undefined);

  return (
    <div className="mt-8">
      <form action={action} className="space-y-4">
        <label className="block text-sm font-bold" htmlFor="email">
          E-mailadres
          <input className="input mt-2 w-full" id="email" name="email" type="email" autoComplete="email" required />
        </label>
        {state?.error ? <p className="text-sm text-[#9a3e32]" role="alert">{state.error}</p> : null}
        {state?.message ? <p className="text-sm text-ink" role="status">{state.message}</p> : null}
        <button className="primary-button w-full" disabled={pending} type="submit">
          {pending ? "Link versturen…" : "Stuur veilige inloglink"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />of<span className="h-px flex-1 bg-line" /></div>
      <form action={signInWithGoogle}>
        <button className="secondary-button w-full" type="submit">Doorgaan met Google</button>
      </form>
    </div>
  );
}

