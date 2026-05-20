import axiosInstance from './axiosInstance';

export const getMatchChatMessages = (matchId, signal) =>
  axiosInstance.get(`/matches/${matchId}/chat`, { signal });

export const sendMatchChatMessage = (matchId, content) =>
  axiosInstance.post(`/matches/${matchId}/chat`, { content });

export const getSportChatMessages = (sportType, signal) =>
  axiosInstance.get(`/chat/sports/${sportType}`, { signal });

export const sendSportChatMessage = (sportType, content) =>
  axiosInstance.post(`/chat/sports/${sportType}`, { content });
