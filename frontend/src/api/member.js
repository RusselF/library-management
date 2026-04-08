import api from "./axios";
export const getMembers = (params) => api.get("/members", { params });
export const getMember = (id) => api.get(`/members/${id}`);
export const toggleStatus = (id) => api.patch(`/members/${id}/toggle-status`);