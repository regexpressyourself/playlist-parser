import { Disc, User, Music } from "react-feather";

type Props = {
  track: SpotifyApi.SingleTrackResponse;
  playlists: PlaylistMap;
};
type PlaylistMap = { [songId: string]: SpotifyApi.SinglePlaylistResponse[] };

export default function TrackRow({ track, playlists }: Props) {
  return !playlists[track.id] ? null : (
    <tr>
      <td>
        <a target="_blank" href={track.album?.external_urls?.spotify}>
          {track?.album?.images ? (
            <img
              src={track?.album?.images[0].url}
              alt={`${track.album?.name} album cover`}
              className="album-image"
            />
          ) : null}
        </a>
        <div>
          <span className="search-result__name">
            <a target="_blank" href={track.external_urls?.spotify}>
              <Music /> {track.name}
            </a>
          </span>
          <br />
          {track.artists.map(
            (artist: SpotifyApi.ArtistObjectSimplified, i: number) => (
              <a
                target="_blank"
                key={artist.id}
                href={artist.external_urls?.spotify}
              >
                <strong>
                  <User />{" "}
                  {i === track.artists.length - 1
                    ? artist.name
                    : `${artist.name}, `}
                </strong>
              </a>
            )
          )}
          <br />
          <em>
            <a target="_blank" href={track.album?.external_urls?.spotify}>
              <Disc /> {track?.album?.name}
            </a>
          </em>
        </div>
      </td>
      <td>
        <ul>
          {playlists[track.id]?.map((playlist) => {
            return (
              <li key={playlist.id} className="playlist-item">
                <a target="_blank" href={playlist.external_urls?.spotify}>
                  {playlist?.images ? (
                    <img
                      src={playlist?.images[0].url}
                      alt={`${playlist.name} album cover`}
                    />
                  ) : null}{" "}
                  {playlist.name}
                </a>
              </li>
            );
          })}
        </ul>
      </td>
    </tr>
  );
}
