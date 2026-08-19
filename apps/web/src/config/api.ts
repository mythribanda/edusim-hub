/**
 * Central API Configuration for EduSim
 */

export const getApiUrl = (path: string) => 
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:8001'}${path}`;
