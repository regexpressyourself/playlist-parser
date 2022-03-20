import type { LinksFunction, MetaFunction } from "remix";
import { Link } from "remix";

import stylesUrl from "~/styles/index.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
  title: "Playlist Parser",
  description: "Search your playlists for a song",
});

export default function Index() {
  return (
    <div className="container">
      <div className="content">
        <h1>
          Playlist <span>Parser!</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to="login">
                <button className="button">Login</button>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
