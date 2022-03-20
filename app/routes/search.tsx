import type {
  LinksFunction,
  LoaderFunction,
  ActionFunction,
  MetaFunction,
} from "remix";
import { useState, useEffect } from "react";
import { redirect, useLoaderData, Form, Outlet, useParams } from "remix";
import { getTracks } from "~/utils/spotify.server";
import stylesUrl from "~/styles/search.css";

type LoaderData = {
  remainingTime: number;
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = ({ params }) => {
  const { searchId } = params;
  return {
    title: `Search ${searchId || "a song"}`,
    description: `Search ${searchId || "a song"}`,
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const { remainingTime } = await getTracks(request);
  return { remainingTime };
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const search = form.get("search") as string;
  if (search && search.length) {
    return redirect(`./search/${search}`);
  } else {
    return {};
  }
};

export default function SearchRoute() {
  const { searchId } = useParams();
  const { remainingTime: realInitialRemainingTime } =
    useLoaderData<LoaderData>();
  const initialRemainingTime =
    realInitialRemainingTime <= 0 ? 0 : realInitialRemainingTime + 1000;
  const [remainingTime, setRemainingTime] = useState(initialRemainingTime);

  const startTimer = () => {
    let nextRemainingTime = initialRemainingTime;
    if (nextRemainingTime < 0) {
      return;
    }
    const interval = 1000;

    const timerInterval = setInterval(function () {
      setRemainingTime(nextRemainingTime);
      nextRemainingTime -= interval;
      if (nextRemainingTime < 0) {
        setRemainingTime(nextRemainingTime);
        clearInterval(timerInterval);
      }
    }, interval);
  };

  useEffect(() => {
    startTimer();
  }, []);
  const percentRemaining = Math.ceil(
    (remainingTime / initialRemainingTime) * 100
  );
  const percentComplete = 100 - percentRemaining;
  return (
    <>
      <div className="search-container">
        <h1>Search a song</h1>
        {remainingTime > 0 ? (
          <>
            <h2>
              Building database. ~{percentComplete > 100 ? 95 : percentComplete}
              % complete
            </h2>
            <div className="progress-bar">
              <div
                className="progress-bar__progress"
                style={{
                  right: `${percentRemaining < 0 ? 5 : percentRemaining}%`,
                }}
              ></div>
            </div>
            <p>Please do not refresh the page.</p>
          </>
        ) : (
          <>
            <Form method="post">
              <input type="hidden" name="_method" value="delete" />
              <input
                autoFocus
                defaultValue={searchId}
                type="text"
                name="search"
              />

              <button type="submit" className="button">
                Search
              </button>
            </Form>
            <Outlet />
          </>
        )}
      </div>
    </>
  );
}
