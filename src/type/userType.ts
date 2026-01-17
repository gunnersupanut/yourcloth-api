// Req Body
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

export interface resendEmailRequestBody {
    email: string;
}

export interface forgotPasswordRequestBody {
    email: string
}
export interface CreateUserParams {
    username: string;
    password_hash: string;
    email: string;
    verification_token: string;
    verification_expires_at: Date;
}

export interface updateTokenParams {
    email: string;
    verification_token: string;
    verification_expires_at: Date;
}

export interface createResetPasswordTokenParams {
    email: string;
    reset_password_token: string;
    reset_password_expires_at: Date;
}

export interface resetPasswordReq {
    token: string,
    password: string
}