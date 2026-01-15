import axios from 'axios';
import { Tenant } from '@/types/tenant';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Tenant resolution API - does NOT use the main api client
 * because it needs to work before authentication and without interceptors
 */
const tenantApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

/**
 * Resolve an association by subdomain
 * @param subdomain The subdomain to resolve (e.g., "khair" for khair.maarij.sa)
 * @returns Tenant data or throws error
 */
export async function resolveTenant(subdomain: string): Promise<Tenant> {
    const response = await tenantApi.get('/api/resolve', {
        params: { subdomain },
    });
    return response.data;
}

export { tenantApi };
