export interface LoginRequestBody {
    username: string;
    password: string;
    rememberMe: boolean;
}

export interface RegisterRequestBody {
    username: string;
    email: string;
    password: string;
}

export interface CreateUserParams {
    username: string;
    password_hash: string;
    email: string;
    verification_token: string;
    verification_expires_at: Date;
}