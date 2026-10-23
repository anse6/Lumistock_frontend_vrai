// src/jwt-decode.ts
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) {
    console.log(" [jwt-decode] No token provided");
    return true;
  }

  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const isExpired = decodedToken.exp < currentTime;
    console.log(` [jwt-decode] Token expiration check: ${isExpired ? "Expired" : "Valid"} (exp: ${decodedToken.exp}, now: ${currentTime})`);
    return isExpired;
  } catch (error) {
    console.error(" [jwt-decode] Error decoding token:", error);
    return true; // Treat invalid tokens as expired
  }
};