import axios from 'axios'
 
const api = axios.create({
  baseURL: 'https://gym-backend-production-537f.up.railway.app/api',
  headers: { 'Content-Type': 'application/json' }
})
 
export default api