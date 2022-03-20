import type { LoaderFunction, MetaFunction } from "remix";
import { useLoaderData, useCatch, useParams } from "remix";
import { searchTrack, matchTrack } from "~/utils/spotify.server";
import TrackRow from "~/components/track-row";

export const meta: MetaFunction = () => {
  return {
    title: "Search a song",
    description: "Search a song",
  };
};

type LoaderData = {
  tracks: SpotifyApi.SingleTrackResponse[];
  playlists: PlaylistMap;
};

type PlaylistMap = { [songId: string]: SpotifyApi.SinglePlaylistResponse[] };

export const loader: LoaderFunction = async ({ request, params }) => {
  const { searchId } = params;
  const tracks = await searchTrack(request, searchId as string);
  const playlists: PlaylistMap = {};

  if (tracks) {
    await Promise.all(
      tracks.map(async (track) => {
        const trackId: string = track.id;
        const playlist = await matchTrack(request, trackId as string);
        if (playlist.length) {
          playlists[trackId] = playlist;
        }
      })
    );
  }

  return { tracks, playlists };
};

export default function SearchRoute() {
  const data = useLoaderData<LoaderData>();
  const { tracks, playlists } = data;
  return (
    <>
      <table className="result-table">
        <thead>
          <tr>
            <th>Song</th>
            <th>Matching Playlist</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} playlists={playlists} />
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.userId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.userId} is not your user.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const { searchId } = useParams();
  return (
    <div className="error-container">{`There was an error loading results for song search "${searchId}". Sorry.`}</div>
  );
}
