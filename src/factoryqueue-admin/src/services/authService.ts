import api from "../api/axios";

export interface LoginResponse {
  token: string;
  userId: string;
  fullName: string;
  role: string;
}

export const login = async (phone: string, password: string): Promise<LoginResponse> => {
  const response = await api.post("/Auth/login", {
    phone,
    password,
  });

  return response.data;
};

export const registerAdmin = async (fullName: string, phone: string, password: string): Promise<string> => {
  const response = await api.post("/Auth/register/admin", {
    fullName,
    phone,
    password,
  });

  return response.data;
};
