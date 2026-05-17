// User type - web aur api dono use karenge
export type User = {
  id: number
  name: string
  email: string
}

// API ka common response format
export type ApiResponse<T> = {
  data: T
  success: boolean
  message: string
}