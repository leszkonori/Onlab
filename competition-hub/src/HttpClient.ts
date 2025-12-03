import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'http://localhost:8081/api', // vagy ahova kérsz
});

export default httpClient;