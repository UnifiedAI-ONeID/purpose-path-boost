import { auth } from '../firebase/config';
import { User } from 'firebase/auth';

export const authClient = auth;
export type AppUser = User;
