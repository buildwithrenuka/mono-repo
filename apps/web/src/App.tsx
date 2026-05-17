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
          <hr />
        </div>
      ))}
    </div>
  )
}

export default App