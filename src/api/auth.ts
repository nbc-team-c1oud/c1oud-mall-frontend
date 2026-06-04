import { api } from "./client";
import type { LoginResponse, UserResponse } from "./types";

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export function signup(body: SignupRequest) {
  return api<void>("/api/v1/auth/signup", { method: "POST", body, auth: false });
}

export function login(body: LoginRequest) {
  return api<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function fetchMe() {
  return api<UserResponse>("/api/v1/auth/me");
}
