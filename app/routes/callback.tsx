import type { LoaderFunction } from "remix";
import { redirect } from "remix";
import { setSpotifyAuth } from "~/utils/spotify.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    await setSpotifyAuth(request);
    return redirect(`/search`);
  } catch (err) {
    console.error(err);
    throw redirect("/authorize");
  }
};
export default function Callback() {
  return <h1>Redirecting...</h1>;
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <h1>App Error</h1>;
}
