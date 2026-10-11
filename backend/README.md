# AgriSense Backend

Node.js + Express + MongoDB API for the AgriSense irrigation advisory frontend.

## Quick start

```bash
cd backend
npm install
copy .env.example .env      # (Windows)  — or: cp .env.example .env
# edit .env and set MONGO_URI (see "MongoDB on another laptop" below)
npm run seed                # optional: creates demo@agrisense.com / demo1234
npm run dev                 # starts the API on http://localhost:5000
```

Then in a second terminal, from the project root:

```bash
npm install
npm run dev                 # React app on http://localhost:5173
```

Vite forwards every `/api/...` request to `http://localhost:5000`, so no extra
frontend config is needed.

## MongoDB on another laptop

The backend only needs a `MONGO_URI` that it can reach over the network.

### On the laptop that has MongoDB (the "DB laptop")

1. **Let MongoDB accept network connections.** Open
   `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` as Administrator and change:
   ```yaml
   net:
     port: 27017
     bindIp: 0.0.0.0        # was 127.0.0.1
   ```
   Restart the service: open **Services** → *MongoDB Server* → Restart
   (or in an admin terminal: `net stop MongoDB` then `net start MongoDB`).

2. **Open port 27017 in Windows Firewall** (admin PowerShell):
   ```powershell
   New-NetFirewallRule -DisplayName "MongoDB 27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Allow
   ```

3. **Find its IP address:** run `ipconfig` and note the *IPv4 Address* of the
   Wi-Fi adapter, e.g. `192.168.1.20`.

4. **(Recommended) Add a password** so others on the Wi-Fi can't read the DB.
   In `mongosh`:
   ```js
   use admin
   db.createUser({ user: "agrisense", pwd: "choose-a-password", roles: [{ role: "readWrite", db: "agrisense" }] })
   ```
   Then enable auth in `mongod.cfg` and restart again:
   ```yaml
   security:
     authorization: enabled
   ```

### On this laptop (runs the backend)

Both laptops must be on the **same Wi-Fi / network**. Set in `backend/.env`:

```env
# without auth
MONGO_URI=mongodb://192.168.1.20:27017/agrisense
# with auth (step 4)
MONGO_URI=mongodb://agrisense:choose-a-password@192.168.1.20:27017/agrisense?authSource=admin
```

Test the connection: `Test-NetConnection 192.168.1.20 -Port 27017` in PowerShell
should print `TcpTestSucceeded : True`. Then `npm run dev` should print
`MongoDB connected`.

> **Tip:** the IP can change when the DB laptop reconnects to Wi-Fi. If the
> backend suddenly can't connect, re-run `ipconfig` on the DB laptop.
> College Wi-Fi often blocks laptop-to-laptop traffic — use a phone hotspot
> or MongoDB Atlas (free cloud DB) instead.

### Alternative: MongoDB Atlas (no second laptop needed)

Create a free M0 cluster at <https://www.mongodb.com/atlas>, add a database user,
allow your IP under *Network Access*, and paste the `mongodb+srv://...` string into
`MONGO_URI`. Collections are created automatically on first use.

## Hosting

The backend serves the built React app (`../dist`) when it exists, so the whole site
deploys as one service. `render.yaml` in the project root configures Render; the only
value to enter is `MONGO_URI` (a MongoDB Atlas string). On an empty database the demo
account is created automatically (`SEED_DEMO=false` turns this off).
See `SETUP_GUIDE.txt` section 7 for step-by-step instructions.

## API reference

All routes except auth, crops and health need `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Server + database status |
| POST | `/api/auth/register` | `{ name, email, password, location, crop, sowingDate }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update `name`, `location`, `crop`, `sowingDate` |
| GET | `/api/sensors` | Latest sensor reading |
| GET | `/api/sensors/history?hours=24` | Readings for charts (oldest first) |
| POST | `/api/sensors` | Push a reading from an IoT device: `{ soilMoisture, temperature, humidity, rainfall, waterLevel }` |
| POST | `/api/sensors/simulate` | Generate a realistic next reading (demo mode) |
| GET | `/api/advisory` | Irrigation recommendation, reasons, timing, water quantity |
| POST | `/api/irrigation` | Log an irrigation (`{ waterMm? }`, defaults to the advised amount) |
| GET | `/api/irrigation` | Irrigation history |
| GET | `/api/alerts?type=critical&unread=true` | Alerts, newest first |
| GET | `/api/alerts/summary` | Unread counts by type |
| PATCH | `/api/alerts/:id/read` | Mark one alert read |
| PATCH | `/api/alerts/read-all` | Mark all read |
| DELETE | `/api/alerts/:id` | Dismiss an alert |
| GET | `/api/crops` | Supported crops |
| GET | `/api/crops/mine` | User's crop details + current growth stage |
| GET | `/api/crops/:id` | One crop's details |
| GET | `/api/weather` | Live weather + 3-day forecast for the farm location (Open-Meteo, no key needed) |

### How the advisory works

`src/services/advisory.js` combines:

- **Soil moisture vs. crop thresholds** (`src/data/crops.js`): below *critical* → irrigate
  today; below *min* → irrigate within 24h; above *max* → don't irrigate.
- **Rain forecast** from Open-Meteo: if ≥10 mm is expected in 48h, it advises holding off.
- **Temperature**: hot weather makes it more urgent.
- **Drying trend**: a least-squares fit over the last 12h of readings predicts when moisture
  will drop below the ideal band.
- **Water quantity**: `(target moisture − current) × root-zone capacity`, in mm and litres/hectare.
- Irrigation is scheduled for 6 AM / 6 PM to reduce evaporation losses.

New readings are checked against alert rules (`src/services/alertRules.js`), and alerts are
created automatically for low/high moisture, heat, low reservoir level and heavy rain.

### Connecting a real sensor (ESP32 / Arduino)

Log in once to get a token, then have the device `POST /api/sensors` with that token
in the `Authorization` header every few minutes. Example:

```bash
curl -X POST http://<backend-laptop-ip>:5000/api/sensors \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"soilMoisture":42,"temperature":30.5,"humidity":65,"rainfall":0,"waterLevel":70}'
```
