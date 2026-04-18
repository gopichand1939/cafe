# cafe-customer
hat screenshot confirms the old frontend build is still running.

It is still connecting to:

wss://cafe-hby1.vercel.app/ws
But it should connect to:

wss://cafe-customer-backend.onrender.com/ws
So the code fix is not live on Vercel yet.

What this means:

local code is fixed
deployed Vercel build is still using the previous bundle
you need to redeploy the customer frontend
Do this in Vercel for the customer frontend project:

Make sure env is set:
VITE_API_BASE_URL=https://cafe-customer-backend.onrender.com/api
VITE_MENU_UPDATES_WS_URL=wss://cafe-customer-backend.onrender.com/ws
Redeploy the project
Hard refresh browser after deploy
Important:

adding env vars in Vercel does nothing until a new deploy happens
Vite reads env at build time, not runtime
After redeploy, check again in browser:

Network -> Socket
request URL must be:
wss://cafe-customer-backend.onrender.com/ws
If it still shows:

wss://cafe-hby1.vercel.app/ws
then the new build is not deployed yet.

So the next exact fix is:

set VITE_MENU_UPDATES_WS_URL explicitly in Vercel
redeploy customer frontend
Use this exact env on Vercel:

VITE_API_BASE_URL=https://cafe-customer-backend.onrender.com/api
VITE_MENU_UPDATES_WS_URL=wss://cafe-customer-backend.onrender.com/ws
If you want, I can also create a small .env.production.example file in the repo so your Vercel values are documented clearly.