# Building a Full-Stack Monorepo from Scratch — React + Node.js + TypeScript

> One repo. Two apps. Zero copy-paste. This is the monorepo way.

---

## What is a Monorepo?

Imagine you are building a full-stack app. Normally you would have:

- One repo for your React frontend
- Another repo for your Node.js backend
- And somehow you need to share TypeScript types between them 😅

You end up copy-pasting types. You update `User` in one place and forget the other. Bugs happen. Life is sad.

**A monorepo solves this.** Everything lives in one Git repository — your frontend, backend, and shared code. They can all import from each other like they are best friends.

```
my-monorepo/
├── apps/
│   ├── web/       ← React + Vite + Tailwind
│   └── api/       ← Node.js + Express
└── packages/
    └── shared/    ← Common TypeScript types
```

Companies like Google, Meta, Vercel, and Microsoft use monorepos at massive scale. Now you will too.

---

## Tools We Will Use

| Tool | Why |
|------|-----|
| **npm Workspaces** | Lets all packages share `node_modules` and import each other locally |
| **Turborepo** | Smart build runner — builds packages in the right order, caches results |
| **TypeScript** | Type safety across all apps |
| **React + Vite** | Fast frontend development |
| **Express** | Simple Node.js backend |

---

## Step 1 — Root Setup

First, create the folder structure:

```bash
mkdir my-monorepo
cd my-monorepo
mkdir apps
mkdir packages
```

Now create `package.json` in the root — this is the heart of the monorepo:

```json
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

The `"workspaces"` key is the magic. It tells npm — *"every folder inside `apps/` and `packages/` is part of this project"*. They can share `node_modules` and reference each other by name.

`"private": true` makes sure you never accidentally publish the root to npm.

---

Now create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

The line `"dependsOn": ["^build"]` is important. The `^` means *upstream packages*. So if `web` depends on `shared`, Turbo builds `shared` first — automatically. No manual ordering needed.

---

Create `tsconfig.base.json` — one TypeScript config that all apps extend:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "declaration": true,
    "sourceMap": true
  }
}
```

Write once, inherit everywhere. If you need to change a TypeScript setting, change it here — done.

Now install everything:

```bash
npm install
```

---

## Step 2 — The Shared Package

This is where the real power of monorepos shows up. Create:

```
packages/shared/
├── package.json
└── src/
    └── index.ts
```

`packages/shared/package.json`:

```json
{
  "name": "@myapp/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

The name `@myapp/shared` is important. Other apps will import from this exact name:

```ts
import { User } from "@myapp/shared"
```

`packages/shared/src/index.ts`:

```ts
// User type — web and api both use this
export type User = {
  id: number
  name: string
  email: string
}

// Standard API response wrapper
export type ApiResponse<T> = {
  data: T
  success: boolean
  message: string
}

// Login types
export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  success: boolean
  message: string
  token?: string
}
```

Define once. Use everywhere. No copy-paste. No drift. This is the monorepo superpower. ⚡

---

## Step 3 — The API (Node.js + Express)

```
apps/api/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

`apps/api/package.json`:

```json
{
  "name": "@myapp/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.0",
    "@myapp/shared": "*"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.4.0"
  }
}
```

Notice `"@myapp/shared": "*"` — this tells npm to use the local shared package. No publishing, no versioning headaches.

`apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

`apps/api/src/index.ts`:

```ts
import express from "express"
import { User, ApiResponse, LoginRequest, LoginResponse } from "@myapp/shared"

const app = express()
app.use(express.json())

// CORS fix
app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  next()
})

// Fake users data
const users: User[] = [
  { id: 1, name: "Renuk", email: "renuk@gmail.com" },
  { id: 2, name: "Rahul", email: "rahul@gmail.com" }
]

// Get all users
app.get("/users", (req, res) => {
  const response: ApiResponse<User[]> = {
    data: users,
    success: true,
    message: "Users fetched!"
  }
  res.json(response)
})

// Login route
app.post("/login", (req, res) => {
  const { email, password }: LoginRequest = req.body

  if (email === "renuk@gmail.com" && password === "1234") {
    const response: LoginResponse = {
      success: true,
      message: "Login successful!",
      token: "fake-jwt-token-123"
    }
    res.json(response)
  } else {
    const response: LoginResponse = {
      success: false,
      message: "Wrong email or password"
    }
    res.status(401).json(response)
  }
})

app.listen(3001, () => {
  console.log("API running on http://localhost:3001 🚀")
})
```

Run it:

```bash
cd apps/api
npx ts-node src/index.ts
```

Visit `http://localhost:3001/users` — you will see your data. ✅

---

## Step 4 — The Frontend (React + Vite + Tailwind)

```
apps/web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    └── App.tsx
```

`apps/web/package.json`:

```json
{
  "name": "@myapp/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@myapp/shared": "*"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0"
  }
}
```

`apps/web/src/App.tsx`:

```tsx
import { useState, useEffect } from "react"
import { User, ApiResponse } from "@myapp/shared"

function App() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetch("http://localhost:3001/users")
      .then(res => res.json())
      .then((res: ApiResponse<User[]>) => {
        setUsers(res.data)
      })
  }, [])

  return (
    <div>
      <h1>Users List</h1>
      {users.map(user => (
        <div key={user.id}>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      ))}
    </div>
  )
}

export default App
```

Run it:

```bash
cd apps/web
npx vite
```

Visit `http://localhost:5173` — your React app fetches from the API. ✅

---

## The Big Picture — What We Achieved

```
@myapp/shared   defines →   User, ApiResponse, LoginRequest, LoginResponse
      ↓                              ↓
@myapp/api      imports ←───────────┘
@myapp/web      imports ←───────────┘
```

Both apps use the **same types**. Change `User` in shared — TypeScript immediately tells you everywhere it breaks. No surprises in production.

---

## Why This Matters

**Without monorepo:**
- 3 separate repos
- Copy-paste types everywhere
- Out-of-sync code between frontend and backend
- Painful to run both apps together

**With monorepo:**
- 1 repo, everything together
- Types defined once, shared everywhere
- `npm run dev` starts everything
- Turborepo caches builds — blazing fast ⚡

---

## Key Concepts Recap

| Concept | What it does |
|---------|-------------|
| `"workspaces"` in root `package.json` | Tells npm all apps are one project |
| `@myapp/shared` | Local package imported like an npm package |
| `"extends"` in tsconfig | Inherit base TypeScript settings |
| `"dependsOn": ["^build"]` in turbo.json | Build dependencies in correct order |
| `"@myapp/shared": "*"` in dependencies | Use local package, not from npm |

---

## What is Next?

Now that your monorepo is set up, you can:

- Add **authentication** with JWT tokens
- Add a **database** (PostgreSQL or MongoDB)
- Add **more apps** — admin panel, mobile app, etc.
- Deploy with **Docker** — one container per app
- Add **CI/CD** with GitHub Actions

The foundation is solid. Build on top of it! 🚀

---

## Final Project Structure

```
my-monorepo/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── main.tsx
│       │   └── App.tsx
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   └── shared/
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── package.json
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

---

*Built step by step, with patience and curiosity. That is the best way to learn anything.* 🙌

---