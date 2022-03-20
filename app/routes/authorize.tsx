import type { LoaderFunction, LinksFunction, MetaFunction } from "remix";
import { useLoaderData, Link } from "remix";
import stylesUrl from "~/styles/login.css";

export const loader: LoaderFunction = async () => {
  return {
    CLIENT_ID: process.env.CLIENT_ID,
    REDIRECT_URI: process.env.REDIRECT_URI,
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Playlist Parser | Authenticate",
    description: "Authenticate with Spotify",
  };
};

type LoaderData = {
  playlists: SpotifyApi.PlaylistObjectSimplified[];
  CLIENT_ID: string;
  REDIRECT_URI: string;
};

export default function Spotify() {
  const { CLIENT_ID, REDIRECT_URI } = useLoaderData<LoaderData>();

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login to Spotify</h1>

        <a
          href={`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=playlist-read-private`}
        >
          <button className="button">Authenticate</button>
        </a>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="error-container">
      <h1>App Error</h1>
      <pre>{error.message}</pre>
    </div>
  );
}
