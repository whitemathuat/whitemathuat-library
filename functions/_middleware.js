export async function onRequest(context) {
  const USERNAME = context.env.USERNAME;
  const PASSWORD = context.env.PASSWORD;

  const auth = context.request.headers.get("Authorization");

  if (!auth) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Private Library"',
      },
    });
  }

  const encoded = auth.split(" ")[1];
  const decoded = atob(encoded);

  if (decoded !== `${USERNAME}:${PASSWORD}`) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Private Library"',
      },
    });
  }

  return context.next();
}
