import express from "express"
import { User, ApiResponse } from "@myapp/shared"

const app = express()
app.use(express.json())

app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*")
  next()
})

// Fake data
const users: User[] = [
  { id: 1, name: "Renuk", email: "renuk@gmail.com" },
  { id: 2, name: "Rahul", email: "rahul@gmail.com" }
]

// API route
app.get("/users", (req, res) => {
  const response: ApiResponse<User[]> = {
    data: users,
    success: true,
    message: "Users mil gaye!"
  }
  res.json(response)
})

app.listen(3001, () => {
  console.log("API chal raha hai port 3001 pe 🚀")
})