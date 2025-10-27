import { api } from "../api/api";

export const getTransactions = () => api.get("/transactions").then(r => r.data);
export const createTransaction = (t) => api.post("/transactions", t).then(r => r.data);
export const getBalance = () => api.get("/balance").then(r => r.data);