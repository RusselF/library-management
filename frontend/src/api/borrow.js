import api from "./axios";
export const requestBorrow = (bookId) => api.post(`/borrows/books/${bookId}`);
export const approveBorrow = (id) => api.patch(`/borrows/${id}/approve`);
export const rejectBorrow = (id) => api.patch(`/borrows/${id}/reject`);
export const returnBook = (id) => api.patch(`/borrows/${id}/return`);
export const myHistory = (params) => api.get("/borrows/my-history", { params });
export const allHistory = (params) => api.get("/borrows", { params });
export const getPending = () => api.get("/borrows/pending");