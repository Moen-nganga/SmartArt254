import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Chat from "../components/Chat";
import { getUser } from "../auth";
import type { User } from "../auth";

export default function Talk() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUser().then((found) => {
      if (!found) {
        window.location.href = "/signin?next=/talk";
        return;
      }
      setUser(found);
    });
  }, []);

  return (
    <Layout>
      {user ? (
        <Chat user={user} />
      ) : (
        <p className="mx-auto w-full max-w-6xl px-5 py-16 text-xl font-semibold sm:px-10">Loading</p>
      )}
    </Layout>
  );
}