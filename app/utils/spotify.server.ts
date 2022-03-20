import { db } from "~/utils/db.server";
import { redirect } from "remix";
import { getUser, getSpotifyAuth } from "~/utils/session.server";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import type { TrackMap } from "~/types";

export const setSpotifyAuth = async (request: Request) => {
  const user = await getUser(request);
  if (!user) {
    return;
  }
  const { id: userId } = user;
  let url = new URL(request.url);
  const code = url.searchParams.get("code");
  const queryString = new URLSearchParams(
    `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.REDIRECT_URI}`
  );

  let tokenType;
  let accessToken;
  let refreshToken;
  let expiresIn;
  try {
    let error;
    ({
      data: {
        error,
        access_token: accessToken,
        expires_in: expiresIn,
        refresh_token: refreshToken,
        token_type: tokenType,
      },
    } = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: queryString,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${new (Buffer as any).from(
          `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }));
    if (error) {
      console.error(error);
      throw redirect(`/authorize`);
    }
  } catch (err) {
    console.error(err);
    throw redirect(`/authorize`);
  }
  if (!accessToken) {
    return;
  }

  try {
    await db.spotifyAuth.delete({
      where: {
        userId,
      },
    });
  } catch (err) {
    console.error(err);
  }
  await db.spotifyAuth.create({
    data: {
      userId,
      tokenType,
      accessToken,
      refreshToken,
      expiresIn,
    },
  });
};

const getSpotifyClient = async (request: Request) => {
  const user = await getUser(request);

  const spotifyAuth = await getSpotifyAuth(request);

  if (!spotifyAuth) {
    throw redirect(`/authorize`);
  }

  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI,
    });

    await spotifyApi.setAccessToken(spotifyAuth.accessToken);
    await spotifyApi.setRefreshToken(spotifyAuth.refreshToken);
    return { user, spotifyApi };
  } catch (err) {
    console.error(err);
    throw redirect(`/authorize`);
  }
};

export const getPlaylists = async (request: Request) => {
  const { user, spotifyApi } = await getSpotifyClient(request);
  if (!user || !spotifyApi) {
    return [];
  }

  let {
    body: { items: playlists, offset, total },
  } = await spotifyApi.getUserPlaylists("smessina");

  let totalPlaylists: SpotifyApi.PlaylistObjectSimplified[] = [];
  totalPlaylists = [...totalPlaylists, ...playlists];

  const mostRecentPlaylistId = totalPlaylists[0].id;

  const latestPlaylist = await db.playlist.findUnique({
    where: { userId: user.id },
    select: { playlistId: true, updatedAt: true },
  });

  let timeBasedRefetch = false;

  if (latestPlaylist?.updatedAt) {
    const timeStamp = new Date().getTime();
    const yesterdayTimeStamp = timeStamp - 24 * 60 * 60 * 1000;
    const yesterdayDate = new Date(yesterdayTimeStamp);
    timeBasedRefetch = latestPlaylist?.updatedAt < yesterdayDate;
  }
  if (
    !timeBasedRefetch &&
    latestPlaylist &&
    latestPlaylist.playlistId === mostRecentPlaylistId
  ) {
    return [];
  }

  while (total > offset + playlists.length) {
    ({
      body: { items: playlists, offset, total },
    } = await spotifyApi.getUserPlaylists("smessina", {
      offset: offset + playlists.length,
    }));

    totalPlaylists = [...totalPlaylists, ...playlists];
  }

  await db.playlist.upsert({
    where: {
      userId: user.id,
    },
    update: {
      playlistId: mostRecentPlaylistId,
    },
    create: {
      playlistId: mostRecentPlaylistId,
      userId: user.id,
    },
  });
  return totalPlaylists;
};

export const getTracks = async (request: Request) => {
  const { user, spotifyApi } = await getSpotifyClient(request);
  if (!user) {
    return {};
  }

  const userId = user.id;
  const playlists = await getPlaylists(request);
  const trackMap: TrackMap = {};
  let i = 0;

  playlists.map(async (playlist: SpotifyApi.PlaylistObjectSimplified) => {
    i++;
    setTimeout(async () => {
      const playlistTrackResponse = await spotifyApi?.getPlaylistTracks(
        playlist.id
      );
      if (!playlistTrackResponse) {
        return;
      }

      let {
        limit,
        offset,
        total,
        items: trackItems,
      } = playlistTrackResponse.body;

      let totalTrackItems: SpotifyApi.PlaylistTrackObject[] = [];
      totalTrackItems = [...totalTrackItems, ...trackItems];

      while (total > offset + trackItems.length) {
        ({
          body: { items: trackItems, offset, total },
        } = await spotifyApi?.getPlaylistTracks(playlist.id, {
          offset: offset + trackItems.length,
        }));

        totalTrackItems = [...totalTrackItems, ...trackItems];
      }

      totalTrackItems.forEach(async (trackItem) => {
        if (!trackItem || !trackItem.track || !trackItem.track.id) {
          return;
        }
        trackMap[trackItem.track.id] = playlist.id;
        try {
          await db.track.upsert({
            where: {
              key: `${userId}-${trackItem.track.id}-${playlist.id}`,
            },
            update: {
              userId,
              trackId: trackItem.track.id,
              playlistId: playlist.id,
            },
            create: {
              userId,
              key: `${userId}-${trackItem.track.id}-${playlist.id}`,
              trackId: trackItem.track.id,
              playlistId: playlist.id,
            },
          });
        } catch (err) {
          console.error(err);
        }
      });
    }, 500 * i);
  });
  return { trackMap, remainingTime: i * 500 };
};

export const searchTrack = async (request: Request, search: string) => {
  const { spotifyApi } = await getSpotifyClient(request);
  try {
    const {
      body: { tracks },
    } = (await spotifyApi?.searchTracks(search)) || { body: { tracks: null } };
    return tracks?.items;
  } catch (err) {
    console.error(err);
    throw redirect(`/authorize`);
  }
};

export const matchTrack = async (
  request: Request,
  trackId: string,
  redirectTo: string = new URL(request.url).pathname
) => {
  const { user, spotifyApi } = await getSpotifyClient(request);
  const { id: userId } = user || { id: null };
  if (!userId) {
    return [];
  }

  const trackMatches = await db.track.findMany({
    where: {
      userId,
      trackId,
    },
  });

  try {
    const playlistRequests = trackMatches.map((trackMatch) => {
      const playlist = spotifyApi?.getPlaylist(trackMatch.playlistId);
      return playlist;
    });

    const playlistResponses = await Promise.all(playlistRequests);
    const playlists = playlistResponses.map((data) => data?.body);
    return playlists;
  } catch (err) {
    console.error(err);
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/authorize?${searchParams}`);
  }
};
